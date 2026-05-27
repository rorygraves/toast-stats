/**
 * Division Gap Analysis Unit Tests
 *
 * Unit tests for division gap analysis calculation focusing on boundary conditions,
 * edge cases, and recognition level classification.
 *
 * DDP Criteria (from TOASTMASTERS_DASHBOARD_KNOWLEDGE.md):
 * - Eligibility: No net club loss (paidClubs >= clubBase)
 * - Distinguished Division: paidClubs >= clubBase AND distinguishedClubs >= 45% of clubBase
 * - Select Distinguished Division: paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% of clubBase
 * - President's Distinguished Division: paidClubs >= clubBase + 2 AND distinguishedClubs >= 55% of clubBase
 *
 * Key differences from DAP (Distinguished Area Program):
 * - DDP uses 45%/50%/55% thresholds vs DAP's 50%/50%+1/50%+1
 * - DDP requires base/base+1/base+2 paid clubs vs DAP's base/base/base+1
 * - DDP has NO club visit requirements (DAP requires 75% visits)
 * - Distinguished percentage is calculated against club base (same as DAP)
 *
 * Requirements: 5.2, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePaidClubsGap,
  determineDivisionRecognitionLevel,
  calculateDivisionGapAnalysis,
} from '../divisionGapAnalysis'

describe('calculatePaidClubsGap', () => {
  /**
   * Property 2: Paid Clubs Gap = max(0, clubBase - paidClubs)
   * For no net club loss requirement: paidClubs must be >= clubBase
   * Requirements: 6.1
   */

  describe('basic gap calculations', () => {
    it('should calculate gap when below club base (50 clubs, 48 paid → needs 2)', () => {
      // No net loss: need 50 paid, have 48, need 2 more
      const gap = calculatePaidClubsGap(50, 48)
      expect(gap).toBe(2)
    })

    it('should return 0 when at club base (50 clubs, 50 paid)', () => {
      // No net loss: need 50 paid, have 50, need 0
      const gap = calculatePaidClubsGap(50, 50)
      expect(gap).toBe(0)
    })

    it('should return 0 when above club base (50 clubs, 52 paid)', () => {
      // No net loss: need 50 paid, have 52, need 0
      const gap = calculatePaidClubsGap(50, 52)
      expect(gap).toBe(0)
    })

    it('should handle larger club bases (100 clubs, 95 paid → needs 5)', () => {
      // No net loss: need 100 paid, have 95, need 5
      const gap = calculatePaidClubsGap(100, 95)
      expect(gap).toBe(5)
    })
  })

  describe('edge cases', () => {
    it('should return 0 when clubBase is 0', () => {
      const gap = calculatePaidClubsGap(0, 0)
      expect(gap).toBe(0)
    })

    it('should handle 1 club (needs 1 paid)', () => {
      // No net loss: need 1 paid, have 0, need 1
      const gap = calculatePaidClubsGap(1, 0)
      expect(gap).toBe(1)
    })

    it('should return 0 when 1 club is paid', () => {
      const gap = calculatePaidClubsGap(1, 1)
      expect(gap).toBe(0)
    })
  })
})

describe('determineDivisionRecognitionLevel', () => {
  /**
   * Property 1: Recognition Level Classification
   * - If paidClubs < clubBase: "none" (net club loss - not eligible)
   * - Else if paidClubs >= clubBase + 2 AND distinguishedClubs >= Math.ceil(clubBase * 0.55): "presidents"
   * - Else if paidClubs >= clubBase + 1 AND distinguishedClubs >= Math.ceil(clubBase * 0.50): "select"
   * - Else if paidClubs >= clubBase AND distinguishedClubs >= Math.ceil(clubBase * 0.45): "distinguished"
   * - Else: "none"
   * Requirements: 5.2, 5.5, 9.1
   */

  describe('net club loss (paidClubs < clubBase)', () => {
    it('should return "none" when paidClubs < clubBase (net club loss)', () => {
      // 48/50 paid = net club loss (need 50 to meet no net loss)
      const level = determineDivisionRecognitionLevel({
        clubBase: 50,
        paidClubs: 48,
        distinguishedClubs: 30, // Even if many are distinguished
      })
      expect(level).toBe('none')
    })

    it('should return "none" when significantly below club base', () => {
      // 40/50 paid = significant net club loss
      const level = determineDivisionRecognitionLevel({
        clubBase: 50,
        paidClubs: 40,
        distinguishedClubs: 40,
      })
      expect(level).toBe('none')
    })
  })

  describe('recognition levels when no net club loss (paidClubs >= clubBase)', () => {
    it('should return "distinguished" when at 45% distinguished of club base', () => {
      // 50 clubs, 50 paid (no net loss), 23 distinguished (46% of club base)
      // 45% of 50 = ceil(50 * 0.45) = 23
      const level = determineDivisionRecognitionLevel({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 23,
      })
      expect(level).toBe('distinguished')
    })

    it('should return "select" when at 50% distinguished AND club base + 1 paid', () => {
      // 50 clubs, 51 paid (club base + 1), 25 distinguished (50% of club base)
      // 50% of 50 = ceil(50 * 0.50) = 25
      const level = determineDivisionRecognitionLevel({
        clubBase: 50,
        paidClubs: 51,
        distinguishedClubs: 25,
      })
      expect(level).toBe('select')
    })

    it('should return "presidents" when at 55% distinguished AND club base + 2 paid', () => {
      // 50 clubs, 52 paid (club base + 2), 28 distinguished (56% of club base)
      // 55% of 50 = ceil(50 * 0.55) = 28
      const level = determineDivisionRecognitionLevel({
        clubBase: 50,
        paidClubs: 52,
        distinguishedClubs: 28,
      })
      expect(level).toBe('presidents')
    })

    it('should return "distinguished" (not select) when at 50% distinguished but only club base paid', () => {
      // 50 clubs, 50 paid (exactly club base, not +1), 25 distinguished (50% of club base)
      // This meets Distinguished but NOT Select (needs club base + 1 paid)
      const level = determineDivisionRecognitionLevel({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 25,
      })
      expect(level).toBe('distinguished')
    })

    it('should return "select" (not presidents) when at 55% distinguished but only club base + 1 paid', () => {
      // 50 clubs, 51 paid (club base + 1, not +2), 28 distinguished (56% of club base)
      // This meets Select but NOT Presidents (needs club base + 2 paid)
      const level = determineDivisionRecognitionLevel({
        clubBase: 50,
        paidClubs: 51,
        distinguishedClubs: 28,
      })
      expect(level).toBe('select')
    })

    it('should return "none" when below 45% distinguished of club base', () => {
      // 50 clubs, 50 paid (no net loss), 20 distinguished (40% of club base)
      const level = determineDivisionRecognitionLevel({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 20,
      })
      expect(level).toBe('none')
    })
  })

  describe('edge cases', () => {
    it('should return "none" when clubBase is 0', () => {
      const level = determineDivisionRecognitionLevel({
        clubBase: 0,
        paidClubs: 0,
        distinguishedClubs: 0,
      })
      expect(level).toBe('none')
    })

    it('should return "none" when paidClubs is 0', () => {
      // 0 paid clubs = net club loss
      const level = determineDivisionRecognitionLevel({
        clubBase: 50,
        paidClubs: 0,
        distinguishedClubs: 0,
      })
      expect(level).toBe('none')
    })

    it('should handle 1 club division correctly - distinguished', () => {
      // 1 club, 1 paid (no net loss), 1 distinguished
      // 45% of 1 = ceil(1 * 0.45) = 1
      const level = determineDivisionRecognitionLevel({
        clubBase: 1,
        paidClubs: 1,
        distinguishedClubs: 1,
      })
      expect(level).toBe('distinguished')
    })

    it('should handle 1 club division - select requires base + 1 paid', () => {
      // 1 club, 2 paid (club base + 1), 1 distinguished
      // 50% of 1 = ceil(1 * 0.50) = 1
      const level = determineDivisionRecognitionLevel({
        clubBase: 1,
        paidClubs: 2,
        distinguishedClubs: 1,
      })
      expect(level).toBe('select')
    })

    it('should handle 1 club division - presidents requires base + 2 paid', () => {
      // 1 club, 3 paid (club base + 2), 1 distinguished
      // 55% of 1 = ceil(1 * 0.55) = 1
      const level = determineDivisionRecognitionLevel({
        clubBase: 1,
        paidClubs: 3,
        distinguishedClubs: 1,
      })
      expect(level).toBe('presidents')
    })

    it('should handle 1 club division with no distinguished', () => {
      // 1 club, 1 paid (no net loss), 0 distinguished (0%)
      const level = determineDivisionRecognitionLevel({
        clubBase: 1,
        paidClubs: 1,
        distinguishedClubs: 0,
      })
      expect(level).toBe('none')
    })
  })

  describe('boundary conditions', () => {
    it('should return "distinguished" at exactly 45% of club base (boundary)', () => {
      // 100 clubs, 100 paid (no net loss), 45 distinguished (45% of club base)
      // ceil(100 * 0.45) = 45
      const level = determineDivisionRecognitionLevel({
        clubBase: 100,
        paidClubs: 100,
        distinguishedClubs: 45,
      })
      expect(level).toBe('distinguished')
    })

    it('should return "select" at exactly 50% of club base AND base + 1 paid (boundary)', () => {
      // 100 clubs, 101 paid (club base + 1), 50 distinguished (50% of club base)
      // ceil(100 * 0.50) = 50
      const level = determineDivisionRecognitionLevel({
        clubBase: 100,
        paidClubs: 101,
        distinguishedClubs: 50,
      })
      expect(level).toBe('select')
    })

    it('should return "presidents" at exactly 55% of club base AND base + 2 paid (boundary)', () => {
      // 100 clubs, 102 paid (club base + 2), 56 distinguished
      // ceil(100 * 0.55) = 56 (due to floating point: 100 * 0.55 = 55.00000000000001)
      const level = determineDivisionRecognitionLevel({
        clubBase: 100,
        paidClubs: 102,
        distinguishedClubs: 56,
      })
      expect(level).toBe('presidents')
    })

    it('should return "none" at 44% distinguished (just below 45% threshold)', () => {
      // 100 clubs, 100 paid (no net loss), 44 distinguished (44% of club base)
      // ceil(100 * 0.45) = 45, have 44, below threshold
      const level = determineDivisionRecognitionLevel({
        clubBase: 100,
        paidClubs: 100,
        distinguishedClubs: 44,
      })
      expect(level).toBe('none')
    })

    it('should return "distinguished" at exactly 45% with odd club base', () => {
      // 47 clubs, 47 paid (no net loss), 22 distinguished
      // ceil(47 * 0.45) = ceil(21.15) = 22
      const level = determineDivisionRecognitionLevel({
        clubBase: 47,
        paidClubs: 47,
        distinguishedClubs: 22,
      })
      expect(level).toBe('distinguished')
    })

    it('should return "select" at exactly 50% with odd club base AND base + 1 paid', () => {
      // 47 clubs, 48 paid (club base + 1), 24 distinguished
      // ceil(47 * 0.50) = ceil(23.5) = 24
      const level = determineDivisionRecognitionLevel({
        clubBase: 47,
        paidClubs: 48,
        distinguishedClubs: 24,
      })
      expect(level).toBe('select')
    })

    it('should return "presidents" at exactly 55% with odd club base AND base + 2 paid', () => {
      // 47 clubs, 49 paid (club base + 2), 26 distinguished
      // ceil(47 * 0.55) = ceil(25.85) = 26
      const level = determineDivisionRecognitionLevel({
        clubBase: 47,
        paidClubs: 49,
        distinguishedClubs: 26,
      })
      expect(level).toBe('presidents')
    })
  })
})

describe('calculateDivisionGapAnalysis', () => {
  /**
   * Complete gap analysis tests covering:
   * - Property 1: Recognition Level Classification
   * - Property 2: Gap Calculation Correctness
   * - Property 4: Net Loss Blocker Display
   * - Property 5: Achievement Display
   * Requirements: 5.2, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4
   */

  describe('no net club loss requirement', () => {
    it('should calculate paid clubs gap correctly (50 clubs, 48 paid → needs 2)', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 48,
        distinguishedClubs: 0,
      })
      expect(analysis.paidClubsNeeded).toBe(2)
      expect(analysis.meetsNoNetLossRequirement).toBe(false)
    })

    it('should return 0 paid clubs needed when no net loss met (50 clubs, 50 paid)', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 0,
      })
      expect(analysis.paidClubsNeeded).toBe(0)
      expect(analysis.meetsNoNetLossRequirement).toBe(true)
    })

    it('should return 0 paid clubs needed when above club base (50 clubs, 52 paid)', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 52,
        distinguishedClubs: 0,
      })
      expect(analysis.paidClubsNeeded).toBe(0)
      expect(analysis.meetsNoNetLossRequirement).toBe(true)
    })
  })

  describe('distinguished gaps against club base (45%/50%/55%)', () => {
    it('should calculate Distinguished gap (50 club base, 20 distinguished → needs 3)', () => {
      // 45% of 50 = ceil(50 * 0.45) = 23, have 20, need 3
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 20,
      })
      expect(analysis.distinguishedGap.distinguishedClubsNeeded).toBe(3)
      expect(analysis.distinguishedGap.achieved).toBe(false)
      expect(analysis.distinguishedGap.achievable).toBe(true)
    })

    it('should calculate Select gap (50 club base, 23 distinguished → needs 2)', () => {
      // 50% of 50 = ceil(50 * 0.50) = 25, have 23, need 2
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 23,
      })
      expect(analysis.selectGap.distinguishedClubsNeeded).toBe(2)
      expect(analysis.selectGap.achieved).toBe(false)
      expect(analysis.selectGap.achievable).toBe(true)
    })

    it('should calculate Presidents gap - distinguished clubs (50 club base, 25 distinguished → needs 3)', () => {
      // 55% of 50 = ceil(50 * 0.55) = 28, have 25, need 3
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 25,
      })
      expect(analysis.presidentsGap.distinguishedClubsNeeded).toBe(3)
    })

    it('should calculate Presidents gap - paid clubs (50 club base, 50 paid → needs 2)', () => {
      // Presidents requires club base + 2 paid = 52, have 50, need 2
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 28,
      })
      expect(analysis.presidentsGap.paidClubsNeeded).toBe(2)
      expect(analysis.presidentsGap.achieved).toBe(false)
      expect(analysis.presidentsGap.achievable).toBe(true)
    })

    it('should show Distinguished as achieved when at 45% of club base', () => {
      // 45% of 50 = ceil(50 * 0.45) = 23
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 23,
      })
      expect(analysis.distinguishedGap.achieved).toBe(true)
      expect(analysis.distinguishedGap.distinguishedClubsNeeded).toBe(0)
    })

    it('should show Select as achieved when at 50% of club base AND base + 1 paid', () => {
      // 50% of 50 = ceil(50 * 0.50) = 25
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 51,
        distinguishedClubs: 25,
      })
      expect(analysis.selectGap.achieved).toBe(true)
      expect(analysis.selectGap.distinguishedClubsNeeded).toBe(0)
      expect(analysis.selectGap.paidClubsNeeded).toBe(0)
    })

    it('should show Presidents as achieved when at 55% of club base AND base + 2 paid', () => {
      // Presidents: paidClubs >= clubBase + 2 AND distinguishedClubs >= 55%
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 52,
        distinguishedClubs: 28,
      })
      expect(analysis.presidentsGap.achieved).toBe(true)
      expect(analysis.presidentsGap.distinguishedClubsNeeded).toBe(0)
      expect(analysis.presidentsGap.paidClubsNeeded).toBe(0)
    })
  })

  describe('net loss blocker (Property 4)', () => {
    it('should mark all levels as not achievable when net club loss exists', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 48, // Below club base = net club loss
        distinguishedClubs: 30,
      })

      expect(analysis.meetsNoNetLossRequirement).toBe(false)
      expect(analysis.distinguishedGap.achievable).toBe(false)
      expect(analysis.selectGap.achievable).toBe(false)
      expect(analysis.presidentsGap.achievable).toBe(false)
    })

    it('should show distinguishedClubsNeeded as 0 when not achievable (net club loss)', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 48,
        distinguishedClubs: 0,
      })

      // When not achievable, distinguishedClubsNeeded should be 0 (not meaningful)
      expect(analysis.distinguishedGap.distinguishedClubsNeeded).toBe(0)
      expect(analysis.selectGap.distinguishedClubsNeeded).toBe(0)
      expect(analysis.presidentsGap.distinguishedClubsNeeded).toBe(0)
    })

    it('should show paidClubsNeeded in gap when net club loss exists', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 45,
        distinguishedClubs: 25,
      })

      // Each gap should show how many paid clubs needed to meet no net loss
      expect(analysis.distinguishedGap.paidClubsNeeded).toBe(5)
      expect(analysis.selectGap.paidClubsNeeded).toBe(5)
      expect(analysis.presidentsGap.paidClubsNeeded).toBe(5)
    })
  })

  describe('recognition level classification', () => {
    it('should classify as "none" when net club loss exists', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 48,
        distinguishedClubs: 30,
      })
      expect(analysis.currentLevel).toBe('none')
    })

    it('should classify as "distinguished" at 45% distinguished of club base', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 23,
      })
      expect(analysis.currentLevel).toBe('distinguished')
    })

    it('should classify as "select" at 50% distinguished AND base + 1 paid', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 51,
        distinguishedClubs: 25,
      })
      expect(analysis.currentLevel).toBe('select')
    })

    it('should classify as "presidents" at 55% distinguished AND base + 2 paid', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 52,
        distinguishedClubs: 28,
      })
      expect(analysis.currentLevel).toBe('presidents')
    })

    it('should classify as "none" when below 45% distinguished of club base', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 20,
      })
      expect(analysis.currentLevel).toBe('none')
    })
  })

  describe('edge cases', () => {
    it('should handle division with 0 clubs', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 0,
        paidClubs: 0,
        distinguishedClubs: 0,
      })

      expect(analysis.currentLevel).toBe('none')
      expect(analysis.meetsNoNetLossRequirement).toBe(false)
      expect(analysis.paidClubsNeeded).toBe(0)
      expect(analysis.distinguishedGap.achievable).toBe(false)
      expect(analysis.selectGap.achievable).toBe(false)
      expect(analysis.presidentsGap.achievable).toBe(false)
    })

    it('should handle division with 0 paid clubs', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 0,
        distinguishedClubs: 0,
      })

      expect(analysis.currentLevel).toBe('none')
      expect(analysis.meetsNoNetLossRequirement).toBe(false)
      expect(analysis.paidClubsNeeded).toBe(50) // Need 50 paid clubs (club base)
    })

    it('should handle division with 1 club (minimum case) - distinguished', () => {
      // 1 club, 1 paid (no net loss), 1 distinguished
      // 45% of 1 = ceil(1 * 0.45) = 1
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 1,
        paidClubs: 1,
        distinguishedClubs: 1,
      })

      expect(analysis.currentLevel).toBe('distinguished')
      expect(analysis.meetsNoNetLossRequirement).toBe(true)
      expect(analysis.paidClubsNeeded).toBe(0)
      expect(analysis.distinguishedGap.achieved).toBe(true)
    })

    it('should handle division with 1 club - select requires base + 1 paid', () => {
      // 1 club, 1 paid, 1 distinguished
      // Select requires: clubBase + 1 = 2 paid clubs
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 1,
        paidClubs: 1,
        distinguishedClubs: 1,
      })

      expect(analysis.selectGap.achieved).toBe(false)
      expect(analysis.selectGap.paidClubsNeeded).toBe(1) // Need 2, have 1
    })

    it('should handle division with 1 club, 0 distinguished', () => {
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 1,
        paidClubs: 1,
        distinguishedClubs: 0,
      })

      expect(analysis.currentLevel).toBe('none')
      expect(analysis.meetsNoNetLossRequirement).toBe(true)
      expect(analysis.distinguishedGap.distinguishedClubsNeeded).toBe(1) // Need 1 for Distinguished
      expect(analysis.selectGap.distinguishedClubsNeeded).toBe(1) // Need 1 for Select (50% of 1 = 1)
      expect(analysis.presidentsGap.distinguishedClubsNeeded).toBe(1) // Need 1 for Presidents (55% of 1 = 1)
    })
  })

  describe('boundary values', () => {
    it('should handle exactly at club base (no net loss met)', () => {
      // 50 clubs, 50 paid = exactly at club base
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 0,
      })

      expect(analysis.meetsNoNetLossRequirement).toBe(true)
      expect(analysis.paidClubsNeeded).toBe(0)
    })

    it('should handle just below club base (net club loss)', () => {
      // 100 clubs, 99 paid = 1 below club base
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 100,
        paidClubs: 99,
        distinguishedClubs: 99,
      })

      expect(analysis.meetsNoNetLossRequirement).toBe(false)
      expect(analysis.paidClubsNeeded).toBe(1) // Need 100 paid clubs
      expect(analysis.currentLevel).toBe('none')
    })

    it('should handle exactly 45% distinguished of club base threshold', () => {
      // 100 club base, 45 distinguished = 45%
      // ceil(100 * 0.45) = 45
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 100,
        paidClubs: 100,
        distinguishedClubs: 45,
      })

      expect(analysis.currentLevel).toBe('distinguished')
      expect(analysis.distinguishedGap.achieved).toBe(true)
    })

    it('should handle just below 45% distinguished threshold', () => {
      // 100 club base, 44 distinguished = 44%
      // ceil(100 * 0.45) = 45, have 44, below threshold
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 100,
        paidClubs: 100,
        distinguishedClubs: 44,
      })

      expect(analysis.currentLevel).toBe('none')
      expect(analysis.distinguishedGap.achieved).toBe(false)
      expect(analysis.distinguishedGap.distinguishedClubsNeeded).toBe(1) // Need 45 distinguished
    })

    it('should handle odd club base for 45% calculation', () => {
      // 47 club base: ceil(47 * 0.45) = ceil(21.15) = 22
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 47,
        paidClubs: 47,
        distinguishedClubs: 22,
      })

      expect(analysis.currentLevel).toBe('distinguished')
      expect(analysis.distinguishedGap.achieved).toBe(true)
      expect(analysis.distinguishedGap.distinguishedClubsNeeded).toBe(0)
    })

    it('should handle odd club base for 50% calculation', () => {
      // 47 club base: ceil(47 * 0.50) = ceil(23.5) = 24
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 47,
        paidClubs: 48, // base + 1
        distinguishedClubs: 24,
      })

      expect(analysis.currentLevel).toBe('select')
      expect(analysis.selectGap.achieved).toBe(true)
      expect(analysis.selectGap.distinguishedClubsNeeded).toBe(0)
    })

    it('should handle odd club base for 55% calculation', () => {
      // 47 club base: ceil(47 * 0.55) = ceil(25.85) = 26
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 47,
        paidClubs: 49, // base + 2
        distinguishedClubs: 26,
      })

      expect(analysis.currentLevel).toBe('presidents')
      expect(analysis.presidentsGap.achieved).toBe(true)
      expect(analysis.presidentsGap.distinguishedClubsNeeded).toBe(0)
    })
  })

  describe('complete scenario tests from design document', () => {
    it('scenario: division at Presidents Distinguished - all gaps achieved', () => {
      // Division with 50 clubs, 52 paid (base + 2), 28 distinguished (56%)
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 52,
        distinguishedClubs: 28,
      })

      expect(analysis.meetsNoNetLossRequirement).toBe(true)
      expect(analysis.currentLevel).toBe('presidents')

      // All levels achieved
      expect(analysis.distinguishedGap.achieved).toBe(true)
      expect(analysis.selectGap.achieved).toBe(true)
      expect(analysis.presidentsGap.achieved).toBe(true)
    })

    it('scenario: division at Select Distinguished - Presidents gap shows requirements', () => {
      // Division with 50 clubs, 51 paid (base + 1), 25 distinguished (50%)
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 51,
        distinguishedClubs: 25,
      })

      expect(analysis.meetsNoNetLossRequirement).toBe(true)
      expect(analysis.currentLevel).toBe('select')

      // Distinguished and Select achieved
      expect(analysis.distinguishedGap.achieved).toBe(true)
      expect(analysis.selectGap.achieved).toBe(true)

      // Presidents NOT achieved - needs more paid clubs and distinguished clubs
      expect(analysis.presidentsGap.achieved).toBe(false)
      expect(analysis.presidentsGap.paidClubsNeeded).toBe(1) // Need 52, have 51
      expect(analysis.presidentsGap.distinguishedClubsNeeded).toBe(3) // Need 28, have 25
    })

    it('scenario: division at Distinguished - Select and Presidents gaps show requirements', () => {
      // Division with 50 clubs, 50 paid (base), 23 distinguished (46%)
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 23,
      })

      expect(analysis.meetsNoNetLossRequirement).toBe(true)
      expect(analysis.currentLevel).toBe('distinguished')

      // Distinguished achieved
      expect(analysis.distinguishedGap.achieved).toBe(true)
      expect(analysis.distinguishedGap.distinguishedClubsNeeded).toBe(0)

      // Select NOT achieved - needs more paid clubs and distinguished clubs
      expect(analysis.selectGap.achieved).toBe(false)
      expect(analysis.selectGap.paidClubsNeeded).toBe(1) // Need 51, have 50
      expect(analysis.selectGap.distinguishedClubsNeeded).toBe(2) // Need 25, have 23

      // Presidents NOT achieved - needs more paid clubs and distinguished clubs
      expect(analysis.presidentsGap.achieved).toBe(false)
      expect(analysis.presidentsGap.paidClubsNeeded).toBe(2) // Need 52, have 50
      expect(analysis.presidentsGap.distinguishedClubsNeeded).toBe(5) // Need 28, have 23
    })

    it('scenario: division not distinguished but eligible - all gaps show requirements', () => {
      // Division with 50 clubs, 50 paid (base), 20 distinguished (40%)
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 50,
        distinguishedClubs: 20,
      })

      expect(analysis.meetsNoNetLossRequirement).toBe(true)
      expect(analysis.currentLevel).toBe('none')

      // Distinguished NOT achieved
      expect(analysis.distinguishedGap.achieved).toBe(false)
      expect(analysis.distinguishedGap.distinguishedClubsNeeded).toBe(3) // Need 23, have 20
      expect(analysis.distinguishedGap.achievable).toBe(true)

      // Select NOT achieved
      expect(analysis.selectGap.achieved).toBe(false)
      expect(analysis.selectGap.paidClubsNeeded).toBe(1) // Need 51, have 50
      expect(analysis.selectGap.distinguishedClubsNeeded).toBe(5) // Need 25, have 20
      expect(analysis.selectGap.achievable).toBe(true)

      // Presidents NOT achieved
      expect(analysis.presidentsGap.achieved).toBe(false)
      expect(analysis.presidentsGap.paidClubsNeeded).toBe(2) // Need 52, have 50
      expect(analysis.presidentsGap.distinguishedClubsNeeded).toBe(8) // Need 28, have 20
      expect(analysis.presidentsGap.achievable).toBe(true)
    })

    it('scenario: division with net club loss - all gaps show not achievable', () => {
      // Division with 50 clubs, 48 paid (net loss), 25 distinguished
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 50,
        paidClubs: 48,
        distinguishedClubs: 25,
      })

      // Net club loss - not eligible
      expect(analysis.meetsNoNetLossRequirement).toBe(false)
      expect(analysis.paidClubsNeeded).toBe(2)
      expect(analysis.currentLevel).toBe('none')

      // All levels not achievable due to net club loss
      expect(analysis.distinguishedGap.achievable).toBe(false)
      expect(analysis.selectGap.achievable).toBe(false)
      expect(analysis.presidentsGap.achievable).toBe(false)

      // Paid clubs needed shown in each gap
      expect(analysis.distinguishedGap.paidClubsNeeded).toBe(2)
      expect(analysis.selectGap.paidClubsNeeded).toBe(2)
      expect(analysis.presidentsGap.paidClubsNeeded).toBe(2)
    })

    it('scenario: large division with 100 clubs', () => {
      // 100 club base (integer-percent thresholds, no float overshoot — #798)
      // Distinguished: ceil(100 * 45 / 100) = 45
      // Select: ceil(100 * 50 / 100) = 50
      // Presidents: ceil(100 * 55 / 100) = 55
      const analysis = calculateDivisionGapAnalysis({
        clubBase: 100,
        paidClubs: 100,
        distinguishedClubs: 45,
      })

      expect(analysis.meetsNoNetLossRequirement).toBe(true)
      expect(analysis.currentLevel).toBe('distinguished')

      expect(analysis.distinguishedGap.achieved).toBe(true)
      expect(analysis.distinguishedGap.distinguishedClubsNeeded).toBe(0)

      expect(analysis.selectGap.achieved).toBe(false)
      expect(analysis.selectGap.distinguishedClubsNeeded).toBe(5) // Need 50, have 45
      expect(analysis.selectGap.paidClubsNeeded).toBe(1) // Need 101, have 100

      expect(analysis.presidentsGap.achieved).toBe(false)
      expect(analysis.presidentsGap.distinguishedClubsNeeded).toBe(10) // Need 55, have 45
      expect(analysis.presidentsGap.paidClubsNeeded).toBe(2) // Need 102, have 100
    })
  })
})
