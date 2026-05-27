/**
 * Division Status Unit Tests
 *
 * Unit tests for division status calculation focusing on boundary conditions
 * and edge cases.
 *
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDivisionStatus,
  calculateRequiredDistinguishedClubs,
} from '../divisionStatus'

describe('calculateDivisionStatus', () => {
  describe('boundary conditions', () => {
    it('should classify as Distinguished when exactly at 50% threshold', () => {
      // Club base = 10, threshold = 5 (50%)
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = threshold // Exactly 5
      const paidClubs = clubBase // Exactly 10
      const netGrowth = 0

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(status).toBe('distinguished')
      expect(threshold).toBe(5)
      expect(distinguishedClubs).toBe(5)
    })

    it('should classify as Select Distinguished when exactly at threshold + 1', () => {
      // Club base = 10, threshold = 5, distinguished = 6 (threshold + 1)
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = threshold + 1 // Exactly 6
      const paidClubs = clubBase // Exactly 10 (no net growth)
      const netGrowth = 0

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(status).toBe('select-distinguished')
      expect(threshold).toBe(5)
      expect(distinguishedClubs).toBe(6)
    })

    it("should classify as President's Distinguished when exactly at net growth = 1", () => {
      // Club base = 10, threshold = 5, distinguished = 6, net growth = 1
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = threshold + 1 // 6
      const paidClubs = clubBase + 1 // 11 (net growth = 1)
      const netGrowth = 1

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(status).toBe('presidents-distinguished')
      expect(threshold).toBe(5)
      expect(distinguishedClubs).toBe(6)
      expect(netGrowth).toBe(1)
    })

    it('should classify as Not Distinguished when one below 50% threshold', () => {
      // Club base = 10, threshold = 5, distinguished = 4 (one below)
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = threshold - 1 // 4
      const paidClubs = clubBase // 10
      const netGrowth = 0

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(status).toBe('not-distinguished')
      expect(threshold).toBe(5)
      expect(distinguishedClubs).toBe(4)
    })

    it('should classify as Not Distinguished when at threshold but paid clubs below base', () => {
      // Club base = 10, threshold = 5, distinguished = 5, but paid = 9 (below base)
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = threshold // 5
      const paidClubs = clubBase - 1 // 9 (below base)
      const netGrowth = -1

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(status).toBe('not-distinguished')
      expect(threshold).toBe(5)
      expect(distinguishedClubs).toBe(5)
      expect(paidClubs).toBe(9)
    })

    it('should classify as Select Distinguished when at threshold + 1 but net growth = 0', () => {
      // Club base = 10, threshold = 5, distinguished = 6, net growth = 0
      // Should be Select, not President's (requires net growth ≥ 1)
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = threshold + 1 // 6
      const paidClubs = clubBase // 10 (net growth = 0)
      const netGrowth = 0

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(status).toBe('select-distinguished')
    })

    it('should classify as Not Distinguished when at threshold + 1 but paid clubs below base', () => {
      // Club base = 10, threshold = 5, distinguished = 6, but paid = 9
      // Should be Not Distinguished (paid < base)
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = threshold + 1 // 6
      const paidClubs = clubBase - 1 // 9 (below base)
      const netGrowth = -1

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(status).toBe('not-distinguished')
    })
  })

  describe('edge case: zero club base', () => {
    it('should handle zero club base gracefully', () => {
      // Edge case: division with no clubs
      const clubBase = 0
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = 0
      const paidClubs = 0
      const netGrowth = 0

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      // With zero club base, threshold is 0
      expect(threshold).toBe(0)

      // 0 distinguished clubs ≥ 0 threshold AND 0 paid clubs ≥ 0 base
      // Should be Distinguished
      expect(status).toBe('distinguished')
    })

    it('should classify as Select Distinguished with zero club base and threshold + 1', () => {
      // Edge case: zero club base, but 1 distinguished club
      const clubBase = 0
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = threshold + 1 // 1
      const paidClubs = 0
      const netGrowth = 0

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      // 1 distinguished club ≥ 0 + 1 AND 0 paid clubs ≥ 0 base
      // Should be Select Distinguished
      expect(status).toBe('select-distinguished')
    })

    it("should classify as President's Distinguished with zero club base and net growth", () => {
      // Edge case: zero club base, 1 distinguished club, 1 paid club (net growth = 1)
      const clubBase = 0
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = threshold + 1 // 1
      const paidClubs = 1
      const netGrowth = 1

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      // 1 distinguished club ≥ 0 + 1 AND net growth = 1 ≥ 1
      // Should be President's Distinguished
      expect(status).toBe('presidents-distinguished')
    })
  })

  describe('edge case: club base = 1', () => {
    it('should classify as Distinguished when club base = 1, threshold = 1, distinguished = 1', () => {
      const clubBase = 1
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = 1
      const paidClubs = 1
      const netGrowth = 0

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(threshold).toBe(1)
      expect(status).toBe('distinguished')
    })

    it('should classify as Select Distinguished when club base = 1, distinguished = 2', () => {
      const clubBase = 1
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = 2 // threshold + 1
      const paidClubs = 1
      const netGrowth = 0

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(threshold).toBe(1)
      expect(status).toBe('select-distinguished')
    })

    it("should classify as President's Distinguished when club base = 1, distinguished = 2, net growth = 1", () => {
      const clubBase = 1
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = 2 // threshold + 1
      const paidClubs = 2 // net growth = 1
      const netGrowth = 1

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(threshold).toBe(1)
      expect(status).toBe('presidents-distinguished')
    })

    it('should classify as Not Distinguished when club base = 1, distinguished = 0', () => {
      const clubBase = 1
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = 0 // below threshold
      const paidClubs = 1
      const netGrowth = 0

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      expect(threshold).toBe(1)
      expect(status).toBe('not-distinguished')
    })
  })

  describe('odd club base (rounding up)', () => {
    it('should handle odd club base correctly (club base = 11, threshold = 6)', () => {
      const clubBase = 11
      const threshold = calculateRequiredDistinguishedClubs(clubBase)

      expect(threshold).toBe(6) // Math.ceil(11 * 0.5) = 6

      // Test Distinguished at threshold
      const distinguishedStatus = calculateDivisionStatus(
        6, // exactly at threshold
        threshold,
        clubBase,
        clubBase,
        0
      )
      expect(distinguishedStatus).toBe('distinguished')

      // Test Select Distinguished at threshold + 1
      const selectStatus = calculateDivisionStatus(
        7, // threshold + 1
        threshold,
        clubBase,
        clubBase,
        0
      )
      expect(selectStatus).toBe('select-distinguished')

      // Test Not Distinguished below threshold
      const notDistinguishedStatus = calculateDivisionStatus(
        5, // below threshold
        threshold,
        clubBase,
        clubBase,
        0
      )
      expect(notDistinguishedStatus).toBe('not-distinguished')
    })
  })

  describe('large club base', () => {
    it('should handle large club base correctly (club base = 100)', () => {
      const clubBase = 100
      const threshold = calculateRequiredDistinguishedClubs(clubBase)

      expect(threshold).toBe(50) // Math.ceil(100 * 0.5) = 50

      // Test President's Distinguished
      const presidentsStatus = calculateDivisionStatus(
        51, // threshold + 1
        threshold,
        101, // net growth = 1
        clubBase,
        1
      )
      expect(presidentsStatus).toBe('presidents-distinguished')

      // Test Select Distinguished
      const selectStatus = calculateDivisionStatus(
        51, // threshold + 1
        threshold,
        100, // net growth = 0
        clubBase,
        0
      )
      expect(selectStatus).toBe('select-distinguished')

      // Test Distinguished
      const distinguishedStatus = calculateDivisionStatus(
        50, // exactly at threshold
        threshold,
        100,
        clubBase,
        0
      )
      expect(distinguishedStatus).toBe('distinguished')

      // Test Not Distinguished
      const notDistinguishedStatus = calculateDivisionStatus(
        49, // below threshold
        threshold,
        100,
        clubBase,
        0
      )
      expect(notDistinguishedStatus).toBe('not-distinguished')
    })
  })

  describe('negative net growth', () => {
    it('should classify as Not Distinguished with negative net growth even if distinguished clubs are high', () => {
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = 8 // well above threshold + 1
      const paidClubs = 8 // below base
      const netGrowth = -2

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      // Even with 8 distinguished clubs, negative net growth means paid < base
      // So cannot be Distinguished or higher
      expect(status).toBe('not-distinguished')
    })

    it('should classify as Not Distinguished with net growth = -1', () => {
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = 6 // threshold + 1
      const paidClubs = 9 // one below base
      const netGrowth = -1

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      // Cannot be any distinguished level because paid < base
      expect(status).toBe('not-distinguished')
    })
  })

  describe('high net growth', () => {
    it("should classify as President's Distinguished with high net growth", () => {
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = 6 // threshold + 1
      const paidClubs = 20 // net growth = 10
      const netGrowth = 10

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      // High net growth (≥ 1) with threshold + 1 should be President's
      expect(status).toBe('presidents-distinguished')
    })

    it('should classify as Distinguished with high net growth but at threshold (not threshold + 1)', () => {
      const clubBase = 10
      const threshold = calculateRequiredDistinguishedClubs(clubBase)
      const distinguishedClubs = 5 // exactly at threshold
      const paidClubs = 20 // net growth = 10
      const netGrowth = 10

      const status = calculateDivisionStatus(
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth
      )

      // High net growth but only at threshold (not threshold + 1)
      // Should be Distinguished, not President's
      expect(status).toBe('distinguished')
    })
  })

  // #798 — Divisions follow the Distinguished DIVISION Program (DDP): 45/50/55%
  // distinguished thresholds with base/base+1/base+2 paid offsets — NOT the
  // Distinguished Area Program's 50%/50%+1. The badge previously used DAP
  // thresholds and rendered one tier too low. Source of truth: District
  // Recognition Program manual (item 1490); see
  // docs/investigations/798-division-recognition-thresholds.md.
  // requiredDistinguishedClubs/netGrowth args are vestigial (DAP-only) and
  // ignored by the DDP computation.
  describe('DDP division thresholds (#798)', () => {
    it('classifies D61 Division G (base 16, paid 17, dist 8) as Select Distinguished', () => {
      // DDP Select: dist >= ceil(.50*16)=8 ✓ AND paid >= base+1=17 ✓
      // (President's needs dist >= ceil(.55*16)=9, so caps at Select.)
      const status = calculateDivisionStatus(8, 8, 17, 16, 1)
      expect(status).toBe('select-distinguished')
    })

    it('classifies D61 Division H (base 17, paid 18, dist 8) as Distinguished', () => {
      // DDP Distinguished: dist >= ceil(.45*17)=8 ✓ AND paid >= base=17 ✓
      // (Select needs dist >= ceil(.50*17)=9, so caps at Distinguished.)
      const status = calculateDivisionStatus(8, 9, 18, 17, 1)
      expect(status).toBe('distinguished')
    })

    it("classifies President's Distinguished at 55% + base+2 paid (base 20, paid 22, dist 11)", () => {
      // dist >= ceil(.55*20)=11 ✓, paid >= base+2=22 ✓
      const status = calculateDivisionStatus(11, 10, 22, 20, 2)
      expect(status).toBe('presidents-distinguished')
    })

    it('caps at Select when paid growth is +1 even if distinguished count reaches 55% (base 20, paid 21, dist 11)', () => {
      // President's needs paid >= base+2=22; paid=21 → not President's.
      // Select: dist >= ceil(.50*20)=10 ✓ AND paid >= base+1=21 ✓.
      const status = calculateDivisionStatus(11, 10, 21, 20, 1)
      expect(status).toBe('select-distinguished')
    })

    it('returns Not Distinguished on net club loss regardless of distinguished count (base 16, paid 15, dist 10)', () => {
      const status = calculateDivisionStatus(10, 8, 15, 16, -1)
      expect(status).toBe('not-distinguished')
    })
  })
})
