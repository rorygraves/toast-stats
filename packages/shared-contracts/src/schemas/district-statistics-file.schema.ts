/**
 * Zod validation schemas for district statistics file format.
 *
 * These schemas provide runtime validation for district statistics data,
 * ensuring that data written by collector-cli and read by backend conforms
 * to the expected structure.
 *
 * The schemas match the TypeScript interfaces in district-statistics-file.ts exactly.
 *
 * @module district-statistics-file.schema
 * @see Requirements 6.1, 6.2, 2.5, 5.1, 5.2, 5.3
 */

import { z } from 'zod'

/**
 * Zod schema for a single scraped record from CSV data.
 *
 * Validates that each record is an object with string keys and values
 * that are either strings, numbers, or null. This matches the ScrapedRecord
 * type definition in scraped-record.ts.
 *
 * @see Requirements 2.5, 5.3
 */
export const ScrapedRecordSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.null()])
)

/**
 * Zod schema for individual club statistics.
 * Validates ClubStatisticsFile interface structure.
 */
export const ClubStatisticsFileSchema = z.object({
  /** Unique club identifier */
  clubId: z.string(),

  /** Display name of the club */
  clubName: z.string(),

  /** Division identifier this club belongs to */
  divisionId: z.string(),

  /** Area identifier this club belongs to */
  areaId: z.string(),

  /** Current membership count */
  membershipCount: z.number(),

  /** Total payments count */
  paymentsCount: z.number(),

  /** Number of DCP goals achieved */
  dcpGoals: z.number(),

  /** Club status string */
  status: z.string(),

  /** Charter date in ISO format (optional) */
  charterDate: z.string().optional(),

  /** Display name of the division */
  divisionName: z.string(),

  /** Display name of the area */
  areaName: z.string(),

  /** October renewal payments count */
  octoberRenewals: z.number(),

  /** April renewal payments count */
  aprilRenewals: z.number(),

  /** New member payments count */
  newMembers: z.number(),

  /** Membership base for net growth calculation */
  membershipBase: z.number(),

  /** Club operational status (Active, Suspended, Low, Ineligible) */
  clubStatus: z.string().optional(),

  /** CSP (Club Success Plan) submission status (2025-2026+) */
  cspSubmitted: z.boolean().optional(),

  /**
   * Find-A-Club enrichment fields (#429 / #431).
   * All optional — populated by the daily collector from the public
   * TI Find-A-Club Search endpoint when available.
   */
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  email: z.string().optional(),
  facebookLink: z.string().optional(),
  allowsVirtualAttendance: z.boolean().optional(),
  meetingSchedule: z
    .array(
      z.object({
        day: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        timeZone: z.string().optional(),
      })
    )
    .optional(),
})

/**
 * Zod schema for division-level statistics.
 * Validates DivisionStatisticsFile interface structure.
 */
export const DivisionStatisticsFileSchema = z.object({
  /** Division identifier */
  divisionId: z.string(),

  /** Display name of the division */
  divisionName: z.string(),

  /** Number of clubs in this division */
  clubCount: z.number(),

  /** Total membership across all clubs in this division */
  membershipTotal: z.number(),

  /** Total payments across all clubs in this division */
  paymentsTotal: z.number(),
})

/**
 * Zod schema for area-level statistics.
 * Validates AreaStatisticsFile interface structure.
 */
export const AreaStatisticsFileSchema = z.object({
  /** Area identifier */
  areaId: z.string(),

  /** Display name of the area */
  areaName: z.string(),

  /** Division identifier this area belongs to */
  divisionId: z.string(),

  /** Number of clubs in this area */
  clubCount: z.number(),

  /** Total membership across all clubs in this area */
  membershipTotal: z.number(),

  /** Total payments across all clubs in this area */
  paymentsTotal: z.number(),
})

/**
 * Zod schema for district-level totals.
 * Validates DistrictTotalsFile interface structure.
 */
export const DistrictTotalsFileSchema = z.object({
  /** Total number of clubs in the district */
  totalClubs: z.number(),

  /** Total membership across all clubs */
  totalMembership: z.number(),

  /** Total payments across all clubs */
  totalPayments: z.number(),

  /** Number of Distinguished clubs */
  distinguishedClubs: z.number(),

  /** Number of Select Distinguished clubs */
  selectDistinguishedClubs: z.number(),

  /** Number of President's Distinguished clubs */
  presidentDistinguishedClubs: z.number(),
})

/**
 * Zod schema for district statistics file.
 * Validates DistrictStatisticsFile interface structure.
 *
 * This is the main schema for validating district statistics data
 * as stored in JSON files.
 *
 * @see Requirements 2.5, 5.1, 5.2, 5.3
 */
export const DistrictStatisticsFileSchema = z.object({
  /** District identifier (e.g., "42", "F") */
  districtId: z.string(),

  /** Snapshot date in YYYY-MM-DD format */
  snapshotDate: z.string(),

  /** Array of club statistics for all clubs in the district */
  clubs: z.array(ClubStatisticsFileSchema),

  /** Array of division statistics for all divisions in the district */
  divisions: z.array(DivisionStatisticsFileSchema),

  /** Array of area statistics for all areas in the district */
  areas: z.array(AreaStatisticsFileSchema),

  /** Aggregated totals for the entire district */
  totals: DistrictTotalsFileSchema,

  /**
   * Raw CSV data from Division.aspx scrape.
   * Contains club-level data with Division, Area, Club Base fields, and visit award fields.
   * Required for frontend division/area calculations.
   *
   * @see Requirements 2.1, 5.1
   */
  divisionPerformance: z.array(ScrapedRecordSchema),

  /**
   * Raw CSV data from Club.aspx scrape.
   * Contains Club Status and Club Distinguished Status fields.
   * Required for frontend division/area calculations.
   *
   * @see Requirements 2.2, 5.1
   */
  clubPerformance: z.array(ScrapedRecordSchema),

  /**
   * Raw CSV data from District.aspx scrape.
   * Contains district-level performance data.
   * Required for frontend division/area calculations.
   *
   * @see Requirements 2.3, 5.1
   */
  districtPerformance: z.array(ScrapedRecordSchema),
})

/**
 * TypeScript type inferred from ClubStatisticsFileSchema.
 * Can be used for type-safe validation results.
 */
export type ClubStatisticsFileSchemaType = z.infer<
  typeof ClubStatisticsFileSchema
>

/**
 * TypeScript type inferred from DivisionStatisticsFileSchema.
 * Can be used for type-safe validation results.
 */
export type DivisionStatisticsFileSchemaType = z.infer<
  typeof DivisionStatisticsFileSchema
>

/**
 * TypeScript type inferred from AreaStatisticsFileSchema.
 * Can be used for type-safe validation results.
 */
export type AreaStatisticsFileSchemaType = z.infer<
  typeof AreaStatisticsFileSchema
>

/**
 * TypeScript type inferred from DistrictTotalsFileSchema.
 * Can be used for type-safe validation results.
 */
export type DistrictTotalsFileSchemaType = z.infer<
  typeof DistrictTotalsFileSchema
>

/**
 * TypeScript type inferred from DistrictStatisticsFileSchema.
 * Can be used for type-safe validation results.
 */
export type DistrictStatisticsFileSchemaType = z.infer<
  typeof DistrictStatisticsFileSchema
>

/**
 * TypeScript type inferred from ScrapedRecordSchema.
 * Can be used for type-safe validation results.
 */
export type ScrapedRecordSchemaType = z.infer<typeof ScrapedRecordSchema>
