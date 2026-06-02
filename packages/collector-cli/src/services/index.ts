/**
 * Services Index
 *
 * This module exports the collector services for the Collector CLI package.
 *
 * Requirements:
 * - 2.2: TransformService uses the same DataTransformationService logic as the Backend
 * - 1.6: AnalyticsWriter stores analytics in `analytics/` subdirectory
 * - 3.1: AnalyticsWriter stores in `CACHE_DIR/snapshots/{date}/analytics/`
 * - 3.2: AnalyticsWriter includes schema version and computation timestamp
 * - 6.1: UploadService syncs local snapshots and analytics to Google Cloud Storage
 * - 6.2: UploadService uploads both snapshot data and pre-computed analytics files
 * - 6.3: UploadService supports incremental uploads (compare checksums)
 */

export {
  TransformService,
  type TransformServiceConfig,
  type TransformOperationOptions,
  type TransformOperationResult,
  type DistrictTransformResult,
} from './TransformService.js'
export {
  AnalyticsWriter,
  type AnalyticsWriterConfig,
  type WriteResult,
  type IAnalyticsWriter,
} from './AnalyticsWriter.js'
export {
  UploadService,
  type UploadServiceConfig,
  type UploadOperationOptions,
  type IUploadService,
} from './UploadService.js'
export {
  TimeSeriesIndexWriter,
  createTimeSeriesIndexWriter,
  type TimeSeriesIndexWriterConfig,
  type TimeSeriesIndexWriterLogger,
} from './TimeSeriesIndexWriter.js'
export {
  parseDistrictReport,
  extractReportAsOf,
  type ParsedDistrictReport,
  type DistrictReportType,
  type DuesRenewalRow,
  type OfficerListRow,
  type ClubSuccessPlanRow,
  type EducationAchievementCount,
  type TripleCrownRow,
  type NewClubRow,
  type ProspectiveClubRow,
  type SponsorMentorRow,
  type CoachRow,
} from './DailyReportParser.js'
// Daily Reports ingest (epic #1062, Sprint 3 #1065): fetch → build → write the
// separate de-identified per-district dataset.
export {
  buildDistrictReports,
  REPORT_GUIDS,
  IN_SCOPE_REPORT_GUIDS,
  type RawReport,
  type BuildDistrictReportsInput,
} from './DistrictReportsBuilder.js'
export {
  DailyReportFetcher,
  buildDistrictReportUrl,
  type FetchLike,
  type DailyReportFetcherConfig,
} from './DailyReportFetcher.js'
export {
  writeDistrictReports,
  districtReportsFileName,
} from './DistrictReportsWriter.js'
export {
  ingestDistrictReports,
  type IngestDistrictReportsOptions,
} from './DistrictReportsIngest.js'
// CollectorOrchestrator will be added in Task 3
// export { CollectorOrchestrator } from './CollectorOrchestrator.js'
