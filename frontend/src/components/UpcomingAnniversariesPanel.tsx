import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ClubTrend } from '../hooks/useDistrictAnalytics'
import {
  getClubAnniversary,
  isMilestoneYear,
  type ClubAnniversary,
} from '../utils/clubAnniversary'
import { ordinalSuffix } from '../utils/ordinal'

/* UpcomingAnniversariesPanel (#446 / #511) — district-level recognition
   planner. Tight, dense rows of clubs whose next anniversary is within
   UPCOMING_WINDOW_DAYS days, sorted by date proximity. */

export const UPCOMING_WINDOW_DAYS = 60
const DEFAULT_ROW_LIMIT = 5

export interface UpcomingAnniversariesPanelProps {
  clubs: ClubTrend[]
  referenceDate?: Date
  districtId?: string
  initialRowLimit?: number
}

interface Row {
  club: ClubTrend
  anniversary: ClubAnniversary
}

const buildRows = (
  clubs: ClubTrend[],
  referenceDate: Date | undefined
): Row[] =>
  clubs
    .filter(c => !!c.charterDate)
    .map(club => ({
      club,
      anniversary: getClubAnniversary(
        club.charterDate as string,
        referenceDate
      ),
    }))
    .filter((r): r is Row => r.anniversary !== null)

export const UpcomingAnniversariesPanel: React.FC<
  UpcomingAnniversariesPanelProps
> = ({
  clubs,
  referenceDate,
  districtId,
  initialRowLimit = DEFAULT_ROW_LIMIT,
}) => {
  const [expanded, setExpanded] = useState(false)

  const { upcoming, nextBeyondWindow } = useMemo(() => {
    const all = buildRows(clubs, referenceDate)
    const sorted = [...all].sort(
      (a, b) => a.anniversary.daysUntilNext - b.anniversary.daysUntilNext
    )
    const upcoming = sorted.filter(
      r => r.anniversary.daysUntilNext <= UPCOMING_WINDOW_DAYS
    )
    const nextBeyondWindow = upcoming.length === 0 ? (sorted[0] ?? null) : null
    return { upcoming, nextBeyondWindow }
  }, [clubs, referenceDate])

  const clubHref = (clubId: string) =>
    `/club/${clubId}${districtId ? `?district=${districtId}` : ''}`

  if (upcoming.length === 0) {
    return (
      <section
        aria-labelledby="upcoming-anniversaries-heading"
        className="redesign-panel"
      >
        <h3
          id="upcoming-anniversaries-heading"
          className="redesign-panel__header"
        >
          Upcoming anniversaries
        </h3>
        {nextBeyondWindow ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 font-tm-body">
            All quiet — next in{' '}
            <strong className="font-semibold text-gray-700 dark:text-gray-200">
              {nextBeyondWindow.anniversary.daysUntilNext}d
            </strong>{' '}
            at{' '}
            <Link
              to={clubHref(nextBeyondWindow.club.clubId)}
              className="text-tm-loyal-blue hover:underline"
            >
              {nextBeyondWindow.club.clubName}
            </Link>
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 font-tm-body">
            All quiet — no charter dates available.
          </p>
        )}
      </section>
    )
  }

  const visible = expanded ? upcoming : upcoming.slice(0, initialRowLimit)
  const hidden = upcoming.length - visible.length

  return (
    <section
      aria-labelledby="upcoming-anniversaries-heading"
      className="redesign-panel"
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3
          id="upcoming-anniversaries-heading"
          className="redesign-panel__header !mb-0"
        >
          Upcoming anniversaries
        </h3>
        <span className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-tm-body">
          Next {UPCOMING_WINDOW_DAYS}d · {upcoming.length}
        </span>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800 -mx-1">
        {visible.map(row => {
          const { club, anniversary } = row
          // Milestone for this row = milestone on the UPCOMING year count.
          // anniversary.isMilestone fires on the CURRENT count (N-1 until
          // the day-of), so the panel computes its own flag.
          const isUpcomingMilestone = isMilestoneYear(anniversary.upcomingYears)
          const ord = `${anniversary.upcomingYears}${ordinalSuffix(
            anniversary.upcomingYears
          )}`
          const dayCopy =
            anniversary.daysUntilNext === 0
              ? 'today'
              : `${anniversary.daysUntilNext}d`
          return (
            <li
              key={club.clubId}
              data-testid="upcoming-anniversary-row"
              data-milestone={isUpcomingMilestone}
              className={
                'flex items-center gap-2 px-2 py-1.5 text-sm font-tm-body ' +
                (isUpcomingMilestone
                  ? 'border-l-2 border-tm-happy-yellow bg-tm-happy-yellow/10'
                  : 'border-l-2 border-transparent')
              }
            >
              <span
                className={
                  'w-10 shrink-0 text-right tabular-nums text-xs font-semibold ' +
                  (anniversary.daysUntilNext <= 7
                    ? 'text-tm-true-maroon'
                    : 'text-gray-700 dark:text-gray-300')
                }
              >
                {dayCopy}
              </span>
              <Link
                to={clubHref(club.clubId)}
                className="flex-1 min-w-0 truncate text-tm-loyal-blue hover:underline"
              >
                {club.clubName}
              </Link>
              <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 truncate max-w-[8rem]">
                {club.areaName}
              </span>
              <span
                className={
                  'shrink-0 tabular-nums text-xs font-semibold ' +
                  (isUpcomingMilestone
                    ? 'text-tm-true-maroon'
                    : 'text-gray-600 dark:text-gray-300')
                }
              >
                {ord}
              </span>
            </li>
          )
        })}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs font-semibold text-tm-loyal-blue hover:underline font-tm-body"
        >
          Show all ({upcoming.length})
        </button>
      )}
    </section>
  )
}
