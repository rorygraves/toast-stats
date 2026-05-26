import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { ClubTrend } from '../hooks/useDistrictAnalytics'
import { getClubAnniversary } from '../utils/clubAnniversary'

/* LongestServingClubsLeaderboard (#449) — district-scoped Top-N list of
   the clubs with the most years since charter. Sibling to the existing
   Notable Dates surfaces; same `ClubTrend.charterDate` data source.
   Sort: years desc, ties broken alphabetically by clubName. */

const DEFAULT_LIMIT = 10

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

export interface LongestServingClubsLeaderboardProps {
  clubs: ClubTrend[]
  districtId?: string
  limit?: number
  referenceDate?: Date
}

interface Row {
  club: ClubTrend
  years: number
  charterLabel: string
}

const parseCharter = (input: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2]) - 1
  const d = Number(match[3])
  if (m < 0 || m > 11 || d < 1 || d > 31) return null
  return new Date(Date.UTC(y, m, d))
}

const formatCharter = (charter: Date): string =>
  `${MONTHS[charter.getUTCMonth()]} ${charter.getUTCFullYear()}`

const buildRows = (clubs: ClubTrend[], referenceDate?: Date): Row[] => {
  const rows: Row[] = []
  for (const club of clubs) {
    if (!club.charterDate) continue
    const anniversary = getClubAnniversary(club.charterDate, referenceDate)
    if (!anniversary) continue
    const charter = parseCharter(club.charterDate)
    if (!charter) continue
    rows.push({
      club,
      years: anniversary.years,
      charterLabel: formatCharter(charter),
    })
  }
  rows.sort((a, b) => {
    if (b.years !== a.years) return b.years - a.years
    return a.club.clubName.localeCompare(b.club.clubName)
  })
  return rows
}

export const LongestServingClubsLeaderboard: React.FC<
  LongestServingClubsLeaderboardProps
> = ({ clubs, districtId, limit = DEFAULT_LIMIT, referenceDate }) => {
  const rows = useMemo(
    () => buildRows(clubs, referenceDate).slice(0, limit),
    [clubs, referenceDate, limit]
  )

  if (rows.length === 0) {
    return (
      <section
        aria-labelledby="longest-serving-heading"
        className="redesign-panel"
      >
        <h3 id="longest-serving-heading" className="redesign-panel__header">
          Longest-serving clubs
        </h3>
        <p className="text-xs text-gray-500 theme-dark:text-gray-400 font-tm-body">
          No charter data yet for this district.
        </p>
      </section>
    )
  }

  const clubHref = (clubId: string) =>
    `/club/${clubId}${districtId ? `?district=${districtId}` : ''}`

  return (
    <section
      aria-labelledby="longest-serving-heading"
      className="redesign-panel"
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3
          id="longest-serving-heading"
          className="redesign-panel__header !mb-0"
        >
          Longest-serving clubs
        </h3>
        <span className="text-[11px] uppercase tracking-wider text-gray-600 theme-dark:text-gray-400 font-tm-body">
          Top {rows.length}
        </span>
      </div>
      <ol className="divide-y divide-gray-100 theme-dark:divide-gray-800 -mx-1">
        {rows.map((row, i) => (
          <li
            key={row.club.clubId}
            data-testid="longest-serving-row"
            className="flex items-baseline gap-3 px-2 py-1.5 text-sm font-tm-body"
          >
            <span className="w-6 shrink-0 tabular-nums text-xs font-bold text-tm-true-maroon">
              #{i + 1}
            </span>
            <Link
              to={clubHref(row.club.clubId)}
              className="flex-1 min-w-0 truncate text-tm-loyal-blue hover:underline"
            >
              {row.club.clubName}
            </Link>
            <span className="shrink-0 tabular-nums text-xs font-semibold text-gray-700 theme-dark:text-gray-200">
              {row.years}y
            </span>
            <span className="shrink-0 tabular-nums text-[11px] text-gray-600 theme-dark:text-gray-400">
              {row.charterLabel}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default LongestServingClubsLeaderboard
