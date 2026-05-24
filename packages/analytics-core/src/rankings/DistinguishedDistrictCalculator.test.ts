/**
 * Tests for DistinguishedDistrictCalculator (#332)
 *
 * Validates the four Distinguished District tier computations from
 * Item 1490 (Rev. 04/2025), with prerequisite gating.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DistinguishedDistrictCalculator } from './DistinguishedDistrictCalculator.js'
import type { DistrictRanking } from '@toastmasters/shared-contracts'

function buildRanking(overrides: Partial<DistrictRanking>): DistrictRanking {
  return {
    districtId: '61',
    districtName: 'District 61',
    region: '5',
    paidClubs: 100,
    paidClubBase: 100,
    clubGrowthPercent: 0,
    totalPayments: 1000,
    paymentBase: 1000,
    paymentGrowthPercent: 0,
    activeClubs: 100,
    distinguishedClubs: 0,
    selectDistinguished: 0,
    presidentsDistinguished: 0,
    distinguishedPercent: 0,
    clubsRank: 1,
    paymentsRank: 1,
    distinguishedRank: 1,
    aggregateScore: 0,
    overallRank: 1,
    // All prerequisites met by default
    dspSubmitted: true,
    trainingMet: true,
    marketAnalysisSubmitted: true,
    communicationPlanSubmitted: true,
    regionAdvisorVisitMet: true,
    ...overrides,
  }
}

describe('DistinguishedDistrictCalculator', () => {
  let calculator: DistinguishedDistrictCalculator

  beforeEach(() => {
    calculator = new DistinguishedDistrictCalculator()
  })

  describe('Prerequisite gating', () => {
    it('should return NotDistinguished when any prerequisite is missing', () => {
      // District meeting Smedley criteria but missing Region Advisor Visit
      const ranking = buildRanking({
        paidClubs: 110,
        paidClubBase: 100,
        clubGrowthPercent: 10,
        paymentGrowthPercent: 10,
        distinguishedPercent: 65,
        regionAdvisorVisitMet: false,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('NotDistinguished')
      expect(result.allPrerequisitesMet).toBe(false)
    })

    it('should list which prerequisites are missing', () => {
      const ranking = buildRanking({
        dspSubmitted: false,
        regionAdvisorVisitMet: false,
      })

      const result = calculator.calculate(ranking)

      expect(result.prerequisites.dspSubmitted).toBe(false)
      expect(result.prerequisites.regionAdvisorVisitMet).toBe(false)
      expect(result.prerequisites.trainingMet).toBe(true)
    })
  })

  describe('Distinguished tier (1% growth, 45% Distinguished)', () => {
    it('should award Distinguished when 1%/1%/45% met with no club loss', () => {
      const ranking = buildRanking({
        paidClubs: 101,
        paidClubBase: 100,
        clubGrowthPercent: 1,
        paymentGrowthPercent: 1,
        distinguishedPercent: 45,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('Distinguished')
    })

    it('should NOT award Distinguished when net club loss occurs', () => {
      // 1% payment growth, 1% club growth (positive), 45% distinguished
      // BUT paidClubs < paidClubBase = net loss
      const ranking = buildRanking({
        paidClubs: 99,
        paidClubBase: 100,
        clubGrowthPercent: 1,
        paymentGrowthPercent: 1,
        distinguishedPercent: 45,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('NotDistinguished')
    })

    it('should NOT award Distinguished when % Distinguished is below 45%', () => {
      const ranking = buildRanking({
        paidClubs: 101,
        paidClubBase: 100,
        clubGrowthPercent: 1,
        paymentGrowthPercent: 1,
        distinguishedPercent: 44.9,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('NotDistinguished')
    })
  })

  describe('Select Distinguished tier (3% growth, 50% Distinguished, +1 net club)', () => {
    it('should award Select when 3%/3%/50% met with at least +1 club', () => {
      const ranking = buildRanking({
        paidClubs: 101,
        paidClubBase: 100,
        clubGrowthPercent: 3,
        paymentGrowthPercent: 3,
        distinguishedPercent: 50,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('Select')
    })

    it('should NOT award Select when net club growth is 0 (need +1)', () => {
      const ranking = buildRanking({
        paidClubs: 100,
        paidClubBase: 100,
        clubGrowthPercent: 3,
        paymentGrowthPercent: 3,
        distinguishedPercent: 50,
      })

      const result = calculator.calculate(ranking)

      // Falls through to Distinguished since 1% conditions are also met
      // 100 paidClubs vs 100 base = 0 net change, so Distinguished's
      // "no net loss" requirement IS met
      expect(result.currentTier).toBe('Distinguished')
    })
  })

  describe("President's Distinguished tier (5% growth, 55% Distinguished)", () => {
    it('should award Presidents when 5%/5%/55% met', () => {
      const ranking = buildRanking({
        paidClubs: 105,
        paidClubBase: 100,
        clubGrowthPercent: 5,
        paymentGrowthPercent: 5,
        distinguishedPercent: 55,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('Presidents')
    })
  })

  describe('Smedley Distinguished tier (8% growth, 60% Distinguished, new 2025-2026)', () => {
    it('should award Smedley when 8%/8%/60% met', () => {
      const ranking = buildRanking({
        paidClubs: 108,
        paidClubBase: 100,
        clubGrowthPercent: 8,
        paymentGrowthPercent: 8,
        distinguishedPercent: 60,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('Smedley')
    })
  })

  describe('Gap analysis', () => {
    it('should compute gap to next tier', () => {
      // Currently Distinguished (45% Distinguished, 1% growth)
      // Gap to Select needs: +1 club, +2% payment growth, +5% Distinguished
      const ranking = buildRanking({
        paidClubs: 101,
        paidClubBase: 100,
        clubGrowthPercent: 1,
        paymentGrowthPercent: 1,
        distinguishedPercent: 45,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('Distinguished')
      expect(result.nextTierGap).toBeDefined()
      expect(result.nextTierGap?.tier).toBe('Select')
      // Need 3% payment growth, currently at 1% → gap is 2%
      expect(result.nextTierGap?.paymentGrowthGap).toBeCloseTo(2)
      // Need 50% Distinguished, currently at 45% → gap is 5%
      expect(result.nextTierGap?.distinguishedPercentGap).toBeCloseTo(5)
    })

    it('should return null for nextTierGap when at Smedley (highest tier)', () => {
      const ranking = buildRanking({
        paidClubs: 108,
        paidClubBase: 100,
        clubGrowthPercent: 8,
        paymentGrowthPercent: 8,
        distinguishedPercent: 60,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('Smedley')
      expect(result.nextTierGap).toBeNull()
    })

    it('should show gap to Distinguished when not yet qualifying', () => {
      const ranking = buildRanking({
        paidClubs: 100,
        paidClubBase: 100,
        clubGrowthPercent: 0,
        paymentGrowthPercent: 0,
        distinguishedPercent: 30,
      })

      const result = calculator.calculate(ranking)

      expect(result.currentTier).toBe('NotDistinguished')
      expect(result.nextTierGap?.tier).toBe('Distinguished')
      expect(result.nextTierGap?.distinguishedPercentGap).toBeCloseTo(15) // 45 - 30
    })
  })

  describe('Net club growth — signed actual net change (#684)', () => {
    // F1 (epic #683): the region table conflated `netClubGrowthGap`
    // (distance to the next tier's net-growth rule) with the actual
    // signed net change. A shrinking district (D48: 79 → 71) rendered
    // as +8 because the gap is `max(0, required − netChange)`. The
    // status must expose the signed actual net change separately.
    it('reports a negative netClubGrowth when the district lost clubs (D48: 79 → 71)', () => {
      const ranking = buildRanking({
        districtId: '48',
        paidClubs: 71,
        paidClubBase: 79,
      })

      const result = calculator.calculate(ranking)

      expect(result.netClubGrowth).toBe(-8)
      // The distinguished-gap concept is a distinct number: a
      // NotDistinguished district's gap to the 'no-loss' rule is
      // max(0, 0 − (−8)) = 8. The two must not be confused.
      expect(result.nextTierGap?.netClubGrowthGap).toBe(8)
    })

    it('reports a positive netClubGrowth when the district gained clubs', () => {
      const ranking = buildRanking({ paidClubs: 105, paidClubBase: 100 })

      const result = calculator.calculate(ranking)

      expect(result.netClubGrowth).toBe(5)
    })

    it('reports zero netClubGrowth when paid clubs are unchanged', () => {
      const ranking = buildRanking({ paidClubs: 100, paidClubBase: 100 })

      const result = calculator.calculate(ranking)

      expect(result.netClubGrowth).toBe(0)
    })
  })

  describe('Remaining to minimum Distinguished — absolute counts (#686)', () => {
    // F4 (epic #683): Amy wants the absolute count remaining to the
    // *minimum* (Distinguished) tier, not the percentage-point gap.
    // Each remaining count is derived from the SAME Distinguished-tier
    // thresholds `meetsThreshold` uses, so `remaining === 0` exactly when
    // the tier metric is met (honours lesson 60: distinguished% uses
    // paidClubBase, not activeClubs). Anchors validated against the live
    // v1/rankings.json snapshot (2026-05-24).

    it('computes paymentsRemaining = 277 for D47 (anchor)', () => {
      // paymentBase 6738, totalPayments 6529 → ceil(6738×1.01)=6806 − 6529
      const ranking = buildRanking({
        districtId: '47',
        paymentBase: 6738,
        totalPayments: 6529,
      })

      const result = calculator.calculate(ranking)

      expect(result.paymentsRemaining).toBe(277)
    })

    it('computes paymentsRemaining = 170 for D37 (anchor)', () => {
      // paymentBase 2688, totalPayments 2545 → ceil(2688×1.01)=2715 − 2545
      const ranking = buildRanking({
        districtId: '37',
        paymentBase: 2688,
        totalPayments: 2545,
      })

      const result = calculator.calculate(ranking)

      expect(result.paymentsRemaining).toBe(170)
    })

    it('computes paidClubsRemaining from the +1% club-growth minimum (D47)', () => {
      // paidClubBase 148, paidClubs 138 → ceil(148×1.01)=150 − 138 = 12
      const ranking = buildRanking({
        districtId: '47',
        paidClubBase: 148,
        paidClubs: 138,
      })

      const result = calculator.calculate(ranking)

      expect(result.paidClubsRemaining).toBe(12)
    })

    it('computes distinguishedClubsRemaining against paidClubBase, not activeClubs (D47)', () => {
      // paidClubBase 148, distinguishedClubs 53 → ceil(148×0.45)=67 − 53 = 14
      // (activeClubs 152 would give 16 — lesson 60: wrong denominator)
      const ranking = buildRanking({
        districtId: '47',
        paidClubBase: 148,
        activeClubs: 152,
        distinguishedClubs: 53,
      })

      const result = calculator.calculate(ranking)

      expect(result.distinguishedClubsRemaining).toBe(14)
    })

    it('computes all three remaining counts for D37', () => {
      // paidClubBase 76, paidClubs 70, dist 8
      const ranking = buildRanking({
        districtId: '37',
        paidClubBase: 76,
        paidClubs: 70,
        distinguishedClubs: 8,
        paymentBase: 2688,
        totalPayments: 2545,
      })

      const result = calculator.calculate(ranking)

      expect(result.paidClubsRemaining).toBe(7) // ceil(76×1.01)=77 − 70
      expect(result.distinguishedClubsRemaining).toBe(27) // ceil(76×0.45)=35 − 8
      expect(result.paymentsRemaining).toBe(170)
    })

    it('clamps each remaining count to 0 once the minimum is met', () => {
      // Above all Distinguished minimums: payments +5%, +5 clubs, 50% dist.
      const ranking = buildRanking({
        paidClubBase: 100,
        paidClubs: 105,
        distinguishedClubs: 50,
        paymentBase: 1000,
        totalPayments: 1050,
      })

      const result = calculator.calculate(ranking)

      expect(result.paymentsRemaining).toBe(0)
      expect(result.paidClubsRemaining).toBe(0)
      expect(result.distinguishedClubsRemaining).toBe(0)
    })

    it('remaining === 0 agrees with meetsThreshold for the Distinguished minimum', () => {
      // A district sitting exactly on each minimum: remaining must be 0 and
      // the awarded tier must be at least Distinguished. This couples the
      // new counts to the tier determination (lesson 60/61).
      const ranking = buildRanking({
        paidClubBase: 100,
        paidClubs: 101, // +1% club growth
        clubGrowthPercent: 1,
        paymentBase: 1000,
        totalPayments: 1010, // +1% payment growth
        paymentGrowthPercent: 1,
        distinguishedClubs: 45,
        distinguishedPercent: 45,
      })

      const result = calculator.calculate(ranking)

      expect(result.paymentsRemaining).toBe(0)
      expect(result.paidClubsRemaining).toBe(0)
      expect(result.distinguishedClubsRemaining).toBe(0)
      expect(result.currentTier).not.toBe('NotDistinguished')
    })
  })

  describe('Bulk calculation', () => {
    it('should calculate tiers for multiple districts', () => {
      const rankings: DistrictRanking[] = [
        buildRanking({
          districtId: '1',
          distinguishedPercent: 60,
          paidClubs: 108,
          paidClubBase: 100,
          clubGrowthPercent: 8,
          paymentGrowthPercent: 8,
        }),
        buildRanking({ districtId: '2', distinguishedPercent: 30 }),
      ]

      const results = calculator.calculateAll(rankings)

      expect(results['1']?.currentTier).toBe('Smedley')
      expect(results['2']?.currentTier).toBe('NotDistinguished')
    })
  })
})
