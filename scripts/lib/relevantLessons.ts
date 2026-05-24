/**
 * Per-sprint relevant-lessons manifest parser — Pure Functions (#650, epic #647).
 *
 * Sprint sub-issue bodies MAY carry a `## Relevant lessons` section that lists
 * the lessons a spawned session must read in full, curated by the operator
 * during grooming. The bootstrap prompt (step 1) honors it: listed lessons load
 * in addition to tag-matched + 2-newest. This module turns that section of an
 * issue body into a structured list so a session — or the dry-run CLI in
 * scripts/relevant-lessons.ts — knows exactly which files to load.
 *
 * Manifest format (one bullet per lesson, markdown link + optional em-dash reason):
 *
 *   ## Relevant lessons
 *   - [Lesson 083](tasks/lessons/083-exit-trap.md) — EXIT trap return value …
 *   - [Lesson 092](tasks/lessons/092-workspace-package-dist.md) — rebuild dist
 *
 * All functions are pure (no filesystem I/O) so they unit-test cleanly; the IO
 * entry point lives in scripts/relevant-lessons.ts.
 */

export interface RelevantLessonRef {
  /** Link text, e.g. "Lesson 083". */
  label: string
  /** Repo-relative path the link points at, e.g. "tasks/lessons/083-…md". */
  path: string
  /** Trailing em-dash reason, or null when the bullet has none. */
  reason: string | null
}

/** Heading that opens the manifest section, case-insensitive. */
const MANIFEST_HEADING_RE = /^##\s+relevant\s+lessons\s*$/im
/** Any markdown ATX heading line — used to bound the section. */
const HEADING_RE = /^#{1,6}\s/

/**
 * A manifest bullet: `- [label](path)` optionally followed by an em-dash (or
 * hyphen) reason. Em-dash "—" is the documented separator; a plain " - " is
 * tolerated. Bullets that aren't links are ignored by the caller.
 */
const BULLET_RE = /^\s*[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*(?:[—–-]\s*(.+?))?\s*$/

/**
 * Extract the `## Relevant lessons` manifest from an issue body. Returns [] when
 * the section is absent. Parsing stops at the next markdown heading so it never
 * bleeds into a following section (e.g. `## Acceptance`).
 */
export function parseRelevantLessons(body: string): RelevantLessonRef[] {
  const lines = body.split('\n')
  const start = lines.findIndex(l => MANIFEST_HEADING_RE.test(l))
  if (start === -1) return []

  const refs: RelevantLessonRef[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (HEADING_RE.test(line)) break // next section — stop
    const m = line.match(BULLET_RE)
    if (!m) continue // prose, blank, or non-link bullet
    const [, label, path, reason] = m
    refs.push({
      label: label.trim(),
      path: path.trim(),
      reason: reason ? reason.trim() : null,
    })
  }
  return refs
}

/**
 * Partition refs into those whose files exist and those that don't, using the
 * supplied existence predicate (injected so this stays pure / testable). A ref
 * whose path escapes `tasks/lessons/` is always treated as missing — a manifest
 * must only point at lesson files, never at arbitrary paths (path-traversal
 * guard, per the Path.join tripwire in rules.md).
 */
export function resolveRelevantLessons(
  refs: RelevantLessonRef[],
  exists: (path: string) => boolean
): { found: RelevantLessonRef[]; missing: RelevantLessonRef[] } {
  const found: RelevantLessonRef[] = []
  const missing: RelevantLessonRef[] = []
  for (const ref of refs) {
    const safe =
      ref.path.startsWith('tasks/lessons/') && !ref.path.includes('..')
    if (safe && exists(ref.path)) found.push(ref)
    else missing.push(ref)
  }
  return { found, missing }
}
