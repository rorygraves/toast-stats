import { describe, it, expect } from 'vitest'
import type {
  AllDistrictsRankingsData,
  DistrictRanking,
} from '@toastmasters/shared-contracts'
import {
  digestDistrict,
  digestDate,
  diffSnapshots,
  evaluatePromote,
} from '../SnapshotValueDiff.js'

/* Minimal fixtures — only the fields the digest reads. Built from the real
   AllDistrictsRankingsData shape (packages/shared-contracts). */

function district(overrides: Partial<DistrictRanking> = {}): DistrictRanking {
  return {
    districtId: '61',
    districtName: 'District 61',
    region: 'Region 7',
    paidClubs: 100,
    paidClubBase: 98,
    clubGrowthPercent: 2.04,
    totalPayments: 5000,
    paymentBase: 4800,
    paymentGrowthPercent: 4.17,
    activeClubs: 95,
    distinguishedClubs: 30,
    selectDistinguished: 10,
    presidentsDistinguished: 5,
    distinguishedPercent: 30,
    clubsRank: 3,
    paymentsRank: 4,
    distinguishedRank: 2,
    aggregateScore: 88.5,
    overallRank: 3,
    ...overrides,
  }
}

function rankings(
  districts: DistrictRanking[],
  metaOverrides: Partial<AllDistrictsRankingsData['metadata']> = {}
): AllDistrictsRankingsData {
  return {
    metadata: {
      snapshotId: '2024-06-30',
      calculatedAt: '2024-07-01T00:00:00.000Z',
      schemaVersion: '1.0.0',
      calculationVersion: '1.0.0',
      rankingVersion: '1.0.0',
      sourceCsvDate: '2024-06-30',
      csvFetchedAt: '2024-07-01T00:00:00.000Z',
      totalDistricts: districts.length,
      fromCache: false,
      ...metaOverrides,
    },
    rankings: districts,
  }
}

describe('digestDistrict', () => {
  it('produces an identical digest for identical data fields', () => {
    expect(digestDistrict(district())).toBe(digestDistrict(district()))
  })

  it('changes when any data metric changes', () => {
    expect(digestDistrict(district())).not.toBe(
      digestDistrict(district({ totalPayments: 5001 }))
    )
  })
})

describe('digestDate', () => {
  it('ignores volatile metadata (calculatedAt / csvFetchedAt / fromCache)', () => {
    const a = digestDate('2024-06-30', rankings([district()]))
    const b = digestDate(
      '2024-06-30',
      rankings([district()], {
        calculatedAt: '2025-01-01T12:00:00.000Z',
        csvFetchedAt: '2025-01-01T12:00:00.000Z',
        fromCache: true,
      })
    )
    expect(a.combined).toBe(b.combined)
  })

  it('is order-independent across the rankings array', () => {
    const d61 = district({ districtId: '61' })
    const d42 = district({ districtId: '42', aggregateScore: 70 })
    const a = digestDate('2024-06-30', rankings([d61, d42]))
    const b = digestDate('2024-06-30', rankings([d42, d61]))
    expect(a.combined).toBe(b.combined)
  })

  it('changes when a district metric changes', () => {
    const a = digestDate('2024-06-30', rankings([district()]))
    const b = digestDate(
      '2024-06-30',
      rankings([district({ totalPayments: 5001 })])
    )
    expect(a.combined).not.toBe(b.combined)
  })
})

describe('diffSnapshots', () => {
  const base = (date: string, ds: DistrictRanking[]) =>
    digestDate(date, rankings(ds))

  it('classifies added / removed / unchanged dates by date set', () => {
    const staging = [
      base('2024-06-30', [district()]),
      base('2024-07-31', [district()]), // added (staging only)
    ]
    const prod = [
      base('2024-06-30', [district()]),
      base('2024-05-31', [district()]), // removed (prod only)
    ]
    const report = diffSnapshots(staging, prod)
    expect(report.added).toEqual(['2024-07-31'])
    expect(report.removed).toEqual(['2024-05-31'])
    expect(report.unchanged).toEqual(['2024-06-30'])
    expect(report.changed).toEqual([])
    expect(report.overlap).toBe(1)
  })

  it('flags an overlap date whose values changed, naming the district', () => {
    const staging = [base('2024-06-30', [district({ totalPayments: 5001 })])]
    const prod = [base('2024-06-30', [district({ totalPayments: 5000 })])]
    const report = diffSnapshots(staging, prod)
    expect(report.changed).toHaveLength(1)
    expect(report.changed[0].date).toBe('2024-06-30')
    expect(report.changed[0].changedDistricts).toContain('61')
    expect(report.unchanged).toEqual([])
  })
})

describe('evaluatePromote', () => {
  const digest = (date: string, ds: DistrictRanking[]) =>
    digestDate(date, rankings(ds))

  it('promotes a purely additive change', () => {
    const report = diffSnapshots(
      [digest('2024-06-30', [district()]), digest('2024-07-31', [district()])],
      [digest('2024-06-30', [district()])]
    )
    const decision = evaluatePromote(report)
    expect(decision.promote).toBe(true)
    expect(decision.requiresReview).toBe(false)
  })

  it('blocks a subtractive change (date removed from prod)', () => {
    const report = diffSnapshots(
      [digest('2024-06-30', [district()])],
      [digest('2024-06-30', [district()]), digest('2024-05-31', [district()])]
    )
    const decision = evaluatePromote(report)
    expect(decision.promote).toBe(false)
    expect(decision.reasons.join(' ')).toMatch(/subtractive/i)
  })

  it('blocks a value re-derive by default (requires review)', () => {
    const report = diffSnapshots(
      [digest('2024-06-30', [district({ totalPayments: 5001 })])],
      [digest('2024-06-30', [district({ totalPayments: 5000 })])]
    )
    const decision = evaluatePromote(report)
    expect(decision.promote).toBe(false)
    expect(decision.requiresReview).toBe(true)
    expect(decision.reasons.join(' ')).toMatch(/changed/i)
  })

  it('promotes a reviewed value re-derive when allowValueChanges is set', () => {
    const report = diffSnapshots(
      [digest('2024-06-30', [district({ totalPayments: 5001 })])],
      [digest('2024-06-30', [district({ totalPayments: 5000 })])]
    )
    const decision = evaluatePromote(report, { allowValueChanges: true })
    expect(decision.promote).toBe(true)
    expect(decision.requiresReview).toBe(true)
  })

  it('still blocks a subtractive change even with allowValueChanges set', () => {
    const report = diffSnapshots(
      [digest('2024-06-30', [district()])],
      [digest('2024-06-30', [district()]), digest('2024-05-31', [district()])]
    )
    const decision = evaluatePromote(report, { allowValueChanges: true })
    expect(decision.promote).toBe(false)
  })
})
