/**
 * SnapshotValueDiffLoader — fs glue for {@link SnapshotValueDiff}. Loads per-date
 * digests from a snapshots directory tree (`{root}/{date}/all-districts-rankings.json`)
 * and orchestrates the diff + promote decision for the CLI `value-diff` command.
 *
 * The pure comparison logic lives in SnapshotValueDiff.ts (unit-tested without fs);
 * this module owns only the reading + orchestration.
 *
 * NOTE: stub bodies — implemented in the GREEN commit.
 */
import {
  digestDate,
  diffSnapshots,
  evaluatePromote,
  type DateDigest,
  type PromoteDecision,
  type ValueDiffReport,
} from './SnapshotValueDiff.js'

export interface RunValueDiffOptions {
  stagingDir: string
  prodDir: string
  allowValueChanges?: boolean
}

export interface RunValueDiffResult {
  report: ValueDiffReport
  decision: PromoteDecision
  /** 0 when promotion is safe, 1 (PARTIAL_FAILURE) when blocked / requires review */
  exitCode: number
}

export function loadDateDigests(_root: string): DateDigest[] {
  return []
}

export function runValueDiff(_opts: RunValueDiffOptions): RunValueDiffResult {
  // referenced so the imports are not flagged unused in the stub
  void digestDate
  void diffSnapshots
  void evaluatePromote
  return {
    report: { added: [], removed: [], changed: [], unchanged: [], overlap: 0 },
    decision: { promote: true, requiresReview: false, reasons: [] },
    exitCode: 0,
  }
}
