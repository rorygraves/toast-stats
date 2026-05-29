import React from 'react'
import { Link } from 'react-router-dom'
import type { ProcessedClubTrend } from './filters/types'
import {
  getClubHealthStatusLabel,
  getClubHealthStatusPillModifier,
} from '../utils/clubHealthStatus'

/**
 * ClubCard (#217) — Mobile card layout for clubs.
 * Replaces table rows on viewports < 640px (HANDOFF §126; epic #665 Sprint 5).
 *
 * Re-skinned to redesign tokens (#671): the card chrome rides --surface /
 * --ink / --line via the `.clubs-card` CSS layer (dark mode "just works" — R10,
 * lessons 092/093/096), and the health badge reuses the desktop table's
 * `.clubs-status-pill` classes + shared label/modifier helpers so the same
 * datum reads identically on both surfaces (lesson 052 — one definition).
 *
 * CC-7 (#872, epic #873 Sprint 2): the card is a real `<Link>`, not a
 * JS-navigating `<button>`. That restores middle-click / ⌘-click / open-in-new-
 * tab / mobile long-press and announces the destination to assistive tech.
 * `state` round-trips the caller's filter context (e.g. `fromClubsSearch`) so
 * the club page's breadcrumb can return to the exact filtered list (#577).
 */

interface ClubCardProps {
  club: ProcessedClubTrend
  /** Destination club-detail route (e.g. `/district/61/club/123`). */
  to: string
  /** Optional router location state to carry to the destination. */
  state?: unknown
}

const ClubCard: React.FC<ClubCardProps> = ({ club, to, state }) => {
  const label = getClubHealthStatusLabel(club.currentStatus)
  const modifier = getClubHealthStatusPillModifier(club.currentStatus)
  const memberChange =
    club.latestMembership - (club.membershipBase ?? club.latestMembership)

  return (
    <Link
      to={to}
      state={state}
      className="clubs-card"
      data-testid="club-card"
      aria-label={`${club.clubName} — ${label}, ${club.latestMembership} members`}
    >
      {/* Header: name + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="clubs-card__name">{club.clubName}</h3>
        <span className={`clubs-status-pill ${modifier} flex-shrink-0`}>
          {label}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="clubs-card__stat-val tabular-nums">
            {club.latestMembership}
          </div>
          <div className="clubs-card__stat-label">Members</div>
        </div>
        <div>
          <div className="clubs-card__stat-val tabular-nums">
            {memberChange > 0 ? '+' : ''}
            {memberChange}
          </div>
          <div className="clubs-card__stat-label">Net Change</div>
        </div>
        <div>
          <div className="clubs-card__stat-val tabular-nums">
            {club.latestDcpGoals}
            <span className="clubs-card__stat-unit">/10</span>
          </div>
          <div className="clubs-card__stat-label">DCP Goals</div>
        </div>
      </div>
    </Link>
  )
}

export default ClubCard
