/**
 * Unit tests for goalsMetAtDate (#621, Sprint 4 of Club Redesign epic #617).
 *
 * `goalsMetAtDate` is the exact-date primitive behind the frontend's Goal
 * Achievement Timeline. It operates on a club's `dcpGoalsTrend` — the
 * per-snapshot projection of that club's INDEPENDENT goals-met count
 * (`goalsAchieved` is pre-parsed from the raw `Goals Met` field upstream, so
 * the tripwire "never infer goals as 1-N" is already satisfied at the source).
 *
 * The three required cases from #621 map onto this club-scoped shape:
 *   - known historical date  → the count at that snapshot
 *   - missing snapshot       → null (date absent from the history)
 *   - club not in snapshot   → null (empty / absent history)
 */
import { describe, it, expect } from 'vitest'
import { goalsMetAtDate, TOTAL_DCP_GOALS } from '../analytics/goalsMetAtDate.js'
import type { DcpGoalsTrendPoint } from '../types/clubHealth.js'

const history: DcpGoalsTrendPoint[] = [
  { date: '2025-09-01', goalsAchieved: 3 },
  { date: '2025-11-01', goalsAchieved: 5 },
  { date: '2026-01-01', goalsAchieved: 7 },
  { date: '2026-03-01', goalsAchieved: 9 },
  { date: '2026-04-26', goalsAchieved: 10 },
]

describe('goalsMetAtDate', () => {
  it('returns the goals-met count for a known historical date', () => {
    expect(goalsMetAtDate(history, '2026-01-01')).toEqual({
      goalsMet: 7,
      totalGoals: 10,
    })
  })

  it('returns the boundary count at the first and last snapshot', () => {
    expect(goalsMetAtDate(history, '2025-09-01')?.goalsMet).toBe(3)
    expect(goalsMetAtDate(history, '2026-04-26')?.goalsMet).toBe(10)
  })

  it('exposes TOTAL_DCP_GOALS as 10', () => {
    expect(TOTAL_DCP_GOALS).toBe(10)
    expect(goalsMetAtDate(history, '2025-11-01')?.totalGoals).toBe(10)
  })

  it('returns null when the date has no matching snapshot', () => {
    // 2025-10-01 falls between snapshots — exact lookup only.
    expect(goalsMetAtDate(history, '2025-10-01')).toBeNull()
  })

  it('returns null when the club has no goals history (not in snapshot)', () => {
    expect(goalsMetAtDate([], '2026-01-01')).toBeNull()
  })

  it('returns null for undefined / null history', () => {
    expect(goalsMetAtDate(undefined, '2026-01-01')).toBeNull()
    expect(goalsMetAtDate(null, '2026-01-01')).toBeNull()
  })

  it('clamps an out-of-range goalsAchieved into 0–10', () => {
    const dirty: DcpGoalsTrendPoint[] = [
      { date: '2025-09-01', goalsAchieved: 12 },
      { date: '2025-11-01', goalsAchieved: -2 },
    ]
    expect(goalsMetAtDate(dirty, '2025-09-01')?.goalsMet).toBe(10)
    expect(goalsMetAtDate(dirty, '2025-11-01')?.goalsMet).toBe(0)
  })
})
