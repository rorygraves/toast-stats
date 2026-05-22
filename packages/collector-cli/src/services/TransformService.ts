/**
 * TransformService - Transforms raw CSV files into snapshot format.
 *
 * This service reads raw CSV files from the cache directory and transforms
 * them into the snapshot format used by the backend for analytics computation.
 *
 * Requirements:
 * - 2.2: WHEN transforming raw CSVs, THE Collector_CLI SHALL use the same
 *        DataTransformationService logic as the Backend
 * - 2.3: THE Collector_CLI SHALL store snapshots in the same directory structure
 *        as the Backend expects: `CACHE_DIR/snapshots/{date}/`
 * - 2.4: WHEN a snapshot is created, THE Collector_CLI SHALL write district JSON
 *        files, metadata.json, manifest.json, and all-districts-rankings.json
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { parse } from 'csv-parse/sync'
import { parseClosingPeriodFromCsv } from '../utils/csvFooterParser.js'
import {
  DataTransformer,
  ANALYTICS_SCHEMA_VERSION,
  getConfirmedDistinguishedLevel,
  CompetitiveAwardsCalculator,
  DistinguishedDistrictCalculator,
  ClubStrengthAwardCalculator,
  LeadershipExcellenceCalculator,
  OfficerAwardsCalculator,
  calculateDistinguishedPercent,
  type Logger,
  type RawCSVData,
} from '@toastmasters/analytics-core'
import {
  RANKING_VERSION,
  SCHEMA_VERSION,
  validatePerDistrictData,
  validateAllDistrictsRankings,
  validateSnapshotMetadata,
  validateSnapshotManifest,
  validateSnapshotPointer,
  type PerDistrictData,
  type AllDistrictsRankingsData,
  type DistrictRanking,
  type SnapshotMetadataFile,
  type SnapshotManifest,
  type DistrictManifestEntry,
  type SnapshotPointer,
} from '@toastmasters/shared-contracts'
import type {
  AllDistrictsCSVRecord,
  CacheMetadata,
} from '../types/collector.js'
import {
  ClosingPeriodDetector,
  type ClosingPeriodInfo,
} from '../utils/ClosingPeriodDetector.js'
import {
  calculateProgramYear,
  getPriorProgramYear,
} from '../utils/CachePaths.js'
import { DistrictAwardsHistoryStore } from './DistrictAwardsHistoryStore.js'

/**
 * Parse a date string in ISO (YYYY-MM-DD), US 4-digit (M/D/YYYY), or US
 * 2-digit (M/D/YY) format and return a UTC-normalized Date. Returns null on
 * failure. Two-digit years are interpreted as 20YY — Toastmasters' district
 * performance CSVs use this for charter/suspend dates (#336).
 */
function parseDateFlexible(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const y = Number(isoMatch[1])
    const m = Number(isoMatch[2])
    const d = Number(isoMatch[3])
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return new Date(Date.UTC(y, m - 1, d))
    }
  }

  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (usMatch) {
    const m = Number(usMatch[1])
    const d = Number(usMatch[2])
    const yRaw = Number(usMatch[3])
    const y = usMatch[3]!.length === 2 ? 2000 + yRaw : yRaw
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return new Date(Date.UTC(y, m - 1, d))
    }
  }

  return null
}

/**
 * Extract a charter date from a `Charter Date/Suspend Date` field value (#336).
 *
 * Toastmasters district-performance.csv encodes club status changes as a
 * single string with a prefix and date: `Charter MM/DD/YY` for newly
 * chartered clubs, `Susp MM/DD/YY` for suspensions. Returns null if the
 * field is empty, prefixed `Susp`, or unparseable.
 */
function parseCharterDateFromStatusField(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  const match = trimmed.match(/^Charter\s+(.+)$/i)
  if (!match) return null
  return parseDateFlexible(match[1]!)
}

/**
 * Return the start-of-program-year date (July 1) preceding the given
 * snapshot date, or null if unparseable. Toastmasters program years run
 * July 1 → June 30. (#336)
 */
function getProgramYearStartDate(snapshotDate: string): Date | null {
  const parsed = parseDateFlexible(snapshotDate)
  if (!parsed) return null
  const year = parsed.getUTCFullYear()
  const month = parsed.getUTCMonth() + 1
  const pyStartYear = month >= 7 ? year : year - 1
  return new Date(Date.UTC(pyStartYear, 6, 1))
}

/**
 * Internal structure for ranking metrics extraction
 */
interface RankingMetrics {
  districtId: string
  districtName: string
  region: string
  clubGrowthPercent: number
  paymentGrowthPercent: number
  distinguishedPercent: number
  paidClubs: number
  paidClubBase: number
  totalPayments: number
  paymentBase: number
  distinguishedClubs: number
  activeClubs: number
  selectDistinguished: number
  presidentsDistinguished: number
  // Smedley Distinguished tier (#329)
  smedleyDistinguished: number
  // District Recognition Program prerequisites (#329)
  dspSubmitted: boolean
  trainingMet: boolean
  marketAnalysisSubmitted: boolean
  communicationPlanSubmitted: boolean
  regionAdvisorVisitMet: boolean
  // Clubs with 20+ paid members for President's 20-Plus Award (#330)
  clubsWith20PlusMembers: number
  // Paid clubs chartered in the current program year (#336) — used to compute
  // the District Club Retention Award on base-club survival alone.
  newCharteredClubs: number
  // Payment breakdown (#327)
  newPayments: number
  aprilPayments: number
  octoberPayments: number
  latePayments: number
  charterPayments: number
}

/**
 * Category ranking result
 */
interface CategoryRanking {
  districtId: string
  rank: number
  bordaPoints: number
  value: number
}

/**
 * Aggregate ranking result
 */
interface AggregateRanking {
  districtId: string
  clubsRank: number
  paymentsRank: number
  distinguishedRank: number
  aggregateScore: number
}

/**
 * Configuration for TransformService
 */
export interface TransformServiceConfig {
  /** Base cache directory */
  cacheDir: string
  /** Optional logger for diagnostic output */
  logger?: Logger
}

/**
 * Options for transform operation
 */
export interface TransformOperationOptions {
  /** Target date in YYYY-MM-DD format */
  date: string
  /** Specific districts to transform (if not provided, transforms all available) */
  districts?: string[]
  /** Force re-transform even if snapshots exist */
  force?: boolean
  /** Enable verbose logging */
  verbose?: boolean
}

/**
 * Result of transforming a single district
 */
export interface DistrictTransformResult {
  districtId: string
  success: boolean
  snapshotPath?: string
  error?: string
  skipped?: boolean
}

/**
 * Result of the transform operation
 */
export interface TransformOperationResult {
  success: boolean
  date: string
  districtsProcessed: string[]
  districtsSucceeded: string[]
  districtsFailed: string[]
  districtsSkipped: string[]
  snapshotLocations: string[]
  errors: Array<{
    districtId: string
    error: string
    timestamp: string
  }>
  duration_ms: number
}

/**
 * Default no-op logger
 */
const noopLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
}

/**
 * TransformService transforms raw CSV files into snapshot format.
 *
 * The service reads CSV files from the raw-csv cache directory structure:
 *   CACHE_DIR/raw-csv/{date}/district-{id}/club-performance.csv
 *   CACHE_DIR/raw-csv/{date}/district-{id}/division-performance.csv
 *   CACHE_DIR/raw-csv/{date}/district-{id}/district-performance.csv
 *
 * And writes snapshots to:
 *   CACHE_DIR/snapshots/{date}/district_{id}.json
 *   CACHE_DIR/snapshots/{date}/metadata.json
 *   CACHE_DIR/snapshots/{date}/manifest.json
 */
export class TransformService {
  private readonly cacheDir: string
  private readonly logger: Logger
  private readonly dataTransformer: DataTransformer

  constructor(config: TransformServiceConfig) {
    this.cacheDir = config.cacheDir
    this.logger = config.logger ?? noopLogger
    this.dataTransformer = new DataTransformer({ logger: this.logger })
  }

  /**
   * Get the raw CSV directory path for a date
   */
  private getRawCsvDir(date: string): string {
    return path.join(this.cacheDir, 'raw-csv', date)
  }

  /**
   * Get the snapshot directory path for a date
   */
  private getSnapshotDir(date: string): string {
    return path.join(this.cacheDir, 'snapshots', date)
  }

  /**
   * Get the district snapshot file path
   */
  private getDistrictSnapshotPath(date: string, districtId: string): string {
    return path.join(this.getSnapshotDir(date), `district_${districtId}.json`)
  }

  /**
   * Read cache metadata for a given date.
   *
   * Reads from CACHE_DIR/raw-csv/{date}/metadata.json and extracts
   * isClosingPeriod and dataMonth fields.
   *
   * @param date - The date in YYYY-MM-DD format
   * @returns CacheMetadata if file exists and is valid, null otherwise
   *
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  async readCacheMetadata(date: string): Promise<CacheMetadata | null> {
    const metadataPath = path.join(this.getRawCsvDir(date), 'metadata.json')

    let metadataFromFile: CacheMetadata | null = null

    try {
      const content = await fs.readFile(metadataPath, 'utf-8')
      const parsed: unknown = JSON.parse(content)

      // Validate the parsed object has the expected structure
      if (typeof parsed !== 'object' || parsed === null) {
        this.logger.warn('Cache metadata is not a valid object', {
          date,
          path: metadataPath,
        })
        // Fall through to CSV footer parsing
      } else {
        const metadata = parsed as Record<string, unknown>
        metadataFromFile = {
          date: typeof metadata['date'] === 'string' ? metadata['date'] : date,
          isClosingPeriod:
            typeof metadata['isClosingPeriod'] === 'boolean'
              ? metadata['isClosingPeriod']
              : undefined,
          dataMonth:
            typeof metadata['dataMonth'] === 'string'
              ? metadata['dataMonth']
              : undefined,
        }

        // If isClosingPeriod is true, trust it (confirmed closing period)
        // If false, always verify via CSV footer — the daily scrape may
        // have written false incorrectly (#309)
        if (metadataFromFile.isClosingPeriod === true) {
          return metadataFromFile
        }
      }
    } catch (error) {
      const err = error as { code?: string }

      if (err.code !== 'ENOENT') {
        this.logger.warn('Failed to read cache metadata', {
          date,
          path: metadataPath,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      // Fall through to CSV footer parsing
    }

    // Fallback: parse closing period from all-districts.csv footer (#292)
    return this.deriveMetadataFromCsv(date, metadataFromFile)
  }

  /**
   * Derive cache metadata by parsing the all-districts.csv footer.
   * Used when metadata.json is missing or has undefined isClosingPeriod.
   * Writes the derived metadata back to disk for future runs.
   */
  private async deriveMetadataFromCsv(
    date: string,
    existing: CacheMetadata | null
  ): Promise<CacheMetadata | null> {
    const csvPath = path.join(this.getRawCsvDir(date), 'all-districts.csv')

    try {
      const csvContent = await fs.readFile(csvPath, 'utf-8')
      const parsed = parseClosingPeriodFromCsv(csvContent, date)

      const metadata: CacheMetadata = {
        date: existing?.date ?? date,
        isClosingPeriod: parsed.isClosingPeriod,
        dataMonth: parsed.dataMonth,
      }

      this.logger.info('Derived closing period from CSV footer', {
        date,
        isClosingPeriod: parsed.isClosingPeriod,
        dataMonth: parsed.dataMonth,
      })

      // Write back to metadata.json for future runs
      try {
        const metadataPath = path.join(this.getRawCsvDir(date), 'metadata.json')
        const existingContent = await fs
          .readFile(metadataPath, 'utf-8')
          .then(c => JSON.parse(c) as Record<string, unknown>)
          .catch(() => ({}))
        const updated = {
          ...existingContent,
          date: metadata.date,
          isClosingPeriod: metadata.isClosingPeriod,
          ...(metadata.dataMonth ? { dataMonth: metadata.dataMonth } : {}),
        }
        await fs.writeFile(metadataPath, JSON.stringify(updated, null, 2))
      } catch {
        // Non-fatal: metadata write failure doesn't block transform
      }

      return metadata
    } catch {
      // No CSV file available — return non-closing-period default
      return {
        date: existing?.date ?? date,
        isClosingPeriod: false,
        dataMonth: undefined,
      }
    }
  }

  /**
   * Determine the snapshot date based on closing period detection.
   *
   * Uses ClosingPeriodDetector to detect if the data represents a closing period
   * and returns the appropriate snapshot date (last day of data month for closing
   * periods, or the requested date for non-closing periods).
   *
   * @param requestedDate - The date that was requested for scraping (YYYY-MM-DD)
   * @param metadata - Cache metadata containing isClosingPeriod and dataMonth fields
   * @returns ClosingPeriodInfo with appropriate snapshot date
   *
   * Requirements:
   * - 2.1: WHEN `isClosingPeriod` is true THEN calculate the last day of the data month
   * - 2.2: WHEN `isClosingPeriod` is true THEN write snapshot to lastDayOfDataMonth
   * - 2.3: WHEN data month is December and collection date is January THEN snapshot dated December 31 of prior year
   * - 2.4: WHEN `isClosingPeriod` is false or undefined THEN use requested date as snapshot date
   */
  determineSnapshotDate(
    requestedDate: string,
    metadata: CacheMetadata | null
  ): ClosingPeriodInfo {
    const detector = new ClosingPeriodDetector()
    return detector.detect(requestedDate, metadata)
  }

  /**
   * Check if an existing snapshot should be updated with new data.
   *
   * Reads the existing snapshot metadata and compares collection dates
   * to determine if the new data should overwrite the existing snapshot.
   *
   * @param snapshotDate - The snapshot date (YYYY-MM-DD format)
   * @param newCollectionDate - The collection date of the new data (YYYY-MM-DD format)
   * @returns true if the snapshot should be updated, false otherwise
   *
   * Requirements:
   * - 4.1: WHEN a closing period snapshot already exists THEN read the existing snapshot's collection date
   * - 4.2: WHEN the new data has a strictly newer collection date THEN overwrite the existing snapshot
   * - 4.3: WHEN the new data has an equal or older collection date THEN skip the update and log a message
   * - 4.4: WHEN the existing snapshot has no collection date metadata THEN allow the update
   */
  async shouldUpdateSnapshot(
    snapshotDate: string,
    newCollectionDate: string
  ): Promise<boolean> {
    const metadataPath = path.join(
      this.getSnapshotDir(snapshotDate),
      'metadata.json'
    )

    try {
      const content = await fs.readFile(metadataPath, 'utf-8')
      const parsed: unknown = JSON.parse(content)

      // Validate the parsed object has the expected structure
      if (typeof parsed !== 'object' || parsed === null) {
        this.logger.warn(
          'Existing snapshot metadata is not a valid object, allowing update',
          {
            snapshotDate,
            path: metadataPath,
          }
        )
        return true
      }

      const metadata = parsed as Record<string, unknown>

      // Requirement 4.4: If existing snapshot has no collectionDate, allow update
      // Fall back to dataAsOfDate if collectionDate is not present
      const existingCollectionDate =
        typeof metadata['collectionDate'] === 'string'
          ? metadata['collectionDate']
          : typeof metadata['dataAsOfDate'] === 'string'
            ? metadata['dataAsOfDate']
            : null

      if (existingCollectionDate === null) {
        this.logger.info(
          'Existing snapshot has no collection date metadata, allowing update',
          {
            snapshotDate,
            newCollectionDate,
          }
        )
        return true
      }

      // Compare dates
      const existingDate = new Date(existingCollectionDate)
      const newDate = new Date(newCollectionDate)

      // Requirement 4.2: New data is strictly newer - allow update
      if (newDate > existingDate) {
        this.logger.info('New data is newer, allowing snapshot update', {
          snapshotDate,
          existingCollectionDate,
          newCollectionDate,
        })
        return true
      }

      // Requirement 4.3: New data is equal or older - skip update and log
      this.logger.info(
        'Skipping snapshot update: existing data is newer or equal',
        {
          snapshotDate,
          existingCollectionDate,
          newCollectionDate,
          reason:
            newDate.getTime() === existingDate.getTime()
              ? 'equal_dates'
              : 'existing_is_newer',
        }
      )
      return false
    } catch (error) {
      const err = error as { code?: string }

      // File not found means no existing snapshot - allow update
      if (err.code === 'ENOENT') {
        this.logger.debug('No existing snapshot found, allowing update', {
          snapshotDate,
          newCollectionDate,
        })
        return true
      }

      // For other errors (parse errors, etc.), log warning and allow update
      this.logger.warn(
        'Error reading existing snapshot metadata, allowing update',
        {
          snapshotDate,
          path: metadataPath,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      )
      return true
    }
  }

  /**
   * Parse CSV content into 2D array format expected by DataTransformer
   */
  private parseCSVToArray(csvContent: string): string[][] {
    try {
      const records = parse(csvContent, {
        skip_empty_lines: false,
        trim: true,
        relax_column_count: true,
        relax_quotes: true,
      }) as string[][]
      return records
    } catch (error) {
      this.logger.error('Failed to parse CSV content', error)
      throw new Error(
        `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error }
      )
    }
  }

  /**
   * Parse CSV content into records with headers
   */
  private parseCSVToRecords(csvContent: string): AllDistrictsCSVRecord[] {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_quotes: true,
      }) as AllDistrictsCSVRecord[]

      // Filter out footer rows containing "Month of" (metadata lines from dashboard)
      const filteredRecords = records.filter(record => {
        const hasMonthOf = Object.values(record).some(
          value => typeof value === 'string' && value.includes('Month of')
        )
        return !hasMonthOf
      })

      return filteredRecords
    } catch (error) {
      this.logger.error('Failed to parse CSV to records', error)
      throw new Error(
        `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error }
      )
    }
  }

  /**
   * Read all-districts CSV file for a date
   */
  private async readAllDistrictsCSV(
    date: string
  ): Promise<AllDistrictsCSVRecord[] | null> {
    const csvPath = path.join(this.getRawCsvDir(date), 'all-districts.csv')

    const content = await this.readCSVFile(csvPath)
    if (!content) {
      this.logger.debug('All-districts CSV not found', { date, csvPath })
      return null
    }

    return this.parseCSVToRecords(content)
  }

  /**
   * Extract ranking metrics from all-districts CSV records
   *
   * Filters out invalid district IDs (empty, date patterns, invalid characters)
   * before extracting metrics. This matches the backend's DistrictIdValidator behavior.
   */
  private extractRankingMetrics(
    records: AllDistrictsCSVRecord[]
  ): RankingMetrics[] {
    const metrics: RankingMetrics[] = []
    const rejected: Array<{ districtId: string; reason: string }> = []

    for (const record of records) {
      try {
        const districtId = record.DISTRICT

        // Validate district ID using same rules as backend
        if (!this.isValidDistrictId(districtId)) {
          const reason = this.getDistrictIdRejectionReason(districtId)
          rejected.push({ districtId: districtId || '(empty)', reason })
          this.logger.debug('Rejected invalid district ID', {
            districtId: districtId || '(empty)',
            reason,
          })
          continue
        }

        const metric: RankingMetrics = {
          districtId,
          districtName: record.DISTRICT,
          region: record.REGION || 'Unknown',
          clubGrowthPercent: this.parsePercentage(record['% Club Growth']),
          paymentGrowthPercent: this.parsePercentage(
            record['% Payment Growth']
          ),
          distinguishedPercent: calculateDistinguishedPercent(
            this.parseNumber(record['Total Distinguished Clubs']),
            this.parseNumber(record['Paid Club Base'])
          ),
          paidClubs: this.parseNumber(record['Paid Clubs']),
          paidClubBase: this.parseNumber(record['Paid Club Base']),
          totalPayments: this.parseNumber(record['Total YTD Payments']),
          paymentBase: this.parseNumber(record['Payment Base']),
          distinguishedClubs: this.parseNumber(
            record['Total Distinguished Clubs']
          ),
          activeClubs: this.parseNumber(record['Active Clubs']),
          selectDistinguished: this.parseNumber(
            record['Select Distinguished Clubs']
          ),
          presidentsDistinguished: this.parseNumber(
            record['Presidents Distinguished Clubs']
          ),
          // Smedley Distinguished tier (#329)
          smedleyDistinguished: this.parseNumber(
            record['Smedley Distinguished Clubs']
          ),
          // District Recognition Program prerequisites (#329)
          dspSubmitted: this.parseYesNo(record['DSP']),
          trainingMet: this.parseYesNo(record['Training']),
          marketAnalysisSubmitted: this.parseYesNo(record['Market Analysis']),
          communicationPlanSubmitted: this.parseYesNo(
            record['Communication Plan']
          ),
          regionAdvisorVisitMet: this.parseYesNo(
            record['Region Advisor Visit']
          ),
          // Default 0; populated later from per-district club-performance.csv (#330)
          clubsWith20PlusMembers: 0,
          // Default 0; populated later from per-district club-performance.csv (#336)
          newCharteredClubs: 0,
          // Payment breakdown (#327)
          newPayments: this.parseNumber(record['New Payments']),
          aprilPayments: this.parseNumber(record['April Payments']),
          octoberPayments: this.parseNumber(record['October Payments']),
          latePayments: this.parseNumber(record['Late Payments']),
          charterPayments: this.parseNumber(record['Charter Payments']),
        }

        metrics.push(metric)
      } catch (error) {
        this.logger.warn('Failed to extract metrics for record', {
          district: record.DISTRICT,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Log summary if any records were rejected
    if (rejected.length > 0) {
      // Summarize rejection reasons
      const reasonCounts: Record<string, number> = {}
      for (const r of rejected) {
        reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1
      }

      this.logger.info('District ID validation summary', {
        totalRecords: records.length,
        validRecords: metrics.length,
        rejectedRecords: rejected.length,
        rejectionReasons: reasonCounts,
      })
    }

    return metrics
  }

  /**
   * Validate district ID format
   *
   * Validation Rules (ported from backend DistrictIdValidator):
   * 1. Not empty, null, or whitespace-only
   * 2. Does not match date pattern (e.g., "As of MM/DD/YYYY")
   * 3. Contains only alphanumeric characters
   */
  private isValidDistrictId(districtId: string | undefined): boolean {
    // Rule 1: Check for empty or null
    if (!districtId || districtId.trim() === '') {
      return false
    }

    // Rule 2: Check for date pattern (from CSV footers)
    // Pattern matches "As of MM/DD/YYYY" or "As of M/D/YYYY" (case-insensitive)
    const datePattern = /^As of \d{1,2}\/\d{1,2}\/\d{4}$/i
    if (datePattern.test(districtId)) {
      return false
    }

    // Rule 3: Check for valid characters - alphanumeric only
    const validPattern = /^[A-Za-z0-9]+$/
    if (!validPattern.test(districtId)) {
      return false
    }

    return true
  }

  /**
   * Get rejection reason for invalid district ID (for logging)
   */
  private getDistrictIdRejectionReason(districtId: string | undefined): string {
    if (!districtId || districtId.trim() === '') {
      return 'District ID is empty or whitespace-only'
    }

    const datePattern = /^As of \d{1,2}\/\d{1,2}\/\d{4}$/i
    if (datePattern.test(districtId)) {
      return 'District ID matches date pattern (e.g., "As of MM/DD/YYYY")'
    }

    const validPattern = /^[A-Za-z0-9]+$/
    if (!validPattern.test(districtId)) {
      return 'District ID contains invalid characters (only alphanumeric allowed)'
    }

    return 'Unknown validation error'
  }

  /**
   * Parse percentage string to number
   */
  private parsePercentage(value: string | undefined): number {
    if (!value) return 0

    // Remove % sign and parse as float
    const cleaned = value.replace('%', '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  /**
   * Parse number from string (handles commas)
   */
  private parseNumber(value: string | undefined): number {
    if (!value) return 0

    // Remove commas and parse as integer
    const cleaned = value.replace(/,/g, '').trim()
    const parsed = parseInt(cleaned, 10)
    return isNaN(parsed) ? 0 : parsed
  }

  /**
   * Parse Y/N string into boolean (#329)
   *
   * Used for District Recognition Program prerequisite columns:
   * DSP, Training, Market Analysis, Communication Plan, Region Advisor Visit.
   *
   * Defaults to false when the column is missing (legacy CSVs) or contains
   * any value other than "Y" (case-insensitive).
   */
  private parseYesNo(value: string | undefined): boolean {
    if (!value) return false
    return value.trim().toUpperCase() === 'Y'
  }

  /**
   * Calculate ranking for a single category using Borda count
   *
   * Borda count scoring:
   * - Ranks districts by value (highest first)
   * - Handles ties by assigning the same rank
   * - Borda points = total districts - rank + 1
   */
  private calculateCategoryRanking(
    metrics: RankingMetrics[],
    valueField: keyof RankingMetrics,
    category: string
  ): CategoryRanking[] {
    // Tie-neutralization (#198): if all values are identical, award 0 points
    const uniqueValues = new Set(metrics.map(m => m[valueField] as number))
    if (uniqueValues.size === 1) {
      this.logger.debug('All districts tied — neutralizing category', {
        category,
        totalDistricts: metrics.length,
        value: [...uniqueValues][0],
      })
      return metrics.map(m => ({
        districtId: m.districtId,
        rank: 1,
        bordaPoints: 0,
        value: m[valueField] as number,
      }))
    }

    // Sort districts by value (highest first)
    const sortedMetrics = [...metrics].sort((a, b) => {
      const aValue = a[valueField] as number
      const bValue = b[valueField] as number
      return bValue - aValue
    })

    const rankings: CategoryRanking[] = []
    let currentRank = 1

    for (let i = 0; i < sortedMetrics.length; i++) {
      const metric = sortedMetrics[i]
      if (!metric) continue

      const value = metric[valueField] as number

      // Handle ties: if current value equals previous value, use same rank
      if (i > 0) {
        const previousMetric = sortedMetrics[i - 1]
        if (previousMetric) {
          const previousValue = previousMetric[valueField] as number
          if (value !== previousValue) {
            currentRank = i + 1
          }
        }
      }

      // Calculate Borda points: total districts - rank + 1
      const bordaPoints = metrics.length - currentRank + 1

      rankings.push({
        districtId: metric.districtId,
        rank: currentRank,
        bordaPoints,
        value,
      })
    }

    this.logger.debug('Calculated category ranking', {
      category,
      totalDistricts: metrics.length,
      uniqueRanks: new Set(rankings.map(r => r.rank)).size,
    })

    return rankings
  }

  /**
   * Calculate aggregate rankings by summing Borda points across categories
   */
  private calculateAggregateRankings(
    clubRankings: CategoryRanking[],
    paymentRankings: CategoryRanking[],
    distinguishedRankings: CategoryRanking[]
  ): AggregateRanking[] {
    const aggregateMap = new Map<string, AggregateRanking>()

    // Initialize aggregate rankings from club rankings
    for (const ranking of clubRankings) {
      aggregateMap.set(ranking.districtId, {
        districtId: ranking.districtId,
        clubsRank: ranking.rank,
        paymentsRank: 0,
        distinguishedRank: 0,
        aggregateScore: ranking.bordaPoints,
      })
    }

    // Add payment rankings
    for (const ranking of paymentRankings) {
      const aggregate = aggregateMap.get(ranking.districtId)
      if (aggregate) {
        aggregate.paymentsRank = ranking.rank
        aggregate.aggregateScore += ranking.bordaPoints
      }
    }

    // Add distinguished rankings
    for (const ranking of distinguishedRankings) {
      const aggregate = aggregateMap.get(ranking.districtId)
      if (aggregate) {
        aggregate.distinguishedRank = ranking.rank
        aggregate.aggregateScore += ranking.bordaPoints
      }
    }

    // Sort by aggregate score (highest first)
    return Array.from(aggregateMap.values()).sort(
      (a, b) => b.aggregateScore - a.aggregateScore
    )
  }

  /**
   * Calculate all-districts rankings using Borda count algorithm
   *
   * Requirements:
   * - 2.4: Write all-districts-rankings.json to snapshot directory
   */
  private async calculateAllDistrictsRankings(
    date: string
  ): Promise<AllDistrictsRankingsData | null> {
    this.logger.info('Calculating all-districts rankings', { date })

    // Read all-districts CSV
    const records = await this.readAllDistrictsCSV(date)
    if (!records || records.length === 0) {
      this.logger.warn('No all-districts CSV data found', { date })
      return null
    }

    // Extract ranking metrics
    const metrics = this.extractRankingMetrics(records)
    if (metrics.length === 0) {
      this.logger.warn('No valid district metrics extracted', { date })
      return null
    }

    // Aggregate per-district club data from per-district CSVs:
    // - clubsWith20PlusMembers (#330) — from club-performance.csv
    // - newCharteredClubs (#336) — from district-performance.csv (status column)
    // - confirmed Distinguished count (#304) — only when all districts report 0
    const allZeroDistinguished = metrics.every(m => m.distinguishedClubs === 0)
    const programYearStart = getProgramYearStartDate(date)
    for (const metric of metrics) {
      try {
        const districtDir = path.join(
          this.cacheDir,
          'raw-csv',
          date,
          `district-${metric.districtId}`
        )
        const csvPath = path.join(districtDir, 'club-performance.csv')
        const content = await fs.readFile(csvPath, 'utf-8').catch(() => null)
        if (!content) continue
        const clubs = this.parseCSVToRecords(content)

        // Always count clubs with 20+ paid members for President's 20-Plus Award (#330)
        let twentyPlus = 0
        for (const club of clubs) {
          const members = this.parseNumber(
            club['Active Members'] ?? club['Membership'] ?? club['Paid Members']
          )
          if (members >= 20) twentyPlus++
        }
        metric.clubsWith20PlusMembers = twentyPlus

        // Count newly chartered clubs from district-performance.csv (#336).
        // The 'Charter Date/Suspend Date' column carries values like
        // 'Charter 04/15/26' (new charter) or 'Susp 09/30/25' (suspension);
        // we count only Charter entries whose date falls in the current PY.
        if (programYearStart) {
          const districtPerfPath = path.join(
            districtDir,
            'district-performance.csv'
          )
          const districtContent = await fs
            .readFile(districtPerfPath, 'utf-8')
            .catch(() => null)
          if (districtContent) {
            const rows = this.parseCSVToRecords(districtContent)
            let newCharters = 0
            for (const row of rows) {
              const chartered = parseCharterDateFromStatusField(
                row['Charter Date/Suspend Date']
              )
              if (chartered && chartered >= programYearStart) newCharters++
            }
            metric.newCharteredClubs = newCharters
          }
        }

        // Compute confirmed Distinguished only when all districts report 0 (#304)
        if (allZeroDistinguished) {
          let confirmed = 0
          for (const club of clubs) {
            const goals = this.parseNumber(club['Goals Met'])
            const renewals = this.parseNumber(club['Mem. dues on time Apr'])
            const base = this.parseNumber(club['Mem. Base'])
            if (
              getConfirmedDistinguishedLevel(goals, renewals, base) !==
              'NotDistinguished'
            )
              confirmed++
          }
          if (confirmed > 0) {
            metric.distinguishedClubs = confirmed
            metric.distinguishedPercent =
              metric.activeClubs > 0
                ? (confirmed / metric.activeClubs) * 100
                : 0
          }
        }
      } catch {
        // Skip districts with missing club data
      }
    }

    this.logger.debug('Extracted ranking metrics', {
      date,
      metricsCount: metrics.length,
    })

    // Calculate category rankings
    const clubRankings = this.calculateCategoryRanking(
      metrics,
      'clubGrowthPercent',
      'clubs'
    )
    const paymentRankings = this.calculateCategoryRanking(
      metrics,
      'paymentGrowthPercent',
      'payments'
    )
    const distinguishedRankings = this.calculateCategoryRanking(
      metrics,
      'distinguishedPercent',
      'distinguished'
    )

    // Calculate aggregate rankings
    const aggregateRankings = this.calculateAggregateRankings(
      clubRankings,
      paymentRankings,
      distinguishedRankings
    )

    // Build rankings data structure
    const metricsMap = new Map(metrics.map(m => [m.districtId, m]))
    const rankingsMap = new Map(aggregateRankings.map(r => [r.districtId, r]))

    const rankings: DistrictRanking[] = []
    for (const [districtId, aggregate] of rankingsMap) {
      const metric = metricsMap.get(districtId)
      if (!metric) continue

      rankings.push({
        districtId,
        districtName: metric.districtName,
        region: metric.region,
        paidClubs: metric.paidClubs,
        paidClubBase: metric.paidClubBase,
        clubGrowthPercent: metric.clubGrowthPercent,
        totalPayments: metric.totalPayments,
        paymentBase: metric.paymentBase,
        paymentGrowthPercent: metric.paymentGrowthPercent,
        activeClubs: metric.activeClubs,
        distinguishedClubs: metric.distinguishedClubs,
        selectDistinguished: metric.selectDistinguished,
        presidentsDistinguished: metric.presidentsDistinguished,
        distinguishedPercent: metric.distinguishedPercent,
        clubsRank: aggregate.clubsRank,
        paymentsRank: aggregate.paymentsRank,
        distinguishedRank: aggregate.distinguishedRank,
        aggregateScore: aggregate.aggregateScore,
        overallRank: 0, // Will be set after sorting
        // Smedley Distinguished tier (#329)
        smedleyDistinguished: metric.smedleyDistinguished,
        // District Recognition Program prerequisites (#329)
        dspSubmitted: metric.dspSubmitted,
        trainingMet: metric.trainingMet,
        marketAnalysisSubmitted: metric.marketAnalysisSubmitted,
        communicationPlanSubmitted: metric.communicationPlanSubmitted,
        regionAdvisorVisitMet: metric.regionAdvisorVisitMet,
        // Clubs with 20+ paid members for President's 20-Plus Award (#330)
        clubsWith20PlusMembers: metric.clubsWith20PlusMembers,
        // Paid clubs chartered this program year for District Club Retention Award (#336)
        newCharteredClubs: metric.newCharteredClubs,
        // Payment breakdown (#327)
        newPayments: metric.newPayments,
        aprilPayments: metric.aprilPayments,
        octoberPayments: metric.octoberPayments,
        latePayments: metric.latePayments,
        charterPayments: metric.charterPayments,
      })
    }

    // Sort by aggregate score (highest first) and assign overall ranks
    rankings.sort((a, b) => b.aggregateScore - a.aggregateScore)

    // Assign overall ranks with standard competition ranking (#303)
    rankings.forEach((ranking, index) => {
      if (
        index > 0 &&
        ranking.aggregateScore === rankings[index - 1]!.aggregateScore
      ) {
        ranking.overallRank = rankings[index - 1]!.overallRank
      } else {
        ranking.overallRank = index + 1
      }
    })

    const calculatedAt = new Date().toISOString()

    return {
      metadata: {
        snapshotId: date,
        calculatedAt,
        schemaVersion: ANALYTICS_SCHEMA_VERSION,
        calculationVersion: ANALYTICS_SCHEMA_VERSION,
        rankingVersion: RANKING_VERSION,
        sourceCsvDate: date,
        csvFetchedAt: calculatedAt,
        totalDistricts: rankings.length,
        fromCache: false,
      },
      rankings,
    }
  }

  /**
   * Read raw CSV file and return content
   */
  private async readCSVFile(filePath: string): Promise<string | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      const err = error as { code?: string }
      if (err.code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  /**
   * Load raw CSV data for a district
   */
  private async loadRawCSVData(
    date: string,
    districtId: string
  ): Promise<RawCSVData | null | 'corrupt'> {
    const districtDir = path.join(
      this.getRawCsvDir(date),
      `district-${districtId}`
    )

    // Check if district directory exists
    try {
      await fs.access(districtDir)
    } catch {
      this.logger.debug('District directory not found', {
        date,
        districtId,
        districtDir,
      })
      return null
    }

    // Read CSV files
    const clubPerformancePath = path.join(districtDir, 'club-performance.csv')
    const divisionPerformancePath = path.join(
      districtDir,
      'division-performance.csv'
    )
    const districtPerformancePath = path.join(
      districtDir,
      'district-performance.csv'
    )

    const clubContent = await this.readCSVFile(clubPerformancePath)
    const divisionContent = await this.readCSVFile(divisionPerformancePath)
    const districtContent = await this.readCSVFile(districtPerformancePath)

    // At minimum, we need club performance data
    if (!clubContent) {
      this.logger.warn('Club performance CSV not found', {
        date,
        districtId,
        path: clubPerformancePath,
      })
      return null
    }

    // Validate CSV content (#199): detect corrupt files with 0 data rows
    const validation = this.validateCSVContent(clubContent, clubPerformancePath)
    if (!validation.valid) {
      this.logger.warn('Corrupt CSV detected — skipping district', {
        date,
        districtId,
        path: clubPerformancePath,
        reason: validation.reason,
        fileSize: clubContent.length,
      })
      return 'corrupt'
    }

    const rawData: RawCSVData = {
      clubPerformance: this.parseCSVToArray(clubContent),
    }

    if (divisionContent) {
      rawData.divisionPerformance = this.parseCSVToArray(divisionContent)
    }

    if (districtContent) {
      rawData.districtPerformance = this.parseCSVToArray(districtContent)
    }

    return rawData
  }

  /**
   * Validate CSV content to detect corrupt files (#199).
   *
   * A corrupt CSV has zero data rows after parsing — only header + footer lines.
   * Example: a 478-byte file with just column headers and a "Month of" footer.
   *
   * @returns { valid: true } or { valid: false, reason: string }
   */
  private validateCSVContent(
    content: string,
    filePath: string
  ): { valid: true } | { valid: false; reason: string } {
    try {
      const records = this.parseCSVToRecords(content)
      if (records.length === 0) {
        return {
          valid: false,
          reason: `No data rows after parsing (${content.length} bytes, headers/footer only)`,
        }
      }
    } catch {
      // If parsing fails entirely, let the downstream transform handle it
      this.logger.debug('CSV parsing check failed, deferring to transform', {
        path: filePath,
      })
    }

    return { valid: true }
  }

  /**
   * Discover available districts from raw CSV cache
   */
  async discoverAvailableDistricts(date: string): Promise<string[]> {
    const rawCsvDir = this.getRawCsvDir(date)
    const districts: string[] = []

    try {
      const entries = await fs.readdir(rawCsvDir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('district-')) {
          const districtId = entry.name.replace('district-', '')
          // Validate district ID — legacy GCS data may contain stray directories
          // like "district-As of 03" from before the scraper parsing fix (#145)
          if (this.isValidDistrictId(districtId)) {
            districts.push(districtId)
          } else {
            this.logger.debug('Skipping invalid district directory', {
              name: entry.name,
              reason: this.getDistrictIdRejectionReason(districtId),
            })
          }
        }
      }

      districts.sort((a, b) => {
        const numA = parseInt(a, 10)
        const numB = parseInt(b, 10)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB
        }
        return a.localeCompare(b)
      })

      return districts
    } catch (error) {
      const err = error as { code?: string }
      if (err.code === 'ENOENT') {
        this.logger.warn('Raw CSV directory not found', { date, rawCsvDir })
        return []
      }
      throw error
    }
  }

  /**
   * Check if snapshot already exists for a district
   */
  async snapshotExists(date: string, districtId: string): Promise<boolean> {
    const snapshotPath = this.getDistrictSnapshotPath(date, districtId)
    try {
      await fs.access(snapshotPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Transform a single district's raw CSV data into snapshot format
   */
  async transformDistrict(
    date: string,
    districtId: string,
    options?: { force?: boolean }
  ): Promise<DistrictTransformResult> {
    const force = options?.force ?? false

    this.logger.info('Transforming district', { date, districtId, force })

    // Check if snapshot already exists (unless force is true)
    if (!force) {
      const exists = await this.snapshotExists(date, districtId)
      if (exists) {
        this.logger.info('Snapshot already exists, skipping', {
          date,
          districtId,
        })
        return {
          districtId,
          success: true,
          skipped: true,
        }
      }
    }

    // Load raw CSV data
    const rawData = await this.loadRawCSVData(date, districtId)
    if (rawData === 'corrupt') {
      return {
        districtId,
        success: true,
        skipped: true,
        error: `Skipped: corrupt club-performance.csv for district ${districtId} on ${date}`,
      }
    }
    if (!rawData) {
      return {
        districtId,
        success: false,
        error: `Raw CSV data not found for district ${districtId} on ${date}`,
      }
    }

    try {
      // Transform using shared DataTransformer
      const districtStats = await this.dataTransformer.transformRawCSV(
        date,
        districtId,
        rawData
      )

      // Write district snapshot file
      const snapshotPath = this.getDistrictSnapshotPath(date, districtId)
      const snapshotDir = path.dirname(snapshotPath)

      await fs.mkdir(snapshotDir, { recursive: true })

      // Wrap district data in PerDistrictData format expected by backend
      const perDistrictData: PerDistrictData = {
        districtId,
        districtName: `District ${districtId}`,
        collectedAt: new Date().toISOString(),
        status: 'success',
        data: districtStats,
      }

      // Validate data before writing (Requirement 7.4, 7.5)
      const validationResult = validatePerDistrictData(perDistrictData)
      if (!validationResult.success) {
        this.logger.error(`Validation failed for district ${districtId}`, {
          error: validationResult.error,
        })
        throw new Error(
          `Validation failed for district ${districtId}: ${validationResult.error}`
        )
      }

      const snapshotContent = JSON.stringify(validationResult.data, null, 2)
      const tempPath = `${snapshotPath}.tmp.${Date.now()}`
      await fs.writeFile(tempPath, snapshotContent, 'utf-8')
      await fs.rename(tempPath, snapshotPath)

      this.logger.info('District snapshot written', {
        date,
        districtId,
        path: snapshotPath,
        clubCount: districtStats.clubs.length,
      })

      return {
        districtId,
        success: true,
        snapshotPath,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Failed to transform district', {
        date,
        districtId,
        error: errorMessage,
      })
      return {
        districtId,
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Write snapshot metadata file
   *
   * Requirements:
   * - 3.1: WHEN creating a closing period snapshot THEN the metadata SHALL include `isClosingPeriodData: true`
   * - 3.2: WHEN creating a closing period snapshot THEN the metadata SHALL include `collectionDate`
   * - 3.3: WHEN creating a closing period snapshot THEN the metadata SHALL include `logicalDate`
   * - 3.4: WHEN creating a non-closing-period snapshot THEN the metadata SHALL NOT include closing period fields
   */
  private async writeMetadata(
    date: string,
    successfulDistricts: string[],
    failedDistricts: string[],
    errors: string[],
    processingDuration: number,
    closingPeriodInfo?: ClosingPeriodInfo
  ): Promise<void> {
    const snapshotDir = this.getSnapshotDir(date)
    const metadataPath = path.join(snapshotDir, 'metadata.json')

    // Determine status based on results
    let status: 'success' | 'partial' | 'failed'
    if (failedDistricts.length === 0) {
      status = 'success'
    } else if (successfulDistricts.length > 0) {
      status = 'partial'
    } else {
      status = 'failed'
    }

    const allDistricts = [...successfulDistricts, ...failedDistricts]

    const metadata: SnapshotMetadataFile = {
      snapshotId: date,
      createdAt: new Date().toISOString(),
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      calculationVersion: ANALYTICS_SCHEMA_VERSION,
      status,
      configuredDistricts: allDistricts,
      successfulDistricts,
      failedDistricts,
      errors,
      processingDuration,
      source: 'collector-cli',
      dataAsOfDate: date,
    }

    // Add closing period fields if this is a closing period snapshot (Requirements 3.1, 3.2, 3.3)
    // For non-closing period snapshots, omit these fields (Requirement 3.4)
    if (closingPeriodInfo?.isClosingPeriod) {
      metadata.isClosingPeriodData = true
      metadata.collectionDate = closingPeriodInfo.collectionDate
      metadata.logicalDate = closingPeriodInfo.logicalDate
    }

    // Validate data before writing (Requirement 7.4, 7.5)
    const validationResult = validateSnapshotMetadata(metadata)
    if (!validationResult.success) {
      this.logger.error('Validation failed for snapshot metadata', {
        error: validationResult.error,
      })
      throw new Error(
        `Validation failed for snapshot metadata: ${validationResult.error}`
      )
    }

    const content = JSON.stringify(validationResult.data, null, 2)
    const tempPath = `${metadataPath}.tmp.${Date.now()}`
    await fs.writeFile(tempPath, content, 'utf-8')
    await fs.rename(tempPath, metadataPath)

    this.logger.info('Metadata file written', { date, path: metadataPath })
  }

  /**
   * Write snapshot manifest file
   */
  private async writeManifest(
    date: string,
    districtEntries: DistrictManifestEntry[],
    failedDistrictIds: string[]
  ): Promise<void> {
    const snapshotDir = this.getSnapshotDir(date)
    const manifestPath = path.join(snapshotDir, 'manifest.json')

    const manifest: SnapshotManifest = {
      snapshotId: date,
      createdAt: new Date().toISOString(),
      districts: districtEntries,
      totalDistricts: districtEntries.length + failedDistrictIds.length,
      successfulDistricts: districtEntries.length,
      failedDistricts: failedDistrictIds.length,
      writeComplete: true,
    }

    // Validate data before writing (Requirement 7.4, 7.5)
    const validationResult = validateSnapshotManifest(manifest)
    if (!validationResult.success) {
      this.logger.error('Validation failed for snapshot manifest', {
        error: validationResult.error,
      })
      throw new Error(
        `Validation failed for snapshot manifest: ${validationResult.error}`
      )
    }

    const content = JSON.stringify(validationResult.data, null, 2)
    const tempPath = `${manifestPath}.tmp.${Date.now()}`
    await fs.writeFile(tempPath, content, 'utf-8')
    await fs.rename(tempPath, manifestPath)

    this.logger.info('Manifest file written', {
      date,
      path: manifestPath,
      totalDistricts: manifest.totalDistricts,
      successfulDistricts: manifest.successfulDistricts,
    })
  }

  /**
   * Write the snapshot pointer file (`latest-successful.json`) to the snapshots directory.
   *
   * The pointer file enables the backend to resolve the latest successful snapshot
   * in O(1) instead of scanning all snapshot directories.
   *
   * Concurrency guard: reads the existing pointer and only overwrites if the new
   * snapshot date is chronologically >= the existing pointer's snapshot date.
   * This prevents a slower-running older transform from overwriting a newer pointer.
   *
   * The write is atomic: data is written to a temp file first, then renamed.
   *
   * Requirements: 1.1, 1.3, 1.4, 1.5
   */
  private async writeSnapshotPointer(snapshotDate: string): Promise<void> {
    const pointerPath = path.join(
      this.cacheDir,
      'snapshots',
      'latest-successful.json'
    )

    // Read existing pointer to check if we should update (Requirement 1.5)
    try {
      const existing = JSON.parse(
        await fs.readFile(pointerPath, 'utf-8')
      ) as unknown
      const validation = validateSnapshotPointer(existing)
      if (
        validation.success &&
        validation.data &&
        validation.data.snapshotId > snapshotDate
      ) {
        // Existing pointer is newer, don't overwrite
        this.logger.info(
          'Existing snapshot pointer is newer, skipping update',
          {
            existing: validation.data.snapshotId,
            incoming: snapshotDate,
          }
        )
        return
      }
    } catch {
      // No existing pointer or invalid - proceed with write
    }

    // Build the pointer object (Requirement 1.4)
    const pointer: SnapshotPointer = {
      snapshotId: snapshotDate,
      updatedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
    }

    // Validate before writing (Requirement 4.4)
    const validated = validateSnapshotPointer(pointer)
    if (!validated.success) {
      throw new Error(`Invalid snapshot pointer: ${validated.error}`)
    }

    // Atomic write via temp file + rename (Requirement 1.3)
    const tempPath = `${pointerPath}.tmp.${Date.now()}`
    await fs.writeFile(
      tempPath,
      JSON.stringify(validated.data, null, 2),
      'utf-8'
    )
    await fs.rename(tempPath, pointerPath)

    this.logger.info('Snapshot pointer written', {
      snapshotDate,
      path: pointerPath,
    })
  }

  /**
   * Get manifest entry for a district snapshot file
   */
  private async getDistrictManifestEntry(
    date: string,
    districtId: string
  ): Promise<DistrictManifestEntry | null> {
    const snapshotPath = this.getDistrictSnapshotPath(date, districtId)

    try {
      const stat = await fs.stat(snapshotPath)

      return {
        districtId,
        fileName: `district_${districtId}.json`,
        status: 'success',
        fileSize: stat.size,
        lastModified: stat.mtime.toISOString(),
      }
    } catch {
      return null
    }
  }

  /**
   * Transform a single district's raw CSV data into snapshot format,
   * writing to a specific snapshot date directory.
   *
   * This method allows reading raw CSV from one date (sourceDate) and
   * writing the snapshot to a different date directory (snapshotDate).
   * This is needed for closing period handling where raw CSV is stored
   * by collection date but snapshots are stored by logical date.
   *
   * @param sourceDate - The date where raw CSV files are stored (YYYY-MM-DD)
   * @param snapshotDate - The date to use for the snapshot directory (YYYY-MM-DD)
   * @param districtId - The district ID to transform
   * @param options - Transform options (force flag)
   * @returns Transform result for the district
   */
  private async transformDistrictToDate(
    sourceDate: string,
    snapshotDate: string,
    districtId: string,
    options?: { force?: boolean }
  ): Promise<DistrictTransformResult> {
    const force = options?.force ?? false

    this.logger.info('Transforming district', {
      sourceDate,
      snapshotDate,
      districtId,
      force,
    })

    // Check if snapshot already exists at the target date (unless force is true)
    if (!force) {
      const exists = await this.snapshotExists(snapshotDate, districtId)
      if (exists) {
        this.logger.info('Snapshot already exists, skipping', {
          snapshotDate,
          districtId,
        })
        return {
          districtId,
          success: true,
          skipped: true,
        }
      }
    }

    // Load raw CSV data from source date
    const rawData = await this.loadRawCSVData(sourceDate, districtId)
    if (rawData === 'corrupt') {
      return {
        districtId,
        success: true,
        skipped: true,
        error: `Skipped: corrupt club-performance.csv for district ${districtId} on ${sourceDate}`,
      }
    }
    if (!rawData) {
      return {
        districtId,
        success: false,
        error: `Raw CSV data not found for district ${districtId} on ${sourceDate}`,
      }
    }

    try {
      // Transform using shared DataTransformer - use snapshotDate for the data
      const districtStats = await this.dataTransformer.transformRawCSV(
        snapshotDate,
        districtId,
        rawData
      )

      // Write district snapshot file to snapshot date directory
      const snapshotPath = this.getDistrictSnapshotPath(
        snapshotDate,
        districtId
      )
      const snapshotDir = path.dirname(snapshotPath)

      await fs.mkdir(snapshotDir, { recursive: true })

      // Wrap district data in PerDistrictData format expected by backend
      const perDistrictData: PerDistrictData = {
        districtId,
        districtName: `District ${districtId}`,
        collectedAt: new Date().toISOString(),
        status: 'success',
        data: districtStats,
      }

      // Validate data before writing (Requirement 7.4, 7.5)
      const validationResult = validatePerDistrictData(perDistrictData)
      if (!validationResult.success) {
        this.logger.error(`Validation failed for district ${districtId}`, {
          error: validationResult.error,
        })
        throw new Error(
          `Validation failed for district ${districtId}: ${validationResult.error}`
        )
      }

      const snapshotContent = JSON.stringify(validationResult.data, null, 2)
      const tempPath = `${snapshotPath}.tmp.${Date.now()}`
      await fs.writeFile(tempPath, snapshotContent, 'utf-8')
      await fs.rename(tempPath, snapshotPath)

      this.logger.info('District snapshot written', {
        snapshotDate,
        districtId,
        path: snapshotPath,
        clubCount: districtStats.clubs.length,
      })

      return {
        districtId,
        success: true,
        snapshotPath,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Failed to transform district', {
        sourceDate,
        snapshotDate,
        districtId,
        error: errorMessage,
      })
      return {
        districtId,
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Write all-districts rankings to a specific snapshot date directory
   *
   * @param snapshotDate - The date to use for the snapshot directory
   * @param rankings - The rankings data to write
   * @returns Path to the written rankings file
   */
  private async writeAllDistrictsRankingsToDate(
    snapshotDate: string,
    rankings: AllDistrictsRankingsData
  ): Promise<string> {
    const snapshotDir = this.getSnapshotDir(snapshotDate)
    const rankingsPath = path.join(snapshotDir, 'all-districts-rankings.json')

    await fs.mkdir(snapshotDir, { recursive: true })

    // Validate data before writing (Requirement 7.4, 7.5)
    const validationResult = validateAllDistrictsRankings(rankings)
    if (!validationResult.success) {
      this.logger.error('Validation failed for all-districts rankings', {
        error: validationResult.error,
      })
      throw new Error(
        `Validation failed for all-districts rankings: ${validationResult.error}`
      )
    }

    const content = JSON.stringify(validationResult.data, null, 2)
    const tempPath = `${rankingsPath}.tmp.${Date.now()}`
    await fs.writeFile(tempPath, content, 'utf-8')
    await fs.rename(tempPath, rankingsPath)

    this.logger.info('All-districts rankings written', {
      snapshotDate,
      path: rankingsPath,
      totalDistricts: rankings.rankings.length,
    })

    return rankingsPath
  }

  /**
   * Write competitive awards + Distinguished District standings file (#330, #332)
   *
   * Computes:
   * - Three competitive district awards (Extension, 20-Plus, Retention) from
   *   the all-districts rankings
   * - Per-district Distinguished District tier status (Distinguished, Select,
   *   Presidents, Smedley) with prerequisite gating and gap analysis
   *
   * Writes everything to snapshots/{date}/competitive-awards.json so the
   * frontend fetches a single file for all award data.
   *
   * @param snapshotDate - The date to write the snapshot under
   * @param rankings - The rankings data already computed for this date
   * @returns Path to the written competitive awards file
   */
  private async writeCompetitiveAwardsToDate(
    snapshotDate: string,
    rankings: AllDistrictsRankingsData
  ): Promise<string> {
    // ── Competitive awards (Extension, 20-Plus, Retention) ──
    const competitiveCalculator = new CompetitiveAwardsCalculator()
    const standings = competitiveCalculator.calculate(rankings.rankings)

    // ── Distinguished District tier status (#332) ──
    const distinguishedCalculator = new DistinguishedDistrictCalculator()
    const distinguishedDistrict = distinguishedCalculator.calculateAll(
      rankings.rankings
    )

    // ── Load/create awards history store (#333) ──
    let historyStore = await DistrictAwardsHistoryStore.load(this.cacheDir)
    if (!historyStore) {
      historyStore = DistrictAwardsHistoryStore.create()
    }

    const programYear = calculateProgramYear(snapshotDate)
    const priorProgramYear = getPriorProgramYear(programYear)
    const snapshotDir = this.getSnapshotDir(snapshotDate)

    // ── Read totalMembership + compute avgClubSize per district (#333) ──
    const districtAvgClubSizes = new Map<string, number>()

    for (const ranking of rankings.rankings) {
      try {
        const snapshotPath = path.join(
          snapshotDir,
          `district_${ranking.districtId}.json`
        )
        const content = await fs
          .readFile(snapshotPath, 'utf-8')
          .catch(() => null)
        if (!content) continue
        const perDistrictData = JSON.parse(content) as PerDistrictData
        const totalMembership =
          perDistrictData.data?.totals?.totalMembership ?? 0
        const avgClubSize =
          ranking.activeClubs > 0 ? totalMembership / ranking.activeClubs : 0
        districtAvgClubSizes.set(ranking.districtId, avgClubSize)

        // Upsert into history store
        historyStore.upsertYearSummary(ranking.districtId, {
          programYear,
          distinguishedTier:
            distinguishedDistrict[ranking.districtId]?.currentTier ??
            'NotDistinguished',
          avgClubSize,
          totalMembership,
          activeClubs: ranking.activeClubs,
          snapshotDate,
        })
      } catch {
        // Skip districts with unreadable snapshots
      }
    }

    // ── Save history store (#333) ──
    await historyStore.save(this.cacheDir)

    // ── Club Strength Award (#333) ──
    const clubStrengthCalculator = new ClubStrengthAwardCalculator()
    const clubStrengthInputs = rankings.rankings.map(r => ({
      districtId: r.districtId,
      districtName: r.districtName,
      region: r.region,
      currentAvgClubSize: districtAvgClubSizes.get(r.districtId) ?? 0,
      priorYearAvgClubSize:
        historyStore.getYearSummary(r.districtId, priorProgramYear)
          ?.avgClubSize ?? null,
    }))
    const clubStrengthAward =
      clubStrengthCalculator.calculate(clubStrengthInputs)

    // ── Leadership Excellence Award (#333) ──
    const leadershipCalculator = new LeadershipExcellenceCalculator()
    const leadershipInputs = rankings.rankings.map(r => ({
      districtId: r.districtId,
      districtName: r.districtName,
      region: r.region,
      yearEndTiers: historyStore
        .getCompletedYearTiers(r.districtId, programYear)
        .map(t => ({
          programYear: t.programYear,
          tier: t.tier as
            | 'NotDistinguished'
            | 'Distinguished'
            | 'Select'
            | 'Presidents'
            | 'Smedley',
        })),
    }))
    const leadershipExcellenceAward =
      leadershipCalculator.calculate(leadershipInputs)

    // ── Officer Awards (#333) ──
    const officerCalculator = new OfficerAwardsCalculator()
    const officerAwards = officerCalculator.calculate(
      rankings.rankings,
      distinguishedDistrict
    )

    // ── Write payload ─��
    const awardsPath = path.join(snapshotDir, 'competitive-awards.json')
    await fs.mkdir(snapshotDir, { recursive: true })

    // Payment breakdown per district (#327)
    const paymentBreakdown: Record<
      string,
      {
        newPayments: number
        aprilPayments: number
        octoberPayments: number
        latePayments: number
        charterPayments: number
        totalPayments: number
      }
    > = {}
    for (const r of rankings.rankings) {
      paymentBreakdown[r.districtId] = {
        newPayments: r.newPayments ?? 0,
        aprilPayments: r.aprilPayments ?? 0,
        octoberPayments: r.octoberPayments ?? 0,
        latePayments: r.latePayments ?? 0,
        charterPayments: r.charterPayments ?? 0,
        totalPayments: r.totalPayments,
      }
    }

    const payload = {
      metadata: {
        snapshotId: snapshotDate,
        calculatedAt: new Date().toISOString(),
        totalDistricts: rankings.rankings.length,
      },
      ...standings,
      distinguishedDistrict,
      clubStrengthAward,
      leadershipExcellenceAward,
      officerAwards,
      paymentBreakdown,
    }

    const content = JSON.stringify(payload, null, 2)
    const tempPath = `${awardsPath}.tmp.${Date.now()}`
    await fs.writeFile(tempPath, content, 'utf-8')
    await fs.rename(tempPath, awardsPath)

    this.logger.info('All district awards written', {
      snapshotDate,
      path: awardsPath,
      totalDistricts: rankings.rankings.length,
      clubStrengthQualifying: clubStrengthAward.qualifyingDistricts.length,
      leadershipExcellenceQualifying:
        leadershipExcellenceAward.qualifyingDistricts.length,
    })

    return awardsPath
  }

  /**
   * Transform all available districts for a date
   *
   * Requirements:
   * - 2.2: Use the same DataTransformationService logic as the Backend
   * - 2.3: Store snapshots in CACHE_DIR/snapshots/{date}/
   * - 2.4: Write district JSON files, metadata.json, and manifest.json
   * - 2.2 (closing period): WHEN `isClosingPeriod` is true THEN write snapshot to lastDayOfDataMonth
   * - 4.2: WHEN the new data has a strictly newer collection date THEN overwrite the existing snapshot
   * - 4.3: WHEN the new data has an equal or older collection date THEN skip the update
   * - 5.1: WHEN a closing period is detected THEN do NOT create a snapshot dated in the new month
   * - 5.2: WHEN transforming closing period data THEN only create a snapshot for the last day of the data month
   */
  async transform(
    options: TransformOperationOptions
  ): Promise<TransformOperationResult> {
    const startTime = Date.now()
    const { date, districts: requestedDistricts, force, verbose } = options

    if (verbose) {
      this.logger.info('Starting transform operation', {
        date,
        requestedDistricts,
        force,
      })
    }

    // Step 1: Read cache metadata to detect closing periods (Requirement 1.1)
    const cacheMetadata = await this.readCacheMetadata(date)

    // Step 2: Determine the correct snapshot date based on closing period detection
    // (Requirements 2.1, 2.2, 2.3, 2.4, 5.1, 5.2)
    const closingPeriodInfo = this.determineSnapshotDate(date, cacheMetadata)
    const snapshotDate = closingPeriodInfo.snapshotDate

    if (closingPeriodInfo.isClosingPeriod) {
      this.logger.info('Closing period detected', {
        requestedDate: date,
        dataMonth: closingPeriodInfo.dataMonth,
        snapshotDate: closingPeriodInfo.snapshotDate,
        collectionDate: closingPeriodInfo.collectionDate,
      })
    }

    // Step 3: For closing periods, check if we should update the existing snapshot
    // (Requirements 4.1, 4.2, 4.3, 4.4)
    if (closingPeriodInfo.isClosingPeriod && !force) {
      const shouldUpdate = await this.shouldUpdateSnapshot(
        snapshotDate,
        closingPeriodInfo.collectionDate
      )

      if (!shouldUpdate) {
        this.logger.info(
          'Skipping transform: existing snapshot is newer or equal',
          {
            snapshotDate,
            collectionDate: closingPeriodInfo.collectionDate,
          }
        )

        return {
          success: true,
          date: snapshotDate,
          districtsProcessed: [],
          districtsSucceeded: [],
          districtsFailed: [],
          districtsSkipped: [],
          snapshotLocations: [],
          errors: [],
          duration_ms: Date.now() - startTime,
        }
      }
    }

    // Discover available districts if not specified
    let districtsToTransform: string[]
    if (requestedDistricts && requestedDistricts.length > 0) {
      districtsToTransform = requestedDistricts
    } else {
      districtsToTransform = await this.discoverAvailableDistricts(date)
    }

    if (districtsToTransform.length === 0) {
      this.logger.warn('No districts found to transform', { date })
      return {
        success: false,
        date: snapshotDate,
        districtsProcessed: [],
        districtsSucceeded: [],
        districtsFailed: [],
        districtsSkipped: [],
        snapshotLocations: [],
        errors: [
          {
            districtId: 'N/A',
            error: `No raw CSV data found for date ${date}`,
            timestamp: new Date().toISOString(),
          },
        ],
        duration_ms: Date.now() - startTime,
      }
    }

    // Transform each district - read from source date, write to snapshot date
    const results: DistrictTransformResult[] = []
    const errors: Array<{
      districtId: string
      error: string
      timestamp: string
    }> = []
    const snapshotLocations: string[] = []
    const successfulDistricts: string[] = []

    for (const districtId of districtsToTransform) {
      // Transform district: read from 'date', write to 'snapshotDate'
      const result = await this.transformDistrictToDate(
        date,
        snapshotDate,
        districtId,
        { force }
      )
      results.push(result)

      if (result.success) {
        if (!result.skipped) {
          successfulDistricts.push(districtId)
          if (result.snapshotPath) {
            snapshotLocations.push(result.snapshotPath)
          }
        }
      } else if (result.error) {
        errors.push({
          districtId,
          error: result.error,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Collect manifest entries for all district files (including previously existing ones)
    const districtEntries: DistrictManifestEntry[] = []
    const allSuccessfulDistricts: string[] = []

    for (const districtId of districtsToTransform) {
      const entry = await this.getDistrictManifestEntry(
        snapshotDate,
        districtId
      )
      if (entry) {
        districtEntries.push(entry)
        allSuccessfulDistricts.push(districtId)
      }
    }

    // Write metadata and manifest if we have any successful districts
    if (allSuccessfulDistricts.length > 0) {
      try {
        // Collect failed districts and error messages for metadata
        const failedDistrictIds = results
          .filter(r => !r.success)
          .map(r => r.districtId)
        const errorMessages = errors.map(e => `${e.districtId}: ${e.error}`)
        const processingDuration = Date.now() - startTime

        // Pass closing period info to writeMetadata for Task 7.2
        await this.writeMetadata(
          snapshotDate,
          allSuccessfulDistricts,
          failedDistrictIds,
          errorMessages,
          processingDuration,
          closingPeriodInfo
        )
        await this.writeManifest(
          snapshotDate,
          districtEntries,
          failedDistrictIds
        )

        // Add metadata and manifest to snapshot locations
        const snapshotDir = this.getSnapshotDir(snapshotDate)
        snapshotLocations.push(path.join(snapshotDir, 'metadata.json'))
        snapshotLocations.push(path.join(snapshotDir, 'manifest.json'))

        // Calculate and write all-districts rankings (Requirement 2.4)
        // Read rankings from source date, write to snapshot date
        try {
          const rankings = await this.calculateAllDistrictsRankings(date)
          if (rankings) {
            const rankingsPath = await this.writeAllDistrictsRankingsToDate(
              snapshotDate,
              rankings
            )
            snapshotLocations.push(rankingsPath)

            // Calculate and write competitive awards standings (#330)
            try {
              const competitiveAwardsPath =
                await this.writeCompetitiveAwardsToDate(snapshotDate, rankings)
              snapshotLocations.push(competitiveAwardsPath)
            } catch (awardsError) {
              const msg =
                awardsError instanceof Error ? awardsError.message : 'Unknown'
              this.logger.error(
                'Failed to calculate/write competitive awards',
                { date, error: msg }
              )
            }
          } else {
            this.logger.warn(
              'Could not calculate all-districts rankings (no CSV data)',
              { date }
            )
          }
        } catch (rankingsError) {
          const rankingsErrorMessage =
            rankingsError instanceof Error
              ? rankingsError.message
              : 'Unknown error'
          this.logger.error(
            'Failed to calculate/write all-districts rankings',
            {
              date,
              error: rankingsErrorMessage,
            }
          )
          // Don't fail the entire transform for rankings failure
          errors.push({
            districtId: 'all-districts-rankings',
            error: `Failed to calculate rankings: ${rankingsErrorMessage}`,
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        this.logger.error('Failed to write metadata/manifest', {
          date,
          error: errorMessage,
        })
        errors.push({
          districtId: 'N/A',
          error: `Failed to write metadata/manifest: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Calculate result statistics
    const districtsProcessed = districtsToTransform
    const districtsSucceeded = results
      .filter(r => r.success && !r.skipped)
      .map(r => r.districtId)
    const districtsFailed = results
      .filter(r => !r.success)
      .map(r => r.districtId)
    const districtsSkipped = results
      .filter(r => r.success && r.skipped)
      .map(r => r.districtId)

    const success = districtsFailed.length === 0 && errors.length === 0

    // Write snapshot pointer only for fully successful transforms (Requirements 1.1, 1.2)
    if (success) {
      try {
        await this.writeSnapshotPointer(snapshotDate)
      } catch (pointerError: unknown) {
        // Pointer is an optimization, not critical — log and continue
        this.logger.error('Failed to write snapshot pointer', {
          snapshotDate,
          error:
            pointerError instanceof Error
              ? pointerError.message
              : 'Unknown error',
        })
      }
    }

    if (verbose) {
      this.logger.info('Transform operation completed', {
        date,
        snapshotDate,
        success,
        processed: districtsProcessed.length,
        succeeded: districtsSucceeded.length,
        failed: districtsFailed.length,
        skipped: districtsSkipped.length,
        isClosingPeriod: closingPeriodInfo.isClosingPeriod,
      })
    }

    return {
      success,
      date: snapshotDate,
      districtsProcessed,
      districtsSucceeded,
      districtsFailed,
      districtsSkipped,
      snapshotLocations,
      errors,
      duration_ms: Date.now() - startTime,
    }
  }
}
