/**
 * CLI Definition using Commander.js
 *
 * This module defines the command-line interface for the collector tool.
 *
 * Requirements:
 * - 1.1: Standalone executable CLI
 * - 1.3: --date option with YYYY-MM-DD validation
 * - 1.5: --districts option with comma-separated parsing
 * - 1.7: --verbose flag for detailed logging
 * - 1.8: --timeout option for maximum duration
 * - 1.9: JSON output format
 * - 1.11: Exit codes
 * - 7.1: Read district configuration from the same source as the Backend
 * - 7.2: Use the same cache directory configuration as the Backend
 * - 7.5: --config option for alternative configuration
 *
 * Pre-Computed Analytics Pipeline Requirements:
 * - 2.1: THE Collector_CLI SHALL provide a `transform` command that converts raw CSV files into snapshot format
 * - 2.5: THE `scrape` command SHALL optionally run transformation automatically with a `--transform` flag
 */

import { Command } from 'commander'
import { CollectorOrchestrator } from './CollectorOrchestrator.js'
import { TransformService } from './services/TransformService.js'
import { AnalyticsComputeService } from './services/AnalyticsComputeService.js'
import { UploadService } from './services/UploadService.js'
import {
  DistrictSnapshotIndexWriter,
  type IndexStorage,
  type DistrictSnapshotIndex,
} from './services/DistrictSnapshotIndexWriter.js'
import { createVerboseLogger } from './createVerboseLogger.js'
import {
  CLIOptions,
  ExitCode,
  ScrapeResult,
  TransformOptions,
  TransformResult,
  ScrapeWithTransformSummary,
  ComputeAnalyticsOptions,
  ComputeAnalyticsResult,
  UploadOptions,
} from './types/index.js'
import { resolveConfiguration } from './utils/config.js'

// Re-export configuration utilities for external use
export {
  resolveConfiguration,
  resolveCacheDirectory,
  resolveDistrictConfigPath,
} from './utils/config.js'
export type { ResolvedConfiguration } from './utils/config.js'

// Re-export all CLI helpers for backward compatibility
export {
  validateDateFormat,
  getCurrentDateString,
  parseDistrictList,
  determineExitCode,
  determineTransformExitCode,
  determineComputeAnalyticsExitCode,
  determineUploadExitCode,
  formatScrapeSummary,
  formatTransformSummary,
  formatComputeAnalyticsSummary,
  formatUploadSummary,
} from './cliHelpers.js'

// Import helpers for use within this module (namespace to avoid redeclaration)
import * as helpers from './cliHelpers.js'
const {
  validateDateFormat,
  getCurrentDateString,
  parseDistrictList,
  determineExitCode,
  determineTransformExitCode,
  determineComputeAnalyticsExitCode,
  determineUploadExitCode,
  formatScrapeSummary,
  formatTransformSummary,
  formatComputeAnalyticsSummary,
  formatUploadSummary,
} = helpers

/**
 * Create the CLI program
 */
export function createCLI(): Command {
  const program = new Command()

  program
    .name('collector-cli')
    .description('Standalone CLI tool for scraping Toastmasters dashboard data')
    .version('1.0.0')

  program
    .command('scrape')
    .description('Scrape data from the Toastmasters dashboard')
    .option(
      '-d, --date <YYYY-MM-DD>',
      'Target date for scraping (default: today)',
      (value: string) => {
        if (!validateDateFormat(value)) {
          console.error(
            `Error: Invalid date format "${value}". Use YYYY-MM-DD.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return value
      }
    )
    .option(
      '--districts <list>',
      'Comma-separated district IDs to scrape',
      parseDistrictList
    )
    .option('-f, --force', 'Force re-scrape even if cache exists', false)
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .option(
      '-t, --timeout <seconds>',
      'Maximum duration in seconds',
      (value: string) => {
        const timeout = parseInt(value, 10)
        if (isNaN(timeout) || timeout <= 0) {
          console.error(
            `Error: Invalid timeout value "${value}". Must be a positive number.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return timeout
      },
      300
    )
    .option('-c, --config <path>', 'Alternative configuration file path')
    .option(
      '--transform',
      'Run transformation after scraping (Requirement 2.5)',
      false
    )
    .action(async (options: CLIOptions) => {
      // Use current date if not specified (Requirement 1.4)
      const targetDate = options.date ?? getCurrentDateString()
      // Districts is parsed by parseDistrictList which returns string[]
      const districts = options.districts as string[] | undefined

      // Resolve configuration paths using shared configuration logic
      // Requirement 7.1: Read district configuration from the same source as the Backend
      // Requirement 7.2: Use the same cache directory configuration as the Backend
      const resolvedConfig = resolveConfiguration({
        configPath: options.config,
      })
      const { cacheDir, districtConfigPath } = resolvedConfig

      if (options.verbose) {
        console.error(`[INFO] Starting scrape for date: ${targetDate}`)
        if (districts) {
          console.error(`[INFO] Districts: ${districts.join(', ')}`)
        } else {
          console.error('[INFO] Districts: all configured')
        }
        console.error(`[INFO] Force: ${options.force}`)
        console.error(`[INFO] Timeout: ${options.timeout}s`)
        console.error(`[INFO] Transform: ${options.transform}`)
        console.error(`[INFO] Config: ${districtConfigPath}`)
        console.error(`[INFO] Cache directory: ${cacheDir}`)
        console.error(`[INFO] Config source: ${resolvedConfig.source}`)
      }

      // Create orchestrator
      const orchestrator = new CollectorOrchestrator({
        cacheDir,
        districtConfigPath,
        timeout: options.timeout,
        verbose: options.verbose,
      })

      let result: ScrapeResult

      try {
        // Execute scrape operation
        result = await orchestrator.scrape({
          date: targetDate,
          districts,
          force: options.force,
        })
      } catch (error) {
        // Fatal error - create error result
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'

        if (options.verbose) {
          console.error(`[ERROR] Fatal error during scrape: ${errorMessage}`)
        }

        result = {
          success: false,
          date: targetDate,
          districtsProcessed: [],
          districtsSucceeded: [],
          districtsFailed: [],
          cacheLocations: [],
          errors: [
            {
              districtId: 'N/A',
              error: `Fatal error: ${errorMessage}`,
              timestamp: new Date().toISOString(),
            },
          ],
          duration_ms: 0,
        }
      } finally {
        // Ensure resources are cleaned up
        await orchestrator.close()
      }

      // Format base scrape summary (Requirement 1.9)
      const summary: ScrapeWithTransformSummary = formatScrapeSummary(
        result,
        cacheDir
      )

      // Determine scrape exit code
      let exitCode = determineExitCode(result)

      // Run transformation if --transform flag is set and scrape had some success
      // Requirement 2.5: THE `scrape` command SHALL optionally run transformation automatically with a `--transform` flag
      if (options.transform) {
        const scrapeHadSuccess = result.districtsSucceeded.length > 0

        if (scrapeHadSuccess) {
          if (options.verbose) {
            console.error(`[INFO] Running transformation after scrape...`)
          }

          // Create TransformService with optional verbose logger
          const transformService = new TransformService({
            cacheDir,
            logger: createVerboseLogger(options.verbose),
          })

          // Transform only the successfully scraped districts
          const transformResult = await transformService.transform({
            date: targetDate,
            districts: result.districtsSucceeded,
            force: options.force, // Use same force flag as scrape
            verbose: options.verbose,
          })

          // Determine transform status
          const transformExitCode = determineTransformExitCode(transformResult)
          let transformStatus: 'success' | 'partial' | 'failed'
          if (transformExitCode === ExitCode.SUCCESS) {
            transformStatus = 'success'
          } else if (transformExitCode === ExitCode.PARTIAL_FAILURE) {
            transformStatus = 'partial'
          } else {
            transformStatus = 'failed'
          }

          // Add transform results to summary
          // Use actual snapshot date (post closing-period remap) (#309)
          const actualSnapshotDate = transformResult.date ?? targetDate
          const snapshotDir = `${cacheDir}/snapshots/${actualSnapshotDate}`
          // Surface the actual snapshot date at top level for pipeline upload
          summary.snapshotDate = actualSnapshotDate
          summary.transform = {
            status: transformStatus,
            districts: {
              total: transformResult.districtsProcessed.length,
              succeeded: transformResult.districtsSucceeded.length,
              failed: transformResult.districtsFailed.length,
              skipped: transformResult.districtsSkipped.length,
            },
            snapshots: {
              directory: snapshotDir,
              filesCreated: transformResult.snapshotLocations.length,
            },
            errors: transformResult.errors.map(e => ({
              districtId: e.districtId,
              error: e.error,
            })),
            duration_ms: transformResult.duration_ms,
          }

          // Update exit code if transform failed and scrape succeeded
          // Use the worse of the two exit codes
          if (transformExitCode > exitCode) {
            exitCode = transformExitCode
          }

          if (options.verbose) {
            console.error(
              `[INFO] Transform completed with status: ${transformStatus}`
            )
          }
        } else {
          // Scrape had no success, skip transformation
          if (options.verbose) {
            console.error(
              `[INFO] Skipping transformation - no successful scrapes`
            )
          }

          summary.transform = {
            status: 'skipped',
            districts: {
              total: 0,
              succeeded: 0,
              failed: 0,
              skipped: 0,
            },
            snapshots: {
              directory: `${cacheDir}/snapshots/${targetDate}`,
              filesCreated: 0,
            },
            errors: [],
            duration_ms: 0,
          }
        }
      }

      // Output JSON summary
      console.log(JSON.stringify(summary, null, 2))

      if (options.verbose) {
        console.error(`[INFO] Scrape completed with exit code: ${exitCode}`)
      }

      process.exit(exitCode)
    })

  // Add status command for checking cache status
  program
    .command('status')
    .description('Check cache status for a specific date')
    .option(
      '-d, --date <YYYY-MM-DD>',
      'Date to check (default: today)',
      (value: string) => {
        if (!validateDateFormat(value)) {
          console.error(
            `Error: Invalid date format "${value}". Use YYYY-MM-DD.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return value
      }
    )
    .option('-c, --config <path>', 'Alternative configuration file path')
    .action(async (options: { date?: string; config?: string }) => {
      const targetDate = options.date ?? getCurrentDateString()

      // Resolve configuration paths using shared configuration logic
      // Requirement 7.1: Read district configuration from the same source as the Backend
      // Requirement 7.2: Use the same cache directory configuration as the Backend
      const resolvedConfig = resolveConfiguration({
        configPath: options.config,
      })
      const { cacheDir, districtConfigPath } = resolvedConfig

      // Create orchestrator
      const orchestrator = new CollectorOrchestrator({
        cacheDir,
        districtConfigPath,
        timeout: 30,
        verbose: false,
      })

      try {
        const status = await orchestrator.getCacheStatus(targetDate)

        // Output status as JSON
        const output = {
          timestamp: new Date().toISOString(),
          date: targetDate,
          cached: status.cachedDistricts.length,
          missing: status.missingDistricts.length,
          cachedDistricts: status.cachedDistricts,
          missingDistricts: status.missingDistricts,
        }

        console.log(JSON.stringify(output, null, 2))
        process.exit(ExitCode.SUCCESS)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error(`Error: ${errorMessage}`)
        process.exit(ExitCode.COMPLETE_FAILURE)
      }
    })

  // Add transform command for converting raw CSV files to snapshots
  // Requirement 2.1: THE Collector_CLI SHALL provide a `transform` command
  program
    .command('transform')
    .description('Transform raw CSV files into snapshot format')
    .option(
      '-d, --date <YYYY-MM-DD>',
      'Target date for transformation (default: today)',
      (value: string) => {
        if (!validateDateFormat(value)) {
          console.error(
            `Error: Invalid date format "${value}". Use YYYY-MM-DD.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return value
      }
    )
    .option(
      '--districts <list>',
      'Comma-separated district IDs to transform',
      parseDistrictList
    )
    .option('-f, --force', 'Force re-transform even if snapshots exist', false)
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .option('-c, --config <path>', 'Alternative configuration file path')
    .action(async (options: TransformOptions) => {
      // Use current date if not specified
      const targetDate = options.date ?? getCurrentDateString()
      // Districts is parsed by parseDistrictList which returns string[]
      const districts = options.districts as string[] | undefined

      // Resolve configuration paths using shared configuration logic
      const resolvedConfig = resolveConfiguration({
        configPath: options.config,
      })
      const { cacheDir } = resolvedConfig

      // Snapshot directory follows the pattern: CACHE_DIR/snapshots/{date}/
      const snapshotDir = `${cacheDir}/snapshots/${targetDate}`

      if (options.verbose) {
        console.error(`[INFO] Starting transform for date: ${targetDate}`)
        if (districts) {
          console.error(`[INFO] Districts: ${districts.join(', ')}`)
        } else {
          console.error('[INFO] Districts: all available')
        }
        console.error(`[INFO] Force: ${options.force}`)
        console.error(`[INFO] Cache directory: ${cacheDir}`)
        console.error(`[INFO] Snapshot directory: ${snapshotDir}`)
        console.error(`[INFO] Config source: ${resolvedConfig.source}`)
      }

      // Create TransformService with optional verbose logger
      // Requirement 2.2: Use the same DataTransformationService logic as the Backend
      const transformService = new TransformService({
        cacheDir,
        logger: createVerboseLogger(options.verbose),
      })

      // Execute transformation
      // Requirement 2.3: Store snapshots in CACHE_DIR/snapshots/{date}/
      // Requirement 2.4: Write district JSON files, metadata.json, and manifest.json
      const transformResult = await transformService.transform({
        date: targetDate,
        districts,
        force: options.force,
        verbose: options.verbose,
      })

      // Convert TransformOperationResult to TransformResult for CLI output
      const result: TransformResult = {
        success: transformResult.success,
        date: transformResult.date,
        districtsProcessed: transformResult.districtsProcessed,
        districtsSucceeded: transformResult.districtsSucceeded,
        districtsFailed: transformResult.districtsFailed,
        districtsSkipped: transformResult.districtsSkipped,
        snapshotLocations: transformResult.snapshotLocations,
        errors: transformResult.errors,
        duration_ms: transformResult.duration_ms,
      }

      // Format and output JSON summary
      const summary = formatTransformSummary(result, snapshotDir)
      console.log(JSON.stringify(summary, null, 2))

      // Determine and use exit code
      const exitCode = determineTransformExitCode(result)

      if (options.verbose) {
        console.error(`[INFO] Transform completed with exit code: ${exitCode}`)
      }

      process.exit(exitCode)
    })

  // Add compute-analytics command for computing analytics from existing snapshots
  // Requirement 8.1: THE Collector_CLI SHALL provide a `compute-analytics` command
  // Requirement 8.2: WHEN the `compute-analytics` command is invoked with a date
  // Requirement 8.3: THE `compute-analytics` command SHALL support a `--districts` option
  program
    .command('compute-analytics')
    .description('Compute analytics for existing snapshots')
    .option(
      '-d, --date <YYYY-MM-DD>',
      'Target date for analytics computation (default: today)',
      (value: string) => {
        if (!validateDateFormat(value)) {
          console.error(
            `Error: Invalid date format "${value}". Use YYYY-MM-DD.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return value
      }
    )
    .option(
      '--districts <list>',
      'Comma-separated district IDs to compute analytics for',
      parseDistrictList
    )
    .option(
      '--force-analytics',
      'Force re-compute even if analytics exist',
      false
    )
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .option('-c, --config <path>', 'Alternative configuration file path')
    .action(async (options: ComputeAnalyticsOptions) => {
      // Use current date if not specified
      const targetDate = options.date ?? getCurrentDateString()
      // Districts is parsed by parseDistrictList which returns string[]
      const districts = options.districts as string[] | undefined

      // Resolve configuration paths using shared configuration logic
      const resolvedConfig = resolveConfiguration({
        configPath: options.config,
      })
      const { cacheDir } = resolvedConfig

      // Analytics directory follows the pattern: CACHE_DIR/snapshots/{date}/analytics/
      const analyticsDir = `${cacheDir}/snapshots/${targetDate}/analytics`

      if (options.verbose) {
        console.error(
          `[INFO] Starting compute-analytics for date: ${targetDate}`
        )
        if (districts) {
          console.error(`[INFO] Districts: ${districts.join(', ')}`)
        } else {
          console.error('[INFO] Districts: all available')
        }
        console.error(`[INFO] Force analytics: ${options.forceAnalytics}`)
        console.error(`[INFO] Cache directory: ${cacheDir}`)
        console.error(`[INFO] Analytics directory: ${analyticsDir}`)
        console.error(`[INFO] Config source: ${resolvedConfig.source}`)
      }

      // Create AnalyticsComputeService with optional verbose logger
      // Requirement 1.2: Compute analytics using the same algorithms as the Analytics_Engine
      // Requirement 1.3: Generate membership trends, club health scores, etc.
      const analyticsComputeService = new AnalyticsComputeService({
        cacheDir,
        logger: createVerboseLogger(options.verbose),
      })

      // Execute analytics computation
      const computeResult = await analyticsComputeService.compute({
        date: targetDate,
        districts,
        force: options.forceAnalytics,
        verbose: options.verbose,
      })

      // Convert ComputeOperationResult to ComputeAnalyticsResult for CLI output
      // Requirement 8.2: Include actual snapshot date and closing period info
      const result: ComputeAnalyticsResult = {
        success: computeResult.success,
        date: computeResult.date,
        requestedDate: computeResult.requestedDate,
        isClosingPeriod: computeResult.isClosingPeriod,
        dataMonth: computeResult.dataMonth,
        districtsProcessed: computeResult.districtsProcessed,
        districtsSucceeded: computeResult.districtsSucceeded,
        districtsFailed: computeResult.districtsFailed,
        districtsSkipped: computeResult.districtsSkipped,
        analyticsLocations: computeResult.analyticsLocations,
        errors: computeResult.errors,
        duration_ms: computeResult.duration_ms,
      }

      // Format and output JSON summary
      // Requirement 8.4: THE `compute-analytics` command SHALL output a JSON summary
      const summary = formatComputeAnalyticsSummary(result, analyticsDir)
      console.log(JSON.stringify(summary, null, 2))

      // Determine and use exit code
      const exitCode = determineComputeAnalyticsExitCode(result)

      if (options.verbose) {
        console.error(
          `[INFO] Compute-analytics completed with exit code: ${exitCode}`
        )
      }

      process.exit(exitCode)
    })

  // Add upload command for syncing local snapshots and analytics to Google Cloud Storage
  // Requirement 6.1: THE Collector_CLI SHALL provide an `upload` command to sync local snapshots and analytics to Google Cloud Storage
  program
    .command('upload')
    .description('Upload snapshots and analytics to Google Cloud Storage')
    .option(
      '-d, --date <YYYY-MM-DD>',
      'Target date for upload (default: all available dates)',
      (value: string) => {
        if (!validateDateFormat(value)) {
          console.error(
            `Error: Invalid date format "${value}". Use YYYY-MM-DD.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return value
      }
    )
    .option(
      '-i, --incremental',
      'Only upload files that have changed (compare checksums)',
      false
    )
    .option(
      '--dry-run',
      'Show what would be uploaded without actually uploading',
      false
    )
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .option('-c, --config <path>', 'Alternative configuration file path')
    .option(
      '--since <YYYY-MM-DD>',
      'Only upload snapshot dates on or after this date (inclusive)',
      (value: string) => {
        if (!validateDateFormat(value)) {
          console.error(
            `Error: Invalid date format "${value}" for --since. Use YYYY-MM-DD.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return value
      }
    )
    .option(
      '--until <YYYY-MM-DD>',
      'Only upload snapshot dates on or before this date (inclusive)',
      (value: string) => {
        if (!validateDateFormat(value)) {
          console.error(
            `Error: Invalid date format "${value}" for --until. Use YYYY-MM-DD.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return value
      }
    )
    .option(
      '--concurrency <number>',
      'Maximum number of concurrent GCS uploads (default: 10)',
      (value: string) => {
        const num = Number(value)
        if (!Number.isInteger(num) || num < 1) {
          console.error(
            `Error: Invalid concurrency value "${value}". Must be a positive integer.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return num
      }
    )
    .action(async (options: UploadOptions) => {
      // Validate mutual exclusivity: --date with --since/--until
      if (
        options.date &&
        (options.since !== undefined || options.until !== undefined)
      ) {
        console.error(
          'Error: --date cannot be used together with --since or --until. Use either --date for a single date or --since/--until for a range.'
        )
        process.exit(ExitCode.COMPLETE_FAILURE)
      }

      // Validate --since <= --until
      if (
        options.since !== undefined &&
        options.until !== undefined &&
        options.since > options.until
      ) {
        console.error(
          `Error: --since "${options.since}" is after --until "${options.until}". The start date must be on or before the end date.`
        )
        process.exit(ExitCode.COMPLETE_FAILURE)
      }

      // Date is optional - if not specified, upload all available dates
      const targetDate = options.date

      // Resolve configuration paths using shared configuration logic
      const resolvedConfig = resolveConfiguration({
        configPath: options.config,
      })
      const { cacheDir } = resolvedConfig

      // Get bucket and prefix from environment variables
      const bucket = process.env['GCS_BUCKET'] ?? 'toast-stats-data-ca'
      const prefix = process.env['GCS_PREFIX'] ?? 'snapshots'
      const projectId = process.env['GCP_PROJECT_ID']

      if (options.verbose) {
        console.error(
          `[INFO] Starting upload${targetDate ? ` for date: ${targetDate}` : ' for all available dates'}`
        )
        console.error(`[INFO] Incremental: ${options.incremental}`)
        console.error(`[INFO] Dry run: ${options.dryRun}`)
        console.error(`[INFO] Cache directory: ${cacheDir}`)
        console.error(`[INFO] Destination bucket: ${bucket}`)
        console.error(`[INFO] Destination prefix: ${prefix}`)
        console.error(`[INFO] Config source: ${resolvedConfig.source}`)
        if (projectId) {
          console.error(`[INFO] GCP Project ID: ${projectId}`)
        }
      }

      // Create UploadService with optional verbose logger
      // Requirement 6.1: THE Collector_CLI SHALL provide an `upload` command to sync local snapshots and analytics to Google Cloud Storage
      // Requirement 6.2: WHEN uploading, THE Collector_CLI SHALL upload both snapshot data and pre-computed analytics files
      // Requirement 6.3: THE Collector_CLI SHALL support incremental uploads, only uploading files that have changed
      const uploadService = new UploadService({
        cacheDir,
        bucket,
        prefix,
        projectId,
        logger: createVerboseLogger(options.verbose),
      })

      // Execute upload operation
      // Requirement 6.4: IF upload fails for any file, THEN THE Collector_CLI SHALL report the failure and continue with remaining files
      const result = await uploadService.upload({
        date: targetDate,
        since: options.since,
        until: options.until,
        incremental: options.incremental,
        dryRun: options.dryRun,
        verbose: options.verbose,
        concurrency: options.concurrency,
      })

      // ── Update district-snapshot index ─────────────────────────────────
      // After upload completes, update the index with district-date mappings.
      // This is non-fatal: if it fails the upload result is still reported.
      if (
        result.success &&
        !options.dryRun &&
        result.filesUploaded.length > 0
      ) {
        try {
          // Extract unique (date, districtId) pairs from uploaded files
          // Pattern: prefix/{date}/district_{id}.json
          const districtPattern = /district_(\w+)\.json$/
          const dateDistrictMap = new Map<string, Set<string>>()

          for (const filePath of result.filesUploaded) {
            const match = districtPattern.exec(filePath)
            if (match?.[1]) {
              // Extract date from path: prefix/{date}/...
              const parts = filePath.split('/')
              const dateIndex = parts.findIndex(p =>
                /^\d{4}-\d{2}-\d{2}$/.test(p)
              )
              if (dateIndex >= 0) {
                const date = parts[dateIndex]!
                const existing = dateDistrictMap.get(date) ?? new Set<string>()
                existing.add(match[1])
                dateDistrictMap.set(date, existing)
              }
            }
          }

          if (dateDistrictMap.size > 0) {
            // Create GCS-backed index storage using the same bucket
            const { Storage } = await import('@google-cloud/storage')
            const gcsStorage = new Storage({ projectId })
            const gcsBucket = gcsStorage.bucket(bucket)

            const indexStorage: IndexStorage = {
              async readIndex(): Promise<DistrictSnapshotIndex | null> {
                const file = gcsBucket.file(
                  'config/district-snapshot-index.json'
                )
                const [exists] = await file.exists()
                if (!exists) return null
                const [buffer] = await file.download()
                return JSON.parse(
                  buffer.toString('utf-8')
                ) as DistrictSnapshotIndex
              },
              async writeIndex(index: DistrictSnapshotIndex): Promise<void> {
                const file = gcsBucket.file(
                  'config/district-snapshot-index.json'
                )
                await file.save(JSON.stringify(index, null, 2), {
                  contentType: 'application/json',
                })
              },
            }

            const indexWriter = new DistrictSnapshotIndexWriter(indexStorage)

            for (const [date, districtIds] of dateDistrictMap) {
              await indexWriter.updateIndex(date, [...districtIds])
            }

            if (options.verbose) {
              console.error(
                `[INFO] Updated district-snapshot index for ${dateDistrictMap.size} date(s)`
              )
            }
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error'
          if (options.verbose) {
            console.error(
              `[WARN] Failed to update district-snapshot index: ${msg}`
            )
          }
          // Non-fatal: continue with summary output
        }
      }

      // Format and output JSON summary
      // Requirement 6.5: WHEN upload completes, THE Collector_CLI SHALL output a summary
      const summary = formatUploadSummary(
        result,
        bucket,
        prefix,
        options.dryRun
      )
      console.log(JSON.stringify(summary, null, 2))

      // Determine and use exit code
      const exitCode = determineUploadExitCode(result)

      if (options.verbose) {
        console.error(`[INFO] Upload completed with exit code: ${exitCode}`)
      }

      process.exit(exitCode)
    })

  // Add backfill command for historical data collection (#123)
  program
    .command('backfill')
    .description(
      'Backfill historical data for all districts via direct HTTP CSV downloads'
    )
    .option(
      '--start-year <YYYY>',
      'Start program year (e.g., 2017 for 2017-2018)',
      (value: string) => {
        const year = parseInt(value, 10)
        if (isNaN(year) || year < 2008 || year > 2030) {
          console.error(
            `Error: Invalid start year "${value}". Must be between 2008 and 2030.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return year
      }
    )
    .option(
      '--end-year <YYYY>',
      'End program year (e.g., 2024 for 2024-2025)',
      (value: string) => {
        const year = parseInt(value, 10)
        if (isNaN(year) || year < 2008 || year > 2030) {
          console.error(
            `Error: Invalid end year "${value}". Must be between 2008 and 2030.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return year
      }
    )
    .option(
      '--frequency <freq>',
      'Date sampling frequency: daily, weekly, biweekly, monthly (default: biweekly)',
      'biweekly'
    )
    .option(
      '--rate <number>',
      'Maximum requests per second (default: 2)',
      (value: string) => {
        const rate = parseFloat(value)
        if (isNaN(rate) || rate <= 0 || rate > 10) {
          console.error(
            `Error: Invalid rate "${value}". Must be between 0.1 and 10.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return rate
      },
      2
    )
    .option(
      '--phase <phase>',
      'Run only a specific phase: discover, collect, or all (default: all)',
      'all'
    )
    .option('--resume', 'Skip already-downloaded files', true)
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .option('-o, --output <dir>', 'Output directory for downloaded CSVs')
    .option(
      '--gcs-bucket <name>',
      'Write CSVs directly to a GCS bucket instead of local disk'
    )
    .option(
      '--gcs-prefix <prefix>',
      'GCS object key prefix (default: backfill)',
      'backfill'
    )
    .action(
      async (options: {
        startYear?: number
        endYear?: number
        frequency: string
        rate: number
        phase: string
        resume: boolean
        verbose: boolean
        output?: string
        gcsBucket?: string
        gcsPrefix: string
      }) => {
        const { BackfillOrchestrator, GcsBackfillStorage } =
          await import('./services/BackfillOrchestrator.js')
        type DateFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

        const startYear = options.startYear ?? 2017
        const endYear = options.endYear ?? new Date().getFullYear()
        const frequency = options.frequency as DateFrequency

        // Determine storage backend
        let storage:
          | import('./services/BackfillOrchestrator.js').BackfillStorage
          | undefined
        let outputDir: string

        if (options.gcsBucket) {
          console.error(
            `[INFO] Using GCS storage: gs://${options.gcsBucket}/${options.gcsPrefix}/`
          )
          storage = await GcsBackfillStorage.create(
            options.gcsBucket,
            process.env['GCP_PROJECT_ID']
          )
          outputDir = options.gcsPrefix
        } else {
          outputDir = options.output ?? resolveConfiguration({}).cacheDir
        }

        if (options.verbose) {
          console.error(`[INFO] Starting backfill`)
          console.error(
            `[INFO] Program years: ${startYear}-${startYear + 1} to ${endYear}-${endYear + 1}`
          )
          console.error(`[INFO] Frequency: ${frequency}`)
          console.error(`[INFO] Rate: ${options.rate} req/s`)
          console.error(`[INFO] Phase: ${options.phase}`)
          console.error(`[INFO] Resume: ${options.resume}`)
          console.error(
            `[INFO] Storage: ${options.gcsBucket ? `GCS (gs://${options.gcsBucket})` : `local (${outputDir})`}`
          )
        }

        const orchestrator = new BackfillOrchestrator({
          startYear,
          endYear,
          frequency,
          ratePerSecond: options.rate,
          outputDir,
          phase: options.phase as 'discover' | 'collect' | 'all',
          resume: options.resume,
          storage,
        })

        // Show scope before starting
        const scope = orchestrator.calculateScope()
        const estimate = orchestrator.estimateTime(
          scope.phase1Requests,
          options.rate
        )

        console.error(`[SCOPE] Program years: ${scope.programYears.length}`)
        console.error(`[SCOPE] Dates per year: ${scope.datesPerYear}`)
        console.error(`[SCOPE] Phase 1 requests: ${scope.phase1Requests}`)
        console.error(`[SCOPE] Phase 1 estimate: ${estimate.humanReadable}`)
        console.error(
          `[SCOPE] Phase 2 requests per district: ${scope.requestsPerDistrict}`
        )

        try {
          await orchestrator.run()
          console.error('[DONE] Backfill complete')
          process.exit(ExitCode.SUCCESS)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          console.error(`[ERROR] Backfill failed: ${errorMessage}`)
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
      }
    )

  // Add rebuild command for regenerating all derived data (#181)
  program
    .command('rebuild')
    .description(
      'Rebuild all derived data (snapshots, analytics, time-series, club-trends, CDN manifests) from raw-csv'
    )
    .option(
      '--dates <list>',
      'Comma-separated dates to rebuild (default: all dates in raw-csv/)',
      (value: string) =>
        value
          .split(',')
          .map(d => d.trim())
          .filter(Boolean)
    )
    .option(
      '--clean-snapshots',
      'Delete snapshot dirs between dates to save disk (keeps time-series/club-trends)',
      false
    )
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .option('-c, --config <path>', 'Alternative configuration file path')
    .action(
      async (options: {
        dates?: string[]
        cleanSnapshots: boolean
        verbose: boolean
        config?: string
      }) => {
        const { RebuildService } = await import('./services/RebuildService.js')

        const resolvedConfig = resolveConfiguration({
          configPath: options.config,
        })
        const { cacheDir } = resolvedConfig

        if (options.verbose) {
          console.error(`[INFO] Cache directory: ${cacheDir}`)
          console.error(
            `[INFO] Clean snapshots between dates: ${options.cleanSnapshots}`
          )
          if (options.dates) {
            console.error(`[INFO] Specific dates: ${options.dates.join(', ')}`)
          }
        }

        const service = new RebuildService({
          cacheDir,
          logger: createVerboseLogger(options.verbose),
        })

        const dates = options.dates ?? (await service.discoverDates())
        console.error(
          `[INFO] Rebuild starting: ${dates.length} dates to process`
        )

        const result = await service.rebuild({
          cacheDir,
          dates,
          cleanSnapshots: options.cleanSnapshots,
        })

        // Output JSON summary
        console.log(JSON.stringify(result, null, 2))

        if (options.verbose) {
          console.error(
            `[INFO] Rebuild complete: ${result.datesSucceeded}/${result.datesProcessed} succeeded in ${result.duration_ms}ms`
          )
        }

        process.exit(
          result.success ? ExitCode.SUCCESS : ExitCode.PARTIAL_FAILURE
        )
      }
    )

  // Add prune command for removing non-month-end data (#181)
  program
    .command('prune')
    .description(
      'Remove non-month-end raw-csv and derived data, respecting closing period date mapping'
    )
    .option(
      '--dry-run',
      'Only classify and report; do not actually delete',
      false
    )
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .option('-c, --config <path>', 'Alternative configuration file path')
    .action(
      async (options: {
        dryRun: boolean
        verbose: boolean
        config?: string
      }) => {
        const { PruneService } = await import('./services/PruneService.js')

        const resolvedConfig = resolveConfiguration({
          configPath: options.config,
        })
        const { cacheDir } = resolvedConfig

        if (options.verbose) {
          console.error(`[INFO] Cache directory: ${cacheDir}`)
          console.error(`[INFO] Dry run: ${options.dryRun}`)
        }

        const service = new PruneService({
          cacheDir,
          logger: createVerboseLogger(options.verbose),
        })

        const result = await service.prune(options.dryRun)

        // Output JSON summary
        console.log(
          JSON.stringify(
            {
              dryRun: options.dryRun,
              totalDates: result.totalDates,
              keptDates: result.keptDates,
              prunedDates: result.prunedDates,
              deletedRawCsv: result.deletedRawCsv,
              deletedSnapshots: result.deletedSnapshots,
              errors: result.errors,
              classifications: result.classifications.map(c => ({
                rawCsvDate: c.rawCsvDate,
                snapshotDate: c.snapshotDate,
                keep: c.keep,
                reason: c.reason,
              })),
              duration_ms: result.duration_ms,
            },
            null,
            2
          )
        )

        if (options.verbose) {
          console.error(
            `[INFO] Prune complete: kept ${result.keptDates}, pruned ${result.prunedDates}`
          )
        }

        process.exit(
          result.success ? ExitCode.SUCCESS : ExitCode.PARTIAL_FAILURE
        )
      }
    )

  // Find-A-Club enrichment fetch (#430). Hits the public TI
  // Find-A-Club Search endpoint per-district, writes raw JSON to
  // <cacheDir>/find-a-club/<date>/district_<id>.json. Pipeline
  // integration (snapshot merge + GCS upload) is a deliberate
  // follow-up; this command is the foundational data acquisition.
  program
    .command('fetch-find-a-club')
    .description(
      'Fetch per-district club enrichment from the public TI Find-A-Club Search endpoint (#430)'
    )
    .option(
      '-d, --date <YYYY-MM-DD>',
      'Output date subdirectory (default: today)',
      (value: string) => {
        if (!validateDateFormat(value)) {
          console.error(
            `Error: Invalid date format "${value}". Use YYYY-MM-DD.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return value
      }
    )
    .option(
      '--districts <list>',
      'Comma-separated district IDs to fetch (default: read from config)',
      parseDistrictList
    )
    .option(
      '--include-undistricted',
      'Also fetch the U (Undistricted) bucket',
      false
    )
    .option(
      '--rate-ms <ms>',
      'Min ms between requests (default 1100 ≈ 0.9 req/sec)',
      (value: string) => parseInt(value, 10),
      1100
    )
    .option(
      '--compare-snapshot-dir <dir>',
      'For each district, also count clubPerformance entries in ' +
        '<dir>/district_<id>.json and report the FAC-vs-snapshot diff. ' +
        'Extra FAC entries are typically ATO/prospective clubs not yet ' +
        'in the dashboard.'
    )
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .option('-c, --config <path>', 'Alternative configuration file path')
    .action(
      async (options: {
        date?: string
        districts?: string[]
        includeUndistricted: boolean
        rateMs: number
        compareSnapshotDir?: string
        verbose: boolean
        config?: string
      }) => {
        const { FindAClubService } =
          await import('./services/FindAClubService.js')
        const { writeFile, mkdir, readFile } = await import('fs/promises')
        const { join } = await import('path')

        // Helper: count clubs in a snapshot file. Returns null if the
        // file is missing or shape doesn't match.
        const countSnapshotClubs = async (
          districtId: string
        ): Promise<number | null> => {
          if (!options.compareSnapshotDir) return null
          try {
            const path = join(
              options.compareSnapshotDir,
              `district_${districtId}.json`
            )
            const raw = JSON.parse(await readFile(path, 'utf-8')) as {
              data?: { clubPerformance?: unknown[] }
            }
            const cp = raw?.data?.clubPerformance
            return Array.isArray(cp) ? cp.length : null
          } catch {
            return null
          }
        }

        const targetDate = options.date ?? getCurrentDateString()
        const resolvedConfig = resolveConfiguration({
          configPath: options.config,
        })
        const { cacheDir, districtConfigPath } = resolvedConfig

        let districts: string[]
        if (options.districts && options.districts.length > 0) {
          districts = options.districts
        } else {
          const districtsConfig = JSON.parse(
            await readFile(districtConfigPath, 'utf-8')
          ) as { districts: Array<{ id: string }> }
          districts = districtsConfig.districts.map(d => d.id)
        }
        if (options.includeUndistricted) districts.push('U')

        if (options.verbose) {
          console.error(`[INFO] Fetching ${districts.length} districts`)
          console.error(`[INFO] Date: ${targetDate}`)
          console.error(`[INFO] Rate limit: ${options.rateMs}ms between reqs`)
          console.error(`[INFO] Cache: ${cacheDir}`)
        }

        const service = new FindAClubService({
          requestIntervalMs: options.rateMs,
        })

        const outDir = join(cacheDir, 'find-a-club', targetDate)
        await mkdir(outDir, { recursive: true })

        const results: Array<{
          districtId: string
          clubCount: number
          ok: boolean
          error?: string
          snapshotClubCount?: number | null
          extraInFac?: number | null
        }> = []

        for (const districtId of districts) {
          try {
            const { rawJson, clubs } = await service.fetchDistrict(districtId)
            const fileName = `district_${districtId}.json`
            await writeFile(
              join(outDir, fileName),
              JSON.stringify(rawJson, null, 2),
              'utf-8'
            )
            const snapshotClubCount = await countSnapshotClubs(districtId)
            const extraInFac =
              snapshotClubCount === null
                ? null
                : clubs.length - snapshotClubCount
            results.push({
              districtId,
              clubCount: clubs.length,
              ok: true,
              ...(snapshotClubCount !== null && { snapshotClubCount }),
              ...(extraInFac !== null && { extraInFac }),
            })
            if (options.verbose) {
              const diff =
                extraInFac !== null && snapshotClubCount !== null
                  ? ` (snapshot=${snapshotClubCount}, extra=${extraInFac >= 0 ? '+' : ''}${extraInFac})`
                  : ''
              console.error(
                `[INFO] district ${districtId}: ${clubs.length} clubs${diff} → ${fileName}`
              )
            }
          } catch (err) {
            // Per-district try/catch: one failure doesn't fail the run.
            const message = err instanceof Error ? err.message : String(err)
            results.push({
              districtId,
              clubCount: 0,
              ok: false,
              error: message,
            })
            if (options.verbose) {
              console.error(`[ERROR] district ${districtId}: ${message}`)
            }
          }
        }

        const succeeded = results.filter(r => r.ok)
        const withCompare = results.filter(
          r => typeof r.extraInFac === 'number'
        )
        const summary = {
          date: targetDate,
          outDir,
          totalDistricts: results.length,
          succeeded: succeeded.length,
          failed: results.filter(r => !r.ok).length,
          totalClubs: results.reduce((sum, r) => sum + r.clubCount, 0),
          // FAC-vs-snapshot diff aggregate (only when --compare-snapshot-dir
          // was supplied). extraInFac > 0 means FAC has clubs the dashboard
          // doesn't — typically ATO/prospective clubs.
          compare:
            withCompare.length > 0
              ? {
                  districtsCompared: withCompare.length,
                  totalSnapshotClubs: withCompare.reduce(
                    (sum, r) => sum + (r.snapshotClubCount ?? 0),
                    0
                  ),
                  totalExtraInFac: withCompare.reduce(
                    (sum, r) => sum + (r.extraInFac ?? 0),
                    0
                  ),
                }
              : undefined,
          results,
        }
        console.log(JSON.stringify(summary, null, 2))

        process.exit(
          summary.failed === 0 ? ExitCode.SUCCESS : ExitCode.PARTIAL_FAILURE
        )
      }
    )

  // Merge previously-fetched FAC raw JSON into district snapshots
  // (#429 follow-up). Reads <fac-dir>/district_<id>.json + the
  // corresponding <snapshot-dir>/district_<id>.json, applies the
  // left-outer-join semantics from FindAClubMerger, writes the
  // enriched snapshot back to <snapshot-dir>. Idempotent.
  program
    .command('merge-find-a-club')
    .description(
      'Merge previously-fetched Find-A-Club JSON into district snapshots (#429)'
    )
    .requiredOption(
      '--fac-dir <dir>',
      'Directory containing district_<id>.json files from fetch-find-a-club'
    )
    .requiredOption(
      '--snapshot-dir <dir>',
      'Directory containing district snapshot files (target — rewritten in-place)'
    )
    .option(
      '--districts <list>',
      'Comma-separated district IDs to merge (default: every district that has both a FAC file and a snapshot file)',
      parseDistrictList
    )
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .action(
      async (options: {
        facDir: string
        snapshotDir: string
        districts?: string[]
        verbose: boolean
      }) => {
        const { mergeFacIntoSnapshot } =
          await import('./services/FindAClubMerger.js')
        const { readFile, writeFile, readdir } = await import('fs/promises')
        const { join } = await import('path')

        // Discover districts when not specified: intersection of FAC
        // and snapshot files.
        let districts = options.districts ?? []
        if (districts.length === 0) {
          const FILE_PATTERN = /^district_(.+)\.json$/
          const facFiles = (await readdir(options.facDir).catch(() => []))
            .map(f => FILE_PATTERN.exec(f)?.[1])
            .filter((id): id is string => Boolean(id))
          const snapshotFiles = new Set(
            (await readdir(options.snapshotDir).catch(() => []))
              .map(f => FILE_PATTERN.exec(f)?.[1])
              .filter((id): id is string => Boolean(id))
          )
          districts = facFiles.filter(id => snapshotFiles.has(id)).sort()
        }

        const results: Array<{
          districtId: string
          ok: boolean
          matched?: number
          snapshotOnly?: number
          facOnly?: number
          error?: string
        }> = []

        for (const districtId of districts) {
          try {
            const facPath = join(options.facDir, `district_${districtId}.json`)
            const snapshotPath = join(
              options.snapshotDir,
              `district_${districtId}.json`
            )
            const facRaw = JSON.parse(await readFile(facPath, 'utf-8'))
            const snapshot = JSON.parse(await readFile(snapshotPath, 'utf-8'))
            const result = mergeFacIntoSnapshot(snapshot, facRaw)
            await writeFile(
              snapshotPath,
              JSON.stringify(result.snapshot, null, 2),
              'utf-8'
            )
            results.push({
              districtId,
              ok: true,
              matched: result.matched,
              snapshotOnly: result.snapshotOnly,
              facOnly: result.facOnly,
            })
            if (options.verbose) {
              console.error(
                `[INFO] district ${districtId}: matched=${result.matched}, snapshot-only=${result.snapshotOnly}, fac-only=${result.facOnly}`
              )
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            results.push({ districtId, ok: false, error: message })
            if (options.verbose) {
              console.error(`[ERROR] district ${districtId}: ${message}`)
            }
          }
        }

        const summary = {
          totalDistricts: results.length,
          succeeded: results.filter(r => r.ok).length,
          failed: results.filter(r => !r.ok).length,
          totalMatched: results.reduce((s, r) => s + (r.matched ?? 0), 0),
          totalSnapshotOnly: results.reduce(
            (s, r) => s + (r.snapshotOnly ?? 0),
            0
          ),
          totalFacOnly: results.reduce((s, r) => s + (r.facOnly ?? 0), 0),
          results,
        }
        console.log(JSON.stringify(summary, null, 2))

        process.exit(
          summary.failed === 0 ? ExitCode.SUCCESS : ExitCode.PARTIAL_FAILURE
        )
      }
    )

  // Value-aware staging→production diff for the full-range re-derive promote
  // gate (#1034, epic #1031). Complements the count-only gate in
  // data-pipeline.yml: detects re-derived VALUE changes the count gate is blind
  // to, and blocks promotion until an operator reviews them. Fail-closed.
  program
    .command('value-diff')
    .description(
      'Compare staging vs production snapshot values and decide if promotion is safe (#1034)'
    )
    .requiredOption(
      '--staging-dir <dir>',
      'Directory of staging snapshots ({dir}/{date}/all-districts-rankings.json)'
    )
    .requiredOption(
      '--prod-dir <dir>',
      'Directory of production snapshots (same layout)'
    )
    .option(
      '--allow-value-changes',
      'Operator override: promote re-derived value changes after reviewing the diff',
      false
    )
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .action(
      async (options: {
        stagingDir: string
        prodDir: string
        allowValueChanges: boolean
        verbose: boolean
      }) => {
        const { runValueDiff } =
          await import('./services/SnapshotValueDiffLoader.js')

        let result
        try {
          result = runValueDiff({
            stagingDir: options.stagingDir,
            prodDir: options.prodDir,
            allowValueChanges: options.allowValueChanges,
          })
        } catch (err) {
          // Fail-closed: if we cannot read/compare the snapshots, do NOT promote.
          const message = err instanceof Error ? err.message : String(err)
          console.error(`[ERROR] value-diff failed: ${message}`)
          console.log(
            JSON.stringify(
              {
                promote: false,
                requiresReview: true,
                reasons: [`value-diff failed: ${message}`],
              },
              null,
              2
            )
          )
          process.exit(ExitCode.PARTIAL_FAILURE)
        }

        const { report, decision } = result
        if (options.verbose) {
          console.error(
            `[INFO] overlap=${report.overlap} added=${report.added.length} removed=${report.removed.length} changed=${report.changed.length} unchanged=${report.unchanged.length}`
          )
          for (const reason of decision.reasons) {
            console.error(`[INFO] ${reason}`)
          }
        }

        // Structured JSON to stdout (R4: logs to stderr only).
        console.log(JSON.stringify({ ...decision, report }, null, 2))

        // result.exitCode is the single source of truth (0 promote / 1 blocked).
        process.exit(result.exitCode)
      }
    )

  // Fetch the in-scope TM District "Daily Reports" per district and persist the
  // de-identified dataset to snapshots/{date}/district_{id}_reports.json (epic
  // #1062, Sprint 3 #1065). Separate, additive file — never mutates the base
  // snapshot. Personal columns are dropped at parse time (hard privacy rule).
  program
    .command('fetch-daily-reports')
    .description(
      'Fetch the in-scope TM District Daily Reports per district and write the ' +
        'de-identified dataset (epic #1062)'
    )
    .option(
      '-d, --date <YYYY-MM-DD>',
      'Snapshot date subdirectory (default: today)',
      (value: string) => {
        if (!validateDateFormat(value)) {
          console.error(
            `Error: Invalid date format "${value}". Use YYYY-MM-DD.`
          )
          process.exit(ExitCode.COMPLETE_FAILURE)
        }
        return value
      }
    )
    .option(
      '--districts <list>',
      'Comma-separated district IDs (default: read from config)',
      parseDistrictList
    )
    .option(
      '--program-year <YYYY-YYYY>',
      'Program year (default: derived from --date)'
    )
    .option(
      '--rate-ms <ms>',
      'Min ms between report requests (default 1100 ≈ 0.9 req/sec)',
      (value: string) => parseInt(value, 10),
      1100
    )
    .option('-v, --verbose', 'Enable detailed logging output', false)
    .option('-c, --config <path>', 'Alternative configuration file path')
    .action(
      async (options: {
        date?: string
        districts?: string[]
        programYear?: string
        rateMs: number
        verbose: boolean
        config?: string
      }) => {
        const { DailyReportFetcher, ingestDistrictReports } =
          await import('./services/index.js')
        const { calculateProgramYear } = await import('./utils/CachePaths.js')
        const { readFile } = await import('fs/promises')

        const targetDate = options.date ?? getCurrentDateString()
        const programYear =
          options.programYear ?? calculateProgramYear(targetDate)
        const { cacheDir, districtConfigPath } = resolveConfiguration({
          configPath: options.config,
        })

        let districts: string[]
        if (options.districts && options.districts.length > 0) {
          districts = options.districts
        } else {
          const districtsConfig = JSON.parse(
            await readFile(districtConfigPath, 'utf-8')
          ) as { districts: Array<{ id: string }> }
          districts = districtsConfig.districts.map(d => d.id)
        }

        if (options.verbose) {
          console.error(`[INFO] Daily Reports: ${districts.length} districts`)
          console.error(`[INFO] Date: ${targetDate}, PY: ${programYear}`)
          console.error(`[INFO] Cache: ${cacheDir}`)
        }

        const fetcher = new DailyReportFetcher({
          requestIntervalMs: options.rateMs,
        })

        const results: Array<{
          districtId: string
          ok: boolean
          path?: string
          error?: string
        }> = []

        for (const districtId of districts) {
          try {
            const path = await ingestDistrictReports({
              cacheDir,
              date: targetDate,
              districtId,
              programYear,
              fetcher,
            })
            results.push({ districtId, ok: true, path })
            if (options.verbose) {
              console.error(`[INFO] district ${districtId} → ${path}`)
            }
          } catch (err) {
            // Per-district try/catch: one failure doesn't fail the whole run.
            const message = err instanceof Error ? err.message : String(err)
            results.push({ districtId, ok: false, error: message })
            if (options.verbose) {
              console.error(`[ERROR] district ${districtId}: ${message}`)
            }
          }
        }

        const summary = {
          date: targetDate,
          programYear,
          totalDistricts: results.length,
          succeeded: results.filter(r => r.ok).length,
          failed: results.filter(r => !r.ok).length,
          results,
        }
        // Structured JSON to stdout (R4: logs to stderr only).
        console.log(JSON.stringify(summary, null, 2))

        process.exit(
          summary.failed === 0 ? ExitCode.SUCCESS : ExitCode.PARTIAL_FAILURE
        )
      }
    )

  return program
}
