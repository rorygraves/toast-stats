/**
 * Unit tests for programYearSummary (#892).
 *
 * Pure aggregation: one program year's all-districts rankings → the
 * per-year card view-model (headline totals + top-N districts).
 */

import { describe, it, expect } from 'vitest'
import {
  buildProgramYearSummary,
  type DistrictRankingLite,
} from '../programYearSummary'

const r = (over: Partial<DistrictRankingLite>): DistrictRankingLite => ({
  districtId: '1',
  districtName: 'District 1',
  region: '1',
  overallRank: 1,
  aggregateScore: 100,
  paidClubs: 50,
  totalPayments: 2000,
  distinguishedClubs: 10,
  ...over,
})

describe('buildProgramYearSummary (#892)', () => {
  it('formats the compact label and start year from the start year', () => {
    const s = buildProgramYearSummary(2024, '2025-06-30', [r({})])
    expect(s.startYear).toBe(2024)
    expect(s.label).toBe('2024-25')
    expect(s.yearEndDate).toBe('2025-06-30')
  })

  it('sums headline metrics across every district', () => {
    const s = buildProgramYearSummary(2024, '2025-06-30', [
      r({
        districtId: '1',
        paidClubs: 50,
        totalPayments: 2000,
        distinguishedClubs: 10,
      }),
      r({
        districtId: '2',
        paidClubs: 30,
        totalPayments: 1500,
        distinguishedClubs: 5,
      }),
      r({
        districtId: '3',
        paidClubs: 20,
        totalPayments: 500,
        distinguishedClubs: 0,
      }),
    ])
    expect(s.totalDistricts).toBe(3)
    expect(s.totalPaidClubs).toBe(100)
    expect(s.totalPayments).toBe(4000)
    expect(s.totalDistinguishedClubs).toBe(15)
  })

  it('returns the top 5 districts ordered by overallRank ascending', () => {
    const rankings = [7, 3, 1, 9, 2, 5, 4].map((rank, i) =>
      r({ districtId: `d${i}`, overallRank: rank, aggregateScore: 1000 - rank })
    )
    const s = buildProgramYearSummary(2024, '2025-06-30', rankings)
    expect(s.topDistricts.map(d => d.overallRank)).toEqual([1, 2, 3, 4, 5])
  })

  it('breaks overallRank ties deterministically by aggregateScore desc (Lesson 120)', () => {
    // Two districts tie at rank 1 (a real shape seen on 2023-06-30 CDN data).
    const rankings = [
      r({ districtId: 'A', overallRank: 1, aggregateScore: 80 }),
      r({ districtId: 'B', overallRank: 1, aggregateScore: 95 }),
      r({ districtId: 'C', overallRank: 3, aggregateScore: 70 }),
    ]
    const s = buildProgramYearSummary(2024, '2025-06-30', rankings)
    // Higher aggregateScore wins the tie → B before A.
    expect(s.topDistricts.map(d => d.districtId)).toEqual(['B', 'A', 'C'])
  })

  it('returns all districts when fewer than the top-N exist', () => {
    const s = buildProgramYearSummary(2024, '2025-06-30', [
      r({ districtId: '1', overallRank: 1 }),
      r({ districtId: '2', overallRank: 2 }),
    ])
    expect(s.topDistricts).toHaveLength(2)
  })

  it('carries only the presentational district fields into topDistricts', () => {
    const s = buildProgramYearSummary(2024, '2025-06-30', [
      r({
        districtId: '42',
        districtName: 'District 42',
        region: '7',
        overallRank: 1,
      }),
    ])
    expect(s.topDistricts[0]).toEqual({
      districtId: '42',
      districtName: 'District 42',
      region: '7',
      overallRank: 1,
    })
  })

  it('handles an empty rankings array with zeroed totals and no top districts', () => {
    const s = buildProgramYearSummary(2024, '2025-06-30', [])
    expect(s.totalDistricts).toBe(0)
    expect(s.totalPaidClubs).toBe(0)
    expect(s.totalPayments).toBe(0)
    expect(s.totalDistinguishedClubs).toBe(0)
    expect(s.topDistricts).toEqual([])
  })
})
