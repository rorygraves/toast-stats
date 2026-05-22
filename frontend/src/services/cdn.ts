/**
 * CDN Client — Fetches pre-computed analytics directly from Cloud CDN
 *
 * The data pipeline writes JSON files to GCS which are served via Cloud CDN
 * at cdn.taverns.red. This client constructs URLs to these files and fetches
 * them directly, bypassing the Express backend for static analytics data.
 *
 * File layout in GCS:
 *   v1/latest.json                              → current snapshot date
 *   v1/dates.json                               → all available dates
 *   snapshots/{date}/analytics/district_{id}_{type}.json → per-district analytics
 *   config/district-snapshot-index.json          → date availability per district
 *
 * Fixes: #168 — Serve analytics via GCS + Cloud CDN
 */

import { recordCdnResponse } from './cdnCacheTracker'

// CDN base URL — set via VITE_CDN_BASE_URL at build time (#316)
// Production build: https://cdn.taverns.red (default)
// Staging build: https://storage.googleapis.com/toast-stats-data-staging
const CDN_BASE_URL: string =
  import.meta.env['VITE_CDN_BASE_URL'] || 'https://cdn.taverns.red'

function cdnBaseUrl(): string {
  return CDN_BASE_URL
}

/**
 * CDN manifest — returned by v1/latest.json
 */
export interface CdnManifest {
  _format?: { version: string; type: string }
  latestSnapshotDate: string
  generatedAt: string
}

/**
 * CDN dates index — returned by v1/dates.json
 */
export interface CdnDatesIndex {
  _format?: { version: string; type: string }
  dates: string[]
  count: number
  generatedAt: string
}

// Cache the latest snapshot date to avoid re-fetching on every hook call
let cachedManifest: CdnManifest | null = null
let manifestPromise: Promise<CdnManifest> | null = null

/**
 * Fetch the CDN manifest to discover the current snapshot date.
 * Caches the result for the lifetime of the page (SPA).
 */
export async function fetchCdnManifest(): Promise<CdnManifest> {
  if (cachedManifest) return cachedManifest
  if (manifestPromise) return manifestPromise

  manifestPromise = fetch(`${cdnBaseUrl()}/v1/latest.json`)
    .then(res => {
      if (!res.ok) throw new Error(`CDN manifest fetch failed: ${res.status}`)
      recordCdnResponse(res)
      return res.json() as Promise<CdnManifest>
    })
    .then(manifest => {
      cachedManifest = manifest
      return manifest
    })
    .catch(err => {
      manifestPromise = null // Allow retry on next call
      throw err
    })

  return manifestPromise
}

/**
 * Fetch all available snapshot dates from CDN.
 */
export async function fetchCdnDates(): Promise<CdnDatesIndex> {
  const res = await fetch(`${cdnBaseUrl()}/v1/dates.json`)
  if (!res.ok) throw new Error(`CDN dates fetch failed: ${res.status}`)
  recordCdnResponse(res)
  return res.json() as Promise<CdnDatesIndex>
}

/**
 * CDN rankings — returned by v1/rankings.json
 * Generated from all-districts-rankings.json during the data pipeline (#173)
 */
export interface CdnRankingsData {
  _format?: { version: string; type: string }
  rankings: Array<{
    districtId: string
    districtName: string
    region: string
    paidClubs: number
    paidClubBase: number
    clubGrowthPercent: number
    totalPayments: number
    paymentBase: number
    paymentGrowthPercent: number
    activeClubs: number
    distinguishedClubs: number
    selectDistinguished: number
    presidentsDistinguished: number
    distinguishedPercent: number
    clubsRank: number
    paymentsRank: number
    distinguishedRank: number
    aggregateScore: number
    overallRank: number
  }>
  date: string
  generatedAt: string
}

/**
 * Fetch district rankings from CDN.
 * The pipeline writes v1/rankings.json from all-districts-rankings.json.
 */
export async function fetchCdnRankings(): Promise<CdnRankingsData> {
  const res = await fetch(`${cdnBaseUrl()}/v1/rankings.json`)
  if (!res.ok) throw new Error(`CDN rankings fetch failed: ${res.status}`)
  recordCdnResponse(res)
  return res.json() as Promise<CdnRankingsData>
}

/**
 * Fetch district rankings for a specific snapshot date.
 * Falls back to v1/rankings.json if the per-date file doesn't exist.
 */
export async function fetchCdnRankingsForDate(
  date: string
): Promise<CdnRankingsData> {
  const url = `${cdnBaseUrl()}/snapshots/${date}/all-districts-rankings.json`
  const res = await fetch(url)
  if (!res.ok) {
    return fetchCdnRankings()
  }
  recordCdnResponse(res)
  const raw = (await res.json()) as {
    metadata?: { sourceCsvDate?: string; calculatedAt?: string }
    rankings: CdnRankingsData['rankings']
  }
  return {
    rankings: raw.rankings,
    date: raw.metadata?.sourceCsvDate || date,
    generatedAt: raw.metadata?.calculatedAt || new Date().toISOString(),
  }
}

/**
 * Single ranked entry in a competitive award leaderboard (#330)
 */
export interface CompetitiveAwardRanking {
  districtId: string
  districtName: string
  region: string
  rank: number
  value: number
  isWinner: boolean
}

/**
 * Per-district summary of competitive award standings (#330)
 */
export interface CompetitiveAwardsByDistrict {
  extensionRank: number
  extensionValue: number
  extensionIsWinner: boolean
  twentyPlusRank: number
  twentyPlusValue: number
  twentyPlusIsWinner: boolean
  retentionRank: number
  retentionValue: number
  retentionIsWinner: boolean
}

/**
 * Distinguished District tier (#332)
 */
export type DistinguishedDistrictTier =
  | 'NotDistinguished'
  | 'Distinguished'
  | 'Select'
  | 'Presidents'
  | 'Smedley'

export interface DistinguishedDistrictPrerequisites {
  dspSubmitted: boolean
  trainingMet: boolean
  marketAnalysisSubmitted: boolean
  communicationPlanSubmitted: boolean
  regionAdvisorVisitMet: boolean
}

export interface DistinguishedDistrictGap {
  tier: DistinguishedDistrictTier
  paymentGrowthGap: number
  clubGrowthGap: number
  distinguishedPercentGap: number
  netClubGrowthGap: number
  /**
   * Program-year baselines, propagated by analytics-core (#555) so the
   * UI can derive concrete unit counts from gap percentages. Optional
   * to tolerate older CDN snapshots that predate the field.
   */
  paidClubBase?: number
  paymentBase?: number
}

export interface DistinguishedDistrictStatus {
  districtId: string
  currentTier: DistinguishedDistrictTier
  allPrerequisitesMet: boolean
  prerequisites: DistinguishedDistrictPrerequisites
  nextTierGap: DistinguishedDistrictGap | null
}

/**
 * Competitive award standings + Distinguished District status for a snapshot
 * (#330, #332)
 */
export interface CompetitiveAwardStandings {
  metadata: {
    snapshotId: string
    calculatedAt: string
    totalDistricts: number
  }
  extensionAward: CompetitiveAwardRanking[]
  twentyPlusAward: CompetitiveAwardRanking[]
  retentionAward: CompetitiveAwardRanking[]
  byDistrict: Record<string, CompetitiveAwardsByDistrict>
  /** Per-district Distinguished District tier status (#332) */
  distinguishedDistrict?: Record<string, DistinguishedDistrictStatus>
  /** District Club Strength Award — 10%+ avg club size growth YoY (#333) */
  clubStrengthAward?: {
    qualifyingDistricts: Array<{
      districtId: string
      districtName: string
      region: string
      currentAvgClubSize: number
      priorYearAvgClubSize: number | null
      growthPercent: number | null
      qualifies: boolean
    }>
    allDistricts: Array<{
      districtId: string
      growthPercent: number | null
      qualifies: boolean
    }>
  }
  /** District Leadership Excellence Award — 3+ consecutive Distinguished years (#333) */
  leadershipExcellenceAward?: {
    qualifyingDistricts: Array<{
      districtId: string
      districtName: string
      region: string
      consecutiveYears: number
      qualifies: boolean
    }>
    allDistricts: Array<{
      districtId: string
      consecutiveYears: number
      qualifies: boolean
    }>
  }
  /** Officer Awards — PQD and CGD (#333) */
  officerAwards?: {
    educationTraining: Array<{
      districtId: string
      districtName: string
      region: string
      qualifies: boolean
    }>
    clubGrowth: Array<{
      districtId: string
      districtName: string
      region: string
      qualifies: boolean
    }>
  }
  /** Payment breakdown per district (#327) */
  paymentBreakdown?: Record<
    string,
    {
      newPayments: number
      aprilPayments: number
      octoberPayments: number
      latePayments: number
      charterPayments: number
      totalPayments: number
    }
  >
}

/**
 * Fetch competitive award standings for a specific snapshot date (#330).
 * Returns null if the file does not exist (legacy snapshots).
 */
export async function fetchCdnCompetitiveAwards(
  date: string
): Promise<CompetitiveAwardStandings | null> {
  const url = `${cdnBaseUrl()}/snapshots/${date}/competitive-awards.json`
  const res = await fetch(url)
  if (!res.ok) {
    return null
  }
  recordCdnResponse(res)
  return res.json() as Promise<CompetitiveAwardStandings>
}

/**
 * Construct a CDN URL for a pre-computed analytics file.
 *
 * @param date - Snapshot date (YYYY-MM-DD)
 * @param districtId - District ID
 * @param type - Analytics file type (e.g. 'analytics', 'membership', 'clubhealth')
 * @returns Full CDN URL
 */
export function cdnAnalyticsUrl(
  date: string,
  districtId: string,
  type: string
): string {
  return `${cdnBaseUrl()}/snapshots/${date}/analytics/district_${districtId}_${type}.json`
}

/**
 * Construct a CDN URL for a district snapshot file.
 */
export function cdnSnapshotUrl(date: string, districtId: string): string {
  return `${cdnBaseUrl()}/snapshots/${date}/district_${districtId}.json`
}

/**
 * Construct a CDN URL for the district snapshot index.
 */
export function cdnSnapshotIndexUrl(): string {
  return `${cdnBaseUrl()}/config/district-snapshot-index.json`
}

/**
 * Fetch a JSON file from CDN with typing.
 * Throws on non-OK responses for the caller to handle (e.g. fallback to Express).
 */
export async function fetchFromCdn<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`CDN fetch failed: ${res.status} for ${url}`)
  }
  recordCdnResponse(res)
  return res.json() as Promise<T>
}

/**
 * Reset the cached manifest (useful for testing or forced refresh).
 */
export function resetCdnManifestCache(): void {
  cachedManifest = null
  manifestPromise = null
}

/**
 * Fetch a district snapshot from CDN.
 * Returns the full snapshot JSON (DistrictStatistics shape).
 */
export async function fetchCdnDistrictSnapshot<T>(
  date: string,
  districtId: string
): Promise<T> {
  return fetchFromCdn<T>(cdnSnapshotUrl(date, districtId))
}

/**
 * Fetch a pre-computed analytics file for a district.
 * @param type - Analytics type: 'analytics', 'membership', 'clubhealth',
 *   'distinguished-analytics', 'membership-analytics', 'vulnerable-clubs',
 *   'leadership-insights', 'year-over-year', 'performance-targets', 'club-trends-index'
 */
export async function fetchCdnDistrictAnalytics<T>(
  date: string,
  districtId: string,
  type: string
): Promise<T> {
  return fetchFromCdn<T>(cdnAnalyticsUrl(date, districtId, type))
}

/**
 * CDN snapshot index — maps districtIds to their available snapshot dates.
 */
export interface CdnSnapshotIndex {
  [districtId: string]: string[]
}

/**
 * Fetch the district snapshot index from CDN.
 * Returns a map of districtId → list of available dates.
 * Normalizes both flat ({ "10": [...] }) and nested ({ districts: { "10": [...] } }) formats.
 */
export async function fetchCdnSnapshotIndex(): Promise<CdnSnapshotIndex> {
  const raw = await fetchFromCdn<Record<string, unknown>>(cdnSnapshotIndexUrl())
  // New nested format: { generatedAt, districts: { ... } }
  const districts = raw['districts']
  if (districts && typeof districts === 'object' && !Array.isArray(districts)) {
    return districts as CdnSnapshotIndex
  }
  // Legacy flat format: { "10": [...], "11": [...] }
  return raw as unknown as CdnSnapshotIndex
}

/**
 * CDN rank history — pre-computed per-district rank history.
 * Generated by the data pipeline from all historical snapshot rankings.
 */
export interface CdnRankHistoryData {
  districtId: string
  districtName: string
  history: Array<{
    date: string
    aggregateScore: number
    clubsRank: number
    paymentsRank: number
    distinguishedRank: number
    totalDistricts: number
    overallRank?: number
  }>
}

/**
 * Fetch pre-computed rank history for a district from CDN.
 */
/**
 * Fetch the club-to-district index from CDN (#320).
 */
export async function fetchCdnClubIndex(): Promise<{
  clubs: Record<string, { districtId: string; clubName: string }>
}> {
  const url = `${cdnBaseUrl()}/config/club-index.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CDN club index fetch failed: ${res.status}`)
  recordCdnResponse(res)
  return res.json()
}

export async function fetchCdnRankHistory(
  districtId: string
): Promise<CdnRankHistoryData> {
  const url = `${cdnBaseUrl()}/v1/rank-history/${districtId}.json`
  return fetchFromCdn<CdnRankHistoryData>(url)
}
