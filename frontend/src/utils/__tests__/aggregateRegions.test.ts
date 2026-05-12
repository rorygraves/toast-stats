import { describe, it, expect } from 'vitest'
import { aggregateRegions } from '../aggregateRegions'
import type { DistrictRanking } from '@toastmasters/shared-contracts'

/* Sprint A test suite (#493). Red-first per Lesson 54: this file is
   committed BEFORE the implementation. Tests fail until the utility
   ships. */

const baseRanking: DistrictRanking = {
  districtId: '01',
  districtName: 'District 01',
  region: '01',
  paidClubs: 100,
  paidClubBase: 90,
  clubGrowthPercent: 11.1,
  totalPayments: 5000,
  paymentBase: 4500,
  paymentGrowthPercent: 11.1,
  activeClubs: 100,
  distinguishedClubs: 50,
  selectDistinguished: 20,
  presidentsDistinguished: 10,
  distinguishedPercent: 50,
  clubsRank: 1,
  paymentsRank: 1,
  distinguishedRank: 1,
  overallRank: 1,
  aggregateScore: 300,
  // requirement flags
  dspSubmitted: true,
  trainingMet: true,
  marketAnalysisSubmitted: true,
  communicationPlanSubmitted: true,
  regionAdvisorVisitMet: true,
  // sub-fields that may or may not be referenced
  smedleyDistinguished: 4,
  clubsWith20PlusMembers: 22,
  newCharteredClubs: 5,
  newPayments: 656,
  aprilPayments: 1039,
  octoberPayments: 1009,
  latePayments: 3,
  charterPayments: 101,
} as DistrictRanking

const mk = (overrides: Partial<DistrictRanking>): DistrictRanking =>
  ({ ...baseRanking, ...overrides }) as DistrictRanking

describe('aggregateRegions (#493)', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateRegions([])).toEqual([])
  })

  it('groups districts by region', () => {
    const rollups = aggregateRegions([
      mk({ districtId: '01', region: '01' }),
      mk({ districtId: '02', region: '01' }),
      mk({ districtId: '57', region: '07' }),
    ])
    expect(rollups).toHaveLength(2)
    expect(rollups[0]?.region).toBe('01')
    expect(rollups[0]?.districtCount).toBe(2)
    expect(rollups[1]?.region).toBe('07')
    expect(rollups[1]?.districtCount).toBe(1)
  })

  it('sorts output by region number ascending', () => {
    const rollups = aggregateRegions([
      mk({ districtId: 'X', region: '14' }),
      mk({ districtId: 'Y', region: '01' }),
      mk({ districtId: 'Z', region: '07' }),
    ])
    expect(rollups.map(r => r.region)).toEqual(['01', '07', '14'])
  })

  it('excludes DNAR (district-not-assigned-region)', () => {
    const rollups = aggregateRegions([
      mk({ districtId: 'A', region: '01' }),
      mk({ districtId: 'B', region: 'DNAR' }),
    ])
    expect(rollups.map(r => r.region)).toEqual(['01'])
  })

  it('excludes non-numeric regions other than DNAR (defensive)', () => {
    const rollups = aggregateRegions([
      mk({ districtId: 'A', region: '01' }),
      mk({ districtId: 'B', region: '' }),
      mk({ districtId: 'C', region: 'UNKNOWN' }),
    ])
    expect(rollups.map(r => r.region)).toEqual(['01'])
  })

  it('sums paidClubs, paidClubBase, totalPayments, paymentBase, distinguishedClubs', () => {
    const rollups = aggregateRegions([
      mk({
        region: '01',
        paidClubs: 100,
        paidClubBase: 90,
        totalPayments: 5000,
        paymentBase: 4500,
        distinguishedClubs: 50,
      }),
      mk({
        region: '01',
        paidClubs: 50,
        paidClubBase: 48,
        totalPayments: 2500,
        paymentBase: 2400,
        distinguishedClubs: 22,
      }),
    ])
    expect(rollups[0]?.paidClubs).toBe(150)
    expect(rollups[0]?.paidClubBase).toBe(138)
    expect(rollups[0]?.totalPayments).toBe(7500)
    expect(rollups[0]?.paymentBase).toBe(6900)
    expect(rollups[0]?.distinguishedClubs).toBe(72)
  })

  // #501: aggregateScore is now a region-level Borda count of growth-
  // percent ranks across 3 categories, NOT a sum of district scores.
  // With N regions, rank #1 in a category gets N points, #N gets 1.
  it('aggregateScore is a region-level Borda count (3 ranks × N points)', () => {
    // 3 regions with distinct growth-percent profiles in each category.
    // Region A: clubs=top (3pts), payments=mid (2pts), distinguished=top (3pts) → 8
    // Region B: clubs=mid (2pts), payments=top (3pts), distinguished=mid (2pts) → 7
    // Region C: clubs=bot (1pt), payments=bot (1pt), distinguished=bot (1pt) → 3
    const rollups = aggregateRegions([
      // Region 01 — strongest clubs growth (10%), strongest distinguished
      mk({
        region: '01',
        paidClubs: 110,
        paidClubBase: 100,
        totalPayments: 1050,
        paymentBase: 1000,
        distinguishedClubs: 50,
      }),
      // Region 02 — strongest payments growth (10%), mid clubs & dist
      mk({
        region: '02',
        paidClubs: 105,
        paidClubBase: 100,
        totalPayments: 1100,
        paymentBase: 1000,
        distinguishedClubs: 30,
      }),
      // Region 03 — weakest on all three
      mk({
        region: '03',
        paidClubs: 101,
        paidClubBase: 100,
        totalPayments: 1010,
        paymentBase: 1000,
        distinguishedClubs: 20,
      }),
    ])

    const byRegion = Object.fromEntries(rollups.map(r => [r.region, r]))
    // With N=3: rank #1 → 3 points, #2 → 2 points, #3 → 1 point
    expect(byRegion['01']?.aggregateScore).toBe(3 + 2 + 3) // 8
    expect(byRegion['02']?.aggregateScore).toBe(2 + 3 + 2) // 7
    expect(byRegion['03']?.aggregateScore).toBe(1 + 1 + 1) // 3
  })

  it('exposes per-category ranks (clubsRank, paymentsRank, distinguishedRank)', () => {
    const rollups = aggregateRegions([
      mk({
        region: '01',
        paidClubs: 110,
        paidClubBase: 100, // 10% growth — top
        totalPayments: 1050,
        paymentBase: 1000, // 5% growth
        distinguishedClubs: 50,
      }),
      mk({
        region: '02',
        paidClubs: 105,
        paidClubBase: 100, // 5% growth
        totalPayments: 1100,
        paymentBase: 1000, // 10% growth — top
        distinguishedClubs: 30,
      }),
    ])
    const byRegion = Object.fromEntries(rollups.map(r => [r.region, r]))
    expect(byRegion['01']?.clubsRank).toBe(1)
    expect(byRegion['01']?.paymentsRank).toBe(2)
    expect(byRegion['02']?.clubsRank).toBe(2)
    expect(byRegion['02']?.paymentsRank).toBe(1)
  })

  it('single-region input → all ranks = 1, aggregateScore = 3', () => {
    const rollups = aggregateRegions([mk({ region: '01' })])
    expect(rollups[0]?.clubsRank).toBe(1)
    expect(rollups[0]?.paymentsRank).toBe(1)
    expect(rollups[0]?.distinguishedRank).toBe(1)
    expect(rollups[0]?.aggregateScore).toBe(3)
  })

  it('DNAR is excluded from ranking (no rank inflation)', () => {
    const rollups = aggregateRegions([
      mk({ region: '01' }),
      mk({ region: 'DNAR' }), // must not occupy a rank slot
    ])
    // Only one valid region → ranks all 1, aggregateScore = 3
    expect(rollups).toHaveLength(1)
    expect(rollups[0]?.aggregateScore).toBe(3)
  })

  it('derives clubGrowthPercent from sums', () => {
    const rollups = aggregateRegions([
      mk({ region: '01', paidClubs: 100, paidClubBase: 90 }),
      mk({ region: '01', paidClubs: 60, paidClubBase: 50 }),
    ])
    // paidClubs=160, paidClubBase=140 → growth = (160-140)/140 = 14.285…
    expect(rollups[0]?.clubGrowthPercent).toBeCloseTo(14.285, 2)
  })

  it('derives paymentGrowthPercent from sums', () => {
    const rollups = aggregateRegions([
      mk({ region: '01', totalPayments: 5000, paymentBase: 4500 }),
      mk({ region: '01', totalPayments: 2500, paymentBase: 2400 }),
    ])
    // payments=7500, base=6900 → growth = 600/6900 = 8.695…
    expect(rollups[0]?.paymentGrowthPercent).toBeCloseTo(8.695, 2)
  })

  it('derives distinguishedPercent from sums', () => {
    const rollups = aggregateRegions([
      mk({ region: '01', paidClubs: 100, distinguishedClubs: 50 }),
      mk({ region: '01', paidClubs: 50, distinguishedClubs: 22 }),
    ])
    // distinguished=72, paidClubs=150 → 48%
    expect(rollups[0]?.distinguishedPercent).toBeCloseTo(48, 1)
  })

  it('returns 0 (not NaN) when a denominator is zero', () => {
    const rollups = aggregateRegions([
      mk({
        region: '01',
        paidClubs: 0,
        paidClubBase: 0,
        totalPayments: 0,
        paymentBase: 0,
        distinguishedClubs: 0,
      }),
    ])
    expect(rollups[0]?.clubGrowthPercent).toBe(0)
    expect(rollups[0]?.paymentGrowthPercent).toBe(0)
    expect(rollups[0]?.distinguishedPercent).toBe(0)
  })

  it('picks the leading district by aggregateScore', () => {
    const rollups = aggregateRegions([
      mk({
        districtId: '01',
        districtName: 'District 01',
        region: '01',
        aggregateScore: 200,
      }),
      mk({
        districtId: '02',
        districtName: 'District 02',
        region: '01',
        aggregateScore: 400,
      }),
      mk({
        districtId: '03',
        districtName: 'District 03',
        region: '01',
        aggregateScore: 300,
      }),
    ])
    expect(rollups[0]?.leadingDistrictId).toBe('02')
    expect(rollups[0]?.leadingDistrictName).toBe('District 02')
  })

  it('counts requirement met/total per region', () => {
    const rollups = aggregateRegions([
      mk({ region: '01', dspSubmitted: true, trainingMet: true }),
      mk({ region: '01', dspSubmitted: true, trainingMet: false }),
      mk({ region: '01', dspSubmitted: false, trainingMet: true }),
    ])
    expect(rollups[0]?.requirements.dspSubmitted.met).toBe(2)
    expect(rollups[0]?.requirements.dspSubmitted.total).toBe(3)
    expect(rollups[0]?.requirements.trainingMet.met).toBe(2)
    expect(rollups[0]?.requirements.trainingMet.total).toBe(3)
  })

  it('handles missing/undefined requirement fields (counts as not-met)', () => {
    // Older snapshots may lack these fields entirely.
    const r = mk({ region: '01' })
    delete (r as { dspSubmitted?: unknown }).dspSubmitted
    const rollups = aggregateRegions([r])
    expect(rollups[0]?.requirements.dspSubmitted.met).toBe(0)
    expect(rollups[0]?.requirements.dspSubmitted.total).toBe(1)
  })
})
