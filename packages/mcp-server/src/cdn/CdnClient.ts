/**
 * CdnClient — the thin, read-only access layer over the public Toast Stats
 * snapshot CDN (ADR-008 Sprint 1).
 *
 * It fetches pre-computed JSON, validates it with read-schemas (shared where a
 * write-contract exists, local for the CDN's own discovery/presentation files),
 * and returns the parsed fields alongside the source URL and snapshot date. It
 * performs NO computation, imports NO analytics-core, and never throws on a
 * missing/invalid response — it returns a typed not-available result instead.
 */
import type { ZodType } from 'zod'
import type { z } from 'zod'
import {
  AllDistrictsRankingsDataSchema,
  type AllDistrictsRankingsData,
  PerDistrictDataSchema,
  ProgramYearIndexFileSchema,
} from '@toastmasters/shared-contracts'
import {
  LatestManifestSchema,
  type LatestManifest,
  DatesIndexSchema,
  type DatesIndex,
  DistrictSnapshotIndexSchema,
  type DistrictSnapshotIndex,
  ClubIndexSchema,
  type ClubIndex,
} from '../schemas/cdn-discovery.schema.js'
import {
  CdnRankingsSchema,
  type CdnRankings,
} from '../schemas/cdn-rankings.schema.js'
import {
  ISO_DATE_RE,
  PROGRAM_YEAR_RE,
  DISTRICT_ID_RE,
} from '../schemas/common.js'

/** A dated per-district snapshot (`snapshots/{date}/district_{id}.json`). */
export type DistrictSnapshot = z.infer<typeof PerDistrictDataSchema>

/** A program-year time-series file (`time-series/district_{id}/{py}.json`). */
export type TimeSeriesProgramYear = z.infer<typeof ProgramYearIndexFileSchema>
import { type CdnReadResult, notAvailable } from './result.js'

/** Default public CDN origin (ADR-008). */
export const DEFAULT_CDN_BASE_URL = 'https://cdn.taverns.red'

export interface CdnClientOptions {
  /** CDN origin. Defaults to {@link DEFAULT_CDN_BASE_URL}. */
  baseUrl?: string
  /** Injectable fetch (for tests / custom transports). Defaults to global fetch. */
  fetchFn?: typeof fetch
}

/** A resolved club → district mapping. */
export interface ResolvedClub {
  clubId: string
  districtId: string
  clubName: string
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export class CdnClient {
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch

  constructor(options: CdnClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_CDN_BASE_URL).replace(/\/+$/, '')
    this.fetchFn = options.fetchFn ?? fetch
  }

  // ── Discovery / routing ────────────────────────────────────────────────

  /** `v1/latest.json` — the current snapshot date. */
  getLatestDate(): Promise<CdnReadResult<LatestManifest>> {
    return this.read(
      'v1/latest.json',
      LatestManifestSchema,
      d => d.latestSnapshotDate
    )
  }

  /** `v1/dates.json` — all available snapshot dates (date = the most recent). */
  listDates(): Promise<CdnReadResult<DatesIndex>> {
    return this.read('v1/dates.json', DatesIndexSchema, d =>
      d.dates.length > 0 ? d.dates[d.dates.length - 1]! : null
    )
  }

  /** `config/district-snapshot-index.json` — per-district available dates. */
  getDistrictSnapshotIndex(): Promise<CdnReadResult<DistrictSnapshotIndex>> {
    return this.read(
      'config/district-snapshot-index.json',
      DistrictSnapshotIndexSchema,
      () => null
    )
  }

  /** `config/club-index.json` — the full club → district index. */
  getClubIndex(): Promise<CdnReadResult<ClubIndex>> {
    return this.read(
      'config/club-index.json',
      ClubIndexSchema,
      d => d.snapshotDate ?? null
    )
  }

  /**
   * Resolve a single club id to its district via the club index. An unknown
   * club id is a typed not-available (the reader never guesses a district).
   *
   * Sprint 1 is a stateless thin reader: this fetches the full club index on
   * every call. Caching the index is deferred to the MCP-tool layer, where the
   * real call pattern (and TTL vs. snapshot freshness) is known.
   */
  async resolveClubDistrict(
    clubId: string
  ): Promise<CdnReadResult<ResolvedClub>> {
    const index = await this.getClubIndex()
    if (!index.available) return index
    const entry = index.data.clubs[clubId]
    if (!entry) {
      return notAvailable(
        index.sourceUrl,
        `not available — club ${clubId} is not in the club index`
      )
    }
    return {
      available: true,
      data: { clubId, districtId: entry.districtId, clubName: entry.clubName },
      sourceUrl: index.sourceUrl,
      date: index.data.snapshotDate ?? null,
    }
  }

  // ── Core analytics reads ───────────────────────────────────────────────

  /** `v1/rankings.json` — current all-districts rankings (CDN presentation shape). */
  getRankings(): Promise<CdnReadResult<CdnRankings>> {
    return this.read('v1/rankings.json', CdnRankingsSchema, d => d.date)
  }

  /**
   * `snapshots/{date}/all-districts-rankings.json` — dated rankings, validated
   * against the full shared write-contract schema.
   */
  getDistrictRankingsForDate(
    date: string
  ): Promise<CdnReadResult<AllDistrictsRankingsData>> {
    if (!ISO_DATE_RE.test(date)) {
      return Promise.resolve(
        notAvailable(
          `${this.baseUrl}/snapshots/${encodeURIComponent(date)}/all-districts-rankings.json`,
          `not available — "${date}" is not a YYYY-MM-DD snapshot date`
        )
      )
    }
    return this.read(
      `snapshots/${date}/all-districts-rankings.json`,
      AllDistrictsRankingsDataSchema,
      d => d.metadata.snapshotId
    )
  }

  /**
   * `snapshots/{date}/district_{id}.json` — the full dated per-district
   * snapshot (roster, division/area aggregates, totals, raw performance rows),
   * validated against the shared `PerDistrictData` write-contract. The snapshot
   * `date` is surfaced from the inner `data.snapshotDate`, not the request arg.
   */
  getDistrictSnapshot(
    districtId: string,
    date: string
  ): Promise<CdnReadResult<DistrictSnapshot>> {
    if (!DISTRICT_ID_RE.test(districtId) || !ISO_DATE_RE.test(date)) {
      return Promise.resolve(
        notAvailable(
          `${this.baseUrl}/snapshots/${encodeURIComponent(date)}/district_${encodeURIComponent(districtId)}.json`,
          `not available — "${districtId}"/"${date}" is not a valid district id / YYYY-MM-DD date`
        )
      )
    }
    return this.read(
      `snapshots/${date}/district_${districtId}.json`,
      PerDistrictDataSchema,
      d => d.data.snapshotDate
    )
  }

  /**
   * `time-series/district_{id}/{programYear}.json` — pre-computed membership /
   * payments / DCP / distinguished / club-health-count series for a program
   * year, validated against the shared `ProgramYearIndexFile` contract. The
   * surfaced `date` is the most recent data point in the series.
   */
  getTimeSeries(
    districtId: string,
    programYear: string
  ): Promise<CdnReadResult<TimeSeriesProgramYear>> {
    if (
      !DISTRICT_ID_RE.test(districtId) ||
      !PROGRAM_YEAR_RE.test(programYear)
    ) {
      return Promise.resolve(
        notAvailable(
          `${this.baseUrl}/time-series/district_${encodeURIComponent(districtId)}/${encodeURIComponent(programYear)}.json`,
          `not available — "${districtId}"/"${programYear}" is not a valid district id / YYYY-YYYY program year`
        )
      )
    }
    return this.read(
      `time-series/district_${districtId}/${programYear}.json`,
      ProgramYearIndexFileSchema,
      d =>
        d.dataPoints.length > 0
          ? d.dataPoints[d.dataPoints.length - 1]!.date
          : null
    )
  }

  // ── Core fetch + validate ──────────────────────────────────────────────

  /**
   * Fetch a CDN path, validate the body with `schema`, and attach the source
   * URL + snapshot date. Any failure (network, non-200, bad JSON, schema
   * mismatch) becomes a typed not-available result — this method never throws.
   */
  private async read<T>(
    path: string,
    schema: ZodType<T>,
    dateOf: (data: T) => string | null
  ): Promise<CdnReadResult<T>> {
    const sourceUrl = `${this.baseUrl}/${path}`

    let res: Response
    try {
      res = await this.fetchFn(sourceUrl)
    } catch (err) {
      return notAvailable(
        sourceUrl,
        `not available — fetch failed: ${errorMessage(err)}`
      )
    }

    if (res.status === 404) {
      return notAvailable(sourceUrl, 'not available — file not found (404)')
    }
    if (!res.ok) {
      return notAvailable(sourceUrl, `not available — HTTP ${res.status}`)
    }

    let json: unknown
    try {
      json = await res.json()
    } catch (err) {
      return notAvailable(
        sourceUrl,
        `not available — response was not valid JSON: ${errorMessage(err)}`
      )
    }

    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const detail = issue
        ? `${issue.path.join('.') || '<root>'}: ${issue.message}`
        : 'unknown schema error'
      return notAvailable(
        sourceUrl,
        `not available — schema validation failed (${detail})`
      )
    }

    return {
      available: true,
      data: parsed.data,
      sourceUrl,
      date: dateOf(parsed.data),
    }
  }
}
