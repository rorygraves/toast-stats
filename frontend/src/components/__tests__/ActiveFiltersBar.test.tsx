/**
 * ActiveFiltersBar (#817, epic #818 Sprint 4) — the visible, removable summary
 * of every active club filter. Reflects ALL filters (drawer + presets +
 * search), not just the preset chips, and lets a leader drop any one of them.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveFiltersBar } from '../ActiveFiltersBar'
import type { FilterState } from '../filters/types'

const baseState: FilterState = {
  status: {
    field: 'status',
    type: 'categorical',
    value: ['vulnerable'],
    operator: 'in',
  },
  membership: {
    field: 'membership',
    type: 'numeric',
    value: [10, null],
    operator: 'range',
  },
}

describe('ActiveFiltersBar', () => {
  it('renders null when no filters are active', () => {
    const { container } = render(
      <ActiveFiltersBar
        filterState={{}}
        setFilter={vi.fn()}
        clearAllFilters={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a chip per active filter with its label and value', () => {
    render(
      <ActiveFiltersBar
        filterState={baseState}
        setFilter={vi.fn()}
        clearAllFilters={vi.fn()}
      />
    )
    expect(screen.getByText('Vulnerable')).toBeInTheDocument()
    expect(screen.getByText('≥10')).toBeInTheDocument()
    // Labels surface the column the value belongs to.
    expect(screen.getByText(/Status/)).toBeInTheDocument()
    expect(screen.getByText(/Members/)).toBeInTheDocument()
  })

  it('removes a single filter when its × is clicked', async () => {
    const user = userEvent.setup()
    const setFilter = vi.fn()
    render(
      <ActiveFiltersBar
        filterState={baseState}
        setFilter={setFilter}
        clearAllFilters={vi.fn()}
      />
    )
    await user.click(
      screen.getByRole('button', { name: /remove members filter/i })
    )
    expect(setFilter).toHaveBeenCalledWith('membership', null)
  })

  it('calls clearAllFilters from the Clear all action', async () => {
    const user = userEvent.setup()
    const clearAllFilters = vi.fn()
    render(
      <ActiveFiltersBar
        filterState={baseState}
        setFilter={vi.fn()}
        clearAllFilters={clearAllFilters}
      />
    )
    await user.click(screen.getByRole('button', { name: /clear all/i }))
    expect(clearAllFilters).toHaveBeenCalledTimes(1)
  })
})
