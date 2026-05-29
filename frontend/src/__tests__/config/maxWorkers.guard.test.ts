/**
 * V8 guard (#914, epic #917 S3) — the BLOCKING CI test invocation must run with
 * a CAPPED worker count, never unbounded.
 *
 * The Sprint 1 deep-dive named the unbounded-worker CI config the single
 * highest-leverage flake amplifier: `maxWorkers: process.env.CI ? undefined : 3`
 * left CI free to spawn one fork per core, so the moment a runner was
 * oversubscribed the suite's fast tests blew the 5s timeout (contention, not a
 * regression). Local dev was already protected by a fixed 3-fork cap; CI was
 * not. This guard sources the worker policy from the SAME helper the real
 * vitest config uses (`resolveMaxWorkers`), so it can't drift from the gate it
 * claims to protect (R20 spirit: assert against the tool's own resolution).
 */
import { describe, it, expect } from 'vitest'
import { resolveMaxWorkers } from '../../../vitest.shared.mjs'

describe('resolveMaxWorkers — CI worker cap (V8, #914)', () => {
  it('caps workers under CI (never unbounded)', () => {
    const ci = resolveMaxWorkers({ CI: 'true' })
    // The bug was `undefined` in CI (= one fork per core). The cap must be a
    // concrete, bounded value — a percentage of cores or a fixed N.
    expect(ci).toBeDefined()
    expect(ci).not.toBeUndefined()
    expect(ci).toBe('50%')
  })

  it('keeps the fixed local cap when not in CI', () => {
    expect(resolveMaxWorkers({})).toBe(3)
    expect(resolveMaxWorkers({ CI: '' })).toBe(3)
  })
})
