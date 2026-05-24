/**
 * Guard test (#648): the committed tasks/lessons/INDEX.md must stay in sync
 * with the per-file lesson frontmatter, and every lesson must carry tags.
 *
 * This is the CI-enforceable backstop for the "deterministic INDEX" and
 * "every lesson tagged" acceptance criteria — it reads the real files.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildIndex, parseFrontmatter } from '../lessonsIndex'
import {
  collectLessonFiles,
  LESSONS_DIR,
  INDEX_PATH,
} from '../../regenerate-lessons-index'

describe('lessons INDEX guard', () => {
  const files = collectLessonFiles(LESSONS_DIR)

  it('finds the full per-file lesson corpus', () => {
    expect(files.length).toBeGreaterThanOrEqual(50)
  })

  it('every lesson has parseable frontmatter with at least one tag', () => {
    const untagged = files
      .filter(f => {
        const meta = parseFrontmatter(f.content)
        return !meta || meta.tags.length === 0
      })
      .map(f => f.prefix)
    expect(untagged).toEqual([])
  })

  it('committed INDEX.md matches the generator output (run npm run lessons:index)', () => {
    const committed = readFileSync(INDEX_PATH, 'utf8')
    expect(committed).toBe(buildIndex(files))
  })

  it('INDEX.md stays within the 200-line budget', () => {
    const lineCount = readFileSync(INDEX_PATH, 'utf8').split('\n').length
    expect(lineCount).toBeLessThanOrEqual(200)
  })
})
