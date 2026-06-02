// packages/shared-contracts/src/index.ts

// Version constants
export {
  SCHEMA_VERSION,
  CALCULATION_VERSION,
  RANKING_VERSION,
  isSchemaCompatible,
} from './version.js'

// File format types
export type { PerDistrictData } from './types/per-district-data.js'

export type { ScrapedRecord } from './types/scraped-record.js'

export type {
  DistrictStatisticsFile,
  ClubStatisticsFile,
  DivisionStatisticsFile,
  AreaStatisticsFile,
  DistrictTotalsFile,
  ProspectiveClub,
} from './types/district-statistics-file.js'

export type {
  AllDistrictsRankingsData,
  AllDistrictsRankingsMetadata,
  DistrictRanking,
} from './types/all-districts-rankings.js'

export type { SnapshotMetadataFile } from './types/snapshot-metadata.js'

export type {
  SnapshotManifest,
  DistrictManifestEntry,
} from './types/snapshot-manifest.js'

// Snapshot pointer type
export type { SnapshotPointer } from './types/snapshot-pointer.js'

// Time-series types
export type {
  TimeSeriesDataPoint,
  ProgramYearIndexFile,
  ProgramYearSummary,
  TimeSeriesIndexMetadata,
  ClubHealthCounts,
} from './types/time-series.js'

// Club health status types
export type { ClubHealthStatus } from './types/club-health-status.js'

// API response types (shared between frontend and backend)
export type {
  ProgramYearWithData,
  AvailableRankingYearsResponse,
} from './types/api-responses.js'

// Zod schemas
export { PerDistrictDataSchema } from './schemas/per-district-data.schema.js'

export {
  DistrictStatisticsFileSchema,
  ClubStatisticsFileSchema,
  DivisionStatisticsFileSchema,
  AreaStatisticsFileSchema,
  DistrictTotalsFileSchema,
  ScrapedRecordSchema,
  ProspectiveClubSchema,
} from './schemas/district-statistics-file.schema.js'

export {
  AllDistrictsRankingsDataSchema,
  AllDistrictsRankingsMetadataSchema,
  DistrictRankingSchema,
} from './schemas/all-districts-rankings.schema.js'

export { SnapshotMetadataFileSchema } from './schemas/snapshot-metadata.schema.js'

export {
  SnapshotManifestSchema,
  DistrictManifestEntrySchema,
} from './schemas/snapshot-manifest.schema.js'

// Snapshot pointer Zod schema
export {
  SnapshotPointerSchema,
  type SnapshotPointerSchemaType,
} from './schemas/snapshot-pointer.schema.js'

// Time-series Zod schemas
export {
  TimeSeriesDataPointSchema,
  ProgramYearIndexFileSchema,
  ProgramYearSummarySchema,
  TimeSeriesIndexMetadataSchema,
  ClubHealthCountsSchema,
} from './schemas/time-series.schema.js'

// Club health status Zod schemas
export {
  ClubHealthStatusSchema,
  type ClubHealthStatusSchemaType,
} from './schemas/club-health-status.schema.js'

// Snapshot diff ("What Changed", epic #797) — schema + inferred types
export {
  AggregateDeltaSchema,
  DiffEventCategorySchema,
  ClubDiffSchema,
  ClubPresenceSchema,
  DiffEventSchema,
  SnapshotDiffSideSchema,
  SnapshotDiffTotalsSchema,
  SnapshotDiffSchema,
  type AggregateDelta,
  type DiffEventCategory,
  type ClubDiff,
  type ClubPresence,
  type DiffEvent,
  type SnapshotDiffSide,
  type SnapshotDiffTotals,
  type SnapshotDiff,
} from './schemas/snapshot-diff.schema.js'

// Daily Reports de-identified dataset (epic #1062) — schema + inferred types
export {
  ReportSourceSchema,
  DuesRenewalRecordSchema,
  OfficerListRecordSchema,
  ClubSuccessPlanRecordSchema,
  EducationAchievementCountRecordSchema,
  NewClubRecordSchema,
  ProspectiveClubRecordSchema,
  CoachRecordSchema,
  TripleCrownSummarySchema,
  DistrictReportsSectionsSchema,
  DistrictReportsDatasetSchema,
  type ReportSource,
  type DuesRenewalRecord,
  type OfficerListRecord,
  type ClubSuccessPlanRecord,
  type EducationAchievementCountRecord,
  type NewClubRecord,
  type ProspectiveClubRecord,
  type CoachRecord,
  type TripleCrownSummary,
  type DistrictReportsSections,
  type DistrictReportsDataset,
} from './schemas/district-reports.schema.js'

// Validation helpers
export {
  validatePerDistrictData,
  validateAllDistrictsRankings,
  validateSnapshotMetadata,
  validateSnapshotManifest,
  validateSnapshotPointer,
  validateTimeSeriesDataPoint,
  validateProgramYearIndexFile,
  validateTimeSeriesIndexMetadata,
  validateProgramYearSummary,
  type ValidationResult,
} from './validation/validators.js'
