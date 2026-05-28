/**
 * TanStack column model for the opt-in "Changes" column group
 * (#795, epic #821 Sprint 3, ADR-006 §4).
 *
 * The base `clubsColumns` (#835 / Sprint 1) ships the 13 current-snapshot
 * columns and stays untouched (R11 — additive insertion, no replacement).
 * `buildClubsDeltaColumns(clubDiffsById)` returns the five delta column defs
 * that ClubsTable concatenates onto `clubsColumns` ONLY when a snapshot diff
 * is loaded. Each cell looks the row up in the closed-over Map and renders via
 * `ChangeIndicator` (signed delta, arrow + sr-only word — never colour alone,
 * lesson 102 / WCAG 1.4.1). A row missing from the diff renders a muted
 * em-dash, NOT a zero — zero would lie about "no change" for a club the diff
 * doesn't cover (e.g. one that just joined the roster).
 *
 * Visibility is driven by ClubsTable's `hiddenGroups` set — the 'changes' group
 * is hidden by default (opt-in via the Columns menu, per #795 acceptance).
 */

import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import type { ClubDiff } from '@toastmasters/shared-contracts'
import type { ProcessedClubTrend } from './filters/types'
import { ChangeIndicator } from './ChangeIndicator'
import { distinguishedTierName } from '../utils/distinguishedTier'

const colHelper = createColumnHelper<ProcessedClubTrend>()

const MutedDash: React.FC = () => <span className="clubs-cell-muted">—</span>

/** Did this club gain a distinguished status (e.g. '' → 'D')? */
const isBecame = (from: string, to: string): boolean => !from && !!to
/** Did this club lose distinguished status (e.g. 'P' → '')? */
const isLost = (from: string, to: string): boolean => !!from && !to

export const CLUBS_DELTA_COLUMN_IDS = [
  'deltaMembership',
  'deltaPayments',
  'deltaDcpGoals',
  'tierTransition',
  'distinguishedFlip',
] as const

export type ClubsDeltaColumnId = (typeof CLUBS_DELTA_COLUMN_IDS)[number]

/**
 * Build the five delta column defs over a `clubDiffsById` lookup. The closure
 * is explicit so ClubsTable doesn't need to thread the diff into TanStack's
 * `meta` (which would broaden the column type for every cell). Empty map ⇒
 * every cell renders the muted em-dash (e.g. while the diff is loading).
 */
export const buildClubsDeltaColumns = (
  clubDiffsById: Map<string, ClubDiff>
) => [
  colHelper.display({
    id: 'deltaMembership',
    header: 'Δ Members',
    cell: info => {
      const d = clubDiffsById.get(info.row.original.clubId)
      if (!d) return <MutedDash />
      return <ChangeIndicator value={d.membership.delta} />
    },
  }),
  colHelper.display({
    id: 'deltaPayments',
    header: 'Δ Payments',
    cell: info => {
      const d = clubDiffsById.get(info.row.original.clubId)
      if (!d) return <MutedDash />
      return <ChangeIndicator value={d.payments.delta} />
    },
  }),
  colHelper.display({
    id: 'deltaDcpGoals',
    header: 'Δ DCP',
    cell: info => {
      const d = clubDiffsById.get(info.row.original.clubId)
      if (!d) return <MutedDash />
      return <ChangeIndicator value={d.dcpGoals.delta} />
    },
  }),
  colHelper.display({
    id: 'tierTransition',
    header: 'Tier change',
    cell: info => {
      const d = clubDiffsById.get(info.row.original.clubId)
      if (!d) return <MutedDash />
      if (!d.distinguishedChanged) return <MutedDash />
      const from = distinguishedTierName(d.distinguishedFrom)
      const to = distinguishedTierName(d.distinguishedTo)
      return (
        <span className="clubs-tier-transition">
          <span>{from}</span>
          <span aria-hidden="true" className="clubs-tier-transition__arrow">
            {' → '}
          </span>
          <span>{to}</span>
        </span>
      )
    },
  }),
  colHelper.display({
    id: 'distinguishedFlip',
    header: 'Distinguished?',
    cell: info => {
      const d = clubDiffsById.get(info.row.original.clubId)
      if (!d || !d.distinguishedChanged) return <MutedDash />
      if (isBecame(d.distinguishedFrom, d.distinguishedTo)) {
        return (
          <span className="clubs-distinguished-flip clubs-distinguished-flip--became text-green-700">
            Became Distinguished
          </span>
        )
      }
      if (isLost(d.distinguishedFrom, d.distinguishedTo)) {
        return (
          <span className="clubs-distinguished-flip clubs-distinguished-flip--lost text-red-700">
            Lost Distinguished
          </span>
        )
      }
      // Tier-to-tier change (e.g. D → P) is recorded but neither became nor lost.
      return <MutedDash />
    },
  }),
]
