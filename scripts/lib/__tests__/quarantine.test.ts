/**
 * Unit tests for the test-quarantine mechanism (#913, epic #917 S2).
 *
 * A quarantine isolates a KNOWN-flaky test so it never silently blocks the
 * queue AND is never silently ignored — quarantine ≠ delete / skip (R1: no
 * bypassing failing tests). The list is data (frontend/test-quarantine.json);
 * these pure functions parse it, enforce that every entry is *justified*
 * (carries a reason + a tracking issue back to its root-cause sprint), and
 * render a LOUD report so a non-empty list is impossible to miss in CI.
 *
 * RED phase: written before scripts/lib/quarantine.ts exists.
 */

import { describe, it, expect } from 'vitest'
import {
  parseQuarantine,
  validateQuarantine,
  formatQuarantineReport,
  quarantineExcludeGlobs,
  type QuarantineEntry,
} from '../quarantine'

const VALID_ENTRY: QuarantineEntry = {
  file: 'src/components/__tests__/DateSelector.integration.test.tsx',
  reason: 'L120 await-waitFor leaked render under contention',
  issue: 914,
}

describe('parseQuarantine', () => {
  it('parses an empty quarantine file to an empty list', () => {
    expect(parseQuarantine('{ "quarantined": [] }')).toEqual([])
  })

  it('parses entries from the JSON file', () => {
    const raw = JSON.stringify({ quarantined: [VALID_ENTRY] })
    expect(parseQuarantine(raw)).toEqual([VALID_ENTRY])
  })

  it('accepts an optional test name and since date', () => {
    const entry = {
      ...VALID_ENTRY,
      test: 'shows error state',
      since: '2026-05-28',
    }
    const raw = JSON.stringify({ quarantined: [entry] })
    expect(parseQuarantine(raw)[0]).toMatchObject(entry)
  })

  it('throws on malformed JSON rather than treating it as empty', () => {
    expect(() => parseQuarantine('{ not json')).toThrow()
  })

  it('throws when the top-level "quarantined" key is missing', () => {
    expect(() => parseQuarantine('{}')).toThrow(/quarantined/)
  })
})

describe('validateQuarantine', () => {
  it('returns no problems for an empty list', () => {
    expect(validateQuarantine([])).toEqual([])
  })

  it('returns no problems when every entry is justified', () => {
    expect(validateQuarantine([VALID_ENTRY])).toEqual([])
  })

  it('flags an entry missing a reason — quarantine must be justified', () => {
    const bad = { file: 'a.test.tsx', issue: 914 } as unknown as QuarantineEntry
    const problems = validateQuarantine([bad])
    expect(problems.length).toBe(1)
    expect(problems[0]).toMatch(/reason/i)
  })

  it('flags an entry missing a tracking issue — every quarantine traces to a sprint', () => {
    const bad = {
      file: 'a.test.tsx',
      reason: 'flaky',
    } as unknown as QuarantineEntry
    const problems = validateQuarantine([bad])
    expect(problems.length).toBe(1)
    expect(problems[0]).toMatch(/issue/i)
  })

  it('flags an entry missing a file path', () => {
    const bad = { reason: 'flaky', issue: 914 } as unknown as QuarantineEntry
    const problems = validateQuarantine([bad])
    expect(problems[0]).toMatch(/file/i)
  })

  it('reports multiple problems across multiple entries', () => {
    const problems = validateQuarantine([
      { file: 'a.test.tsx' } as unknown as QuarantineEntry,
      { reason: 'x', issue: 1 } as unknown as QuarantineEntry,
    ])
    expect(problems.length).toBeGreaterThanOrEqual(2)
  })
})

describe('formatQuarantineReport', () => {
  it('reports an explicit, calm all-clear when the list is empty', () => {
    const report = formatQuarantineReport([])
    expect(report).toMatch(/quarantine/i)
    expect(report).toMatch(/empty|0|none|clear/i)
  })

  it('is LOUD when the list is non-empty — lists each test, reason, and tracking issue', () => {
    const report = formatQuarantineReport([VALID_ENTRY])
    expect(report).toContain('DateSelector.integration.test.tsx')
    expect(report).toContain('L120')
    expect(report).toContain('914') // the tracking issue is surfaced
    // count is reported so a growing list is visible at a glance
    expect(report).toMatch(/1/)
  })
})

describe('quarantineExcludeGlobs', () => {
  it('returns no excludes for an empty list — a runtime no-op', () => {
    expect(quarantineExcludeGlobs([])).toEqual([])
  })

  it('excludes each quarantined file from the gating suite at file granularity', () => {
    // A quarantined test is isolated from the BLOCKING run (never silently
    // blocks the queue) — the flake harness still runs it (never silently
    // ignored). Exclusion is file-level even when `test` narrows to one case.
    const entries: QuarantineEntry[] = [
      { file: 'src/a/Foo.test.tsx', reason: 'x', issue: 1 },
      { file: 'src/b/Bar.test.tsx', test: 'one case', reason: 'y', issue: 2 },
    ]
    expect(quarantineExcludeGlobs(entries)).toEqual([
      'src/a/Foo.test.tsx',
      'src/b/Bar.test.tsx',
    ])
  })
})
