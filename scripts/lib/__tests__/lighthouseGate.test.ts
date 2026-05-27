import { join } from 'node:path'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

/**
 * Contract test for #783 — Lighthouse best-practices gate.
 *
 * The acceptance criterion is a *gate*, not just a reported metric. Lesson 082:
 * a quality check that is declared but inert provides no protection. So this
 * asserts the assertion is present AND set to `error` (enforcing) — a future
 * edit that downgrades it to `warn` or drops it goes red here.
 *
 * Measured best-practices score on the current build is a stable 0.96 (3/3
 * runs), so a 0.9 floor enforces a real regression budget without flaking.
 */

const ROOT = join(__dirname, '..', '..', '..')
// lighthouserc.js is CommonJS; load it through require, not ESM import.
const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = require(join(ROOT, 'lighthouserc.js'))

describe('lighthouserc.js best-practices gate (#783)', () => {
  const assertions = config?.ci?.assert?.assertions ?? {}

  it('collects the best-practices category', () => {
    const cats = config?.ci?.collect?.settings?.onlyCategories ?? []
    expect(cats).toContain('best-practices')
  })

  it('asserts categories:best-practices', () => {
    expect(assertions['categories:best-practices']).toBeDefined()
  })

  it('enforces the gate at error level (not warn) — Lesson 082', () => {
    const [level] = assertions['categories:best-practices']
    expect(level).toBe('error')
  })

  it('sets a real minScore floor (>= 0.9, <= measured 0.96)', () => {
    const [, opts] = assertions['categories:best-practices']
    expect(opts.minScore).toBeGreaterThanOrEqual(0.9)
    expect(opts.minScore).toBeLessThanOrEqual(0.96)
  })
})
