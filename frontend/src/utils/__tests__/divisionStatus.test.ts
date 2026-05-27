/**
 * Division Status Unit Tests
 *
 * Unit tests for division recognition status (the card's top-right badge).
 *
 * Divisions follow the Distinguished DIVISION Program (DDP): distinguished-club
 * thresholds of 45% / 50% / 55% of club base with paid offsets of base /
 * base+1 / base+2. This is NOT the Distinguished Area Program (50% / 50%+1 +
 * visit requirements). `calculateDivisionStatus` delegates its tier to
 * `determineDivisionRecognitionLevel` (the single DDP source shared with the
 * card's gap/summary line), so the badge and the gap line agree by
 * construction. Source of truth: District Recognition Program manual (item
 * 1490); see docs/investigations/798-division-recognition-thresholds.md (#798).
 *
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDivisionStatus,
  calculateRequiredDistinguishedClubs,
} from '../divisionStatus'

// calculateDivisionStatus signature is (distinguishedClubs,
// requiredDistinguishedClubs, paidClubs, clubBase, netGrowth). The 2nd and 5th
// args are vestigial (DAP-era) and ignored — the DDP thresholds are derived
// from clubBase. A small wrapper keeps the call sites readable in DDP terms.
function divisionStatus(
  distinguishedClubs: number,
  paidClubs: number,
  clubBase: number
) {
  return calculateDivisionStatus(distinguishedClubs, 0, paidClubs, clubBase, 0)
}

describe('calculateDivisionStatus (Distinguished Division Program)', () => {
  describe('canonical D61 cases (#798) — badge must match the TI dashboard', () => {
    it('classifies Division G (base 16, paid 17, dist 8) as Select Distinguished', () => {
      // Select: dist >= ceil(.50*16)=8 ✓ AND paid >= base+1=17 ✓.
      // President's needs dist >= ceil(.55*16)=9, so caps at Select.
      expect(divisionStatus(8, 17, 16)).toBe('select-distinguished')
    })

    it('classifies Division H (base 17, paid 18, dist 8) as Distinguished', () => {
      // Distinguished: dist >= ceil(.45*17)=8 ✓ AND paid >= base=17 ✓.
      // Select needs dist >= ceil(.50*17)=9, so caps at Distinguished.
      expect(divisionStatus(8, 18, 17)).toBe('distinguished')
    })
  })

  describe('tier boundaries (base 20 → 45%/50%/55% = 9/10/11 distinguished)', () => {
    it('Distinguished at exactly 45% with no net loss', () => {
      expect(divisionStatus(9, 20, 20)).toBe('distinguished')
    })

    it('Not Distinguished one below 45%', () => {
      expect(divisionStatus(8, 20, 20)).toBe('not-distinguished')
    })

    it('Select at exactly 50% and base+1 paid', () => {
      expect(divisionStatus(10, 21, 20)).toBe('select-distinguished')
    })

    it('caps at Distinguished when distinguished hits 50% but paid is only base', () => {
      // Select requires paid >= base+1; with paid == base it stays Distinguished.
      expect(divisionStatus(10, 20, 20)).toBe('distinguished')
    })

    it("President's at exactly 55% and base+2 paid", () => {
      expect(divisionStatus(11, 22, 20)).toBe('presidents-distinguished')
    })

    it('caps at Select when distinguished hits 55% but paid is only base+1', () => {
      // President's requires paid >= base+2; with paid == base+1 it stays Select.
      expect(divisionStatus(11, 21, 20)).toBe('select-distinguished')
    })

    it('caps at Select when paid is base+2 but distinguished is only 50%', () => {
      // President's requires dist >= 55% (11); dist 10 → Select.
      expect(divisionStatus(10, 22, 20)).toBe('select-distinguished')
    })
  })

  describe('no-net-club-loss gate (eligibility)', () => {
    it('Not Distinguished on net loss regardless of distinguished count', () => {
      expect(divisionStatus(20, 19, 20)).toBe('not-distinguished')
    })

    it('Not Distinguished at one paid club below base', () => {
      expect(divisionStatus(11, 9, 10)).toBe('not-distinguished')
    })
  })

  describe('integer rounding of the required-distinguished count (Math.ceil)', () => {
    it('odd base 11 → Distinguished needs 5 (ceil(.45*11)=5)', () => {
      expect(divisionStatus(5, 11, 11)).toBe('distinguished')
      expect(divisionStatus(4, 11, 11)).toBe('not-distinguished')
    })

    it('odd base 11 → Select needs 6 (ceil(.50*11)) and base+1 paid', () => {
      expect(divisionStatus(6, 12, 11)).toBe('select-distinguished')
      // dist 5 (<50%) with base+1 paid stays Distinguished
      expect(divisionStatus(5, 12, 11)).toBe('distinguished')
    })

    it("odd base 11 → President's needs 7 (ceil(.55*11)=7) and base+2 paid", () => {
      expect(divisionStatus(7, 13, 11)).toBe('presidents-distinguished')
    })

    it('base 17 → Distinguished 8 (ceil 7.65), Select 9 (ceil 8.5)', () => {
      expect(divisionStatus(8, 17, 17)).toBe('distinguished')
      expect(divisionStatus(9, 18, 17)).toBe('select-distinguished')
    })
  })

  describe('edge case: zero club base', () => {
    it('a division with no clubs is Not Distinguished', () => {
      // No recognition is possible without a club base.
      expect(divisionStatus(0, 0, 0)).toBe('not-distinguished')
    })
  })

  describe('edge case: club base = 1 (all thresholds round up to 1)', () => {
    it('Distinguished at base+0 paid, 1 distinguished', () => {
      expect(divisionStatus(1, 1, 1)).toBe('distinguished')
    })

    it('Select at base+1 paid, 1 distinguished', () => {
      expect(divisionStatus(1, 2, 1)).toBe('select-distinguished')
    })

    it("President's at base+2 paid, 1 distinguished", () => {
      expect(divisionStatus(1, 3, 1)).toBe('presidents-distinguished')
    })

    it('Not Distinguished with 0 distinguished clubs', () => {
      expect(divisionStatus(0, 1, 1)).toBe('not-distinguished')
    })
  })

  describe('large club base (base 100 → 45/50/55 distinguished)', () => {
    it('Distinguished at 45 distinguished, base paid', () => {
      expect(divisionStatus(45, 100, 100)).toBe('distinguished')
    })

    it('Select at 50 distinguished, base+1 paid', () => {
      expect(divisionStatus(50, 101, 100)).toBe('select-distinguished')
    })

    it("President's at 55 distinguished, base+2 paid", () => {
      expect(divisionStatus(55, 102, 100)).toBe('presidents-distinguished')
    })

    it('Not Distinguished at 44 distinguished', () => {
      expect(divisionStatus(44, 100, 100)).toBe('not-distinguished')
    })
  })
})

describe('calculateRequiredDistinguishedClubs', () => {
  // 50%-of-base helper. Still used for the AREA program and for the
  // "X of Y distinguished" progress pill; it is NOT the division Distinguished
  // threshold (which is 45%). See #798 out-of-scope notes.
  it('returns Math.ceil(clubBase * 0.5)', () => {
    expect(calculateRequiredDistinguishedClubs(10)).toBe(5)
    expect(calculateRequiredDistinguishedClubs(11)).toBe(6)
    expect(calculateRequiredDistinguishedClubs(1)).toBe(1)
  })

  it('returns 0 for a zero club base', () => {
    expect(calculateRequiredDistinguishedClubs(0)).toBe(0)
  })
})
