/**
 * Club operational-status cell (epic #1062 Sprint 4 #1069).
 *
 * Renders the base `clubStatus` plainly, OR — when a read-time Dues Renewal
 * overlay promoted the club to Active during the closing period — the augmented
 * status with a **provenance affordance**. The affordance always names the
 * source + verified date (and discloses the frozen base in the accessible
 * label) so two cadences are never silently blended into one number (the #800 /
 * D61 150→151 hazard). The base snapshot value is never mutated.
 */

import type { ClubStatusOverlay } from '../utils/clubStatusOverlay'

export interface ClubStatusCellProps {
  /** The frozen base operational status from the dashboard snapshot. */
  clubStatus?: string | undefined
  /** The read-time augmentation, present only when the club was promoted. */
  statusOverlay?: ClubStatusOverlay | undefined
}

export function ClubStatusCell({
  clubStatus,
  statusOverlay,
}: ClubStatusCellProps) {
  if (statusOverlay) {
    const base = clubStatus ?? 'no base status'
    const label = `${statusOverlay.status} — renewal verified ${statusOverlay.activeSince} (daily Dues Renewal report${
      statusOverlay.asOf ? `, as of ${statusOverlay.asOf}` : ''
    }); base dashboard status: ${base}`
    return (
      <span className="club-status-overlay" role="note" aria-label={label}>
        <span className="club-status-overlay__status">
          {statusOverlay.status}
        </span>
        <span className="club-status-overlay__mark" title={label}>
          <span aria-hidden="true">✓</span> renewal verified{' '}
          {statusOverlay.activeSince}
        </span>
      </span>
    )
  }

  if (clubStatus) return <span>{clubStatus}</span>
  return <span className="clubs-cell-muted">—</span>
}
