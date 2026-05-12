/**
 * Club health types.
 *
 * Types for club health assessment, risk factors, club trends,
 * vulnerable clubs, and club trends indexes.
 */

import type { ClubHealthStatus } from '@toastmasters/shared-contracts'
import type { MembershipTrendPoint } from './membership.js'

/**
 * Risk factors for club health assessment.
 */
export interface ClubRiskFactors {
  lowMembership: boolean
  decliningMembership: boolean
  lowPayments: boolean
  inactiveOfficers: boolean
  noRecentMeetings: boolean
  /** Decline is within expected seasonal norms (#221) */
  seasonallyNormal: boolean
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

  /** Whether health status was softened by seasonal adjustment (#221) */
  isSeasonallyAdjusted?: boolean

  /** Whether Distinguished status is provisional (pre-April, unconfirmed by renewals) (#287) */
  isProvisionallyDistinguished?: boolean

  /** Club Success Plan submission status (2025-2026+). Undefined for pre-2025 data. (#288) */
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

// ========== Vulnerable Clubs Data Types ==========

/**
 * Vulnerable clubs data structure.
 * Pre-computed list of clubs requiring attention.
 * Wraps existing ClubTrend arrays with metadata for the pre-computed file.
 *
 * Requirements: 3.2
 */
export interface VulnerableClubsData {
  /** District identifier */
  districtId: string
  /** ISO timestamp when the data was computed */
  computedAt: string
  /** Total count of vulnerable clubs */
  totalVulnerableClubs: number
  /** Count of clubs requiring intervention */
  interventionRequiredClubs: number
  /** Clubs categorized as vulnerable */
  vulnerableClubs: ClubTrend[]
  /** Clubs requiring immediate intervention */
  interventionRequired: ClubTrend[]
}

// ========== Club Trends Index Types ==========

/**
 * Club trends data for individual club lookup.
 * Stored per-district with clubs indexed by club ID for efficient O(1) retrieval.
 * Pre-computed by collector-cli, served by backend.
 *
 * Requirements: 2.2
 */
export interface ClubTrendsIndex {
  /** District identifier */
  districtId: string
  /** ISO timestamp when the index was computed */
  computedAt: string
  /** Map of club ID to ClubTrend for efficient lookup */
  clubs: Record<string, ClubTrend>
}
