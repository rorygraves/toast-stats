import { describe, expect, it } from 'vitest'
import {
  isCloseToDistinguished,
  type CloseToDistinguishedInput,
} from '../closeToDistinguished'

/**
 * Canonical "Close to Distinguished" predicate — the ONE definition both the
 * clubs-table preset and the club-detail banner consume (epic #900, Sprint 1
 * spec in docs/design/close-to-distinguished-predicate.md). All four AND:
 *   1. currentLevel === 'NotDistinguished'
 *   2. gapToDistinguished.members <= 3   (already floored min by the projection)
 *   3. currentGoals >= 3
 *   4. cspSubmitted === true || === undefined
 */
function makeInput(
  overrides: Partial<{
    currentLevel: CloseToDistinguishedInput['projection']['currentLevel']
    currentGoals: number
    members: number
    goals: number
    cspSubmitted: boolean | undefined
  }> = {}
): CloseToDistinguishedInput {
  const {
    currentLevel = 'NotDistinguished',
    currentGoals = 4,
    members = 2,
    goals = 1,
    cspSubmitted = true,
  } = overrides
  return {
    projection: {
      currentLevel,
      currentGoals,
      gapToDistinguished: { goals, members },
    },
    cspSubmitted,
  }
}

describe('isCloseToDistinguished — canonical shared predicate', () => {
  it('IN for a club that satisfies all four conditions', () => {
    expect(isCloseToDistinguished(makeInput())).toBe(true)
  })

  describe('condition 1 — not already Distinguished+', () => {
    it.each(['Distinguished', 'Select', 'President', 'Smedley'] as const)(
      'OUT when currentLevel is %s',
      level => {
        expect(isCloseToDistinguished(makeInput({ currentLevel: level }))).toBe(
          false
        )
      }
    )
    it('IN when currentLevel is NotDistinguished', () => {
      expect(
        isCloseToDistinguished(makeInput({ currentLevel: 'NotDistinguished' }))
      ).toBe(true)
    })
  })

  describe('condition 2 — members gap <= 3', () => {
    it('IN at the boundary (gap exactly 3)', () => {
      expect(isCloseToDistinguished(makeInput({ members: 3 }))).toBe(true)
    })
    it('OUT just past the boundary (gap 4)', () => {
      expect(isCloseToDistinguished(makeInput({ members: 4 }))).toBe(false)
    })
    it('IN when membership already met (gap 0)', () => {
      expect(isCloseToDistinguished(makeInput({ members: 0 }))).toBe(true)
    })
  })

  describe('condition 3 — DCP goals >= 3', () => {
    it('IN at the boundary (goals exactly 3)', () => {
      expect(isCloseToDistinguished(makeInput({ currentGoals: 3 }))).toBe(true)
    })
    it('OUT just below the boundary (goals 2)', () => {
      expect(isCloseToDistinguished(makeInput({ currentGoals: 2 }))).toBe(false)
    })
  })

  describe('condition 4 — CSP submitted or unknown', () => {
    it('IN when cspSubmitted true', () => {
      expect(isCloseToDistinguished(makeInput({ cspSubmitted: true }))).toBe(
        true
      )
    })
    it('OUT when cspSubmitted false', () => {
      expect(isCloseToDistinguished(makeInput({ cspSubmitted: false }))).toBe(
        false
      )
    })
    it('IN when cspSubmitted undefined (pre-2025 data)', () => {
      expect(
        isCloseToDistinguished(makeInput({ cspSubmitted: undefined }))
      ).toBe(true)
    })
  })

  it('OUT when multiple conditions fail at once', () => {
    expect(
      isCloseToDistinguished(
        makeInput({ members: 5, currentGoals: 1, cspSubmitted: false })
      )
    ).toBe(false)
  })
})
