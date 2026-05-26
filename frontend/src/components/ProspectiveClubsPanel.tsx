import React from 'react'
import type { ProspectiveClub } from '../hooks/useDistrictAnalytics'

/* ProspectiveClubsPanel (#489) — surfaces FAC-only clubs (ATOs +
   fresh charters) below the ClubsTable on /district/:id/clubs. The
   surface is rendered only when there's something to show; typical
   districts have N = 0–4 prospective clubs. By design these clubs
   are NOT in any aggregate or ranking — the panel is a directory
   overlay that helps district leaders track ATOs in flight. */

export interface ProspectiveClubsPanelProps {
  // Explicitly union with undefined so callers can hand us
  // `analytics?.prospectiveClubs` under exactOptionalPropertyTypes
  // without an intermediate cast.
  clubs: ProspectiveClub[] | undefined
}

const formatLocation = (club: ProspectiveClub): string => {
  const parts = [club.city, club.region, club.country].filter(Boolean)
  return parts.join(', ')
}

export const ProspectiveClubsPanel: React.FC<ProspectiveClubsPanelProps> = ({
  clubs,
}) => {
  if (!clubs || clubs.length === 0) return null

  return (
    <section
      aria-labelledby="prospective-clubs-heading"
      className="redesign-panel"
      data-testid="prospective-clubs-panel"
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3
          id="prospective-clubs-heading"
          className="redesign-panel__header !mb-0"
        >
          Prospective clubs ({clubs.length})
        </h3>
        <span className="text-[11px] uppercase tracking-wider text-gray-600 theme-dark:text-gray-400 font-tm-body">
          FAC registry
        </span>
      </div>
      <p className="text-xs text-gray-600 theme-dark:text-gray-400 font-tm-body mb-2">
        In TI&rsquo;s public Find-A-Club registry but not yet in this
        district&rsquo;s performance reports — typically ATO (Application To
        Organize) clubs or fresh charters. Excluded from rankings and
        distinguished counts.
      </p>
      <ul className="divide-y divide-gray-100 theme-dark:divide-gray-800 -mx-1">
        {clubs.map(club => {
          const location = formatLocation(club)
          return (
            <li
              key={club.clubId}
              className="flex items-center gap-2 px-2 py-1.5 text-sm font-tm-body"
              data-testid="prospective-club-row"
            >
              <span className="flex-1 min-w-0 truncate font-semibold text-gray-800 theme-dark:text-gray-100">
                {club.clubName}
              </span>
              {location && (
                <span className="hidden sm:inline text-xs text-gray-500 theme-dark:text-gray-400 truncate max-w-[12rem]">
                  {location}
                </span>
              )}
              {club.charterDate && (
                <span className="shrink-0 tabular-nums text-xs font-semibold text-tm-loyal-blue">
                  {club.charterDate}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default ProspectiveClubsPanel
