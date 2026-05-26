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
  parseWikilinks,
  expandDepth1Neighbours,
  DEPTH1_NEIGHBOUR_CAP,
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

describe('parseWikilinks', () => {
  it('returns [] when the body has no wikilinks', () => {
    // A markdown [link](x) is not a [[wikilink]] — only [[…]] tokens count.
    expect(parseWikilinks('Just prose, a [link](x), and some code.')).toEqual(
      []
    )
  })

  it('extracts each [[slug]] target in document order', () => {
    const body = `## Related\n- [[087-foo]] — a\n- [[092-bar]] — b\n`
    expect(parseWikilinks(body)).toEqual(['087-foo', '092-bar'])
  })

  it('dedupes repeated targets, keeping first-seen order', () => {
    const body = `[[a-one]] then [[b-two]] then [[a-one]] again`
    expect(parseWikilinks(body)).toEqual(['a-one', 'b-two'])
  })

  it('strips an Obsidian |alias and #heading suffix from the target', () => {
    const body = `[[081-phase-gated|the phasing lesson]] and [[090-guard#how-to-apply]]`
    expect(parseWikilinks(body)).toEqual(['081-phase-gated', '090-guard'])
  })

  it('trims whitespace inside the brackets', () => {
    expect(parseWikilinks('[[  097-promote  ]]')).toEqual(['097-promote'])
  })

  it('ignores empty brackets', () => {
    expect(parseWikilinks('[[]] and [[ ]] and [[real-one]]')).toEqual([
      'real-one',
    ])
  })
})

describe('expandDepth1Neighbours', () => {
  // A tiny lesson graph. Bodies map path → wikilink targets.
  const bodies: Record<string, string> = {
    'tasks/lessons/seed-a.md': 'see [[n-one]] and [[n-two]] and [[seed-b]]',
    'tasks/lessons/seed-b.md': 'see [[n-two]] and [[n-three]]',
    'tasks/lessons/n-one.md': 'links onward to [[n-deep]]', // depth-2: must NOT be read
    'tasks/lessons/n-two.md': 'leaf',
    'tasks/lessons/n-three.md': 'leaf',
    'tasks/lessons/n-deep.md': 'depth-2 leaf',
  }
  const readBody = (p: string): string => bodies[p] ?? ''
  const exists = (p: string): boolean => p in bodies

  it('pulls in a seed’s direct [[…]] neighbours, resolved under tasks/lessons/', () => {
    // Only seed-a is a seed, so its link to seed-b counts as a neighbour here;
    // the seed-vs-neighbour exclusion is covered by its own test below.
    const { neighbours } = expandDepth1Neighbours(
      ['tasks/lessons/seed-a.md'],
      readBody,
      exists,
      10
    )
    expect(neighbours).toEqual([
      'tasks/lessons/n-one.md',
      'tasks/lessons/n-two.md',
      'tasks/lessons/seed-b.md',
    ])
  })

  it('is depth-1 only: does not follow a neighbour’s own wikilinks', () => {
    const { neighbours } = expandDepth1Neighbours(
      ['tasks/lessons/seed-a.md'],
      readBody,
      exists,
      10
    )
    // n-one links to n-deep, but we never read n-one's body → n-deep excluded
    expect(neighbours).not.toContain('tasks/lessons/n-deep.md')
  })

  it('excludes targets that are already seeds', () => {
    const { neighbours } = expandDepth1Neighbours(
      ['tasks/lessons/seed-a.md', 'tasks/lessons/seed-b.md'],
      readBody,
      exists,
      10
    )
    // seed-a links to seed-b, but seed-b is a seed → not a neighbour
    expect(neighbours).not.toContain('tasks/lessons/seed-b.md')
  })

  it('dedupes a neighbour referenced by multiple seeds', () => {
    const { neighbours } = expandDepth1Neighbours(
      ['tasks/lessons/seed-a.md', 'tasks/lessons/seed-b.md'],
      readBody,
      exists,
      10
    )
    expect(neighbours.filter(p => p === 'tasks/lessons/n-two.md')).toHaveLength(
      1
    )
  })

  it('skips wikilinks that resolve to no lesson file (e.g. memory slugs)', () => {
    const body = { 'tasks/lessons/s.md': 'see [[reference_data_pipeline]]' }
    const { neighbours } = expandDepth1Neighbours(
      ['tasks/lessons/s.md'],
      p => (body as Record<string, string>)[p] ?? '',
      p => p in body,
      10
    )
    expect(neighbours).toEqual([])
  })

  it('enforces the cap and reports it was hit (no unbounded expansion)', () => {
    const { neighbours, capped } = expandDepth1Neighbours(
      ['tasks/lessons/seed-a.md', 'tasks/lessons/seed-b.md'],
      readBody,
      exists,
      2
    )
    expect(neighbours).toHaveLength(2)
    expect(capped).toBe(true)
  })

  it('does not report capped when the set fits under the cap', () => {
    const { capped } = expandDepth1Neighbours(
      ['tasks/lessons/seed-a.md'],
      readBody,
      exists,
      10
    )
    expect(capped).toBe(false)
  })

  it('returns no neighbours when seeds have no wikilinks (behavior unchanged)', () => {
    const { neighbours, capped } = expandDepth1Neighbours(
      ['tasks/lessons/n-two.md'],
      readBody,
      exists,
      10
    )
    expect(neighbours).toEqual([])
    expect(capped).toBe(false)
  })

  it('applies the path-traversal guard to a malicious wikilink target', () => {
    const body = { 'tasks/lessons/s.md': 'see [[../../etc/passwd]]' }
    const { neighbours } = expandDepth1Neighbours(
      ['tasks/lessons/s.md'],
      p => (body as Record<string, string>)[p] ?? '',
      () => true, // even if the predicate lies, the guard rejects ..
      10
    )
    expect(neighbours).toEqual([])
  })

  it('defaults to DEPTH1_NEIGHBOUR_CAP when no cap is passed', () => {
    expect(DEPTH1_NEIGHBOUR_CAP).toBeGreaterThan(0)
    const manySeeds = Array.from(
      { length: DEPTH1_NEIGHBOUR_CAP + 3 },
      (_, i) => `tasks/lessons/seed-${i}.md`
    )
    const graph: Record<string, string> = {}
    manySeeds.forEach((s, i) => {
      graph[s] = `[[leaf-${i}]]`
      graph[`tasks/lessons/leaf-${i}.md`] = 'leaf'
    })
    const { neighbours, capped } = expandDepth1Neighbours(
      manySeeds,
      p => graph[p] ?? '',
      p => p in graph
    )
    expect(neighbours).toHaveLength(DEPTH1_NEIGHBOUR_CAP)
    expect(capped).toBe(true)
  })
})
