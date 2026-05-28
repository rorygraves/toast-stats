/**
 * Column-model contract for the TanStack-migrated club table (#835, epic #821
 * Sprint 1). `clubsColumns` is the `createColumnHelper<ProcessedClubTrend>()`
 * descriptor array that replaces the hand-rolled `COLUMN_CONFIGS.map` header +
 * hand-ordered `<td>` body in ClubsTable. This guards the migration's
 * load-bearing invariants — the things the ~3,500 lines of ClubsTable.*.test
 * assume but don't pin directly:
 *
 *   1. Column id order === the 13-col HANDOFF SortField order (cell order).
 *   2. Each column declares its responsive `meta.priority`
 *      (sticky / desktop / core), the basis for the sticky key column and the
 *      tablet-tier column hiding (ADR-006 §3).
 *   3. Sorting is faithful to the pre-migration switch comparator: numeric,
 *      string (case-insensitive), the custom Tier order, undefined→end, and the
 *      stable name-asc tiebreak — verified through a real TanStack table.
 */

import { describe, it, expect } from 'vitest'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { renderHook } from '@testing-library/react'
import { clubsColumns, clubColumnPriority } from '../clubsColumns'
import { processClubs } from '../../utils/columnFilterUtils'
import type { ProcessedClubTrend } from '../filters/types'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'

const EXPECTED_ID_ORDER = [
  'name',
  'division',
  'area',
  'status',
  'membership',
  'membersNeeded',
  'newMembers',
  'octoberRenewals',
  'aprilRenewals',
  'dcpGoals',
  'distinguished',
  'clubStatus',
  'yearsChartered',
]

const createMockClub = (overrides: Partial<ClubTrend> = {}): ClubTrend => ({
  clubId: 'club-1',
  clubName: 'Test Club',
  divisionId: 'div-1',
  divisionName: 'A',
  areaId: 'area-1',
  areaName: '1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 20 }],
  dcpGoalsTrend: [{ date: '2026-03-01T00:00:00.000Z', goalsAchieved: 5 }],
  ...overrides,
})

/** Build a sorted row model the way ClubsTable will: name-asc input + a single
 *  sort entry, returning the ordered clubIds. */
function sortedIds(clubs: ClubTrend[], sorting: SortingState): string[] {
  const data = processClubs(clubs).sort((a, b) =>
    a.clubName.toLowerCase().localeCompare(b.clubName.toLowerCase())
  )
  const { result } = renderHook(() =>
    useReactTable<ProcessedClubTrend>({
      data,
      columns: clubsColumns,
      state: { sorting },
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: () => {},
    })
  )
  return result.current.getRowModel().rows.map(r => r.original.clubId)
}

describe('clubsColumns — TanStack column model (#835)', () => {
  it('exposes the 13 columns in the HANDOFF SortField order', () => {
    expect(clubsColumns.map(c => c.id)).toEqual(EXPECTED_ID_ORDER)
  })

  it('declares the responsive priority for each column (ADR-006 §3)', () => {
    const priority = Object.fromEntries(
      clubsColumns.map(c => [c.id, clubColumnPriority(c.id as string)])
    )
    expect(priority.name).toBe('sticky')
    for (const id of [
      'division',
      'area',
      'newMembers',
      'octoberRenewals',
      'aprilRenewals',
      'clubStatus',
      'yearsChartered',
    ]) {
      expect(priority[id]).toBe('desktop')
    }
    for (const id of [
      'status',
      'membership',
      'membersNeeded',
      'dcpGoals',
      'distinguished',
    ]) {
      expect(priority[id]).toBe('core')
    }
  })

  it('sorts by name ascending by default', () => {
    const ids = sortedIds(
      [
        createMockClub({ clubId: 'z', clubName: 'Zeta' }),
        createMockClub({ clubId: 'a', clubName: 'Alpha' }),
        createMockClub({ clubId: 'b', clubName: 'Beta' }),
      ],
      [{ id: 'name', desc: false }]
    )
    expect(ids).toEqual(['a', 'b', 'z'])
  })

  it('sorts the Tier column by the custom Distinguished order', () => {
    const ids = sortedIds(
      [
        createMockClub({
          clubId: 'none',
          distinguishedLevel: 'NotDistinguished',
        }),
        createMockClub({ clubId: 'smedley', distinguishedLevel: 'Smedley' }),
        createMockClub({ clubId: 'dist', distinguishedLevel: 'Distinguished' }),
        createMockClub({ clubId: 'select', distinguishedLevel: 'Select' }),
        createMockClub({ clubId: 'pres', distinguishedLevel: 'President' }),
      ],
      [{ id: 'distinguished', desc: false }]
    )
    // Ascending by the precomputed `distinguishedOrder` (the field the
    // pre-migration switch sorted on): None(0) < Distinguished(1) < Select(2)
    // < President(3) < Smedley(4). This is the SHIPPED order — distinct from
    // the unused `COLUMN_CONFIGS.sortCustom` map.
    expect(ids).toEqual(['none', 'dist', 'select', 'pres', 'smedley'])
  })

  it('sorts undefined renewals to the end regardless of direction', () => {
    const clubs = [
      createMockClub({ clubId: 'has5', clubName: 'A', octoberRenewals: 5 }),
      createMockClub({
        clubId: 'undef',
        clubName: 'B',
        octoberRenewals: undefined,
      }),
      createMockClub({ clubId: 'has9', clubName: 'C', octoberRenewals: 9 }),
    ]
    expect(
      sortedIds(clubs, [{ id: 'octoberRenewals', desc: false }]).at(-1)
    ).toBe('undef')
    expect(
      sortedIds(clubs, [{ id: 'octoberRenewals', desc: true }]).at(-1)
    ).toBe('undef')
  })

  it('breaks ties with a stable name-ascending order even under desc primary', () => {
    // All same membership → ties fall back to the name-asc input order.
    const clubs = [
      createMockClub({
        clubId: 'c',
        clubName: 'Cair',
        membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 10 }],
      }),
      createMockClub({
        clubId: 'a',
        clubName: 'Aar',
        membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 10 }],
      }),
      createMockClub({
        clubId: 'b',
        clubName: 'Bar',
        membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 10 }],
      }),
    ]
    expect(sortedIds(clubs, [{ id: 'membership', desc: true }])).toEqual([
      'a',
      'b',
      'c',
    ])
  })
})
