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
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseRelevantLessons,
  resolveRelevantLessons,
  expandDepth1Neighbours,
  DEPTH1_NEIGHBOUR_CAP,
} from './lib/relevantLessons'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

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

  // Depth-1 graph traversal (#772): a chosen lesson drags in the context it
  // explicitly references via `[[…]]`, capped so it can't blow the window.
  const { neighbours, capped } = expandDepth1Neighbours(
    found.map(r => r.path),
    p => readFileSync(join(REPO_ROOT, p), 'utf8'),
    p => existsSync(join(REPO_ROOT, p)),
    DEPTH1_NEIGHBOUR_CAP
  )
  if (neighbours.length > 0) {
    console.error(
      `\nDepth-1 [[…]] neighbours (${neighbours.length}${
        capped ? `, capped at ${DEPTH1_NEIGHBOUR_CAP}` : ''
      }):`
    )
    for (const p of neighbours) console.error(`  + ${p}`)
  }

  // Structured output: the resolved paths a session should read, one per line —
  // manifest lessons first, then their depth-1 neighbours.
  for (const r of found) console.log(r.path)
  for (const p of neighbours) console.log(p)

  if (missing.length > 0) {
    console.error(`\n${missing.length} listed lesson(s) not found on disk.`)
    process.exit(1)
  }
}

// Only run when invoked as a script, not when imported by a test.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
