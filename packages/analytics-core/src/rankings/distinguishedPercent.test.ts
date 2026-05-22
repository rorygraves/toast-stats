import { describe, it, expect } from 'vitest'
import { calculateDistinguishedPercent } from './distinguishedPercent.js'

describe('calculateDistinguishedPercent', () => {
  it('returns 0 when paidClubBase is 0 (new-district / missing-base case)', () => {
    expect(calculateDistinguishedPercent(0, 0)).toBe(0)
    expect(calculateDistinguishedPercent(5, 0)).toBe(0)
  })

  it('D110-shape: typical mid-PY district (e.g. 12 distinguished / 40 base = 30%)', () => {
    expect(calculateDistinguishedPercent(12, 40)).toBe(30)
  })

  it('D93-shape: gained clubs since PY start — % rises above naive activeClubs denom', () => {
    expect(calculateDistinguishedPercent(18, 45)).toBe(40)
  })

  it('returns 100 when every PY-base club is distinguished', () => {
    expect(calculateDistinguishedPercent(40, 40)).toBe(100)
  })

  it('returns 0 when no clubs distinguished yet (pre-April typical)', () => {
    expect(calculateDistinguishedPercent(0, 40)).toBe(0)
  })

  it('uses paidClubBase (not activeClubs) as denominator', () => {
    // The whole point of #545/#547: if a district has 50 active clubs but
    // PY-start base was 40, recognition is computed against 40.
    expect(calculateDistinguishedPercent(20, 40)).toBe(50)
  })
})
