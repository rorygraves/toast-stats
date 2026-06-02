/**
 * Zod contract for the de-identified per-district "Daily Reports" dataset
 * (epic #1062, Sprint 3 #1065).
 *
 * Persisted SEPARATELY from the base snapshot at
 * `snapshots/{date}/district_{id}_reports.json` so the daily-reports cadence +
 * provenance stay distinct from the frozen base. Every section carries
 * `sources: ReportSource[]` — the report-type, its tableID GUID, and the
 * report's "as of" date — so Sprint 4's read-time overlay can attribute each
 * field to a source + as-of date and never silently blend two cadences (the
 * multi-source hazard the epic calls out).
 *
 * HARD PRIVACY RULE (epic #1062): this dataset is club/area/division-level only.
 * No personal column survives — the EXCLUDE map is applied upstream at parse
 * time (`DailyReportParser`), so no schema field here can carry a personal value.
 *
 * @module district-reports.schema
 */

import { z } from 'zod'

/** Provenance for a section: which report it came from + its as-of date. */
export const ReportSourceSchema = z.object({
  /** Stable report-type discriminant, e.g. 'officer-list'. */
  reportType: z.string(),
  /** The report-type GUID (the `tableID` query param). */
  tableId: z.string(),
  /** The report's "Updated: <date>" date, e.g. 'June 01, 2026'. '' if absent. */
  asOf: z.string(),
})
export type ReportSource = z.infer<typeof ReportSourceSchema>

/** A section wrapping records of type `T` with its provenance. */
const section = <T extends z.ZodTypeAny>(
  records: T
): z.ZodObject<{
  sources: z.ZodArray<typeof ReportSourceSchema>
  records: z.ZodArray<T>
}> =>
  z.object({ sources: z.array(ReportSourceSchema), records: z.array(records) })

// ─── Per-report de-identified record shapes ─────────────────────────────────

/** Dues Renewal (April / October). "Name" = the club name (KEEP). */
export const DuesRenewalRecordSchema = z.object({
  club: z.string(),
  division: z.string(),
  area: z.string(),
  renewalStatus: z.string(),
  name: z.string(),
  location: z.string(),
})

/**
 * Officer List — the cross-report JOIN of the January + July reports.
 * `electionCadence` is derived (Jan-present ⇒ semiannual; Jul-only ⇒ annual);
 * `officerListSubmitted` is derived from the "List Status" column.
 */
export const OfficerListRecordSchema = z.object({
  club: z.string(),
  clubName: z.string(),
  division: z.string(),
  area: z.string(),
  listStatus: z.string(),
  electionCadence: z.enum(['semiannual', 'annual']),
  officerListSubmitted: z.boolean(),
})

/** Club Success Plan — keeps the submission DATE (base snapshot only has a bool). */
export const ClubSuccessPlanRecordSchema = z.object({
  clubNumber: z.string(),
  division: z.string(),
  area: z.string(),
  submissionDate: z.string(),
  clubName: z.string(),
})

/** Education Achievements — de-identified to per-(club, award) COUNTS. */
export const EducationAchievementCountRecordSchema = z.object({
  club: z.string(),
  division: z.string(),
  area: z.string(),
  name: z.string(),
  location: z.string(),
  award: z.string(),
  count: z.number().int().nonnegative(),
})

export const NewClubRecordSchema = z.object({
  division: z.string(),
  area: z.string(),
  club: z.string(),
  charterDate: z.string(),
  status: z.string(),
  name: z.string(),
  location: z.string(),
})

export const ProspectiveClubRecordSchema = z.object({
  division: z.string(),
  area: z.string(),
  club: z.string(),
  status: z.string(),
  name: z.string(),
  location: z.string(),
  prospect: z.string(),
})

/** Club Coaches — `activeCoach` derived (a PENDING status ⇒ an active coach). */
export const CoachRecordSchema = z.object({
  club: z.string(),
  clubName: z.string(),
  code: z.string(),
  beginDate: z.string(),
  status: z.string(),
  activeCoach: z.boolean(),
})

/**
 * Triple Crown — has no club column once `Member` is excluded, so it collapses
 * to a single district scalar: the number of Triple-Crown achievers.
 */
export const TripleCrownSummarySchema = z.object({
  achieverCount: z.number().int().nonnegative(),
})

// ─── The dataset ────────────────────────────────────────────────────────────

/**
 * The sections a district's dataset may carry. All optional — a report can be
 * empty (Archive), out of season, or fail to fetch; the section is simply
 * absent rather than present-and-empty-and-ambiguous.
 */
export const DistrictReportsSectionsSchema = z.object({
  aprilDuesRenewal: section(DuesRenewalRecordSchema).optional(),
  octoberDuesRenewal: section(DuesRenewalRecordSchema).optional(),
  officerList: section(OfficerListRecordSchema).optional(),
  clubSuccessPlan: section(ClubSuccessPlanRecordSchema).optional(),
  educationAchievements: section(
    EducationAchievementCountRecordSchema
  ).optional(),
  tripleCrown: z
    .object({
      sources: z.array(ReportSourceSchema),
      summary: TripleCrownSummarySchema,
    })
    .optional(),
  newClubs: section(NewClubRecordSchema).optional(),
  prospectiveClubs: section(ProspectiveClubRecordSchema).optional(),
  coaches: section(CoachRecordSchema).optional(),
})

export const DistrictReportsDatasetSchema = z.object({
  districtId: z.string(),
  programYear: z.string(),
  /** ISO timestamp this dataset was assembled. */
  generatedAt: z.string(),
  sections: DistrictReportsSectionsSchema,
})

export type DuesRenewalRecord = z.infer<typeof DuesRenewalRecordSchema>
export type OfficerListRecord = z.infer<typeof OfficerListRecordSchema>
export type ClubSuccessPlanRecord = z.infer<typeof ClubSuccessPlanRecordSchema>
export type EducationAchievementCountRecord = z.infer<
  typeof EducationAchievementCountRecordSchema
>
export type NewClubRecord = z.infer<typeof NewClubRecordSchema>
export type ProspectiveClubRecord = z.infer<typeof ProspectiveClubRecordSchema>
export type CoachRecord = z.infer<typeof CoachRecordSchema>
export type TripleCrownSummary = z.infer<typeof TripleCrownSummarySchema>
export type DistrictReportsSections = z.infer<
  typeof DistrictReportsSectionsSchema
>
export type DistrictReportsDataset = z.infer<
  typeof DistrictReportsDatasetSchema
>
