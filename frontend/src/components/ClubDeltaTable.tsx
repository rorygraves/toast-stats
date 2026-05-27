import React, { useMemo, useState } from 'react'
import type {
  SnapshotDiff,
  ClubDiff,
  ClubPresence,
} from '@toastmasters/shared-contracts'
import { ChangeIndicator } from './ChangeIndicator'
import { ExportButton } from './ExportButton'
import { exportSnapshotDiff } from '../utils/csvExport'
import { distinguishedTierName } from '../utils/distinguishedTier'
import { useIsMobile } from '../hooks/useIsMobile'

/**
 * #795 (epic #797 Sprint 3) — per-club delta table, the drill-down beneath the
 * "What Changed" digest on `/district/:id/changes`.
 *
 * This is a NEW table, not an extension of `ClubsTable` (R6 / lesson 117): the
 * current-state ClubsTable is bound to `ClubTrend[]` (one snapshot) while the
 * diff is `ClubDiff[]` (from/to/delta). Fusing the two would import a behaviour
 * change under the banner of a refactor. The pipeline is the proven shape
 * (R11): `bothPresent → changedOnly-filtered → sorted` — adding "changed only"
 * is a new step, not a replacement.
 *
 * - Signed deltas via `ChangeIndicator` (lesson 102 — render the signed actual;
 *   WCAG 1.4.1 — direction by arrow + text, never colour alone).
 * - Roster appear/disappear is classified into its own groups with the club
 *   status as the reason (lesson 118), never mixed into the per-club rows.
 * - Collapses to cards below 640px (lesson 105 — clubs are browsed one at a
 *   time, so card-collapse preserves the per-row reading the table is for).
 */

/** Human transition text for the distinguished cell. v1 leans on the became/
 *  lost boolean (epic open question); tier-to-tier shows both names. Tier names
 *  come from the shared `distinguishedTier` helper (one home — lesson 117). */
function distinguishedText(from: string, to: string): string | null {
  if (from === to) return null
  if (!from && to) return `Became ${distinguishedTierName(to)}`
  if (from && !to) return 'Lost Distinguished status'
  return `${distinguishedTierName(from)} → ${distinguishedTierName(to)}`
}

type SortField = 'name' | 'membership' | 'payments' | 'dcpGoals'
type SortDirection = 'asc' | 'desc'

function isChanged(c: ClubDiff): boolean {
  return (
    c.membership.delta !== 0 ||
    c.payments.delta !== 0 ||
    c.dcpGoals.delta !== 0 ||
    c.distinguishedChanged
  )
}

const DistinguishedCell: React.FC<{ club: ClubDiff }> = ({ club }) => {
  const text = distinguishedText(club.distinguishedFrom, club.distinguishedTo)
  if (!text) return <span className="clubs-cell-muted">—</span>
  const becameOrTier = !!club.distinguishedTo
  return (
    <span
      className={`club-delta__dist ${
        becameOrTier ? 'text-green-700' : 'text-red-700'
      }`}
    >
      {text}
    </span>
  )
}

const RosterGroup: React.FC<{
  testId: string
  heading: string
  clubs: ClubPresence[]
}> = ({ testId, heading, clubs }) => {
  if (clubs.length === 0) return null
  return (
    <details className="changes-group" data-testid={testId} open>
      <summary className="changes-group__summary">
        {heading} <span className="changes-group__count">({clubs.length})</span>
      </summary>
      <ul className="changes-group__list">
        {clubs.map(c => (
          <li key={c.clubId} className="changes-group__item">
            <span className="club-delta__roster-name">{c.clubName}</span>
            {' · '}
            <span className="clubs-cell-muted">
              Division {c.divisionId}, Area {c.areaId}
            </span>
            {c.clubStatus && (
              <span className="club-delta__roster-status">
                {' — '}
                {c.clubStatus}
              </span>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}

export interface ClubDeltaTableProps {
  diff: SnapshotDiff
}

export const ClubDeltaTable: React.FC<ClubDeltaTableProps> = ({ diff }) => {
  const [changedOnly, setChangedOnly] = useState(false)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const isMobile = useIsMobile(640)

  // Pipeline (R11): original → changedOnly-filtered → sorted. Each stage is a
  // step, never a replacement of the prior one.
  const filtered = useMemo(
    () =>
      changedOnly
        ? diff.clubs.bothPresent.filter(isChanged)
        : diff.clubs.bothPresent,
    [diff.clubs.bothPresent, changedOnly]
  )

  const sorted = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      let cmp: number
      if (sortField === 'name') {
        cmp = a.clubName.toLowerCase().localeCompare(b.clubName.toLowerCase())
      } else {
        cmp = a[sortField].delta - b[sortField].delta
      }
      if (cmp !== 0) return cmp * dir
      return a.clubName.toLowerCase().localeCompare(b.clubName.toLowerCase())
    })
  }, [filtered, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  const sortIndicator = (field: SortField) =>
    field === sortField ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''

  const hasRows = sorted.length > 0
  const totalBoth = diff.clubs.bothPresent.length

  return (
    <section className="club-delta" aria-label="Per-club changes">
      <div className="club-delta__header">
        <h2 className="club-delta__title">Club Changes</h2>
        <div className="club-delta__controls">
          <label className="club-delta__toggle">
            <input
              type="checkbox"
              data-testid="changed-only-toggle"
              checked={changedOnly}
              onChange={e => setChangedOnly(e.target.checked)}
            />
            Changed only
          </label>
          <ExportButton
            onExport={() => exportSnapshotDiff(diff)}
            label="Export changes"
            disabled={
              totalBoth === 0 &&
              diff.clubs.onlyInTo.length === 0 &&
              diff.clubs.onlyInFrom.length === 0
            }
          />
        </div>
      </div>

      {totalBoth > 0 && !hasRows && (
        <p className="district-changes__empty" data-testid="club-delta-empty">
          No clubs changed between these two dates.
        </p>
      )}

      {hasRows && isMobile && (
        <div className="club-delta__cards" data-testid="club-delta-cards">
          {sorted.map(club => (
            <div key={club.clubId} className="club-delta-card">
              <div className="club-delta-card__name">{club.clubName}</div>
              <div className="club-delta-card__meta clubs-cell-muted">
                Division {club.divisionId}, Area {club.areaId}
              </div>
              <dl className="club-delta-card__metrics">
                <div>
                  <dt>Members</dt>
                  <dd>
                    <ChangeIndicator value={club.membership.delta} />
                  </dd>
                </div>
                <div>
                  <dt>Payments</dt>
                  <dd>
                    <ChangeIndicator value={club.payments.delta} />
                  </dd>
                </div>
                <div>
                  <dt>DCP goals</dt>
                  <dd>
                    <ChangeIndicator value={club.dcpGoals.delta} />
                  </dd>
                </div>
                <div>
                  <dt>Distinguished</dt>
                  <dd>
                    <DistinguishedCell club={club} />
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}

      {hasRows && !isMobile && (
        <div
          className="club-delta__scroll overflow-x-auto"
          role="region"
          aria-label="Per-club changes table"
          tabIndex={0}
        >
          <table className="club-delta__table" data-testid="club-delta-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="club-delta__sort"
                    onClick={() => handleSort('name')}
                  >
                    Club{sortIndicator('name')}
                  </button>
                </th>
                <th>Div</th>
                <th>Area</th>
                <th>
                  <button
                    type="button"
                    className="club-delta__sort"
                    onClick={() => handleSort('membership')}
                  >
                    Δ Members{sortIndicator('membership')}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="club-delta__sort"
                    onClick={() => handleSort('payments')}
                  >
                    Δ Payments{sortIndicator('payments')}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="club-delta__sort"
                    onClick={() => handleSort('dcpGoals')}
                  >
                    Δ DCP goals{sortIndicator('dcpGoals')}
                  </button>
                </th>
                <th>Distinguished</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(club => (
                <tr key={club.clubId}>
                  <td className="club-delta__name">{club.clubName}</td>
                  <td className="club-delta__center clubs-cell-muted">
                    {club.divisionId}
                  </td>
                  <td className="club-delta__center clubs-cell-muted">
                    {club.areaId}
                  </td>
                  <td className="club-delta__center">
                    <ChangeIndicator value={club.membership.delta} />
                  </td>
                  <td className="club-delta__center">
                    <ChangeIndicator value={club.payments.delta} />
                  </td>
                  <td className="club-delta__center">
                    <ChangeIndicator value={club.dcpGoals.delta} />
                  </td>
                  <td className="club-delta__center">
                    <DistinguishedCell club={club} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RosterGroup
        testId="roster-joined"
        heading="Clubs that joined the roster"
        clubs={diff.clubs.onlyInTo}
      />
      <RosterGroup
        testId="roster-left"
        heading="Clubs that left the roster"
        clubs={diff.clubs.onlyInFrom}
      />
    </section>
  )
}

export default ClubDeltaTable
