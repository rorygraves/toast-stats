/**
 * Unit tests for scripts/lib/promotionAlert.ts (#1073)
 *
 * When the staging→prod promotion gate blocks (count gate or the #1034 value
 * gate), the corrected staging data silently fails to reach prod with no
 * alert (epic #1072). These pure functions decide, from the two gate outputs
 * and the value-diff report, whether to file/refresh a `promotion-held` issue
 * or auto-close it on a promoting run — and distinguish the
 * operator-review-needed value gate from a possible-regression count gate.
 */

import { describe, it, expect } from 'vitest'
import {
  classifyGate,
  evaluatePromotion,
  buildPromotionHeldTitle,
  buildPromotionHeldBody,
  type ValueDiffOutput,
} from '../promotionAlert'

// A value-diff where 2 overlap dates changed (staging ahead of prod in
// CONTENT even though dates/districts counts match) — the D61 150-vs-151 case.
const CHANGED_DIFF: ValueDiffOutput = {
  promote: false,
  reasons: ['value changes on overlap dates require allow_value_changes'],
  report: {
    added: [],
    removed: [],
    changed: [
      { date: '2026-05-30', changedDistricts: ['61', '50'] },
      { date: '2026-05-31', changedDistricts: ['61', '25', '129'] },
    ],
    unchanged: ['2026-05-29'],
    overlapCount: 3,
  },
}

const CLEAN_DIFF: ValueDiffOutput = {
  promote: true,
  reasons: [],
  report: {
    added: [],
    removed: [],
    changed: [],
    unchanged: ['2026-05-31'],
    overlapCount: 1,
  },
}

const OPTS = { now: new Date('2026-06-01T14:00:00Z') }

// ── classifyGate ───────────────────────────────────────────────────────────

describe('classifyGate', () => {
  it('returns "none" when both gates allow promotion', () => {
    expect(classifyGate(true, true)).toBe('none')
  })
  it('returns "value" when only the value gate refused', () => {
    expect(classifyGate(true, false)).toBe('value')
  })
  it('returns "count" when only the count gate refused', () => {
    expect(classifyGate(false, true)).toBe('count')
  })
  it('returns "both" when both gates refused', () => {
    expect(classifyGate(false, false)).toBe('both')
  })
})

// ── evaluatePromotion ────────────────────────────────────────────────────────

describe('evaluatePromotion', () => {
  it('is promoted (not blocked) when both gates pass', () => {
    const r = evaluatePromotion({
      countPromote: true,
      valuePromote: true,
      valueDiff: CLEAN_DIFF,
    })
    expect(r.promoted).toBe(true)
    expect(r.blocked).toBe(false)
    expect(r.gate).toBe('none')
  })

  it('is blocked by the value gate and reports staging-ahead with affected districts', () => {
    const r = evaluatePromotion({
      countPromote: true,
      valuePromote: false,
      valueDiff: CHANGED_DIFF,
    })
    expect(r.blocked).toBe(true)
    expect(r.promoted).toBe(false)
    expect(r.gate).toBe('value')
    expect(r.stagingAhead).toBe(true)
    expect(r.changedDateCount).toBe(2)
    // unique, numeric-aware sorted union of changed districts across dates
    expect(r.affectedDistricts).toEqual(['25', '50', '61', '129'])
  })

  it('is blocked by the count gate (possible regression)', () => {
    const r = evaluatePromotion({
      countPromote: false,
      valuePromote: true,
      valueDiff: CLEAN_DIFF,
    })
    expect(r.blocked).toBe(true)
    expect(r.gate).toBe('count')
  })

  it('treats a missing/unparseable value-diff as blocked when a gate refused', () => {
    const r = evaluatePromotion({
      countPromote: true,
      valuePromote: false,
      valueDiff: null,
    })
    expect(r.blocked).toBe(true)
    expect(r.gate).toBe('value')
    // no diff to read → staging-ahead can't be confirmed, but still blocked
    expect(r.stagingAhead).toBe(false)
    expect(r.changedDateCount).toBe(0)
  })

  it('detects staging-ahead even when the value gate would allow (changed>0 with override)', () => {
    // allow_value_changes=true → valuePromote true, but content still differs.
    const r = evaluatePromotion({
      countPromote: true,
      valuePromote: true,
      valueDiff: CHANGED_DIFF,
    })
    expect(r.stagingAhead).toBe(true)
    expect(r.changedDateCount).toBe(2)
    // promoting run → not blocked; the auto-close path keys on `promoted`
    expect(r.promoted).toBe(true)
  })
})

// ── buildPromotionHeldTitle / Body ───────────────────────────────────────────

describe('buildPromotionHeldTitle', () => {
  it('names the value gate in the title', () => {
    const r = evaluatePromotion({
      countPromote: true,
      valuePromote: false,
      valueDiff: CHANGED_DIFF,
    })
    expect(buildPromotionHeldTitle(r)).toMatch(/promotion held/i)
    expect(buildPromotionHeldTitle(r)).toMatch(/value/i)
  })

  it('names the count gate in the title', () => {
    const r = evaluatePromotion({
      countPromote: false,
      valuePromote: true,
      valueDiff: CLEAN_DIFF,
    })
    expect(buildPromotionHeldTitle(r)).toMatch(/count/i)
  })
})

describe('buildPromotionHeldBody', () => {
  it('value-gate body explains operator review and the allow_value_changes clear path', () => {
    const r = evaluatePromotion({
      countPromote: true,
      valuePromote: false,
      valueDiff: CHANGED_DIFF,
    })
    const body = buildPromotionHeldBody(r, OPTS)
    expect(body).toMatch(/allow_value_changes\s*=\s*true/)
    expect(body).toMatch(/review/i)
    // surfaces affected districts and the changed-date count
    expect(body).toContain('61')
    expect(body).toMatch(/2 .*date/i)
    // staging-ahead is called out
    expect(body).toMatch(/staging.*ahead/i)
  })

  it('count-gate body frames a possible regression and does NOT lead with allow_value_changes', () => {
    const r = evaluatePromotion({
      countPromote: false,
      valuePromote: true,
      valueDiff: CLEAN_DIFF,
    })
    const body = buildPromotionHeldBody(r, OPTS)
    expect(body).toMatch(/regression|subtractive|fewer/i)
    expect(body).toMatch(/investigate/i)
  })

  it('both-gates body mentions both gates', () => {
    const r = evaluatePromotion({
      countPromote: false,
      valuePromote: false,
      valueDiff: CHANGED_DIFF,
    })
    const body = buildPromotionHeldBody(r, OPTS)
    expect(body).toMatch(/count gate/i)
    expect(body).toMatch(/value gate/i)
  })
})
