/**
 * Unit tests for the lessons-index generator (#648, epic #647).
 *
 * The generator reads tag frontmatter from every per-file lesson in
 * tasks/lessons/ and emits a single always-loadable INDEX.md. These tests
 * cover the three pure pieces:
 *   - parseFrontmatter  — read the YAML-ish header block
 *   - extractTitle      — derive a short title from the "# Lesson NNN — …" heading
 *   - buildIndex        — assemble the deterministic INDEX.md body
 *
 * RED phase: written before scripts/lib/lessonsIndex.ts exists.
 */

import { describe, it, expect } from 'vitest'
import {
  parseFrontmatter,
  extractTitle,
  buildIndexLine,
  buildIndex,
  type LessonFile,
} from '../lessonsIndex'

const FM_SAMPLE = `---
id: '089'
category: principle
tags: [bash, screen, automation]
auto_load: true
date: 2026-05-22
issues: [634]
---

# Lesson 089 — pipefail + screen -ls exit 1 poisons every pipeline

Body text here.
`

const FM_SUPERSEDED = `---
id: '085'
category: superseded
tags: [screen, bash, automation, flaky]
auto_load: false
superseded_by: '089'
date: 2026-05-20
issues: [620, 626]
---

# Lesson 085 — screen -dmS socket registration can lag launch success
`

describe('parseFrontmatter', () => {
  it('parses a complete frontmatter block', () => {
    const meta = parseFrontmatter(FM_SAMPLE)
    expect(meta).not.toBeNull()
    expect(meta!.id).toBe('089')
    expect(meta!.category).toBe('principle')
    expect(meta!.tags).toEqual(['bash', 'screen', 'automation'])
    expect(meta!.autoLoad).toBe(true)
    expect(meta!.issues).toEqual([634])
    expect(meta!.supersededBy).toBeNull()
  })

  it('parses auto_load:false and superseded_by', () => {
    const meta = parseFrontmatter(FM_SUPERSEDED)!
    expect(meta.category).toBe('superseded')
    expect(meta.autoLoad).toBe(false)
    expect(meta.supersededBy).toBe('089')
    expect(meta.issues).toEqual([620, 626])
  })

  it('returns null when there is no frontmatter', () => {
    expect(parseFrontmatter('# Lesson 052 — no header here\n')).toBeNull()
  })
})

describe('extractTitle', () => {
  it('strips the "Lesson NNN —" prefix from the heading', () => {
    expect(extractTitle(FM_SAMPLE)).toBe(
      'pipefail + screen -ls exit 1 poisons every pipeline'
    )
  })

  it('falls back to the raw heading when it does not match the pattern', () => {
    expect(extractTitle('# Some other heading\n')).toBe('Some other heading')
  })
})

describe('buildIndexLine', () => {
  it('formats id, tags, title and issues', () => {
    const meta = parseFrontmatter(FM_SAMPLE)!
    const line = buildIndexLine('089', meta, 'EXIT trap return is exit code')
    expect(line).toBe(
      '- **089** [bash, screen, automation] — EXIT trap return is exit code (#634)'
    )
  })

  it('marks non-auto-load lessons as ref-only', () => {
    const meta = parseFrontmatter(FM_SUPERSEDED)!
    const line = buildIndexLine('085', meta, 'screen socket lag')
    expect(line).toContain('_(ref-only)_')
    expect(line).toContain('(#620, #626)')
  })
})

describe('buildIndex', () => {
  const files: LessonFile[] = [
    { prefix: '089', content: FM_SAMPLE },
    { prefix: '085', content: FM_SUPERSEDED },
  ]

  it('emits a heading and one line per lesson, sorted by prefix', () => {
    const out = buildIndex(files)
    const lines = out.trim().split('\n')
    expect(lines[0]).toMatch(/^# /)
    const bullets = lines.filter(l => l.startsWith('- **'))
    expect(bullets).toHaveLength(2)
    // sorted ascending by prefix → 085 before 089
    expect(bullets[0]).toContain('**085**')
    expect(bullets[1]).toContain('**089**')
  })

  it('skips files without frontmatter', () => {
    const out = buildIndex([
      ...files,
      { prefix: '052', content: '# Lesson 052 — no frontmatter\n' },
    ])
    expect(out).not.toContain('**052**')
  })

  it('produces identical output on repeated runs (deterministic)', () => {
    expect(buildIndex(files)).toBe(buildIndex(files))
  })
})

// Lessons 056–082 carry the auto-memory frontmatter schema
// (name/description/type). Sprint 1 merges tag fields into them; the
// generator must read both schemas and prefer the human `name` as title.
const FM_MEMORY = `---
name: Cache-primer hook calls rarely earn their keep
description: Keeping a hook call "for cache warming" rarely pays back.
type: feedback
id: '056'
category: lesson
tags: [react, hooks, performance, frontend]
auto_load: true
issues: [523]
---

# Lesson 56 — Cache-primer hook calls rarely earn their keep
`

describe('memory-style frontmatter coexistence', () => {
  it('captures name alongside tag fields', () => {
    const m = parseFrontmatter(FM_MEMORY)!
    expect(m.name).toBe('Cache-primer hook calls rarely earn their keep')
    expect(m.tags).toEqual(['react', 'hooks', 'performance', 'frontend'])
    expect(m.category).toBe('lesson')
    expect(m.issues).toEqual([523])
  })

  it('buildIndex prefers the frontmatter name over the heading', () => {
    const out = buildIndex([{ prefix: '056', content: FM_MEMORY }])
    expect(out).toContain(
      '- **056** [react, hooks, performance, frontend] — Cache-primer hook calls rarely earn their keep (#523)'
    )
  })
})

describe('extractTitle — legacy 🗓️ heading format', () => {
  it('strips the date/Lesson prefix and a trailing issue ref', () => {
    const title = extractTitle(
      '# 🗓️ 2026-05-10 — Lesson 52: "Close to Distinguished" had two definitions (#433)\n'
    )
    expect(title).toBe('"Close to Distinguished" had two definitions')
  })

  it('still handles the clean "Lesson NN —" format', () => {
    expect(
      extractTitle('# Lesson 055 — `isMilestone` fires on `years`\n')
    ).toBe('`isMilestone` fires on `years`')
  })
})
