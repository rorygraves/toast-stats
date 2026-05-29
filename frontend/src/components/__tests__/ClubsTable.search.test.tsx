/**
 * Tests for the visible club-name search box (#814, epic #818 Sprint 1).
 *
 * Today name search is buried in the hidden "Club" column-header dropdown.
 * This sprint surfaces a prominent search input above the table, wired to the
 * SAME `name` text filter (R11 — a new UI entry point onto the existing
 * pipeline step, not a new step). The input is URL-synced through the parent's
 * onFilterChange callback (DistrictClubsPage maps `name` ⇄ `?search=`).
 *
 * The box mirrors the column TextFilter: a LOCAL input value keeps typing
 * instant while the table re-filter is driven off a 300ms-debounced value, so
 * these tests advance fake timers to flush the debounce.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render as rtlRender, screen, cleanup, fireEvent, act } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

// CC-7 (#872): ClubsTable now renders <Link>s — wrap every render in a router
// context (wrapper option persists across rerender).
const render = (ui: ReactElement, options?: Parameters<typeof rtlRender>[1]) =>
  rtlRender(ui, { wrapper: MemoryRouter, ...options })
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'
import type { FilterState } from '../filters/types'

const createMockClub = (overrides: Partial<ClubTrend> = {}): ClubTrend => ({
  clubId: 'club-1',
  clubName: 'Test Club',
  divisionId: 'div-1',
  divisionName: 'Division A',
  areaId: 'area-1',
  areaName: 'Area 1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: new Date().toISOString(), count: 20 }],
  dcpGoalsTrend: [{ date: new Date().toISOString(), goalsAchieved: 5 }],
  ...overrides,
})

const threeClubs = () => [
  createMockClub({ clubId: 'c1', clubName: 'Alpha Club' }),
  createMockClub({ clubId: 'c2', clubName: 'Beta Club' }),
  createMockClub({ clubId: 'c3', clubName: 'Gamma Society' }),
]

// Flush the 300ms search debounce.
const flushDebounce = () => act(() => vi.advanceTimersByTime(350))

describe('ClubsTable — visible search box (#814)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders a visible search input (role=searchbox) above the table', () => {
    render(<ClubsTable clubs={threeClubs()} districtId="123" />)
    const input = screen.getByRole('searchbox', { name: /search clubs/i })
    expect(input).toBeInTheDocument()
  })

  it('filters the table by club name as the user types (debounced)', () => {
    render(<ClubsTable clubs={threeClubs()} districtId="123" />)
    const input = screen.getByRole('searchbox', { name: /search clubs/i })

    fireEvent.change(input, { target: { value: 'alpha' } })
    flushDebounce()

    expect(screen.getByText('Alpha Club')).toBeInTheDocument()
    expect(screen.queryByText('Beta Club')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma Society')).not.toBeInTheDocument()
  })

  it('keeps the typed value instantly (no dropped characters)', () => {
    render(<ClubsTable clubs={threeClubs()} districtId="123" />)
    const input = screen.getByRole('searchbox', {
      name: /search clubs/i,
    }) as HTMLInputElement

    // The input reflects each keystroke immediately, before the debounce fires.
    fireEvent.change(input, { target: { value: 'gamma society' } })
    expect(input.value).toBe('gamma society')
  })

  it('pre-fills the input from an initial (URL-derived) name filter', () => {
    const initialFilterState: FilterState = {
      name: {
        field: 'name',
        type: 'text',
        value: 'gamma',
        operator: 'contains',
      },
    }
    render(
      <ClubsTable
        clubs={threeClubs()}
        districtId="123"
        initialFilterState={initialFilterState}
      />
    )
    const input = screen.getByRole('searchbox', {
      name: /search clubs/i,
    }) as HTMLInputElement
    expect(input.value).toBe('gamma')
    expect(screen.getByText('Gamma Society')).toBeInTheDocument()
    expect(screen.queryByText('Alpha Club')).not.toBeInTheDocument()
  })

  it('notifies the parent (URL-sync contract) with the name filter on type', () => {
    const onFilterChange = vi.fn()
    render(
      <ClubsTable
        clubs={threeClubs()}
        districtId="123"
        onFilterChange={onFilterChange}
      />
    )
    const input = screen.getByRole('searchbox', { name: /search clubs/i })

    fireEvent.change(input, { target: { value: 'beta' } })
    flushDebounce()

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.objectContaining({
          field: 'name',
          type: 'text',
          value: 'beta',
        }),
      })
    )
  })

  it('clears the name filter (and shows all clubs) when emptied', () => {
    const onFilterChange = vi.fn()
    render(
      <ClubsTable
        clubs={threeClubs()}
        districtId="123"
        onFilterChange={onFilterChange}
        initialFilterState={{
          name: {
            field: 'name',
            type: 'text',
            value: 'alpha',
            operator: 'contains',
          },
        }}
      />
    )
    const input = screen.getByRole('searchbox', { name: /search clubs/i })

    fireEvent.change(input, { target: { value: '' } })
    flushDebounce()

    expect(screen.getByText('Alpha Club')).toBeInTheDocument()
    expect(screen.getByText('Beta Club')).toBeInTheDocument()
    expect(screen.getByText('Gamma Society')).toBeInTheDocument()
    const lastCall = onFilterChange.mock.calls.at(-1)?.[0]
    expect(lastCall?.name).toBeUndefined()
  })

  it('clears via the clear (✕) button', () => {
    render(
      <ClubsTable
        clubs={threeClubs()}
        districtId="123"
        initialFilterState={{
          name: {
            field: 'name',
            type: 'text',
            value: 'alpha',
            operator: 'contains',
          },
        }}
      />
    )
    const clear = screen.getByRole('button', { name: /clear search/i })
    fireEvent.click(clear)
    flushDebounce()

    const input = screen.getByRole('searchbox', {
      name: /search clubs/i,
    }) as HTMLInputElement
    expect(input.value).toBe('')
    expect(screen.getByText('Beta Club')).toBeInTheDocument()
  })
})
