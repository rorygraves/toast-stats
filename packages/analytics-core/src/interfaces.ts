/**
 * Core interfaces for analytics computation and data transformation.
 *
 * These interfaces define the contracts that implementations must follow,
 * enabling both collector-cli and backend to use the same computation logic.
 */

import type {
  ComputeOptions,
  ExtendedAnalyticsComputationResult,
} from './types.js'
import type {
  ProspectiveClub,
  ScrapedRecord,
} from '@toastmasters/shared-contracts'

/**
 * Raw CSV data structure from Toastmasters dashboard.
 * This represents the parsed CSV data before transformation.
 */
export interface RawCSVData {
  clubPerformance?: string[][]
  divisionPerformance?: string[][]
  districtPerformance?: string[][]
}

/**
 * District statistics snapshot data.
 * This is the transformed data structure used for analytics computation.
 */
export interface DistrictStatistics {
  districtId: string
  snapshotDate: string
  clubs: ClubStatistics[]
  divisions: DivisionStatistics[]
  areas: AreaStatistics[]
  totals: DistrictTotals

  // Raw CSV data arrays - required for frontend division/area calculations
  divisionPerformance: ScrapedRecord[]
  clubPerformance: ScrapedRecord[]
  districtPerformance: ScrapedRecord[]

  /**
   * Clubs in the public Find-A-Club registry but absent from
   * clubPerformance — typically ATOs (Applications To Organize) or
   * freshly-chartered clubs not yet reporting. Populated by the
   * collector's FindAClubMerger. Optional and back-compat: pre-#489
   * snapshots simply omit the field. Excluded from analytics
   * aggregates by design (no DCP / payments / status data).
   *
   * @see Issue #489
   */
  prospectiveClubs?: ProspectiveClub[]
}

/**
 * Individual club statistics.
 */
export interface ClubStatistics {
  clubId: string
  clubName: string
  divisionId: string
  areaId: string
  membershipCount: number
  paymentsCount: number
  dcpGoals: number
  status: string
  charterDate?: string

  // Division and Area names (for display purposes)
  divisionName: string
  areaName: string

  // Payment breakdown fields
  octoberRenewals: number
  aprilRenewals: number
  newMembers: number

  // Membership base for net growth calculation
  membershipBase: number

  // Club operational status (Active, Suspended, Low, Ineligible)
  clubStatus?: string

  // CSP (Club Success Plan) submission status
  // Present from 2025-2026 program year onward; undefined for earlier years
  cspSubmitted?: boolean

  // Exact list of 10 boolean flags representing which DCP goals were achieved
  dcpGoalsAchieved?: boolean[]

  // Find-A-Club enrichment (#429 / #503). All optional — populated by
  // FindAClubMerger from the public TI Find-A-Club Search endpoint.
  // Analytics propagates these onto ClubTrend so the frontend Club
  // hero can render CHARTERED + meeting / contact info.
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
 * Division-level statistics.
 */
export interface DivisionStatistics {
  divisionId: string
  divisionName: string
  clubCount: number
  membershipTotal: number
  paymentsTotal: number
}

/**
 * Area-level statistics.
 */
export interface AreaStatistics {
  areaId: string
  areaName: string
  divisionId: string
  clubCount: number
  membershipTotal: number
  paymentsTotal: number
}

/**
 * District-level totals.
 */
export interface DistrictTotals {
  totalClubs: number
  totalMembership: number
  totalPayments: number
  distinguishedClubs: number
  selectDistinguishedClubs: number
  presidentDistinguishedClubs: number
}

/**
 * Snapshot metadata.
 */
export interface SnapshotMetadata {
  snapshotDate: string
  createdAt: string
  districtCount: number
  version: string
}

/**
 * Complete snapshot structure.
 */
export interface Snapshot {
  metadata: SnapshotMetadata
  districts: DistrictStatistics[]
}

/**
 * Interface for analytics computation.
 * Implementations compute analytics from district statistics.
 */
export interface IAnalyticsComputer {
  /**
   * Computes comprehensive analytics for a district.
   *
   * Returns an ExtendedAnalyticsComputationResult containing all pre-computed
   * analytics data types needed for the backend to serve.
   *
   * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1
   *
   * @param districtId - The district identifier
   * @param snapshots - Array of district statistics snapshots (for trend analysis)
   * @param options - Optional computation options
   * @returns Promise resolving to the extended computation result
   */
  computeDistrictAnalytics(
    districtId: string,
    snapshots: DistrictStatistics[],
    options?: ComputeOptions
  ): Promise<ExtendedAnalyticsComputationResult>
}

/**
 * Interface for data transformation.
 * Implementations transform raw CSV data into snapshot format.
 */
export interface IDataTransformer {
  /**
   * Transforms raw CSV data into district statistics.
   *
   * @param date - The snapshot date (YYYY-MM-DD)
   * @param districtId - The district identifier
   * @param csvData - Raw CSV data from Toastmasters dashboard
   * @returns Promise resolving to transformed district statistics
   */
  transformRawCSV(
    date: string,
    districtId: string,
    csvData: RawCSVData
  ): Promise<DistrictStatistics>

  /**
   * Creates a complete snapshot from multiple district statistics.
   *
   * @param date - The snapshot date (YYYY-MM-DD)
   * @param districts - Array of district statistics
   * @returns Promise resolving to the complete snapshot
   */
  createSnapshot(
    date: string,
    districts: DistrictStatistics[]
  ): Promise<Snapshot>
}
