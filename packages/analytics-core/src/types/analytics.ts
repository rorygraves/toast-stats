/**
 * Core district analytics types.
 *
 * Types for the complete district analytics structure, computation results,
 * and the extended analytics computation result that combines all modules.
 */

import type {
  MembershipTrendPoint,
  PaymentsTrendPoint,
  MembershipTrendData,
  MembershipAnalyticsData,
} from './membership.js'
import type {
  ClubTrend,
  ClubHealthData,
  VulnerableClubsData,
  ClubTrendsIndex,
} from './clubHealth.js'
import type { DivisionRanking, AreaPerformance } from './divisionArea.js'
import type {
  DistinguishedProjection,
  DistinguishedClubSummary,
  DistinguishedClubCounts,
  DistinguishedClubAnalyticsData,
} from './distinguished.js'
import type { DateRange } from './metadata.js'
import type { LeadershipInsightsData } from './leadership.js'
import type { YearOverYearData } from './yearOverYear.js'
import type { PerformanceTargetsData } from './performanceTargets.js'
import type { ProspectiveClub } from '@toastmasters/shared-contracts'

/**
 * Complete district analytics structure.
 * This matches the frontend DistrictAnalytics type exactly.
 */
export interface DistrictAnalytics {
  districtId: string
  dateRange: DateRange
  totalMembership: number
  membershipChange: number
  memberCountChange: number
  membershipTrend: MembershipTrendPoint[]
  /** Payments trend over time (optional for backward compatibility) */
  paymentsTrend?: PaymentsTrendPoint[]
  allClubs: ClubTrend[]
  vulnerableClubs: ClubTrend[]
  thrivingClubs: ClubTrend[]
  interventionRequiredClubs: ClubTrend[]
  /** Summary counts of distinguished clubs by level */
  distinguishedClubs: DistinguishedClubCounts
  /** Detailed list of distinguished clubs */
  distinguishedClubsList: DistinguishedClubSummary[]
  distinguishedProjection: DistinguishedProjection
  divisionRankings: DivisionRanking[]
  topPerformingAreas: AreaPerformance[]
  /** Top clubs by membership growth (positive growth only, sorted descending) */
  topGrowthClubs: Array<{ clubId: string; clubName: string; growth: number }>

  /**
   * FAC-only clubs (typically ATOs / fresh charters) that aren't in
   * clubPerformance. Surfaced verbatim from the latest snapshot —
   * never folded into rankings, distinguished counts, or membership
   * trends. Always an array (possibly empty) — consistent with
   * sibling list fields (`allClubs`, `vulnerableClubs`).
   *
   * @see Issue #489
   */
  prospectiveClubs: ProspectiveClub[]
}

/**
 * Result of analytics computation.
 */
export interface AnalyticsComputationResult {
  districtAnalytics: DistrictAnalytics
  membershipTrends: MembershipTrendData
  clubHealth: ClubHealthData
  computedAt: string
  schemaVersion: string
}

// ========== Extended Analytics Computation Result ==========

/**
 * Extended analytics computation result.
 * Extends the base AnalyticsComputationResult with all additional
 * pre-computed analytics data types.
 *
 * This is the complete result returned by computeDistrictAnalytics
 * when all analytics modules are invoked.
 *
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
 */
export interface ExtendedAnalyticsComputationResult extends AnalyticsComputationResult {
  /** Membership analytics data for pre-computed file */
  membershipAnalytics: MembershipAnalyticsData
  /** Vulnerable clubs data for pre-computed file */
  vulnerableClubs: VulnerableClubsData
  /** Leadership insights data for pre-computed file */
  leadershipInsights: LeadershipInsightsData
  /** Distinguished club analytics data for pre-computed file */
  distinguishedClubAnalytics: DistinguishedClubAnalyticsData
  /** Year-over-year comparison data for pre-computed file */
  yearOverYear: YearOverYearData
  /** Performance targets data for pre-computed file */
  performanceTargets: PerformanceTargetsData
  /** Club trends index for efficient O(1) lookup by club ID */
  clubTrendsIndex: ClubTrendsIndex
}
