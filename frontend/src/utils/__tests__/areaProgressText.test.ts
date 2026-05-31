/**
 * Area Progress Text Generation Unit Tests
 *
 * Unit tests for the generateAreaProgressText function that creates
 * concise English paragraphs describing an area's progress toward
 * Distinguished Area recognition.
 *
 * Test scenarios cover:
 * - President's Distinguished achieved (no further gaps)
 * - Select Distinguished with incremental gap to President's
 * - Distinguished with incremental gaps to Select and President's
 * - Not distinguished with all gaps described incrementally
 * - Net club loss scenario with eligibility explanation
 * - Current-round club-visit text: named missing clubs + Distinguished impact (#974)
 * - Edge cases (0 clubs, 1 club)
 *
 * Requirements: 5.1, 5.2, 5.3, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { describe, it, expect } from 'vitest'
import { generateAreaProgressText } from '../areaProgressText'
import { AreaWithDivision } from '../../components/DivisionAreaProgressSummary'
import { calculateAreaGapAnalysis } from '../areaGapAnalysis'
import {
  DistinguishedStatus,
  calculateVisitStatus,
  MissingVisitClub,
  IneligibleMissingVisitClub,
} from '../divisionStatus'
import {
  deriveAreaRecognitionState,
  getCurrentVisitRound,
  type AreaRecognitionState,
} from '../areaRecognitionState'

/**
 * Build an AreaWithDivision for the gap/level tests. Visit data defaults to
 * "all clubs visited" with a snapshot-derived `recognitionState`, so the
 * (Sprint 1 #973) current-round fields are consistent without each test
 * having to spell them out. Current-round visit *behaviour* is exercised
 * separately via `createRoundArea` below.
 */
function createArea(
  areaId: string,
  divisionId: string,
  clubBase: number,
  paidClubs: number,
  distinguishedClubs: number
): AreaWithDivision {
  const snapshotDate = '2026-05-15' // PY 2025-26, round 2 in progress
  const allVisited = calculateVisitStatus(clubBase, clubBase)
  const recognitionState = deriveAreaRecognitionState({
    clubBase,
    paidClubs,
    distinguishedClubs,
    firstRoundVisitMet: allVisited.meetsThreshold,
    secondRoundVisitMet: allVisited.meetsThreshold,
    snapshotDate,
  })

  let status: DistinguishedStatus = 'not-distinguished'
  if (paidClubs < clubBase) {
    status = 'not-qualified'
  }

  return {
    areaId,
    divisionId,
    clubBase,
    paidClubs,
    distinguishedClubs,
    netGrowth: paidClubs - clubBase,
    requiredDistinguishedClubs: Math.ceil(clubBase * 0.5),
    firstRoundVisits: allVisited,
    secondRoundVisits: allVisited,
    status,
    isQualified: paidClubs >= clubBase,
    recognitionState,
    currentRound: getCurrentVisitRound(snapshotDate),
    clubsMissingCurrentRoundVisit: [],
    clubsMissingCurrentRoundVisitIneligible: [],
  }
}

describe('generateAreaProgressText', () => {
  /**
   * Requirement 6.5: When an area has achieved President's Distinguished,
   * no further gaps should be mentioned.
   */
  describe("President's Distinguished achieved", () => {
    it('describes achievement and confirms visits do not block recognition', () => {
      // 4 clubs, 5 paid (club base + 1), 3 distinguished (50% + 1 = 3)
      const area = createArea('A1', 'A', 4, 5, 3)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 5,
        distinguishedClubs: 3,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.currentLevel).toBe('presidents')
      expect(result.areaLabel).toBe('Area A1 (Division A)')
      expect(result.progressText).toContain("President's Distinguished")
      expect(result.progressText).toContain(
        "visits won't block Distinguished recognition"
      )
      // Should NOT mention any gaps
      expect(result.progressText).not.toContain('For Select')
      expect(result.progressText).not.toContain('For Distinguished')
    })

    it('includes the current-round visit clause', () => {
      const area = createArea('B2', 'B', 4, 5, 3)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 5,
        distinguishedClubs: 3,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.currentLevel).toBe('presidents')
      expect(result.progressText).toContain("President's Distinguished")
      expect(result.progressText).toContain('Round 2 club visits:')
      expect(result.progressText).not.toContain('For Select')
    })

    it('should mention the achievement', () => {
      const area = createArea('D4', 'D', 4, 5, 3)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 5,
        distinguishedClubs: 3,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.progressText).toContain("President's Distinguished status")
    })
  })

  /**
   * Requirement 6.3, 6.4: Select Distinguished should mention achievement
   * and incremental gap to President's (only the paid club difference)
   */
  describe('Select Distinguished with incremental gap to Presidents', () => {
    it('should describe achievement and gap to Presidents (1 paid club needed)', () => {
      // 4 clubs, 4 paid (exactly club base), 3 distinguished (50% + 1 = 3)
      // Select achieved, but Presidents needs 1 more paid club
      const area = createArea('A1', 'A', 4, 4, 3)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 3,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.currentLevel).toBe('select')
      expect(result.progressText).toContain('Select Distinguished status')
      expect(result.progressText).toContain('4 of 4 clubs paid')
      expect(result.progressText).toContain('3 of 4 distinguished')
      // Should mention gap to President's (1 paid club)
      expect(result.progressText).toContain("President's Distinguished")
      expect(result.progressText).toContain('1 paid club')
      // Should NOT mention gap to Distinguished (already achieved)
      expect(result.progressText).not.toContain('For Distinguished')
    })

    it('includes the current-round visit clause', () => {
      const area = createArea('B2', 'B', 4, 4, 3)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 3,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.progressText).toContain('Round 2 club visits:')
    })
  })

  /**
   * Requirement 6.2, 6.3, 6.4: Distinguished should mention achievement
   * and incremental gaps to Select and President's
   */
  describe('Distinguished with incremental gaps to Select and Presidents', () => {
    it('should describe achievement and incremental gaps', () => {
      // 4 clubs, 4 paid (no net loss), 2 distinguished (50% = 2)
      const area = createArea('A1', 'A', 4, 4, 2)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 2,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.currentLevel).toBe('distinguished')
      expect(result.progressText).toContain('Distinguished status')
      expect(result.progressText).toContain('4 of 4 clubs paid')
      expect(result.progressText).toContain('2 of 4 distinguished')
      // Should mention gap to Select (1 more distinguished)
      expect(result.progressText).toContain('Select Distinguished')
      // Should mention gap to President's (1 paid club)
      expect(result.progressText).toContain("President's Distinguished")
    })

    it('should build gaps incrementally (not repeat requirements)', () => {
      const area = createArea('B2', 'B', 4, 4, 2)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 2,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.progressText).toContain('Select Distinguished')
      expect(result.progressText).toContain("President's Distinguished")
    })

    it('includes the current-round visit clause', () => {
      const area = createArea('C3', 'C', 4, 4, 2)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 2,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.progressText).toContain('Round 2 club visits:')
    })
  })

  /**
   * Requirement 5.2, 5.3, 6.2, 6.3, 6.4: Not distinguished but eligible
   * should describe all gaps incrementally
   */
  describe('Not distinguished with all gaps described incrementally', () => {
    it('should describe current status and all gaps', () => {
      // 4 clubs, 4 paid (no net loss), 1 distinguished (25% - below 50%)
      const area = createArea('A1', 'A', 4, 4, 1)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 1,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.currentLevel).toBe('none')
      expect(result.progressText).toContain('not yet distinguished')
      expect(result.progressText).toContain('4 of 4 clubs paid')
      expect(result.progressText).toContain('1 of 4 distinguished')
      // Should mention all gaps
      expect(result.progressText).toContain('For Distinguished')
      expect(result.progressText).toContain('For Select Distinguished')
      expect(result.progressText).toContain("For President's Distinguished")
    })

    it('should describe gaps incrementally (not repeat requirements)', () => {
      const area = createArea('B2', 'B', 4, 4, 0)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 0,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.progressText).toContain('For Distinguished')
      expect(result.progressText).toContain('For Select Distinguished')
      expect(result.progressText).toContain("President's Distinguished")
    })
  })

  /**
   * Requirement 6.1, 6.6: Net club loss scenario should explain
   * eligibility requirement first, then gaps
   */
  describe('Net club loss scenario with eligibility explanation', () => {
    it('should explain eligibility requirement first (already has enough distinguished)', () => {
      // 4 clubs, 3 paid (net club loss), 2 distinguished
      const area = createArea('A1', 'A', 4, 3, 2)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 3,
        distinguishedClubs: 2,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.currentLevel).toBe('none')
      expect(result.progressText).toContain('net club loss')
      expect(result.progressText).toContain('3 of 4 clubs paid')
      // Should explain eligibility requirement
      expect(result.progressText).toContain('To become eligible')
      expect(result.progressText).toContain('1 paid club')
      // Since area already has 2 distinguished (50% of 4), Distinguished would be met
      expect(result.progressText).toContain(
        'Then Distinguished requirements would be met'
      )
    })

    it('should handle significant net club loss', () => {
      // 10 clubs, 7 paid (need 3 more)
      const area = createArea('B2', 'B', 10, 7, 3)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 10,
        paidClubs: 7,
        distinguishedClubs: 3,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.progressText).toContain('net club loss')
      expect(result.progressText).toContain('7 of 10 clubs paid')
      expect(result.progressText).toContain('To become eligible')
      expect(result.progressText).toContain('3 paid clubs')
    })

    it('should describe Distinguished requirements after eligibility', () => {
      // 4 clubs, 2 paid (need 2 more), 0 distinguished
      const area = createArea('D4', 'D', 4, 2, 0)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 2,
        distinguishedClubs: 0,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.progressText).toContain('To become eligible')
      expect(result.progressText).toContain('2 paid clubs')
      // After eligibility, need 2 distinguished for Distinguished (50% of 4)
      expect(result.progressText).toContain('Then for Distinguished')
      expect(result.progressText).toContain(
        '2 clubs need to become distinguished'
      )
    })
  })

  /**
   * Edge cases: 0 clubs and 1 club scenarios
   */
  describe('Edge cases', () => {
    describe('0 clubs (clubBase = 0)', () => {
      it('should handle area with 0 clubs gracefully', () => {
        const area = createArea('A1', 'A', 0, 0, 0)
        const gapAnalysis = calculateAreaGapAnalysis({
          clubBase: 0,
          paidClubs: 0,
          distinguishedClubs: 0,
        })

        const result = generateAreaProgressText(area, gapAnalysis)

        expect(result.currentLevel).toBe('none')
        expect(result.areaLabel).toBe('Area A1 (Division A)')
        expect(result.progressText).toBeDefined()
      })

      it('should show "no clubs in area" for an area with 0 clubs', () => {
        const area = createArea('B2', 'B', 0, 0, 0)
        const gapAnalysis = calculateAreaGapAnalysis({
          clubBase: 0,
          paidClubs: 0,
          distinguishedClubs: 0,
        })

        const result = generateAreaProgressText(area, gapAnalysis)

        expect(result.progressText).toContain('no clubs in area')
      })
    })

    describe('1 club (minimum case)', () => {
      it('should handle 1 club area at Distinguished level', () => {
        // 1 club, 1 paid (no net loss), 1 distinguished (50% = ceil(0.5) = 1)
        const area = createArea('A1', 'A', 1, 1, 1)
        const gapAnalysis = calculateAreaGapAnalysis({
          clubBase: 1,
          paidClubs: 1,
          distinguishedClubs: 1,
        })

        const result = generateAreaProgressText(area, gapAnalysis)

        expect(result.currentLevel).toBe('distinguished')
        expect(result.progressText).toContain('Distinguished status')
        expect(result.progressText).toContain('1 of 1 clubs paid')
        expect(result.progressText).toContain('1 of 1 distinguished')
      })

      it('should handle 1 club area not distinguished', () => {
        // 1 club, 1 paid (no net loss), 0 distinguished
        const area = createArea('B2', 'B', 1, 1, 0)
        const gapAnalysis = calculateAreaGapAnalysis({
          clubBase: 1,
          paidClubs: 1,
          distinguishedClubs: 0,
        })

        const result = generateAreaProgressText(area, gapAnalysis)

        expect(result.currentLevel).toBe('none')
        expect(result.progressText).toContain('not yet distinguished')
        expect(result.progressText).toContain('1 of 1 clubs paid')
        expect(result.progressText).toContain('0 of 1 distinguished')
        expect(result.progressText).toContain('For Distinguished')
      })

      it('should handle 1 club area with net club loss', () => {
        // 1 club, 0 paid (net club loss)
        const area = createArea('C3', 'C', 1, 0, 0)
        const gapAnalysis = calculateAreaGapAnalysis({
          clubBase: 1,
          paidClubs: 0,
          distinguishedClubs: 0,
        })

        const result = generateAreaProgressText(area, gapAnalysis)

        expect(result.currentLevel).toBe('none')
        expect(result.progressText).toContain('net club loss')
        expect(result.progressText).toContain('0 of 1 clubs paid')
        expect(result.progressText).toContain('To become eligible')
        expect(result.progressText).toContain('1 paid club')
      })

      it('should handle 1 club area at Presidents level', () => {
        // 1 club, 2 paid (club base + 1), 2 distinguished
        const area = createArea('D4', 'D', 1, 2, 2)
        const gapAnalysis = calculateAreaGapAnalysis({
          clubBase: 1,
          paidClubs: 2,
          distinguishedClubs: 2,
        })

        const result = generateAreaProgressText(area, gapAnalysis)

        expect(result.currentLevel).toBe('presidents')
        expect(result.progressText).toContain("President's Distinguished")
      })
    })
  })

  /**
   * Area label generation tests
   */
  describe('Area label generation', () => {
    it('should format area label correctly', () => {
      const area = createArea('A1', 'A', 4, 4, 2)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 2,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.areaLabel).toBe('Area A1 (Division A)')
      expect(result.progressText).toContain('Area A1 (Division A)')
    })

    it('should handle different area and division IDs', () => {
      const area = createArea('B3', 'X', 4, 4, 2)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 2,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.areaLabel).toBe('Area B3 (Division X)')
    })
  })

  /**
   * Return value structure tests
   */
  describe('Return value structure', () => {
    it('should return correct structure for AreaProgressText', () => {
      const area = createArea('A1', 'A', 4, 4, 2)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 2,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result).toHaveProperty('areaLabel')
      expect(result).toHaveProperty('currentLevel')
      expect(result).toHaveProperty('progressText')
      expect(typeof result.areaLabel).toBe('string')
      expect(typeof result.currentLevel).toBe('string')
      expect(typeof result.progressText).toBe('string')
    })

    it('should return currentLevel matching gap analysis', () => {
      const area = createArea('A1', 'A', 4, 5, 3)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 5,
        distinguishedClubs: 3,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.currentLevel).toBe(gapAnalysis.currentLevel)
    })
  })

  /**
   * Text formatting tests - ensure no double spaces or formatting issues
   */
  describe('Text formatting', () => {
    it('should not have double spaces in progress text', () => {
      const area = createArea('A1', 'A', 4, 4, 2)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 2,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.progressText).not.toMatch(/\s{2,}/)
    })

    it('should have proper sentence structure', () => {
      const area = createArea('A1', 'A', 4, 4, 2)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 2,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      // Should start with area label
      expect(result.progressText).toMatch(/^Area/)
      // Should end with a period (or a parenthetical flag)
      expect(result.progressText).toMatch(/[.)]$/)
    })
  })

  /**
   * Larger area scenarios (10+ clubs)
   */
  describe('Larger area scenarios', () => {
    it('should handle 10 club area at Distinguished', () => {
      const area = createArea('A1', 'A', 10, 10, 5)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 5,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.currentLevel).toBe('distinguished')
      expect(result.progressText).toContain('10 of 10 clubs paid')
      expect(result.progressText).toContain('5 of 10 distinguished')
    })

    it('should handle 10 club area not distinguished', () => {
      const area = createArea('B2', 'B', 10, 10, 4)
      const gapAnalysis = calculateAreaGapAnalysis({
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 4,
      })

      const result = generateAreaProgressText(area, gapAnalysis)

      expect(result.currentLevel).toBe('none')
      expect(result.progressText).toContain('not yet distinguished')
      expect(result.progressText).toContain('For Distinguished')
    })
  })
})

/**
 * Sprint 2 (#974): the area progress text must NAME the active clubs still
 * needing the current-round visit and STATE the qualifying-metric →
 * Distinguished impact, driven by the Sprint 1 (#973) source-of-truth fields
 * (`currentRound`, `clubsMissingCurrentRoundVisit`,
 * `clubsMissingCurrentRoundVisitIneligible`) and the #832 `recognitionState`.
 */
function createRoundArea(opts: {
  clubBase: number
  paidClubs: number
  distinguishedClubs: number
  currentRound: 1 | 2
  roundCompleted: number
  missing?: MissingVisitClub[]
  ineligible?: IneligibleMissingVisitClub[]
  recognitionState: AreaRecognitionState
}): AreaWithDivision {
  const {
    clubBase,
    paidClubs,
    distinguishedClubs,
    currentRound,
    roundCompleted,
  } = opts
  const roundStatus = calculateVisitStatus(roundCompleted, clubBase)
  const otherStatus = calculateVisitStatus(0, clubBase)
  return {
    areaId: 'A1',
    divisionId: 'A',
    clubBase,
    paidClubs,
    distinguishedClubs,
    netGrowth: paidClubs - clubBase,
    requiredDistinguishedClubs: Math.ceil(clubBase * 0.5),
    firstRoundVisits: currentRound === 1 ? roundStatus : otherStatus,
    secondRoundVisits: currentRound === 2 ? roundStatus : otherStatus,
    status: 'not-distinguished',
    isQualified: false,
    recognitionState: opts.recognitionState,
    currentRound,
    clubsMissingCurrentRoundVisit: opts.missing ?? [],
    clubsMissingCurrentRoundVisitIneligible: opts.ineligible ?? [],
  }
}

describe('generateAreaProgressText — current-round visit text (#974)', () => {
  it('all-visited: names no clubs and confirms visits do not block recognition', () => {
    const area = createRoundArea({
      clubBase: 4,
      paidClubs: 5,
      distinguishedClubs: 3,
      currentRound: 2,
      roundCompleted: 4,
      missing: [],
      recognitionState: {
        level: 'presidents',
        status: 'confirmed',
        pendingRounds: [],
        failureReason: null,
      },
    })
    const gapAnalysis = calculateAreaGapAnalysis({
      clubBase: 4,
      paidClubs: 5,
      distinguishedClubs: 3,
    })

    const result = generateAreaProgressText(area, gapAnalysis)

    expect(result.progressText).toContain(
      'Round 2 club visits: all clubs visited.'
    )
    expect(result.progressText).toContain(
      'met the Round 2 visit requirement (75%+)'
    )
    expect(result.progressText).toContain(
      "visits won't block Distinguished recognition"
    )
  })

  it('some-missing/provisional: names the active clubs and states the Provisional impact', () => {
    const area = createRoundArea({
      clubBase: 5,
      paidClubs: 5,
      distinguishedClubs: 3,
      currentRound: 2,
      roundCompleted: 1,
      missing: [
        { clubNumber: '1', clubName: 'North Grenville' },
        { clubNumber: '2', clubName: 'Manotick' },
        { clubNumber: '3', clubName: 'Smiths Falls' },
        { clubNumber: '4', clubName: 'Stittsville' },
      ],
      recognitionState: {
        level: 'distinguished',
        status: 'provisional',
        pendingRounds: [{ round: 2, deadline: '2026-05-31' }],
        failureReason: null,
      },
    })
    const gapAnalysis = calculateAreaGapAnalysis({
      clubBase: 5,
      paidClubs: 5,
      distinguishedClubs: 3,
    })

    const result = generateAreaProgressText(area, gapAnalysis)

    expect(result.progressText).toContain(
      'Round 2 club visits: 1 of 5 complete — 4 active clubs still need a visit report: North Grenville, Manotick, Smiths Falls, Stittsville.'
    )
    expect(result.progressText).toContain('can only be Provisional')
    // 75% of 5 = 4 required; 1 done → 3 more needed
    expect(result.progressText).toContain('needs 3 more visits by May 31')
  })

  it('flags suspended/ineligible clubs separately from the active list', () => {
    const area = createRoundArea({
      clubBase: 4,
      paidClubs: 4,
      distinguishedClubs: 2,
      currentRound: 1,
      roundCompleted: 1,
      missing: [{ clubNumber: '10', clubName: 'Kanata' }],
      ineligible: [
        { clubNumber: '20', clubName: 'Orleans', status: 'Suspended' },
        { clubNumber: '21', clubName: 'Nepean', status: 'Suspended' },
      ],
      recognitionState: {
        level: 'distinguished',
        status: 'provisional',
        pendingRounds: [{ round: 1, deadline: '2025-11-30' }],
        failureReason: null,
      },
    })
    const gapAnalysis = calculateAreaGapAnalysis({
      clubBase: 4,
      paidClubs: 4,
      distinguishedClubs: 2,
    })

    const result = generateAreaProgressText(area, gapAnalysis)

    expect(result.progressText).toContain('still needs a visit report: Kanata.')
    expect(result.progressText).toContain(
      '(2 suspended/ineligible clubs excluded.)'
    )
    expect(result.progressText).toContain('by Nov 30')
  })

  it('missed-deadline: states the area cannot be Distinguished this year', () => {
    const area = createRoundArea({
      clubBase: 4,
      paidClubs: 4,
      distinguishedClubs: 1,
      currentRound: 2,
      roundCompleted: 1,
      missing: [{ clubNumber: '5', clubName: 'Carleton Place' }],
      recognitionState: {
        level: 'none',
        status: 'not-distinguished',
        pendingRounds: [],
        failureReason: 'missed-deadline',
      },
    })
    const gapAnalysis = calculateAreaGapAnalysis({
      clubBase: 4,
      paidClubs: 4,
      distinguishedClubs: 1,
    })

    const result = generateAreaProgressText(area, gapAnalysis)

    expect(result.progressText).toContain(
      'still needs a visit report: Carleton Place.'
    )
    expect(result.progressText).toContain(
      'Round 2 visit deadline (May 31) passed without 75%'
    )
    expect(result.progressText).toContain('cannot be Distinguished this year')
  })

  it('net-loss: still names the missing clubs for the current round', () => {
    const area = createRoundArea({
      clubBase: 5,
      paidClubs: 4,
      distinguishedClubs: 2,
      currentRound: 2,
      roundCompleted: 1,
      missing: [
        { clubNumber: '7', clubName: 'Almonte' },
        { clubNumber: '8', clubName: 'Perth' },
      ],
      recognitionState: {
        level: 'none',
        status: 'not-distinguished',
        pendingRounds: [],
        failureReason: 'net-loss',
      },
    })
    const gapAnalysis = calculateAreaGapAnalysis({
      clubBase: 5,
      paidClubs: 4,
      distinguishedClubs: 2,
    })

    const result = generateAreaProgressText(area, gapAnalysis)

    expect(result.progressText).toContain('net club loss')
    expect(result.progressText).toContain(
      'still need a visit report: Almonte, Perth.'
    )
  })
})

/**
 * Sprint 3 (#975): edge cases the operator asked to CONFIRM for the visit-gap
 * text — the cases between the happy paths already pinned by #974. These lock
 * the wording so a later refactor of `generateMissingVisitClause` /
 * `generateVisitRecognitionImpact` can't silently regress them.
 */
describe('generateAreaProgressText — visit-gap edge cases (#975)', () => {
  it('only suspended/ineligible unvisited: reads "all clubs visited" with a flag-only line, metric met for the active base', () => {
    // Every ACTIVE club is visited (roundCompleted === clubBase); the only
    // unvisited clubs are suspended/ineligible, so they must NOT produce a
    // dangling "needs:" list — just the excluded-flag parenthetical — and the
    // active base must read as having met the 75% requirement.
    const area = createRoundArea({
      clubBase: 4,
      paidClubs: 4,
      distinguishedClubs: 2,
      currentRound: 2,
      roundCompleted: 4,
      missing: [],
      ineligible: [
        { clubNumber: '30', clubName: 'Vanier', status: 'Suspended' },
        { clubNumber: '31', clubName: 'Rockland', status: 'Ineligible' },
      ],
      recognitionState: {
        level: 'distinguished',
        status: 'confirmed',
        pendingRounds: [],
        failureReason: null,
      },
    })
    const gapAnalysis = calculateAreaGapAnalysis({
      clubBase: 4,
      paidClubs: 4,
      distinguishedClubs: 2,
    })

    const result = generateAreaProgressText(area, gapAnalysis)

    // No empty list / no dangling "needs a visit report:" for the active base.
    expect(result.progressText).toContain(
      'Round 2 club visits: all clubs visited.'
    )
    expect(result.progressText).not.toContain('still need a visit report')
    expect(result.progressText).not.toContain('still needs a visit report')
    // The suspended/ineligible clubs are flagged separately, not in the list.
    expect(result.progressText).toContain(
      '(2 suspended/ineligible clubs excluded.)'
    )
    // Metric reads met for the active base.
    expect(result.progressText).toContain(
      'met the Round 2 visit requirement (75%+)'
    )
  })

  it('long missing list (6 active clubs unvisited): names every club, comma-joined, no truncation', () => {
    const sixClubs: MissingVisitClub[] = [
      { clubNumber: '40', clubName: 'Aylmer' },
      { clubNumber: '41', clubName: 'Gatineau' },
      { clubNumber: '42', clubName: 'Hull' },
      { clubNumber: '43', clubName: 'Buckingham' },
      { clubNumber: '44', clubName: 'Chelsea' },
      { clubNumber: '45', clubName: 'Wakefield' },
    ]
    const area = createRoundArea({
      clubBase: 8,
      paidClubs: 8,
      distinguishedClubs: 4,
      currentRound: 1,
      roundCompleted: 2,
      missing: sixClubs,
      recognitionState: {
        level: 'distinguished',
        status: 'provisional',
        pendingRounds: [{ round: 1, deadline: '2025-11-30' }],
        failureReason: null,
      },
    })
    const gapAnalysis = calculateAreaGapAnalysis({
      clubBase: 8,
      paidClubs: 8,
      distinguishedClubs: 4,
    })

    const result = generateAreaProgressText(area, gapAnalysis)

    expect(result.progressText).toContain(
      '6 active clubs still need a visit report:'
    )
    // Every one of the six names is present, comma-joined in order.
    expect(result.progressText).toContain(
      'Aylmer, Gatineau, Hull, Buckingham, Chelsea, Wakefield.'
    )
    for (const club of sixClubs) {
      expect(result.progressText).toContain(club.clubName)
    }
  })
})
