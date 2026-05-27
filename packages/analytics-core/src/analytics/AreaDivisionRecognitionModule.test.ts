/**
 * AreaDivisionRecognitionModule Unit Tests
 *
 * Tests for Distinguished Area Program (DAP) and Distinguished Division Program (DDP)
 * recognition calculations per steering document dap-ddp-recognition.md.
 *
 * Per testing.md Section 7.3: "Would 5 well-chosen examples provide equivalent confidence?
 * If yes, prefer the examples." - These boundary tests are clearer than properties.
 *
 * Requirements: 7.1, 2.1, 2.2
 */

import { describe, it, expect } from 'vitest'
import { AreaDivisionRecognitionModule } from './AreaDivisionRecognitionModule.js'
import type { DistrictStatistics, ClubStatistics } from '../interfaces.js'

/**
 * Helper to create a mock club with specified properties
 */
function createMockClub(
  clubId: string,
  divisionId: string,
  areaId: string,
  membershipCount: number,
  dcpGoals: number,
  status = 'Active'
): ClubStatistics {
  return {
    clubId,
    clubName: `Test Club ${clubId}`,
    divisionId,
    areaId,
    divisionName: `Division ${divisionId}`,
    areaName: `Area ${areaId}`,
    membershipCount,
    paymentsCount: membershipCount,
    dcpGoals,
    status,
    clubStatus: status,
    octoberRenewals: Math.floor(membershipCount * 0.4),
    aprilRenewals: Math.floor(membershipCount * 0.3),
    newMembers: Math.floor(membershipCount * 0.3),
    membershipBase: membershipCount,
  }
}

/**
 * Helper to create a mock club with explicit membershipBase for net growth testing.
 * Net growth = membershipCount - membershipBase
 *
 * @param clubId - Club identifier
 * @param divisionId - Division identifier
 * @param areaId - Area identifier
 * @param membershipCount - Current membership count
 * @param dcpGoals - Number of DCP goals achieved
 * @param membershipBase - Membership base for net growth calculation
 * @param status - Club status (default: 'Active')
 */
function createMockClubWithNetGrowth(
  clubId: string,
  divisionId: string,
  areaId: string,
  membershipCount: number,
  dcpGoals: number,
  membershipBase: number,
  status = 'Active'
): ClubStatistics {
  return {
    clubId,
    clubName: `Test Club ${clubId}`,
    divisionId,
    areaId,
    divisionName: `Division ${divisionId}`,
    areaName: `Area ${areaId}`,
    membershipCount,
    paymentsCount: membershipCount,
    dcpGoals,
    status,
    clubStatus: status,
    octoberRenewals: Math.floor(membershipCount * 0.4),
    aprilRenewals: Math.floor(membershipCount * 0.3),
    newMembers: Math.floor(membershipCount * 0.3),
    membershipBase,
  }
}

/**
 * Helper to create a mock district statistics snapshot
 */
function createMockSnapshot(clubs: ClubStatistics[]): DistrictStatistics {
  const totalMembership = clubs.reduce((sum, c) => sum + c.membershipCount, 0)
  const totalPayments = clubs.reduce((sum, c) => sum + c.paymentsCount, 0)

  return {
    districtId: 'D101',
    snapshotDate: '2024-01-15',
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

describe('AreaDivisionRecognitionModule', () => {
  describe('calculateAreaRecognition', () => {
    it('should return empty array for snapshot with no clubs', () => {
      const module = new AreaDivisionRecognitionModule()
      const snapshot = createMockSnapshot([])

      const areas = module.calculateAreaRecognition(snapshot)

      expect(areas).toHaveLength(0)
    })

    it('should calculate recognition for each area', () => {
      const module = new AreaDivisionRecognitionModule()
      const clubs = [
        createMockClub('1', 'A', 'A1', 20, 5),
        createMockClub('2', 'A', 'A2', 20, 5),
        createMockClub('3', 'B', 'B1', 20, 5),
      ]
      const snapshot = createMockSnapshot(clubs)

      const areas = module.calculateAreaRecognition(snapshot)

      expect(areas).toHaveLength(3)
    })

    it('should aggregate clubs in the same area', () => {
      const module = new AreaDivisionRecognitionModule()
      const clubs = [
        createMockClub('1', 'A', 'A1', 20, 5),
        createMockClub('2', 'A', 'A1', 20, 7),
        createMockClub('3', 'A', 'A1', 20, 3),
      ]
      const snapshot = createMockSnapshot(clubs)

      const areas = module.calculateAreaRecognition(snapshot)

      expect(areas).toHaveLength(1)
      expect(areas[0]?.totalClubs).toBe(3)
    })
  })

  describe('Club Paid Status', () => {
    it('should count Active clubs as paid', () => {
      const module = new AreaDivisionRecognitionModule()
      const clubs = [createMockClub('1', 'A', 'A1', 20, 5, 'Active')]
      const snapshot = createMockSnapshot(clubs)

      const areas = module.calculateAreaRecognition(snapshot)

      expect(areas[0]?.paidClubs).toBe(1)
    })

    it('should count Suspended clubs as not paid', () => {
      const module = new AreaDivisionRecognitionModule()
      const clubs = [createMockClub('1', 'A', 'A1', 20, 5, 'Suspended')]
      const snapshot = createMockSnapshot(clubs)

      const areas = module.calculateAreaRecognition(snapshot)

      expect(areas[0]?.paidClubs).toBe(0)
    })

    it('should count clubs with empty status as paid', () => {
      const module = new AreaDivisionRecognitionModule()
      const clubs = [createMockClub('1', 'A', 'A1', 20, 5, '')]
      const snapshot = createMockSnapshot(clubs)

      const areas = module.calculateAreaRecognition(snapshot)

      expect(areas[0]?.paidClubs).toBe(1)
    })
  })

  describe('Club Distinguished Status', () => {
    it('should count clubs with 5+ DCP goals as distinguished', () => {
      const module = new AreaDivisionRecognitionModule()
      const clubs = [createMockClub('1', 'A', 'A1', 20, 5, 'Active')]
      const snapshot = createMockSnapshot(clubs)

      const areas = module.calculateAreaRecognition(snapshot)

      expect(areas[0]?.distinguishedClubs).toBe(1)
    })

    it('should not count clubs with < 5 DCP goals as distinguished', () => {
      const module = new AreaDivisionRecognitionModule()
      const clubs = [createMockClub('1', 'A', 'A1', 20, 4, 'Active')]
      const snapshot = createMockSnapshot(clubs)

      const areas = module.calculateAreaRecognition(snapshot)

      expect(areas[0]?.distinguishedClubs).toBe(0)
    })

    it('should only count paid clubs as distinguished', () => {
      const module = new AreaDivisionRecognitionModule()
      const clubs = [
        createMockClub('1', 'A', 'A1', 20, 5, 'Active'), // Paid and distinguished
        createMockClub('2', 'A', 'A1', 20, 5, 'Suspended'), // Not paid, so not counted
      ]
      const snapshot = createMockSnapshot(clubs)

      const areas = module.calculateAreaRecognition(snapshot)

      expect(areas[0]?.distinguishedClubs).toBe(1)
    })
  })
})

/**
 * Distinguished Club Boundary Condition Tests
 *
 * Per testing.md Section 9: "Threshold-based logic MUST be protected by tests
 * that name the rule and cover boundary conditions."
 *
 * These tests validate the official Toastmasters DCP criteria:
 * - Distinguished: 5+ DCP goals AND (20+ members OR 3+ net growth)
 * - Select Distinguished: 7+ DCP goals AND (20+ members OR 5+ net growth)
 * - President's Distinguished: 9+ DCP goals AND 20+ members
 * - Smedley Award: 10 DCP goals AND 25+ members
 *
 * **Validates: Requirements 2.1, 2.2**
 */
describe('Distinguished Club Boundary Conditions', () => {
  /**
   * Helper to check if a club is distinguished via area recognition.
   * Since isClubDistinguished is private, we test it indirectly through
   * calculateAreaRecognition which uses it internally.
   */
  function isClubDistinguishedViaAreaRecognition(
    club: ClubStatistics
  ): boolean {
    const module = new AreaDivisionRecognitionModule()
    const snapshot = createMockSnapshot([club])
    const areas = module.calculateAreaRecognition(snapshot)
    return areas[0]?.distinguishedClubs === 1
  }

  /**
   * Rule: Minimum 5 goals required
   *
   * A club with fewer than 5 DCP goals should never be distinguished,
   * regardless of membership count or net growth.
   *
   * Test Case: 4 goals, 25 members, 5 net growth → Not Distinguished
   *
   * **Validates: Requirements 2.1**
   */
  it('Minimum 5 goals required - club with 4 goals is not distinguished', () => {
    // 4 goals, 25 members, net growth = 25 - 20 = 5
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 25, 4, 20)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(false)
  })

  /**
   * Rule: 5+ goals + 20+ members
   *
   * A club with 5+ DCP goals AND 20+ members qualifies as Distinguished.
   *
   * Test Case: 5 goals, 20 members, 0 net growth → Distinguished
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('5+ goals + 20+ members - club qualifies via membership path', () => {
    // 5 goals, 20 members, net growth = 20 - 20 = 0
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 20, 5, 20)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(true)
  })

  /**
   * Rule: 5+ goals + 3+ net growth
   *
   * A club with 5+ DCP goals AND 3+ net growth qualifies as Distinguished,
   * even with fewer than 20 members.
   *
   * Test Case: 5 goals, 15 members, 3 net growth → Distinguished
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('5+ goals + 3+ net growth - club qualifies via net growth path', () => {
    // 5 goals, 15 members, net growth = 15 - 12 = 3
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 15, 5, 12)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(true)
  })

  /**
   * Rule: Needs 20 members OR 3+ growth
   *
   * A club with 5+ DCP goals but insufficient membership (< 20) AND
   * insufficient net growth (< 3) should NOT be distinguished.
   *
   * Test Case: 5 goals, 19 members, 2 net growth → Not Distinguished
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('Needs 20 members OR 3+ growth - club with neither is not distinguished', () => {
    // 5 goals, 19 members, net growth = 19 - 17 = 2
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 19, 5, 17)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(false)
  })

  /**
   * Rule: 7+ goals + 20+ members (Select Distinguished)
   *
   * A club with 7+ DCP goals AND 20+ members qualifies as Select Distinguished.
   *
   * Test Case: 7 goals, 20 members, 0 net growth → Distinguished
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('7+ goals + 20+ members - club qualifies for Select via membership path', () => {
    // 7 goals, 20 members, net growth = 20 - 20 = 0
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 20, 7, 20)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(true)
  })

  /**
   * Rule: 7+ goals + 5+ net growth (Select Distinguished)
   *
   * A club with 7+ DCP goals AND 5+ net growth qualifies as Select Distinguished,
   * even with fewer than 20 members.
   *
   * Test Case: 7 goals, 15 members, 5 net growth → Distinguished
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('7+ goals + 5+ net growth - club qualifies for Select via net growth path', () => {
    // 7 goals, 15 members, net growth = 15 - 10 = 5
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 15, 7, 10)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(true)
  })

  /**
   * Rule: 9+ goals + 20+ members (President's Distinguished)
   *
   * A club with 9+ DCP goals AND 20+ members qualifies as President's Distinguished.
   *
   * Test Case: 9 goals, 20 members, 0 net growth → Distinguished
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('9+ goals + 20+ members - club qualifies for Presidents Distinguished', () => {
    // 9 goals, 20 members, net growth = 20 - 20 = 0
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 20, 9, 20)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(true)
  })

  /**
   * Rule: 10 goals + 25+ members (Smedley Award)
   *
   * A club with 10 DCP goals AND 25+ members qualifies for Smedley Award.
   *
   * Test Case: 10 goals, 25 members, 0 net growth → Distinguished
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('10 goals + 25+ members - club qualifies for Smedley Award', () => {
    // 10 goals, 25 members, net growth = 25 - 25 = 0
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 25, 10, 25)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(true)
  })

  /**
   * Rule: Graceful handling of missing data
   *
   * When membershipBase is 0 (simulating missing/default value),
   * net growth equals membershipCount. A club with 5+ goals and
   * 20+ members should still be distinguished.
   *
   * Test Case: 5 goals, 20 members, membershipBase = 0 → Distinguished
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('Graceful handling of missing data - membershipBase defaults to 0', () => {
    // 5 goals, 20 members, membershipBase = 0 (missing/default)
    // net growth = 20 - 0 = 20 (which is >= 3)
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 20, 5, 0)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(true)
  })

  /**
   * Additional boundary test: Exact threshold for Distinguished (5 goals, 19 members, 3 net growth)
   *
   * A club at the exact boundary of net growth threshold should be distinguished.
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('Exact net growth threshold - 5 goals, 19 members, exactly 3 net growth is distinguished', () => {
    // 5 goals, 19 members, net growth = 19 - 16 = 3 (exactly at threshold)
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 19, 5, 16)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(true)
  })

  /**
   * Additional boundary test: Just below net growth threshold
   *
   * A club with net growth of 2 (just below 3) should NOT be distinguished
   * when membership is also below 20.
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('Just below net growth threshold - 5 goals, 19 members, 2 net growth is not distinguished', () => {
    // 5 goals, 19 members, net growth = 19 - 17 = 2 (just below threshold)
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 19, 5, 17)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(false)
  })

  /**
   * Additional boundary test: Select level with insufficient net growth
   *
   * A club with 7 goals, < 20 members, and net growth of 4 (< 5 required for Select)
   * should still be distinguished via the Distinguished criteria (net growth >= 3).
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('Select level with insufficient net growth - falls back to Distinguished criteria', () => {
    // 7 goals, 15 members, net growth = 15 - 11 = 4 (< 5 for Select, but >= 3 for Distinguished)
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 15, 7, 11)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    // Should be distinguished via Distinguished criteria (5+ goals, 3+ net growth)
    expect(isDistinguished).toBe(true)
  })

  /**
   * Additional boundary test: Negative net growth with sufficient membership
   *
   * A club with negative net growth (membership declined) but sufficient
   * membership (20+) should still be distinguished.
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('Negative net growth with sufficient membership - club is still distinguished', () => {
    // 5 goals, 20 members, net growth = 20 - 25 = -5 (negative)
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 20, 5, 25)

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    // Should be distinguished via membership path (20+ members)
    expect(isDistinguished).toBe(true)
  })

  /**
   * Rule: CSP required for Distinguished (2025-2026+) (#311)
   *
   * A club that meets DCP/membership requirements but has not submitted
   * its Club Success Plan should NOT be counted as Distinguished.
   * This matches DistinguishedClubAnalyticsModule behavior.
   */
  it('CSP required - club without CSP is not distinguished', () => {
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 25, 9, 20)
    club.cspSubmitted = false

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(false)
  })

  it('CSP submitted - club with CSP is distinguished', () => {
    const club = createMockClubWithNetGrowth('1', 'A', 'A1', 25, 9, 20)
    club.cspSubmitted = true

    const isDistinguished = isClubDistinguishedViaAreaRecognition(club)

    expect(isDistinguished).toBe(true)
  })
})
