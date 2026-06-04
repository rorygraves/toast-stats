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
 * policy (epic #1083, decision doc §4 as amended by #1092). Counters are
 * direction-agnostic within a symmetric magnitude cap; bases/identity must be
 * equal; plan booleans are one-way (false→true); derived fields are zero-sum
 * re-derivations and excluded from the check.
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
  /**
   * districtId → parsed ranking row, for closing auto-allow evaluation of
   * changed dates (#1086). Carried from the data the loader already parses —
   * no new I/O. Absent on hand-built digests ⇒ CPAA fails closed.
   */
  districts?: Record<string, DistrictRanking>
  /** metadata.sourceCsvDate — the closing-remap signature input (#1086) */
  sourceCsvDate?: string
}

/** One counter movement (either direction), kept for provenance in the run summary. */
export interface ClosingDelta {
  districtId: string
  field: string
  prod: number
  staging: number
  delta: number
}

export interface ClosingAutoAllowResult {
  allowed: boolean
  /** violations when !allowed — each names the date/district/field */
  reasons: string[]
  /** within-cap counter movements, either direction (run-summary provenance) */
  deltas: ClosingDelta[]
  /** districts whose only differences were derived fields (ignored) */
  derivedOnlyDistricts: string[]
}

/**
 * Closing-Pinned Auto-Allow evaluation for ONE changed overlap date (decision
 * doc §4–§5 as amended by #1092, epic #1083). Auto-allow iff the date carries
 * the closing-remap signature in STAGING's own metadata, the district set is
 * identical, and every changed field obeys its class rule:
 *
 *   counter      |Δ| ≤ max(50, 10% × prod)   (direction-agnostic, #1092)
 *   base         must be equal
 *   identity     must be equal
 *   planBoolean  false→true allowed; true→false blocks
 *   derived      excluded (zero-sum re-derivations)
 *
 * Optionality transitions (field present on one side only) and unclassified
 * CHANGED fields block — fail-closed. Digests lacking the parsed rows (e.g.
 * hand-built) also fail closed.
 */
export function evaluateClosingAutoAllow(
  stagingDate: DateDigest,
  prodDate: DateDigest
): ClosingAutoAllowResult {
  const date = stagingDate.date
  const reasons: string[] = []
  const deltas: ClosingDelta[] = []
  const derivedOnly: string[] = []

  const blocked = (): ClosingAutoAllowResult => ({
    allowed: false,
    reasons,
    deltas: [],
    derivedOnlyDistricts: [],
  })

  // Fail-closed: without the parsed rows + signature we cannot evaluate.
  const stagingDistricts = stagingDate.districts
  const prodDistricts = prodDate.districts
  if (!stagingDistricts || !prodDistricts) {
    reasons.push(
      `${date}: parsed district rows unavailable — cannot evaluate closing auto-allow`
    )
    return blocked()
  }
  if (!isClosingPinned(date, stagingDate.sourceCsvDate)) {
    reasons.push(
      `${date}: not closing-pinned (month-end + advanced As-of signature absent; ` +
        `sourceCsvDate=${stagingDate.sourceCsvDate ?? 'missing'}) — ` +
        `a changed non-closing date is a re-derive review`
    )
    return blocked()
  }

  // District set must be identical on the changed date (#1034 D61 protection).
  const stagingIds = Object.keys(stagingDistricts)
  const prodIds = Object.keys(prodDistricts)
  const onlyStaging = stagingIds.filter(id => !(id in prodDistricts))
  const onlyProd = prodIds.filter(id => !(id in stagingDistricts))
  if (onlyStaging.length > 0 || onlyProd.length > 0) {
    if (onlyStaging.length > 0) {
      reasons.push(
        `${date}: district(s) only in staging: ${onlyStaging.sort().join(', ')}`
      )
    }
    if (onlyProd.length > 0) {
      reasons.push(
        `${date}: district(s) only in production: ${onlyProd.sort().join(', ')}`
      )
    }
    return blocked()
  }

  for (const id of stagingIds.sort()) {
    const stagingRow = stagingDistricts[id] as unknown as Record<
      string,
      unknown
    >
    const prodRow = prodDistricts[id] as unknown as Record<string, unknown>
    const fields = new Set([
      ...Object.keys(stagingRow),
      ...Object.keys(prodRow),
    ])
    let nonDerivedChanges = 0
    let derivedChanges = 0

    for (const field of [...fields].sort()) {
      const stagingValue = stagingRow[field]
      const prodValue = prodRow[field]
      if (Object.is(stagingValue, prodValue)) continue

      const cls = FIELD_CLASSIFICATION[field]
      if (cls === 'derived') {
        derivedChanges++
        continue
      }
      nonDerivedChanges++

      // Unclassified CHANGED field — fail-closed (registry exhaustiveness is
      // also unit-tested against the schema; this guards unvalidated input).
      if (cls === undefined) {
        reasons.push(
          `${date} D${id} ${field}: unclassified field changed — fail-closed`
        )
        continue
      }

      // Optionality transition: present on one side only (any non-derived
      // class). During closing TI does not add columns — a field appearing
      // or vanishing means the pipeline code changed (re-derive review).
      if (stagingValue === undefined || prodValue === undefined) {
        reasons.push(
          `${date} D${id} ${field}: optionality transition ` +
            `(${String(prodValue)}→${String(stagingValue)}) blocks`
        )
        continue
      }

      switch (cls) {
        case 'counter': {
          const prod = prodValue as number
          const staging = stagingValue as number
          const delta = staging - prod
          // Direction-agnostic (#1092): closing reconciliation legitimately
          // moves counters BOTH ways (payments reversed, a club slipping
          // under a threshold). Only an implausible MAGNITUDE blocks — the
          // symmetric cap catches systematic re-derive inflation or a
          // collapse-to-zero, never a per-unit downward correction.
          const cap = Math.max(50, 0.1 * prod)
          if (Math.abs(delta) > cap) {
            reasons.push(
              `${date} D${id} ${field}: counter move ${prod}→${staging} ` +
                `(Δ ${delta > 0 ? '+' : ''}${delta}) exceeds symmetric cap ` +
                `${cap} = max(50, 10% × ${prod})`
            )
          } else {
            deltas.push({ districtId: id, field, prod, staging, delta })
          }
          break
        }
        case 'base':
          reasons.push(
            `${date} D${id} ${field}: base drift ${String(prodValue)}→` +
              `${String(stagingValue)} blocks (fixed at program-year start)`
          )
          break
        case 'identity':
          reasons.push(
            `${date} D${id} ${field}: identity drift ${String(prodValue)}→` +
              `${String(stagingValue)} blocks`
          )
          break
        case 'planBoolean':
          if (prodValue === false && stagingValue === true) break // one-way OK
          reasons.push(
            `${date} D${id} ${field}: plan boolean ${String(prodValue)}→` +
              `${String(stagingValue)} blocks (only false→true allowed)`
          )
          break
      }
    }

    if (nonDerivedChanges === 0 && derivedChanges > 0) derivedOnly.push(id)
  }

  if (reasons.length > 0) return blocked()
  return {
    allowed: true,
    reasons: [],
    deltas,
    derivedOnlyDistricts: derivedOnly,
  }
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
  /** present when CPAA auto-allowed every changed overlap date (#1086) */
  autoAllowed?: 'closing-reconciliation'
  /** provenance: per-date counter movements, either direction (run-summary table) */
  closingDeltas?: Array<ClosingDelta & { date: string }>
  /** districts (across changed dates) whose only moves were derived fields */
  derivedOnlyDistricts?: number
}

export interface PromoteOptions {
  /** operator override: promote a reviewed value re-derive despite changed dates */
  allowValueChanges?: boolean
}

/** Digest sets for CPAA evaluation of changed overlap dates (#1086). */
export interface PromoteDigests {
  staging: DateDigest[]
  prod: DateDigest[]
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
  const districts: Record<string, DistrictRanking> = {}
  for (const district of data.rankings) {
    districtDigests[district.districtId] = digestDistrict(district)
    districts[district.districtId] = district
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
    // CPAA pass-through (#1086): already-parsed rows + the remap signature
    // input — no new I/O, evaluated only for changed overlap dates.
    districts,
    sourceCsvDate: data.metadata.sourceCsvDate,
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
 * CPAA across ALL changed overlap dates: every changed date must individually
 * pass {@link evaluateClosingAutoAllow}; any failure (or a missing digest)
 * blocks the whole set — fail-closed.
 */
function evaluateClosingAutoAllowAcross(
  changed: ChangedDate[],
  digests: PromoteDigests
): {
  allowed: boolean
  reasons: string[]
  deltas: NonNullable<PromoteDecision['closingDeltas']>
  derivedOnlyDistricts: number
} {
  const stagingMap = byDate(digests.staging)
  const prodMap = byDate(digests.prod)
  const reasons: string[] = []
  const deltas: NonNullable<PromoteDecision['closingDeltas']> = []
  let derivedOnlyDistricts = 0

  for (const { date } of changed) {
    const staging = stagingMap.get(date)
    const prod = prodMap.get(date)
    if (!staging || !prod) {
      reasons.push(`${date}: digest unavailable — cannot evaluate auto-allow`)
      continue
    }
    const result = evaluateClosingAutoAllow(staging, prod)
    if (!result.allowed) {
      reasons.push(...result.reasons)
    } else {
      deltas.push(...result.deltas.map(d => ({ date, ...d })))
      derivedOnlyDistricts += result.derivedOnlyDistricts.length
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    deltas,
    derivedOnlyDistricts,
  }
}

/**
 * Promote gate (validate-first). A SUBTRACTIVE change (date removed from prod)
 * always blocks. A value re-derive (changed overlap dates) requires explicit
 * operator review — it blocks unless `allowValueChanges` is set, signalling the
 * operator has reviewed the value diff. A purely additive change promotes.
 *
 * Closing-Pinned Auto-Allow (#1086/#1092, epic #1083): when the only objection
 * is "changed overlap dates" and EVERY changed date is closing-pinned with
 * within-cap counter moves in either direction (decision doc §4–§5 as amended
 * by #1092), the change is routine month-end reconciliation and promotes
 * autonomously with provenance.
 * Subtractive changes still block absolutely; without `digests` the legacy
 * review path applies (fail-closed).
 */
export function evaluatePromote(
  report: ValueDiffReport,
  opts: PromoteOptions = {},
  digests?: PromoteDigests
): PromoteDecision {
  const reasons: string[] = []
  let promote = true
  let requiresReview = false
  let autoAllowed: PromoteDecision['autoAllowed']
  let closingDeltas: PromoteDecision['closingDeltas']
  let derivedOnlyDistricts: number | undefined

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
      // CPAA applies only when the verdict would otherwise be "blocked
      // because changed is non-empty" — never to a subtractive change.
      const cpaa =
        digests && report.removed.length === 0
          ? evaluateClosingAutoAllowAcross(report.changed, digests)
          : undefined
      if (cpaa?.allowed) {
        requiresReview = false
        autoAllowed = 'closing-reconciliation'
        closingDeltas = cpaa.deltas
        derivedOnlyDistricts = cpaa.derivedOnlyDistricts
        reasons.push(
          `closing-pinned auto-allow: ${cpaa.deltas.length} within-cap ` +
            `counter move(s) across ${report.changed.length} closing-pinned date(s), ` +
            `${derivedOnlyDistricts} derived-only district(s) ignored (#1086, #1092)`
        )
      } else {
        promote = false
        reasons.push(
          'value changes require operator review — re-run with --allow-value-changes to promote after reviewing the diff'
        )
        if (cpaa) reasons.push(...cpaa.reasons)
      }
    }
  }

  if (promote && reasons.length === 0) {
    reasons.push(
      `additive-only: ${report.added.length} new date(s), ${report.unchanged.length} unchanged`
    )
  }

  return {
    promote,
    requiresReview,
    reasons,
    ...(autoAllowed !== undefined && {
      autoAllowed,
      closingDeltas,
      derivedOnlyDistricts,
    }),
  }
}
