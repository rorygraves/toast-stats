import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { ClubTrend } from '../hooks/useDistrictAnalytics'
import { isMilestoneYear } from '../utils/clubAnniversary'
import { getCurrentProgramYear } from '../utils/programYear'

/* MilestonesCallout (#447) — district-level program-year milestone roster.
   Groups clubs hitting a 5/10/15/.../100 year milestone within the
   program year window (Jul 1 → Jun 30 inclusive). */

export interface MilestonesCalloutProps {
  clubs: ClubTrend[]
  programYearStart?: number
  districtId?: string
}

interface MilestoneEntry {
  club: ClubTrend
  milestoneYears: number
  anniversaryDate: Date
}

interface NextUpcomingEntry {
  club: ClubTrend
  milestoneYears: number
  anniversaryDate: Date
}

/* Parse a Toastmasters charter date in UTC, supporting ISO YYYY-MM-DD and
   the legacy /Date(ms)/ format the TI Find-A-Club endpoint returns. */
const parseCharterUtc = (input: string): Date | null => {
  const dotNetMatch = /^\/Date\((-?\d+)\)\/$/.exec(input)
  if (dotNetMatch) {
    const ms = Number(dotNetMatch[1])
    if (!Number.isFinite(ms)) return null
    const d = new Date(ms)
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    )
  }
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(input)
  if (isoMatch) {
    const y = Number(isoMatch[1])
    const m = Number(isoMatch[2]) - 1
    const d = Number(isoMatch[3])
    return new Date(Date.UTC(y, m, d))
  }
  return null
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const formatAnniversaryDate = (d: Date): string =>
  `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`

const formatCharterMonth = (d: Date): string =>
  `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`

/* Compute the anniversary date that falls inside the program year window.
   Falls back to Feb 28 if the charter is Feb 29 and the anniversary year
   is non-leap. Returns null when no anniversary falls in the window. */
const anniversaryInProgramYear = (
  charter: Date,
  programYearStart: number
): Date | null => {
  const charterMonth = charter.getUTCMonth()
  const charterDay = charter.getUTCDate()
  // Anniversary year inside the window:
  //   month >= 6 (Jul-Dec): in programYearStart
  //   month <  6 (Jan-Jun): in programYearStart + 1
  const annivYear = charterMonth >= 6 ? programYearStart : programYearStart + 1
  let day = charterDay
  if (charterMonth === 1 && charterDay === 29) {
    const isLeap =
      (annivYear % 4 === 0 && annivYear % 100 !== 0) || annivYear % 400 === 0
    if (!isLeap) day = 28
  }
  return new Date(Date.UTC(annivYear, charterMonth, day))
}

export const MilestonesCallout: React.FC<MilestonesCalloutProps> = ({
  clubs,
  programYearStart,
  districtId,
}) => {
  const pyStart = programYearStart ?? getCurrentProgramYear().year

  const { groups, nextUpcoming, pyLabel } = useMemo(() => {
    const milestones: MilestoneEntry[] = []
    const upcomingCandidates: NextUpcomingEntry[] = []

    for (const club of clubs) {
      if (!club.charterDate) continue
      const charter = parseCharterUtc(club.charterDate)
      if (!charter) continue
      const annivInPy = anniversaryInProgramYear(charter, pyStart)
      if (!annivInPy) continue
      const yearsAtAnniv = annivInPy.getUTCFullYear() - charter.getUTCFullYear()
      if (yearsAtAnniv <= 0) continue
      if (isMilestoneYear(yearsAtAnniv)) {
        milestones.push({
          club,
          milestoneYears: yearsAtAnniv,
          anniversaryDate: annivInPy,
        })
        continue
      }
      // Not a milestone in this PY — find the next future milestone
      // anniversary so the empty state can point somewhere useful.
      const charterMonth = charter.getUTCMonth()
      const charterDay = charter.getUTCDate()
      const today = new Date()
      let candidateYear = today.getUTCFullYear()
      while (candidateYear - charter.getUTCFullYear() <= 101) {
        const years = candidateYear - charter.getUTCFullYear()
        if (isMilestoneYear(years)) {
          const d = new Date(Date.UTC(candidateYear, charterMonth, charterDay))
          if (d.getTime() >= today.getTime()) {
            upcomingCandidates.push({
              club,
              milestoneYears: years,
              anniversaryDate: d,
            })
            break
          }
        }
        candidateYear += 1
      }
    }

    // Group milestones by year, descending.
    const grouped = new Map<number, MilestoneEntry[]>()
    for (const entry of milestones) {
      const arr = grouped.get(entry.milestoneYears) ?? []
      arr.push(entry)
      grouped.set(entry.milestoneYears, arr)
    }
    const groups = Array.from(grouped.entries())
      .sort(([a], [b]) => b - a)
      .map(([years, entries]) => ({
        years,
        entries: [...entries].sort(
          (a, b) => a.anniversaryDate.getTime() - b.anniversaryDate.getTime()
        ),
      }))

    const nextUpcoming =
      upcomingCandidates.length > 0
        ? upcomingCandidates.reduce((nearest, candidate) =>
            candidate.anniversaryDate < nearest.anniversaryDate
              ? candidate
              : nearest
          )
        : null

    const pyLabel = `${pyStart}-${(pyStart + 1).toString().slice(-2)}`

    return { groups, nextUpcoming, pyLabel }
  }, [clubs, pyStart])

  if (groups.length === 0) {
    return (
      <section
        aria-labelledby="milestones-heading"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6"
      >
        <h2
          id="milestones-heading"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Milestones — Program Year {pyLabel}
        </h2>
        {nextUpcoming ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            No milestones in this program year — next milestone is{' '}
            <Link
              to={`/club/${nextUpcoming.club.clubId}${
                districtId ? `?district=${districtId}` : ''
              }`}
              className="text-tm-loyal-blue hover:underline"
            >
              {nextUpcoming.club.clubName}
            </Link>{' '}
            at {nextUpcoming.milestoneYears} years on{' '}
            {formatAnniversaryDate(nextUpcoming.anniversaryDate)}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            No milestones in this program year.
          </p>
        )}
      </section>
    )
  }

  return (
    <section
      aria-labelledby="milestones-heading"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6"
    >
      <h2
        id="milestones-heading"
        className="text-lg font-semibold text-gray-900 dark:text-gray-100"
      >
        Milestones — Program Year {pyLabel}
      </h2>
      <div className="mt-3 space-y-4">
        {groups.map(group => (
          <div key={group.years} data-testid="milestone-group">
            <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
              🥇 {group.years} Years
            </h3>
            <ul className="mt-1 divide-y divide-gray-200 dark:divide-gray-700">
              {group.entries.map(entry => {
                const charter = parseCharterUtc(
                  entry.club.charterDate as string
                )
                return (
                  <li
                    key={entry.club.clubId}
                    className="py-2 text-sm flex flex-wrap items-baseline gap-x-2"
                  >
                    <Link
                      data-testid="milestone-club"
                      to={`/club/${entry.club.clubId}${
                        districtId ? `?district=${districtId}` : ''
                      }`}
                      className="font-medium text-tm-loyal-blue hover:underline"
                    >
                      {entry.club.clubName}
                    </Link>
                    {charter && (
                      <span className="text-gray-500 dark:text-gray-400">
                        · chartered {formatCharterMonth(charter)}
                      </span>
                    )}
                    <span className="text-gray-500 dark:text-gray-400">
                      · {entry.club.areaName}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      · {entry.club.divisionName}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
