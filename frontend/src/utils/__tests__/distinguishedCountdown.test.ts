import { describe, it, expect } from 'vitest'
import {
  getDistinguishedCountdown,
  deriveRemainingToMinimum,
  type DistinguishedCountdown,
  type RemainingInputs,
} from '../distinguishedCountdown'
import type {
  CompetitiveAwardStandings,
  DistinguishedDistrictStatus,
} from '../../services/cdn'

/* Unit tests for the per-district countdown helper used by the Region
   page. As of #688 (epic #683 F4) the three numeric metrics render the
   ABSOLUTE count remaining to the *minimum* Distinguished tier — paid
   clubs / payments / distinguished clubs — not the percentage-point gap
   they used to show. Two officer-award booleans are unchanged.

   Data source (lesson 103 — derive the countdown from the same gate):
   - prefer the canonical `*Remaining` fields (#686, post-pipeline);
   - else derive from the rankings row's base + current counts with the
     SAME formula the analytics calculator uses. Deriving from the raw
     integer counts (not TI's pre-rounded growth %) makes the derived
     value match the canonical analytics field EXACTLY — verified below
     against real prod districts where a %-based derivation drifts ±1. */

const mkAwards = (
  status: DistinguishedDistrictStatus | undefined,
  educationQualifies: boolean,
  clubGrowthQualifies: boolean
): CompetitiveAwardStandings =>
  ({
    metadata: { snapshotId: 'x', calculatedAt: 'x', totalDistricts: 1 },
    extensionAward: [],
    twentyPlusAward: [],
    retentionAward: [],
    byDistrict: {},
    distinguishedDistrict: status ? { [status.districtId]: status } : {},
    officerAwards: {
      educationTraining: [
        {
          districtId: '61',
          districtName: 'District 61',
          region: '2',
          qualifies: educationQualifies,
        },
      ],
      clubGrowth: [
        {
          districtId: '61',
          districtName: 'District 61',
          region: '2',
          qualifies: clubGrowthQualifies,
        },
      ],
    },
  }) as CompetitiveAwardStandings

const ddStatus = (
  overrides: Partial<DistinguishedDistrictStatus> = {}
): DistinguishedDistrictStatus => ({
  districtId: '61',
  currentTier: 'NotDistinguished',
  allPrerequisitesMet: false,
  prerequisites: {
    dspSubmitted: false,
    trainingMet: false,
    marketAnalysisSubmitted: false,
    communicationPlanSubmitted: false,
    regionAdvisorVisitMet: false,
  },
  nextTierGap: null,
  ...overrides,
})

// Real prod (2026-05-23) rankings rows. The canonical analytics
// `*Remaining` values are clubs/payments/dist = (12,277,14) for D47 etc.
const D47: RemainingInputs = {
  paidClubBase: 148,
  paidClubs: 138,
  paymentBase: 6738,
  totalPayments: 6529,
  distinguishedClubs: 53,
}

describe('deriveRemainingToMinimum — matches the canonical analytics field (#688 #686)', () => {
  it('reproduces the canonical counts exactly for real prod districts where %-based derivation drifts', () => {
    // D47, D21, D33, D64: canonical payments = 277 / 1032 / 516 / 264.
    // A gap-%-based derivation gives 277 / 1031 / 515 / 265 (±1). The
    // count-based derivation below matches the canonical field exactly.
    expect(deriveRemainingToMinimum(D47)).toEqual({
      paidClubsRemaining: 12,
      paymentsRemaining: 277,
      distinguishedClubsRemaining: 14,
    })
    expect(
      deriveRemainingToMinimum({
        paidClubBase: 191,
        paidClubs: 163,
        paymentBase: 7125,
        totalPayments: 6165,
        distinguishedClubs: 52,
      }).paymentsRemaining
    ).toBe(1032)
    expect(
      deriveRemainingToMinimum({
        paidClubBase: 126,
        paidClubs: 99,
        paymentBase: 3705,
        totalPayments: 3227,
        distinguishedClubs: 16,
      }).paymentsRemaining
    ).toBe(516)
  })

  it('clamps to 0 when a metric minimum is already met or exceeded', () => {
    expect(
      deriveRemainingToMinimum({
        paidClubBase: 100,
        paidClubs: 120,
        paymentBase: 5000,
        totalPayments: 6000,
        distinguishedClubs: 60,
      })
    ).toEqual({
      paidClubsRemaining: 0,
      paymentsRemaining: 0,
      distinguishedClubsRemaining: 0,
    })
  })
})

describe('getDistinguishedCountdown — absolute remaining counts (#688 #683)', () => {
  it('prefers the canonical *Remaining fields when present (post-pipeline)', () => {
    const awards = mkAwards(
      ddStatus({
        paidClubsRemaining: 12,
        paymentsRemaining: 277,
        distinguishedClubsRemaining: 31,
      }),
      false,
      true
    )
    const c = getDistinguishedCountdown('61', awards)
    expect(c).not.toBeNull()
    expect(c!.paidClubsRemaining).toEqual({ kind: 'count', value: 12 })
    expect(c!.paymentsRemaining).toEqual({ kind: 'count', value: 277 })
    expect(c!.distinguishedClubsRemaining).toEqual({ kind: 'count', value: 31 })
    expect(c!.educationTraining).toEqual({ kind: 'boolean', met: false })
    expect(c!.clubGrowth).toEqual({ kind: 'boolean', met: true })
  })

  it('renders ✓ (met) when a canonical remaining field is 0', () => {
    const awards = mkAwards(
      ddStatus({
        paidClubsRemaining: 0,
        paymentsRemaining: 0,
        distinguishedClubsRemaining: 5,
      }),
      false,
      false
    )
    const c = getDistinguishedCountdown('61', awards)
    expect(c!.paidClubsRemaining).toEqual({ kind: 'met' })
    expect(c!.paymentsRemaining).toEqual({ kind: 'met' })
    expect(c!.distinguishedClubsRemaining).toEqual({ kind: 'count', value: 5 })
  })

  it('derives counts from the rankings row when canonical fields are absent (pre-pipeline) — D47 payments = 277', () => {
    const awards = mkAwards(ddStatus({ districtId: '47' }), false, false)
    const c = getDistinguishedCountdown('47', awards, D47)
    expect(c!.paymentsRemaining).toEqual({ kind: 'count', value: 277 })
    expect(c!.paidClubsRemaining).toEqual({ kind: 'count', value: 12 })
    expect(c!.distinguishedClubsRemaining).toEqual({ kind: 'count', value: 14 })
  })

  it('canonical field wins over the rankings-derived fallback when both are present', () => {
    const awards = mkAwards(
      ddStatus({ districtId: '47', paymentsRemaining: 300 }),
      false,
      false
    )
    const c = getDistinguishedCountdown('47', awards, D47)
    // 300 (canonical) not 277 (derived).
    expect(c!.paymentsRemaining).toEqual({ kind: 'count', value: 300 })
  })

  it('derives met for a district already at or above the minimum (no canonical field)', () => {
    const awards = mkAwards(ddStatus({ currentTier: 'Select' }), true, true)
    const c = getDistinguishedCountdown('61', awards, {
      paidClubBase: 100,
      paidClubs: 130,
      paymentBase: 5000,
      totalPayments: 6500,
      distinguishedClubs: 70,
    })
    expect(c!.paidClubsRemaining).toEqual({ kind: 'met' })
    expect(c!.paymentsRemaining).toEqual({ kind: 'met' })
    expect(c!.distinguishedClubsRemaining).toEqual({ kind: 'met' })
  })

  it('returns null cells when there is neither a canonical field nor a rankings row', () => {
    const awards = mkAwards(ddStatus(), false, false)
    const c = getDistinguishedCountdown('61', awards)
    expect(c!.paidClubsRemaining).toBeNull()
    expect(c!.paymentsRemaining).toBeNull()
    expect(c!.distinguishedClubsRemaining).toBeNull()
  })

  it('returns null when the district has no Distinguished District status entry', () => {
    const awards = mkAwards(undefined, false, false)
    expect(getDistinguishedCountdown('61', awards, D47)).toBeNull()
  })

  it('returns null when awards is null (legacy snapshot)', () => {
    const c: DistinguishedCountdown | null = getDistinguishedCountdown(
      '61',
      null,
      D47
    )
    expect(c).toBeNull()
  })

  it('officer-award booleans default to {met: false} when the district is missing from the lists', () => {
    const awards: CompetitiveAwardStandings = {
      ...mkAwards(ddStatus(), false, false),
      officerAwards: { educationTraining: [], clubGrowth: [] },
    }
    const c = getDistinguishedCountdown('61', awards)
    expect(c!.educationTraining).toEqual({ kind: 'boolean', met: false })
    expect(c!.clubGrowth).toEqual({ kind: 'boolean', met: false })
  })
})
