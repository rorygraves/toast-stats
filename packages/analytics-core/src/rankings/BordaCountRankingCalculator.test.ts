/**
 * Unit tests for BordaCountRankingCalculator
 *
 * Tests the buildRankingsData method that creates AllDistrictsRankingsData
 * from ranked districts.
 *
 * **Validates: Requirements 5.2**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  BordaCountRankingCalculator,
  type RankingDistrictStatistics,
  type DistrictRankingData,
} from './BordaCountRankingCalculator.js'

describe('BordaCountRankingCalculator', () => {
  let calculator: BordaCountRankingCalculator

  beforeEach(() => {
    calculator = new BordaCountRankingCalculator()
  })

  describe('buildRankingsData', () => {
    it('should build AllDistrictsRankingsData with correct metadata', () => {
      const snapshotId = '2024-01-15'
      const rankedDistricts: RankingDistrictStatistics[] = []

      const result = calculator.buildRankingsData(rankedDistricts, snapshotId)

      expect(result.metadata.snapshotId).toBe(snapshotId)
      expect(result.metadata.schemaVersion).toBe('1.0')
      expect(result.metadata.calculationVersion).toBe('1.0')
      expect(result.metadata.rankingVersion).toBe('2.0')
      expect(result.metadata.sourceCsvDate).toBe(snapshotId)
      expect(result.metadata.totalDistricts).toBe(0)
      expect(result.metadata.fromCache).toBe(false)
      expect(result.metadata.calculatedAt).toBeDefined()
      expect(result.metadata.csvFetchedAt).toBeDefined()
    })

    it('should build rankings array from ranked districts', () => {
      const snapshotId = '2024-01-15'
      const ranking: DistrictRankingData = {
        clubsRank: 1,
        paymentsRank: 2,
        distinguishedRank: 3,
        aggregateScore: 150,
        clubGrowthPercent: 5.5,
        paymentGrowthPercent: 3.2,
        distinguishedPercent: 45.0,
        paidClubBase: 100,
        paymentBase: 5000,
        paidClubs: 105,
        totalPayments: 5160,
        distinguishedClubs: 47,
        activeClubs: 104,
        selectDistinguished: 20,
        presidentsDistinguished: 10,
        region: 'Region 1',
        districtName: 'District 42',
        rankingVersion: '2.0',
        calculatedAt: '2024-01-15T00:00:00.000Z',
      }

      const rankedDistricts: RankingDistrictStatistics[] = [
        {
          districtId: '42',
          asOfDate: '2024-01-15',
          membership: {
            total: 1000,
            change: 50,
            changePercent: 5.0,
            byClub: [],
          },
          clubs: {
            total: 105,
            active: 104,
            suspended: 1,
            ineligible: 0,
            low: 5,
            distinguished: 47,
          },
          education: { totalAwards: 200, byType: [], topClubs: [] },
          ranking,
        },
      ]

      const result = calculator.buildRankingsData(rankedDistricts, snapshotId)

      expect(result.rankings).toHaveLength(1)
      expect(result.metadata.totalDistricts).toBe(1)

      const districtRanking = result.rankings[0]
      expect(districtRanking).toBeDefined()
      expect(districtRanking!.districtId).toBe('42')
      expect(districtRanking!.districtName).toBe('District 42')
      expect(districtRanking!.region).toBe('Region 1')
      expect(districtRanking!.paidClubs).toBe(105)
      expect(districtRanking!.paidClubBase).toBe(100)
      expect(districtRanking!.clubGrowthPercent).toBe(5.5)
      expect(districtRanking!.totalPayments).toBe(5160)
      expect(districtRanking!.paymentBase).toBe(5000)
      expect(districtRanking!.paymentGrowthPercent).toBe(3.2)
      expect(districtRanking!.activeClubs).toBe(104)
      expect(districtRanking!.distinguishedClubs).toBe(47)
      expect(districtRanking!.selectDistinguished).toBe(20)
      expect(districtRanking!.presidentsDistinguished).toBe(10)
      expect(districtRanking!.distinguishedPercent).toBe(45.0)
      expect(districtRanking!.clubsRank).toBe(1)
      expect(districtRanking!.paymentsRank).toBe(2)
      expect(districtRanking!.distinguishedRank).toBe(3)
      expect(districtRanking!.aggregateScore).toBe(150)
    })

    it('should filter out districts without ranking data', () => {
      const snapshotId = '2024-01-15'
      const ranking: DistrictRankingData = {
        clubsRank: 1,
        paymentsRank: 1,
        distinguishedRank: 1,
        aggregateScore: 180,
        clubGrowthPercent: 10.0,
        paymentGrowthPercent: 8.0,
        distinguishedPercent: 50.0,
        paidClubBase: 50,
        paymentBase: 2500,
        paidClubs: 55,
        totalPayments: 2700,
        distinguishedClubs: 27,
        activeClubs: 54,
        selectDistinguished: 10,
        presidentsDistinguished: 5,
        region: 'Region 2',
        districtName: 'District 1',
        rankingVersion: '2.0',
        calculatedAt: '2024-01-15T00:00:00.000Z',
      }

      const rankedDistricts: RankingDistrictStatistics[] = [
        {
          districtId: '1',
          asOfDate: '2024-01-15',
          membership: {
            total: 500,
            change: 25,
            changePercent: 5.0,
            byClub: [],
          },
          clubs: {
            total: 55,
            active: 54,
            suspended: 1,
            ineligible: 0,
            low: 2,
            distinguished: 27,
          },
          education: { totalAwards: 100, byType: [], topClubs: [] },
          ranking,
        },
        {
          // District without ranking data - should be filtered out
          districtId: '2',
          asOfDate: '2024-01-15',
          membership: {
            total: 300,
            change: 10,
            changePercent: 3.0,
            byClub: [],
          },
          clubs: {
            total: 30,
            active: 29,
            suspended: 1,
            ineligible: 0,
            low: 3,
            distinguished: 10,
          },
          education: { totalAwards: 50, byType: [], topClubs: [] },
          // No ranking property
        },
      ]

      const result = calculator.buildRankingsData(rankedDistricts, snapshotId)

      // Only district with ranking data should be included
      expect(result.rankings).toHaveLength(1)
      expect(result.rankings[0]!.districtId).toBe('1')
    })

    it('should handle multiple districts correctly', () => {
      const snapshotId = '2024-01-15'

      const createRanking = (
        rank: number,
        districtName: string
      ): DistrictRankingData => ({
        clubsRank: rank,
        paymentsRank: rank,
        distinguishedRank: rank,
        aggregateScore: 200 - rank * 10,
        clubGrowthPercent: 10 - rank,
        paymentGrowthPercent: 8 - rank,
        distinguishedPercent: 50 - rank * 5,
        paidClubBase: 100,
        paymentBase: 5000,
        paidClubs: 100 + rank,
        totalPayments: 5000 + rank * 100,
        distinguishedClubs: 50 - rank * 2,
        activeClubs: 100,
        selectDistinguished: 20 - rank,
        presidentsDistinguished: 10 - rank,
        region: `Region ${rank}`,
        districtName,
        rankingVersion: '2.0',
        calculatedAt: '2024-01-15T00:00:00.000Z',
      })

      const rankedDistricts: RankingDistrictStatistics[] = [
        {
          districtId: '42',
          asOfDate: '2024-01-15',
          membership: {
            total: 1000,
            change: 50,
            changePercent: 5.0,
            byClub: [],
          },
          clubs: {
            total: 100,
            active: 100,
            suspended: 0,
            ineligible: 0,
            low: 0,
            distinguished: 50,
          },
          education: { totalAwards: 200, byType: [], topClubs: [] },
          ranking: createRanking(1, 'District 42'),
        },
        {
          districtId: 'F',
          asOfDate: '2024-01-15',
          membership: {
            total: 800,
            change: 40,
            changePercent: 5.0,
            byClub: [],
          },
          clubs: {
            total: 80,
            active: 80,
            suspended: 0,
            ineligible: 0,
            low: 0,
            distinguished: 40,
          },
          education: { totalAwards: 150, byType: [], topClubs: [] },
          ranking: createRanking(2, 'District F'),
        },
        {
          districtId: '101',
          asOfDate: '2024-01-15',
          membership: {
            total: 600,
            change: 30,
            changePercent: 5.0,
            byClub: [],
          },
          clubs: {
            total: 60,
            active: 60,
            suspended: 0,
            ineligible: 0,
            low: 0,
            distinguished: 30,
          },
          education: { totalAwards: 100, byType: [], topClubs: [] },
          ranking: createRanking(3, 'District 101'),
        },
      ]

      const result = calculator.buildRankingsData(rankedDistricts, snapshotId)

      expect(result.rankings).toHaveLength(3)
      expect(result.metadata.totalDistricts).toBe(3)

      // Verify all districts are present
      const districtIds = result.rankings.map(r => r.districtId)
      expect(districtIds).toContain('42')
      expect(districtIds).toContain('F')
      expect(districtIds).toContain('101')
    })

    it('should return empty rankings array for empty input', () => {
      const snapshotId = '2024-01-15'
      const rankedDistricts: RankingDistrictStatistics[] = []

      const result = calculator.buildRankingsData(rankedDistricts, snapshotId)

      expect(result.rankings).toHaveLength(0)
      expect(result.metadata.totalDistricts).toBe(0)
    })
  })

  describe('getRankingVersion', () => {
    it('should return the current ranking version', () => {
      expect(calculator.getRankingVersion()).toBe('2.0')
    })
  })

  describe('calculateRankings — category tie handling (#198)', () => {
    /**
     * Helper to create a minimal RankingDistrictStatistics with districtPerformance
     * (required by extractRankingMetrics).
     */
    function makeDistrict(
      id: string,
      region: string,
      clubGrowth: number,
      paymentGrowth: number,
      distinguishedClubs: number,
      activeClubs: number
    ): RankingDistrictStatistics {
      return {
        districtId: id,
        asOfDate: '2026-03-01',
        membership: {
          total: 100,
          change: 0,
          changePercent: 0,
          byClub: [],
        },
        clubs: {
          total: activeClubs,
          active: activeClubs,
          suspended: 0,
          ineligible: 0,
          low: 0,
          distinguished: distinguishedClubs,
        },
        education: { totalAwards: 0, byType: [], topClubs: [] },
        districtPerformance: [
          {
            DISTRICT: `District ${id}`,
            REGION: region,
            'Paid Clubs': '50',
            'Paid Club Base': '48',
            '% Club Growth': `${clubGrowth}%`,
            'Total YTD Payments': '200',
            'Payment Base': '180',
            '% Payment Growth': `${paymentGrowth}%`,
            'Active Clubs': String(activeClubs),
            'Total Distinguished Clubs': String(distinguishedClubs),
            'Select Distinguished Clubs': '0',
            'Presidents Distinguished Clubs': '0',
          },
        ],
      }
    }

    it('should award 0 Borda points when all districts tie in a category', async () => {
      // Pre-April scenario: 3 districts, all with 0 Distinguished clubs
      const districts = [
        makeDistrict('D1', '1', 10, 8, 0, 50),
        makeDistrict('D2', '1', 5, 12, 0, 50),
        makeDistrict('D3', '1', 8, 6, 0, 50),
      ]

      const result = await calculator.calculateRankings(districts)

      // All 3 districts should have distinguishedRank = 1 (tied)
      for (const d of result) {
        expect(d.ranking).toBeDefined()
        expect(d.ranking!.distinguishedRank).toBe(1)
      }

      // The aggregate scores should NOT include 3 points (max Borda) from Distinguished.
      // D1: clubGrowth=10% (rank 1 → 3pts), paymentGrowth=8% (rank 2 → 2pts), dist=0pts → 5
      // D2: clubGrowth=5% (rank 3 → 1pt), paymentGrowth=12% (rank 1 → 3pts), dist=0pts → 4
      // D3: clubGrowth=8% (rank 2 → 2pts), paymentGrowth=6% (rank 3 → 1pt), dist=0pts → 3
      const scores = result
        .map(d => ({
          id: d.districtId,
          score: d.ranking!.aggregateScore,
        }))
        .sort((a, b) => b.score - a.score)

      // Without the fix, all would get +3 from Distinguished (8, 7, 6).
      // With the fix, Distinguished contributes 0 points (5, 4, 3).
      // The key invariant: the max score should be 5, not 8.
      expect(scores[0]!.score).toBe(5)
      expect(scores[1]!.score).toBe(4)
      expect(scores[2]!.score).toBe(3)
    })

    it('should still award normal Borda points when values differ', async () => {
      // Normal scenario: districts have different Distinguished values
      const districts = [
        makeDistrict('D1', '1', 10, 8, 5, 50),
        makeDistrict('D2', '1', 5, 12, 10, 50),
        makeDistrict('D3', '1', 8, 6, 15, 50),
      ]

      const result = await calculator.calculateRankings(districts)

      // Distinguished should contribute normally:
      // D3=15 (rank 1, 3pts), D2=10 (rank 2, 2pts), D1=5 (rank 3, 1pt)
      const d1 = result.find(d => d.districtId === 'D1')!
      const d2 = result.find(d => d.districtId === 'D2')!
      const d3 = result.find(d => d.districtId === 'D3')!

      // D1: clubs=3 + payments=2 + distinguished=1 = 6
      expect(d1.ranking!.aggregateScore).toBe(6)
      // D2: clubs=1 + payments=3 + distinguished=2 = 6
      expect(d2.ranking!.aggregateScore).toBe(6)
      // D3: clubs=2 + payments=1 + distinguished=3 = 6
      expect(d3.ranking!.aggregateScore).toBe(6)
    })
  })

  describe('overallRank tie handling (#303)', () => {
    it('should assign same overallRank to districts with equal aggregateScore', () => {
      const snapshotId = '2024-01-15'

      function makeRankedDistrict(
        id: string,
        score: number
      ): RankingDistrictStatistics {
        return {
          districtId: id,
          asOfDate: snapshotId,
          membership: {
            total: 100,
            change: 5,
            changePercent: 5,
            byClub: [],
          },
          clubs: {
            total: 50,
            active: 50,
            suspended: 0,
            ineligible: 0,
            low: 0,
            distinguished: 10,
          },
          education: { totalAwards: 0, byType: [], topClubs: [] },
          ranking: {
            clubsRank: 1,
            paymentsRank: 1,
            distinguishedRank: 1,
            aggregateScore: score,
            clubGrowthPercent: 5,
            paymentGrowthPercent: 5,
            distinguishedPercent: 20,
            paidClubBase: 48,
            paymentBase: 4000,
            paidClubs: 50,
            totalPayments: 4200,
            distinguishedClubs: 10,
            activeClubs: 50,
            selectDistinguished: 5,
            presidentsDistinguished: 3,
            region: '1',
            districtName: `District ${id}`,
            rankingVersion: '2.0',
            calculatedAt: '2024-01-15T00:00:00Z',
          },
        }
      }

      // D1 and D2 tied at 250, D3 at 249
      const districts = [
        makeRankedDistrict('D1', 250),
        makeRankedDistrict('D2', 250),
        makeRankedDistrict('D3', 249),
      ]

      const result = calculator.buildRankingsData(districts, snapshotId)

      const d1 = result.rankings.find(r => r.districtId === 'D1')!
      const d2 = result.rankings.find(r => r.districtId === 'D2')!
      const d3 = result.rankings.find(r => r.districtId === 'D3')!

      // D1 and D2 should share rank 1 (standard competition ranking)
      expect(d1.overallRank).toBe(1)
      expect(d2.overallRank).toBe(1)
      // D3 should be rank 3 (not 2 — skip rank 2)
      expect(d3.overallRank).toBe(3)
    })
  })

  describe('confirmed Distinguished count for pre-April data (#304)', () => {
    it('should compute confirmed Distinguished from club data when TI reports 0', async () => {
      const calculator = new BordaCountRankingCalculator()

      const district: RankingDistrictStatistics = {
        districtId: '14',
        asOfDate: '2026-03-31', // Pre-April
        membership: {
          total: 100,
          change: 5,
          changePercent: 5,
          byClub: [],
        },
        clubs: {
          total: 50,
          active: 50,
          suspended: 0,
          ineligible: 0,
          low: 0,
          distinguished: 0, // TI reports 0 pre-April
        },
        education: { totalAwards: 0, byType: [], topClubs: [] },
        districtPerformance: [
          {
            DISTRICT: '14',
            REGION: '1',
            '% Club Growth': '5%',
            '% Payment Growth': '3%',
            'Paid Clubs': 50,
            'Paid Club Base': 48,
            'Total YTD Payments': 4200,
            'Payment Base': 4000,
            'Total Distinguished Clubs': 0,
            'Active Clubs': 50,
            'Select Distinguished Clubs': 0,
            'Presidents Distinguished Clubs': 0,
            '% Distinguished Clubs': '0%',
          },
        ],
        clubPerformance: [
          {
            // Club with 6 goals, 22 April renewals, base 15 → confirmed Distinguished
            'Goals Met': 6,
            'Mem. dues on time Apr': 22,
            'Mem. Base': 15,
            'Active Members': 25,
          },
          {
            // Club with 5 goals, 3 April renewals, base 15 → NOT confirmed
            'Goals Met': 5,
            'Mem. dues on time Apr': 3,
            'Mem. Base': 15,
            'Active Members': 20,
          },
          {
            // Club with 8 goals, 21 April renewals, base 18 → confirmed Select
            'Goals Met': 8,
            'Mem. dues on time Apr': 21,
            'Mem. Base': 18,
            'Active Members': 28,
          },
        ],
      }

      const result = await calculator.calculateRankings([district])
      const ranked = result[0]!

      // Should have 2 confirmed Distinguished clubs (club 1 + club 3)
      expect(ranked.ranking!.distinguishedClubs).toBe(2)
    })
  })

  describe('% Distinguished denominator — TI DDP rule (#537)', () => {
    /* The Distinguished District Program (Item 1490) computes
       "% Distinguished" as distinguishedClubs / paidClubBase × 100,
       where paidClubBase is the PY-start club count. The historical
       implementation used activeClubs (current count) which produced
       a lower number whenever districts gained clubs during the PY —
       see /district/93 where 38/74 = 51.35% disagreed with the count
       targets that correctly used base (38/69 = 55.07%). */
    function mkD93LikeDistrict(): RankingDistrictStatistics {
      // D93's actual numbers as of the reported snapshot.
      return {
        districtId: '93',
        asOfDate: '2026-05-14',
        membership: { total: 1198, change: 0, changePercent: 0, byClub: [] },
        clubs: {
          total: 74,
          active: 74,
          suspended: 0,
          ineligible: 0,
          low: 0,
          distinguished: 38,
        },
        education: { totalAwards: 0, byType: [], topClubs: [] },
        districtPerformance: [
          {
            DISTRICT: '93',
            REGION: '14',
            'Paid Clubs': '74',
            'Paid Club Base': '69',
            '% Club Growth': '7.25%',
            'Total YTD Payments': '2818',
            'Payment Base': '2500',
            '% Payment Growth': '12.72%',
            'Active Clubs': '74',
            'Total Distinguished Clubs': '38',
            'Select Distinguished Clubs': '6',
            'Presidents Distinguished Clubs': '4',
          },
        ],
      }
    }

    it('computes distinguishedPercent against Paid Club Base, not Active Clubs', async () => {
      const district = mkD93LikeDistrict()
      const result = await calculator.calculateRankings([district])
      const ranking = result[0]!.ranking!
      // 38 / 69 = 55.0724...% — the TI-correct figure.
      // Old buggy formula 38 / 74 = 51.35% would fail this assertion.
      expect(ranking.distinguishedPercent).toBeCloseTo(55.07, 1)
    })

    it('returns 0 when Paid Club Base is missing or zero', async () => {
      const district = mkD93LikeDistrict()
      district.districtPerformance![0]!['Paid Club Base'] = '0'
      const result = await calculator.calculateRankings([district])
      expect(result[0]!.ranking!.distinguishedPercent).toBe(0)
    })
  })
})
