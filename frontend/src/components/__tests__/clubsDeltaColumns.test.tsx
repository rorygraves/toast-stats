/**
 * #795 (epic #821 Sprint 3) — TanStack column model for the opt-in "Changes"
 * column group.
 *
 * The base `clubsColumns` array (#835 / Sprint 1) ships the current-snapshot
 * columns and stays unchanged (R11 — additive). The delta columns are produced
 * by a separate factory that takes a `clubDiffsById` lookup and returns column
 * defs the table concatenates. The factory shape keeps the closure over the
 * lookup explicit, so each cell renders the right ClubDiff without ClubsTable
 * needing to know about the diff schema.
 */

import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { flexRender, type CellContext } from '@tanstack/react-table'
import { buildClubsDeltaColumns } from '../clubsDeltaColumns'
import type { ProcessedClubTrend } from '../filters/types'
import type { ClubDiff } from '@toastmasters/shared-contracts'

afterEach(() => cleanup())

const club = (
  overrides: Partial<ProcessedClubTrend> = {}
): ProcessedClubTrend =>
  ({
    clubId: 'c1',
    clubName: 'Alpha',
    divisionId: 'A',
    divisionName: 'A',
    areaId: '1',
    areaName: '1',
    distinguishedLevel: 'NotDistinguished',
    currentStatus: 'thriving',
    riskFactors: [],
    membershipTrend: [],
    dcpGoalsTrend: [],
    latestMembership: 0,
    latestDcpGoals: 0,
    distinguishedOrder: 0,
    membersNeeded: 0,
    yearsChartered: null,
    ...overrides,
  }) as ProcessedClubTrend

const diff = (over: Partial<ClubDiff> = {}): ClubDiff => ({
  clubId: 'c1',
  clubName: 'Alpha',
  divisionId: 'A',
  areaId: '1',
  membership: { from: 20, to: 26, delta: 6 },
  payments: { from: 20, to: 25, delta: 5 },
  dcpGoals: { from: 4, to: 5, delta: 1 },
  distinguishedFrom: '',
  distinguishedTo: 'D',
  distinguishedChanged: true,
  ...over,
})

/** Render a column's cell against a row by invoking its `cell` renderer
 *  with a minimal CellContext stub. */
function renderCell(
  col: ReturnType<typeof buildClubsDeltaColumns>[number],
  row: ProcessedClubTrend
) {
  const cell = (
    col as {
      cell?: (ctx: CellContext<ProcessedClubTrend, unknown>) => React.ReactNode
    }
  ).cell
  if (!cell) throw new Error('column has no cell renderer')
  const ctx = {
    row: { original: row },
    getValue: () => undefined,
    column: { id: (col as { id?: string }).id ?? '' },
  } as unknown as CellContext<ProcessedClubTrend, unknown>
  return render(<>{flexRender(cell, ctx)}</>)
}

describe('buildClubsDeltaColumns (#795)', () => {
  it('produces the five delta column ids in display order', () => {
    const cols = buildClubsDeltaColumns(new Map())
    expect(cols.map(c => c.id)).toEqual([
      'deltaMembership',
      'deltaPayments',
      'deltaDcpGoals',
      'tierTransition',
      'distinguishedFlip',
    ])
  })

  it('renders membership delta via ChangeIndicator when diff is present', () => {
    const map = new Map<string, ClubDiff>([['c1', diff()]])
    const cols = buildClubsDeltaColumns(map)
    const membershipCol = cols.find(c => c.id === 'deltaMembership')!
    renderCell(membershipCol, club({ clubId: 'c1' }))
    const indicator = screen.getByTestId('change-indicator')
    expect(indicator).toHaveTextContent('+6')
    // a11y: signed direction must NOT rely on color alone (lesson 102).
    expect(screen.getByText(/increase/i)).toBeInTheDocument()
  })

  it('renders a muted em-dash when the row has no matching diff', () => {
    const map = new Map<string, ClubDiff>()
    const cols = buildClubsDeltaColumns(map)
    const membershipCol = cols.find(c => c.id === 'deltaMembership')!
    renderCell(membershipCol, club({ clubId: 'unknown' }))
    expect(screen.queryByTestId('change-indicator')).not.toBeInTheDocument()
    expect(document.body).toHaveTextContent('—')
  })

  it('renders payments delta via ChangeIndicator', () => {
    const map = new Map<string, ClubDiff>([
      ['c1', diff({ payments: { from: 100, to: 92, delta: -8 } })],
    ])
    const cols = buildClubsDeltaColumns(map)
    const col = cols.find(c => c.id === 'deltaPayments')!
    renderCell(col, club({ clubId: 'c1' }))
    expect(screen.getByTestId('change-indicator')).toHaveTextContent('−8')
    expect(screen.getByText(/decrease/i)).toBeInTheDocument()
  })

  it('renders DCP-goals delta via ChangeIndicator', () => {
    const map = new Map<string, ClubDiff>([
      ['c1', diff({ dcpGoals: { from: 4, to: 5, delta: 1 } })],
    ])
    const cols = buildClubsDeltaColumns(map)
    const col = cols.find(c => c.id === 'deltaDcpGoals')!
    renderCell(col, club({ clubId: 'c1' }))
    expect(screen.getByTestId('change-indicator')).toHaveTextContent('+1')
  })

  it('renders tier transition as "From → To" using display names', () => {
    const map = new Map<string, ClubDiff>([
      ['c1', diff({ distinguishedFrom: '', distinguishedTo: 'D' })],
    ])
    const cols = buildClubsDeltaColumns(map)
    const col = cols.find(c => c.id === 'tierTransition')!
    renderCell(col, club({ clubId: 'c1' }))
    // Arrow direction must be conveyed by text, not color alone.
    expect(document.body).toHaveTextContent(/None.*Distinguished/)
  })

  it('renders distinguished flip as "Became" / "Lost" / muted dash', () => {
    const becameMap = new Map<string, ClubDiff>([
      [
        'c1',
        diff({
          distinguishedFrom: '',
          distinguishedTo: 'D',
          distinguishedChanged: true,
        }),
      ],
    ])
    const col = buildClubsDeltaColumns(becameMap).find(
      c => c.id === 'distinguishedFlip'
    )!
    renderCell(col, club({ clubId: 'c1' }))
    expect(document.body).toHaveTextContent(/became/i)
    cleanup()

    const lostMap = new Map<string, ClubDiff>([
      [
        'c1',
        diff({
          distinguishedFrom: 'P',
          distinguishedTo: '',
          distinguishedChanged: true,
        }),
      ],
    ])
    const col2 = buildClubsDeltaColumns(lostMap).find(
      c => c.id === 'distinguishedFlip'
    )!
    renderCell(col2, club({ clubId: 'c1' }))
    expect(document.body).toHaveTextContent(/lost/i)
  })

  it('renders distinguished flip as em-dash when status did not change', () => {
    const map = new Map<string, ClubDiff>([
      [
        'c1',
        diff({
          distinguishedFrom: 'D',
          distinguishedTo: 'D',
          distinguishedChanged: false,
        }),
      ],
    ])
    const col = buildClubsDeltaColumns(map).find(
      c => c.id === 'distinguishedFlip'
    )!
    renderCell(col, club({ clubId: 'c1' }))
    expect(document.body).toHaveTextContent('—')
  })
})
