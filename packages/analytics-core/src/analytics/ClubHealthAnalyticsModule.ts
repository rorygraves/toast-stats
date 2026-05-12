/**
 * Club Health Analytics Module
 *
 * Handles at-risk club identification, health scores, and club trend analysis.
 * This is the hardened version moved from backend/src/services/analytics/ClubHealthAnalyticsModule.ts
 * and adapted to work with DistrictStatistics[] instead of IAnalyticsDataSource.
 *
 * KEY FEATURES (preserved from backend):
 * 1. identifyAtRiskClubs() returning vulnerable clubs
 * 2. getClubTrends() for individual club lookup
 * 3. assessClubHealth() with CSP status checking
 * 4. extractMembershipPayments() for Oct/Apr renewals and new members
 * 5. extractClubStatus() for club operational status
 * 6. countVulnerableClubs(), countInterventionRequiredClubs(), countThrivingClubs()
 * 7. identifyDistinguishedLevel() with CSP requirement for 2025-2026+
 *
 * Requirements: 2.1, 3.1
 */

import type { DistrictStatistics, ClubStatistics } from '../interfaces.js'
import type { ClubTrend, ClubHealthStatus, ClubHealthData } from '../types.js'
import {
  getDCPCheckpoint,
  getCurrentProgramMonth,
  getMonthName,
} from './AnalyticsUtils.js'
import {
  calculateNetGrowth,
  determineDistinguishedLevel,
  getCSPStatus,
  isDistinguishedProvisional,
} from './ClubEligibilityUtils.js'

/**
 * Simple logger interface for compatibility.
 */
const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env['NODE_ENV'] !== 'test') {
      console.error(`[INFO] ${message}`, context)
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (process.env['NODE_ENV'] !== 'test') {
      console.warn(`[WARN] ${message}`, context)
    }
  },
  error: (message: string, context?: Record<string, unknown>) => {
    if (process.env['NODE_ENV'] !== 'test') {
      console.error(`[ERROR] ${message}`, context)
    }
  },
}

/**
 * ClubHealthAnalyticsModule
 *
 * Specialized module for club health-related analytics calculations.
 * Works directly with DistrictStatistics[] data without external dependencies.
 * Stateless module - no constructor required.
 *
 * Requirements: 2.1, 3.1
 */
export class ClubHealthAnalyticsModule {
  /**
   * Generate comprehensive club health data from snapshots
   *
   * @param snapshots - Array of district statistics snapshots (sorted by date ascending)
   * @returns ClubHealthData object with categorized clubs
   */
  generateClubHealthData(
    snapshots: DistrictStatistics[],
    preloadedTrends?: Record<
      string,
      {
        membershipTrend: Array<{ date: string; count: number }>
        dcpGoalsTrend: Array<{ date: string; goalsAchieved: number }>
      }
    >
  ): ClubHealthData {
    if (snapshots.length === 0) {
      return {
        allClubs: [],
        thrivingClubs: [],
        vulnerableClubs: [],
        interventionRequiredClubs: [],
      }
    }

    const clubTrends = this.analyzeClubTrends(snapshots, preloadedTrends)

    return {
      allClubs: clubTrends,
      thrivingClubs: clubTrends.filter(c => c.currentStatus === 'thriving'),
      vulnerableClubs: clubTrends.filter(c => c.currentStatus === 'vulnerable'),
      interventionRequiredClubs: clubTrends.filter(
        c => c.currentStatus === 'intervention-required'
      ),
    }
  }

  /**
   * Identify at-risk (vulnerable) clubs in a district
   *
   * Returns clubs that are classified as "vulnerable" - those that have some
   * but not all requirements met, excluding intervention-required clubs.
   *
   * Requirements: 2.1, 3.1
   *
   * @param districtId - The district ID to analyze (for logging)
   * @param snapshots - Array of district statistics snapshots
   * @returns Array of ClubTrend objects for vulnerable clubs
   */
  identifyAtRiskClubs(
    districtId: string,
    snapshots: DistrictStatistics[]
  ): ClubTrend[] {
    if (snapshots.length === 0) {
      logger.warn('No snapshot data available for at-risk club analysis', {
        districtId,
      })
      return []
    }

    const clubTrends = this.analyzeClubTrends(snapshots)

    // Return only vulnerable clubs (not intervention-required clubs)
    return clubTrends.filter(c => c.currentStatus === 'vulnerable')
  }

  /**
   * Get club-specific trends for a single club
   *
   * @param districtId - The district ID (for logging)
   * @param clubId - The club ID to get trends for
   * @param snapshots - Array of district statistics snapshots
   * @returns ClubTrend object or null if not found
   */
  getClubTrends(
    districtId: string,
    clubId: string,
    snapshots: DistrictStatistics[]
  ): ClubTrend | null {
    if (snapshots.length === 0) {
      logger.warn('No snapshot data available for club trends', {
        districtId,
        clubId,
      })
      return null
    }

    const clubTrends = this.analyzeClubTrends(snapshots)

    const clubTrend = clubTrends.find(c => c.clubId === clubId)

    if (!clubTrend) {
      logger.warn('Club not found in analytics', { districtId, clubId })
      return null
    }

    return clubTrend
  }

  /**
   * Analyze all club trends for a district
   *
   * This method is exposed for use by AnalyticsComputer when generating
   * comprehensive district analytics.
   *
   * @param snapshots - Array of district statistics snapshots
   * @returns Array of ClubTrend objects
   */
  analyzeClubTrends(
    snapshots: DistrictStatistics[],
    preloadedTrends?: Record<
      string,
      {
        membershipTrend: Array<{ date: string; count: number }>
        dcpGoalsTrend: Array<{ date: string; goalsAchieved: number }>
      }
    >
  ): ClubTrend[] {
    if (snapshots.length === 0) {
      return []
    }

    // Get latest snapshot for current club list and health assessment
    const latestSnapshot = snapshots[snapshots.length - 1]
    if (!latestSnapshot) {
      return []
    }

    const clubMap = new Map<string, ClubTrend>()

    // Initialize club trends from latest data
    for (const club of latestSnapshot.clubs) {
      const preloaded = preloadedTrends?.[club.clubId]

      clubMap.set(club.clubId, {
        clubId: club.clubId,
        clubName: club.clubName,
        divisionId: club.divisionId || 'Unknown',
        divisionName: club.divisionName || 'Unknown Division',
        areaId: club.areaId || 'Unknown',
        areaName: club.areaName || 'Unknown Area',
        // If a preloaded trend store is available, use its accumulated arrays.
        // Otherwise fall back to deriving trends from the snapshots array.
        membershipTrend: preloaded ? [...preloaded.membershipTrend] : [],
        dcpGoalsTrend: preloaded ? [...preloaded.dcpGoalsTrend] : [],
        currentStatus: 'thriving',
        healthScore: 0, // Will be calculated in assessClubHealth
        membershipCount: club.membershipCount,
        membershipBase: club.membershipBase,
        paymentsCount: club.paymentsCount,
        riskFactors: [],
        distinguishedLevel: 'NotDistinguished', // Default value, will be updated later
        // Membership payment tracking fields (Requirements 8.1, 8.5, 8.6, 8.7)
        octoberRenewals: club.octoberRenewals ?? 0,
        aprilRenewals: club.aprilRenewals ?? 0,
        newMembers: club.newMembers ?? 0,
        // Club operational status from Toastmasters dashboard (Requirements 2.2)
        clubStatus: club.clubStatus,
        // CSP submission status — use getCSPStatus() to normalize undefined → true for pre-2025
        cspSubmitted: getCSPStatus(club),
        // Find-A-Club enrichment (#503). Propagate any FAC fields the
        // merger wrote onto ClubStatistics. All optional — present
        // only when FAC matched the club.
        ...(club.charterDate && { charterDate: club.charterDate }),
        ...(club.coordinates && { coordinates: club.coordinates }),
        ...(club.address && { address: club.address }),
        ...(club.email && { email: club.email }),
        ...(club.phone && { phone: club.phone }),
        ...(club.website && { website: club.website }),
        ...(club.facebookLink && { facebookLink: club.facebookLink }),
        ...(club.twitterLink && { twitterLink: club.twitterLink }),
        ...(club.meetingDay && { meetingDay: club.meetingDay }),
        ...(club.meetingTime && { meetingTime: club.meetingTime }),
        ...(typeof club.allowsVirtualAttendance === 'boolean' && {
          allowsVirtualAttendance: club.allowsVirtualAttendance,
        }),
        ...(typeof club.isProspective === 'boolean' && {
          isProspective: club.isProspective,
        }),
      })
    }

    // Only build trends from snapshots when no pre-loaded store was supplied.
    // When the store is present the trend arrays were already populated above.
    if (!preloadedTrends) {
      for (const snapshot of snapshots) {
        for (const club of snapshot.clubs) {
          const clubTrend = clubMap.get(club.clubId)
          if (!clubTrend) continue

          clubTrend.membershipTrend.push({
            date: snapshot.snapshotDate,
            count: club.membershipCount,
          })

          clubTrend.dcpGoalsTrend.push({
            date: snapshot.snapshotDate,
            goalsAchieved: club.dcpGoals,
          })
        }
      }
    }

    // Get the snapshot date from the latest entry for DCP checkpoint evaluation
    const snapshotDate = latestSnapshot.snapshotDate

    // Analyze each club for risk factors and status (always from latest snapshot)
    for (const club of latestSnapshot.clubs) {
      const clubTrend = clubMap.get(club.clubId)
      if (!clubTrend) continue

      // Pass club data and snapshotDate to assessClubHealth for classification logic
      this.assessClubHealth(clubTrend, club, snapshotDate)

      this.identifyDistinguishedLevel(clubTrend, club, snapshotDate)
    }

    return Array.from(clubMap.values())
  }

  // ========== Club Health Assessment Methods ==========

  /**
   * Assess club health using monthly DCP checkpoint system
   *
   * Classification Rules (Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 3.1):
   * 1. Intervention Required: membership < 12 AND net growth < 3
   * 2. Thriving: membership requirement met AND DCP checkpoint met AND CSP submitted
   * 3. Vulnerable: any requirement not met (but not intervention)
   *
   * Membership Requirement (Requirement 1.3): membership >= 20 OR net growth >= 3
   * DCP Checkpoint: varies by month (see getDCPCheckpoint)
   * CSP Requirement: CSP submitted (defaults to true for pre-2025-2026 historical data)
   *
   * Each club is classified into exactly one category.
   *
   * @param clubTrend - The club trend data to assess
   * @param club - The club statistics data for net growth calculation
   * @param snapshotDate - Snapshot date for determining current program month
   */
  assessClubHealth(
    clubTrend: ClubTrend,
    club: ClubStatistics,
    snapshotDate: string
  ): void {
    const riskFactors: string[] = []

    // Get current membership from the latest trend data point
    const currentMembership =
      clubTrend.membershipTrend[clubTrend.membershipTrend.length - 1]?.count ??
      club.membershipCount

    // Get current DCP goals from the latest trend data point
    const currentDcpGoals =
      clubTrend.dcpGoalsTrend[clubTrend.dcpGoalsTrend.length - 1]
        ?.goalsAchieved ?? club.dcpGoals

    // Calculate net growth from club data (Requirement 5.3)
    // Net growth = Active Members - Mem. Base
    const netGrowth = calculateNetGrowth(club)

    // Get current program month for DCP checkpoint evaluation
    const currentMonth = getCurrentProgramMonth(snapshotDate)

    // Get required DCP checkpoint for current month
    const requiredDcpCheckpoint = getDCPCheckpoint(currentMonth)

    // Get CSP status (Requirements 5.4, 5.5: CSP guaranteed in 2025-2026+, absent in prior years)
    const cspSubmitted = getCSPStatus(club)

    // Apply classification rules - mutually exclusive categories
    let status: ClubHealthStatus

    // Requirement 1.2: Intervention override rule
    // If membership < 12 AND net growth < 3, assign "Intervention Required" regardless of other criteria
    if (currentMembership < 12 && netGrowth < 3) {
      status = 'intervention-required'
      riskFactors.push('Membership below 12 (critical)')
      riskFactors.push(
        `Net growth since July: ${netGrowth} (need 3+ to override)`
      )
    } else {
      // Evaluate each requirement for Thriving status

      // Requirement 1.3: Membership requirement (>= 20 OR net growth >= 3)
      const membershipRequirementMet = currentMembership >= 20 || netGrowth >= 3

      // DCP checkpoint requirement (varies by month)
      const dcpCheckpointMet = currentDcpGoals >= requiredDcpCheckpoint

      // CSP requirement (CSP guaranteed in 2025-2026+, absent in prior years)
      const cspRequirementMet = cspSubmitted

      // Requirement 1.4: Thriving if ALL requirements met
      if (membershipRequirementMet && dcpCheckpointMet && cspRequirementMet) {
        status = 'thriving'
        // Requirement 4.5: Clear riskFactors for Thriving clubs
      } else {
        // Requirement 1.5: Vulnerable if some but not all requirements met
        status = 'vulnerable'

        // Requirement 4.2: Add specific reason for membership requirement not met
        if (!membershipRequirementMet) {
          riskFactors.push(
            `Membership below threshold (${currentMembership} members, need 20+ or net growth 3+)`
          )
        }

        // Requirement 4.3: Add specific reason for DCP checkpoint not met
        if (!dcpCheckpointMet) {
          const monthName = getMonthName(currentMonth)
          riskFactors.push(
            `DCP checkpoint not met: ${currentDcpGoals} goal${currentDcpGoals !== 1 ? 's' : ''} achieved, ${requiredDcpCheckpoint} required for ${monthName}`
          )
        }

        // Requirement 4.4: Add specific reason for CSP not submitted
        if (!cspRequirementMet) {
          riskFactors.push('CSP not submitted')
        }
      }
    }

    clubTrend.riskFactors = riskFactors
    clubTrend.currentStatus = status
    clubTrend.healthScore = this.calculateClubHealthScore(
      currentMembership,
      currentDcpGoals
    )
  }

  /**
   * Calculate club health score based on membership and DCP goals
   *
   * @param membership - Current membership count
   * @param dcpGoals - Number of DCP goals achieved
   * @returns Health score (0, 0.5, or 1)
   */
  calculateClubHealthScore(membership: number, dcpGoals: number): number {
    // Simple health score calculation
    // 1.0 = thriving (membership >= 20 and dcpGoals >= 5)
    // 0.5 = moderate (membership >= 12 or dcpGoals >= 3)
    // 0.0 = at-risk (membership < 12 and dcpGoals < 3)

    if (membership >= 20 && dcpGoals >= 5) {
      return 1.0
    } else if (membership >= 12 || dcpGoals >= 3) {
      return 0.5
    } else {
      return 0.0
    }
  }

  /**
   * Count vulnerable clubs in a snapshot
   *
   * Requirement 3.2: Vulnerable if some but not all requirements met
   * Uses new classification logic based on monthly DCP checkpoints
   *
   * This method MUST use the same logic as assessClubHealth() to ensure consistency.
   *
   * @param snapshot - District statistics snapshot
   * @returns Count of vulnerable clubs
   */
  countVulnerableClubs(snapshot: DistrictStatistics): number {
    // Get current program month from snapshot date for DCP checkpoint evaluation
    const currentMonth = getCurrentProgramMonth(snapshot.snapshotDate)
    const requiredDcpCheckpoint = getDCPCheckpoint(currentMonth)

    return snapshot.clubs.filter(club => {
      const membership = club.membershipCount
      const dcpGoals = club.dcpGoals
      const netGrowth = calculateNetGrowth(club)

      // Intervention override: membership < 12 AND net growth < 3 is NOT vulnerable
      if (membership < 12 && netGrowth < 3) {
        return false
      }

      // Membership requirement: >= 20 OR net growth >= 3
      const membershipRequirementMet = membership >= 20 || netGrowth >= 3

      // DCP checkpoint requirement (varies by month) - MUST match assessClubHealth logic
      const dcpCheckpointMet = dcpGoals >= requiredDcpCheckpoint

      // CSP: for counting methods, assume submitted (actual CSP check is in assessClubHealth)
      const cspSubmitted = true

      // Vulnerable: some but not all requirements met
      const allRequirementsMet =
        membershipRequirementMet && dcpCheckpointMet && cspSubmitted
      return !allRequirementsMet
    }).length
  }

  /**
   * Count intervention-required clubs
   *
   * Requirement 3.2: Intervention Required if membership < 12 AND net growth < 3
   * Uses new classification logic based on intervention override rule
   *
   * @param snapshot - District statistics snapshot
   * @returns Count of intervention-required clubs
   */
  countInterventionRequiredClubs(snapshot: DistrictStatistics): number {
    return snapshot.clubs.filter(club => {
      const membership = club.membershipCount
      const netGrowth = calculateNetGrowth(club)

      // Intervention required: membership < 12 AND net growth < 3
      return membership < 12 && netGrowth < 3
    }).length
  }

  /**
   * Count thriving clubs in a snapshot
   *
   * Requirement 3.2: Thriving if all requirements met (membership, DCP checkpoint, CSP)
   * Uses new classification logic based on monthly DCP checkpoints
   *
   * This method MUST use the same logic as assessClubHealth() to ensure consistency
   * between the thriving count used for projections and the actual club health status.
   *
   * @param snapshot - District statistics snapshot
   * @returns Count of thriving clubs
   */
  countThrivingClubs(snapshot: DistrictStatistics): number {
    // Get current program month from snapshot date for DCP checkpoint evaluation
    const currentMonth = getCurrentProgramMonth(snapshot.snapshotDate)
    const requiredDcpCheckpoint = getDCPCheckpoint(currentMonth)

    return snapshot.clubs.filter(club => {
      const membership = club.membershipCount
      const dcpGoals = club.dcpGoals
      const netGrowth = calculateNetGrowth(club)

      // Intervention override: membership < 12 AND net growth < 3 is NOT thriving
      if (membership < 12 && netGrowth < 3) {
        return false
      }

      // Membership requirement: >= 20 OR net growth >= 3
      const membershipRequirementMet = membership >= 20 || netGrowth >= 3

      // DCP checkpoint requirement (varies by month) - MUST match assessClubHealth logic
      const dcpCheckpointMet = dcpGoals >= requiredDcpCheckpoint

      // CSP: for counting methods, assume submitted (actual CSP check is in assessClubHealth)
      const cspSubmitted = true

      return membershipRequirementMet && dcpCheckpointMet && cspSubmitted
    }).length
  }

  // NOTE: calculateNetGrowth, getCSPStatus, and determineDistinguishedLevel
  // have been extracted to ClubEligibilityUtils.ts as shared pure functions.

  /**
   * Extract club status from club statistics
   *
   * Returns the club operational status (Active, Suspended, Low, Ineligible)
   * from the ClubStatistics data.
   *
   * Requirements: 1.2, 1.3, 1.4
   *
   * @param club - Club statistics data
   * @returns Club status string or undefined if not present
   */
  extractClubStatus(club: ClubStatistics): string | undefined {
    return club.clubStatus
  }

  /**
   * Extract membership payment data from club statistics
   *
   * Returns the October renewals, April renewals, and new members
   * from the ClubStatistics data.
   *
   * Requirements: 8.5, 8.6, 8.7
   *
   * @param club - Club statistics data
   * @returns Object with octoberRenewals, aprilRenewals, and newMembers fields
   */
  extractMembershipPayments(club: ClubStatistics): {
    octoberRenewals: number
    aprilRenewals: number
    newMembers: number
  } {
    return {
      octoberRenewals: club.octoberRenewals ?? 0,
      aprilRenewals: club.aprilRenewals ?? 0,
      newMembers: club.newMembers ?? 0,
    }
  }

  /**
   * Identify distinguished level for a club
   *
   * Starting in 2025-2026, CSP submission is required for distinguished recognition.
   * Clubs without CSP submitted cannot achieve any distinguished level.
   *
   * @param clubTrend - The club trend data to update
   * @param club - The club statistics data
   */
  private identifyDistinguishedLevel(
    clubTrend: ClubTrend,
    club: ClubStatistics,
    snapshotDate: string
  ): void {
    // CSP requirement for 2025-2026+: must have CSP submitted to be distinguished
    const cspSubmitted = getCSPStatus(club)

    if (!cspSubmitted) {
      clubTrend.distinguishedLevel = 'NotDistinguished'
      clubTrend.isProvisionallyDistinguished = false
      return
    }

    const currentDcpGoals =
      clubTrend.dcpGoalsTrend[clubTrend.dcpGoalsTrend.length - 1]
        ?.goalsAchieved ?? club.dcpGoals

    const currentMembership =
      clubTrend.membershipTrend[clubTrend.membershipTrend.length - 1]?.count ??
      club.membershipCount

    // Calculate net growth from club data
    const netGrowth = calculateNetGrowth(club)

    // Use the shared distinguished level determination logic
    clubTrend.distinguishedLevel = determineDistinguishedLevel(
      currentDcpGoals,
      currentMembership,
      netGrowth
    )

    // Determine if Distinguished status is provisional (#287)
    const dataMonth = new Date(snapshotDate).getUTCMonth() + 1
    clubTrend.isProvisionallyDistinguished = isDistinguishedProvisional(
      clubTrend.distinguishedLevel,
      club.aprilRenewals ?? 0,
      club.membershipBase ?? 0,
      dataMonth
    )
  }

  // ========== Seasonal Risk Scoring (#221) ==========

  /**
   * Seasonal membership decline allowances by calendar month (1-indexed).
   * Months where membership drops are historically expected.
   * Map key = calendar month, value = max allowed decline that is "normal".
   */
  static readonly SEASONAL_THRESHOLDS: ReadonlyMap<number, number> = new Map([
    [1, 3], // January — post-holiday drop
    [6, 2], // June — end-of-year attrition
    [7, 4], // July — program year rollover, largest drop
    [8, 3], // August — summer lag
  ])

  /**
   * Apply seasonal adjustments to club health data.
   *
   * For clubs classified as "vulnerable" with a membership decline within
   * the expected seasonal range, annotates them with isSeasonallyAdjusted=true
   * and replaces the generic threshold message with "Seasonal decline (expected)".
   *
   * This is a post-processing step — call after generateClubHealthData().
   *
   * @param healthData - ClubHealthData from generateClubHealthData
   * @param calendarMonth - Current calendar month (1–12)
   * @returns Modified ClubHealthData with seasonal adjustments applied
   */
  applySeasonalAdjustments(
    healthData: ClubHealthData,
    calendarMonth: number
  ): ClubHealthData {
    const threshold =
      ClubHealthAnalyticsModule.SEASONAL_THRESHOLDS.get(calendarMonth)
    if (threshold === undefined) {
      return healthData
    }

    for (const club of healthData.allClubs) {
      if (club.currentStatus !== 'vulnerable') continue

      const trend = club.membershipTrend
      if (trend.length < 2) continue

      const prev = trend[trend.length - 2]
      const curr = trend[trend.length - 1]
      if (!prev || !curr) continue

      const decline = prev.count - curr.count
      if (decline > 0 && decline <= threshold) {
        club.isSeasonallyAdjusted = true
        club.riskFactors = club.riskFactors.map(rf =>
          rf.startsWith('Membership below threshold')
            ? 'Seasonal decline (expected)'
            : rf
        )
      }
    }

    return healthData
  }
}
