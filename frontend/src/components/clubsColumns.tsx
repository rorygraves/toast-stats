/**
 * TanStack column model for the club table (#835, epic #821 Sprint 1).
 *
 * This is the presentation / sort / sizing / pinning descriptor set that
 * replaces the hand-rolled `COLUMN_CONFIGS.map` header + hand-ordered `<td>`
 * body that ClubsTable used to carry inline. The **filter** subsystem keeps its
 * own metadata in `filters/types.ts` `COLUMN_CONFIGS` (consumed by the Filters
 * drawer, the URL codec, the active-filters bar) — see ADR-006: the column
 * model and the filter model are deliberately separate concerns.
 *
 * Sort fidelity to the pre-migration switch comparator (Lesson 117 — a
 * migration must not change output):
 *   • Each `accessorFn` returns the exact value the old switch compared on
 *     (lowercased strings; the precomputed `distinguishedOrder`; a status-rank
 *     map). `sortingFn: 'basic'` (`a < b ? -1 : a > b ? 1 : 0`) reproduces the
 *     old `<`/`>` comparison.
 *   • `sortUndefined: 'last'` reproduces "undefined sorts to the end regardless
 *     of direction" (TanStack applies it outside the desc negation).
 *   • The old "secondary sort by club name, always ascending" is reproduced by
 *     feeding ClubsTable's data to the table **pre-sorted by name asc**:
 *     TanStack's sort is stable, so equal-primary rows keep that name-asc order
 *     in both directions. (See `clubsColumns.test.tsx`.)
 */

import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import type { ProcessedClubTrend } from './filters/types'
import type { ClubTrend, ClubHealthStatus } from '../hooks/useDistrictAnalytics'
import { isProvisionallyDistinguished } from '../utils/provisionalDistinguished'
import {
  getClubHealthStatusLabel,
  getClubHealthStatusPillModifier,
} from '../utils/clubHealthStatus'

// DCP tier pill maps (#669): confirmed tiers carry their HANDOFF §256 color; a
// provisional tier shows the striped-yellow "projected" stripe; NotDistinguished
// has no pill (a muted em-dash). Module-scope constants — no per-render realloc.
type ConfirmedTier = Exclude<
  ClubTrend['distinguishedLevel'],
  'NotDistinguished'
>

const TIER_DISPLAY: Record<ConfirmedTier, string> = {
  Distinguished: 'Distinguished',
  Select: 'Select',
  President: "President's",
  Smedley: 'Smedley',
}

const TIER_MODIFIER: Record<ConfirmedTier, string> = {
  Distinguished: 'clubs-tier-pill--distinguished',
  Select: 'clubs-tier-pill--select',
  President: 'clubs-tier-pill--presidents',
  Smedley: 'clubs-tier-pill--smedley',
}

const STATUS_RANK: Record<ClubHealthStatus, number> = {
  'intervention-required': 0,
  vulnerable: 1,
  thriving: 2,
}

/** Responsive priority per column (ADR-006 §3). `sticky` = the pinned key
 *  column (never hidden); `desktop` = revealed only ≥1280px (hidden at the
 *  768–1279 tablet tier); `core` = always shown when the table renders. */
export type ClubColumnPriority = 'sticky' | 'desktop' | 'core'

const STICKY_FIELD = 'name'
const DESKTOP_ONLY_FIELDS: ReadonlySet<string> = new Set([
  'division',
  'area',
  'newMembers',
  'octoberRenewals',
  'aprilRenewals',
  'clubStatus',
  'yearsChartered',
])

export const clubColumnPriority = (id: string): ClubColumnPriority =>
  id === STICKY_FIELD
    ? 'sticky'
    : DESKTOP_ONLY_FIELDS.has(id)
      ? 'desktop'
      : 'core'

/** Responsive priority CSS class for a header/cell — matches the pre-migration
 *  `colPriorityClass` exactly so the existing CSS (sticky + @media hide) and
 *  the parity tests keep working unchanged. */
export const clubColumnPriorityClass = (id: string): string => {
  const p = clubColumnPriority(id)
  return p === 'sticky'
    ? 'clubs-table__sticky-col'
    : p === 'desktop'
      ? 'clubs-table__col--desktop'
      : ''
}

// Per-column `<td>` class WITHOUT the priority class (ClubsTable appends
// `clubColumnPriorityClass(id)`), reproducing the original cell classes exactly.
const TD_BASE_CLASS: Record<string, string> = {
  name: 'px-2 py-3 whitespace-nowrap',
  division: 'px-2 py-3 whitespace-nowrap text-sm clubs-cell-muted text-center',
  area: 'px-2 py-3 whitespace-nowrap text-sm clubs-cell-muted text-center',
  status: 'px-2 py-3 whitespace-nowrap text-center',
  membership:
    'px-2 py-3 whitespace-nowrap text-sm text-center clubs-members-cell',
  membersNeeded:
    'px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center font-medium',
  newMembers: 'px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center',
  octoberRenewals:
    'px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center',
  aprilRenewals: 'px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center',
  dcpGoals: 'px-2 py-3 whitespace-nowrap text-center',
  distinguished: 'px-2 py-3 whitespace-nowrap text-center',
  clubStatus: 'px-2 py-3 whitespace-nowrap text-sm text-center',
  yearsChartered:
    'px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center',
  // Opt-in "Changes" group delta cells (#795). Same vertical rhythm as the
  // core numeric cells; ChangeIndicator owns the colour + sign + arrow.
  deltaMembership:
    'px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center',
  deltaPayments: 'px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center',
  deltaDcpGoals: 'px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center',
  tierTransition: 'px-2 py-3 whitespace-nowrap text-sm text-center',
  distinguishedFlip: 'px-2 py-3 whitespace-nowrap text-sm text-center',
}

/** Exact `<td>` className for a column: base + responsive priority class. */
export const clubColumnTdClass = (id: string): string =>
  `${TD_BASE_CLASS[id] ?? 'px-2 py-3 whitespace-nowrap'} ${clubColumnPriorityClass(id)}`.trim()

const colHelper = createColumnHelper<ProcessedClubTrend>()

/** A muted em-dash placeholder, shared by the optional numeric/text columns. */
const Dash: React.FC = () => <span className="clubs-cell-muted">—</span>

/** Optional integer cell: em-dash when undefined; muted when zero. Matches the
 *  New / Oct Renew / Apr Renew cells exactly. */
const OptionalCount: React.FC<{ value: number | undefined }> = ({ value }) =>
  value !== undefined ? (
    <span className={value === 0 ? 'clubs-cell-muted' : undefined}>
      {value}
    </span>
  ) : (
    <Dash />
  )

export const clubsColumns = [
  colHelper.accessor(c => c.clubName.toLowerCase(), {
    id: 'name',
    header: 'Club',
    sortingFn: 'basic',
    cell: info => (
      <div className="font-medium text-sm">{info.row.original.clubName}</div>
    ),
  }),
  colHelper.accessor(c => c.divisionName.toLowerCase(), {
    id: 'division',
    header: 'Div',
    sortingFn: 'basic',
    cell: info => info.row.original.divisionName,
  }),
  colHelper.accessor(c => c.areaName.toLowerCase(), {
    id: 'area',
    header: 'Area',
    sortingFn: 'basic',
    cell: info => info.row.original.areaName,
  }),
  colHelper.accessor(c => STATUS_RANK[c.currentStatus], {
    id: 'status',
    header: 'Status',
    sortingFn: 'basic',
    cell: info => {
      const status = info.row.original.currentStatus
      return (
        <span
          className={`clubs-status-pill ${getClubHealthStatusPillModifier(status)}`}
        >
          {getClubHealthStatusLabel(status)}
        </span>
      )
    },
  }),
  colHelper.accessor(c => c.latestMembership, {
    id: 'membership',
    header: 'Members',
    sortingFn: 'basic',
    cell: info => {
      const club = info.row.original
      return (
        <>
          <span className="tabular-nums">{club.latestMembership}</span>
          {club.membershipBase !== undefined && (
            <span className="clubs-cell-muted tabular-nums">
              {' / '}
              {club.membershipBase}
            </span>
          )}
        </>
      )
    },
  }),
  colHelper.accessor(c => c.membersNeeded, {
    id: 'membersNeeded',
    header: 'Needed',
    sortingFn: 'basic',
    cell: info =>
      info.row.original.membersNeeded > 0 ? (
        <span className="text-tm-true-maroon">
          {info.row.original.membersNeeded}
        </span>
      ) : (
        <Dash />
      ),
  }),
  colHelper.accessor(c => c.newMembers, {
    id: 'newMembers',
    header: 'New',
    sortingFn: 'basic',
    sortUndefined: 'last',
    cell: info => <OptionalCount value={info.row.original.newMembers} />,
  }),
  colHelper.accessor(c => c.octoberRenewals, {
    id: 'octoberRenewals',
    header: 'Oct Renew',
    sortingFn: 'basic',
    sortUndefined: 'last',
    cell: info => <OptionalCount value={info.row.original.octoberRenewals} />,
  }),
  colHelper.accessor(c => c.aprilRenewals, {
    id: 'aprilRenewals',
    header: 'Apr Renew',
    sortingFn: 'basic',
    sortUndefined: 'last',
    cell: info => <OptionalCount value={info.row.original.aprilRenewals} />,
  }),
  colHelper.accessor(c => c.latestDcpGoals, {
    id: 'dcpGoals',
    header: 'DCP',
    sortingFn: 'basic',
    cell: info => {
      const goals = Math.max(0, Math.min(10, info.row.original.latestDcpGoals))
      const pct = (goals / 10) * 100
      return (
        <div className="clubs-dcp-cell">
          <span className="clubs-dcp-cell__val tabular-nums">{goals}/10</span>
          <div
            className="clubs-dcp-bar"
            role="progressbar"
            aria-valuenow={goals}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-label="DCP goals achieved"
          >
            <div className="clubs-dcp-bar__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )
    },
  }),
  colHelper.accessor(c => c.distinguishedOrder, {
    id: 'distinguished',
    header: 'Tier',
    sortingFn: 'basic',
    cell: info => {
      const club = info.row.original
      if (club.distinguishedLevel === 'NotDistinguished') {
        return <span className="text-sm clubs-cell-muted">—</span>
      }
      const provisional = isProvisionallyDistinguished(club)
      const modifier = provisional
        ? 'clubs-tier-pill--projected'
        : TIER_MODIFIER[club.distinguishedLevel]
      return (
        <span
          className={`clubs-tier-pill ${modifier}`}
          title={
            provisional
              ? 'Provisional — membership not yet confirmed by April renewals'
              : 'Confirmed — April renewals recorded'
          }
        >
          {TIER_DISPLAY[club.distinguishedLevel]}
          {provisional ? '*' : ''}
        </span>
      )
    },
  }),
  colHelper.accessor(c => c.clubStatus?.toLowerCase(), {
    id: 'clubStatus',
    header: 'Club Status',
    sortingFn: 'basic',
    sortUndefined: 'last',
    cell: info =>
      info.row.original.clubStatus ? (
        <span>{info.row.original.clubStatus}</span>
      ) : (
        <Dash />
      ),
  }),
  colHelper.accessor(c => c.yearsChartered ?? undefined, {
    id: 'yearsChartered',
    header: 'Years',
    sortingFn: 'basic',
    sortUndefined: 'last',
    cell: info =>
      info.row.original.yearsChartered !== null ? (
        <span>{info.row.original.yearsChartered}</span>
      ) : (
        <Dash />
      ),
  }),
]
