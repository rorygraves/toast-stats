/* ClubMiniList (#871, epic #873 Sprint 1 — CC-4).
 *
 * Mobile (<768px) replacement for the Division / Area club mini-tables. The
 * 4-column table (Club | Status | Members | Distinguished) is wider than a
 * 375px phone, so the Status column scrolls off the right edge and the chip
 * clips to "✗ Intervention R…". Per the audit ("let it be a chip, don't try to
 * table it") and Lesson 105 (browse-one-row lists card-collapse on mobile),
 * each club becomes a stacked card: name + a fully-visible StatusChip, with
 * Members / Distinguished as a muted meta line so no column data is lost.
 *
 * Reuses the themed `.clubs-card` chrome (--surface / --line / --ink) so dark
 * mode just works (R10). CC-7 (#872, epic #873 Sprint 2): each card is now a
 * real `<Link>` (was a JS-navigating `<button>` via onSelect), so long-press /
 * open-in-new-tab work on mobile — the surface this list serves — and the
 * destination is announced to assistive tech. The caller supplies `clubTo` to
 * build the href (the pages own the districtId). */

import React from 'react'
import { Link } from 'react-router-dom'
import type { ClubTrend } from '../hooks/useDistrictAnalytics'
import { getClubHealthStatusLabel } from '../utils/clubHealthStatus'
import { StatusChip } from './StatusChip'

interface ClubMiniListProps {
  clubs: ClubTrend[]
  /** Build the club-detail href for a club (e.g. `/district/61/club/123`). */
  clubTo: (club: ClubTrend) => string
}

export const ClubMiniList: React.FC<ClubMiniListProps> = ({
  clubs,
  clubTo,
}) => (
  <div className="flex flex-col gap-3">
    {clubs.map(c => {
      const members = c.membershipTrend[c.membershipTrend.length - 1]?.count
      const distinguished =
        c.distinguishedLevel === 'NotDistinguished'
          ? null
          : c.distinguishedLevel
      return (
        <Link
          key={c.clubId}
          to={clubTo(c)}
          className="clubs-card"
          aria-label={`${c.clubName} — ${getClubHealthStatusLabel(
            c.currentStatus
          )}, ${members ?? 0} members`}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="clubs-card__name">{c.clubName}</h3>
            <StatusChip status={c.currentStatus} className="flex-shrink-0" />
          </div>
          <div className="clubs-card__stat-label" style={{ marginTop: 8 }}>
            {members ?? '—'} member{members === 1 ? '' : 's'}
            {distinguished ? ` · ${distinguished}` : ''}
          </div>
        </Link>
      )
    })}
  </div>
)

export default ClubMiniList
