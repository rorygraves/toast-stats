import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ColumnHeader } from '../ColumnHeader'
import { SortField } from '../filters/types'

/**
 * Unit tests for ColumnHeader.
 *
 * Sort-only since #816 (epic #818 Sprint 3): filtering moved out of the hidden
 * per-column header dropdown into the dedicated FiltersPanel drawer. The header
 * now opens a small SORT popover only. The role-query churn here (the old filter
 * assertions are gone) is the tell that filtering was relocated, not that
 * anything broke — see Lesson 128.
 */
describe('ColumnHeader', () => {
  const defaultProps = {
    field: 'name' as SortField,
    label: 'Club Name',
    sortable: true,
    currentSort: { field: null as SortField | null, direction: 'asc' as const },
    onSort: vi.fn(),
  }

  describe('sort popover', () => {
    it('opens a Sort popover with A-Z / Z-A options when clicked', () => {
      render(<ColumnHeader {...defaultProps} />)

      const headerButton = screen.getByRole('button', { expanded: false })
      fireEvent.click(headerButton)

      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
      expect(screen.getByText('Sort')).toBeInTheDocument()
      expect(screen.getByText('Sort A-Z')).toBeInTheDocument()
      expect(screen.getByText('Sort Z-A')).toBeInTheDocument()
    })

    it('has NO filter controls — filtering lives in the FiltersPanel now', () => {
      render(<ColumnHeader {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { expanded: false }))

      expect(screen.queryByText('Filter')).not.toBeInTheDocument()
      expect(screen.queryByText('Apply')).not.toBeInTheDocument()
    })

    it('calls onSort with the field when Sort A-Z is chosen', () => {
      const onSort = vi.fn()
      render(<ColumnHeader {...defaultProps} onSort={onSort} />)

      fireEvent.click(screen.getByRole('button', { expanded: false }))
      fireEvent.click(screen.getByText('Sort A-Z'))

      expect(onSort).toHaveBeenCalledWith('name')
    })

    it('renders a non-interactive label for a non-sortable column', () => {
      render(<ColumnHeader {...defaultProps} label="Years" sortable={false} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.getByText('Years')).toBeInTheDocument()
    })
  })

  describe('active sort indicator', () => {
    it('shows a blue chevron when this column is the current sort key', () => {
      render(
        <ColumnHeader
          {...defaultProps}
          currentSort={{ field: 'name', direction: 'asc' }}
        />
      )

      const headerButton = screen.getByRole('button')
      expect(
        headerButton.querySelector('svg[class*="text-tm-loyal-blue"]')
      ).toBeInTheDocument()
    })

    it('shows a muted chevron when this column is not the sort key', () => {
      render(<ColumnHeader {...defaultProps} />)

      const headerButton = screen.getByRole('button')
      expect(
        headerButton.querySelector('svg[class*="clubs-col-header__arrow"]')
      ).toBeInTheDocument()
    })

    it('always renders the chevron for a sortable column', () => {
      render(<ColumnHeader {...defaultProps} />)
      const headerButton = screen.getByRole('button')
      expect(
        headerButton.querySelector('svg path[d*="M19 9l-7 7-7-7"]')
      ).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('opens the popover on Enter', () => {
      render(<ColumnHeader {...defaultProps} />)
      fireEvent.keyDown(screen.getByRole('button', { expanded: false }), {
        key: 'Enter',
      })
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    })

    it('opens the popover on Space', () => {
      render(<ColumnHeader {...defaultProps} />)
      fireEvent.keyDown(screen.getByRole('button', { expanded: false }), {
        key: ' ',
      })
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    })

    it('opens the popover on ArrowDown', () => {
      render(<ColumnHeader {...defaultProps} />)
      fireEvent.keyDown(screen.getByRole('button', { expanded: false }), {
        key: 'ArrowDown',
      })
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    })

    it('closes the popover on Escape', () => {
      render(<ColumnHeader {...defaultProps} />)
      const headerButton = screen.getByRole('button', { expanded: false })
      fireEvent.click(headerButton)
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
      fireEvent.keyDown(headerButton, { key: 'Escape' })
      expect(
        screen.getByRole('button', { expanded: false })
      ).toBeInTheDocument()
    })
  })

  describe('accessibility & interactivity', () => {
    it('exposes aria-expanded / aria-haspopup', () => {
      render(<ColumnHeader {...defaultProps} />)
      const headerButton = screen.getByRole('button')
      expect(headerButton).toHaveAttribute('aria-expanded', 'false')
      expect(headerButton).toHaveAttribute('aria-haspopup', 'true')
      fireEvent.click(headerButton)
      expect(headerButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('has a descriptive sort aria-label (no filter language)', () => {
      render(<ColumnHeader {...defaultProps} />)
      const ariaLabel = screen.getByRole('button').getAttribute('aria-label')
      expect(ariaLabel).toContain('Club Name')
      expect(ariaLabel).toContain('Sortable')
      expect(ariaLabel).not.toContain('Filterable')
    })

    it('includes sort state in aria-label when sorted', () => {
      render(
        <ColumnHeader
          {...defaultProps}
          currentSort={{ field: 'name', direction: 'asc' }}
        />
      )
      const ariaLabel = screen.getByRole('button').getAttribute('aria-label')
      expect(ariaLabel).toContain('Currently sorted')
      expect(ariaLabel).toContain('ascending')
    })

    it('carries the re-skinned header + focus-ring utility classes', () => {
      render(<ColumnHeader {...defaultProps} />)
      const buttonClasses = screen.getByRole('button').className
      expect(buttonClasses).toMatch(/clubs-col-header/)
      expect(buttonClasses).toMatch(/cursor-pointer/)
      expect(buttonClasses).toMatch(/focus:ring-tm-loyal-blue/)
    })
  })
})
