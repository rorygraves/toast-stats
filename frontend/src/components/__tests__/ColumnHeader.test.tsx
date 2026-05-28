/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { ColumnHeader } from '../ColumnHeader'
import { SortField } from '../filters/types'

/**
 * ColumnHeader is the ClubsTable's sortable column header (#851). Click
 * toggles sort directly — no popover. Pre-#851 it opened a Sort A-Z /
 * Sort Z-A popover; the popover was vestigial after #816 stripped
 * filtering out, and the issue's "click to sort" acceptance retired it.
 * See Lesson 128 (filtering migrated to FiltersPanel) for context.
 */
afterEach(cleanup)

describe('ColumnHeader', () => {
  const defaultProps = {
    field: 'name' as SortField,
    label: 'Club Name',
    sortable: true,
    currentSort: { field: null as SortField | null, direction: 'asc' as const },
    onSort: vi.fn(),
  }

  describe('click toggles sort directly (#851)', () => {
    it('calls onSort(field) when the header button is clicked', () => {
      const onSort = vi.fn()
      render(<ColumnHeader {...defaultProps} onSort={onSort} />)

      fireEvent.click(screen.getByRole('button', { name: /Sort by Club Name/i }))
      expect(onSort).toHaveBeenCalledWith('name')
    })

    it('does NOT open a popover or render Sort A-Z / Sort Z-A buttons', () => {
      render(<ColumnHeader {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: /Sort by/i }))

      expect(screen.queryByText('Sort A-Z')).not.toBeInTheDocument()
      expect(screen.queryByText('Sort Z-A')).not.toBeInTheDocument()
    })

    it('renders a non-interactive label for a non-sortable column', () => {
      render(<ColumnHeader {...defaultProps} label="Years" sortable={false} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.getByText('Years')).toBeInTheDocument()
    })
  })

  describe('active sort indicator', () => {
    it('marks the active sort direction via data-sort-indicator', () => {
      const { rerender } = render(
        <ColumnHeader
          {...defaultProps}
          currentSort={{ field: 'name', direction: 'asc' }}
        />
      )
      expect(
        document.querySelector('[data-sort-indicator="asc"]')
      ).toBeInTheDocument()

      rerender(
        <ColumnHeader
          {...defaultProps}
          currentSort={{ field: 'name', direction: 'desc' }}
        />
      )
      expect(
        document.querySelector('[data-sort-indicator="desc"]')
      ).toBeInTheDocument()
    })

    it('shows a neutral indicator when this column is not the sort key', () => {
      render(<ColumnHeader {...defaultProps} />)
      expect(
        document.querySelector('[data-sort-indicator="none"]')
      ).toBeInTheDocument()
    })
  })

  describe('a11y', () => {
    it('button aria-label includes "Sort by" and current direction when active', () => {
      render(
        <ColumnHeader
          {...defaultProps}
          currentSort={{ field: 'name', direction: 'desc' }}
        />
      )
      const btn = screen.getByRole('button')
      expect(btn.getAttribute('aria-label')).toMatch(
        /Sort by Club Name.*currently sorted descending/i
      )
    })

    it('button aria-label is just "Sort by <label>" when inactive', () => {
      render(<ColumnHeader {...defaultProps} />)
      expect(
        screen.getByRole('button').getAttribute('aria-label')
      ).toMatch(/^Sort by Club Name/i)
    })
  })
})
