import { describe, expect, it } from 'vitest'
import {
  CLOSE_TO_DISTINGUISHED_MAX_MEMBERS,
  isCloseToDistinguished,
} from '../closeToDistinguished'

describe('closeToDistinguished — shared threshold for "close to Distinguished"', () => {
  describe('CLOSE_TO_DISTINGUISHED_MAX_MEMBERS', () => {
    it('is 4 — within reach in a single membership drive', () => {
      expect(CLOSE_TO_DISTINGUISHED_MAX_MEMBERS).toBe(4)
    })
  })

  describe('isCloseToDistinguished', () => {
    it('returns false when goal gap is non-zero (not yet at 5 DCP goals)', () => {
      expect(isCloseToDistinguished({ goals: 1, members: 2 })).toBe(false)
    })

    it('returns false when no members are needed (already qualifies)', () => {
      expect(isCloseToDistinguished({ goals: 0, members: 0 })).toBe(false)
    })

    it('returns true at the lower boundary — 1 member needed', () => {
      expect(isCloseToDistinguished({ goals: 0, members: 1 })).toBe(true)
    })

    it('returns true at the upper boundary — 4 members needed', () => {
      expect(isCloseToDistinguished({ goals: 0, members: 4 })).toBe(true)
    })

    it('returns false when 5 members are needed (just past the boundary)', () => {
      expect(isCloseToDistinguished({ goals: 0, members: 5 })).toBe(false)
    })

    it('returns false when 12 members are needed (the original bug report)', () => {
      expect(isCloseToDistinguished({ goals: 0, members: 12 })).toBe(false)
    })
  })
})
