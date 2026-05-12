/**
 * District statistics file format types.
 *
 * These interfaces define the exact structure of district statistics
 * as stored in JSON files. They match the analytics-core DistrictStatistics
 * structure to ensure compile-time compatibility between the data producer
 * (collector-cli) and data consumer (backend).
 *
 * File location: snapshots/{date}/district_{id}.json (within PerDistrictData.data)
 *
 * @module district-statistics-file
 */

import type { ScrapedRecord } from './scraped-record.js'

/**
 * District statistics as stored in files.
 * This matches the analytics-core DistrictStatistics structure.
 *
 * @see Requirements 9.1, 9.2, 2.1, 2.2, 2.3
 */
export interface DistrictStatisticsFile {
  /** District identifier (e.g., "42", "F") */
  districtId: string

  /** Snapshot date in YYYY-MM-DD format */
  snapshotDate: string

  /** Array of club statistics for all clubs in the district */
  clubs: ClubStatisticsFile[]

  /** Array of division statistics for all divisions in the district */
  divisions: DivisionStatisticsFile[]

  /** Array of area statistics for all areas in the district */
  areas: AreaStatisticsFile[]

  /** Aggregated totals for the entire district */
  totals: DistrictTotalsFile

  /**
   * Raw CSV data from Division.aspx scrape.
   * Contains club-level data with Division, Area, Club Base fields, and visit award fields.
   * Required for frontend division/area calculations.
   *
   * @see Requirements 2.1
   */
  divisionPerformance: ScrapedRecord[]

  /**
   * Raw CSV data from Club.aspx scrape.
   * Contains Club Status and Club Distinguished Status fields.
   * Required for frontend division/area calculations.
   *
   * @see Requirements 2.2
   */
  clubPerformance: ScrapedRecord[]

  /**
   * Raw CSV data from District.aspx scrape.
   * Contains district-level performance data.
   * Required for frontend division/area calculations.
   *
   * @see Requirements 2.3
   */
  districtPerformance: ScrapedRecord[]
}

/**
 * Individual club statistics as stored in files.
 * Contains membership, payment, and DCP goal information for a single club.
 */
export interface ClubStatisticsFile {
  /** Unique club identifier */
  clubId: string

  /** Display name of the club */
  clubName: string

  /** Division identifier this club belongs to */
  divisionId: string

  /** Area identifier this club belongs to */
  areaId: string

  /** Current membership count */
  membershipCount: number

  /** Total payments count */
  paymentsCount: number

  /** Number of DCP goals achieved */
  dcpGoals: number

  /** Club status string */
  status: string

  /** Charter date in ISO format (optional) */
  charterDate?: string

  /** Display name of the division */
  divisionName: string

  /** Display name of the area */
  areaName: string

  /** October renewal payments count */
  octoberRenewals: number

  /** April renewal payments count */
  aprilRenewals: number

  /** New member payments count */
  newMembers: number

  /** Membership base for net growth calculation */
  membershipBase: number

  /**
   * Exact list of 10 boolean flags representing which DCP goals were achieved.
   * Goals are 0-indexed (index 0 is Goal 1).
   */
  dcpGoalsAchieved?: boolean[]

  /** Club operational status (Active, Suspended, Low, Ineligible) */
  clubStatus?: string

  /**
   * CSP (Club Success Plan) submission status
   * Present from 2025-2026 program year onward; undefined for earlier years
   */
  cspSubmitted?: boolean

  /**
   * Find-A-Club enrichment fields (#429 / #431).
   * All optional — populated nightly from the public TI Find-A-Club
   * Search endpoint when available; absent when TI's endpoint is down
   * or hasn't yet been fetched for this snapshot.
   */
  /** Geographic coordinates from the Find-A-Club registry. */
  coordinates?: {
    lat: number
    lng: number
  }
  /** Mailing / meeting address from the Find-A-Club registry. */
  address?: {
    street?: string
    city?: string
    /** State / province (e.g. 'ON', 'CA'). */
    region?: string
    postalCode?: string
    country?: string
  }
  /** Club contact email. */
  email?: string
  /** Public Facebook page URL. */
  facebookLink?: string
  /** Whether the club lists virtual attendance as supported. */
  allowsVirtualAttendance?: boolean
  /** Recurring meeting schedule. */
  meetingSchedule?: Array<{
    day: string
    startTime: string
    endTime: string
    timeZone?: string
  }>
}

/**
 * Division-level statistics as stored in files.
 * Contains aggregated statistics for a single division.
 */
export interface DivisionStatisticsFile {
  /** Division identifier */
  divisionId: string

  /** Display name of the division */
  divisionName: string

  /** Number of clubs in this division */
  clubCount: number

  /** Total membership across all clubs in this division */
  membershipTotal: number

  /** Total payments across all clubs in this division */
  paymentsTotal: number
}

/**
 * Area-level statistics as stored in files.
 * Contains aggregated statistics for a single area.
 */
export interface AreaStatisticsFile {
  /** Area identifier */
  areaId: string

  /** Display name of the area */
  areaName: string

  /** Division identifier this area belongs to */
  divisionId: string

  /** Number of clubs in this area */
  clubCount: number

  /** Total membership across all clubs in this area */
  membershipTotal: number

  /** Total payments across all clubs in this area */
  paymentsTotal: number
}

/**
 * District-level totals as stored in files.
 * Contains aggregated totals for the entire district.
 */
export interface DistrictTotalsFile {
  /** Total number of clubs in the district */
  totalClubs: number

  /** Total membership across all clubs */
  totalMembership: number

  /** Total payments across all clubs */
  totalPayments: number

  /** Number of Distinguished clubs */
  distinguishedClubs: number

  /** Number of Select Distinguished clubs */
  selectDistinguishedClubs: number

  /** Number of President's Distinguished clubs */
  presidentDistinguishedClubs: number
}
