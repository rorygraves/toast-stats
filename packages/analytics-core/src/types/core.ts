/**
 * Core type definitions for analytics computation.
 *
 * These types define the structure of analytics data that flows through
 * the pre-computed analytics pipeline.
 */

import type {
  AllDistrictsRankingsData,
  ClubHealthStatus,
} from '@toastmasters/shared-contracts'

/**
 * Metadata included in every pre-computed analytics file.
 */
export interface AnalyticsMetadata {
  /** Schema version for compatibility checking */
  schemaVersion: string
  /** ISO timestamp when analytics were computed */
  computedAt: string
  /** Date of the snapshot used for computation (YYYY-MM-DD) */
  snapshotDate: string
  /** District identifier */
  districtId: string
  /** SHA256 checksum of the data field */
  checksum: string
  /** SHA256 checksum of the source snapshot file used for computation (Requirement 5.4) */
  sourceSnapshotChecksum?: string
}

/**
 * Membership trend data point.
 */
export interface MembershipTrendPoint {
  date: string
  count: number
}

/**
 * Payments trend data point.
 */
export interface PaymentsTrendPoint {
  date: string
  payments: number
}

/**
 * Year-over-year comparison data.
 */
export interface YearOverYearComparison {
  currentYear: number
  previousYear: number
  membershipChange: number
  membershipChangePercent: number
  paymentsChange: number
  paymentsChangePercent: number
}

/**
 * Membership trends data structure.
 */
export interface MembershipTrendData {
  membershipTrend: MembershipTrendPoint[]
  paymentsTrend: PaymentsTrendPoint[]
  yearOverYear?: YearOverYearComparison
}

/**
 * Risk factors for club health assessment.
 */
export interface ClubRiskFactors {
  lowMembership: boolean
  decliningMembership: boolean
  lowPayments: boolean
  inactiveOfficers: boolean
  noRecentMeetings: boolean
}

/**
 * Club health status classification.
 * Re-exported from shared-contracts for consistency across all packages.
 *
 * @see Requirements 2.3
 */
export type { ClubHealthStatus } from '@toastmasters/shared-contracts'

/**
 * Distinguished level classification for clubs.
 * Based on DCP goals achieved and membership thresholds.
 */
export type DistinguishedLevel =
  | 'NotDistinguished'
  | 'Smedley'
  | 'President'
  | 'Select'
  | 'Distinguished'

/**
 * DCP goals trend data point.
 */
export interface DcpGoalsTrendPoint {
  date: string
  goalsAchieved: number
}

/**
 * Individual club trend data.
 * Enhanced to include all fields required by frontend.
 */
export interface ClubTrend {
  // Core identification
  clubId: string
  clubName: string

  // Division and Area information (Requirements 1.1, 1.2)
  divisionId: string
  divisionName: string
  areaId: string
  areaName: string

  // Health assessment
  currentStatus: ClubHealthStatus
  healthScore: number

  // Membership and payments
  membershipCount: number
  membershipBase: number
  paymentsCount: number

  // Trend arrays (Requirements 1.3, 1.4)
  membershipTrend: MembershipTrendPoint[]
  dcpGoalsTrend: DcpGoalsTrendPoint[]

  // Risk factors as string array (Requirement 1.6)
  riskFactors: string[]

  // Distinguished level (Requirement 1.5)
  distinguishedLevel: DistinguishedLevel

  // Payment breakdown fields (Requirement 1.7)
  octoberRenewals?: number
  aprilRenewals?: number
  newMembers?: number

  // Club operational status (Requirement 1.8)
  clubStatus?: string

  // CSP submission status — already on ClubStatistics, surfaced here
  // so /district/:id/club/:cid can render it (#290 / pre-existing).
  cspSubmitted?: boolean

  // Find-A-Club enrichment (#429 / #503). All optional — propagated
  // from ClubStatistics by analytics. Surfaces in the Club hero
  // CHARTERED eyebrow + future map / contact panels.
  charterDate?: string
  coordinates?: { lat: number; lng: number }
  address?: {
    street?: string
    city?: string
    region?: string
    postalCode?: string
    country?: string
  }
  email?: string
  phone?: string
  website?: string
  facebookLink?: string
  twitterLink?: string
  meetingDay?: string
  meetingTime?: string
  allowsVirtualAttendance?: boolean
  isProspective?: boolean
}

/**
 * Club health data structure.
 */
export interface ClubHealthData {
  allClubs: ClubTrend[]
  thrivingClubs: ClubTrend[]
  vulnerableClubs: ClubTrend[]
  interventionRequiredClubs: ClubTrend[]
}

/**
 * Division ranking data.
 */
export interface DivisionRanking {
  divisionId: string
  divisionName: string
  rank: number
  score: number
  clubCount: number
  membershipTotal: number
}

/**
 * Area performance data.
 */
export interface AreaPerformance {
  areaId: string
  areaName: string
  divisionId: string
  score: number
  clubCount: number
  membershipTotal: number
}

/**
 * Trend direction for analytics.
 * Used for division and area trend indicators.
 */
export type TrendDirection = 'improving' | 'stable' | 'declining'

/**
 * Division analytics data structure.
 * Contains division performance metrics with rankings and trends.
 *
 * Requirements: 4.1
 */
export interface DivisionAnalytics {
  divisionId: string
  divisionName: string
  totalClubs: number
  totalDcpGoals: number
  averageClubHealth: number
  rank: number
  trend: TrendDirection
}

/**
 * Area analytics data structure.
 * Contains area performance metrics with normalized scores.
 *
 * Requirements: 4.1
 */
export interface AreaAnalytics {
  areaId: string
  areaName: string
  divisionId: string
  totalClubs: number
  averageClubHealth: number
  totalDcpGoals: number
  normalizedScore: number
}

/**
 * Distinguished club projection data.
 * Simplified to a single projected field (projectedDistinguished = thriving count).
 *
 * Requirements: 2.1, 2.2
 */
export interface DistinguishedProjection {
  projectedDistinguished: number // Single projected field = thriving count
  currentDistinguished: number
  currentSelect: number
  currentPresident: number
  projectionDate: string
}

/**
 * Distinguished club summary.
 */
export interface DistinguishedClubSummary {
  clubId: string
  clubName: string
  status: 'smedley' | 'president' | 'select' | 'distinguished' | 'none'
  dcpPoints: number
  goalsCompleted: number
}

/**
 * Summary counts of distinguished clubs by recognition level.
 * Used in DistrictAnalytics.distinguishedClubs field.
 */
export interface DistinguishedClubCounts {
  /** Clubs achieving Smedley Distinguished (10+ goals, 25+ members) */
  smedley: number
  /** Clubs achieving President's Distinguished (9+ goals, 20+ members) */
  presidents: number
  /** Clubs achieving Select Distinguished (7+ goals, 20+ members) */
  select: number
  /** Clubs achieving Distinguished (5+ goals, 20+ members) */
  distinguished: number
  /** Total count of all distinguished clubs */
  total: number
}

/**
 * Date range for analytics.
 */
export interface DateRange {
  start: string
  end: string
}

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

/**
 * Options for analytics computation.
 */
export interface ComputeOptions {
  /** Force recomputation even if cached results exist */
  force?: boolean
  /** Enable verbose logging */
  verbose?: boolean
  /**
   * All-districts rankings data for computing per-metric rankings.
   * When provided, rankings (world rank, world percentile, region rank) will be
   * computed for each metric in performance targets.
   * Requirement 5.2: Pass all-districts rankings data to computePerformanceTargets
   */
  allDistrictsRankings?: AllDistrictsRankingsData
  /**
   * Pre-accumulated club trend history from the ClubTrendsStore (#144).
   * When provided, ClubHealthAnalyticsModule uses these trend arrays instead
   * of deriving them from the snapshots array. This allows dense trend data
   * (spanning the full program year) without needing to load all historical
   * snapshots on the ephemeral pipeline runner.
   *
   * Keys are clubIds. Values contain trend arrays sorted ascending by date.
   */
  preloadedClubTrends?: Record<
    string,
    {
      membershipTrend: Array<{ date: string; count: number }>
      dcpGoalsTrend: Array<{ date: string; goalsAchieved: number }>
    }
  >
}

/**
 * Pre-computed analytics file wrapper.
 * All analytics files follow this structure.
 */
export interface PreComputedAnalyticsFile<T> {
  metadata: AnalyticsMetadata
  data: T
}

/**
 * Analytics manifest entry for a single file.
 */
export interface AnalyticsManifestEntry {
  filename: string
  districtId: string
  type:
    | 'analytics'
    | 'membership'
    | 'clubhealth'
    | 'rankings'
    | 'membership-analytics'
    | 'vulnerable-clubs'
    | 'leadership-insights'
    | 'distinguished-analytics'
    | 'year-over-year'
    | 'performance-targets'
    | 'club-trends-index'
  size: number
  checksum: string
}

/**
 * Analytics manifest for a snapshot date.
 */
export interface AnalyticsManifest {
  snapshotDate: string
  generatedAt: string
  schemaVersion: string
  files: AnalyticsManifestEntry[]
  totalFiles: number
  totalSize: number
}
