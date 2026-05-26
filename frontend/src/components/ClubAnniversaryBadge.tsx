import React from 'react'
import type { ClubAnniversary } from '../utils/clubAnniversary'
import { ordinalSuffix } from '../utils/ordinal'

/* ClubAnniversaryBadge (#445) — anniversary display for the club hero.
   Three visual modes:

   - quiet pill: non-milestone, non-upcoming — "<N> years"
   - milestone badge: 5-year increment — gold accent, "<N> Years"
   - upcoming countdown: within ±30 days — "<Nth> anniversary in X days"
     or "today!" on the exact day

   Renders nothing when anniversary is null (missing charter date). */

export interface ClubAnniversaryBadgeProps {
  anniversary: ClubAnniversary | null
  /** Charter date in display form for the tooltip. */
  charterDateLabel?: string
}

export const ClubAnniversaryBadge: React.FC<ClubAnniversaryBadgeProps> = ({
  anniversary,
  charterDateLabel,
}) => {
  if (!anniversary) return null

  const { years, isMilestone, daysUntilNext, isUpcoming, upcomingYears } =
    anniversary

  // Upcoming countdown wins over the quiet pill when within ±30 days.
  if (isUpcoming) {
    const ord = `${upcomingYears}${ordinalSuffix(upcomingYears)}`
    const copy =
      daysUntilNext === 0
        ? `${ord} anniversary today!`
        : `${ord} anniversary in ${daysUntilNext} day${daysUntilNext === 1 ? '' : 's'}`
    return (
      <span
        data-milestone={isMilestone}
        title={charterDateLabel}
        className={
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ' +
          (isMilestone
            ? 'bg-yellow-100 text-yellow-900 ring-1 ring-yellow-400 theme-dark:bg-yellow-900/40 theme-dark:text-yellow-100 theme-dark:ring-yellow-500'
            : 'bg-blue-50 text-blue-900 theme-dark:bg-blue-900/40 theme-dark:text-blue-100')
        }
      >
        🎉 {copy}
        {charterDateLabel && (
          <span className="sr-only"> · Chartered {charterDateLabel}</span>
        )}
      </span>
    )
  }

  // Milestone (steady-state milestone year, not in upcoming window).
  if (isMilestone) {
    return (
      <span
        data-milestone="true"
        title={charterDateLabel}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-900 ring-1 ring-yellow-400 theme-dark:bg-yellow-900/40 theme-dark:text-yellow-100 theme-dark:ring-yellow-500"
      >
        🥇 {years} Years
        {charterDateLabel && (
          <span className="sr-only"> · Chartered {charterDateLabel}</span>
        )}
      </span>
    )
  }

  // Quiet pill for everyone else.
  return (
    <span
      data-milestone="false"
      title={charterDateLabel}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-gray-600 bg-gray-100 theme-dark:bg-gray-700 theme-dark:text-gray-300"
    >
      {years} years
      {charterDateLabel && (
        <span className="sr-only"> · Chartered {charterDateLabel}</span>
      )}
    </span>
  )
}
