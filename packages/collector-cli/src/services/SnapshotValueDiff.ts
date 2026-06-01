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
 *
 * NOTE: stub bodies — implemented in the GREEN commit. Kept typed so the failing
 * test compiles (the assertions are what fail in RED, not the import).
 */
import type {
  AllDistrictsRankingsData,
  DistrictRanking,
} from '@toastmasters/shared-contracts'

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

export function digestDistrict(_district: DistrictRanking): string {
  return ''
}

export function digestDate(
  date: string,
  _data: AllDistrictsRankingsData
): DateDigest {
  return { date, totalDistricts: 0, districtDigests: {}, combined: '' }
}

export function diffSnapshots(
  _staging: DateDigest[],
  _prod: DateDigest[]
): ValueDiffReport {
  return { added: [], removed: [], changed: [], unchanged: [], overlap: 0 }
}

export function evaluatePromote(
  _report: ValueDiffReport,
  _opts: PromoteOptions = {}
): PromoteDecision {
  return { promote: true, requiresReview: false, reasons: [] }
}
