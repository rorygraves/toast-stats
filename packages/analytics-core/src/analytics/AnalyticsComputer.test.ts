/**
 * AnalyticsComputer Unit Tests
 *
 * Tests for the main analytics computation orchestrator.
 *
 * Requirements: 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect } from 'vitest'
import { AnalyticsComputer } from './AnalyticsComputer.js'
import type { DistrictStatistics, ClubStatistics } from '../interfaces.js'
import type {
  AllDistrictsRankingsData,
  DistrictRanking,
} from '@toastmasters/shared-contracts'

/**
 * Helper to create a mock club
 */
function createMockClub(
  overrides: Partial<ClubStatistics> = {}
): ClubStatistics {
  return {
    clubId: '1234',
    clubName: 'Test Club',
    divisionId: 'A',
    areaId: 'A1',
    divisionName: 'Division A',
    areaName: 'Area A1',
    membershipCount: 25,
    paymentsCount: 20,
    dcpGoals: 5,
    status: 'Active',
    octoberRenewals: 10,
    aprilRenewals: 5,
    newMembers: 5,
    membershipBase: 20,
    ...overrides,
  }
}

/**
 * Helper to create a mock district statistics snapshot
 */
function createMockSnapshot(
  districtId: string,
  snapshotDate: string,
  clubs: ClubStatistics[] = []
): DistrictStatistics {
  const totalMembership = clubs.reduce((sum, c) => sum + c.membershipCount, 0)
  const totalPayments = clubs.reduce((sum, c) => sum + c.paymentsCount, 0)

  return {
    districtId,
    snapshotDate,
    clubs,
    divisions: [],
    areas: [],
    totals: {
      totalClubs: clubs.length,
      totalMembership,
      totalPayments,
      distinguishedClubs: clubs.filter(c => c.dcpGoals >= 5).length,
      selectDistinguishedClubs: clubs.filter(c => c.dcpGoals >= 7).length,
      presidentDistinguishedClubs: clubs.filter(c => c.dcpGoals >= 9).length,
    },
  }
}

describe('AnalyticsComputer', () => {
  describe('computeDistrictAnalytics', () => {
    it('should return empty analytics for empty snapshots', async () => {
      const computer = new AnalyticsComputer()
      const result = await computer.computeDistrictAnalytics('D101', [])

      expect(result.districtAnalytics.districtId).toBe('D101')
      expect(result.districtAnalytics.totalMembership).toBe(0)
      expect(result.districtAnalytics.membershipChange).toBe(0)
      expect(result.districtAnalytics.allClubs).toHaveLength(0)
      expect(result.schemaVersion).toBeDefined()
      expect(result.computedAt).toBeDefined()
    })

    it('should compute analytics from a single snapshot', async () => {
      const computer = new AnalyticsComputer()
      const clubs = [
        createMockClub({
          clubId: '1',
          clubName: 'Club A',
          membershipCount: 25,
          dcpGoals: 6,
        }),
        createMockClub({
          clubId: '2',
          clubName: 'Club B',
          membershipCount: 15,
          dcpGoals: 3,
        }),
        createMockClub({
          clubId: '3',
          clubName: 'Club C',
          membershipCount: 10,
          dcpGoals: 1,
        }),
      ]
      const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

      const result = await computer.computeDistrictAnalytics('D101', [snapshot])

      expect(result.districtAnalytics.districtId).toBe('D101')
      expect(result.districtAnalytics.totalMembership).toBe(50) // 25 + 15 + 10
      expect(result.districtAnalytics.membershipChange).toBe(0) // No change with single snapshot
      expect(result.districtAnalytics.allClubs).toHaveLength(3)
    })

    it('should compute membership change from multiple snapshots', async () => {
      const computer = new AnalyticsComputer()

      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 20,
          paymentsCount: 18,
          membershipBase: 15,
        }),
      ])
      const snapshot2 = createMockSnapshot('D101', '2024-02-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 25,
          paymentsCount: 22,
          membershipBase: 15,
        }),
      ])

      const result = await computer.computeDistrictAnalytics('D101', [
        snapshot1,
        snapshot2,
      ])

      // Without rankings, falls back to snapshot-based: sum(paymentsCount) - sum(membershipBase) from latest
      // = 22 - 15 = 7
      expect(result.districtAnalytics.membershipChange).toBe(7)
      expect(result.districtAnalytics.totalMembership).toBe(25) // Latest
    })

    it('should sort snapshots by date for trend analysis', async () => {
      const computer = new AnalyticsComputer()

      // Provide snapshots out of order
      const snapshot2 = createMockSnapshot('D101', '2024-02-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 30,
          paymentsCount: 28,
          membershipBase: 18,
        }),
      ])
      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 20,
          paymentsCount: 18,
          membershipBase: 18,
        }),
      ])

      const result = await computer.computeDistrictAnalytics('D101', [
        snapshot2,
        snapshot1,
      ])

      // Without rankings, falls back to snapshot-based: sum(paymentsCount) - sum(membershipBase) from latest
      // Latest is snapshot2 (Feb, sorted): 28 - 18 = 10
      expect(result.districtAnalytics.membershipChange).toBe(10)
      expect(result.districtAnalytics.totalMembership).toBe(30) // Latest (Feb)
    })

    it('should categorize clubs by health status', async () => {
      const computer = new AnalyticsComputer()

      const clubs = [
        // Thriving: membership >= 20 and DCP checkpoint met
        createMockClub({
          clubId: '1',
          clubName: 'Thriving Club',
          membershipCount: 25,
          dcpGoals: 5,
        }),
        // Vulnerable: membership < 20 but >= 12
        createMockClub({
          clubId: '2',
          clubName: 'Vulnerable Club',
          membershipCount: 15,
          dcpGoals: 0,
        }),
        // Intervention required: membership < 12
        createMockClub({
          clubId: '3',
          clubName: 'Critical Club',
          membershipCount: 8,
          dcpGoals: 0,
        }),
      ]
      const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

      const result = await computer.computeDistrictAnalytics('D101', [snapshot])

      expect(result.clubHealth.thrivingClubs.length).toBeGreaterThanOrEqual(1)
      expect(result.clubHealth.vulnerableClubs.length).toBeGreaterThanOrEqual(0)
      expect(
        result.clubHealth.interventionRequiredClubs.length
      ).toBeGreaterThanOrEqual(1)
    })

    it('should generate distinguished club summaries', async () => {
      const computer = new AnalyticsComputer()

      const clubs = [
        // President's Distinguished: 9+ goals, 20+ members
        createMockClub({
          clubId: '1',
          clubName: 'President Club',
          membershipCount: 25,
          dcpGoals: 9,
        }),
        // Select Distinguished: 7+ goals, 20+ members
        createMockClub({
          clubId: '2',
          clubName: 'Select Club',
          membershipCount: 22,
          dcpGoals: 7,
        }),
        // Distinguished: 5+ goals, 20+ members
        createMockClub({
          clubId: '3',
          clubName: 'Distinguished Club',
          membershipCount: 20,
          dcpGoals: 5,
        }),
        // Not distinguished
        createMockClub({
          clubId: '4',
          clubName: 'Regular Club',
          membershipCount: 15,
          dcpGoals: 3,
        }),
      ]
      const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

      const result = await computer.computeDistrictAnalytics('D101', [snapshot])

      // distinguishedClubs is now a counts object (Requirements 2.1)
      expect(result.districtAnalytics.distinguishedClubs.total).toBe(3)
      expect(result.districtAnalytics.distinguishedClubs.presidents).toBe(1)
      expect(result.districtAnalytics.distinguishedClubs.select).toBe(1)
      expect(result.districtAnalytics.distinguishedClubs.distinguished).toBe(1)
      expect(result.districtAnalytics.distinguishedClubs.smedley).toBe(0)

      // distinguishedClubsList is the array of summaries (Requirements 2.2)
      expect(result.districtAnalytics.distinguishedClubsList.length).toBe(3)
      expect(
        result.districtAnalytics.distinguishedClubsList.some(
          c => c.status === 'president'
        )
      ).toBe(true)
      expect(
        result.districtAnalytics.distinguishedClubsList.some(
          c => c.status === 'select'
        )
      ).toBe(true)
      expect(
        result.districtAnalytics.distinguishedClubsList.some(
          c => c.status === 'distinguished'
        )
      ).toBe(true)
    })

    it('should generate division rankings', async () => {
      const computer = new AnalyticsComputer()

      const clubs = [
        createMockClub({
          clubId: '1',
          divisionId: 'A',
          membershipCount: 25,
          dcpGoals: 8,
        }),
        createMockClub({
          clubId: '2',
          divisionId: 'A',
          membershipCount: 22,
          dcpGoals: 6,
        }),
        createMockClub({
          clubId: '3',
          divisionId: 'B',
          membershipCount: 18,
          dcpGoals: 3,
        }),
        createMockClub({
          clubId: '4',
          divisionId: 'B',
          membershipCount: 15,
          dcpGoals: 2,
        }),
      ]
      const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

      const result = await computer.computeDistrictAnalytics('D101', [snapshot])

      expect(result.districtAnalytics.divisionRankings.length).toBe(2)
      // Division A should rank higher (more DCP goals)
      expect(result.districtAnalytics.divisionRankings[0]?.divisionId).toBe('A')
      expect(result.districtAnalytics.divisionRankings[0]?.rank).toBe(1)
    })

    it('should generate top performing areas', async () => {
      const computer = new AnalyticsComputer()

      const clubs = [
        createMockClub({
          clubId: '1',
          divisionId: 'A',
          areaId: 'A1',
          membershipCount: 25,
          dcpGoals: 8,
        }),
        createMockClub({
          clubId: '2',
          divisionId: 'A',
          areaId: 'A2',
          membershipCount: 15,
          dcpGoals: 2,
        }),
        createMockClub({
          clubId: '3',
          divisionId: 'B',
          areaId: 'B1',
          membershipCount: 20,
          dcpGoals: 5,
        }),
      ]
      const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

      const result = await computer.computeDistrictAnalytics('D101', [snapshot])

      expect(
        result.districtAnalytics.topPerformingAreas.length
      ).toBeGreaterThan(0)
      // Area A1 should be top (highest score)
      expect(result.districtAnalytics.topPerformingAreas[0]?.areaId).toBe('A1')
    })

    it('should include membership trends in result', async () => {
      const computer = new AnalyticsComputer()

      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub({ clubId: '1', membershipCount: 20, paymentsCount: 15 }),
      ])
      const snapshot2 = createMockSnapshot('D101', '2024-02-01', [
        createMockClub({ clubId: '1', membershipCount: 25, paymentsCount: 20 }),
      ])

      const result = await computer.computeDistrictAnalytics('D101', [
        snapshot1,
        snapshot2,
      ])

      expect(result.membershipTrends.membershipTrend).toHaveLength(2)
      expect(result.membershipTrends.paymentsTrend).toHaveLength(2)
      expect(result.membershipTrends.membershipTrend[0]?.count).toBe(20)
      expect(result.membershipTrends.membershipTrend[1]?.count).toBe(25)
    })

    it('should set correct date range', async () => {
      const computer = new AnalyticsComputer()

      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub(),
      ])
      const snapshot2 = createMockSnapshot('D101', '2024-03-15', [
        createMockClub(),
      ])

      const result = await computer.computeDistrictAnalytics('D101', [
        snapshot1,
        snapshot2,
      ])

      expect(result.districtAnalytics.dateRange.start).toBe('2024-01-01')
      expect(result.districtAnalytics.dateRange.end).toBe('2024-03-15')
    })

    /**
     * memberCountChange tests
     *
     * Validates: Requirements 6.1, 6.2
     *
     * memberCountChange represents the actual change in member count (sum of membershipCount
     * across all clubs) between the first and last snapshots. This is distinct from
     * membershipChange which tracks payment-based change.
     */
    it('should compute memberCountChange as difference in total membership between two snapshots', async () => {
      const computer = new AnalyticsComputer()

      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 20,
          paymentsCount: 18,
          membershipBase: 15,
        }),
        createMockClub({
          clubId: '2',
          membershipCount: 30,
          paymentsCount: 25,
          membershipBase: 20,
        }),
      ])
      const snapshot2 = createMockSnapshot('D101', '2024-02-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 25,
          paymentsCount: 22,
          membershipBase: 15,
        }),
        createMockClub({
          clubId: '2',
          membershipCount: 35,
          paymentsCount: 30,
          membershipBase: 20,
        }),
      ])

      const result = await computer.computeDistrictAnalytics('D101', [
        snapshot1,
        snapshot2,
      ])

      // Total membership: snapshot1 = 20 + 30 = 50, snapshot2 = 25 + 35 = 60
      // memberCountChange = 60 - 50 = 10
      expect(result.districtAnalytics.memberCountChange).toBe(10)
    })

    it('should set memberCountChange to 0 when only a single snapshot is provided', async () => {
      const computer = new AnalyticsComputer()

      const snapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ clubId: '1', membershipCount: 25 }),
        createMockClub({ clubId: '2', membershipCount: 15 }),
      ])

      const result = await computer.computeDistrictAnalytics('D101', [snapshot])

      // With a single snapshot there is no baseline to compare against
      expect(result.districtAnalytics.memberCountChange).toBe(0)
    })

    it('should preserve payment-based membershipChange alongside memberCountChange', async () => {
      const computer = new AnalyticsComputer()

      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 20,
          paymentsCount: 18,
          membershipBase: 15,
        }),
      ])
      const snapshot2 = createMockSnapshot('D101', '2024-02-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 28,
          paymentsCount: 24,
          membershipBase: 15,
        }),
      ])

      const result = await computer.computeDistrictAnalytics('D101', [
        snapshot1,
        snapshot2,
      ])

      // memberCountChange: actual member count difference = 28 - 20 = 8
      expect(result.districtAnalytics.memberCountChange).toBe(8)

      // membershipChange: payment-based, without rankings falls back to
      // snapshot-based: sum(paymentsCount) - sum(membershipBase) from latest = 24 - 15 = 9
      expect(result.districtAnalytics.membershipChange).toBe(9)

      // Both fields coexist — they measure different things
      expect(result.districtAnalytics.memberCountChange).not.toBe(
        result.districtAnalytics.membershipChange
      )
    })

    // #489 — Prospective (FAC-only) clubs flow through the latest
    // snapshot into the DistrictAnalytics output so the frontend can
    // render them without a second fetch.
    it('should propagate prospectiveClubs from the latest snapshot', async () => {
      const computer = new AnalyticsComputer()
      const snapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ clubId: '1', membershipCount: 25 }),
      ])
      snapshot.prospectiveClubs = [
        {
          clubId: '00088888',
          clubName: 'New ATO Toastmasters',
          city: 'Ottawa',
          region: 'ON',
          country: 'Canada',
          isProspective: true,
        },
      ]

      const result = await computer.computeDistrictAnalytics('D101', [snapshot])

      expect(result.districtAnalytics.prospectiveClubs).toHaveLength(1)
      expect(result.districtAnalytics.prospectiveClubs[0]?.clubId).toBe(
        '00088888'
      )
    })

    it('should default prospectiveClubs to an empty array when the snapshot omits it', async () => {
      const computer = new AnalyticsComputer()
      const snapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ clubId: '1' }),
      ])

      const result = await computer.computeDistrictAnalytics('D101', [snapshot])

      expect(result.districtAnalytics.prospectiveClubs).toEqual([])
    })
  })

  describe('computeMembershipAnalytics', () => {
    it('should return empty analytics for empty snapshots', () => {
      const computer = new AnalyticsComputer()
      const result = computer.computeMembershipAnalytics('D101', [])

      expect(result.districtId).toBe('D101')
      expect(result.totalMembership).toBe(0)
      expect(result.membershipChange).toBe(0)
      expect(result.membershipTrend).toHaveLength(0)
      expect(result.paymentsTrend).toHaveLength(0)
      expect(result.growthRate).toBe(0)
      expect(result.retentionRate).toBe(0)
      expect(result.yearOverYear).toBeUndefined()
    })

    it('should return empty analytics when district not found in snapshots', () => {
      const computer = new AnalyticsComputer()
      const snapshot = createMockSnapshot('D999', '2024-01-15', [
        createMockClub({ membershipCount: 25 }),
      ])

      const result = computer.computeMembershipAnalytics('D101', [snapshot])

      expect(result.districtId).toBe('D101')
      expect(result.totalMembership).toBe(0)
      expect(result.membershipChange).toBe(0)
      expect(result.membershipTrend).toHaveLength(0)
    })

    it('should compute analytics from a single snapshot', () => {
      const computer = new AnalyticsComputer()
      const clubs = [
        createMockClub({ clubId: '1', membershipCount: 25, paymentsCount: 20 }),
        createMockClub({ clubId: '2', membershipCount: 15, paymentsCount: 12 }),
      ]
      const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

      const result = computer.computeMembershipAnalytics('D101', [snapshot])

      expect(result.districtId).toBe('D101')
      expect(result.totalMembership).toBe(40) // 25 + 15
      expect(result.membershipChange).toBe(0) // No change with single snapshot
      expect(result.membershipTrend).toHaveLength(1)
      expect(result.membershipTrend[0]?.count).toBe(40)
      expect(result.paymentsTrend).toHaveLength(1)
      expect(result.paymentsTrend[0]?.payments).toBe(32) // 20 + 12
    })

    it('should compute membership change from multiple snapshots', () => {
      const computer = new AnalyticsComputer()

      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub({ clubId: '1', membershipCount: 20, paymentsCount: 15 }),
      ])
      const snapshot2 = createMockSnapshot('D101', '2024-02-01', [
        createMockClub({ clubId: '1', membershipCount: 25, paymentsCount: 20 }),
      ])

      const result = computer.computeMembershipAnalytics('D101', [
        snapshot1,
        snapshot2,
      ])

      expect(result.membershipChange).toBe(5) // 25 - 20
      expect(result.totalMembership).toBe(25) // Latest
      expect(result.membershipTrend).toHaveLength(2)
    })

    it('should calculate growth rate correctly', () => {
      const computer = new AnalyticsComputer()

      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 100,
          paymentsCount: 80,
        }),
      ])
      const snapshot2 = createMockSnapshot('D101', '2024-02-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 120,
          paymentsCount: 100,
        }),
      ])

      const result = computer.computeMembershipAnalytics('D101', [
        snapshot1,
        snapshot2,
      ])

      // Growth rate = ((120 - 100) / 100) * 100 = 20%
      expect(result.growthRate).toBe(20)
    })

    it('should calculate negative growth rate for declining membership', () => {
      const computer = new AnalyticsComputer()

      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 100,
          paymentsCount: 80,
        }),
      ])
      const snapshot2 = createMockSnapshot('D101', '2024-02-01', [
        createMockClub({ clubId: '1', membershipCount: 80, paymentsCount: 60 }),
      ])

      const result = computer.computeMembershipAnalytics('D101', [
        snapshot1,
        snapshot2,
      ])

      // Growth rate = ((80 - 100) / 100) * 100 = -20%
      expect(result.growthRate).toBe(-20)
    })

    it('should calculate retention rate based on payments-to-membership ratio', () => {
      const computer = new AnalyticsComputer()

      // Payments = 80, Membership = 100
      // Expected payments = 100 * 2 = 200
      // Retention rate = (80 / 200) * 100 = 40%
      const snapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({
          clubId: '1',
          membershipCount: 100,
          paymentsCount: 80,
        }),
      ])

      const result = computer.computeMembershipAnalytics('D101', [snapshot])

      expect(result.retentionRate).toBe(40)
    })

    it('should cap retention rate at 100%', () => {
      const computer = new AnalyticsComputer()

      // Payments = 250, Membership = 100
      // Expected payments = 100 * 2 = 200
      // Retention rate = (250 / 200) * 100 = 125% -> capped at 100%
      const snapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({
          clubId: '1',
          membershipCount: 100,
          paymentsCount: 250,
        }),
      ])

      const result = computer.computeMembershipAnalytics('D101', [snapshot])

      expect(result.retentionRate).toBe(100)
    })

    it('should set correct date range', () => {
      const computer = new AnalyticsComputer()

      const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
        createMockClub(),
      ])
      const snapshot2 = createMockSnapshot('D101', '2024-03-15', [
        createMockClub(),
      ])

      const result = computer.computeMembershipAnalytics('D101', [
        snapshot1,
        snapshot2,
      ])

      expect(result.dateRange.start).toBe('2024-01-01')
      expect(result.dateRange.end).toBe('2024-03-15')
    })

    it('should filter snapshots by district ID', () => {
      const computer = new AnalyticsComputer()

      const snapshotD101 = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ clubId: '1', membershipCount: 25 }),
      ])
      const snapshotD102 = createMockSnapshot('D102', '2024-01-15', [
        createMockClub({ clubId: '2', membershipCount: 50 }),
      ])

      const result = computer.computeMembershipAnalytics('D101', [
        snapshotD101,
        snapshotD102,
      ])

      // Should only include D101 data
      expect(result.districtId).toBe('D101')
      expect(result.totalMembership).toBe(25) // Only D101's membership
    })

    it('should include year-over-year comparison when historical data available', () => {
      const computer = new AnalyticsComputer()

      const snapshot2023 = createMockSnapshot('D101', '2023-01-15', [
        createMockClub({
          clubId: '1',
          membershipCount: 100,
          paymentsCount: 80,
        }),
      ])
      const snapshot2024 = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({
          clubId: '1',
          membershipCount: 120,
          paymentsCount: 100,
        }),
      ])

      const result = computer.computeMembershipAnalytics('D101', [
        snapshot2023,
        snapshot2024,
      ])

      expect(result.yearOverYear).toBeDefined()
      expect(result.yearOverYear?.currentYear).toBe(2024)
      expect(result.yearOverYear?.previousYear).toBe(2023)
      expect(result.yearOverYear?.membershipChange).toBe(20) // 120 - 100
    })
  })
})

describe('computeVulnerableClubs', () => {
  it('should return empty data for empty club health', () => {
    const computer = new AnalyticsComputer()
    const emptyClubHealth = {
      allClubs: [],
      thrivingClubs: [],
      vulnerableClubs: [],
      interventionRequiredClubs: [],
    }

    const result = computer.computeVulnerableClubs('D101', emptyClubHealth)

    expect(result.districtId).toBe('D101')
    expect(result.totalVulnerableClubs).toBe(0)
    expect(result.interventionRequiredClubs).toBe(0)
    expect(result.vulnerableClubs).toHaveLength(0)
    expect(result.interventionRequired).toHaveLength(0)
    expect(result.computedAt).toBeDefined()
  })

  it('should correctly count vulnerable clubs', async () => {
    const computer = new AnalyticsComputer()

    // Create club health data with vulnerable clubs
    const clubs = [
      createMockClub({
        clubId: '1',
        clubName: 'Thriving Club',
        membershipCount: 25,
        dcpGoals: 5,
      }),
      createMockClub({
        clubId: '2',
        clubName: 'Vulnerable Club 1',
        membershipCount: 15,
        dcpGoals: 0,
      }),
      createMockClub({
        clubId: '3',
        clubName: 'Vulnerable Club 2',
        membershipCount: 18,
        dcpGoals: 1,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    // First compute district analytics to get club health data
    const analyticsResult = await computer.computeDistrictAnalytics('D101', [
      snapshot,
    ])

    // Then compute vulnerable clubs from the club health data
    const result = computer.computeVulnerableClubs(
      'D101',
      analyticsResult.clubHealth
    )

    expect(result.districtId).toBe('D101')
    expect(result.totalVulnerableClubs).toBe(
      analyticsResult.clubHealth.vulnerableClubs.length
    )
    expect(result.vulnerableClubs).toEqual(
      analyticsResult.clubHealth.vulnerableClubs
    )
  })

  it('should correctly count intervention required clubs', () => {
    const computer = new AnalyticsComputer()

    // Create club health data with intervention required clubs
    const clubs = [
      createMockClub({
        clubId: '1',
        clubName: 'Thriving Club',
        membershipCount: 25,
        dcpGoals: 5,
      }),
      createMockClub({
        clubId: '2',
        clubName: 'Critical Club 1',
        membershipCount: 8,
        dcpGoals: 0,
        membershipBase: 10,
      }),
      createMockClub({
        clubId: '3',
        clubName: 'Critical Club 2',
        membershipCount: 10,
        dcpGoals: 1,
        membershipBase: 12,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    return computer
      .computeDistrictAnalytics('D101', [snapshot])
      .then(analyticsResult => {
        const result = computer.computeVulnerableClubs(
          'D101',
          analyticsResult.clubHealth
        )

        expect(result.districtId).toBe('D101')
        expect(result.interventionRequiredClubs).toBe(
          analyticsResult.clubHealth.interventionRequiredClubs.length
        )
        expect(result.interventionRequired).toEqual(
          analyticsResult.clubHealth.interventionRequiredClubs
        )
      })
  })

  it('should include computedAt timestamp', () => {
    const computer = new AnalyticsComputer()
    const emptyClubHealth = {
      allClubs: [],
      thrivingClubs: [],
      vulnerableClubs: [],
      interventionRequiredClubs: [],
    }

    const beforeTime = new Date().toISOString()
    const result = computer.computeVulnerableClubs('D101', emptyClubHealth)
    const afterTime = new Date().toISOString()

    expect(result.computedAt).toBeDefined()
    expect(result.computedAt >= beforeTime).toBe(true)
    expect(result.computedAt <= afterTime).toBe(true)
  })

  it('should preserve club trend data in vulnerable clubs array', async () => {
    const computer = new AnalyticsComputer()

    // Create a vulnerable club with specific data
    const clubs = [
      createMockClub({
        clubId: 'V001',
        clubName: 'Vulnerable Test Club',
        divisionId: 'B',
        divisionName: 'Division B',
        areaId: 'B2',
        areaName: 'Area B2',
        membershipCount: 15,
        paymentsCount: 10,
        dcpGoals: 0,
        membershipBase: 18,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const analyticsResult = await computer.computeDistrictAnalytics('D101', [
      snapshot,
    ])
    const result = computer.computeVulnerableClubs(
      'D101',
      analyticsResult.clubHealth
    )

    // Verify the vulnerable club data is preserved
    if (result.vulnerableClubs.length > 0) {
      const vulnerableClub = result.vulnerableClubs[0]
      expect(vulnerableClub?.clubId).toBe('V001')
      expect(vulnerableClub?.clubName).toBe('Vulnerable Test Club')
      expect(vulnerableClub?.divisionId).toBe('B')
      expect(vulnerableClub?.areaId).toBe('B2')
      expect(vulnerableClub?.membershipCount).toBe(15)
      expect(vulnerableClub?.currentStatus).toBe('vulnerable')
    }
  })

  it('should preserve club trend data in intervention required array', async () => {
    const computer = new AnalyticsComputer()

    // Create an intervention required club (membership < 12 AND net growth < 3)
    const clubs = [
      createMockClub({
        clubId: 'I001',
        clubName: 'Intervention Test Club',
        divisionId: 'C',
        divisionName: 'Division C',
        areaId: 'C1',
        areaName: 'Area C1',
        membershipCount: 8,
        paymentsCount: 5,
        dcpGoals: 0,
        membershipBase: 10, // Net growth = 8 - 10 = -2 (< 3)
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const analyticsResult = await computer.computeDistrictAnalytics('D101', [
      snapshot,
    ])
    const result = computer.computeVulnerableClubs(
      'D101',
      analyticsResult.clubHealth
    )

    // Verify the intervention required club data is preserved
    expect(result.interventionRequired.length).toBeGreaterThan(0)
    const interventionClub = result.interventionRequired[0]
    expect(interventionClub?.clubId).toBe('I001')
    expect(interventionClub?.clubName).toBe('Intervention Test Club')
    expect(interventionClub?.divisionId).toBe('C')
    expect(interventionClub?.areaId).toBe('C1')
    expect(interventionClub?.membershipCount).toBe(8)
    expect(interventionClub?.currentStatus).toBe('intervention-required')
  })
})

describe('computeLeadershipInsights', () => {
  it('should return empty data for empty snapshots', () => {
    const computer = new AnalyticsComputer()
    const result = computer.computeLeadershipInsights('D101', [])

    expect(result.districtId).toBe('D101')
    expect(result.officerCompletionRate).toBe(0)
    expect(result.trainingCompletionRate).toBe(0)
    expect(result.leadershipEffectivenessScore).toBe(0)
    expect(result.topPerformingDivisions).toHaveLength(0)
    expect(result.areasNeedingSupport).toHaveLength(0)
    expect(result.insights.leadershipScores).toHaveLength(0)
    expect(result.insights.bestPracticeDivisions).toHaveLength(0)
  })

  it('should return empty data when district not found in snapshots', () => {
    const computer = new AnalyticsComputer()
    const snapshot = createMockSnapshot('D999', '2024-01-15', [
      createMockClub({ membershipCount: 25 }),
    ])

    const result = computer.computeLeadershipInsights('D101', [snapshot])

    expect(result.districtId).toBe('D101')
    expect(result.officerCompletionRate).toBe(0)
    expect(result.trainingCompletionRate).toBe(0)
    expect(result.leadershipEffectivenessScore).toBe(0)
    expect(result.topPerformingDivisions).toHaveLength(0)
  })

  it('should compute leadership insights from a single snapshot', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        divisionId: 'A',
        divisionName: 'Division A',
        areaId: 'A1',
        areaName: 'Area A1',
        membershipCount: 25,
        dcpGoals: 6,
      }),
      createMockClub({
        clubId: '2',
        divisionId: 'A',
        divisionName: 'Division A',
        areaId: 'A2',
        areaName: 'Area A2',
        membershipCount: 20,
        dcpGoals: 4,
      }),
      createMockClub({
        clubId: '3',
        divisionId: 'B',
        divisionName: 'Division B',
        areaId: 'B1',
        areaName: 'Area B1',
        membershipCount: 15,
        dcpGoals: 2,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computeLeadershipInsights('D101', [snapshot])

    expect(result.districtId).toBe('D101')
    expect(result.insights.leadershipScores.length).toBeGreaterThan(0)
    expect(result.leadershipEffectivenessScore).toBeGreaterThanOrEqual(0)
    expect(result.leadershipEffectivenessScore).toBeLessThanOrEqual(100)
  })

  it('should calculate officer completion rate from health scores', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 25,
        dcpGoals: 8,
      }),
      createMockClub({
        clubId: '2',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 22,
        dcpGoals: 6,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computeLeadershipInsights('D101', [snapshot])

    // Officer completion rate should be derived from health scores
    expect(result.officerCompletionRate).toBeGreaterThanOrEqual(0)
    expect(result.officerCompletionRate).toBeLessThanOrEqual(100)
  })

  it('should calculate training completion rate from DCP scores', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 25,
        dcpGoals: 10, // High DCP goals
      }),
      createMockClub({
        clubId: '2',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 22,
        dcpGoals: 8,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computeLeadershipInsights('D101', [snapshot])

    // Training completion rate should be derived from DCP scores
    expect(result.trainingCompletionRate).toBeGreaterThanOrEqual(0)
    expect(result.trainingCompletionRate).toBeLessThanOrEqual(100)
  })

  it('should generate top performing divisions with correct structure', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 25,
        dcpGoals: 8,
      }),
      createMockClub({
        clubId: '2',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 22,
        dcpGoals: 6,
      }),
      createMockClub({
        clubId: '3',
        divisionId: 'B',
        divisionName: 'Division B',
        membershipCount: 18,
        dcpGoals: 3,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computeLeadershipInsights('D101', [snapshot])

    // Should have top performing divisions
    expect(result.topPerformingDivisions.length).toBeGreaterThan(0)

    // Each division should have the correct structure
    const topDivision = result.topPerformingDivisions[0]
    expect(topDivision).toBeDefined()
    expect(topDivision?.divisionId).toBeDefined()
    expect(topDivision?.divisionName).toBeDefined()
    expect(topDivision?.rank).toBeDefined()
    expect(topDivision?.score).toBeDefined()
    expect(topDivision?.clubCount).toBeDefined()
    expect(topDivision?.membershipTotal).toBeDefined()
  })

  it('should identify areas needing support', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      // High performing area
      createMockClub({
        clubId: '1',
        divisionId: 'A',
        divisionName: 'Division A',
        areaId: 'A1',
        areaName: 'Area A1',
        membershipCount: 25,
        dcpGoals: 8,
      }),
      // Low performing area
      createMockClub({
        clubId: '2',
        divisionId: 'B',
        divisionName: 'Division B',
        areaId: 'B1',
        areaName: 'Area B1',
        membershipCount: 8,
        dcpGoals: 0,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computeLeadershipInsights('D101', [snapshot])

    // Should identify low performing areas
    // Areas needing support should have correct structure
    if (result.areasNeedingSupport.length > 0) {
      const area = result.areasNeedingSupport[0]
      expect(area?.areaId).toBeDefined()
      expect(area?.areaName).toBeDefined()
      expect(area?.divisionId).toBeDefined()
      expect(area?.score).toBeDefined()
      expect(area?.clubCount).toBeDefined()
      expect(area?.membershipTotal).toBeDefined()
    }
  })

  it('should set correct date range', () => {
    const computer = new AnalyticsComputer()

    const snapshot1 = createMockSnapshot('D101', '2024-01-01', [
      createMockClub({ divisionId: 'A' }),
    ])
    const snapshot2 = createMockSnapshot('D101', '2024-03-15', [
      createMockClub({ divisionId: 'A' }),
    ])

    const result = computer.computeLeadershipInsights('D101', [
      snapshot1,
      snapshot2,
    ])

    expect(result.dateRange.start).toBe('2024-01-01')
    expect(result.dateRange.end).toBe('2024-03-15')
  })

  it('should filter snapshots by district ID', () => {
    const computer = new AnalyticsComputer()

    const snapshotD101 = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({
        clubId: '1',
        divisionId: 'A',
        membershipCount: 25,
        dcpGoals: 8,
      }),
    ])
    const snapshotD102 = createMockSnapshot('D102', '2024-01-15', [
      createMockClub({
        clubId: '2',
        divisionId: 'B',
        membershipCount: 50,
        dcpGoals: 10,
      }),
    ])

    const result = computer.computeLeadershipInsights('D101', [
      snapshotD101,
      snapshotD102,
    ])

    // Should only include D101 data
    expect(result.districtId).toBe('D101')
    // Division A from D101 should be present, not Division B from D102
    if (result.topPerformingDivisions.length > 0) {
      expect(result.topPerformingDivisions[0]?.divisionId).toBe('A')
    }
  })

  it('should include full leadership insights in the result', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        divisionId: 'A',
        divisionName: 'Division A',
        areaId: 'A1',
        areaName: 'Area A1',
        membershipCount: 25,
        dcpGoals: 8,
      }),
      createMockClub({
        clubId: '2',
        divisionId: 'B',
        divisionName: 'Division B',
        areaId: 'B1',
        areaName: 'Area B1',
        membershipCount: 20,
        dcpGoals: 5,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computeLeadershipInsights('D101', [snapshot])

    // Should include full insights object
    expect(result.insights).toBeDefined()
    expect(result.insights.leadershipScores).toBeDefined()
    expect(result.insights.bestPracticeDivisions).toBeDefined()
    expect(result.insights.leadershipChanges).toBeDefined()
    expect(result.insights.areaDirectorCorrelations).toBeDefined()
    expect(result.insights.summary).toBeDefined()
    expect(result.insights.summary.topPerformingDivisions).toBeDefined()
    expect(result.insights.summary.topPerformingAreas).toBeDefined()
    expect(result.insights.summary.averageLeadershipScore).toBeDefined()
    expect(result.insights.summary.totalBestPracticeDivisions).toBeDefined()
  })

  it('should rank divisions correctly in topPerformingDivisions', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      // Division A - high performing
      createMockClub({
        clubId: '1',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 30,
        dcpGoals: 9,
      }),
      createMockClub({
        clubId: '2',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 28,
        dcpGoals: 8,
      }),
      // Division B - medium performing
      createMockClub({
        clubId: '3',
        divisionId: 'B',
        divisionName: 'Division B',
        membershipCount: 20,
        dcpGoals: 5,
      }),
      // Division C - low performing
      createMockClub({
        clubId: '4',
        divisionId: 'C',
        divisionName: 'Division C',
        membershipCount: 12,
        dcpGoals: 1,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computeLeadershipInsights('D101', [snapshot])

    // Divisions should be ranked
    expect(result.topPerformingDivisions.length).toBeGreaterThan(0)
    for (let i = 0; i < result.topPerformingDivisions.length; i++) {
      expect(result.topPerformingDivisions[i]?.rank).toBe(i + 1)
    }
  })

  it('should calculate correct club count and membership total for divisions', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 25,
        dcpGoals: 8,
      }),
      createMockClub({
        clubId: '2',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 22,
        dcpGoals: 6,
      }),
      createMockClub({
        clubId: '3',
        divisionId: 'A',
        divisionName: 'Division A',
        membershipCount: 18,
        dcpGoals: 4,
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computeLeadershipInsights('D101', [snapshot])

    // Find Division A in top performing divisions
    const divisionA = result.topPerformingDivisions.find(
      d => d.divisionId === 'A'
    )
    expect(divisionA).toBeDefined()
    expect(divisionA?.clubCount).toBe(3)
    expect(divisionA?.membershipTotal).toBe(65) // 25 + 22 + 18
  })
})

describe('computeYearOverYear', () => {
  it('should return dataAvailable=false for empty snapshots', () => {
    const computer = new AnalyticsComputer()
    const result = computer.computeYearOverYear('D101', [], '2024-01-15')

    expect(result.districtId).toBe('D101')
    expect(result.currentDate).toBe('2024-01-15')
    expect(result.previousYearDate).toBe('2023-01-15')
    expect(result.dataAvailable).toBe(false)
    expect(result.message).toBe('No snapshot data available for this district')
    expect(result.metrics).toBeUndefined()
  })

  it('should return dataAvailable=false when district not found in snapshots', () => {
    const computer = new AnalyticsComputer()
    const snapshot = createMockSnapshot('D999', '2024-01-15', [
      createMockClub({ membershipCount: 25 }),
    ])

    const result = computer.computeYearOverYear(
      'D101',
      [snapshot],
      '2024-01-15'
    )

    expect(result.districtId).toBe('D101')
    expect(result.dataAvailable).toBe(false)
    expect(result.message).toBe('No snapshot data available for this district')
  })

  it('should return dataAvailable=false when no previous year data available', () => {
    const computer = new AnalyticsComputer()
    // Only current year snapshot (2024-01-15), no previous year.
    // The previous year target is 2023-01-15, which is 366 days away.
    // The proximity guard (180 days) rejects the only snapshot for the
    // previous-year lookup, so computeYearOverYear returns dataAvailable=false.
    const snapshot = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({ membershipCount: 25 }),
    ])

    const result = computer.computeYearOverYear(
      'D101',
      [snapshot],
      '2024-01-15'
    )

    expect(result.districtId).toBe('D101')
    expect(result.dataAvailable).toBe(false)
    expect(result.message).toContain('Previous year data not available')
  })

  it('should compute year-over-year metrics when both years have data', () => {
    const computer = new AnalyticsComputer()

    // Previous year snapshot
    const previousYearClubs = [
      createMockClub({
        clubId: '1',
        membershipCount: 20,
        dcpGoals: 4,
      }),
      createMockClub({
        clubId: '2',
        membershipCount: 18,
        dcpGoals: 3,
      }),
    ]
    const previousSnapshot = createMockSnapshot(
      'D101',
      '2023-01-15',
      previousYearClubs
    )

    // Current year snapshot
    const currentYearClubs = [
      createMockClub({
        clubId: '1',
        membershipCount: 25,
        dcpGoals: 6,
      }),
      createMockClub({
        clubId: '2',
        membershipCount: 22,
        dcpGoals: 5,
      }),
    ]
    const currentSnapshot = createMockSnapshot(
      'D101',
      '2024-01-15',
      currentYearClubs
    )

    const result = computer.computeYearOverYear(
      'D101',
      [previousSnapshot, currentSnapshot],
      '2024-01-15'
    )

    expect(result.districtId).toBe('D101')
    expect(result.dataAvailable).toBe(true)
    expect(result.metrics).toBeDefined()

    // Membership comparison
    expect(result.metrics?.membership.current).toBe(47) // 25 + 22
    expect(result.metrics?.membership.previous).toBe(38) // 20 + 18
    expect(result.metrics?.membership.change).toBe(9)
    expect(result.metrics?.membership.percentageChange).toBeCloseTo(23.7, 1)

    // Club count comparison
    expect(result.metrics?.clubCount.current).toBe(2)
    expect(result.metrics?.clubCount.previous).toBe(2)
    expect(result.metrics?.clubCount.change).toBe(0)
  })

  it('should compute DCP goals comparison', () => {
    const computer = new AnalyticsComputer()

    const previousSnapshot = createMockSnapshot('D101', '2023-01-15', [
      createMockClub({ clubId: '1', dcpGoals: 3 }),
      createMockClub({ clubId: '2', dcpGoals: 2 }),
    ])

    const currentSnapshot = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({ clubId: '1', dcpGoals: 7 }),
      createMockClub({ clubId: '2', dcpGoals: 5 }),
    ])

    const result = computer.computeYearOverYear(
      'D101',
      [previousSnapshot, currentSnapshot],
      '2024-01-15'
    )

    expect(result.dataAvailable).toBe(true)
    expect(result.metrics?.dcpGoals.totalGoals.current).toBe(12) // 7 + 5
    expect(result.metrics?.dcpGoals.totalGoals.previous).toBe(5) // 3 + 2
    expect(result.metrics?.dcpGoals.totalGoals.change).toBe(7)

    // Average per club
    expect(result.metrics?.dcpGoals.averagePerClub.current).toBe(6) // 12 / 2
    expect(result.metrics?.dcpGoals.averagePerClub.previous).toBe(2.5) // 5 / 2
  })

  it('should compute club health comparison', () => {
    const computer = new AnalyticsComputer()

    // Previous year: 1 thriving, 1 vulnerable
    const previousSnapshot = createMockSnapshot('D101', '2023-01-15', [
      createMockClub({
        clubId: '1',
        membershipCount: 25,
        dcpGoals: 6,
      }), // Thriving
      createMockClub({
        clubId: '2',
        membershipCount: 15,
        dcpGoals: 0,
      }), // Vulnerable
    ])

    // Current year: 2 thriving
    const currentSnapshot = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({
        clubId: '1',
        membershipCount: 28,
        dcpGoals: 8,
      }), // Thriving
      createMockClub({
        clubId: '2',
        membershipCount: 22,
        dcpGoals: 5,
      }), // Thriving
    ])

    const result = computer.computeYearOverYear(
      'D101',
      [previousSnapshot, currentSnapshot],
      '2024-01-15'
    )

    expect(result.dataAvailable).toBe(true)
    expect(result.metrics?.clubHealth).toBeDefined()
    expect(result.metrics?.clubHealth.thrivingClubs.current).toBe(2)
    expect(result.metrics?.clubHealth.thrivingClubs.previous).toBe(1)
    expect(result.metrics?.clubHealth.thrivingClubs.change).toBe(1)
  })

  it('should compute distinguished clubs comparison', () => {
    const computer = new AnalyticsComputer()

    // Previous year: 1 distinguished club
    const previousSnapshot = createMockSnapshot('D101', '2023-01-15', [
      createMockClub({
        clubId: '1',
        membershipCount: 22,
        dcpGoals: 6,
      }), // Distinguished
      createMockClub({
        clubId: '2',
        membershipCount: 18,
        dcpGoals: 3,
      }), // Not distinguished
    ])

    // Current year: 2 distinguished clubs
    const currentSnapshot = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({
        clubId: '1',
        membershipCount: 25,
        dcpGoals: 9,
      }), // President's Distinguished
      createMockClub({
        clubId: '2',
        membershipCount: 22,
        dcpGoals: 7,
      }), // Select Distinguished
    ])

    const result = computer.computeYearOverYear(
      'D101',
      [previousSnapshot, currentSnapshot],
      '2024-01-15'
    )

    expect(result.dataAvailable).toBe(true)
    expect(result.metrics?.distinguishedClubs.current).toBe(2)
    expect(result.metrics?.distinguishedClubs.previous).toBe(1)
    expect(result.metrics?.distinguishedClubs.change).toBe(1)
  })

  it('should generate multi-year trends when sufficient data available', () => {
    const computer = new AnalyticsComputer()

    const snapshots = [
      createMockSnapshot('D101', '2022-01-15', [
        createMockClub({ membershipCount: 20, dcpGoals: 3 }),
      ]),
      createMockSnapshot('D101', '2023-01-15', [
        createMockClub({ membershipCount: 22, dcpGoals: 4 }),
      ]),
      createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ membershipCount: 25, dcpGoals: 6 }),
      ]),
    ]

    const result = computer.computeYearOverYear('D101', snapshots, '2024-01-15')

    expect(result.dataAvailable).toBe(true)
    expect(result.multiYearTrends).toBeDefined()
    expect(result.multiYearTrends?.length).toBeGreaterThanOrEqual(2)

    // Trends should be sorted by year ascending
    if (result.multiYearTrends && result.multiYearTrends.length >= 2) {
      expect(result.multiYearTrends[0]?.year).toBeLessThan(
        result.multiYearTrends[1]?.year ?? 0
      )
    }
  })

  it('should generate multi-year trends based on available data', () => {
    const computer = new AnalyticsComputer()

    const snapshots = [
      createMockSnapshot('D101', '2023-01-15', [
        createMockClub({ membershipCount: 20 }),
      ]),
      createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ membershipCount: 25 }),
      ]),
    ]

    const result = computer.computeYearOverYear('D101', snapshots, '2024-01-15')

    // With 2 years of data, we should have trend points
    expect(result.dataAvailable).toBe(true)
    // The implementation looks back up to 5 years, so with 2 snapshots
    // it will find data for both years
    expect(result.multiYearTrends).toBeDefined()
    expect(result.multiYearTrends?.length).toBeGreaterThanOrEqual(2)
  })

  it('should filter snapshots by district ID', () => {
    const computer = new AnalyticsComputer()

    const snapshotD101_2023 = createMockSnapshot('D101', '2023-01-15', [
      createMockClub({ membershipCount: 20 }),
    ])
    const snapshotD102_2023 = createMockSnapshot('D102', '2023-01-15', [
      createMockClub({ membershipCount: 100 }),
    ])
    const snapshotD101_2024 = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({ membershipCount: 25 }),
    ])
    const snapshotD102_2024 = createMockSnapshot('D102', '2024-01-15', [
      createMockClub({ membershipCount: 120 }),
    ])

    const result = computer.computeYearOverYear(
      'D101',
      [
        snapshotD101_2023,
        snapshotD102_2023,
        snapshotD101_2024,
        snapshotD102_2024,
      ],
      '2024-01-15'
    )

    expect(result.districtId).toBe('D101')
    expect(result.dataAvailable).toBe(true)
    // Should only include D101 data (20 -> 25), not D102 data (100 -> 120)
    expect(result.metrics?.membership.current).toBe(25)
    expect(result.metrics?.membership.previous).toBe(20)
  })

  it('should handle percentage change calculation correctly', () => {
    const computer = new AnalyticsComputer()

    const previousSnapshot = createMockSnapshot('D101', '2023-01-15', [
      createMockClub({ membershipCount: 100 }),
    ])
    const currentSnapshot = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({ membershipCount: 150 }),
    ])

    const result = computer.computeYearOverYear(
      'D101',
      [previousSnapshot, currentSnapshot],
      '2024-01-15'
    )

    expect(result.dataAvailable).toBe(true)
    // 50% increase: (150 - 100) / 100 * 100 = 50
    expect(result.metrics?.membership.percentageChange).toBe(50)
  })

  it('should handle zero previous value in percentage change', () => {
    const computer = new AnalyticsComputer()

    // Previous year: 0 distinguished clubs
    const previousSnapshot = createMockSnapshot('D101', '2023-01-15', [
      createMockClub({ membershipCount: 15, dcpGoals: 2 }), // Not distinguished
    ])

    // Current year: 1 distinguished club
    const currentSnapshot = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({ membershipCount: 22, dcpGoals: 6 }), // Distinguished
    ])

    const result = computer.computeYearOverYear(
      'D101',
      [previousSnapshot, currentSnapshot],
      '2024-01-15'
    )

    expect(result.dataAvailable).toBe(true)
    // When previous is 0 and current > 0, percentage change should be 100
    expect(result.metrics?.distinguishedClubs.percentageChange).toBe(100)
  })

  describe('findSnapshotForDate proximity guard', () => {
    it('should reject a snapshot more than 180 days from the target date', () => {
      const computer = new AnalyticsComputer()
      // Single snapshot at 2024-01-15. Target for previous year is 2023-01-15.
      // Distance: ~366 days — well beyond the 180-day threshold.
      // No same-year match for 2023, so the fallback path triggers and rejects.
      const snapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ membershipCount: 30 }),
      ])

      const result = computer.computeYearOverYear(
        'D101',
        [snapshot],
        '2024-01-15'
      )

      expect(result.dataAvailable).toBe(false)
      expect(result.message).toContain('Previous year data not available')
    })

    it('should return a snapshot within 179 days of the target date', () => {
      const computer = new AnalyticsComputer()
      // Current date: 2024-01-15 → previous year target: 2023-01-15
      // Snapshot at 2022-07-20 is 179 days before 2023-01-15 — within threshold.
      // 2022-07-20 is NOT in the same year as 2023, so the fallback path triggers.
      const nearbySnapshot = createMockSnapshot('D101', '2022-07-20', [
        createMockClub({ membershipCount: 20 }),
      ])
      const currentSnapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ membershipCount: 25 }),
      ])

      const result = computer.computeYearOverYear(
        'D101',
        [nearbySnapshot, currentSnapshot],
        '2024-01-15'
      )

      // Previous year target is 2023-01-15.
      // nearbySnapshot (2022-07-20) is 179 days away — within 180-day threshold.
      // currentSnapshot (2024-01-15) is 365 days away — exceeds threshold.
      // So nearbySnapshot is returned as the previous year data.
      expect(result.dataAvailable).toBe(true)
      expect(result.metrics).toBeDefined()
      expect(result.metrics?.membership.previous).toBe(20)
      expect(result.metrics?.membership.current).toBe(25)
    })

    it('should reject a snapshot 181 days from the target date', () => {
      const computer = new AnalyticsComputer()
      // Current date: 2024-07-15 → previous year target: 2023-07-15
      // Snapshot at 2023-01-15 is 181 days before 2023-07-15 — exceeds threshold.
      // No same-year match for 2023 (only one snapshot in 2023, and it's not
      // in the same year as the target when the target year is 2023 — wait,
      // 2023-01-15 IS in the same year as 2023-07-15. We need a cross-year scenario.
      //
      // Use: current date 2024-01-15 → previous year target 2023-01-15
      // Only snapshot available for previous year lookup: 2022-07-18
      // Distance from 2022-07-18 to 2023-01-15 = 181 days — exceeds threshold.
      const distantSnapshot = createMockSnapshot('D101', '2022-07-18', [
        createMockClub({ membershipCount: 15 }),
      ])
      const currentSnapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ membershipCount: 30 }),
      ])

      const result = computer.computeYearOverYear(
        'D101',
        [distantSnapshot, currentSnapshot],
        '2024-01-15'
      )

      // Previous year target is 2023-01-15.
      // distantSnapshot (2022-07-18) is 181 days away and not same year as 2023.
      // currentSnapshot (2024-01-15) is ~365 days away and not same year as 2023.
      // Both exceed 180 days, so findSnapshotForDate returns undefined.
      expect(result.dataAvailable).toBe(false)
      expect(result.message).toContain('Previous year data not available')
    })

    it('should return an exact date match regardless of other distant snapshots', () => {
      const computer = new AnalyticsComputer()
      // Exact match for previous year target (2023-01-15) should always be returned,
      // even when other snapshots are much closer in absolute distance.
      const exactMatchSnapshot = createMockSnapshot('D101', '2023-01-15', [
        createMockClub({ membershipCount: 18 }),
      ])
      const distantSnapshot = createMockSnapshot('D101', '2020-06-01', [
        createMockClub({ membershipCount: 10 }),
      ])
      const currentSnapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ membershipCount: 28 }),
      ])

      const result = computer.computeYearOverYear(
        'D101',
        [distantSnapshot, exactMatchSnapshot, currentSnapshot],
        '2024-01-15'
      )

      expect(result.dataAvailable).toBe(true)
      expect(result.metrics).toBeDefined()
      // The exact match (2023-01-15) with membership 18 should be used as previous
      expect(result.metrics?.membership.previous).toBe(18)
      expect(result.metrics?.membership.current).toBe(28)
    })

    it('should return a same-year snapshot preserving existing behavior', () => {
      const computer = new AnalyticsComputer()
      // Previous year target: 2023-01-15
      // Snapshot at 2023-06-01 is in the same year (2023) — same-year match wins.
      const sameYearSnapshot = createMockSnapshot('D101', '2023-06-01', [
        createMockClub({ membershipCount: 22 }),
      ])
      const currentSnapshot = createMockSnapshot('D101', '2024-01-15', [
        createMockClub({ membershipCount: 30 }),
      ])

      const result = computer.computeYearOverYear(
        'D101',
        [sameYearSnapshot, currentSnapshot],
        '2024-01-15'
      )

      expect(result.dataAvailable).toBe(true)
      expect(result.metrics).toBeDefined()
      // Same-year snapshot (2023-06-01) with membership 22 should be used as previous
      expect(result.metrics?.membership.previous).toBe(22)
      expect(result.metrics?.membership.current).toBe(30)
    })
  })
})

describe('computePerformanceTargets', () => {
  it('should return zero values for empty snapshots', () => {
    const computer = new AnalyticsComputer()
    const result = computer.computePerformanceTargets('D101', [])

    expect(result.districtId).toBe('D101')
    expect(result.computedAt).toBeDefined()
    expect(result.membershipTarget).toBe(0)
    expect(result.distinguishedTarget).toBe(0)
    expect(result.clubGrowthTarget).toBe(0)
    expect(result.currentProgress.membership).toBe(0)
    expect(result.currentProgress.distinguished).toBe(0)
    expect(result.currentProgress.clubGrowth).toBe(0)
    expect(result.projectedAchievement.membership).toBe(false)
    expect(result.projectedAchievement.distinguished).toBe(false)
    expect(result.projectedAchievement.clubGrowth).toBe(false)
  })

  it('should return zero values when district not found in snapshots', () => {
    const computer = new AnalyticsComputer()
    const snapshot = createMockSnapshot('D999', '2024-01-15', [
      createMockClub({ membershipCount: 25 }),
    ])

    const result = computer.computePerformanceTargets('D101', [snapshot])

    expect(result.districtId).toBe('D101')
    expect(result.membershipTarget).toBe(0)
    expect(result.currentProgress.membership).toBe(0)
  })

  it('should compute membership target as 5% growth from base', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        areaId: 'A1',
        areaName: 'Area A1',
        divisionId: 'A',
        membershipCount: 100,
        paymentsCount: 100, // Set paymentsCount to match expected value
        dcpGoals: 5,
        status: 'Active',
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computePerformanceTargets('D101', [snapshot])

    // Membership target = ceil(100 * 1.05) = 105
    expect(result.membershipTarget).toBe(105)
    // currentProgress.membership now uses totalPayments (sum of paymentsCount)
    expect(result.currentProgress.membership).toBe(100)
  })

  it('should compute distinguished target as 50% of paid clubs', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        areaId: 'A1',
        areaName: 'Area A1',
        divisionId: 'A',
        membershipCount: 25,
        dcpGoals: 6,
        status: 'Active',
      }),
      createMockClub({
        clubId: '2',
        areaId: 'A1',
        areaName: 'Area A1',
        divisionId: 'A',
        membershipCount: 22,
        dcpGoals: 3,
        status: 'Active',
      }),
      createMockClub({
        clubId: '3',
        areaId: 'A1',
        areaName: 'Area A1',
        divisionId: 'A',
        membershipCount: 20,
        dcpGoals: 7,
        status: 'Active',
      }),
      createMockClub({
        clubId: '4',
        areaId: 'A1',
        areaName: 'Area A1',
        divisionId: 'A',
        membershipCount: 18,
        dcpGoals: 2,
        status: 'Active',
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computePerformanceTargets('D101', [snapshot])

    // 4 paid clubs, distinguished target = ceil(4 * 0.5) = 2
    expect(result.distinguishedTarget).toBe(2)
    // 2 clubs have 5+ DCP goals (distinguished)
    expect(result.currentProgress.distinguished).toBe(2)
  })

  it('should compute club growth from base to current', () => {
    const computer = new AnalyticsComputer()

    // Base snapshot with 3 clubs
    const baseClubs = [
      createMockClub({ clubId: '1', areaId: 'A1', divisionId: 'A' }),
      createMockClub({ clubId: '2', areaId: 'A1', divisionId: 'A' }),
      createMockClub({ clubId: '3', areaId: 'A1', divisionId: 'A' }),
    ]
    const baseSnapshot = createMockSnapshot('D101', '2024-01-01', baseClubs)

    // Current snapshot with 5 clubs
    const currentClubs = [
      createMockClub({ clubId: '1', areaId: 'A1', divisionId: 'A' }),
      createMockClub({ clubId: '2', areaId: 'A1', divisionId: 'A' }),
      createMockClub({ clubId: '3', areaId: 'A1', divisionId: 'A' }),
      createMockClub({ clubId: '4', areaId: 'A1', divisionId: 'A' }),
      createMockClub({ clubId: '5', areaId: 'A1', divisionId: 'A' }),
    ]
    const currentSnapshot = createMockSnapshot(
      'D101',
      '2024-03-15',
      currentClubs
    )

    const result = computer.computePerformanceTargets('D101', [
      baseSnapshot,
      currentSnapshot,
    ])

    // Club growth = 5 - 3 = 2
    expect(result.currentProgress.clubGrowth).toBe(2)
    // Club growth target = max(1, ceil(3 * 0.02)) = max(1, 1) = 1
    expect(result.clubGrowthTarget).toBe(1)
  })

  it('should project achievement when progress >= 80%', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        areaId: 'A1',
        areaName: 'Area A1',
        divisionId: 'A',
        membershipCount: 100,
        dcpGoals: 6,
        status: 'Active',
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computePerformanceTargets('D101', [snapshot])

    // Membership: 100 / 105 = 95.2% >= 80% -> projected true
    expect(result.projectedAchievement.membership).toBe(true)
    // Distinguished: 1 / 1 = 100% >= 80% -> projected true
    expect(result.projectedAchievement.distinguished).toBe(true)
  })

  it('should not project achievement when progress < 80%', () => {
    const computer = new AnalyticsComputer()

    // Base snapshot with high membership
    const baseClubs = [
      createMockClub({
        clubId: '1',
        areaId: 'A1',
        divisionId: 'A',
        membershipCount: 100,
        dcpGoals: 2,
        status: 'Active',
      }),
    ]
    const baseSnapshot = createMockSnapshot('D101', '2024-01-01', baseClubs)

    // Current snapshot with lower membership (simulating decline)
    const currentClubs = [
      createMockClub({
        clubId: '1',
        areaId: 'A1',
        divisionId: 'A',
        membershipCount: 70,
        dcpGoals: 2,
        status: 'Active',
      }),
    ]
    const currentSnapshot = createMockSnapshot(
      'D101',
      '2024-03-15',
      currentClubs
    )

    const result = computer.computePerformanceTargets('D101', [
      baseSnapshot,
      currentSnapshot,
    ])

    // Membership: 70 / 105 = 66.7% < 80% -> projected false
    expect(result.projectedAchievement.membership).toBe(false)
    // Distinguished: 0 / 1 = 0% < 80% -> projected false
    expect(result.projectedAchievement.distinguished).toBe(false)
  })

  it('should filter snapshots by district ID', () => {
    const computer = new AnalyticsComputer()

    const snapshotD101 = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({
        clubId: '1',
        areaId: 'A1',
        divisionId: 'A',
        membershipCount: 25,
        paymentsCount: 25, // Set paymentsCount to match expected value
        status: 'Active',
      }),
    ])
    const snapshotD102 = createMockSnapshot('D102', '2024-01-15', [
      createMockClub({
        clubId: '2',
        areaId: 'B1',
        divisionId: 'B',
        membershipCount: 100,
        status: 'Active',
      }),
    ])

    const result = computer.computePerformanceTargets('D101', [
      snapshotD101,
      snapshotD102,
    ])

    // Should only include D101 data
    expect(result.districtId).toBe('D101')
    // currentProgress.membership now uses totalPayments (sum of paymentsCount)
    expect(result.currentProgress.membership).toBe(25)
  })

  it('should handle suspended clubs as not paid', () => {
    const computer = new AnalyticsComputer()
    const clubs = [
      createMockClub({
        clubId: '1',
        areaId: 'A1',
        areaName: 'Area A1',
        divisionId: 'A',
        membershipCount: 25,
        dcpGoals: 6,
        status: 'Active',
      }),
      createMockClub({
        clubId: '2',
        areaId: 'A1',
        areaName: 'Area A1',
        divisionId: 'A',
        membershipCount: 22,
        dcpGoals: 7,
        status: 'Suspended',
      }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    const result = computer.computePerformanceTargets('D101', [snapshot])

    // Only 1 paid club, distinguished target = ceil(1 * 0.5) = 1
    expect(result.distinguishedTarget).toBe(1)
    // Only 1 distinguished club (the active one with 6 DCP goals)
    expect(result.currentProgress.distinguished).toBe(1)
  })

  it('should include computedAt timestamp', () => {
    const computer = new AnalyticsComputer()
    const snapshot = createMockSnapshot('D101', '2024-01-15', [
      createMockClub({ areaId: 'A1', divisionId: 'A' }),
    ])

    const result = computer.computePerformanceTargets('D101', [snapshot])

    expect(result.computedAt).toBeDefined()
    // Should be a valid ISO timestamp
    expect(() => new Date(result.computedAt)).not.toThrow()
  })
})

describe('buildClubTrendsIndex', () => {
  it('should return empty index for empty club health data', () => {
    const computer = new AnalyticsComputer()
    const clubHealth = {
      allClubs: [],
      thrivingClubs: [],
      vulnerableClubs: [],
      interventionRequiredClubs: [],
    }

    const result = computer.buildClubTrendsIndex('D101', clubHealth)

    expect(result.districtId).toBe('D101')
    expect(result.computedAt).toBeDefined()
    expect(Object.keys(result.clubs)).toHaveLength(0)
  })

  it('should build index from allClubs array', () => {
    const computer = new AnalyticsComputer()

    // Create club health data with ClubTrend objects
    const clubHealth = {
      allClubs: [
        {
          clubId: '1001',
          clubName: 'Club Alpha',
          divisionId: 'A',
          divisionName: 'Division A',
          areaId: 'A1',
          areaName: 'Area A1',
          currentStatus: 'thriving' as const,
          healthScore: 1.0,
          membershipCount: 25,
          paymentsCount: 20,
          membershipTrend: [],
          dcpGoalsTrend: [],
          riskFactors: [],
          distinguishedLevel: 'Distinguished' as const,
        },
        {
          clubId: '1002',
          clubName: 'Club Beta',
          divisionId: 'A',
          divisionName: 'Division A',
          areaId: 'A1',
          areaName: 'Area A1',
          currentStatus: 'thriving' as const,
          healthScore: 1.0,
          membershipCount: 30,
          paymentsCount: 25,
          membershipTrend: [],
          dcpGoalsTrend: [],
          riskFactors: [],
          distinguishedLevel: 'Distinguished' as const,
        },
        {
          clubId: '1003',
          clubName: 'Club Gamma',
          divisionId: 'B',
          divisionName: 'Division B',
          areaId: 'B1',
          areaName: 'Area B1',
          currentStatus: 'vulnerable' as const,
          healthScore: 0.5,
          membershipCount: 15,
          paymentsCount: 10,
          membershipTrend: [],
          dcpGoalsTrend: [],
          riskFactors: ['Low membership'],
          distinguishedLevel: 'NotDistinguished' as const,
        },
      ],
      thrivingClubs: [],
      vulnerableClubs: [],
      interventionRequiredClubs: [],
    }

    const result = computer.buildClubTrendsIndex('D101', clubHealth)

    expect(result.districtId).toBe('D101')
    expect(Object.keys(result.clubs)).toHaveLength(3)
    expect(result.clubs['1001']).toBeDefined()
    expect(result.clubs['1002']).toBeDefined()
    expect(result.clubs['1003']).toBeDefined()
  })

  it('should enable O(1) lookup by club ID', () => {
    const computer = new AnalyticsComputer()

    // Create club health data with ClubTrend objects
    const clubHealth = {
      allClubs: [
        {
          clubId: '1001',
          clubName: 'Club Alpha',
          divisionId: 'A',
          divisionName: 'Division A',
          areaId: 'A1',
          areaName: 'Area A1',
          currentStatus: 'thriving' as const,
          healthScore: 1.0,
          membershipCount: 25,
          paymentsCount: 20,
          membershipTrend: [],
          dcpGoalsTrend: [],
          riskFactors: [],
          distinguishedLevel: 'Distinguished' as const,
        },
        {
          clubId: '1002',
          clubName: 'Club Beta',
          divisionId: 'A',
          divisionName: 'Division A',
          areaId: 'A1',
          areaName: 'Area A1',
          currentStatus: 'thriving' as const,
          healthScore: 1.0,
          membershipCount: 30,
          paymentsCount: 25,
          membershipTrend: [],
          dcpGoalsTrend: [],
          riskFactors: [],
          distinguishedLevel: 'Distinguished' as const,
        },
      ],
      thrivingClubs: [],
      vulnerableClubs: [],
      interventionRequiredClubs: [],
    }

    const result = computer.buildClubTrendsIndex('D101', clubHealth)

    // Direct lookup by club ID
    const club1002 = result.clubs['1002']
    expect(club1002).toBeDefined()
    expect(club1002?.clubName).toBe('Club Beta')
    expect(club1002?.membershipCount).toBe(30)
  })

  it('should preserve all ClubTrend properties in the index', () => {
    const computer = new AnalyticsComputer()

    // Create club health data with a club that has all properties
    const clubHealth = {
      allClubs: [
        {
          clubId: '1001',
          clubName: 'Test Club',
          divisionId: 'A',
          divisionName: 'Division A',
          areaId: 'A1',
          areaName: 'Area A1',
          currentStatus: 'thriving' as const,
          healthScore: 1.0,
          membershipCount: 25,
          paymentsCount: 20,
          membershipTrend: [{ date: '2024-01-15', count: 25 }],
          dcpGoalsTrend: [{ date: '2024-01-15', goalsAchieved: 6 }],
          riskFactors: [],
          distinguishedLevel: 'Distinguished' as const,
        },
      ],
      thrivingClubs: [],
      vulnerableClubs: [],
      interventionRequiredClubs: [],
    }

    const result = computer.buildClubTrendsIndex('D101', clubHealth)

    const club = result.clubs['1001']
    expect(club).toBeDefined()
    expect(club?.clubId).toBe('1001')
    expect(club?.clubName).toBe('Test Club')
    expect(club?.divisionId).toBe('A')
    expect(club?.divisionName).toBe('Division A')
    expect(club?.areaId).toBe('A1')
    expect(club?.areaName).toBe('Area A1')
    expect(club?.membershipCount).toBe(25)
    expect(club?.paymentsCount).toBe(20)
    // ClubTrend includes trend arrays
    expect(club?.membershipTrend).toHaveLength(1)
    expect(club?.dcpGoalsTrend).toHaveLength(1)
  })

  it('should include computedAt timestamp', () => {
    const computer = new AnalyticsComputer()
    const clubHealth = {
      allClubs: [],
      thrivingClubs: [],
      vulnerableClubs: [],
      interventionRequiredClubs: [],
    }

    const result = computer.buildClubTrendsIndex('D101', clubHealth)

    expect(result.computedAt).toBeDefined()
    // Should be a valid ISO timestamp
    expect(() => new Date(result.computedAt)).not.toThrow()
  })

  it('should handle clubs with same ID (last one wins)', () => {
    const computer = new AnalyticsComputer()

    // Manually create club health data with duplicate IDs
    // (This shouldn't happen in practice, but tests the behavior)
    const clubHealth = {
      allClubs: [
        {
          clubId: '1001',
          clubName: 'First Club',
          divisionId: 'A',
          divisionName: 'Division A',
          areaId: 'A1',
          areaName: 'Area A1',
          currentStatus: 'thriving' as const,
          healthScore: 1.0,
          membershipCount: 25,
          paymentsCount: 20,
          membershipTrend: [],
          dcpGoalsTrend: [],
          riskFactors: [],
          distinguishedLevel: 'Distinguished' as const,
        },
        {
          clubId: '1001',
          clubName: 'Second Club (Same ID)',
          divisionId: 'B',
          divisionName: 'Division B',
          areaId: 'B1',
          areaName: 'Area B1',
          currentStatus: 'vulnerable' as const,
          healthScore: 0.5,
          membershipCount: 15,
          paymentsCount: 10,
          membershipTrend: [],
          dcpGoalsTrend: [],
          riskFactors: ['Low membership'],
          distinguishedLevel: 'NotDistinguished' as const,
        },
      ],
      thrivingClubs: [],
      vulnerableClubs: [],
      interventionRequiredClubs: [],
    }

    const result = computer.buildClubTrendsIndex('D101', clubHealth)

    // Should have only one entry (last one wins)
    expect(Object.keys(result.clubs)).toHaveLength(1)
    expect(result.clubs['1001']?.clubName).toBe('Second Club (Same ID)')
  })
})

/**
 * Membership Change Calculation Unit Tests
 *
 * Tests for calculateMembershipChangeWithBase via computeDistrictAnalytics.
 * Covers all calculation paths: rankings-based, normalized lookup, and snapshot-based fallback.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

/**
 * Helper to create a minimal AllDistrictsRankingsData structure for testing.
 */
function createRankingsData(
  rankings: Partial<DistrictRanking>[],
  totalDistricts?: number
): AllDistrictsRankingsData {
  const fullRankings: DistrictRanking[] = rankings.map((r, index) => ({
    districtId: r.districtId ?? `${index + 1}`,
    districtName: r.districtName ?? `District ${index + 1}`,
    region: r.region ?? 'Region 1',
    paidClubs: r.paidClubs ?? 100,
    paidClubBase: r.paidClubBase ?? 95,
    clubGrowthPercent: r.clubGrowthPercent ?? 5.0,
    totalPayments: r.totalPayments ?? 5000,
    paymentBase: r.paymentBase ?? 4800,
    paymentGrowthPercent: r.paymentGrowthPercent ?? 4.0,
    activeClubs: r.activeClubs ?? 98,
    distinguishedClubs: r.distinguishedClubs ?? 45,
    selectDistinguished: r.selectDistinguished ?? 15,
    presidentsDistinguished: r.presidentsDistinguished ?? 10,
    distinguishedPercent: r.distinguishedPercent ?? 45.0,
    clubsRank: r.clubsRank ?? index + 1,
    paymentsRank: r.paymentsRank ?? index + 1,
    distinguishedRank: r.distinguishedRank ?? index + 1,
    aggregateScore: r.aggregateScore ?? 150,
    overallRank: r.overallRank ?? index + 1,
  }))

  return {
    metadata: {
      snapshotId: '2024-01-15',
      calculatedAt: '2024-01-15T00:00:00.000Z',
      schemaVersion: '1.0',
      calculationVersion: '1.0',
      rankingVersion: '2.0',
      sourceCsvDate: '2024-01-15',
      csvFetchedAt: '2024-01-15T00:00:00.000Z',
      totalDistricts: totalDistricts ?? fullRankings.length,
      fromCache: false,
    },
    rankings: fullRankings,
  }
}

describe('calculateMembershipChangeWithBase (via computeDistrictAnalytics)', () => {
  /**
   * Requirement 3.1: Verify that membershipChange is correctly computed
   * when All_Districts_Rankings contains the district with valid paymentBase and totalPayments.
   */
  it('should compute membershipChange from rankings when exact districtId match exists', async () => {
    const computer = new AnalyticsComputer()

    const clubs = [
      createMockClub({ clubId: '1', paymentsCount: 30, membershipBase: 25 }),
    ]
    const snapshot = createMockSnapshot('42', '2024-01-15', clubs)

    const rankings = createRankingsData([
      { districtId: '42', totalPayments: 500, paymentBase: 450 },
    ])

    const result = await computer.computeDistrictAnalytics('42', [snapshot], {
      allDistrictsRankings: rankings,
    })

    // Rankings path: totalPayments(500) - paymentBase(450) = 50
    expect(result.districtAnalytics.membershipChange).toBe(50)
  })

  /**
   * Requirement 3.2: Verify that membershipChange is correctly computed
   * via normalized districtId lookup when exact match fails.
   */
  it('should compute membershipChange via normalized lookup when exact match fails (e.g., "D42" vs "42")', async () => {
    const computer = new AnalyticsComputer()

    const clubs = [
      createMockClub({ clubId: '1', paymentsCount: 30, membershipBase: 25 }),
    ]
    // Snapshot uses "D42" as districtId
    const snapshot = createMockSnapshot('D42', '2024-01-15', clubs)

    // Rankings use "42" as districtId (no "D" prefix)
    const rankings = createRankingsData([
      { districtId: '42', totalPayments: 600, paymentBase: 520 },
    ])

    const result = await computer.computeDistrictAnalytics('D42', [snapshot], {
      allDistrictsRankings: rankings,
    })

    // Normalized lookup: "D42" → "42" matches "42" → totalPayments(600) - paymentBase(520) = 80
    expect(result.districtAnalytics.membershipChange).toBe(80)
  })

  /**
   * Requirement 3.3: Verify that membershipChange falls back to snapshot-based
   * calculation when rankings are unavailable (undefined).
   */
  it('should fall back to snapshot-based calculation when rankings are unavailable', async () => {
    const computer = new AnalyticsComputer()

    const clubs = [
      createMockClub({ clubId: '1', paymentsCount: 30, membershipBase: 22 }),
      createMockClub({ clubId: '2', paymentsCount: 25, membershipBase: 20 }),
    ]
    const snapshot = createMockSnapshot('D101', '2024-01-15', clubs)

    // No rankings provided (undefined)
    const result = await computer.computeDistrictAnalytics('D101', [snapshot])

    // Snapshot fallback: sum(paymentsCount) - sum(membershipBase)
    // = (30 + 25) - (22 + 20) = 55 - 42 = 13
    expect(result.districtAnalytics.membershipChange).toBe(13)
  })

  /**
   * Requirement 3.3: Verify that membershipChange falls back to snapshot-based
   * calculation when rankings exist but district is not found.
   */
  it('should fall back to snapshot-based calculation when district not found in rankings', async () => {
    const computer = new AnalyticsComputer()

    const clubs = [
      createMockClub({ clubId: '1', paymentsCount: 40, membershipBase: 35 }),
      createMockClub({ clubId: '2', paymentsCount: 20, membershipBase: 18 }),
    ]
    const snapshot = createMockSnapshot('D999', '2024-01-15', clubs)

    // Rankings exist but don't contain district D999
    const rankings = createRankingsData([
      { districtId: '42', totalPayments: 500, paymentBase: 450 },
      { districtId: '101', totalPayments: 600, paymentBase: 520 },
    ])

    const result = await computer.computeDistrictAnalytics('D999', [snapshot], {
      allDistrictsRankings: rankings,
    })

    // Snapshot fallback: sum(paymentsCount) - sum(membershipBase)
    // = (40 + 20) - (35 + 18) = 60 - 53 = 7
    expect(result.districtAnalytics.membershipChange).toBe(7)
  })

  /**
   * Requirement 3.3: Verify that membershipChange falls back to snapshot-based
   * calculation when paymentBase is null on the matched ranking.
   *
   * Note: The DistrictRanking type defines paymentBase as `number`, so we use
   * a type assertion to simulate the runtime scenario where paymentBase could
   * be null (e.g., from malformed JSON data).
   */
  it('should fall back to snapshot-based calculation when paymentBase is null', async () => {
    const computer = new AnalyticsComputer()

    const clubs = [
      createMockClub({ clubId: '1', paymentsCount: 50, membershipBase: 45 }),
    ]
    const snapshot = createMockSnapshot('42', '2024-01-15', clubs)

    // Create rankings where paymentBase is null (simulating runtime data issue)
    const rankings = createRankingsData([
      { districtId: '42', totalPayments: 500 },
    ])
    // Override paymentBase to null to simulate the runtime scenario
    // The DistrictRanking type says number, but runtime data may have null
    ;(
      rankings.rankings[0] as DistrictRanking & { paymentBase: number | null }
    ).paymentBase = null as unknown as number

    const result = await computer.computeDistrictAnalytics('42', [snapshot], {
      allDistrictsRankings: rankings,
    })

    // Snapshot fallback: sum(paymentsCount) - sum(membershipBase)
    // = 50 - 45 = 5
    expect(result.districtAnalytics.membershipChange).toBe(5)
  })

  /**
   * Requirement 3.4: Verify that membershipChange is 0 when both rankings
   * and snapshot-based fallback yield no meaningful data (empty snapshots).
   */
  it('should return 0 for empty snapshots with no rankings', async () => {
    const computer = new AnalyticsComputer()

    const result = await computer.computeDistrictAnalytics('D101', [])

    expect(result.districtAnalytics.membershipChange).toBe(0)
  })

  /**
   * Additional: Verify that rankings totalPayments is used (not snapshot totalPayments)
   * when the district is found in rankings.
   * Requirement 2.4: Use totalPayments from rankings when district is found.
   */
  it('should use totalPayments from rankings data, not from snapshot', async () => {
    const computer = new AnalyticsComputer()

    // Snapshot has different paymentsCount than rankings totalPayments
    const clubs = [
      createMockClub({ clubId: '1', paymentsCount: 100, membershipBase: 80 }),
    ]
    const snapshot = createMockSnapshot('42', '2024-01-15', clubs)

    // Rankings have totalPayments=700, paymentBase=600
    const rankings = createRankingsData([
      { districtId: '42', totalPayments: 700, paymentBase: 600 },
    ])

    const result = await computer.computeDistrictAnalytics('42', [snapshot], {
      allDistrictsRankings: rankings,
    })

    // Should use rankings totalPayments(700) - paymentBase(600) = 100
    // NOT snapshot-based: paymentsCount(100) - membershipBase(80) = 20
    expect(result.districtAnalytics.membershipChange).toBe(100)
  })

  /**
   * Additional: Verify normalized lookup works in reverse direction
   * (rankings has "D42", search uses "42").
   */
  it('should find district via normalized lookup when rankings has prefix and search does not', async () => {
    const computer = new AnalyticsComputer()

    const clubs = [
      createMockClub({ clubId: '1', paymentsCount: 30, membershipBase: 25 }),
    ]
    const snapshot = createMockSnapshot('42', '2024-01-15', clubs)

    // Rankings use "D42" as districtId (with prefix)
    const rankings = createRankingsData([
      { districtId: 'D42', totalPayments: 300, paymentBase: 250 },
    ])

    const result = await computer.computeDistrictAnalytics('42', [snapshot], {
      allDistrictsRankings: rankings,
    })

    // Normalized lookup: "42" → "42" matches "D42" → "42"
    // totalPayments(300) - paymentBase(250) = 50
    expect(result.districtAnalytics.membershipChange).toBe(50)
  })
})
