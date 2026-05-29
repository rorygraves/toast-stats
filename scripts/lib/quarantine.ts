/**
 * Test-quarantine mechanism — Pure Functions (#913, epic #917 S2).
 *
 * A quarantine isolates a KNOWN-flaky test so a confirmed flake never silently
 * blocks the queue AND is never silently ignored. Quarantine ≠ delete / skip
 * (R1: no bypassing failing tests, no commenting-out): an entry is an explicit,
 * loudly-reported, *justified* record that traces back to the root-cause sprint
 * that will fix it. The list lives in frontend/test-quarantine.json:
 *
 *   { "quarantined": [
 *       { "file": "src/.../Foo.test.tsx",
 *         "test": "optional describe/it name",
 *         "reason": "why it flakes (cite the lesson/vector)",
 *         "issue": 914,                // tracking issue/sprint
 *         "since": "2026-05-28" }      // optional
 *   ] }
 *
 * These functions parse that file, enforce that every entry is justified
 * (file + reason + tracking issue), and render a LOUD report. The IO entrypoint
 * (read file, print, set exit code) lives in scripts/check-quarantine.ts.
 */

/** One quarantined test, with the justification that keeps it from being a silent skip. */
export interface QuarantineEntry {
  /** Repo-relative test file path (frontend-relative is fine). */
  file: string
  /** Optional specific test name within the file. */
  test?: string
  /** Why it is quarantined — cite the flake vector / lesson. */
  reason: string
  /** Tracking issue (the root-cause sprint that will un-quarantine it). */
  issue: number
  /** Optional ISO date the entry was added. */
  since?: string
}

/**
 * Parse the quarantine JSON. Throws on malformed JSON or a missing top-level
 * `quarantined` array — a parse failure must be loud, never silently treated as
 * "nothing quarantined" (that would let a confirmed flake slip back into the
 * blocking gate unannounced).
 */
export function parseQuarantine(raw: string): QuarantineEntry[] {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (err) {
    throw new Error(
      `quarantine: file is not valid JSON — ${(err as Error).message}`
    )
  }
  if (
    typeof data !== 'object' ||
    data === null ||
    !Array.isArray((data as { quarantined?: unknown }).quarantined)
  ) {
    throw new Error(
      'quarantine: expected a top-level "quarantined" array (e.g. { "quarantined": [] })'
    )
  }
  return (data as { quarantined: QuarantineEntry[] }).quarantined
}

/**
 * Validate that every entry is justified. Returns a list of human-readable
 * problems (empty == all good). An unjustified quarantine — no reason, or no
 * tracking issue — is indistinguishable from a silent skip, so the IO layer
 * treats any problem as a hard failure.
 */
export function validateQuarantine(entries: QuarantineEntry[]): string[] {
  const problems: string[] = []
  entries.forEach((entry, i) => {
    const where = entry?.file ? `"${entry.file}"` : `entry #${i + 1}`
    if (!entry?.file || typeof entry.file !== 'string') {
      problems.push(`${where}: missing a "file" path`)
    }
    if (!entry?.reason || typeof entry.reason !== 'string') {
      problems.push(
        `${where}: missing a "reason" — a quarantine must be justified, not silent`
      )
    }
    if (typeof entry?.issue !== 'number') {
      problems.push(
        `${where}: missing a tracking "issue" — every quarantine traces to a root-cause sprint`
      )
    }
  })
  return problems
}

/**
 * Render a report for the CI step / console. Calm all-clear when empty; LOUD
 * (banner + per-entry file/reason/issue) when non-empty, so a growing list is
 * impossible to miss.
 */
export function formatQuarantineReport(entries: QuarantineEntry[]): string {
  if (entries.length === 0) {
    return '✅ Test quarantine: empty — 0 tests quarantined, none bypassing the gate.'
  }
  const lines = [
    '⚠️ ══════════════════════════════════════════════════════════════',
    `⚠️  TEST QUARANTINE: ${entries.length} test(s) isolated as known-flaky`,
    '⚠️  These are NOT fixed — each traces to a root-cause sprint below.',
    '⚠️ ══════════════════════════════════════════════════════════════',
  ]
  for (const e of entries) {
    const target = e.test ? `${e.file} › ${e.test}` : e.file
    const since = e.since ? ` (since ${e.since})` : ''
    lines.push(`  • ${target}${since}`)
    lines.push(`      reason: ${e.reason}`)
    lines.push(`      tracked by: #${e.issue}`)
  }
  return lines.join('\n')
}
