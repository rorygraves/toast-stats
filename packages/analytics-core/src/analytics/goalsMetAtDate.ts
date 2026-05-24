/**
 * goalsMetAtDate (#621) — exact-date DCP goals-met lookup for one club.
 *
 * Part of Sprint 4 of the Club Redesign epic (#617): the primitive behind the
 * frontend's Goal Achievement Timeline.
 *
 * ## Why it takes a goals history, not a raw Snapshot[]
 *
 * #621 sketched the signature as `goalsMetAtDate(clubId, date)` ("reads the
 * snapshot for date, locates the club, counts goals"). A `ClubTrend`'s
 * `dcpGoalsTrend` is exactly that data already resolved: the per-snapshot
 * projection of ONE club's goals-met count across every snapshot. The frontend
 * receives this trend pre-computed (via `useDistrictAnalytics`) and never holds
 * raw `Snapshot[]`, so a snapshot-level signature would be a tested-but-unused
 * export. Operating on `DcpGoalsTrendPoint[]` keeps this helper DRY — the
 * shipped `useClubGoalTimeline` hook actually calls it — while still covering
 * the three cases #621 requires:
 *   - known historical date → the count at that snapshot
 *   - missing snapshot      → null (date absent from the history)
 *   - club not in snapshot  → null (empty / absent history)
 *
 * Tripwire-compliant: `goalsAchieved` is parsed upstream from the raw
 * `Goals Met` field (the INDEPENDENT count), never inferred as Goals 1-N.
 */
import type { DcpGoalsTrendPoint } from '../types/clubHealth.js'

/** Total number of DCP goals a club can achieve in a program year. */
export const TOTAL_DCP_GOALS = 10

export interface GoalsMetResult {
  /** Goals achieved at the matched date, clamped to 0–TOTAL_DCP_GOALS. */
  goalsMet: number
  /** Always TOTAL_DCP_GOALS (10). */
  totalGoals: number
}

/**
 * Returns the goals-met count for `date` if that exact snapshot exists in the
 * club's goals history, else `null`. Exact match only — nearest-prior fallback
 * is the caller's concern (see `useClubGoalTimeline`).
 */
export function goalsMetAtDate(
  goalsHistory: DcpGoalsTrendPoint[] | null | undefined,
  date: string
): GoalsMetResult | null {
  if (!goalsHistory || goalsHistory.length === 0) return null
  const point = goalsHistory.find(p => p.date === date)
  if (!point) return null
  const goalsMet = Math.max(0, Math.min(TOTAL_DCP_GOALS, point.goalsAchieved))
  return { goalsMet, totalGoals: TOTAL_DCP_GOALS }
}
