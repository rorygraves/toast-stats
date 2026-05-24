/**
 * GoalAchievementTimeline (#621) — Sprint 4 of the Club Redesign epic (#617).
 *
 * The historical DCP-goals progression that sits between the progress bar and
 * the per-goal grid inside the DCP Goals Progress panel. Pixel-mapped to
 * club-reference.html's `.timeline-row` grid (90px 1fr 60px 50px; tighter at
 * ≤640px). Rows are computed by `useClubGoalTimeline` — see that hook for the
 * checkpoint + nearest-prior-snapshot logic.
 *
 * Accessibility: direction is conveyed by the signed gain text (+N / -N), not
 * colour alone; a fallback (a checkpoint with no exact snapshot) is flagged
 * with a marker, a `title` tooltip, and a footnote — never by colour. The
 * decorative bar mirrors the text count `N/10`, so it is aria-hidden.
 */
import React from 'react'
import { formatDisplayDate } from '../utils/dateFormatting'
import type { GoalTimelineRow } from '../hooks/useClubGoalTimeline'

interface GoalAchievementTimelineProps {
  rows: GoalTimelineRow[]
}

function gainClass(gain: number | null): string {
  if (gain === null || gain === 0) return 'gain'
  return gain > 0 ? 'gain pos' : 'gain neg'
}

function gainText(gain: number | null): string {
  if (gain === null || gain === 0) return ''
  return gain > 0 ? `+${gain}` : `${gain}`
}

export const GoalAchievementTimeline: React.FC<
  GoalAchievementTimelineProps
> = ({ rows }) => {
  if (rows.length === 0) return null

  const hasFallback = rows.some(r => r.isFallback)

  return (
    <>
      <div className="dcp-subhead">Goal Achievement Timeline</div>
      <div className="goal-timeline" role="list">
        {rows.map(row => {
          const pct =
            row.totalGoals > 0 ? (row.goalsMet / row.totalGoals) * 100 : 0
          const dateLabel = formatDisplayDate(row.actualDate)
          // Fallback rows show which snapshot stood in for the checkpoint.
          const fallbackTitle = row.isFallback
            ? `Nearest available snapshot to ${formatDisplayDate(
                row.targetDate
              )}`
            : undefined
          return (
            <div className="timeline-row" role="listitem" key={row.targetDate}>
              <span
                className="date"
                title={fallbackTitle}
                aria-label={
                  row.isFallback
                    ? `${dateLabel}, nearest snapshot to ${formatDisplayDate(
                        row.targetDate
                      )}`
                    : undefined
                }
              >
                {dateLabel}
                {row.isFallback ? <span aria-hidden="true">*</span> : null}
              </span>
              <div className="bar-track" aria-hidden="true">
                <div className="bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="num">
                {row.goalsMet}/{row.totalGoals}
              </span>
              <span className={gainClass(row.gain)}>{gainText(row.gain)}</span>
            </div>
          )
        })}
      </div>
      {hasFallback ? (
        <p className="goal-timeline__note">
          * nearest available snapshot — exact checkpoint date had no data.
        </p>
      ) : null}
    </>
  )
}

export default GoalAchievementTimeline
