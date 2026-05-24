/**
 * Dry-run the per-sprint relevant-lessons manifest (#650, epic #647).
 *
 * Prints the lessons a spawned session WOULD load from a sprint sub-issue's
 * `## Relevant lessons` section — useful before a sprint launches to confirm the
 * operator's curation resolves to real files.
 *
 *   scripts/relevant-lessons.sh 650            # fetch issue #650 body via gh
 *   scripts/relevant-lessons.sh --stdin        # read an issue body from stdin
 *
 * Stdout carries the structured result (one found lesson path per line) so it
 * composes with `| while read`; all human-facing logging goes to stderr (R4).
 * Exits non-zero if any listed lesson is missing on disk, so it can gate.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseRelevantLessons,
  resolveRelevantLessons,
} from './lib/relevantLessons'

const REPO_ROOT = join(__dirname, '..')

function readIssueBody(arg: string): string {
  if (arg === '--stdin') return readFileSync(0, 'utf8')
  const issue = arg.replace(/^#/, '')
  if (!/^\d+$/.test(issue)) {
    throw new Error(`Expected an issue number or --stdin, got: ${arg}`)
  }
  return execFileSync(
    'gh',
    ['issue', 'view', issue, '--json', 'body', '--jq', '.body'],
    { encoding: 'utf8' }
  )
}

function main(): void {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Usage: relevant-lessons.sh <issue-number>|--stdin')
    process.exit(2)
  }

  const refs = parseRelevantLessons(readIssueBody(arg))
  if (refs.length === 0) {
    console.error('No `## Relevant lessons` section found — nothing to load.')
    return
  }

  const { found, missing } = resolveRelevantLessons(refs, p =>
    existsSync(join(REPO_ROOT, p))
  )

  console.error(`Manifest lists ${refs.length} lesson(s):`)
  for (const r of found) {
    console.error(`  ✓ ${r.path}${r.reason ? ` — ${r.reason}` : ''}`)
  }
  for (const r of missing) {
    console.error(`  ✗ MISSING: ${r.path}`)
  }

  // Structured output: the resolved paths a session should read, one per line.
  for (const r of found) console.log(r.path)

  if (missing.length > 0) {
    console.error(`\n${missing.length} listed lesson(s) not found on disk.`)
    process.exit(1)
  }
}

main()
