/**
 * Unit tests for the shared Borda-count ranking primitives (#306).
 *
 * These pure functions are the single home for the category + aggregate
 * Borda algorithm previously duplicated between
 * `BordaCountRankingCalculator` (analytics-core) and `TransformService`
 * (collector-cli). See tasks/lessons/061 + 076.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateCategoryRanking,
  calculateAggregateRankings,
  type CategoryRanking,
} from './bordaCount.js'

interface Metric {
  districtId: string
  value: number
}

const m = (districtId: string, value: number): Metric => ({ districtId, value })

describe('calculateCategoryRanking', () => {
  it('awards Borda points = totalDistricts - rank + 1, highest value first', () => {
    const metrics = [m('A', 30), m('B', 20), m('C', 10)]
    const ranked = calculateCategoryRanking(metrics, 'value', 'test')

    const byId = Object.fromEntries(ranked.map(r => [r.districtId, r]))
    expect(byId.A).toMatchObject({ rank: 1, bordaPoints: 3, value: 30 })
    expect(byId.B).toMatchObject({ rank: 2, bordaPoints: 2, value: 20 })
    expect(byId.C).toMatchObject({ rank: 3, bordaPoints: 1, value: 10 })
  })

  it('gives tied districts the same rank and Borda points (standard competition)', () => {
    const metrics = [m('A', 30), m('B', 30), m('C', 10)]
    const ranked = calculateCategoryRanking(metrics, 'value', 'test')
    const byId = Object.fromEntries(ranked.map(r => [r.districtId, r]))

    // A and B tie at rank 1 (3 points each); C falls to rank 3 (1 point)
    expect(byId.A).toMatchObject({ rank: 1, bordaPoints: 3 })
    expect(byId.B).toMatchObject({ rank: 1, bordaPoints: 3 })
    expect(byId.C).toMatchObject({ rank: 3, bordaPoints: 1 })
  })

  it('neutralizes a category where every district is tied — 0 points, rank 1 (#198)', () => {
    const metrics = [m('A', 0), m('B', 0), m('C', 0)]
    const ranked = calculateCategoryRanking(metrics, 'value', 'distinguished')

    expect(ranked).toHaveLength(3)
    for (const r of ranked) {
      expect(r.rank).toBe(1)
      expect(r.bordaPoints).toBe(0)
    }
  })

  it('returns an empty array for empty input', () => {
    expect(calculateCategoryRanking([] as Metric[], 'value', 'test')).toEqual(
      []
    )
  })
})

describe('calculateAggregateRankings', () => {
  it('sums Borda points across the three categories and sorts highest first', () => {
    const club: CategoryRanking[] = [
      { districtId: 'A', rank: 1, bordaPoints: 3, value: 30 },
      { districtId: 'B', rank: 2, bordaPoints: 2, value: 20 },
      { districtId: 'C', rank: 3, bordaPoints: 1, value: 10 },
    ]
    const payment: CategoryRanking[] = [
      { districtId: 'A', rank: 3, bordaPoints: 1, value: 1 },
      { districtId: 'B', rank: 1, bordaPoints: 3, value: 3 },
      { districtId: 'C', rank: 2, bordaPoints: 2, value: 2 },
    ]
    const distinguished: CategoryRanking[] = [
      { districtId: 'A', rank: 2, bordaPoints: 2, value: 50 },
      { districtId: 'B', rank: 2, bordaPoints: 2, value: 50 },
      { districtId: 'C', rank: 1, bordaPoints: 3, value: 60 },
    ]

    const agg = calculateAggregateRankings(club, payment, distinguished)

    // A: 3+1+2=6, B: 2+3+2=7, C: 1+2+3=6 → sorted B(7), then A/C(6)
    expect(agg[0]).toMatchObject({ districtId: 'B', aggregateScore: 7 })
    const a = agg.find(r => r.districtId === 'A')!
    expect(a).toMatchObject({
      clubsRank: 1,
      paymentsRank: 3,
      distinguishedRank: 2,
      aggregateScore: 6,
    })
  })
})
