/**
 * SnapshotValueDiffLoader — fs glue for {@link SnapshotValueDiff}. Loads per-date
 * digests from a snapshots directory tree (`{root}/{date}/all-districts-rankings.json`)
 * and orchestrates the diff + promote decision for the CLI `value-diff` command.
 *
 * The pure comparison logic lives in SnapshotValueDiff.ts (unit-tested without fs);
 * this module owns only the reading + orchestration.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateAllDistrictsRankings } from '@toastmasters/shared-contracts'
import {
  digestDate,
  diffSnapshots,
  evaluatePromote,
  type DateDigest,
  type PromoteDecision,
  type ValueDiffReport,
} from './SnapshotValueDiff.js'

const RANKINGS_FILE = 'all-districts-rankings.json'

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

/**
 * Load one {@link DateDigest} per date directory under `root` that contains an
 * `all-districts-rankings.json`. The file is schema-validated (fail-closed: a
 * malformed snapshot throws rather than silently skipping a date — a safety gate
 * must not pass on data it could not read). A missing root yields `[]`.
 */
export function loadDateDigests(root: string): DateDigest[] {
  if (!existsSync(root)) return []

  const digests: DateDigest[] = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(root, entry.name, RANKINGS_FILE)
    if (!existsSync(file)) continue
    const parsed = validateAllDistrictsRankings(
      JSON.parse(readFileSync(file, 'utf8'))
    )
    if (!parsed.success || !parsed.data) {
      throw new Error(
        `Invalid ${RANKINGS_FILE} for ${entry.name}: ${parsed.error}`
      )
    }
    digests.push(digestDate(entry.name, parsed.data))
  }
  return digests
}

export function runValueDiff(opts: RunValueDiffOptions): RunValueDiffResult {
  const staging = loadDateDigests(opts.stagingDir)
  const prod = loadDateDigests(opts.prodDir)
  const report = diffSnapshots(staging, prod)
  const decision = evaluatePromote(
    report,
    { allowValueChanges: opts.allowValueChanges },
    // CPAA (#1086): digests carry the already-parsed rows + sourceCsvDate.
    { staging, prod }
  )
  return { report, decision, exitCode: decision.promote ? 0 : 1 }
}
