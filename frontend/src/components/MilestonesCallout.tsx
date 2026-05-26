import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { ClubTrend } from '../hooks/useDistrictAnalytics'
import { isMilestoneYear } from '../utils/clubAnniversary'
import {
  getCurrentProgramYear,
  formatProgramYearShort,
} from '../utils/programYear'

/* MilestonesCallout (#447 / #511) — district-level program-year
   milestone roster. Tight, single-line groups per milestone year. */

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
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const formatShortDate = (d: Date): string =>
  `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`

const anniversaryInProgramYear = (
  charter: Date,
  programYearStart: number
): Date | null => {
  const charterMonth = charter.getUTCMonth()
  const charterDay = charter.getUTCDate()
  const annivYear = charterMonth >= 6 ? programYearStart : programYearStart + 1
  let day = charterDay
  if (charterMonth === 1 && charterDay === 29) {
    const isLeap =
      (annivYear % 4 === 0 && annivYear % 100 !== 0) || annivYear % 400 === 0
    if (!isLeap) day = 28
  }
  return new Date(Date.UTC(annivYear, charterMonth, day))
}

/**
 * Whether any club hits a milestone (5-year increment) anniversary
 * inside the given program year. Used by NotableDatesSection to
 * decide layout before rendering the panel.
 */
export function hasProgramYearMilestones(
  clubs: ClubTrend[],
  programYearStart?: number
): boolean {
  const pyStart = programYearStart ?? getCurrentProgramYear().year
  for (const club of clubs) {
    if (!club.charterDate) continue
    const charter = parseCharterUtc(club.charterDate)
    if (!charter) continue
    const annivInPy = anniversaryInProgramYear(charter, pyStart)
    if (!annivInPy) continue
    const yearsAtAnniv = annivInPy.getUTCFullYear() - charter.getUTCFullYear()
    if (yearsAtAnniv <= 0) continue
    if (isMilestoneYear(yearsAtAnniv)) return true
  }
  return false
}

export const MilestonesCallout: React.FC<MilestonesCalloutProps> = ({
  clubs,
  programYearStart,
  districtId,
}) => {
  const pyStart = programYearStart ?? getCurrentProgramYear().year

  const { groups, nextUpcoming, pyLabel, totalCount } = useMemo(() => {
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

    const pyLabel = formatProgramYearShort(pyStart)
    const totalCount = milestones.length

    return { groups, nextUpcoming, pyLabel, totalCount }
  }, [clubs, pyStart])

  const clubHref = (clubId: string) =>
    `/club/${clubId}${districtId ? `?district=${districtId}` : ''}`

  if (groups.length === 0) {
    return (
      <section aria-labelledby="milestones-heading" className="redesign-panel">
        <h3 id="milestones-heading" className="redesign-panel__header">
          Milestones · PY {pyLabel}
        </h3>
        {nextUpcoming ? (
          <p className="text-xs text-gray-500 theme-dark:text-gray-400 font-tm-body">
            None this PY — next is{' '}
            <Link
              to={clubHref(nextUpcoming.club.clubId)}
              className="text-tm-loyal-blue hover:underline"
            >
              {nextUpcoming.club.clubName}
            </Link>{' '}
            at{' '}
            <strong className="font-semibold text-gray-700 theme-dark:text-gray-200">
              {nextUpcoming.milestoneYears}y
            </strong>{' '}
            in {formatShortDate(nextUpcoming.anniversaryDate)}.
          </p>
        ) : (
          <p className="text-xs text-gray-500 theme-dark:text-gray-400 font-tm-body">
            None this PY.
          </p>
        )}
      </section>
    )
  }

  return (
    <section aria-labelledby="milestones-heading" className="redesign-panel">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 id="milestones-heading" className="redesign-panel__header !mb-0">
          Milestones · PY {pyLabel}
        </h3>
        <span className="text-[11px] uppercase tracking-wider text-gray-600 theme-dark:text-gray-400 font-tm-body">
          {totalCount} club{totalCount === 1 ? '' : 's'}
        </span>
      </div>
      <ul className="divide-y divide-gray-100 theme-dark:divide-gray-800 -mx-1">
        {groups.map(group => (
          <li
            key={group.years}
            data-testid="milestone-group"
            className="flex items-baseline gap-3 px-2 py-1.5 text-sm font-tm-body"
          >
            <span className="w-10 shrink-0 tabular-nums text-xs font-bold text-tm-true-maroon">
              {group.years} Years
            </span>
            <span className="flex-1 min-w-0 flex flex-wrap gap-x-2 gap-y-0.5">
              {group.entries.map((entry, i) => (
                <span
                  key={entry.club.clubId}
                  className="inline-flex items-baseline gap-1"
                >
                  <Link
                    data-testid="milestone-club"
                    to={clubHref(entry.club.clubId)}
                    className="text-tm-loyal-blue hover:underline truncate"
                  >
                    {entry.club.clubName}
                  </Link>
                  <span className="text-[11px] text-gray-600 theme-dark:text-gray-400 tabular-nums">
                    {formatShortDate(entry.anniversaryDate)}
                  </span>
                  {i < group.entries.length - 1 && (
                    <span aria-hidden="true" className="text-gray-300">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
