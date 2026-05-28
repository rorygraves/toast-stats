import { describe, it, expect } from 'vitest'
import { distinguishedTierName } from '../distinguishedTier'

/* #795 (epic #821 Sprint 3) — domain helper for rendering the "Club
   Distinguished Status" code (`'' | D | S | P | M`) as a display name.
   Mirrors the private TIER_NAMES map in analytics-core's diffSnapshots so the
   "What Changed" surfaces (table cell + CSV) cannot drift apart (lesson 117). */

describe('distinguishedTierName (#795)', () => {
  it('maps each canonical code to its display name', () => {
    expect(distinguishedTierName('D')).toBe('Distinguished')
    expect(distinguishedTierName('S')).toBe('Select Distinguished')
    expect(distinguishedTierName('P')).toBe("President's Distinguished")
    expect(distinguishedTierName('M')).toBe('Distinguished')
  })

  it('maps the empty code to "None"', () => {
    expect(distinguishedTierName('')).toBe('None')
  })

  it('falls back to "Distinguished" for an unknown non-empty code', () => {
    expect(distinguishedTierName('Z')).toBe('Distinguished')
  })
})
