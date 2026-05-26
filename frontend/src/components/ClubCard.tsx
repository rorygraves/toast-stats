import React from 'react'
import type { ProcessedClubTrend } from './filters/types'

/**
 * ClubCard (#217) — Mobile card layout for clubs.
 * Replaces table rows on viewports < 640px (HANDOFF §126; epic #665 Sprint 5).
 *
 * Re-skinned to redesign tokens (#671): the card chrome rides --surface /
 * --ink / --line via the `.clubs-card` CSS layer (dark mode "just works" — R10,
 * lessons 092/093/096), and the health badge reuses the desktop table's
 * `.clubs-status-pill` classes so the same datum reads identically on both
 * surfaces (lesson 052 — one definition, not two).
 */

interface ClubCardProps {
  club: ProcessedClubTrend
  onClick?: ((club: ProcessedClubTrend) => void) | undefined
}

type ClubHealthStatus = 'thriving' | 'vulnerable' | 'intervention-required'

/**
 * Health-status → shared status-pill modifier + display label. Mirrors
 * ClubsTable's getStatusPillModifier / getStatusLabel so the mobile card and
 * the desktop row render the same status identically.
 */
function statusPill(status: string): { modifier: string; label: string } {
  switch (status) {
    case 'vulnerable':
      return { modifier: 'clubs-status-pill--vulnerable', label: 'Vulnerable' }
    case 'intervention-required':
      return {
        modifier: 'clubs-status-pill--intervention',
        label: 'Needs Attention',
      }
    default:
      return { modifier: 'clubs-status-pill--thriving', label: 'Thriving' }
  }
}

const ClubCard: React.FC<ClubCardProps> = ({ club, onClick }) => {
  const { modifier, label } = statusPill(club.currentStatus as ClubHealthStatus)
  const memberChange =
    club.latestMembership - (club.membershipBase ?? club.latestMembership)

  return (
    <button
      type="button"
      onClick={() => onClick?.(club)}
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
    </button>
  )
}

export default ClubCard
