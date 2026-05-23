/**
 * ClubDCPGoalsPanel (#620) — Sprint 3 of the Club Redesign epic (#617).
 *
 * The redesign's unified "DCP Goals Progress" panel, pixel-mapped to
 * club-reference.html. It has three sub-sections in the final design:
 *
 *   1. a current-progress bar (goals achieved / 10)        ← this sprint
 *   2. a Goal Achievement Timeline                          ← Sprint 4 (#621)
 *   3. a flat per-goal status grid                          ← this sprint
 *
 * The timeline (middle section) ships separately in #621, so it is absent here.
 *
 * Data sources, deliberately separated:
 *   - The bar + header meta use `goalsAchieved` — the authoritative DCP goal
 *     count from the analytics trend, which is always present (so the bar shows
 *     even when the raw CSV record hasn't loaded).
 *   - The per-goal grid uses `extractDcpGoalProgress(clubRecord)` — the raw
 *     `clubPerformance` fields (R-tripwire: DCP goals are independent; never
 *     infer them as Goals 1-N). The grid only renders when the record is loaded.
 */
import React from 'react'
import { extractDcpGoalProgress, type ScrapedRecord } from '../utils/dcpGoals'

interface ClubDCPGoalsPanelProps {
  /** Authoritative goals-achieved count (0–10) for the bar + header meta. */
  goalsAchieved: number
  /** Raw CSV record for the per-goal breakdown; null/undefined → grid hidden. */
  clubRecord: ScrapedRecord | null | undefined
  /** True while the raw record is still loading. */
  isLoading: boolean
}

export const ClubDCPGoalsPanel: React.FC<ClubDCPGoalsPanelProps> = ({
  goalsAchieved,
  clubRecord,
  isLoading,
}) => {
  const clamped = Math.max(0, Math.min(10, goalsAchieved))
  const pct = (clamped / 10) * 100

  const goals = clubRecord ? extractDcpGoalProgress(clubRecord) : null

  return (
    <section className="club-panel club-dcp-goals">
      <div className="club-panel__head">
        <h2>
          <svg
            className="club-panel__ico"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M5 8l2 2 4-4" />
          </svg>
          DCP Goals Progress
        </h2>
        <span className="club-panel__meta">{clamped} of 10 goals achieved</span>
      </div>
      <div className="club-panel__body">
        {/* Current Progress bar */}
        <div className="dcp-progress">
          <div className="dcp-progress-h">
            <span className="dcp-progress-h__lab">Current Progress</span>
            <span className="dcp-progress-h__val tabular-nums">
              {clamped} / 10 goals
            </span>
          </div>
          <div
            className="dcp-progress-bar"
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-label="DCP goals achieved"
          >
            <div className="dcp-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Per-Goal Status grid */}
        {isLoading ? (
          <div className="dcp-goals-skeleton" aria-hidden="true">
            <div className="dcp-goals-skeleton__row" />
            <div className="dcp-goals-skeleton__row" />
            <div className="dcp-goals-skeleton__row" />
            <div className="dcp-goals-skeleton__row" />
          </div>
        ) : goals ? (
          <>
            <div className="dcp-subhead">Per-Goal Status</div>
            <div className="goals-table">
              {goals.map(goal => (
                <div
                  key={goal.goalNumber}
                  className={'goal-row' + (goal.achieved ? ' met' : '')}
                >
                  <span className="check" aria-hidden="true">
                    {goal.achieved ? '✓' : ''}
                  </span>
                  <span className="goal-num">{goal.goalNumber}</span>
                  <span className="goal-name">{goal.name}</span>
                  {/* Met state is also carried by bg + the check glyph, but
                      colour/glyph alone is not accessible — expose the status
                      as screen-reader-only text. */}
                  <span className="sr-only">
                    {goal.achieved ? 'Achieved' : 'Not yet achieved'}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

export default ClubDCPGoalsPanel
