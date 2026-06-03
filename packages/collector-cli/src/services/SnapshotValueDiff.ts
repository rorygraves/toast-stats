/**
 * SnapshotValueDiff — value-aware comparison of two snapshot sets (staging vs
 * production) for the full-range re-derive promote gate (epic #1031, Sprint 2).
 *
 * The existing promote gate (`data-pipeline.yml` `steps.diff`) compares only
 * aggregate COUNTS — date count and ranked-district count. That is monotonic
 * protection against a SUBTRACTIVE change, but it gives ZERO protection for the
 * epic's "re-derive after logic changes" intent: same dates/districts ⇒ counts
 * identical ⇒ auto-promote, even if every value was recomputed wrong (F2 in
 * docs/investigations/2017-rerun-raw-csv-coverage.md).
 *
 * This module adds a per-date VALUE digest over each district's data fields and
 * classifies the overlap set as added / removed / changed / unchanged, so a
 * re-derive must be reviewed (validate-first) before it can promote.
 */
import type {
  AllDistrictsRankingsData,
  DistrictRanking,
} from '@toastmasters/shared-contracts'

/**
 * Causal role of a DistrictRanking field for the Closing-Pinned Auto-Allow
 * policy (epic #1083, decision doc §4). Counters are monotone + capped;
 * bases/identity must be equal; plan booleans are one-way (false→true);
 * derived fields are zero-sum re-derivations and excluded from the check.
 */
export type FieldClass =
  | 'counter'
  | 'base'
  | 'identity'
  | 'planBoolean'
  | 'derived'

/**
 * Field-classification registry (decision doc §4 table). Exhaustiveness vs
 * DistrictRankingSchema.shape is enforced by unit test; an unclassified
 * CHANGED field blocks at runtime (fail-closed, R20/L150 spirit).
 */
export const FIELD_CLASSIFICATION: Record<string, FieldClass> = {
  // Identity — must be equal
  districtId: 'identity',
  districtName: 'identity',
  region: 'identity',
  // Counters — non-decreasing, magnitude-capped during closing
  paidClubs: 'counter',
  activeClubs: 'counter',
  totalPayments: 'counter',
  newPayments: 'counter',
  aprilPayments: 'counter',
  octoberPayments: 'counter',
  latePayments: 'counter',
  charterPayments: 'counter',
  distinguishedClubs: 'counter',
  selectDistinguished: 'counter',
  presidentsDistinguished: 'counter',
  smedleyDistinguished: 'counter',
  clubsWith20PlusMembers: 'counter',
  newCharteredClubs: 'counter',
  // Bases — fixed at program-year start; any move is an anomaly
  paidClubBase: 'base',
  paymentBase: 'base',
  // Plan booleans — one-way false→true
  dspSubmitted: 'planBoolean',
  trainingMet: 'planBoolean',
  marketAnalysisSubmitted: 'planBoolean',
  communicationPlanSubmitted: 'planBoolean',
  regionAdvisorVisitMet: 'planBoolean',
  // Derived — re-derived, zero-sum across districts; excluded from the check
  clubGrowthPercent: 'derived',
  paymentGrowthPercent: 'derived',
  distinguishedPercent: 'derived',
  clubsRank: 'derived',
  paymentsRank: 'derived',
  distinguishedRank: 'derived',
  overallRank: 'derived',
  aggregateScore: 'derived',
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parse YYYY-MM-DD into [year, month, day], or null if malformed. */
function parseIsoDate(value: string): [number, number, number] | null {
  const m = ISO_DATE.exec(value)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/**
 * Closing-pinned detection (decision doc §5). A snapshot date `D` carries the
 * #309 closing-remap signature iff, in staging's own rankings metadata:
 *   1. `D` is the last day of its calendar month (every remap pins to
 *      month-end),
 *   2. `sourceCsvDate > D` (the As-of advanced past the pinned date — TI
 *      publishes prior-month data with a current-month As-of only during
 *      closing), and
 *   3. the gap is ≤ 31 days (belt-and-braces bound; longest closing on record
 *      is 25 days).
 *
 * All comparisons are on the ISO strings / UTC day arithmetic — deliberately
 * NOT reusing ClosingPeriodDetector, whose `new Date(string)` parsing has a
 * TZ edge (decision doc §5). Malformed input fails closed (not pinned).
 */
export function isClosingPinned(
  date: string,
  sourceCsvDate: string | undefined
): boolean {
  if (!sourceCsvDate) return false
  const pinned = parseIsoDate(date)
  const asOf = parseIsoDate(sourceCsvDate)
  if (!pinned || !asOf) return false

  const [year, month, day] = pinned
  // Day 0 of the NEXT month is the last day of this month (UTC arithmetic —
  // no string parsing, no local TZ).
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day !== lastDayOfMonth) return false

  // ISO strings compare lexicographically in date order (incl. across years).
  if (!(sourceCsvDate > date)) return false

  const gapDays =
    (Date.UTC(asOf[0], asOf[1] - 1, asOf[2]) - Date.UTC(year, month - 1, day)) /
    86_400_000
  return gapDays <= 31
}

export interface DateDigest {
  date: string
  totalDistricts: number
  /** districtId → stable digest of that district's data fields */
  districtDigests: Record<string, string>
  /** order-independent digest of the whole date */
  combined: string
}

export interface ChangedDate {
  date: string
  changedDistricts: string[]
}

export interface ValueDiffReport {
  /** dates present in staging but not prod (additive) */
  added: string[]
  /** dates present in prod but not staging (subtractive) */
  removed: string[]
  /** overlap dates whose values differ */
  changed: ChangedDate[]
  /** overlap dates whose values are identical */
  unchanged: string[]
  /** number of dates present in both sets */
  overlap: number
}

export interface PromoteDecision {
  promote: boolean
  requiresReview: boolean
  reasons: string[]
}

export interface PromoteOptions {
  /** operator override: promote a reviewed value re-derive despite changed dates */
  allowValueChanges?: boolean
}

/**
 * Deterministic JSON serialization with recursively sorted object keys, so that
 * a digest depends only on values, never on key insertion order. `undefined`
 * values (absent optional fields) are dropped consistently by JSON.stringify.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter(k => obj[k] !== undefined)
    .sort()
  return `{${keys
    .map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(',')}}`
}

/**
 * Stable digest of a single district's data. Captures EVERY field of the
 * ranking (metrics, ranks, scores, the optional #329/#330/#336 fields) so any
 * re-derived difference is detected — but is independent of object key order.
 */
export function digestDistrict(district: DistrictRanking): string {
  return stableStringify(district)
}

/**
 * Per-date digest. Deliberately EXCLUDES `metadata` (calculatedAt, csvFetchedAt,
 * fromCache, version stamps) — those change on every run without the underlying
 * data changing, which would make every date falsely read as "changed".
 */
export function digestDate(
  date: string,
  data: AllDistrictsRankingsData
): DateDigest {
  const districtDigests: Record<string, string> = {}
  for (const district of data.rankings) {
    districtDigests[district.districtId] = digestDistrict(district)
  }
  // Order-independent: sort by districtId before combining.
  const combined = stableStringify(
    Object.keys(districtDigests)
      .sort()
      .map(id => [id, districtDigests[id]])
  )
  return {
    date,
    totalDistricts: data.rankings.length,
    districtDigests,
    combined,
  }
}

function byDate(digests: DateDigest[]): Map<string, DateDigest> {
  const map = new Map<string, DateDigest>()
  for (const d of digests) map.set(d.date, d)
  return map
}

/** Districts whose per-district digest differs (or is present in only one set). */
function changedDistricts(a: DateDigest, b: DateDigest): string[] {
  const ids = new Set([
    ...Object.keys(a.districtDigests),
    ...Object.keys(b.districtDigests),
  ])
  const changed: string[] = []
  for (const id of ids) {
    if (a.districtDigests[id] !== b.districtDigests[id]) changed.push(id)
  }
  return changed.sort()
}

export function diffSnapshots(
  staging: DateDigest[],
  prod: DateDigest[]
): ValueDiffReport {
  const stagingMap = byDate(staging)
  const prodMap = byDate(prod)

  const added: string[] = []
  const removed: string[] = []
  const changed: ChangedDate[] = []
  const unchanged: string[] = []
  let overlap = 0

  for (const date of stagingMap.keys()) {
    if (!prodMap.has(date)) added.push(date)
  }
  for (const date of prodMap.keys()) {
    if (!stagingMap.has(date)) removed.push(date)
  }
  for (const [date, stagingDigest] of stagingMap) {
    const prodDigest = prodMap.get(date)
    if (!prodDigest) continue
    overlap++
    if (stagingDigest.combined === prodDigest.combined) {
      unchanged.push(date)
    } else {
      changed.push({
        date,
        changedDistricts: changedDistricts(stagingDigest, prodDigest),
      })
    }
  }

  return {
    added: added.sort(),
    removed: removed.sort(),
    changed: changed.sort((x, y) => x.date.localeCompare(y.date)),
    unchanged: unchanged.sort(),
    overlap,
  }
}

/**
 * Promote gate (validate-first). A SUBTRACTIVE change (date removed from prod)
 * always blocks. A value re-derive (changed overlap dates) requires explicit
 * operator review — it blocks unless `allowValueChanges` is set, signalling the
 * operator has reviewed the value diff. A purely additive change promotes.
 */
export function evaluatePromote(
  report: ValueDiffReport,
  opts: PromoteOptions = {}
): PromoteDecision {
  const reasons: string[] = []
  let promote = true
  let requiresReview = false

  if (report.removed.length > 0) {
    promote = false
    reasons.push(
      `subtractive: ${report.removed.length} date(s) present in production are missing from staging (${report.removed.join(', ')})`
    )
  }

  if (report.changed.length > 0) {
    requiresReview = true
    reasons.push(
      `changed: ${report.changed.length} overlap date(s) have re-derived values differing from production`
    )
    if (!opts.allowValueChanges) {
      promote = false
      reasons.push(
        'value changes require operator review — re-run with --allow-value-changes to promote after reviewing the diff'
      )
    }
  }

  if (promote && reasons.length === 0) {
    reasons.push(
      `additive-only: ${report.added.length} new date(s), ${report.unchanged.length} unchanged`
    )
  }

  return { promote, requiresReview, reasons }
}
