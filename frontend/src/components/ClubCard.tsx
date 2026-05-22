import React from 'react'
import type { ProcessedClubTrend } from './filters/types'

/**
 * ClubCard (#217) — Mobile card layout for clubs.
 * Replaces table rows on viewports < 768px.
 */

interface ClubCardProps {
  club: ProcessedClubTrend
  onClick?: ((club: ProcessedClubTrend) => void) | undefined
}

/**
 * Status badge color mapping based on ClubHealthStatus.
 */
function statusStyles(status: string): { bg: string; text: string } {
  switch (status) {
    case 'thriving':
      return { bg: '#dcfce7', text: '#15803d' }
    case 'vulnerable':
      return { bg: '#fef9c3', text: '#854d0e' }
    case 'intervention-required':
      return { bg: '#fee2e2', text: '#991b1b' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280' }
  }
}

/**
 * Format health status for display.
 */
function formatStatus(status: string): string {
  switch (status) {
    case 'thriving':
      return 'Thriving'
    case 'vulnerable':
      return 'Vulnerable'
    case 'intervention-required':
      return 'Needs Attention'
    default:
      return status
  }
}

const ClubCard: React.FC<ClubCardProps> = ({ club, onClick }) => {
  const status = statusStyles(club.currentStatus)
  const displayStatus = formatStatus(club.currentStatus)
  const memberChange =
    club.latestMembership - (club.membershipBase ?? club.latestMembership)

  return (
    <button
      type="button"
      onClick={() => onClick?.(club)}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-tm-loyal-blue-30 transition-all"
      data-testid="club-card"
      aria-label={`${club.clubName} — ${displayStatus}, ${club.latestMembership} members`}
    >
      {/* Header: name + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-tm-headline font-semibold text-gray-900 text-sm leading-tight">
          {club.clubName}
        </h3>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          {displayStatus}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-lg font-bold text-gray-900">
            {club.latestMembership}
          </div>
          <div className="text-xs text-gray-500">Members</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">
            {memberChange > 0 ? '+' : ''}
            {memberChange}
          </div>
          <div className="text-xs text-gray-500">Net Change</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">
            {club.latestDcpGoals}
            <span className="text-xs text-gray-600 font-normal">/10</span>
          </div>
          <div className="text-xs text-gray-500">DCP Goals</div>
        </div>
      </div>
    </button>
  )
}

export default ClubCard
