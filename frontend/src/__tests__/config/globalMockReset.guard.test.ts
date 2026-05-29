/**
 * V5 guard (#914, epic #917 S3) — setup.ts must reset mock call-history between
 * EVERY test globally, so a file that forgets its own `vi.clearAllMocks()` can't
 * leak a mock's call/return state into the next test.
 *
 * The Sprint 1 deep-dive (V5) found `setup.ts` cleared localStorage in a global
 * `beforeEach` but had no global mock reset — every file had to remember its own.
 * A missed reset is exactly the kind of cross-test contamination that makes a
 * `mockReturnValueOnce`-consuming test fail "for no reason" two tests away (L120).
 *
 * This guard is the falsifying test: `leakyMock` is module-scoped and nothing in
 * THIS file clears it, so whether its call history survives from one test into
 * the next depends solely on the global safety net.
 */
import { describe, it, expect, vi } from 'vitest'

const leakyMock = vi.fn()

describe('global mock-reset safety net (V5, #914)', () => {
  it('A — records a call on a module-scoped mock that this file never clears', () => {
    leakyMock()
    expect(leakyMock).toHaveBeenCalledTimes(1)
  })

  it('B — sees a clean mock; the global afterEach wiped A’s call history', () => {
    // Without a global afterEach(vi.clearAllMocks()) in setup.ts this is 1
    // (A’s call leaked in). The whole point of V5 is that it is 0.
    expect(leakyMock).toHaveBeenCalledTimes(0)
  })
})
