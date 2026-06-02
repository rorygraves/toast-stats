/**
 * DailyReportFetcher — fetch the in-scope District "Daily Reports" per district
 * over the anonymous report API (epic #1062, Sprint 3 #1065).
 *
 * Verified contract (spike #1063): anonymous GET, no auth/cookie, returns
 * rendered HTML (not JSON):
 *   GET https://www.toastmasters.org/api/sitecore/DistrictReports/GetDistrictReport
 *         ?tableID=<GUID>&district=<D>&year=<PY>&sortBy=
 *
 * `fetch` is injectable so units never touch the network. A single report's
 * failure is logged (stderr — R4) and skipped; it must not abort the rest of
 * the district. The returned `RawReport[]` is fed straight to
 * `buildDistrictReports`, which drops any out-of-scope GUID.
 */

import { logger } from '../utils/logger.js'
import {
  IN_SCOPE_REPORT_GUIDS,
  type RawReport,
} from './DistrictReportsBuilder.js'

const BASE_URL = 'https://www.toastmasters.org'
const REPORT_PATH = '/api/sitecore/DistrictReports/GetDistrictReport'

/** Same alphanumeric-only posture as the snapshot writers (path safety). */
const VALID_DISTRICT_ID_PATTERN = /^[A-Za-z0-9]+$/

/** Minimal subset of the WHATWG `fetch` response the fetcher needs. */
interface FetchResponseLike {
  ok: boolean
  status: number
  text(): Promise<string>
}
export type FetchLike = (
  url: string,
  init?: Record<string, unknown>
) => Promise<FetchResponseLike>

export interface DailyReportFetcherConfig {
  /** Defaults to the global `fetch`. */
  fetchImpl?: FetchLike
  /** Override the API origin (self-hosting / offline tests). */
  baseUrl?: string
  /** Retries per report on a failed/non-ok response. Default 2. */
  maxRetries?: number
  /** Backoff base (ms) between retries. Default 500. */
  backoffMs?: number
}

/** Build the verified anonymous report-API URL for one report + district. */
export function buildDistrictReportUrl(
  tableId: string,
  districtId: string,
  programYear: string,
  baseUrl: string = BASE_URL
): string {
  const params = new URLSearchParams({
    tableID: tableId,
    district: districtId,
    year: programYear,
    sortBy: '',
  })
  return `${baseUrl}${REPORT_PATH}?${params.toString()}`
}

export class DailyReportFetcher {
  private readonly fetchImpl: FetchLike
  private readonly baseUrl: string
  private readonly maxRetries: number
  private readonly backoffMs: number

  constructor(config: DailyReportFetcherConfig = {}) {
    this.fetchImpl = config.fetchImpl ?? (globalThis.fetch as FetchLike)
    this.baseUrl = config.baseUrl ?? BASE_URL
    this.maxRetries = config.maxRetries ?? 2
    this.backoffMs = config.backoffMs ?? 500
  }

  private validateDistrictId(districtId: string): void {
    if (
      typeof districtId !== 'string' ||
      !VALID_DISTRICT_ID_PATTERN.test(districtId)
    ) {
      throw new Error(
        `Invalid district ID: only alphanumeric characters allowed (got "${districtId}")`
      )
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /** Fetch a single report's HTML, with retry. Returns null on persistent failure. */
  private async fetchOne(
    tableId: string,
    districtId: string,
    programYear: string
  ): Promise<RawReport | null> {
    const url = buildDistrictReportUrl(
      tableId,
      districtId,
      programYear,
      this.baseUrl
    )
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await this.fetchImpl(url, {
          headers: { 'User-Agent': 'ToastStats-DailyReports/1.0' },
        })
        if (res.ok) return { tableId, html: await res.text() }
        logger.warn(
          `Daily report ${tableId} (district ${districtId}) returned HTTP ${res.status} (attempt ${attempt + 1}/${this.maxRetries + 1})`
        )
      } catch (error) {
        logger.warn(
          `Daily report ${tableId} (district ${districtId}) fetch error (attempt ${attempt + 1}/${this.maxRetries + 1})`,
          error
        )
      }
      if (attempt < this.maxRetries)
        await this.sleep(this.backoffMs * (attempt + 1))
    }
    logger.error(
      `Daily report ${tableId} (district ${districtId}) failed after ${this.maxRetries + 1} attempts — skipping`
    )
    return null
  }

  /**
   * Fetch every in-scope report for one district. Reports are fetched
   * sequentially (the source is rate-sensitive); a failed report is skipped.
   */
  async fetchDistrictReports(
    districtId: string,
    programYear: string
  ): Promise<RawReport[]> {
    this.validateDistrictId(districtId)
    const reports: RawReport[] = []
    for (const tableId of IN_SCOPE_REPORT_GUIDS) {
      const report = await this.fetchOne(tableId, districtId, programYear)
      if (report) reports.push(report)
    }
    return reports
  }
}
