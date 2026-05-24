/**
 * useClubGoalTimeline (#621) — Sprint 4 of the Club Redesign epic (#617).
 *
 * Builds the Goal Achievement Timeline shown inside the DCP Goals Progress
 * panel: a small set of program-year checkpoints (Sep 1, Nov 1, Jan 1, Mar 1)
 * plus a final "current" row at the as-of date, each resolved to the club's
 * DCP goals-met count.
 *
 * Data source: the club's already-fetched `dcpGoalsTrend` (the per-snapshot
 * projection of this club's INDEPENDENT goals-met count). The exact-date lookup
 * is delegated to analytics-core's `goalsMetAtDate`; this hook layers the
 * nearest-prior-snapshot fallback on top (issue split: helper = exact,
 * hook = fallback).
 *
 * R3: program year + as-of date are passed in by the parent (`ClubDetailPage`
 * already derives both) — never re-derived here from response data.
 */
import { useMemo } from 'react'
import {
  goalsMetAtDate,
  TOTAL_DCP_GOALS,
  type DcpGoalsTrendPoint,
} from '@toastmasters/analytics-core'
import type { ProgramYear } from '../utils/programYear'

export interface GoalTimelineRow {
  /** Canonical checkpoint date this row represents (e.g. '2025-09-01'). */
  targetDate: string
  /** Snapshot date actually used — equals targetDate unless a fallback fired. */
  actualDate: string
  /** Goals achieved at actualDate (0–TOTAL_DCP_GOALS). */
  goalsMet: number
  /** Always TOTAL_DCP_GOALS (10). */
  totalGoals: number
  /** Δ goalsMet vs the previous emitted row; null for the first row. */
  gain: number | null
  /** True when no exact snapshot existed and a prior one was substituted. */
  isFallback: boolean
}

/**
 * The canonical checkpoint dates for a program year, in calendar order.
 * The program year starts July 1 of `programYear.year`, so Sep/Nov fall in the
 * start year and Jan/Mar in the following year.
 */
function checkpointDates(programYear: ProgramYear): string[] {
  const start = programYear.year
  const next = programYear.year + 1
  return [`${start}-09-01`, `${start}-11-01`, `${next}-01-01`, `${next}-03-01`]
}

/**
 * Pure timeline computation (exported for direct unit testing).
 *
 * For each target ≤ asOf (plus asOf itself, de-duplicated), resolve the
 * goals-met count: exact snapshot if present, else the nearest snapshot
 * strictly before the target. Targets with no at-or-before snapshot are
 * dropped (they precede the club's earliest data). `gain` is the delta between
 * consecutive *emitted* rows.
 */
export function computeGoalTimeline(
  dcpGoalsTrend: DcpGoalsTrendPoint[] | null | undefined,
  programYear: ProgramYear,
  asOfDate: string
): GoalTimelineRow[] {
  if (!dcpGoalsTrend || dcpGoalsTrend.length === 0) return []

  // Ordered, de-duplicated target dates: canonical checkpoints up to as-of,
  // then the as-of row (which collapses into a checkpoint if it lands on one).
  const targets: string[] = []
  const seen = new Set<string>()
  for (const date of [
    ...checkpointDates(programYear).filter(d => d <= asOfDate),
    asOfDate,
  ]) {
    if (!seen.has(date)) {
      seen.add(date)
      targets.push(date)
    }
  }

  // Snapshots sorted ascending by date, for the nearest-prior scan.
  const sorted = [...dcpGoalsTrend].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  )

  // Resolve each target to a snapshot, dropping pre-history targets and
  // collapsing targets that resolve to the SAME snapshot. The as-of date is a
  // district-level snapshot date and often isn't an exact point in this club's
  // trend, so without this several checkpoints (and the "current" row) can all
  // fall back to the same prior snapshot and render as duplicate dates. Keeping
  // the earliest checkpoint a snapshot satisfies also avoids a spurious "*"
  // fallback marker on the current row when the club's latest data predates the
  // as-of date. actualDates are non-decreasing across chronological targets, so
  // first-occurrence de-dup yields a clean monotonic timeline.
  const seenActual = new Set<string>()
  const resolved: Omit<GoalTimelineRow, 'gain' | 'totalGoals'>[] = []

  for (const target of targets) {
    const exact = goalsMetAtDate(sorted, target)
    let actualDate = target
    let goalsMet: number

    if (exact) {
      goalsMet = exact.goalsMet
    } else {
      // Nearest snapshot strictly before the target.
      let prior: DcpGoalsTrendPoint | undefined
      for (const p of sorted) {
        if (p.date < target) prior = p
        else break
      }
      if (!prior) continue // target precedes the earliest snapshot — drop it
      actualDate = prior.date
      const at = goalsMetAtDate(sorted, prior.date)
      goalsMet = at ? at.goalsMet : 0
    }

    if (seenActual.has(actualDate)) continue
    seenActual.add(actualDate)
    resolved.push({
      targetDate: target,
      actualDate,
      goalsMet,
      isFallback: actualDate !== target,
    })
  }

  // gain = delta vs the previous emitted row; null for the first.
  let prevGoalsMet: number | null = null
  return resolved.map(r => {
    const gain = prevGoalsMet === null ? null : r.goalsMet - prevGoalsMet
    prevGoalsMet = r.goalsMet
    return { ...r, totalGoals: TOTAL_DCP_GOALS, gain }
  })
}

/** Memoized hook wrapper over {@link computeGoalTimeline}. */
export function useClubGoalTimeline(
  dcpGoalsTrend: DcpGoalsTrendPoint[] | null | undefined,
  programYear: ProgramYear,
  asOfDate: string
): GoalTimelineRow[] {
  return useMemo(
    () => computeGoalTimeline(dcpGoalsTrend, programYear, asOfDate),
    [dcpGoalsTrend, programYear, asOfDate]
  )
}
