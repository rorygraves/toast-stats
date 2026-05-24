/**
 * Unit tests for the per-sprint relevant-lessons manifest parser (#650, epic #647).
 *
 * Sprint sub-issue bodies MAY carry a `## Relevant lessons` section listing the
 * lessons a spawned session must read in full. The bootstrap prompt honors it.
 * This parser extracts that manifest from an issue body so a session (or the
 * dry-run CLI) knows exactly which lesson files to load.
 *
 * Format (one bullet per lesson, markdown link + optional reason):
 *   ## Relevant lessons
 *   - [Lesson 083](tasks/lessons/083-exit-trap.md) — EXIT trap return value
 *   - [Lesson 092](tasks/lessons/092-workspace-package-dist.md) — rebuild dist
 *
 * RED phase: written before scripts/lib/relevantLessons.ts exists.
 */

import { describe, it, expect } from 'vitest'
import {
  parseRelevantLessons,
  resolveRelevantLessons,
  type RelevantLessonRef,
} from '../relevantLessons'

const BODY_WITH_MANIFEST = `Part of epic #647.

## Scope

Do the thing.

## Relevant lessons

- [Lesson 083](tasks/lessons/083-exit-trap.md) — EXIT trap return value is the script's exit code
- [Lesson 092](tasks/lessons/092-workspace-package-dist-is-gitignored-and-not-auto-rebuilt.md) — rebuild workspace dist before tests

## Acceptance

- [ ] It works.
`

describe('parseRelevantLessons', () => {
  it('returns [] when there is no manifest section', () => {
    expect(parseRelevantLessons('Just a plain body.\n\n## Scope\n\nx')).toEqual(
      []
    )
  })

  it('extracts each lesson link with its path, label, and reason', () => {
    const refs = parseRelevantLessons(BODY_WITH_MANIFEST)
    expect(refs).toEqual<RelevantLessonRef[]>([
      {
        label: 'Lesson 083',
        path: 'tasks/lessons/083-exit-trap.md',
        reason: "EXIT trap return value is the script's exit code",
      },
      {
        label: 'Lesson 092',
        path: 'tasks/lessons/092-workspace-package-dist-is-gitignored-and-not-auto-rebuilt.md',
        reason: 'rebuild workspace dist before tests',
      },
    ])
  })

  it('stops at the next heading and does not bleed into later sections', () => {
    const refs = parseRelevantLessons(BODY_WITH_MANIFEST)
    expect(refs).toHaveLength(2)
    expect(refs.some(r => r.path.includes('Acceptance'))).toBe(false)
  })

  it('parses a bullet with no reason (null reason)', () => {
    const body = `## Relevant lessons\n\n- [Lesson 070](tasks/lessons/070-router.md)\n`
    expect(parseRelevantLessons(body)).toEqual([
      {
        label: 'Lesson 070',
        path: 'tasks/lessons/070-router.md',
        reason: null,
      },
    ])
  })

  it('matches the heading case-insensitively and tolerates "Relevant Lessons"', () => {
    const body = `## Relevant Lessons\n\n- [L1](tasks/lessons/001-a.md) — r\n`
    expect(parseRelevantLessons(body)).toHaveLength(1)
  })

  it('ignores non-link bullets inside the section', () => {
    const body = `## Relevant lessons\n\n- this is prose, not a link\n- [L1](tasks/lessons/001-a.md) — r\n`
    const refs = parseRelevantLessons(body)
    expect(refs).toHaveLength(1)
    expect(refs[0].path).toBe('tasks/lessons/001-a.md')
  })

  it('accepts asterisk bullets as well as dashes', () => {
    const body = `## Relevant lessons\n\n* [L1](tasks/lessons/001-a.md) — r\n`
    expect(parseRelevantLessons(body)).toHaveLength(1)
  })
})

describe('resolveRelevantLessons', () => {
  const refs: RelevantLessonRef[] = [
    { label: 'L1', path: 'tasks/lessons/001-a.md', reason: 'r1' },
    { label: 'L2', path: 'tasks/lessons/999-missing.md', reason: 'r2' },
  ]

  it('partitions refs into found and missing by an existence predicate', () => {
    const { found, missing } = resolveRelevantLessons(
      refs,
      p => p === 'tasks/lessons/001-a.md'
    )
    expect(found.map(r => r.path)).toEqual(['tasks/lessons/001-a.md'])
    expect(missing.map(r => r.path)).toEqual(['tasks/lessons/999-missing.md'])
  })

  it('treats a non-lessons path as missing even if the predicate says it exists', () => {
    const escape: RelevantLessonRef[] = [
      { label: 'X', path: '../../etc/passwd', reason: null },
    ]
    const { found, missing } = resolveRelevantLessons(escape, () => true)
    expect(found).toEqual([])
    expect(missing).toHaveLength(1)
  })
})
