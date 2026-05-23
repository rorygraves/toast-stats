/**
 * Analytics Computer
 *
 * Main class that orchestrates analytics computation using specialized modules.
 * Implements the IAnalyticsComputer interface for use by both collector-cli and backend.
 *
 * This class uses the hardened backend analytics modules that were moved to analytics-core:
 * - MembershipAnalyticsModule: Membership trends, year-over-year comparisons, seasonal patterns
 * - ClubHealthAnalyticsModule: At-risk club identification, health scores, club trends
 * - DistinguishedClubAnalyticsModule: DCP goals analysis, distinguished club projections
 * - DivisionAreaAnalyticsModule: Division and area performance analysis
 * - LeadershipAnalyticsModule: Leadership effectiveness insights and correlations
 * - AreaDivisionRecognitionModule: DAP/DDP recognition calculations
 *
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import type { IAnalyticsComputer, DistrictStatistics } from '../interfaces.js'
import type {
  ComputeOptions,
  DistrictAnalytics,
  DateRange,
  MembershipAnalyticsData,
  VulnerableClubsData,
  ClubHealthData,
  ClubTrend,
  LeadershipInsightsData,
  DivisionRanking,
  AreaPerformance,
  YearOverYearData,
  MetricComparison,
  MultiYearTrend,
  PerformanceTargetsData,
  ClubTrendsIndex,
  DistinguishedClubAnalyticsData,
  ExtendedAnalyticsComputationResult,
  MetricRankings,
} from '../types.js'
import type { AllDistrictsRankingsData } from '@toastmasters/shared-contracts'
import { ANALYTICS_SCHEMA_VERSION } from '../version.js'
import { MetricRankingsCalculator } from '../rankings/MetricRankingsCalculator.js'
import { MembershipAnalyticsModule } from './MembershipAnalyticsModule.js'
import { ClubHealthAnalyticsModule } from './ClubHealthAnalyticsModule.js'
import { DistinguishedClubAnalyticsModule } from './DistinguishedClubAnalyticsModule.js'
import { DivisionAreaAnalyticsModule } from './DivisionAreaAnalyticsModule.js'
import { LeadershipAnalyticsModule } from './LeadershipAnalyticsModule.js'
import { AreaDivisionRecognitionModule } from './AreaDivisionRecognitionModule.js'
import {
  findPreviousProgramYearDate,
  calculatePercentageChange,
} from './AnalyticsUtils.js'
import {
  calculateGrowthTargets,
  calculatePercentageTargets,
  determineAchievedLevel,
} from './TargetCalculator.js'

/**
 * Simple logger interface for compatibility.
 * Follows the same pattern used by ClubHealthAnalyticsModule, DistinguishedClubAnalyticsModule, etc.
 */
const logger = {
  warn: (message: string, context?: Record<string, unknown>) => {
    if (process.env['NODE_ENV'] !== 'test') {
      console.warn(`[WARN] ${message}`, context)
    }
  },
}

/**
 * AnalyticsComputer
 *
 * Orchestrates analytics computation using specialized modules.
 * This class is the main entry point for computing district analytics.
 *
 * Uses the hardened backend analytics modules moved to analytics-core,
 * preserving all bug fixes and computation logic.
 *
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 7.2, 7.3, 7.4, 7.5
 */
export class AnalyticsComputer implements IAnalyticsComputer {
  private readonly membershipModule: MembershipAnalyticsModule
  private readonly clubHealthModule: ClubHealthAnalyticsModule
  private readonly distinguishedModule: DistinguishedClubAnalyticsModule
  private readonly divisionAreaModule: DivisionAreaAnalyticsModule
  private readonly leadershipModule: LeadershipAnalyticsModule
  private readonly areaDivisionRecognitionModule: AreaDivisionRecognitionModule
  private readonly metricRankingsCalculator: MetricRankingsCalculator

  constructor() {
    this.membershipModule = new MembershipAnalyticsModule()
    this.clubHealthModule = new ClubHealthAnalyticsModule()
    this.distinguishedModule = new DistinguishedClubAnalyticsModule()
    this.divisionAreaModule = new DivisionAreaAnalyticsModule()
    this.leadershipModule = new LeadershipAnalyticsModule()
    this.areaDivisionRecognitionModule = new AreaDivisionRecognitionModule()
    this.metricRankingsCalculator = new MetricRankingsCalculator()
  }

  /**
   * Computes comprehensive analytics for a district.
   *
   * This method orchestrates all analytics computation and returns
   * an ExtendedAnalyticsComputationResult containing all pre-computed
   * analytics data types needed for the backend to serve.
   *
   * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 5.2 (per-metric-rankings)
   *
   * @param districtId - The district identifier
   * @param snapshots - Array of district statistics snapshots (for trend analysis)
   * @param options - Optional computation options (includes allDistrictsRankings for per-metric rankings)
   * @returns Promise resolving to the extended computation result
   */
  async computeDistrictAnalytics(
    districtId: string,
    snapshots: DistrictStatistics[],
    options?: ComputeOptions
  ): Promise<ExtendedAnalyticsComputationResult> {
    // Sort snapshots by date ascending for trend analysis
    const sortedSnapshots = [...snapshots].sort((a, b) =>
      a.snapshotDate.localeCompare(b.snapshotDate)
    )

    // Compute membership trends
    const membershipTrends =
      this.membershipModule.generateMembershipTrends(sortedSnapshots)

    // Compute club health data
    // If preloadedClubTrends is supplied (pipeline path via ClubTrendsStore),
    // the trend arrays come from the persistent store rather than snapshot iteration.
    const clubHealth = this.clubHealthModule.generateClubHealthData(
      sortedSnapshots,
      options?.preloadedClubTrends
    )

    // Compute distinguished club data
    // distinguishedClubs: counts object for frontend display (Requirements 2.1)
    const distinguishedClubs =
      this.distinguishedModule.generateDistinguishedClubCounts(sortedSnapshots)
    // distinguishedClubsList: detailed array for drill-down (Requirements 2.2)
    const distinguishedClubsList =
      this.distinguishedModule.generateDistinguishedClubSummaries(
        sortedSnapshots
      )
    // Get thriving count from latest snapshot for projection
    // Requirements: 1.1 (projected-year-end-simplification)
    const latestSnapshotForProjection =
      sortedSnapshots[sortedSnapshots.length - 1]
    const thrivingCount = latestSnapshotForProjection
      ? this.clubHealthModule.countThrivingClubs(latestSnapshotForProjection)
      : 0
    const distinguishedProjection =
      this.distinguishedModule.generateDistinguishedProjection(
        sortedSnapshots,
        thrivingCount
      )

    // Compute division and area rankings
    const divisionRankings =
      this.divisionAreaModule.generateDivisionRankings(sortedSnapshots)
    const topPerformingAreas =
      this.divisionAreaModule.generateTopPerformingAreas(sortedSnapshots)

    // Calculate date range
    const dateRange = this.calculateDateRange(sortedSnapshots)

    // Get latest snapshot for current totals and current date
    const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1]
    const totalMembership = latestSnapshot
      ? this.membershipModule.getTotalMembership(latestSnapshot)
      : 0

    // Calculate membership change (payment-based)
    // Requirements 8.1, 8.2, 8.3: Use paymentBase when available, fall back to snapshot-based calculation
    const membershipChange = this.calculateMembershipChangeWithBase(
      sortedSnapshots,
      options?.allDistrictsRankings,
      districtId
    )

    // Calculate actual member count change
    // Requirements 4.2, 4.3: Difference in totalMembership between last and first snapshot (0 for single snapshot)
    const memberCountChange =
      this.membershipModule.calculateMembershipChange(sortedSnapshots)

    // Get current date for year-over-year computation
    const currentDate =
      latestSnapshot?.snapshotDate ||
      new Date().toISOString().split('T')[0] ||
      ''

    // Compute membership analytics first so we can include topGrowthClubs in districtAnalytics
    // Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
    const membershipAnalytics = this.computeMembershipAnalytics(
      districtId,
      sortedSnapshots
    )

    // Compute top growth clubs from MembershipAnalyticsModule
    // Issue #84: topGrowthClubs must be included in the base districtAnalytics
    // Issue #185: When preloadedClubTrends are available (pipeline path),
    // use them for dense multi-point growth. The snapshots array only has
    // 1-2 entries (today + optional prev year), yielding growth=0.
    const topGrowthClubs = options?.preloadedClubTrends
      ? this.calculateTopGrowthFromTrends(
          options.preloadedClubTrends,
          clubHealth.allClubs
        )
      : this.membershipModule.generateMembershipAnalytics(
          districtId,
          sortedSnapshots
        ).topGrowthClubs

    // #489 — Prospective clubs are surfaced verbatim from the latest
    // snapshot; they're a directory-style overlay, not an analytics
    // input. Default to [] so the frontend can always assume an array.
    const prospectiveClubs = latestSnapshot?.prospectiveClubs ?? []

    // Build district analytics (base result)
    const districtAnalytics: DistrictAnalytics = {
      districtId,
      dateRange,
      totalMembership,
      membershipChange,
      memberCountChange,
      membershipTrend: membershipTrends.membershipTrend,
      paymentsTrend: membershipTrends.paymentsTrend,
      allClubs: clubHealth.allClubs,
      vulnerableClubs: clubHealth.vulnerableClubs,
      thrivingClubs: clubHealth.thrivingClubs,
      interventionRequiredClubs: clubHealth.interventionRequiredClubs,
      distinguishedClubs,
      distinguishedClubsList,
      distinguishedProjection,
      divisionRankings,
      topPerformingAreas,
      topGrowthClubs,
      prospectiveClubs,
    }

    // Compute remaining extended analytics
    const vulnerableClubs = this.computeVulnerableClubs(districtId, clubHealth)
    const leadershipInsights = this.computeLeadershipInsights(
      districtId,
      sortedSnapshots
    )
    const distinguishedClubAnalytics = this.computeDistinguishedClubAnalytics(
      districtId,
      sortedSnapshots
    )
    const yearOverYear = this.computeYearOverYear(
      districtId,
      sortedSnapshots,
      currentDate
    )
    // Requirement 5.2 (per-metric-rankings): Pass allDistrictsRankings to computePerformanceTargets
    const performanceTargets = this.computePerformanceTargets(
      districtId,
      sortedSnapshots,
      options?.allDistrictsRankings
    )
    const clubTrendsIndex = this.buildClubTrendsIndex(districtId, clubHealth)

    const computedAt = new Date().toISOString()

    return {
      // Base AnalyticsComputationResult fields
      districtAnalytics,
      membershipTrends,
      clubHealth,
      computedAt,
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      // Extended fields for pre-computed files
      membershipAnalytics,
      vulnerableClubs,
      leadershipInsights,
      distinguishedClubAnalytics,
      yearOverYear,
      performanceTargets,
      clubTrendsIndex,
    }
  }

  // ========== Private Helper Methods ==========

  /**
   * Calculate date range from snapshots
   */
  private calculateDateRange(snapshots: DistrictStatistics[]): DateRange {
    if (snapshots.length === 0) {
      const today = new Date().toISOString().split('T')[0] || ''
      return { start: today, end: today }
    }

    const first = snapshots[0]
    const last = snapshots[snapshots.length - 1]

    return {
      start: first?.snapshotDate || '',
      end: last?.snapshotDate || '',
    }
  }

  /**
   * Calculate membership change using paymentBase when available.
   *
   * This method implements the membership change calculation per Requirements 8.1, 8.2, 8.3:
   * - When paymentBase is available from All_Districts_Rankings, calculate membershipChange
   *   as the difference between current total payments and paymentBase
   * - When paymentBase is not available, fall back to the existing snapshot-based calculation
   *
   * Requirements: 8.1, 8.2, 8.3
   *
   * @param snapshots - Array of district statistics snapshots (sorted by date ascending)
   * @param allDistrictsRankings - Optional all-districts rankings data containing paymentBase
   * @param districtId - The district identifier
   * @returns Membership change (positive = growth, negative = decline)
   */
  private calculateMembershipChangeWithBase(
    snapshots: DistrictStatistics[],
    allDistrictsRankings: AllDistrictsRankingsData | undefined,
    districtId: string
  ): number {
    // Requirement 1.2: Log warning when rankings data is not provided
    if (!allDistrictsRankings) {
      logger.warn(
        'All districts rankings data is undefined, cannot perform rankings-based membership change calculation',
        { districtId }
      )
    }

    // Try to get paymentBase from all-districts rankings
    // Requirement 8.2: WHEN Payment_Base is available from All_Districts_Rankings, use it
    let districtRanking = allDistrictsRankings?.rankings.find(
      r => r.districtId === districtId
    )

    // Requirement 2.2: If exact match fails, try normalized lookup by stripping non-numeric characters
    if (!districtRanking && allDistrictsRankings) {
      const normalizedSearchId = this.normalizeDistrictId(districtId)
      districtRanking = allDistrictsRankings.rankings.find(
        r => this.normalizeDistrictId(r.districtId) === normalizedSearchId
      )

      // Requirement 1.1: Log warning when district is not found in rankings after both lookups
      if (!districtRanking) {
        const availableDistrictIds = allDistrictsRankings.rankings.map(
          r => r.districtId
        )
        logger.warn(
          'District not found in all districts rankings after exact and normalized lookup',
          {
            soughtDistrictId: districtId,
            normalizedSearchId,
            availableDistrictIds,
          }
        )
      }
    }

    const paymentBase = districtRanking?.paymentBase

    // Requirement 1.3: Log warning when paymentBase is null/undefined on a matched ranking
    if (
      districtRanking &&
      (paymentBase === undefined || paymentBase === null)
    ) {
      logger.warn(
        'Matched district ranking has null or undefined paymentBase, falling back to snapshot-based calculation',
        {
          districtId,
          matchedDistrictId: districtRanking.districtId,
        }
      )
    }

    if (paymentBase !== undefined && paymentBase !== null) {
      // Requirement 8.1: Calculate membershipChange as currentPayments - paymentBase
      // Get current payments from rankings (official value) or from latest snapshot
      const latestSnapshot = snapshots[snapshots.length - 1]
      const currentPayments =
        districtRanking?.totalPayments ??
        (latestSnapshot
          ? this.membershipModule.getTotalPayments(latestSnapshot)
          : 0)

      return currentPayments - paymentBase
    }

    // Requirement 2.3: Fall back to snapshot-based calculation using per-club membershipBase
    // Instead of delegating to calculateMembershipChange (which returns 0 for single snapshots),
    // compute sum(paymentsCount) - sum(membershipBase) from the latest snapshot
    const latestSnapshotFallback = snapshots[snapshots.length - 1]
    if (!latestSnapshotFallback) {
      return 0
    }

    const totalPayments = latestSnapshotFallback.clubs.reduce(
      (sum, club) => sum + club.paymentsCount,
      0
    )
    const totalMembershipBase = latestSnapshotFallback.clubs.reduce(
      (sum, club) => sum + club.membershipBase,
      0
    )

    return totalPayments - totalMembershipBase
  }

  /**
   * Normalize a district ID by stripping all non-numeric characters.
   * This allows matching between different format variants (e.g., "D42" matches "42").
   *
   * Requirement 2.2: Normalized lookup by stripping non-numeric characters
   *
   * @param id - The district ID to normalize
   * @returns The numeric-only portion of the district ID
   */
  private normalizeDistrictId(id: string): string {
    return id.replace(/\D/g, '')
  }

  /**
   * Calculate top growth clubs from preloaded club trends (ClubTrendsStore).
   *
   * Issue #185: The daily pipeline only passes 1-2 snapshots to AnalyticsComputer,
   * so MembershipAnalyticsModule.generateMembershipAnalytics() sees ≤1 data point
   * per club → growth is always 0 → topGrowthClubs is empty.
   *
   * The ClubTrendsStore accumulates one data point per pipeline run across the
   * entire program year, giving dense multi-point membership data.
   *
   * @param preloadedClubTrends - Dense club trend data from ClubTrendsStore
   * @param allClubs - All clubs from ClubHealthAnalyticsModule for name lookup
   * @returns Top 10 clubs by membership growth
   */
  private calculateTopGrowthFromTrends(
    preloadedClubTrends: Record<
      string,
      {
        membershipTrend: Array<{ date: string; count: number }>
        dcpGoalsTrend: Array<{ date: string; goalsAchieved: number }>
      }
    >,
    allClubs: ClubTrend[]
  ): Array<{ clubId: string; clubName: string; growth: number }> {
    // Build a name lookup from allClubs
    const nameMap = new Map<string, string>()
    for (const club of allClubs) {
      nameMap.set(club.clubId, club.clubName)
    }

    const growthClubs: Array<{
      clubId: string
      clubName: string
      growth: number
    }> = []

    for (const [clubId, trends] of Object.entries(preloadedClubTrends)) {
      const trend = trends.membershipTrend
      if (trend.length < 2) continue

      const first = trend[0]?.count ?? 0
      const last = trend[trend.length - 1]?.count ?? 0
      const growth = last - first

      if (growth > 0) {
        growthClubs.push({
          clubId,
          clubName: nameMap.get(clubId) ?? clubId,
          growth,
        })
      }
    }

    return growthClubs.sort((a, b) => b.growth - a.growth).slice(0, 10)
  }

  /**
   * Compute membership analytics for a district.
   *
   * This method uses the moved MembershipAnalyticsModule to compute
   * comprehensive membership analytics data for pre-computation.
   *
   * Requirements: 1.1, 1.2
   *
   * @param districtId - The district identifier
   * @param snapshots - Array of district statistics snapshots (sorted by date ascending)
   * @returns MembershipAnalyticsData object for pre-computed file
   */
  computeMembershipAnalytics(
    districtId: string,
    snapshots: DistrictStatistics[]
  ): MembershipAnalyticsData {
    // Filter snapshots for the requested district
    const districtSnapshots = snapshots.filter(s => s.districtId === districtId)

    // Calculate date range
    const dateRange = this.calculateDateRange(districtSnapshots)

    // Handle empty snapshots case
    if (districtSnapshots.length === 0) {
      return {
        districtId,
        dateRange,
        totalMembership: 0,
        membershipChange: 0,
        membershipTrend: [],
        paymentsTrend: [],
        yearOverYear: undefined,
        growthRate: 0,
        retentionRate: 0,
      }
    }

    // Generate membership trends using the module
    const membershipTrends =
      this.membershipModule.generateMembershipTrends(districtSnapshots)

    // Get total membership from latest snapshot
    const latestSnapshot = districtSnapshots[districtSnapshots.length - 1]
    const totalMembership = latestSnapshot
      ? this.membershipModule.getTotalMembership(latestSnapshot)
      : 0

    // Calculate membership change
    const membershipChange =
      this.membershipModule.calculateMembershipChange(districtSnapshots)

    // Calculate growth rate as percentage
    const growthRate = this.calculateGrowthRate(districtSnapshots)

    // Calculate retention rate
    const retentionRate = this.calculateRetentionRate(districtSnapshots)

    return {
      districtId,
      dateRange,
      totalMembership,
      membershipChange,
      membershipTrend: membershipTrends.membershipTrend,
      paymentsTrend: membershipTrends.paymentsTrend,
      yearOverYear: membershipTrends.yearOverYear,
      growthRate,
      retentionRate,
    }
  }

  /**
   * Calculate growth rate as a percentage.
   *
   * Growth rate = ((current - initial) / initial) * 100
   *
   * @param snapshots - Array of district statistics snapshots
   * @returns Growth rate as a percentage (positive = growth, negative = decline)
   */
  private calculateGrowthRate(snapshots: DistrictStatistics[]): number {
    if (snapshots.length < 2) {
      return 0
    }

    const first = snapshots[0]
    const last = snapshots[snapshots.length - 1]

    if (!first || !last) {
      return 0
    }

    const initialMembership = this.membershipModule.getTotalMembership(first)
    const currentMembership = this.membershipModule.getTotalMembership(last)

    if (initialMembership === 0) {
      return currentMembership > 0 ? 100 : 0
    }

    const growthRate =
      ((currentMembership - initialMembership) / initialMembership) * 100

    // Round to 1 decimal place
    return Math.round(growthRate * 10) / 10
  }

  /**
   * Calculate retention rate as a percentage.
   *
   * Retention rate is estimated based on the ratio of payments to membership.
   * A higher payments-to-membership ratio indicates better retention.
   *
   * For Toastmasters:
   * - Members pay dues twice per year (October and April renewals)
   * - New members pay upon joining
   * - Retention rate = (payments / (membership * expected_payment_factor)) * 100
   *
   * We use a simplified calculation: retention = min(100, (payments / membership) * 50)
   * This assumes on average 2 payment events per member per year.
   *
   * @param snapshots - Array of district statistics snapshots
   * @returns Retention rate as a percentage (0-100)
   */
  private calculateRetentionRate(snapshots: DistrictStatistics[]): number {
    if (snapshots.length === 0) {
      return 0
    }

    const latestSnapshot = snapshots[snapshots.length - 1]
    if (!latestSnapshot) {
      return 0
    }

    const totalMembership =
      this.membershipModule.getTotalMembership(latestSnapshot)
    const totalPayments = this.membershipModule.getTotalPayments(latestSnapshot)

    if (totalMembership === 0) {
      return 0
    }

    // Calculate retention rate based on payments-to-membership ratio
    // Assuming 2 payment events per member per year on average
    const expectedPayments = totalMembership * 2
    const retentionRate = (totalPayments / expectedPayments) * 100

    // Cap at 100% and round to 1 decimal place
    return Math.round(Math.min(100, retentionRate) * 10) / 10
  }

  /**
   * Compute vulnerable clubs data for a district.
   *
   * This method uses the moved ClubHealthAnalyticsModule to extract
   * vulnerable and intervention-required clubs from the club health data.
   * The data is wrapped with metadata for the pre-computed file.
   *
   * Requirements: 3.1, 3.2
   *
   * @param districtId - The district identifier
   * @param clubHealth - Club health data containing categorized clubs
   * @returns VulnerableClubsData object for pre-computed file
   */
  computeVulnerableClubs(
    districtId: string,
    clubHealth: ClubHealthData
  ): VulnerableClubsData {
    return {
      districtId,
      computedAt: new Date().toISOString(),
      totalVulnerableClubs: clubHealth.vulnerableClubs.length,
      interventionRequiredClubs: clubHealth.interventionRequiredClubs.length,
      vulnerableClubs: clubHealth.vulnerableClubs,
      interventionRequired: clubHealth.interventionRequiredClubs,
    }
  }

  /**
   * Compute leadership insights data for a district.
   *
   * This method uses the moved LeadershipAnalyticsModule to compute
   * comprehensive leadership effectiveness metrics and officer performance data.
   * The data is wrapped with metadata for the pre-computed file.
   *
   * Requirements: 4.1, 4.2
   *
   * @param districtId - The district identifier
   * @param snapshots - Array of district statistics snapshots (sorted by date ascending)
   * @returns LeadershipInsightsData object for pre-computed file
   */
  computeLeadershipInsights(
    districtId: string,
    snapshots: DistrictStatistics[]
  ): LeadershipInsightsData {
    // Filter snapshots for the requested district
    const districtSnapshots = snapshots.filter(s => s.districtId === districtId)

    // Calculate date range
    const dateRange = this.calculateDateRange(districtSnapshots)

    // Handle empty snapshots case
    if (districtSnapshots.length === 0) {
      return {
        districtId,
        dateRange,
        officerCompletionRate: 0,
        trainingCompletionRate: 0,
        leadershipEffectivenessScore: 0,
        topPerformingDivisions: [],
        areasNeedingSupport: [],
        insights: {
          leadershipScores: [],
          bestPracticeDivisions: [],
          leadershipChanges: [],
          areaDirectorCorrelations: [],
          summary: {
            topPerformingDivisions: [],
            topPerformingAreas: [],
            averageLeadershipScore: 0,
            totalBestPracticeDivisions: 0,
          },
        },
      }
    }

    // Generate leadership insights using the module
    const insights =
      this.leadershipModule.generateLeadershipInsights(districtSnapshots)

    // Calculate officer completion rate from leadership scores
    // This is derived from the health score component which includes officer metrics
    const officerCompletionRate = this.calculateOfficerCompletionRate(insights)

    // Calculate training completion rate
    // This is derived from the DCP score component which includes training goals
    const trainingCompletionRate =
      this.calculateTrainingCompletionRate(insights)

    // Get overall leadership effectiveness score from summary
    const leadershipEffectivenessScore = insights.summary.averageLeadershipScore

    // Convert top performing divisions to DivisionRanking format
    const topPerformingDivisions: DivisionRanking[] =
      insights.summary.topPerformingDivisions.map((div, index) => ({
        divisionId: div.divisionId,
        divisionName: div.divisionName,
        rank: index + 1,
        score: div.score,
        clubCount: this.getDivisionClubCount(div.divisionId, districtSnapshots),
        membershipTotal: this.getDivisionMembershipTotal(
          div.divisionId,
          districtSnapshots
        ),
      }))

    // Identify areas needing support (low performing areas)
    const areasNeedingSupport: AreaPerformance[] =
      this.identifyAreasNeedingSupport(insights, districtSnapshots)

    return {
      districtId,
      dateRange,
      officerCompletionRate,
      trainingCompletionRate,
      leadershipEffectivenessScore,
      topPerformingDivisions,
      areasNeedingSupport,
      insights,
    }
  }

  /**
   * Calculate officer completion rate from leadership insights.
   *
   * Officer completion rate is derived from the health score component
   * of leadership effectiveness, which includes officer-related metrics.
   *
   * @param insights - Leadership insights data
   * @returns Officer completion rate as a percentage (0-100)
   */
  private calculateOfficerCompletionRate(
    insights: ReturnType<
      LeadershipAnalyticsModule['generateLeadershipInsights']
    >
  ): number {
    if (insights.leadershipScores.length === 0) {
      return 0
    }

    // Average health score across divisions represents officer effectiveness
    const totalHealthScore = insights.leadershipScores.reduce(
      (sum, score) => sum + score.healthScore,
      0
    )
    return Math.round(totalHealthScore / insights.leadershipScores.length)
  }

  /**
   * Calculate training completion rate from leadership insights.
   *
   * Training completion rate is derived from the DCP score component
   * of leadership effectiveness, which includes training-related goals.
   *
   * @param insights - Leadership insights data
   * @returns Training completion rate as a percentage (0-100)
   */
  private calculateTrainingCompletionRate(
    insights: ReturnType<
      LeadershipAnalyticsModule['generateLeadershipInsights']
    >
  ): number {
    if (insights.leadershipScores.length === 0) {
      return 0
    }

    // Average DCP score across divisions represents training completion
    const totalDcpScore = insights.leadershipScores.reduce(
      (sum, score) => sum + score.dcpScore,
      0
    )
    return Math.round(totalDcpScore / insights.leadershipScores.length)
  }

  /**
   * Get the club count for a division from snapshots.
   *
   * @param divisionId - Division identifier
   * @param snapshots - District statistics snapshots
   * @returns Number of clubs in the division
   */
  private getDivisionClubCount(
    divisionId: string,
    snapshots: DistrictStatistics[]
  ): number {
    const latestSnapshot = snapshots[snapshots.length - 1]
    if (!latestSnapshot) {
      return 0
    }

    return latestSnapshot.clubs.filter(club => club.divisionId === divisionId)
      .length
  }

  /**
   * Get the total membership for a division from snapshots.
   *
   * @param divisionId - Division identifier
   * @param snapshots - District statistics snapshots
   * @returns Total membership in the division
   */
  private getDivisionMembershipTotal(
    divisionId: string,
    snapshots: DistrictStatistics[]
  ): number {
    const latestSnapshot = snapshots[snapshots.length - 1]
    if (!latestSnapshot) {
      return 0
    }

    return latestSnapshot.clubs
      .filter(club => club.divisionId === divisionId)
      .reduce((sum, club) => sum + club.membershipCount, 0)
  }

  /**
   * Identify areas that need support based on leadership insights.
   *
   * Areas needing support are those with low performance scores
   * or negative correlations in the area director analysis.
   *
   * @param insights - Leadership insights data
   * @param snapshots - District statistics snapshots
   * @returns Array of areas needing support
   */
  private identifyAreasNeedingSupport(
    insights: ReturnType<
      LeadershipAnalyticsModule['generateLeadershipInsights']
    >,
    snapshots: DistrictStatistics[]
  ): AreaPerformance[] {
    const latestSnapshot = snapshots[snapshots.length - 1]
    if (!latestSnapshot) {
      return []
    }

    // Find areas with low performance or negative correlation
    const lowPerformingAreas = insights.areaDirectorCorrelations
      .filter(
        area =>
          area.activityIndicator === 'low' || area.correlation === 'negative'
      )
      .map(area => {
        const areaClubs = latestSnapshot.clubs.filter(
          club => club.areaId === area.areaId
        )
        const membershipTotal = areaClubs.reduce(
          (sum, club) => sum + club.membershipCount,
          0
        )

        return {
          areaId: area.areaId,
          areaName: area.areaName,
          divisionId: area.divisionId,
          score: area.clubPerformanceScore,
          clubCount: areaClubs.length,
          membershipTotal,
        }
      })

    // Sort by score ascending (lowest performing first)
    return lowPerformingAreas.sort((a, b) => a.score - b.score)
  }

  /**
   * Compute distinguished club analytics data for a district.
   *
   * This method uses the DistinguishedClubAnalyticsModule to compute
   * comprehensive distinguished club progress and projections for
   * the pre-computed file.
   *
   * Requirements: 5.1, 5.2
   *
   * @param districtId - The district identifier
   * @param snapshots - Array of district statistics snapshots (sorted by date ascending)
   * @returns DistinguishedClubAnalyticsData object for pre-computed file
   */
  computeDistinguishedClubAnalytics(
    districtId: string,
    snapshots: DistrictStatistics[]
  ): DistinguishedClubAnalyticsData {
    // Filter snapshots for the requested district
    const districtSnapshots = snapshots.filter(s => s.districtId === districtId)

    // Calculate date range
    const dateRange = this.calculateDateRange(districtSnapshots)

    // Handle empty snapshots case
    if (districtSnapshots.length === 0) {
      return {
        districtId,
        dateRange,
        distinguishedClubs: {
          smedley: 0,
          presidents: 0,
          select: 0,
          distinguished: 0,
          total: 0,
        },
        distinguishedClubsList: [],
        distinguishedProjection: {
          projectedDistinguished: 0,
          currentDistinguished: 0,
          currentSelect: 0,
          currentPresident: 0,
          projectionDate: new Date().toISOString().split('T')[0] || '',
        },
        progressByLevel: {
          smedley: { current: 0, projected: 0, trend: 'stable' },
          presidents: { current: 0, projected: 0, trend: 'stable' },
          select: { current: 0, projected: 0, trend: 'stable' },
          distinguished: { current: 0, projected: 0, trend: 'stable' },
        },
      }
    }

    // Generate distinguished club counts
    const distinguishedClubs =
      this.distinguishedModule.generateDistinguishedClubCounts(
        districtSnapshots
      )

    // Generate distinguished club summaries list
    const distinguishedClubsList =
      this.distinguishedModule.generateDistinguishedClubSummaries(
        districtSnapshots
      )

    // Generate distinguished projection
    // Get thriving count from latest snapshot for projection
    // Requirements: 1.1 (projected-year-end-simplification)
    const latestSnapshotForProjection =
      districtSnapshots[districtSnapshots.length - 1]
    const thrivingCount = latestSnapshotForProjection
      ? this.clubHealthModule.countThrivingClubs(latestSnapshotForProjection)
      : 0
    const distinguishedProjection =
      this.distinguishedModule.generateDistinguishedProjection(
        districtSnapshots,
        thrivingCount
      )

    // Calculate progress by level with trends
    const progressByLevel = this.calculateProgressByLevel(
      distinguishedClubs,
      distinguishedProjection,
      districtSnapshots
    )

    // Compute DCP goal analysis (Issue #84)
    // Uses the full generateDistinguishedClubAnalytics pipeline which includes analyzeDCPGoals
    const fullAnalytics =
      this.distinguishedModule.generateDistinguishedClubAnalytics(
        districtId,
        districtSnapshots
      )

    return {
      districtId,
      dateRange,
      distinguishedClubs,
      distinguishedClubsList,
      distinguishedProjection,
      progressByLevel,
      dcpGoalAnalysis: fullAnalytics.dcpGoalAnalysis,
    }
  }

  /**
   * Calculate progress by level with current, projected, and trend values.
   *
   * @param counts - Current distinguished club counts
   * @param projection - Distinguished club projection
   * @param snapshots - District statistics snapshots for trend analysis
   * @returns Progress by level object
   */
  private calculateProgressByLevel(
    counts: ReturnType<
      DistinguishedClubAnalyticsModule['generateDistinguishedClubCounts']
    >,
    projection: ReturnType<
      DistinguishedClubAnalyticsModule['generateDistinguishedProjection']
    >,
    snapshots: DistrictStatistics[]
  ): DistinguishedClubAnalyticsData['progressByLevel'] {
    // Determine trends based on historical data
    const trends = this.calculateDistinguishedTrends(snapshots)

    // All levels use projectedDistinguished since we no longer differentiate by level
    // Requirements: 2.4 (projected-year-end-simplification)
    return {
      smedley: {
        current: counts.smedley,
        projected: projection.projectedDistinguished,
        trend: trends.smedley,
      },
      presidents: {
        current: counts.presidents,
        projected: projection.projectedDistinguished,
        trend: trends.presidents,
      },
      select: {
        current: counts.select,
        projected: projection.projectedDistinguished,
        trend: trends.select,
      },
      distinguished: {
        current: counts.distinguished,
        projected: projection.projectedDistinguished,
        trend: trends.distinguished,
      },
    }
  }

  /**
   * Calculate trends for each distinguished level based on historical data.
   *
   * @param snapshots - District statistics snapshots
   * @returns Trend strings for each level
   */
  private calculateDistinguishedTrends(snapshots: DistrictStatistics[]): {
    smedley: string
    presidents: string
    select: string
    distinguished: string
  } {
    if (snapshots.length < 2) {
      return {
        smedley: 'stable',
        presidents: 'stable',
        select: 'stable',
        distinguished: 'stable',
      }
    }

    // Compare first and last snapshots
    const firstSnapshot = snapshots[0]
    const lastSnapshot = snapshots[snapshots.length - 1]

    if (!firstSnapshot || !lastSnapshot) {
      return {
        smedley: 'stable',
        presidents: 'stable',
        select: 'stable',
        distinguished: 'stable',
      }
    }

    const firstCounts =
      this.distinguishedModule.generateDistinguishedClubCounts([firstSnapshot])
    const lastCounts = this.distinguishedModule.generateDistinguishedClubCounts(
      [lastSnapshot]
    )

    return {
      smedley: this.determineTrendFromCounts(
        firstCounts.smedley,
        lastCounts.smedley
      ),
      presidents: this.determineTrendFromCounts(
        firstCounts.presidents,
        lastCounts.presidents
      ),
      select: this.determineTrendFromCounts(
        firstCounts.select,
        lastCounts.select
      ),
      distinguished: this.determineTrendFromCounts(
        firstCounts.distinguished,
        lastCounts.distinguished
      ),
    }
  }

  /**
   * Determine trend direction from two count values.
   *
   * @param first - First count value
   * @param last - Last count value
   * @returns Trend string: 'improving', 'declining', or 'stable'
   */
  private determineTrendFromCounts(first: number, last: number): string {
    if (last > first) {
      return 'improving'
    } else if (last < first) {
      return 'declining'
    }
    return 'stable'
  }

  /**
   * Compute year-over-year comparison data for a district.
   *
   * This method computes comprehensive year-over-year comparison metrics
   * including membership, distinguished clubs, club health, DCP goals,
   * and club count. It also generates multi-year trends when sufficient
   * historical data is available.
   *
   * Requirements: 6.1, 6.2, 6.3
   *
   * @param districtId - The district identifier
   * @param snapshots - Array of district statistics snapshots (sorted by date ascending)
   * @param currentDate - The current date for comparison (YYYY-MM-DD format)
   * @returns YearOverYearData object for pre-computed file
   */
  computeYearOverYear(
    districtId: string,
    snapshots: DistrictStatistics[],
    currentDate: string
  ): YearOverYearData {
    // Filter snapshots for the requested district
    const districtSnapshots = snapshots.filter(s => s.districtId === districtId)

    // Calculate previous year date
    const previousYearDate = findPreviousProgramYearDate(currentDate)

    // Handle empty snapshots case
    if (districtSnapshots.length === 0) {
      return {
        districtId,
        currentDate,
        previousYearDate,
        dataAvailable: false,
        message: 'No snapshot data available for this district',
      }
    }

    // Find current snapshot (closest to currentDate)
    const currentSnapshot = this.findSnapshotForDate(
      districtSnapshots,
      currentDate
    )

    if (!currentSnapshot) {
      return {
        districtId,
        currentDate,
        previousYearDate,
        dataAvailable: false,
        message: 'No snapshot data available for the current date',
      }
    }

    // Find previous year snapshot
    const previousSnapshot = this.findSnapshotForDate(
      districtSnapshots,
      previousYearDate
    )

    if (!previousSnapshot) {
      return {
        districtId,
        currentDate,
        previousYearDate,
        dataAvailable: false,
        message:
          'Insufficient historical data for year-over-year comparison. Previous year data not available.',
      }
    }

    // Compute metrics for current and previous snapshots
    const metrics = this.computeYearOverYearMetrics(
      currentSnapshot,
      previousSnapshot
    )

    // Compute multi-year trends if sufficient data available
    const multiYearTrends = this.computeMultiYearTrends(
      districtSnapshots,
      currentDate
    )

    return {
      districtId,
      currentDate,
      previousYearDate,
      dataAvailable: true,
      metrics,
      multiYearTrends,
    }
  }

  /**
   * Find the snapshot closest to a given date.
   *
   * @param snapshots - Array of district statistics snapshots
   * @param targetDate - Target date in YYYY-MM-DD format
   * @returns Snapshot closest to the target date, or undefined if none found
   */
  private findSnapshotForDate(
    snapshots: DistrictStatistics[],
    targetDate: string
  ): DistrictStatistics | undefined {
    if (snapshots.length === 0) {
      return undefined
    }

    // First, try to find an exact match
    const exactMatch = snapshots.find(s => s.snapshotDate === targetDate)
    if (exactMatch) {
      return exactMatch
    }

    // Find the closest snapshot to the target date
    // Prefer snapshots before the target date, but accept after if none before
    const targetYear = parseInt(targetDate.substring(0, 4))

    // Filter snapshots from the same year as target
    const sameYearSnapshots = snapshots.filter(s => {
      const snapshotYear = parseInt(s.snapshotDate.substring(0, 4))
      return snapshotYear === targetYear
    })

    if (sameYearSnapshots.length > 0) {
      // Return the latest snapshot from the same year
      return sameYearSnapshots[sameYearSnapshots.length - 1]
    }

    // If no snapshots from the same year, find the closest one
    let closestSnapshot: DistrictStatistics | undefined
    let closestDiff = Infinity
    const MAX_PROXIMITY_MS = 180 * 24 * 60 * 60 * 1000 // 180 days

    for (const snapshot of snapshots) {
      const diff = Math.abs(
        new Date(snapshot.snapshotDate).getTime() -
          new Date(targetDate).getTime()
      )
      if (diff < closestDiff) {
        closestDiff = diff
        closestSnapshot = snapshot
      }
    }

    // Reject if closest snapshot is too far from target
    if (closestDiff > MAX_PROXIMITY_MS) {
      return undefined
    }

    return closestSnapshot
  }

  /**
   * Compute year-over-year metrics comparing two snapshots.
   *
   * @param currentSnapshot - Current period snapshot
   * @param previousSnapshot - Previous year snapshot
   * @returns Metrics comparison object
   */
  private computeYearOverYearMetrics(
    currentSnapshot: DistrictStatistics,
    previousSnapshot: DistrictStatistics
  ): NonNullable<YearOverYearData['metrics']> {
    // Membership comparison
    const currentMembership =
      this.membershipModule.getTotalMembership(currentSnapshot)
    const previousMembership =
      this.membershipModule.getTotalMembership(previousSnapshot)
    const membership = this.createMetricComparison(
      currentMembership,
      previousMembership
    )

    // Distinguished clubs comparison
    const currentDistinguished =
      this.distinguishedModule.generateDistinguishedClubCounts([
        currentSnapshot,
      ])
    const previousDistinguished =
      this.distinguishedModule.generateDistinguishedClubCounts([
        previousSnapshot,
      ])
    const distinguishedClubs = this.createMetricComparison(
      currentDistinguished.total,
      previousDistinguished.total
    )

    // Club health comparison
    const currentHealth = this.clubHealthModule.generateClubHealthData([
      currentSnapshot,
    ])
    const previousHealth = this.clubHealthModule.generateClubHealthData([
      previousSnapshot,
    ])

    const clubHealth = {
      thrivingClubs: this.createMetricComparison(
        currentHealth.thrivingClubs.length,
        previousHealth.thrivingClubs.length
      ),
      vulnerableClubs: this.createMetricComparison(
        currentHealth.vulnerableClubs.length,
        previousHealth.vulnerableClubs.length
      ),
      interventionRequiredClubs: this.createMetricComparison(
        currentHealth.interventionRequiredClubs.length,
        previousHealth.interventionRequiredClubs.length
      ),
    }

    // DCP goals comparison
    const currentTotalGoals = currentSnapshot.clubs.reduce(
      (sum, club) => sum + club.dcpGoals,
      0
    )
    const previousTotalGoals = previousSnapshot.clubs.reduce(
      (sum, club) => sum + club.dcpGoals,
      0
    )
    const currentAvgGoals =
      currentSnapshot.clubs.length > 0
        ? Math.round((currentTotalGoals / currentSnapshot.clubs.length) * 10) /
          10
        : 0
    const previousAvgGoals =
      previousSnapshot.clubs.length > 0
        ? Math.round(
            (previousTotalGoals / previousSnapshot.clubs.length) * 10
          ) / 10
        : 0

    const dcpGoals = {
      totalGoals: this.createMetricComparison(
        currentTotalGoals,
        previousTotalGoals
      ),
      averagePerClub: this.createMetricComparison(
        currentAvgGoals,
        previousAvgGoals
      ),
    }

    // Club count comparison
    const clubCount = this.createMetricComparison(
      currentSnapshot.clubs.length,
      previousSnapshot.clubs.length
    )

    return {
      membership,
      distinguishedClubs,
      clubHealth,
      dcpGoals,
      clubCount,
    }
  }

  /**
   * Create a metric comparison object.
   *
   * @param current - Current value
   * @param previous - Previous value
   * @returns MetricComparison object
   */
  private createMetricComparison(
    current: number,
    previous: number
  ): MetricComparison {
    const change = current - previous
    const percentageChange = calculatePercentageChange(previous, current)

    return {
      current,
      previous,
      change,
      percentageChange,
    }
  }

  /**
   * Compute multi-year trends from historical snapshots.
   *
   * Generates trend data for up to 5 years of historical data.
   *
   * @param snapshots - Array of district statistics snapshots
   * @param currentDate - Current date for reference
   * @returns Array of multi-year trend data points, or undefined if insufficient data
   */
  private computeMultiYearTrends(
    snapshots: DistrictStatistics[],
    currentDate: string
  ): MultiYearTrend[] | undefined {
    if (snapshots.length < 2) {
      return undefined
    }

    const currentYear = parseInt(currentDate.substring(0, 4))
    const trends: MultiYearTrend[] = []

    // Look back up to 5 years
    for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
      const targetYear = currentYear - yearOffset
      const targetDate = `${targetYear}${currentDate.substring(4)}`

      const snapshot = this.findSnapshotForDate(snapshots, targetDate)
      if (!snapshot) {
        continue
      }

      const membership = this.membershipModule.getTotalMembership(snapshot)
      const distinguishedCounts =
        this.distinguishedModule.generateDistinguishedClubCounts([snapshot])
      const totalDcpGoals = snapshot.clubs.reduce(
        (sum, club) => sum + club.dcpGoals,
        0
      )

      trends.push({
        year: targetYear,
        date: snapshot.snapshotDate,
        membership,
        distinguishedClubs: distinguishedCounts.total,
        totalDcpGoals,
        clubCount: snapshot.clubs.length,
      })
    }

    // Sort by year ascending
    trends.sort((a, b) => a.year - b.year)

    // Return undefined if we don't have at least 2 years of data
    if (trends.length < 2) {
      return undefined
    }

    return trends
  }

  /**
   * Compute performance targets data for a district.
   *
   * This method uses the AreaDivisionRecognitionModule to compute
   * recognition level targets (DAP, DDP) and progress tracking for
   * district performance metrics.
   *
   * Targets are based on:
   * - Membership: 5% growth target from base membership
   * - Distinguished clubs: 50% of paid clubs target (Distinguished level threshold)
   * - Club growth: Net positive club growth target
   *
   * Projections are based on current progress vs. targets and trend analysis.
   *
   * Per-metric rankings are computed using the MetricRankingsCalculator when
   * allDistrictsRankings data is available. Rankings include world rank,
   * world percentile, and region rank for each metric.
   *
   * Requirements: 7.1, 7.2, 1.1, 1.2, 1.3, 1.4, 1.5
   *
   * @param districtId - The district identifier
   * @param snapshots - Array of district statistics snapshots (sorted by date ascending)
   * @param allDistrictsRankings - Optional all-districts rankings data for computing per-metric rankings
   * @returns PerformanceTargetsData object for pre-computed file
   */
  computePerformanceTargets(
    districtId: string,
    snapshots: DistrictStatistics[],
    allDistrictsRankings?: AllDistrictsRankingsData
  ): PerformanceTargetsData {
    // Filter snapshots for the requested district
    const districtSnapshots = snapshots.filter(s => s.districtId === districtId)

    // Default null rankings when all-districts data is not available
    // Requirement 1.5: When all-districts-rankings.json is not available, set all rankings to null
    const nullRankings: MetricRankings = {
      worldRank: null,
      worldPercentile: null,
      regionRank: null,
      totalDistricts: 0,
      totalInRegion: 0,
      region: null,
    }

    // Compute per-metric rankings using the calculator when data is available
    // Requirements 1.1, 1.2, 1.3, 1.4: Use existing ranks from all-districts-rankings.json
    let paidClubsRankings: MetricRankings = nullRankings
    let membershipPaymentsRankings: MetricRankings = nullRankings
    let distinguishedClubsRankings: MetricRankings = nullRankings

    if (allDistrictsRankings) {
      // Requirement 1.2: Per-metric world rank for paid clubs SHALL equal clubsRank
      paidClubsRankings = this.metricRankingsCalculator.calculateMetricRankings(
        districtId,
        'clubs',
        allDistrictsRankings
      )
      // Requirement 1.3: Per-metric world rank for membership payments SHALL equal paymentsRank
      membershipPaymentsRankings =
        this.metricRankingsCalculator.calculateMetricRankings(
          districtId,
          'payments',
          allDistrictsRankings
        )
      // Requirement 1.4: Per-metric world rank for distinguished clubs SHALL equal distinguishedRank
      distinguishedClubsRankings =
        this.metricRankingsCalculator.calculateMetricRankings(
          districtId,
          'distinguished',
          allDistrictsRankings
        )
    }

    // Extract base values from all-districts rankings
    // Requirements 1.1, 1.2, 1.3: Extract paidClubBase and paymentBase from rankings
    const districtRanking = allDistrictsRankings?.rankings.find(
      r => r.districtId === districtId
    )

    const paidClubBase = districtRanking?.paidClubBase ?? null
    const paymentBase = districtRanking?.paymentBase ?? null

    // Calculate recognition targets using TargetCalculator
    // Requirements 2.1-2.5, 3.1-3.5, 4.1-4.5
    const paidClubsTargets =
      paidClubBase !== null ? calculateGrowthTargets(paidClubBase) : null

    const membershipPaymentsTargets =
      paymentBase !== null ? calculateGrowthTargets(paymentBase) : null

    const distinguishedClubsTargets =
      paidClubBase !== null ? calculatePercentageTargets(paidClubBase) : null

    // Handle empty snapshots case
    if (districtSnapshots.length === 0) {
      return {
        districtId,
        computedAt: new Date().toISOString(),
        membershipTarget: 0,
        distinguishedTarget: 0,
        clubGrowthTarget: 0,
        paidClubsCount: 0,
        currentProgress: {
          membership: 0,
          distinguished: 0,
          clubGrowth: 0,
        },
        projectedAchievement: {
          membership: false,
          distinguished: false,
          clubGrowth: false,
        },
        paidClubsRankings,
        membershipPaymentsRankings,
        distinguishedClubsRankings,
        // NEW: Base values from All Districts Rankings (Requirements 1.1, 1.2, 1.3)
        paidClubBase,
        paymentBase,
        // NEW: Recognition level targets (Requirements 2.1-2.5, 3.1-3.5, 4.1-4.5)
        paidClubsTargets,
        membershipPaymentsTargets,
        distinguishedClubsTargets,
        // NEW: Achieved recognition levels - null when no snapshots (Requirements 5.6)
        paidClubsAchievedLevel: null,
        membershipPaymentsAchievedLevel: null,
        distinguishedClubsAchievedLevel: null,
      }
    }

    // Get the latest snapshot for current values
    const latestSnapshot = districtSnapshots[districtSnapshots.length - 1]
    if (!latestSnapshot) {
      return {
        districtId,
        computedAt: new Date().toISOString(),
        membershipTarget: 0,
        distinguishedTarget: 0,
        clubGrowthTarget: 0,
        paidClubsCount: 0,
        currentProgress: {
          membership: 0,
          distinguished: 0,
          clubGrowth: 0,
        },
        projectedAchievement: {
          membership: false,
          distinguished: false,
          clubGrowth: false,
        },
        paidClubsRankings,
        membershipPaymentsRankings,
        distinguishedClubsRankings,
        // NEW: Base values from All Districts Rankings (Requirements 1.1, 1.2, 1.3)
        paidClubBase,
        paymentBase,
        // NEW: Recognition level targets (Requirements 2.1-2.5, 3.1-3.5, 4.1-4.5)
        paidClubsTargets,
        membershipPaymentsTargets,
        distinguishedClubsTargets,
        // NEW: Achieved recognition levels - null when no latest snapshot (Requirements 5.6)
        paidClubsAchievedLevel: null,
        membershipPaymentsAchievedLevel: null,
        distinguishedClubsAchievedLevel: null,
      }
    }

    // Get base snapshot (first in the period) for calculating growth
    const baseSnapshot = districtSnapshots[0]

    // Get totalPayments from allDistrictsRankings if available (official Toastmasters value)
    // This matches the value shown on the landing page from the district rankings CSV
    // Note: districtRanking is already extracted above for base values
    const currentMembershipPayments =
      districtRanking?.totalPayments ??
      this.membershipModule.getTotalPayments(latestSnapshot)

    // Calculate current membership (for membership target calculation)
    const currentMembership =
      this.membershipModule.getTotalMembership(latestSnapshot)
    const baseMembership = baseSnapshot
      ? this.membershipModule.getTotalMembership(baseSnapshot)
      : currentMembership

    // Calculate membership target (5% growth from base)
    const membershipGrowthRate = 0.05
    const membershipTarget = Math.ceil(
      baseMembership * (1 + membershipGrowthRate)
    )

    // Use AreaDivisionRecognitionModule to get area recognition data
    const areaRecognitions =
      this.areaDivisionRecognitionModule.calculateAreaRecognition(
        latestSnapshot
      )

    // Calculate total paid clubs and distinguished clubs from area recognition
    const totalPaidClubs = areaRecognitions.reduce(
      (sum, area) => sum + area.paidClubs,
      0
    )
    const currentDistinguished = areaRecognitions.reduce(
      (sum, area) => sum + area.distinguishedClubs,
      0
    )

    // Distinguished target: 50% of paid clubs (Distinguished level threshold from DAP)
    // This aligns with the DAP_DISTINGUISHED_THRESHOLD of 50%
    const distinguishedTarget = Math.ceil(totalPaidClubs * 0.5)

    // Calculate club growth
    const currentClubCount = latestSnapshot.clubs.length
    const baseClubCount = baseSnapshot
      ? baseSnapshot.clubs.length
      : currentClubCount
    const clubGrowth = currentClubCount - baseClubCount

    // Club growth target: Net positive growth (at least 1 new club)
    const clubGrowthTarget = Math.max(1, Math.ceil(baseClubCount * 0.02)) // 2% growth or at least 1

    // Calculate projected achievements based on current progress and trends
    const membershipProgress = currentMembership / membershipTarget
    const distinguishedProgress =
      distinguishedTarget > 0 ? currentDistinguished / distinguishedTarget : 0
    const clubGrowthProgress =
      clubGrowthTarget > 0 ? clubGrowth / clubGrowthTarget : 0

    // Project achievement based on progress rate
    // If progress is >= 80%, project achievement as likely
    const projectedMembership = membershipProgress >= 0.8
    const projectedDistinguished = distinguishedProgress >= 0.8
    const projectedClubGrowth = clubGrowthProgress >= 0.8

    return {
      districtId,
      computedAt: new Date().toISOString(),
      membershipTarget,
      distinguishedTarget,
      clubGrowthTarget,
      paidClubsCount: totalPaidClubs,
      currentProgress: {
        // Use totalPayments from rankings (official Toastmasters value) for membership payments
        membership: currentMembershipPayments,
        distinguished: currentDistinguished,
        clubGrowth,
      },
      projectedAchievement: {
        membership: projectedMembership,
        distinguished: projectedDistinguished,
        clubGrowth: projectedClubGrowth,
      },
      paidClubsRankings,
      membershipPaymentsRankings,
      distinguishedClubsRankings,
      // NEW: Base values from All Districts Rankings (Requirements 1.1, 1.2, 1.3)
      paidClubBase,
      paymentBase,
      // NEW: Recognition level targets (Requirements 2.1-2.5, 3.1-3.5, 4.1-4.5)
      paidClubsTargets,
      membershipPaymentsTargets,
      distinguishedClubsTargets,
      // NEW: Achieved recognition levels (Requirements 5.1-5.6)
      paidClubsAchievedLevel: determineAchievedLevel(
        totalPaidClubs,
        paidClubsTargets
      ),
      membershipPaymentsAchievedLevel: determineAchievedLevel(
        currentMembershipPayments,
        membershipPaymentsTargets
      ),
      distinguishedClubsAchievedLevel: determineAchievedLevel(
        currentDistinguished,
        distinguishedClubsTargets
      ),
    }
  }

  /**
   * Build a club trends index for efficient O(1) lookup by club ID.
   *
   * This method transforms the allClubs array from ClubHealthData into
   * a Record<string, ClubTrend> indexed by club ID, enabling efficient
   * retrieval of individual club trend data without iterating through
   * the entire array.
   *
   * Requirements: 2.1, 2.2
   *
   * @param districtId - The district identifier
   * @param clubHealth - Club health data containing the allClubs array
   * @returns ClubTrendsIndex object for pre-computed file
   */
  buildClubTrendsIndex(
    districtId: string,
    clubHealth: ClubHealthData
  ): ClubTrendsIndex {
    // Build the clubs index from the allClubs array
    const clubs: Record<string, ClubTrend> = {}

    for (const club of clubHealth.allClubs) {
      clubs[club.clubId] = club
    }

    return {
      districtId,
      computedAt: new Date().toISOString(),
      clubs,
    }
  }
}
