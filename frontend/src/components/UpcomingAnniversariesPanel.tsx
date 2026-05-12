import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ClubTrend } from '../hooks/useDistrictAnalytics'
import {
  getClubAnniversary,
  isMilestoneYear,
  type ClubAnniversary,
} from '../utils/clubAnniversary'

/* UpcomingAnniversariesPanel (#446) — district-level recognition planner.
   Lists clubs with anniversaries in the next UPCOMING_WINDOW_DAYS days,
   sorted by date proximity. */

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

const ordinalSuffix = (n: number): string => {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'
  const mod10 = n % 10
  if (mod10 === 1) return 'st'
  if (mod10 === 2) return 'nd'
  if (mod10 === 3) return 'rd'
  return 'th'
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

  if (upcoming.length === 0) {
    return (
      <section
        aria-labelledby="upcoming-anniversaries-heading"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6"
      >
        <h2
          id="upcoming-anniversaries-heading"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Upcoming Anniversaries
        </h2>
        {nextBeyondWindow ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            All quiet on the anniversary front — next anniversary in{' '}
            {nextBeyondWindow.anniversary.daysUntilNext} days at{' '}
            <Link
              to={`/club/${nextBeyondWindow.club.clubId}${
                districtId ? `?district=${districtId}` : ''
              }`}
              className="text-tm-loyal-blue hover:underline"
            >
              {nextBeyondWindow.club.clubName}
            </Link>
            .
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            All quiet on the anniversary front — no charter dates available.
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6"
    >
      <h2
        id="upcoming-anniversaries-heading"
        className="text-lg font-semibold text-gray-900 dark:text-gray-100"
      >
        Upcoming Anniversaries
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Within the next {UPCOMING_WINDOW_DAYS} days
      </p>
      <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
        {visible.map(row => {
          const { club, anniversary } = row
          // For the upcoming panel, milestone means the UPCOMING anniversary
          // year hits 5/10/15/... — distinct from isUpcomingMilestone,
          // which fires on the CURRENT years count.
          const isUpcomingMilestone = isMilestoneYear(anniversary.upcomingYears)
          const ord = `${anniversary.upcomingYears}${ordinalSuffix(
            anniversary.upcomingYears
          )}`
          const dayCopy =
            anniversary.daysUntilNext === 0
              ? 'today'
              : `in ${anniversary.daysUntilNext} day${
                  anniversary.daysUntilNext === 1 ? '' : 's'
                }`
          return (
            <li
              key={club.clubId}
              data-testid="upcoming-anniversary-row"
              data-milestone={isUpcomingMilestone}
              className={
                'py-2 flex flex-wrap items-baseline gap-x-2 ' +
                (isUpcomingMilestone
                  ? 'bg-yellow-50/50 dark:bg-yellow-900/10 -mx-2 px-2 rounded'
                  : '')
              }
            >
              <Link
                to={`/club/${club.clubId}${
                  districtId ? `?district=${districtId}` : ''
                }`}
                className="font-medium text-tm-loyal-blue hover:underline"
              >
                {club.clubName}
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                · {club.areaName}
              </span>
              <span
                className={
                  'text-sm ' +
                  (isUpcomingMilestone
                    ? 'font-semibold text-yellow-800 dark:text-yellow-200'
                    : 'text-gray-700 dark:text-gray-300')
                }
              >
                {ord} anniversary {dayCopy}
              </span>
              {isUpcomingMilestone && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-900 ring-1 ring-yellow-400 dark:bg-yellow-900/40 dark:text-yellow-100 dark:ring-yellow-500">
                  🥇 milestone
                </span>
              )}
            </li>
          )
        })}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 text-sm text-tm-loyal-blue hover:underline"
        >
          Show all ({upcoming.length})
        </button>
      )}
    </section>
  )
}
