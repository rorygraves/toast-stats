/**
 * Regenerate tasks/lessons/INDEX.md from per-file lesson frontmatter (#648).
 *
 * IO entry point for the pure generator in scripts/lib/lessonsIndex.ts.
 * Reads every tasks/lessons/*.md (except INDEX.md / README.md), parses the
 * tag frontmatter, and writes the deterministic index.
 *
 * Usage:
 *   npx tsx scripts/regenerate-lessons-index.ts          # write INDEX.md
 *   npx tsx scripts/regenerate-lessons-index.ts --check   # exit 1 if stale
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIndex, type LessonFile } from './lib/lessonsIndex'

const LESSONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'tasks',
  'lessons'
)
const INDEX_PATH = join(LESSONS_DIR, 'INDEX.md')
const EXCLUDE = new Set(['INDEX.md', 'README.md'])

export function collectLessonFiles(dir: string): LessonFile[] {
  return readdirSync(dir)
    .filter(name => name.endsWith('.md') && !EXCLUDE.has(name))
    .map(name => ({
      prefix: name.match(/^(\d+)/)?.[1] ?? name.replace(/\.md$/, ''),
      content: readFileSync(join(dir, name), 'utf8'),
    }))
}

function main(): void {
  const index = buildIndex(collectLessonFiles(LESSONS_DIR))
  const check = process.argv.includes('--check')

  if (check) {
    let current = ''
    try {
      current = readFileSync(INDEX_PATH, 'utf8')
    } catch {
      /* missing file → stale */
    }
    if (current !== index) {
      console.error(
        'tasks/lessons/INDEX.md is stale. Run: npm run lessons:index'
      )
      process.exit(1)
    }
    console.error('INDEX.md is up to date.')
    return
  }

  writeFileSync(INDEX_PATH, index)
  console.error(`Wrote ${INDEX_PATH}`)
}

export { LESSONS_DIR, INDEX_PATH }

// Only run when invoked as a script, not when imported by a test.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
