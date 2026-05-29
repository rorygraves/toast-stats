/**
 * Quarantine gate (#913, epic #917 S2).
 *
 * Reads frontend/test-quarantine.json, validates that every entry is justified
 * (file + reason + tracking issue), and prints a LOUD report. Quarantine ≠ skip
 * (R1): the list is data, not a `--skip`, and an unjustified entry — or a
 * malformed file — fails the gate so a confirmed flake can never slip back into
 * the blocking suite unannounced.
 *
 *   npm run test:quarantine:check
 *
 * Exit codes:
 *   0 — list is empty, or every entry is justified (loudly reported)
 *   1 — an entry is unjustified (missing reason/issue/file) or the file is malformed
 *
 * All human-facing output goes to stderr (R4); stdout stays clean.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseQuarantine,
  validateQuarantine,
  formatQuarantineReport,
} from './lib/quarantine'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const QUARANTINE_FILE = join(
  REPO_ROOT,
  'frontend',
  'test-quarantine.json'
)

function main(): void {
  let raw: string
  try {
    raw = readFileSync(QUARANTINE_FILE, 'utf8')
  } catch {
    console.error(
      `quarantine: cannot read ${QUARANTINE_FILE} — expected { "quarantined": [] }`
    )
    process.exit(1)
  }

  let entries
  try {
    entries = parseQuarantine(raw)
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`)
    process.exit(1)
  }

  console.error(formatQuarantineReport(entries))

  const problems = validateQuarantine(entries)
  if (problems.length > 0) {
    console.error(
      `\n✗ Quarantine has ${problems.length} unjustified entr(y/ies) — a quarantine must never be a silent skip (R1):`
    )
    for (const p of problems) console.error(`    - ${p}`)
    process.exit(1)
  }
}

// Only run when invoked as a script, not when imported by a test.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
