/**
 * Column-group show/hide for the club table (#819, epic #821 Sprint 1 — Epic C / C1).
 *
 * ADR-006 §4: a growing column set is made sustainable by grouping columns
 * (Identity / Membership / Renewals / Recognition / Changes) and letting the
 * user hide whole groups, with the selection persisted across reloads.
 *
 * Falsifiable invariants:
 *   1. Default render is unchanged — every column visible (no regression).
 *   2. A "Columns" control lists the non-empty groups; "Changes" is absent
 *      (empty until #795).
 *   3. Hiding a group removes its header cells AND the matching body cells —
 *      header count === per-row <td> count in every state (lockstep).
 *   4. The sticky key column (Club) survives hiding the Identity group.
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
import { COLUMN_GROUP_VISIBILITY_STORAGE_KEY } from '../../hooks/useColumnGroupVisibility'

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
    // Body stays in lockstep with the header.
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

  it('persists the hidden group and rehydrates on remount', async () => {
    const user = userEvent.setup()
    const { unmount } = renderTable()
    await user.click(screen.getByRole('button', { name: /columns/i }))
    await user.click(screen.getByRole('checkbox', { name: /recognition/i }))
    expect(
      JSON.parse(
        localStorage.getItem(COLUMN_GROUP_VISIBILITY_STORAGE_KEY) || '[]'
      )
    ).toContain('recognition')

    unmount()
    renderTable()
    // Recognition = Status + DCP + Tier (3 columns) stay hidden after reload.
    expect(headerLabels()).not.toContain('DCP')
    expect(headerLabels()).not.toContain('Tier')
    expect(headerCount()).toBe(10)
    expect(firstRowCellCount()).toBe(10)
  })
})
