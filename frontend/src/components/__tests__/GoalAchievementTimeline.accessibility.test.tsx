/**
 * axe-core accessibility scan for GoalAchievementTimeline (#621).
 *
 * Split out from the unit tests so it routes to the `integration` vitest
 * project (axe scans are heavy — see vitest.shared.mjs / Lesson 090). The
 * timeline conveys direction by sign (+N / -N) and fallbacks by text, not by
 * colour alone, so it must pass a contrast/semantics scan on both themes.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { GoalAchievementTimeline } from '../GoalAchievementTimeline'
import type { GoalTimelineRow } from '../../hooks/useClubGoalTimeline'

expect.extend(toHaveNoViolations)

const rows: GoalTimelineRow[] = [
  {
    targetDate: '2025-09-01',
    actualDate: '2025-09-01',
    goalsMet: 3,
    totalGoals: 10,
    gain: null,
    isFallback: false,
  },
  {
    targetDate: '2025-11-01',
    actualDate: '2025-11-01',
    goalsMet: 5,
    totalGoals: 10,
    gain: 2,
    isFallback: false,
  },
  {
    targetDate: '2026-03-01',
    actualDate: '2026-02-15',
    goalsMet: 2,
    totalGoals: 10,
    gain: -3,
    isFallback: true,
  },
]

describe('GoalAchievementTimeline a11y (#621)', () => {
  afterEach(() => cleanup())

  it('has no axe-core violations (positive, negative, and fallback rows)', async () => {
    const { container } = render(<GoalAchievementTimeline rows={rows} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
