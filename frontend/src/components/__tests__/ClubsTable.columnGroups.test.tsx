/**
 * Column-group show/hide for the club table (#819, epic #821 Sprint 2 — Epic C / C1).
 *
 * Re-scoped on top of Sprint 1's TanStack migration (#835): group→visibility
 * mapping drives TanStack's native `columnVisibility` state. The bespoke
 * `useColumnGroupVisibility` hook from PR #834 is gone; persistence is
 * `usePersistedState` directly. The reused pieces are the menu UI
 * (`ColumnGroupsMenu`) and the localStorage shape (`clubs-table:hidden-groups`).
 *
 * Falsifiable invariants:
 *   1. Default render is unchanged — every column visible (no regression).
 *   2. A "Columns" control lists the non-empty groups; "Changes" is absent
 *      (empty until #795).
 *   3. Hiding a group removes its header cells AND the matching body cells —
 *      header count === per-row <td> count in every state (lockstep, #669).
 *   4. The sticky key column (Club) survives hiding the Identity group AND
 *      survives hiding every group.
 *   5. The hidden selection persists to localStorage and rehydrates on remount.
 *
 * jsdom has no layout (Lesson 66); the responsive CSS hiding is proven live on
 * the PR preview channel. Here we assert the DOM the group toggle controls.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'
import { storageKey } from '../../utils/localStorageStore'

const HIDDEN_GROUPS_STORAGE_KEY = storageKey('clubs-table:hidden-groups')

const makeClub = (over: Partial<ClubTrend> = {}): ClubTrend => ({
  clubId: 'c1',
  clubName: 'Alpha Club',
  divisionId: 'div-1',
  divisionName: 'A',
  areaId: 'area-1',
  areaName: '1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 20 }],
  dcpGoalsTrend: [{ date: '2026-03-01T00:00:00.000Z', goalsAchieved: 5 }],
  ...over,
})

// jsdom matchMedia → no-match → ClubsTable renders the desktop table.
const stubDesktopMatchMedia = () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

const headerCount = () =>
  document.querySelectorAll('#clubs-table thead th').length
const firstRowCellCount = () =>
  document.querySelectorAll('#clubs-table tbody tr:first-child td').length
const headerLabels = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '#clubs-table thead th .clubs-col-header span.flex-1'
    )
  ).map(el => el.textContent?.trim() ?? '')

beforeEach(() => {
  localStorage.clear()
  stubDesktopMatchMedia()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

const renderTable = () =>
  render(<ClubsTable clubs={[makeClub()]} districtId="61" isLoading={false} />)

describe('ClubsTable column groups (#819)', () => {
  it('renders all columns by default, header/body in lockstep', () => {
    renderTable()
    expect(headerCount()).toBe(13)
    expect(firstRowCellCount()).toBe(13)
  })

  it('exposes a Columns control listing non-empty groups (no Changes yet)', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: /columns/i }))
    expect(
      screen.getByRole('checkbox', { name: /identity/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /membership/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /renewals/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /recognition/i })
    ).toBeInTheDocument()
    // Changes group is empty until #795 → no toggle for it.
    expect(
      screen.queryByRole('checkbox', { name: /changes/i })
    ).not.toBeInTheDocument()
  })

  it('hides a group: removes its headers AND matching body cells (lockstep)', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: /columns/i }))
    // Renewals = Oct Renew + Apr Renew (2 columns).
    await user.click(screen.getByRole('checkbox', { name: /renewals/i }))

    expect(headerLabels()).not.toContain('Oct Renew')
    expect(headerLabels()).not.toContain('Apr Renew')
    expect(headerCount()).toBe(11)
    // TanStack's row.getVisibleCells keeps the body in lockstep with the
    // header automatically — assert it, not the implementation.
    expect(firstRowCellCount()).toBe(11)
  })

  it('keeps the sticky Club column when the Identity group is hidden', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: /columns/i }))
    await user.click(screen.getByRole('checkbox', { name: /identity/i }))

    const labels = headerLabels()
    // Club (sticky key) survives; the other Identity columns go.
    expect(labels).toContain('Club')
    expect(labels).not.toContain('Div')
    expect(labels).not.toContain('Area')
    expect(labels).not.toContain('Years')
    expect(headerCount()).toBe(firstRowCellCount())
    // The club name is still rendered in the body.
    const firstRow = document.querySelector(
      '#clubs-table tbody tr:first-child'
    ) as HTMLElement
    expect(within(firstRow).getByText('Alpha Club')).toBeInTheDocument()
  })

  it('keeps the sticky Club column even when every group is hidden', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: /columns/i }))
    for (const name of [
      /identity/i,
      /membership/i,
      /renewals/i,
      /recognition/i,
    ])
      await user.click(screen.getByRole('checkbox', { name }))

    // Only the sticky key column remains; header/body still in lockstep.
    expect(headerLabels()).toEqual(['Club'])
    expect(headerCount()).toBe(1)
    expect(firstRowCellCount()).toBe(1)
    const firstRow = document.querySelector(
      '#clubs-table tbody tr:first-child'
    ) as HTMLElement
    expect(within(firstRow).getByText('Alpha Club')).toBeInTheDocument()
  })

  it('persists the hidden group and rehydrates on remount', async () => {
    const user = userEvent.setup()
    const { unmount } = renderTable()
    await user.click(screen.getByRole('button', { name: /columns/i }))
    await user.click(screen.getByRole('checkbox', { name: /recognition/i }))
    expect(
      JSON.parse(localStorage.getItem(HIDDEN_GROUPS_STORAGE_KEY) || '[]')
    ).toContain('recognition')

    unmount()
    renderTable()
    // Recognition = Status + DCP + Tier (3 columns) stay hidden after reload.
    expect(headerLabels()).not.toContain('DCP')
    expect(headerLabels()).not.toContain('Tier')
    expect(headerCount()).toBe(10)
    expect(firstRowCellCount()).toBe(10)
  })

  it('drops stale (unknown) group ids from localStorage on rehydrate', async () => {
    // A corrupt store from an older schema (or a developer's typo) must not
    // hide phantom groups or wedge the table.
    localStorage.setItem(
      HIDDEN_GROUPS_STORAGE_KEY,
      JSON.stringify(['renewals', 'bogus-group'])
    )
    renderTable()
    // Renewals (2 cols) hidden → 11; the bogus id is silently dropped.
    expect(headerCount()).toBe(11)
    expect(firstRowCellCount()).toBe(11)
  })
})
