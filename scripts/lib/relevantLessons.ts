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
 * Path-traversal guard: a resolvable lesson path must live under
 * `tasks/lessons/` and never contain `..`. Single-sourced here so every
 * "external input → file path" caller (manifest resolve, wikilink expansion)
 * applies the same rule (per the `Path.join` tripwire in rules.md, and the
 * note in Lesson 098 that future IO callers must re-apply the guard).
 */
function isSafeLessonPath(path: string): boolean {
  return path.startsWith('tasks/lessons/') && !path.includes('..')
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
    if (isSafeLessonPath(ref.path) && exists(ref.path)) found.push(ref)
    else missing.push(ref)
  }
  return { found, missing }
}

/**
 * Default cap on the total number of depth-1 `[[…]]` neighbours pulled in
 * across all seeds. Bounds the extra context a session loads so traversal can't
 * blow the window (epic #659: "within a documented context budget"). Five keeps
 * the neighbour set well under the always-loaded budget alongside the manifest,
 * tag-matched, and 2-newest lessons.
 */
export const DEPTH1_NEIGHBOUR_CAP = 5

/** Matches an Obsidian-style `[[target]]` wikilink; group 1 is the raw inner text. */
const WIKILINK_RE = /\[\[([^\]]+)\]\]/g

/**
 * Extract the `[[slug]]` wikilink targets from a lesson body, in first-seen
 * document order, deduplicated. An Obsidian `|alias` or `#heading` suffix is
 * stripped so `[[090-guard#how-to-apply]]` → `090-guard`. Empty/whitespace-only
 * brackets are ignored. Pure (no IO): resolution to a file path is the caller's
 * job. The slug is a lesson filename without its `.md` extension.
 */
export function parseWikilinks(body: string): string[] {
  const seen = new Set<string>()
  const slugs: string[] = []
  for (const m of body.matchAll(WIKILINK_RE)) {
    // Drop an Obsidian alias (`|…`) or heading anchor (`#…`); keep the target.
    const slug = m[1].split('|')[0].split('#')[0].trim()
    if (slug && !seen.has(slug)) {
      seen.add(slug)
      slugs.push(slug)
    }
  }
  return slugs
}

/**
 * Pull in the direct (depth-1) `[[…]]` neighbours of a set of seed lesson
 * paths. Reads ONLY the seed bodies — it never recurses into a neighbour's own
 * wikilinks, so this is strictly depth-1. Each wikilink slug resolves to
 * `tasks/lessons/<slug>.md`; a neighbour is kept only when it (a) passes the
 * path-traversal guard, (b) exists on disk, and (c) isn't already a seed.
 * Neighbours are deduplicated across seeds and accumulated in encounter order
 * up to `cap`; `capped` is true when the cap truncated the set (so the caller
 * can warn rather than silently drop). Pure: `readBody` and `exists` are
 * injected, keeping this unit-testable without filesystem IO.
 */
export function expandDepth1Neighbours(
  seedPaths: string[],
  readBody: (path: string) => string,
  exists: (path: string) => boolean,
  cap: number = DEPTH1_NEIGHBOUR_CAP
): { neighbours: string[]; capped: boolean } {
  const seedSet = new Set(seedPaths)
  const added = new Set<string>()
  const neighbours: string[] = []
  let capped = false

  for (const seed of seedPaths) {
    for (const slug of parseWikilinks(readBody(seed))) {
      // A lesson slug is a bare filename — never a path. Reject any slug with a
      // separator (`[[sub/dir]]`) so it can't address a nested file even if one
      // happened to exist; the `..` case is also caught by isSafeLessonPath.
      if (slug.includes('/')) continue
      const path = `tasks/lessons/${slug}.md`
      if (!isSafeLessonPath(path)) continue
      if (seedSet.has(path) || added.has(path)) continue
      if (!exists(path)) continue
      if (neighbours.length >= cap) {
        capped = true
        continue
      }
      added.add(path)
      neighbours.push(path)
    }
  }

  return { neighbours, capped }
}
