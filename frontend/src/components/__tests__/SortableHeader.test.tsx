/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { SortableHeader } from '../SortableHeader'

afterEach(cleanup)

const defaultProps = {
  field: 'clubs',
  label: 'Paid Clubs',
  currentSort: { field: 'aggregate', direction: 'desc' as const },
  onSort: vi.fn(),
}

const wrapInTable = (ui: React.ReactNode) => (
  <table>
    <thead>
      <tr>{ui}</tr>
    </thead>
  </table>
)

describe('SortableHeader', () => {
  it('renders a <th> with a button labelled "Sort by <label>"', () => {
    render(wrapInTable(<SortableHeader {...defaultProps} />))
    const btn = screen.getByRole('button', { name: /Paid Clubs/i })
    expect(btn).toBeInTheDocument()
    // The button announces sortability.
    expect(btn.getAttribute('aria-label')).toMatch(/sort/i)
  })

  it('aria-sort is "none" when this column is not the current sort key', () => {
    render(wrapInTable(<SortableHeader {...defaultProps} />))
    const th = screen.getByRole('columnheader')
    expect(th.getAttribute('aria-sort')).toBe('none')
  })

  it('aria-sort is "ascending" / "descending" when active', () => {
    const { rerender } = render(
      wrapInTable(
        <SortableHeader
          {...defaultProps}
          currentSort={{ field: 'clubs', direction: 'asc' }}
        />
      )
    )
    expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe(
      'ascending'
    )
    rerender(
      wrapInTable(
        <SortableHeader
          {...defaultProps}
          currentSort={{ field: 'clubs', direction: 'desc' }}
        />
      )
    )
    expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe(
      'descending'
    )
  })

  it('calls onSort(field) when the header button is clicked', () => {
    const onSort = vi.fn()
    render(wrapInTable(<SortableHeader {...defaultProps} onSort={onSort} />))
    fireEvent.click(screen.getByRole('button', { name: /Paid Clubs/i }))
    expect(onSort).toHaveBeenCalledWith('clubs')
  })

  it('renders both an up and a down chevron so direction is not color-only', () => {
    render(
      wrapInTable(
        <SortableHeader
          {...defaultProps}
          currentSort={{ field: 'clubs', direction: 'asc' }}
        />
      )
    )
    // SVG with data-testid-like attrs; we look for the asc/desc class hooks.
    const btn = screen.getByRole('button')
    expect(btn.querySelector('[data-sort-indicator="asc"]')).toBeTruthy()
  })
})
