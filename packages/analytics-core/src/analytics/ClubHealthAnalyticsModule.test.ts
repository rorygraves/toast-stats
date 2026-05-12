/**
 * ClubHealthAnalyticsModule Unit Tests
 *
 * Tests for club health analytics module enhancements including:
 * - Division/area extraction
 * - Trend array building
 * - Risk factors conversion
 * - Distinguished level calculation
 * - Payment field extraction
 * - Club status extraction
 *
 * Requirements: 2.1-2.7, 9.1, 9.2
 */

import { describe, it, expect } from 'vitest'
import { ClubHealthAnalyticsModule } from './ClubHealthAnalyticsModule.js'
import type { DistrictStatistics, ClubStatistics } from '../interfaces.js'
import type { ClubTrend } from '../types.js'

/**
 * Helper to create a mock club with specified properties
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
    clubStatus: 'Active',
    ...overrides,
  }
}

/**
 * Helper to create a mock district statistics snapshot
 */
function createMockSnapshot(
  snapshotDate: string,
  clubs: ClubStatistics[] = []
): DistrictStatistics {
  const totalMembership = clubs.reduce((sum, c) => sum + c.membershipCount, 0)
  const totalPayments = clubs.reduce((sum, c) => sum + c.paymentsCount, 0)

  return {
    districtId: 'D101',
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

describe('ClubHealthAnalyticsModule', () => {
  describe('Division/Area Extraction (Requirements 2.1, 4.3)', () => {
    it('should extract division and area info when present', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        divisionId: 'B',
        divisionName: 'Division B',
        areaId: 'B2',
        areaName: 'Area B2',
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs).toHaveLength(1)
      expect(result.allClubs[0]?.divisionId).toBe('B')
      expect(result.allClubs[0]?.divisionName).toBe('Division B')
      expect(result.allClubs[0]?.areaId).toBe('B2')
      expect(result.allClubs[0]?.areaName).toBe('Area B2')
    })

    it('should use defaults when division info is missing', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        divisionId: '',
        divisionName: '',
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs).toHaveLength(1)
      expect(result.allClubs[0]?.divisionId).toBe('Unknown')
      expect(result.allClubs[0]?.divisionName).toBe('Unknown Division')
    })

    it('should use defaults when area info is missing', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        areaId: '',
        areaName: '',
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs).toHaveLength(1)
      expect(result.allClubs[0]?.areaId).toBe('Unknown')
      expect(result.allClubs[0]?.areaName).toBe('Unknown Area')
    })

    it('should handle undefined division/area values with defaults', () => {
      const module = new ClubHealthAnalyticsModule()
      // Create a club with undefined values by casting
      const club = {
        ...createMockClub({ clubId: '1' }),
        divisionId: undefined as unknown as string,
        divisionName: undefined as unknown as string,
        areaId: undefined as unknown as string,
        areaName: undefined as unknown as string,
      }
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs).toHaveLength(1)
      expect(result.allClubs[0]?.divisionId).toBe('Unknown')
      expect(result.allClubs[0]?.divisionName).toBe('Unknown Division')
      expect(result.allClubs[0]?.areaId).toBe('Unknown')
      expect(result.allClubs[0]?.areaName).toBe('Unknown Area')
    })
  })

  describe('Trend Array Building (Requirements 2.2, 2.3, 5.3, 5.4)', () => {
    it('should build membership trend array with single snapshot', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({ clubId: '1', membershipCount: 25 })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs).toHaveLength(1)
      expect(result.allClubs[0]?.membershipTrend).toHaveLength(1)
      expect(result.allClubs[0]?.membershipTrend[0]).toEqual({
        date: '2024-01-15',
        count: 25,
      })
    })

    it('should build DCP goals trend array with single snapshot', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({ clubId: '1', dcpGoals: 7 })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs).toHaveLength(1)
      expect(result.allClubs[0]?.dcpGoalsTrend).toHaveLength(1)
      expect(result.allClubs[0]?.dcpGoalsTrend[0]).toEqual({
        date: '2024-01-15',
        goalsAchieved: 7,
      })
    })

    it('should build membership trend array with multiple snapshots', () => {
      const module = new ClubHealthAnalyticsModule()
      const snapshot1 = createMockSnapshot('2024-01-01', [
        createMockClub({ clubId: '1', membershipCount: 20 }),
      ])
      const snapshot2 = createMockSnapshot('2024-02-01', [
        createMockClub({ clubId: '1', membershipCount: 22 }),
      ])
      const snapshot3 = createMockSnapshot('2024-03-01', [
        createMockClub({ clubId: '1', membershipCount: 25 }),
      ])

      const result = module.generateClubHealthData([
        snapshot1,
        snapshot2,
        snapshot3,
      ])

      expect(result.allClubs).toHaveLength(1)
      expect(result.allClubs[0]?.membershipTrend).toHaveLength(3)
      expect(result.allClubs[0]?.membershipTrend).toEqual([
        { date: '2024-01-01', count: 20 },
        { date: '2024-02-01', count: 22 },
        { date: '2024-03-01', count: 25 },
      ])
    })

    it('should build DCP goals trend array with multiple snapshots', () => {
      const module = new ClubHealthAnalyticsModule()
      const snapshot1 = createMockSnapshot('2024-01-01', [
        createMockClub({ clubId: '1', dcpGoals: 3 }),
      ])
      const snapshot2 = createMockSnapshot('2024-02-01', [
        createMockClub({ clubId: '1', dcpGoals: 5 }),
      ])
      const snapshot3 = createMockSnapshot('2024-03-01', [
        createMockClub({ clubId: '1', dcpGoals: 7 }),
      ])

      const result = module.generateClubHealthData([
        snapshot1,
        snapshot2,
        snapshot3,
      ])

      expect(result.allClubs).toHaveLength(1)
      expect(result.allClubs[0]?.dcpGoalsTrend).toHaveLength(3)
      expect(result.allClubs[0]?.dcpGoalsTrend).toEqual([
        { date: '2024-01-01', goalsAchieved: 3 },
        { date: '2024-02-01', goalsAchieved: 5 },
        { date: '2024-03-01', goalsAchieved: 7 },
      ])
    })

    it('should handle club appearing in only some snapshots', () => {
      const module = new ClubHealthAnalyticsModule()
      // Club 1 appears in all snapshots, Club 2 only in later snapshots
      const snapshot1 = createMockSnapshot('2024-01-01', [
        createMockClub({ clubId: '1', membershipCount: 20 }),
      ])
      const snapshot2 = createMockSnapshot('2024-02-01', [
        createMockClub({ clubId: '1', membershipCount: 22 }),
        createMockClub({ clubId: '2', membershipCount: 15 }),
      ])
      const snapshot3 = createMockSnapshot('2024-03-01', [
        createMockClub({ clubId: '1', membershipCount: 25 }),
        createMockClub({ clubId: '2', membershipCount: 18 }),
      ])

      const result = module.generateClubHealthData([
        snapshot1,
        snapshot2,
        snapshot3,
      ])

      // Club 1 should have 3 trend entries
      const club1 = result.allClubs.find(c => c.clubId === '1')
      expect(club1?.membershipTrend).toHaveLength(3)

      // Club 2 should have 2 trend entries (only in snapshots 2 and 3)
      const club2 = result.allClubs.find(c => c.clubId === '2')
      expect(club2?.membershipTrend).toHaveLength(2)
      expect(club2?.membershipTrend).toEqual([
        { date: '2024-02-01', count: 15 },
        { date: '2024-03-01', count: 18 },
      ])
    })

    it('should return empty arrays for empty snapshots', () => {
      const module = new ClubHealthAnalyticsModule()

      const result = module.generateClubHealthData([])

      expect(result.allClubs).toHaveLength(0)
    })
  })

  describe('Risk Factors Conversion (Requirement 2.6)', () => {
    it('should return empty array when no risk factors present', () => {
      const module = new ClubHealthAnalyticsModule()
      // Thriving club with no risk factors
      const club = createMockClub({
        clubId: '1',
        membershipCount: 25,
        paymentsCount: 25,
        dcpGoals: 5,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.riskFactors).toEqual([])
    })

    it('should include membership risk factor when membership is below threshold', () => {
      const module = new ClubHealthAnalyticsModule()
      // Club with low membership (< 12 triggers intervention)
      const club = createMockClub({
        clubId: '1',
        membershipCount: 10,
        dcpGoals: 0,
        membershipBase: 10, // No net growth
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      // Hardened backend uses detailed risk factor messages
      expect(
        result.allClubs[0]?.riskFactors.some(rf =>
          rf.includes('Membership below 12')
        )
      ).toBe(true)
    })

    it('should include membership threshold risk factor when membership decreases below threshold', () => {
      const module = new ClubHealthAnalyticsModule()
      // Club with membership below 20 and no net growth - should be vulnerable
      const snapshot = createMockSnapshot('2024-02-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 15,
          dcpGoals: 0,
          membershipBase: 15,
        }),
      ])

      const result = module.generateClubHealthData([snapshot])

      // Hardened backend adds risk factor for membership below threshold
      expect(
        result.allClubs[0]?.riskFactors.some(rf =>
          rf.includes('Membership below threshold')
        )
      ).toBe(true)
    })

    it('should include DCP checkpoint risk factor when DCP goals are below threshold', () => {
      const module = new ClubHealthAnalyticsModule()
      // Club with membership >= 20 but no DCP goals - should be vulnerable due to DCP checkpoint
      const club = createMockClub({
        clubId: '1',
        membershipCount: 20,
        paymentsCount: 20,
        dcpGoals: 0, // No DCP goals
        membershipBase: 20,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      // Hardened backend adds risk factor for DCP checkpoint not met
      expect(
        result.allClubs[0]?.riskFactors.some(rf =>
          rf.includes('DCP checkpoint not met')
        )
      ).toBe(true)
    })

    it('should include multiple risk factors when applicable', () => {
      const module = new ClubHealthAnalyticsModule()
      // Club with membership below threshold and no DCP goals
      const snapshot = createMockSnapshot('2024-02-01', [
        createMockClub({
          clubId: '1',
          membershipCount: 15,
          paymentsCount: 3,
          dcpGoals: 0,
          membershipBase: 15,
        }),
      ])

      const result = module.generateClubHealthData([snapshot])

      // Should have both membership threshold and DCP checkpoint risk factors
      expect(
        result.allClubs[0]?.riskFactors.some(rf =>
          rf.includes('Membership below threshold')
        )
      ).toBe(true)
      expect(
        result.allClubs[0]?.riskFactors.some(rf =>
          rf.includes('DCP checkpoint not met')
        )
      ).toBe(true)
    })
  })

  describe('Distinguished Level Calculation (Requirement 2.7)', () => {
    /**
     * Distinguished Level Thresholds:
     * - Smedley: 10+ goals AND 25+ members
     * - President's: 9+ goals AND 20+ members
     * - Select: 7+ goals AND (20+ members OR 5+ net growth)
     * - Distinguished: 5+ goals AND (20+ members OR 3+ net growth)
     * - NotDistinguished: Does not meet any threshold
     */

    it('should classify as Smedley with 10 goals and 25 members', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 10,
        membershipCount: 25,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.distinguishedLevel).toBe('Smedley')
    })

    it('should classify as President with 9 goals and 25 members (not Smedley)', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 9,
        membershipCount: 25,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.distinguishedLevel).toBe('President')
    })

    it('should classify as NotDistinguished with 9 goals and 19 members (membership too low)', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 9,
        membershipCount: 19,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.distinguishedLevel).toBe('NotDistinguished')
    })

    it('should classify as Select with 7 goals and 20 members', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 7,
        membershipCount: 20,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.distinguishedLevel).toBe('Select')
    })

    it('should classify as Select with 7 goals, 15 members, and 5+ net growth', () => {
      const module = new ClubHealthAnalyticsModule()
      // Net growth is calculated from membershipBase, not from trend history
      // Net growth = membershipCount - membershipBase = 15 - 10 = 5
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 7,
        membershipCount: 15,
        membershipBase: 10, // Net growth = 15 - 10 = 5
      })
      const snapshot = createMockSnapshot('2024-02-01', [club])

      const result = module.generateClubHealthData([snapshot])

      // Net growth = 15 - 10 = 5, which qualifies for Select
      expect(result.allClubs[0]?.distinguishedLevel).toBe('Select')
    })

    it('should classify as Distinguished with 5 goals and 20 members', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 5,
        membershipCount: 20,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.distinguishedLevel).toBe('Distinguished')
    })

    it('should classify as NotDistinguished with 4 goals and 25 members (goals too low)', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 4,
        membershipCount: 25,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.distinguishedLevel).toBe('NotDistinguished')
    })

    it('should classify as Distinguished with 5 goals, 15 members, and 3+ net growth', () => {
      const module = new ClubHealthAnalyticsModule()
      // Net growth is calculated from membershipBase, not from trend history
      // Net growth = membershipCount - membershipBase = 15 - 12 = 3
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 5,
        membershipCount: 15,
        membershipBase: 12, // Net growth = 15 - 12 = 3
      })
      const snapshot = createMockSnapshot('2024-02-01', [club])

      const result = module.generateClubHealthData([snapshot])

      // Net growth = 15 - 12 = 3, which qualifies for Distinguished
      expect(result.allClubs[0]?.distinguishedLevel).toBe('Distinguished')
    })

    it('should classify as NotDistinguished with 5 goals, 15 members, and only 2 net growth', () => {
      const module = new ClubHealthAnalyticsModule()
      // Create snapshots showing net growth of only 2
      const snapshot1 = createMockSnapshot('2024-01-01', [
        createMockClub({ clubId: '1', dcpGoals: 3, membershipCount: 13 }),
      ])
      const snapshot2 = createMockSnapshot('2024-02-01', [
        createMockClub({ clubId: '1', dcpGoals: 5, membershipCount: 15 }),
      ])

      const result = module.generateClubHealthData([snapshot1, snapshot2])

      // Net growth = 15 - 13 = 2, not enough for Distinguished (needs 3)
      expect(result.allClubs[0]?.distinguishedLevel).toBe('NotDistinguished')
    })

    it('should handle boundary case: exactly at Smedley threshold', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 10,
        membershipCount: 25,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.distinguishedLevel).toBe('Smedley')
    })

    it('should handle boundary case: just below Smedley threshold (10 goals, 24 members)', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        dcpGoals: 10,
        membershipCount: 24,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      // 10 goals but only 24 members -> President (not Smedley)
      expect(result.allClubs[0]?.distinguishedLevel).toBe('President')
    })
  })

  describe('Find-A-Club Enrichment Propagation (#503)', () => {
    // Regression: snapshots produced by the daily pipeline carry FAC
    // enrichment fields (charterDate / coordinates / address / email /
    // etc.) on each ClubStatistics row after FindAClubMerger runs.
    // Analytics must forward these onto ClubTrend so the frontend
    // Club hero (which reads from the analytics JSON) can render the
    // CHARTERED eyebrow.
    it('forwards charterDate from ClubStatistics to ClubTrend', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = {
        ...createMockClub({ clubId: '1' }),
        charterDate: '1987-02-15',
      }
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.charterDate).toBe('1987-02-15')
    })

    it('forwards coordinates / address / contact / meeting fields', () => {
      const module = new ClubHealthAnalyticsModule()
      const enriched = {
        ...createMockClub({ clubId: '1' }),
        charterDate: '1987-02-15',
        coordinates: { lat: 45.42, lng: -75.69 },
        address: {
          street: '300 Ottawa Ave',
          city: 'Ottawa',
          region: 'ON',
          postalCode: 'K1A 0A0',
          country: 'Canada',
        },
        email: 'officers-180@toastmastersclubs.org',
        phone: '+13039128450',
        website: 'http://180.toastmastersclubs.org/',
        facebookLink: 'https://www.facebook.com/test',
        meetingDay: 'Tuesday',
        meetingTime: '7:00 pm',
        allowsVirtualAttendance: false,
        isProspective: false,
      }
      const snapshot = createMockSnapshot('2024-01-15', [enriched])

      const result = module.generateClubHealthData([snapshot])
      const out = result.allClubs[0]

      expect(out?.charterDate).toBe('1987-02-15')
      expect(out?.coordinates).toEqual({ lat: 45.42, lng: -75.69 })
      expect(out?.address?.city).toBe('Ottawa')
      expect(out?.email).toBe('officers-180@toastmastersclubs.org')
      expect(out?.phone).toBe('+13039128450')
      expect(out?.website).toBe('http://180.toastmastersclubs.org/')
      expect(out?.facebookLink).toBe('https://www.facebook.com/test')
      expect(out?.meetingDay).toBe('Tuesday')
      expect(out?.meetingTime).toBe('7:00 pm')
      expect(out?.allowsVirtualAttendance).toBe(false)
      expect(out?.isProspective).toBe(false)
    })

    it('leaves FAC fields undefined when ClubStatistics has none (graceful absence)', () => {
      const module = new ClubHealthAnalyticsModule()
      const bare = createMockClub({ clubId: '1' })
      const snapshot = createMockSnapshot('2024-01-15', [bare])

      const result = module.generateClubHealthData([snapshot])
      const out = result.allClubs[0]

      expect(out?.charterDate).toBeUndefined()
      expect(out?.coordinates).toBeUndefined()
      expect(out?.email).toBeUndefined()
    })
  })

  describe('Payment Field Extraction (Requirement 2.4)', () => {
    it('should extract all payment fields when present', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        octoberRenewals: 12,
        aprilRenewals: 8,
        newMembers: 5,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.octoberRenewals).toBe(12)
      expect(result.allClubs[0]?.aprilRenewals).toBe(8)
      expect(result.allClubs[0]?.newMembers).toBe(5)
    })

    it('should default to 0 when payment fields are missing', () => {
      const module = new ClubHealthAnalyticsModule()
      // Create club with undefined payment fields
      const club = {
        ...createMockClub({ clubId: '1' }),
        octoberRenewals: undefined as unknown as number,
        aprilRenewals: undefined as unknown as number,
        newMembers: undefined as unknown as number,
      }
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.octoberRenewals).toBe(0)
      expect(result.allClubs[0]?.aprilRenewals).toBe(0)
      expect(result.allClubs[0]?.newMembers).toBe(0)
    })

    it('should handle zero payment values correctly', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        octoberRenewals: 0,
        aprilRenewals: 0,
        newMembers: 0,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.octoberRenewals).toBe(0)
      expect(result.allClubs[0]?.aprilRenewals).toBe(0)
      expect(result.allClubs[0]?.newMembers).toBe(0)
    })

    it('should handle partial payment fields (some present, some missing)', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = {
        ...createMockClub({ clubId: '1' }),
        octoberRenewals: 10,
        aprilRenewals: undefined as unknown as number,
        newMembers: 3,
      }
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.octoberRenewals).toBe(10)
      expect(result.allClubs[0]?.aprilRenewals).toBe(0)
      expect(result.allClubs[0]?.newMembers).toBe(3)
    })
  })

  describe('CSP Submission Status (#290)', () => {
    it('should default cspSubmitted to true when undefined (pre-2025)', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({ clubId: '1' })
      // Ensure cspSubmitted is undefined (pre-2025 data)
      delete (club as Record<string, unknown>)['cspSubmitted']
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.cspSubmitted).toBe(true)
    })

    it('should set cspSubmitted to false when club has not submitted', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        cspSubmitted: false,
      })
      const snapshot = createMockSnapshot('2025-10-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.cspSubmitted).toBe(false)
    })

    it('should set cspSubmitted to true when club has submitted', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        cspSubmitted: true,
      })
      const snapshot = createMockSnapshot('2025-10-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.cspSubmitted).toBe(true)
    })
  })

  describe('Club Status Extraction (Requirements 9.1, 9.2)', () => {
    it('should extract "Active" club status', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        clubStatus: 'Active',
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.clubStatus).toBe('Active')
    })

    it('should extract "Suspended" club status', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        clubStatus: 'Suspended',
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.clubStatus).toBe('Suspended')
    })

    it('should extract "Low" club status', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        clubStatus: 'Low',
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.clubStatus).toBe('Low')
    })

    it('should extract "Ineligible" club status', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        clubStatus: 'Ineligible',
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.clubStatus).toBe('Ineligible')
    })

    it('should return undefined when club status is not available', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        clubStatus: undefined,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs[0]?.clubStatus).toBeUndefined()
    })

    it('should pass through unknown status values', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        clubStatus: 'UnknownStatus',
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      // Unknown values should be passed through as-is
      expect(result.allClubs[0]?.clubStatus).toBe('UnknownStatus')
    })
  })

  describe('Club Health Categorization', () => {
    it('should categorize thriving clubs correctly', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        membershipCount: 25,
        paymentsCount: 25,
        dcpGoals: 5,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.thrivingClubs).toHaveLength(1)
      expect(result.thrivingClubs[0]?.clubId).toBe('1')
      expect(result.vulnerableClubs).toHaveLength(0)
      expect(result.interventionRequiredClubs).toHaveLength(0)
    })

    it('should categorize intervention required clubs correctly', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        membershipCount: 10, // < 12
        dcpGoals: 0,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.interventionRequiredClubs).toHaveLength(1)
      expect(result.interventionRequiredClubs[0]?.clubId).toBe('1')
      expect(result.thrivingClubs).toHaveLength(0)
    })

    it('should categorize vulnerable clubs correctly', () => {
      const module = new ClubHealthAnalyticsModule()
      const club = createMockClub({
        clubId: '1',
        membershipCount: 15, // >= 12 but < 20
        dcpGoals: 0,
      })
      const snapshot = createMockSnapshot('2024-01-15', [club])

      const result = module.generateClubHealthData([snapshot])

      expect(result.vulnerableClubs).toHaveLength(1)
      expect(result.vulnerableClubs[0]?.clubId).toBe('1')
    })

    it('should include all clubs in allClubs array', () => {
      const module = new ClubHealthAnalyticsModule()
      const clubs = [
        createMockClub({ clubId: '1', membershipCount: 25, dcpGoals: 5 }),
        createMockClub({ clubId: '2', membershipCount: 15, dcpGoals: 0 }),
        createMockClub({ clubId: '3', membershipCount: 10, dcpGoals: 0 }),
      ]
      const snapshot = createMockSnapshot('2024-01-15', clubs)

      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs).toHaveLength(3)
      expect(result.allClubs.map(c => c.clubId).sort()).toEqual(['1', '2', '3'])
    })
  })

  describe('calculateClubHealthScore', () => {
    it('should return 1.0 for thriving club (membership >= 20 and dcpGoals >= 5)', () => {
      const module = new ClubHealthAnalyticsModule()

      expect(module.calculateClubHealthScore(20, 5)).toBe(1.0)
      expect(module.calculateClubHealthScore(25, 7)).toBe(1.0)
    })

    it('should return 0.5 for moderate club (membership >= 12 or dcpGoals >= 3)', () => {
      const module = new ClubHealthAnalyticsModule()

      expect(module.calculateClubHealthScore(15, 2)).toBe(0.5)
      expect(module.calculateClubHealthScore(10, 4)).toBe(0.5)
    })

    it('should return 0.0 for at-risk club (membership < 12 and dcpGoals < 3)', () => {
      const module = new ClubHealthAnalyticsModule()

      expect(module.calculateClubHealthScore(10, 2)).toBe(0.0)
      expect(module.calculateClubHealthScore(8, 1)).toBe(0.0)
    })
  })

  /**
   * Verification test for Task 7.1: Verify allClubs contains complete ClubTrend objects
   *
   * This test ensures all required fields are populated in the ClubTrend objects
   * within the allClubs array, as specified in Requirement 3.1.
   *
   * Required fields per ClubTrend type:
   * - clubId, clubName (core identification)
   * - divisionId, divisionName, areaId, areaName (location info)
   * - currentStatus, healthScore (health assessment)
   * - membershipCount, paymentsCount (membership data)
   * - membershipTrend (array), dcpGoalsTrend (array) (trend data)
   * - riskFactors (string array)
   * - distinguishedLevel
   * - octoberRenewals, aprilRenewals, newMembers (optional payment breakdown)
   * - clubStatus (optional operational status)
   */
  describe('ClubTrend Completeness Verification (Requirement 3.1)', () => {
    it('should populate all required ClubTrend fields in allClubs output', () => {
      const module = new ClubHealthAnalyticsModule()

      // Create a comprehensive club with all fields populated
      const club = createMockClub({
        clubId: '12345',
        clubName: 'Excellence Speakers',
        divisionId: 'C',
        divisionName: 'Division C',
        areaId: 'C3',
        areaName: 'Area C3',
        membershipCount: 28,
        paymentsCount: 25,
        dcpGoals: 8,
        status: 'Active',
        octoberRenewals: 15,
        aprilRenewals: 8,
        newMembers: 5,
        membershipBase: 20,
        clubStatus: 'Active',
      })

      const snapshot = createMockSnapshot('2024-03-15', [club])
      const result = module.generateClubHealthData([snapshot])

      // Verify we have exactly one club in allClubs
      expect(result.allClubs).toHaveLength(1)
      const clubTrend = result.allClubs[0]!

      // Verify core identification fields
      expect(clubTrend.clubId).toBe('12345')
      expect(clubTrend.clubName).toBe('Excellence Speakers')

      // Verify division and area information (Requirements 1.1, 1.2)
      expect(clubTrend.divisionId).toBe('C')
      expect(clubTrend.divisionName).toBe('Division C')
      expect(clubTrend.areaId).toBe('C3')
      expect(clubTrend.areaName).toBe('Area C3')

      // Verify health assessment fields
      expect(clubTrend.currentStatus).toBeDefined()
      expect(['thriving', 'vulnerable', 'intervention-required']).toContain(
        clubTrend.currentStatus
      )
      expect(typeof clubTrend.healthScore).toBe('number')
      expect(clubTrend.healthScore).toBeGreaterThanOrEqual(0)
      expect(clubTrend.healthScore).toBeLessThanOrEqual(1)

      // Verify membership and payments
      expect(clubTrend.membershipCount).toBe(28)
      expect(clubTrend.paymentsCount).toBe(25)

      // Verify trend arrays (Requirements 1.3, 1.4)
      expect(Array.isArray(clubTrend.membershipTrend)).toBe(true)
      expect(clubTrend.membershipTrend.length).toBeGreaterThanOrEqual(1)
      expect(clubTrend.membershipTrend[0]).toHaveProperty('date')
      expect(clubTrend.membershipTrend[0]).toHaveProperty('count')

      expect(Array.isArray(clubTrend.dcpGoalsTrend)).toBe(true)
      expect(clubTrend.dcpGoalsTrend.length).toBeGreaterThanOrEqual(1)
      expect(clubTrend.dcpGoalsTrend[0]).toHaveProperty('date')
      expect(clubTrend.dcpGoalsTrend[0]).toHaveProperty('goalsAchieved')

      // Verify risk factors as string array (Requirement 1.6)
      expect(Array.isArray(clubTrend.riskFactors)).toBe(true)
      // All elements should be strings
      clubTrend.riskFactors.forEach(factor => {
        expect(typeof factor).toBe('string')
      })

      // Verify distinguished level (Requirement 1.5)
      expect(clubTrend.distinguishedLevel).toBeDefined()
      expect([
        'NotDistinguished',
        'Smedley',
        'President',
        'Select',
        'Distinguished',
      ]).toContain(clubTrend.distinguishedLevel)

      // Verify payment breakdown fields (Requirement 1.7)
      expect(clubTrend.octoberRenewals).toBe(15)
      expect(clubTrend.aprilRenewals).toBe(8)
      expect(clubTrend.newMembers).toBe(5)

      // Verify club status (Requirement 1.8)
      expect(clubTrend.clubStatus).toBe('Active')
    })

    it('should populate all required fields for multiple clubs with varying data', () => {
      const module = new ClubHealthAnalyticsModule()

      // Create multiple clubs with different characteristics
      const clubs = [
        createMockClub({
          clubId: '1001',
          clubName: 'Thriving Club',
          divisionId: 'A',
          divisionName: 'Division A',
          areaId: 'A1',
          areaName: 'Area A1',
          membershipCount: 30,
          paymentsCount: 28,
          dcpGoals: 10,
          octoberRenewals: 20,
          aprilRenewals: 5,
          newMembers: 5,
          clubStatus: 'Active',
        }),
        createMockClub({
          clubId: '1002',
          clubName: 'Vulnerable Club',
          divisionId: 'B',
          divisionName: 'Division B',
          areaId: 'B2',
          areaName: 'Area B2',
          membershipCount: 15,
          paymentsCount: 10,
          dcpGoals: 2,
          octoberRenewals: 8,
          aprilRenewals: 2,
          newMembers: 0,
          clubStatus: 'Low',
        }),
        createMockClub({
          clubId: '1003',
          clubName: 'Intervention Club',
          divisionId: 'C',
          divisionName: 'Division C',
          areaId: 'C3',
          areaName: 'Area C3',
          membershipCount: 8,
          paymentsCount: 5,
          dcpGoals: 0,
          octoberRenewals: 3,
          aprilRenewals: 2,
          newMembers: 0,
          clubStatus: 'Suspended',
        }),
      ]

      const snapshot = createMockSnapshot('2024-03-15', clubs)
      const result = module.generateClubHealthData([snapshot])

      // Verify all clubs are in allClubs
      expect(result.allClubs).toHaveLength(3)

      // Verify each club has all required fields populated
      for (const clubTrend of result.allClubs) {
        // Core identification
        expect(clubTrend.clubId).toBeDefined()
        expect(clubTrend.clubId.length).toBeGreaterThan(0)
        expect(clubTrend.clubName).toBeDefined()
        expect(clubTrend.clubName.length).toBeGreaterThan(0)

        // Division/Area info
        expect(clubTrend.divisionId).toBeDefined()
        expect(clubTrend.divisionName).toBeDefined()
        expect(clubTrend.areaId).toBeDefined()
        expect(clubTrend.areaName).toBeDefined()

        // Health assessment
        expect(clubTrend.currentStatus).toBeDefined()
        expect(typeof clubTrend.healthScore).toBe('number')

        // Membership data
        expect(typeof clubTrend.membershipCount).toBe('number')
        expect(typeof clubTrend.paymentsCount).toBe('number')

        // Trend arrays
        expect(Array.isArray(clubTrend.membershipTrend)).toBe(true)
        expect(Array.isArray(clubTrend.dcpGoalsTrend)).toBe(true)

        // Risk factors
        expect(Array.isArray(clubTrend.riskFactors)).toBe(true)

        // Distinguished level
        expect(clubTrend.distinguishedLevel).toBeDefined()

        // Payment fields (should be numbers, defaulting to 0 if not provided)
        expect(typeof clubTrend.octoberRenewals).toBe('number')
        expect(typeof clubTrend.aprilRenewals).toBe('number')
        expect(typeof clubTrend.newMembers).toBe('number')
      }
    })

    it('should populate trend arrays correctly with multiple snapshots', () => {
      const module = new ClubHealthAnalyticsModule()

      // Create snapshots showing progression over time
      const snapshot1 = createMockSnapshot('2024-01-15', [
        createMockClub({
          clubId: '2001',
          clubName: 'Growing Club',
          membershipCount: 18,
          dcpGoals: 3,
        }),
      ])
      const snapshot2 = createMockSnapshot('2024-02-15', [
        createMockClub({
          clubId: '2001',
          clubName: 'Growing Club',
          membershipCount: 22,
          dcpGoals: 5,
        }),
      ])
      const snapshot3 = createMockSnapshot('2024-03-15', [
        createMockClub({
          clubId: '2001',
          clubName: 'Growing Club',
          membershipCount: 25,
          dcpGoals: 7,
        }),
      ])

      const result = module.generateClubHealthData([
        snapshot1,
        snapshot2,
        snapshot3,
      ])

      expect(result.allClubs).toHaveLength(1)
      const clubTrend = result.allClubs[0]!

      // Verify membership trend has entries for all snapshots
      expect(clubTrend.membershipTrend).toHaveLength(3)
      expect(clubTrend.membershipTrend[0]).toEqual({
        date: '2024-01-15',
        count: 18,
      })
      expect(clubTrend.membershipTrend[1]).toEqual({
        date: '2024-02-15',
        count: 22,
      })
      expect(clubTrend.membershipTrend[2]).toEqual({
        date: '2024-03-15',
        count: 25,
      })

      // Verify DCP goals trend has entries for all snapshots
      expect(clubTrend.dcpGoalsTrend).toHaveLength(3)
      expect(clubTrend.dcpGoalsTrend[0]).toEqual({
        date: '2024-01-15',
        goalsAchieved: 3,
      })
      expect(clubTrend.dcpGoalsTrend[1]).toEqual({
        date: '2024-02-15',
        goalsAchieved: 5,
      })
      expect(clubTrend.dcpGoalsTrend[2]).toEqual({
        date: '2024-03-15',
        goalsAchieved: 7,
      })
    })

    it('should handle missing optional fields gracefully with defaults', () => {
      const module = new ClubHealthAnalyticsModule()

      // Create a club with minimal data (missing optional fields)
      const club = {
        clubId: '3001',
        clubName: 'Minimal Club',
        divisionId: '',
        areaId: '',
        divisionName: '',
        areaName: '',
        membershipCount: 20,
        paymentsCount: 15,
        dcpGoals: 4,
        status: 'Active',
        octoberRenewals: undefined as unknown as number,
        aprilRenewals: undefined as unknown as number,
        newMembers: undefined as unknown as number,
        membershipBase: 18,
        clubStatus: undefined,
      }

      const snapshot = createMockSnapshot('2024-03-15', [club])
      const result = module.generateClubHealthData([snapshot])

      expect(result.allClubs).toHaveLength(1)
      const clubTrend = result.allClubs[0]!

      // Verify defaults are applied for missing division/area
      expect(clubTrend.divisionId).toBe('Unknown')
      expect(clubTrend.divisionName).toBe('Unknown Division')
      expect(clubTrend.areaId).toBe('Unknown')
      expect(clubTrend.areaName).toBe('Unknown Area')

      // Verify payment fields default to 0
      expect(clubTrend.octoberRenewals).toBe(0)
      expect(clubTrend.aprilRenewals).toBe(0)
      expect(clubTrend.newMembers).toBe(0)

      // Verify clubStatus is undefined when not provided
      expect(clubTrend.clubStatus).toBeUndefined()

      // All other required fields should still be populated
      expect(clubTrend.clubId).toBe('3001')
      expect(clubTrend.clubName).toBe('Minimal Club')
      expect(clubTrend.currentStatus).toBeDefined()
      expect(typeof clubTrend.healthScore).toBe('number')
      expect(Array.isArray(clubTrend.membershipTrend)).toBe(true)
      expect(Array.isArray(clubTrend.dcpGoalsTrend)).toBe(true)
      expect(Array.isArray(clubTrend.riskFactors)).toBe(true)
      expect(clubTrend.distinguishedLevel).toBeDefined()
    })
  })

  /**
   * Verification tests for Task 7.2: Verify categorized club arrays are complete
   *
   * This test suite ensures that vulnerableClubs, thrivingClubs, and
   * interventionRequiredClubs contain complete ClubTrend objects with all
   * required fields - the same complete objects as in allClubs.
   *
   * Requirements: 3.2, 3.3, 3.4
   */
  describe('Categorized Club Arrays Completeness (Requirements 3.2, 3.3, 3.4)', () => {
    /**
     * Helper function to verify a ClubTrend object has all required fields
     */
    function verifyClubTrendCompleteness(
      club: ClubTrend,
      context: string
    ): void {
      // Core identification fields
      expect(club.clubId, `${context}: clubId should be defined`).toBeDefined()
      expect(
        club.clubName,
        `${context}: clubName should be defined`
      ).toBeDefined()

      // Division and area information (Requirements 1.1, 1.2)
      expect(
        club.divisionId,
        `${context}: divisionId should be defined`
      ).toBeDefined()
      expect(
        club.divisionName,
        `${context}: divisionName should be defined`
      ).toBeDefined()
      expect(club.areaId, `${context}: areaId should be defined`).toBeDefined()
      expect(
        club.areaName,
        `${context}: areaName should be defined`
      ).toBeDefined()

      // Health assessment fields
      expect(
        club.currentStatus,
        `${context}: currentStatus should be defined`
      ).toBeDefined()
      expect(
        ['thriving', 'vulnerable', 'intervention-required'],
        `${context}: currentStatus should be valid`
      ).toContain(club.currentStatus)
      expect(
        typeof club.healthScore,
        `${context}: healthScore should be a number`
      ).toBe('number')

      // Membership data
      expect(
        typeof club.membershipCount,
        `${context}: membershipCount should be a number`
      ).toBe('number')
      expect(
        typeof club.paymentsCount,
        `${context}: paymentsCount should be a number`
      ).toBe('number')

      // Trend arrays (Requirements 1.3, 1.4)
      expect(
        Array.isArray(club.membershipTrend),
        `${context}: membershipTrend should be an array`
      ).toBe(true)
      expect(
        Array.isArray(club.dcpGoalsTrend),
        `${context}: dcpGoalsTrend should be an array`
      ).toBe(true)

      // Risk factors as string array (Requirement 1.6)
      expect(
        Array.isArray(club.riskFactors),
        `${context}: riskFactors should be an array`
      ).toBe(true)

      // Distinguished level (Requirement 1.5)
      expect(
        club.distinguishedLevel,
        `${context}: distinguishedLevel should be defined`
      ).toBeDefined()
      expect(
        ['NotDistinguished', 'Smedley', 'President', 'Select', 'Distinguished'],
        `${context}: distinguishedLevel should be valid`
      ).toContain(club.distinguishedLevel)

      // Payment fields (Requirement 1.7) - should be numbers (defaulting to 0)
      expect(
        typeof club.octoberRenewals,
        `${context}: octoberRenewals should be a number`
      ).toBe('number')
      expect(
        typeof club.aprilRenewals,
        `${context}: aprilRenewals should be a number`
      ).toBe('number')
      expect(
        typeof club.newMembers,
        `${context}: newMembers should be a number`
      ).toBe('number')
    }

    it('should have complete ClubTrend objects in thrivingClubs (Requirement 3.3)', () => {
      const module = new ClubHealthAnalyticsModule()

      // Create a thriving club (membership >= 20, DCP checkpoint met)
      const thrivingClub = createMockClub({
        clubId: 'thriving-1',
        clubName: 'Thriving Speakers',
        divisionId: 'A',
        divisionName: 'Division A',
        areaId: 'A1',
        areaName: 'Area A1',
        membershipCount: 30,
        paymentsCount: 28,
        dcpGoals: 8,
        octoberRenewals: 20,
        aprilRenewals: 5,
        newMembers: 5,
        clubStatus: 'Active',
      })

      const snapshot = createMockSnapshot('2024-03-15', [thrivingClub])
      const result = module.generateClubHealthData([snapshot])

      // Verify the club is categorized as thriving
      expect(result.thrivingClubs).toHaveLength(1)

      // Verify the thriving club has all required fields
      const club = result.thrivingClubs[0]!
      verifyClubTrendCompleteness(club, 'thrivingClubs[0]')

      // Verify it's the same object as in allClubs
      const allClubsMatch = result.allClubs.find(c => c.clubId === club.clubId)
      expect(allClubsMatch).toBeDefined()
      expect(club).toEqual(allClubsMatch)
    })

    it('should have complete ClubTrend objects in vulnerableClubs (Requirement 3.2)', () => {
      const module = new ClubHealthAnalyticsModule()

      // Create a vulnerable club (membership >= 12 but < 20, DCP checkpoint not met)
      const vulnerableClub = createMockClub({
        clubId: 'vulnerable-1',
        clubName: 'Vulnerable Speakers',
        divisionId: 'B',
        divisionName: 'Division B',
        areaId: 'B2',
        areaName: 'Area B2',
        membershipCount: 15,
        paymentsCount: 10,
        dcpGoals: 1,
        octoberRenewals: 8,
        aprilRenewals: 2,
        newMembers: 0,
        clubStatus: 'Low',
      })

      const snapshot = createMockSnapshot('2024-03-15', [vulnerableClub])
      const result = module.generateClubHealthData([snapshot])

      // Verify the club is categorized as vulnerable
      expect(result.vulnerableClubs).toHaveLength(1)

      // Verify the vulnerable club has all required fields
      const club = result.vulnerableClubs[0]!
      verifyClubTrendCompleteness(club, 'vulnerableClubs[0]')

      // Verify it's the same object as in allClubs
      const allClubsMatch = result.allClubs.find(c => c.clubId === club.clubId)
      expect(allClubsMatch).toBeDefined()
      expect(club).toEqual(allClubsMatch)
    })

    it('should have complete ClubTrend objects in interventionRequiredClubs (Requirement 3.4)', () => {
      const module = new ClubHealthAnalyticsModule()

      // Create an intervention required club (membership < 12 AND net growth < 3)
      const interventionClub = createMockClub({
        clubId: 'intervention-1',
        clubName: 'Intervention Speakers',
        divisionId: 'C',
        divisionName: 'Division C',
        areaId: 'C3',
        areaName: 'Area C3',
        membershipCount: 8,
        paymentsCount: 5,
        dcpGoals: 0,
        octoberRenewals: 3,
        aprilRenewals: 2,
        newMembers: 0,
        clubStatus: 'Suspended',
      })

      const snapshot = createMockSnapshot('2024-03-15', [interventionClub])
      const result = module.generateClubHealthData([snapshot])

      // Verify the club is categorized as intervention required
      expect(result.interventionRequiredClubs).toHaveLength(1)

      // Verify the intervention club has all required fields
      const club = result.interventionRequiredClubs[0]!
      verifyClubTrendCompleteness(club, 'interventionRequiredClubs[0]')

      // Verify it's the same object as in allClubs
      const allClubsMatch = result.allClubs.find(c => c.clubId === club.clubId)
      expect(allClubsMatch).toBeDefined()
      expect(club).toEqual(allClubsMatch)
    })

    it('should have all categorized clubs be complete when multiple categories are populated', () => {
      const module = new ClubHealthAnalyticsModule()

      // Create clubs for each category
      const clubs = [
        // Thriving club
        createMockClub({
          clubId: 'multi-thriving',
          clubName: 'Multi Thriving',
          divisionId: 'A',
          divisionName: 'Division A',
          areaId: 'A1',
          areaName: 'Area A1',
          membershipCount: 25,
          paymentsCount: 25,
          dcpGoals: 7,
          octoberRenewals: 15,
          aprilRenewals: 5,
          newMembers: 5,
          clubStatus: 'Active',
        }),
        // Vulnerable club
        createMockClub({
          clubId: 'multi-vulnerable',
          clubName: 'Multi Vulnerable',
          divisionId: 'B',
          divisionName: 'Division B',
          areaId: 'B2',
          areaName: 'Area B2',
          membershipCount: 16,
          paymentsCount: 12,
          dcpGoals: 2,
          octoberRenewals: 10,
          aprilRenewals: 2,
          newMembers: 0,
          clubStatus: 'Active',
        }),
        // Intervention required club
        createMockClub({
          clubId: 'multi-intervention',
          clubName: 'Multi Intervention',
          divisionId: 'C',
          divisionName: 'Division C',
          areaId: 'C3',
          areaName: 'Area C3',
          membershipCount: 9,
          paymentsCount: 6,
          dcpGoals: 1,
          octoberRenewals: 4,
          aprilRenewals: 2,
          newMembers: 0,
          clubStatus: 'Suspended',
        }),
      ]

      const snapshot = createMockSnapshot('2024-03-15', clubs)
      const result = module.generateClubHealthData([snapshot])

      // Verify all categories have clubs
      expect(result.allClubs).toHaveLength(3)
      expect(result.thrivingClubs.length).toBeGreaterThanOrEqual(1)
      expect(result.vulnerableClubs.length).toBeGreaterThanOrEqual(1)
      expect(result.interventionRequiredClubs.length).toBeGreaterThanOrEqual(1)

      // Verify all thriving clubs are complete
      for (const club of result.thrivingClubs) {
        verifyClubTrendCompleteness(club, `thrivingClubs[${club.clubId}]`)
        const allClubsMatch = result.allClubs.find(
          c => c.clubId === club.clubId
        )
        expect(allClubsMatch).toBeDefined()
        expect(club).toEqual(allClubsMatch)
      }

      // Verify all vulnerable clubs are complete
      for (const club of result.vulnerableClubs) {
        verifyClubTrendCompleteness(club, `vulnerableClubs[${club.clubId}]`)
        const allClubsMatch = result.allClubs.find(
          c => c.clubId === club.clubId
        )
        expect(allClubsMatch).toBeDefined()
        expect(club).toEqual(allClubsMatch)
      }

      // Verify all intervention required clubs are complete
      for (const club of result.interventionRequiredClubs) {
        verifyClubTrendCompleteness(
          club,
          `interventionRequiredClubs[${club.clubId}]`
        )
        const allClubsMatch = result.allClubs.find(
          c => c.clubId === club.clubId
        )
        expect(allClubsMatch).toBeDefined()
        expect(club).toEqual(allClubsMatch)
      }
    })

    it('should have categorized clubs with complete trend arrays from multiple snapshots', () => {
      const module = new ClubHealthAnalyticsModule()

      // Create snapshots showing progression over time
      const snapshot1 = createMockSnapshot('2024-01-15', [
        createMockClub({
          clubId: 'trend-club',
          clubName: 'Trend Club',
          membershipCount: 18,
          dcpGoals: 3,
        }),
      ])
      const snapshot2 = createMockSnapshot('2024-02-15', [
        createMockClub({
          clubId: 'trend-club',
          clubName: 'Trend Club',
          membershipCount: 22,
          dcpGoals: 5,
        }),
      ])
      const snapshot3 = createMockSnapshot('2024-03-15', [
        createMockClub({
          clubId: 'trend-club',
          clubName: 'Trend Club',
          membershipCount: 25,
          dcpGoals: 7,
        }),
      ])

      const result = module.generateClubHealthData([
        snapshot1,
        snapshot2,
        snapshot3,
      ])

      // The club should be thriving (membership >= 20, DCP checkpoint met)
      expect(result.thrivingClubs).toHaveLength(1)
      const club = result.thrivingClubs[0]!

      // Verify trend arrays have entries for all snapshots
      expect(club.membershipTrend).toHaveLength(3)
      expect(club.dcpGoalsTrend).toHaveLength(3)

      // Verify trend data is correct
      expect(club.membershipTrend).toEqual([
        { date: '2024-01-15', count: 18 },
        { date: '2024-02-15', count: 22 },
        { date: '2024-03-15', count: 25 },
      ])
      expect(club.dcpGoalsTrend).toEqual([
        { date: '2024-01-15', goalsAchieved: 3 },
        { date: '2024-02-15', goalsAchieved: 5 },
        { date: '2024-03-15', goalsAchieved: 7 },
      ])

      // Verify it's the same object as in allClubs
      const allClubsMatch = result.allClubs.find(c => c.clubId === club.clubId)
      expect(club).toEqual(allClubsMatch)
    })

    it('should have categorized clubs with correct payment fields', () => {
      const module = new ClubHealthAnalyticsModule()

      const club = createMockClub({
        clubId: 'payment-club',
        clubName: 'Payment Club',
        membershipCount: 15,
        paymentsCount: 10,
        dcpGoals: 2,
        octoberRenewals: 12,
        aprilRenewals: 6,
        newMembers: 4,
      })

      const snapshot = createMockSnapshot('2024-03-15', [club])
      const result = module.generateClubHealthData([snapshot])

      // Club should be vulnerable (membership < 20, DCP checkpoint not met)
      expect(result.vulnerableClubs).toHaveLength(1)
      const categorizedClub = result.vulnerableClubs[0]!

      // Verify payment fields are preserved in categorized array
      expect(categorizedClub.octoberRenewals).toBe(12)
      expect(categorizedClub.aprilRenewals).toBe(6)
      expect(categorizedClub.newMembers).toBe(4)

      // Verify it matches allClubs
      const allClubsMatch = result.allClubs.find(
        c => c.clubId === categorizedClub.clubId
      )
      expect(categorizedClub.octoberRenewals).toBe(
        allClubsMatch?.octoberRenewals
      )
      expect(categorizedClub.aprilRenewals).toBe(allClubsMatch?.aprilRenewals)
      expect(categorizedClub.newMembers).toBe(allClubsMatch?.newMembers)
    })

    it('should have categorized clubs with correct clubStatus', () => {
      const module = new ClubHealthAnalyticsModule()

      const clubs = [
        createMockClub({
          clubId: 'status-active',
          membershipCount: 25,
          dcpGoals: 7,
          clubStatus: 'Active',
        }),
        createMockClub({
          clubId: 'status-suspended',
          membershipCount: 8,
          dcpGoals: 0,
          clubStatus: 'Suspended',
        }),
      ]

      const snapshot = createMockSnapshot('2024-03-15', clubs)
      const result = module.generateClubHealthData([snapshot])

      // Find the thriving club (Active status)
      const thrivingClub = result.thrivingClubs.find(
        c => c.clubId === 'status-active'
      )
      expect(thrivingClub).toBeDefined()
      expect(thrivingClub?.clubStatus).toBe('Active')

      // Find the intervention club (Suspended status)
      const interventionClub = result.interventionRequiredClubs.find(
        c => c.clubId === 'status-suspended'
      )
      expect(interventionClub).toBeDefined()
      expect(interventionClub?.clubStatus).toBe('Suspended')

      // Verify they match allClubs
      const allActiveClub = result.allClubs.find(
        c => c.clubId === 'status-active'
      )
      const allSuspendedClub = result.allClubs.find(
        c => c.clubId === 'status-suspended'
      )
      expect(thrivingClub?.clubStatus).toBe(allActiveClub?.clubStatus)
      expect(interventionClub?.clubStatus).toBe(allSuspendedClub?.clubStatus)
    })
  })
})
