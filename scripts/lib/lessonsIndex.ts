/**
 * Lessons Index Generator — Pure Functions (#648, epic #647)
 *
 * Reads the tag frontmatter that every per-file lesson in tasks/lessons/
 * carries and assembles a single, always-loadable INDEX.md. The frontmatter
 * shape (Sprint 0 audit §5, "Option X — flat + frontmatter"):
 *
 *   ---
 *   id: '089'
 *   category: principle | lesson | incident | superseded | noise
 *   tags: [bash, screen, automation]
 *   auto_load: true        # false for incident / superseded / noise
 *   superseded_by: '089'   # omitted when null
 *   date: 2026-05-22
 *   issues: [634]
 *   ---
 *
 * All functions are pure (no filesystem I/O) so they unit-test cleanly; the
 * IO entry point lives in scripts/regenerate-lessons-index.ts.
 */

export type LessonCategory =
  | 'principle'
  | 'lesson'
  | 'incident'
  | 'superseded'
  | 'noise'

export interface LessonMeta {
  id: string
  /** Human title from the auto-memory schema (lessons 056–082); else null. */
  name: string | null
  category: LessonCategory
  tags: string[]
  autoLoad: boolean
  supersededBy: string | null
  date: string | null
  issues: number[]
}

export interface LessonFile {
  /** Numeric/slug prefix from the filename, e.g. "089" or "092a". */
  prefix: string
  content: string
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/

/** Strip surrounding single/double quotes from a scalar value. */
function unquote(value: string): string {
  return value.replace(/^['"]|['"]$/g, '').trim()
}

/** Parse an inline YAML flow list: `[a, b, c]` → ['a','b','c']. */
function parseList(value: string): string[] {
  const inner = value
    .trim()
    .replace(/^\[|\]$/g, '')
    .trim()
  if (inner === '') return []
  return inner.split(',').map(item => unquote(item))
}

/**
 * Parse the leading frontmatter block. Returns null when the content does not
 * begin with a `--- … ---` block (i.e. the lesson has not been tagged yet).
 */
export function parseFrontmatter(content: string): LessonMeta | null {
  const match = content.match(FRONTMATTER_RE)
  if (!match) return null

  const fields: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/)
    if (kv) fields[kv[1]] = kv[2].trim()
  }

  const supersededRaw =
    fields.superseded_by !== undefined ? unquote(fields.superseded_by) : ''

  return {
    id: unquote(fields.id ?? ''),
    name: fields.name !== undefined ? unquote(fields.name) : null,
    category: unquote(fields.category ?? 'lesson') as LessonCategory,
    tags: fields.tags !== undefined ? parseList(fields.tags) : [],
    autoLoad: unquote(fields.auto_load ?? 'true') !== 'false',
    supersededBy:
      supersededRaw === '' || supersededRaw === 'null' ? null : supersededRaw,
    date: fields.date !== undefined ? unquote(fields.date) : null,
    issues:
      fields.issues !== undefined
        ? parseList(fields.issues)
            .map(n => Number(n))
            .filter(n => Number.isFinite(n))
        : [],
  }
}

/**
 * Derive a short title from the first markdown heading. Handles both the
 * clean "# Lesson NN — Title" form and the legacy "# 🗓️ DATE — Lesson NN:
 * Title (#issue)" form, stripping the lead-in and any trailing issue ref.
 */
export function extractTitle(content: string): string {
  const heading = content.match(/^#\s+(.*)$/m)
  if (!heading) return ''
  return heading[1]
    .replace(/^.*?Lesson\s+[\w.]+\s*[—–:-]\s*/, '')
    .replace(/\s*\(#\d+(?:,\s*#\d+)*\)\s*$/, '')
    .trim()
}

/** Title for the index: prefer the frontmatter `name`, else the heading. */
export function resolveTitle(meta: LessonMeta, content: string): string {
  return meta.name && meta.name.trim()
    ? meta.name.trim()
    : extractTitle(content)
}

/** Format a single INDEX.md bullet for one lesson. */
export function buildIndexLine(
  prefix: string,
  meta: LessonMeta,
  title: string
): string {
  const tags = `[${meta.tags.join(', ')}]`
  const issues =
    meta.issues.length > 0
      ? ` (${meta.issues.map(n => `#${n}`).join(', ')})`
      : ''
  const refOnly = meta.autoLoad ? '' : ' _(ref-only)_'
  return `- **${prefix}** ${tags} — ${title}${issues}${refOnly}`
}

/**
 * Locale-independent string compare (code-unit order). Avoids
 * `localeCompare`, whose result varies by runtime locale and would let CI
 * sort same-prefix lessons differently than a contributor's machine,
 * breaking the committed-vs-regenerated guard.
 */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Assemble the full INDEX.md body. Files without frontmatter are skipped.
 * Output is deterministic: bullets are sorted by (prefix, title).
 */
export function buildIndex(files: LessonFile[]): string {
  const rows = files
    .map(file => {
      const meta = parseFrontmatter(file.content)
      if (!meta) return null
      return {
        prefix: file.prefix,
        meta,
        title: resolveTitle(meta, file.content),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) =>
      a.prefix === b.prefix
        ? compare(a.title, b.title)
        : compare(a.prefix, b.prefix)
    )

  const header = [
    '# Lessons Index',
    '',
    '<!-- Generated by scripts/regenerate-lessons-index.sh — do not hand-edit. -->',
    '<!-- One line per per-file lesson. `_(ref-only)_` = auto_load:false (incident/superseded/noise): searchable, never auto-loaded into a session. -->',
    '',
  ]

  return (
    [
      ...header,
      ...rows.map(r => buildIndexLine(r.prefix, r.meta, r.title)),
    ].join('\n') + '\n'
  )
}
