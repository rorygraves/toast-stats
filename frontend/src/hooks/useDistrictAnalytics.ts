import { useQuery } from '@tanstack/react-query'
import {
  fetchCdnManifest,
  cdnAnalyticsUrl,
  fetchFromCdn,
} from '../services/cdn'
import type {
  ClubHealthStatus,
  ProspectiveClub,
} from '@toastmasters/shared-contracts'

// Re-export for backward compatibility with existing imports
export type { ClubHealthStatus, ProspectiveClub }

export interface ClubTrend {
  clubId: string
  clubName: string
  divisionId: string
  divisionName: string
  areaId: string
  areaName: string
  membershipTrend: Array<{ date: string; count: number }>
  dcpGoalsTrend: Array<{ date: string; goalsAchieved: number }>
  membershipBase?: number
  currentStatus: ClubHealthStatus
  riskFactors: string[]
  distinguishedLevel:
    | 'NotDistinguished'
    | 'Smedley'
    | 'President'
    | 'Select'
    | 'Distinguished'
  // Membership payment fields
  octoberRenewals?: number
  aprilRenewals?: number
  newMembers?: number
  dcpGoalsAchieved?: boolean[]
  /**
   * Club operational status from Toastmasters dashboard
   * Values: "Active", "Suspended", "Ineligible", "Low", or undefined
   */
  clubStatus?: string
  /** Whether Distinguished status is provisional (pre-April, unconfirmed) */
  isProvisionallyDistinguished?: boolean
  /** Club Success Plan submission status (2025-2026+). Undefined for pre-2025 data. */
  cspSubmitted?: boolean
  /**
   * Find-A-Club enrichment fields (#429 / #432 / #503). All optional.
   * Populated by FindAClubMerger from the public TI Find-A-Club Search
   * endpoint and propagated through ClubHealthAnalyticsModule onto
   * each ClubTrend in the analytics JSON. Absent until the daily
   * pipeline has run with the merger active for the snapshot.
   */
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

export interface DivisionAnalytics {
  divisionId: string
  divisionName: string
  totalClubs: number
  totalDcpGoals: number
  averageClubHealth: number
  rank: number
  trend: 'improving' | 'stable' | 'declining'
}

export interface AreaAnalytics {
  areaId: string
  areaName: string
  divisionId: string
  totalClubs: number
  averageClubHealth: number
  totalDcpGoals: number
  normalizedScore: number
}

// ========== Distinguished Area Program (DAP) Types ==========

/**
 * Recognition level for Areas and Divisions
 * Ordinal: NotDistinguished < Distinguished < Select < Presidents
 */
export type AreaDivisionRecognitionLevel =
  | 'NotDistinguished'
  | 'Distinguished'
  | 'Select'
  | 'Presidents'

/**
 * Eligibility status for DAP/DDP recognition
 */
export type RecognitionEligibility = 'eligible' | 'ineligible' | 'unknown'

/**
 * Distinguished Area Program (DAP) metrics and recognition
 */
export interface AreaRecognition {
  areaId: string
  areaName: string
  divisionId: string
  totalClubs: number
  paidClubs: number
  distinguishedClubs: number
  paidClubsPercent: number
  distinguishedClubsPercent: number
  eligibility: RecognitionEligibility
  eligibilityReason?: string
  recognitionLevel: AreaDivisionRecognitionLevel
  meetsPaidThreshold: boolean
  meetsDistinguishedThreshold: boolean
}

/**
 * Distinguished Division Program (DDP) metrics and recognition
 */
export interface DivisionRecognition {
  divisionId: string
  divisionName: string
  totalAreas: number
  paidAreas: number
  distinguishedAreas: number
  paidAreasPercent: number
  distinguishedAreasPercent: number
  eligibility: RecognitionEligibility
  eligibilityReason?: string
  recognitionLevel: AreaDivisionRecognitionLevel
  meetsPaidThreshold: boolean
  meetsDistinguishedThreshold: boolean
  areas: AreaRecognition[]
}

export interface DistrictAnalytics {
  districtId: string
  dateRange: { start: string; end: string }
  totalMembership: number
  membershipChange: number
  memberCountChange?: number
  membershipTrend: Array<{ date: string; count: number }>
  paymentsTrend?: Array<{ date: string; payments: number }>
  topGrowthClubs: Array<{ clubId: string; clubName: string; growth: number }>
  allClubs: ClubTrend[]
  vulnerableClubs: ClubTrend[] // Contains only vulnerable clubs (not intervention-required)
  thrivingClubs: ClubTrend[]
  interventionRequiredClubs: ClubTrend[]
  distinguishedClubs: {
    smedley: number
    presidents: number
    select: number
    distinguished: number
    total: number
  }
  /**
   * Distinguished projection - can be a number (from analytics-summary)
   * or an object (from full analytics endpoint)
   */
  distinguishedProjection:
    | number
    | {
        projectedDistinguished: number
        projectedSelect: number
        projectedPresident: number
        currentDistinguished?: number
        currentSelect?: number
        currentPresident?: number
        projectionDate?: string
      }
  divisionRankings: DivisionAnalytics[]
  topPerformingAreas: AreaAnalytics[]
  divisionRecognition?: DivisionRecognition[]
  yearOverYear?: {
    membershipChange: number
    distinguishedChange: number
    clubHealthChange: number
  }
  /**
   * Performance targets and rankings data for district overview
   * Contains targets for paid clubs, membership payments, and distinguished clubs
   * along with world rank, region rank, and world percentile for each metric
   * Null if base values are unavailable
   * Requirements: 7.1, 7.2, 7.3, 7.4
   */
  performanceTargets?: DistrictPerformanceTargets

  /**
   * Clubs in TI's public Find-A-Club registry that aren't yet in
   * clubPerformance — typically ATOs (Applications To Organize) or
   * freshly-chartered clubs that haven't appeared in the dashboard
   * roster yet. Always an array (possibly empty). Deliberately NOT
   * included in rankings, distinguished counts, or membership trends.
   *
   * @see Issue #489
   */
  prospectiveClubs: ProspectiveClub[]
}

// ========== District Performance Targets Types (from districts.ts) ==========

/**
 * Recognition levels for district performance targets
 */
export type RecognitionLevel =
  | 'distinguished'
  | 'select'
  | 'presidents'
  | 'smedley'

/**
 * Target values for each recognition level
 */
export interface RecognitionTargets {
  distinguished: number
  select: number
  presidents: number
  smedley: number
}

/**
 * Complete ranking data for a metric
 */
export interface MetricRankings {
  worldRank: number | null
  worldPercentile: number | null
  regionRank: number | null
  totalDistricts: number
  totalInRegion: number
  region: string | null
}

/**
 * Performance data for a single metric
 */
export interface MetricPerformanceData {
  current: number
  base: number | null
  targets: RecognitionTargets | null
  achievedLevel: RecognitionLevel | null
  rankings: MetricRankings
}

/**
 * Performance targets and rankings for district overview
 */
export interface DistrictPerformanceTargets {
  paidClubs: MetricPerformanceData
  membershipPayments: MetricPerformanceData
  distinguishedClubs: MetricPerformanceData
}

/**
 * Hook to fetch district analytics with caching for common date ranges
 */
export const useDistrictAnalytics = (
  districtId: string | null,
  startDate?: string,
  endDate?: string
) => {
  // Validate date range - don't make request if startDate > endDate
  const hasValidDateRange = !startDate || !endDate || startDate <= endDate

  return useQuery<DistrictAnalytics, Error>({
    queryKey: ['districtAnalytics', districtId, startDate, endDate],
    queryFn: async () => {
      if (!districtId) {
        throw new Error('District ID is required')
      }

      // Use the selected date for CDN URL; fall back to manifest latest
      const snapshotDate =
        endDate || (await fetchCdnManifest()).latestSnapshotDate
      const url = cdnAnalyticsUrl(snapshotDate, districtId, 'analytics')
      const file = await fetchFromCdn<{ data: DistrictAnalytics }>(url)
      return file.data
    },
    enabled: !!districtId && hasValidDateRange,
    staleTime: 10 * 60 * 1000, // 10 minutes - cache analytics calculations longer
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for common date ranges
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 (no data) or 400 (bad request)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } }
        if (
          axiosError.response?.status === 404 ||
          axiosError.response?.status === 400
        ) {
          return false
        }
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}
