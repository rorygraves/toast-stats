/**
 * ingestDistrictReports — the Sprint-3 "fetch step" wired end to end
 * (epic #1062, #1065): fetch the in-scope Daily Reports for one district, build
 * the de-identified dataset, and persist it to the SEPARATE
 * `snapshots/{date}/district_{id}_reports.json` file.
 *
 * This is the single composition point a CLI command / pipeline step calls. It
 * never touches the base snapshot (the read-time overlay is Sprint 4); the new
 * file is additive and auto-promotes through the ADR-002 staging gate.
 */

import { DailyReportFetcher } from './DailyReportFetcher.js'
import { buildDistrictReports } from './DistrictReportsBuilder.js'
import { writeDistrictReports } from './DistrictReportsWriter.js'

export interface IngestDistrictReportsOptions {
  cacheDir: string
  /** Snapshot date directory, `YYYY-MM-DD`. */
  date: string
  districtId: string
  programYear: string
  /** Injected so the unit/integration tests never touch the network. */
  fetcher: DailyReportFetcher
  /** ISO timestamp stamped on the dataset. Defaults to now. */
  generatedAt?: string
}

/**
 * Fetch → build → write a district's de-identified reports dataset.
 *
 * @returns the absolute path of the written dataset file.
 */
export async function ingestDistrictReports(
  options: IngestDistrictReportsOptions
): Promise<string> {
  const { cacheDir, date, districtId, programYear, fetcher } = options
  const generatedAt = options.generatedAt ?? new Date().toISOString()

  const reports = await fetcher.fetchDistrictReports(districtId, programYear)
  const dataset = buildDistrictReports({
    districtId,
    programYear,
    generatedAt,
    reports,
  })
  return writeDistrictReports(cacheDir, date, dataset)
}
