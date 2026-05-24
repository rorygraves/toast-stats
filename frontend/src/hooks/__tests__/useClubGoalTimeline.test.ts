/**
 * Tests for useClubGoalTimeline (#621, Sprint 4 of Club Redesign epic #617).
 *
 * The hook builds the Goal Achievement Timeline: 5 program-year checkpoints
 * (Sep 1, Nov 1, Jan 1, Mar 1, current=as-of) each resolved to the club's
 * goals-met count, with nearest-prior-snapshot fallback when a checkpoint has
 * no exact snapshot. The pure `computeGoalTimeline` carries the logic; the
 * hook is a thin useMemo wrapper. Program year / as-of date are passed in by
 * the parent (R3 — never re-derive context a parent already has).
 */
import { describe, it, expect } from 'vitest'
import { computeGoalTimeline } from '../useClubGoalTimeline'
import type { ProgramYear } from '../../utils/programYear'
import type { DcpGoalsTrendPoint } from '@toastmasters/analytics-core'

const PY: ProgramYear = {
  year: 2025,
  startDate: '2025-07-01',
  endDate: '2026-06-30',
  label: '2025-2026',
}

// Snapshots landing exactly on each checkpoint + the as-of date.
const fullTrend: DcpGoalsTrendPoint[] = [
  { date: '2025-09-01', goalsAchieved: 3 },
  { date: '2025-11-01', goalsAchieved: 5 },
  { date: '2026-01-01', goalsAchieved: 7 },
  { date: '2026-03-01', goalsAchieved: 9 },
  { date: '2026-04-26', goalsAchieved: 10 },
]

describe('computeGoalTimeline', () => {
  it('renders 5 rows for a club with full historical data', () => {
    const rows = computeGoalTimeline(fullTrend, PY, '2026-04-26')
    expect(rows).toHaveLength(5)
    expect(rows.map(r => r.goalsMet)).toEqual([3, 5, 7, 9, 10])
    expect(rows.map(r => r.totalGoals)).toEqual([10, 10, 10, 10, 10])
  })

  it('targets the canonical Sep/Nov/Jan/Mar dates + the as-of date', () => {
    const rows = computeGoalTimeline(fullTrend, PY, '2026-04-26')
    expect(rows.map(r => r.targetDate)).toEqual([
      '2025-09-01',
      '2025-11-01',
      '2026-01-01',
      '2026-03-01',
      '2026-04-26',
    ])
  })

  it('computes gain as the delta vs the previous row; first row null', () => {
    const rows = computeGoalTimeline(fullTrend, PY, '2026-04-26')
    expect(rows.map(r => r.gain)).toEqual([null, 2, 2, 2, 1])
  })

  it('produces a negative gain when goals drop (data correction)', () => {
    const dipped: DcpGoalsTrendPoint[] = [
      { date: '2025-09-01', goalsAchieved: 6 },
      { date: '2025-11-01', goalsAchieved: 4 },
    ]
    const rows = computeGoalTimeline(dipped, PY, '2025-11-01')
    expect(rows[1]?.gain).toBe(-2)
  })

  it('falls back to the nearest prior snapshot and flags it', () => {
    // Only one mid-year snapshot exists. Sep 1 has no at-or-before snapshot
    // (dropped); Nov 1 / Jan 1 / Mar 1 / as-of all fall back to 2025-10-15.
    const sparse: DcpGoalsTrendPoint[] = [
      { date: '2025-10-15', goalsAchieved: 4 },
    ]
    const rows = computeGoalTimeline(sparse, PY, '2026-02-01')
    // Sep 1 precedes the only snapshot → dropped.
    expect(rows.find(r => r.targetDate === '2025-09-01')).toBeUndefined()
    const nov = rows.find(r => r.targetDate === '2025-11-01')
    expect(nov?.actualDate).toBe('2025-10-15')
    expect(nov?.isFallback).toBe(true)
    expect(nov?.goalsMet).toBe(4)
  })

  it('marks an exact checkpoint match as not a fallback', () => {
    const rows = computeGoalTimeline(fullTrend, PY, '2026-04-26')
    expect(rows.every(r => r.isFallback === false)).toBe(true)
    expect(rows.every(r => r.actualDate === r.targetDate)).toBe(true)
  })

  it('returns an empty array when the club has no goals history', () => {
    expect(computeGoalTimeline([], PY, '2026-04-26')).toEqual([])
    expect(computeGoalTimeline(undefined, PY, '2026-04-26')).toEqual([])
  })

  it('does not duplicate the as-of row when it coincides with Mar 1', () => {
    // as-of equals the Mar 1 checkpoint exactly — only one row for that date.
    const rows = computeGoalTimeline(fullTrend, PY, '2026-03-01')
    const marchRows = rows.filter(r => r.actualDate === '2026-03-01')
    expect(marchRows).toHaveLength(1)
  })

  it('collapses checkpoints that resolve to the same snapshot date', () => {
    // Only Sep + Nov snapshots exist. Jan/Mar checkpoints and the as-of date
    // (a district date with no exact club point) all fall back to Nov 1 —
    // without de-dup that would render four identical "Nov 1" rows.
    const gappy: DcpGoalsTrendPoint[] = [
      { date: '2025-09-01', goalsAchieved: 3 },
      { date: '2025-11-01', goalsAchieved: 6 },
    ]
    const rows = computeGoalTimeline(gappy, PY, '2026-05-10')
    // Distinct actualDates only.
    const dates = rows.map(r => r.actualDate)
    expect(new Set(dates).size).toBe(dates.length)
    expect(dates).toEqual(['2025-09-01', '2025-11-01'])
    // The kept Nov row is the earliest checkpoint it satisfies (Nov 1, exact),
    // so it carries no spurious fallback marker.
    expect(rows[1]?.isFallback).toBe(false)
    expect(rows.map(r => r.gain)).toEqual([null, 3])
  })
})
