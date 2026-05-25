import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ColumnHeader } from '../ColumnHeader'
import { SortField, ColumnFilter } from '../filters/types'

/**
 * Unit tests for ColumnHeader component
 * Converted from property-based tests to example-based unit tests
 * Feature: clubs-table-column-filtering
 */

describe('ColumnHeader', () => {
  // Common test setup
  const defaultProps = {
    field: 'name' as SortField,
    label: 'Club Name',
    sortable: true,
    filterable: true,
    filterType: 'text' as const,
    currentSort: { field: null as SortField | null, direction: 'asc' as const },
    currentFilter: null as ColumnFilter | null,
    onSort: vi.fn(),
    onFilter: vi.fn(),
    options: [] as string[],
  }

  /**
   * Tests for dropdown controls display
   * Validates: Requirements 1.1, 4.4
   */
  describe('dropdown controls display', () => {
    it('displays sort and filter controls when filterable column header is clicked', () => {
      const onSort = vi.fn()
      const onFilter = vi.fn()

      render(
        <ColumnHeader {...defaultProps} onSort={onSort} onFilter={onFilter} />
      )

      // Find and click the column header button
      const headerButton = screen.getByRole('button', { expanded: false })
      expect(headerButton).toBeInTheDocument()

      fireEvent.click(headerButton)

      // Verify dropdown is open
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()

      // Filter controls should be visible
      expect(screen.getByText('Filter')).toBeInTheDocument()
      expect(screen.getByText('Apply')).toBeInTheDocument()
      expect(screen.getByText('Clear')).toBeInTheDocument()

      // Sort controls should be visible
      expect(screen.getByText('Sort')).toBeInTheDocument()
      expect(screen.getByText('Sort A-Z')).toBeInTheDocument()
      expect(screen.getByText('Sort Z-A')).toBeInTheDocument()
    })

    it('displays only filter controls when column is filterable but not sortable', () => {
      render(
        <ColumnHeader {...defaultProps} sortable={false} filterable={true} />
      )

      const headerButton = screen.getByRole('button', { expanded: false })
      fireEvent.click(headerButton)

      // Filter controls should be visible
      expect(screen.getByText('Filter')).toBeInTheDocument()
      expect(screen.getByText('Apply')).toBeInTheDocument()
      expect(screen.getByText('Clear')).toBeInTheDocument()

      // Sort controls should NOT be visible
      expect(screen.queryByText('Sort')).not.toBeInTheDocument()
      expect(screen.queryByText('Sort A-Z')).not.toBeInTheDocument()
    })

    it('displays only sort controls when column is sortable but not filterable', () => {
      render(
        <ColumnHeader {...defaultProps} sortable={true} filterable={false} />
      )

      const headerButton = screen.getByRole('button', { expanded: false })
      fireEvent.click(headerButton)

      // Sort controls should be visible
      expect(screen.getByText('Sort')).toBeInTheDocument()
      expect(screen.getByText('Sort A-Z')).toBeInTheDocument()
      expect(screen.getByText('Sort Z-A')).toBeInTheDocument()

      // Filter controls should NOT be visible
      expect(screen.queryByText('Filter')).not.toBeInTheDocument()
      expect(screen.queryByText('Apply')).not.toBeInTheDocument()
    })

    it('displays numeric filter controls for numeric filter type', () => {
      render(
        <ColumnHeader
          {...defaultProps}
          field="membership"
          label="Members"
          filterType="numeric"
        />
      )

      const headerButton = screen.getByRole('button', { expanded: false })
      fireEvent.click(headerButton)

      // Filter heading should be visible
      expect(screen.getByText('Filter')).toBeInTheDocument()

      // Numeric filter should have min/max inputs
      expect(screen.getByLabelText(/min/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/max/i)).toBeInTheDocument()
    })

    it('displays categorical filter controls with options', () => {
      const options = ['Thriving', 'Vulnerable', 'Intervention']

      render(
        <ColumnHeader
          {...defaultProps}
          field="status"
          label="Status"
          filterType="categorical"
          options={options}
        />
      )

      const headerButton = screen.getByRole('button', { expanded: false })
      fireEvent.click(headerButton)

      // Filter heading should be visible
      expect(screen.getByText('Filter')).toBeInTheDocument()

      // Options should be displayed (use getAllByText since options may appear in multiple places)
      options.forEach(option => {
        expect(screen.getAllByText(option).length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  /**
   * Tests for active filter visual indicators
   * Validates: Requirements 1.4, 4.2
   */
  describe('active filter visual indicators', () => {
    it('displays blue filter icon when text filter is active', () => {
      const activeFilter: ColumnFilter = {
        field: 'name',
        type: 'text',
        value: 'test filter',
        operator: 'contains',
      }

      render(<ColumnHeader {...defaultProps} currentFilter={activeFilter} />)

      const headerButton = screen.getByRole('button')

      // Check for blue filter indicator
      const filterIcon = headerButton.querySelector(
        'svg[class*="text-tm-loyal-blue"]'
      )
      expect(filterIcon).toBeInTheDocument()
    })

    it('displays blue filter icon when numeric filter is active', () => {
      const activeFilter: ColumnFilter = {
        field: 'membership',
        type: 'numeric',
        value: [1, 10],
        operator: 'range',
      }

      render(
        <ColumnHeader
          {...defaultProps}
          field="membership"
          label="Members"
          filterType="numeric"
          currentFilter={activeFilter}
        />
      )

      const headerButton = screen.getByRole('button')

      // Check for blue filter indicator
      const filterIcon = headerButton.querySelector(
        'svg[class*="text-tm-loyal-blue"]'
      )
      expect(filterIcon).toBeInTheDocument()
    })

    it('displays blue filter icon when categorical filter is active', () => {
      const activeFilter: ColumnFilter = {
        field: 'distinguished',
        type: 'categorical',
        value: ['Distinguished', 'Select'],
        operator: 'in',
      }

      render(
        <ColumnHeader
          {...defaultProps}
          field="distinguished"
          label="Distinguished"
          filterType="categorical"
          currentFilter={activeFilter}
          options={['Distinguished', 'Select', 'President']}
        />
      )

      const headerButton = screen.getByRole('button')

      // Check for blue filter indicator
      const filterIcon = headerButton.querySelector(
        'svg[class*="text-tm-loyal-blue"]'
      )
      expect(filterIcon).toBeInTheDocument()
    })

    it('displays muted filter icon when no filter is active', () => {
      render(<ColumnHeader {...defaultProps} currentFilter={null} />)

      const headerButton = screen.getByRole('button')

      // Inactive caret uses the token-driven muted class (#668 re-skin —
      // was text-gray-400; colour now resolves via .clubs-col-header__arrow
      // in app-shell.css so dark mode remaps for free).
      const filterIcon = headerButton.querySelector(
        'svg[class*="clubs-col-header__arrow"]'
      )
      expect(filterIcon).toBeInTheDocument()
    })
  })

  /**
   * Tests for sort indicator icons
   * Validates: Requirements 4.1
   * Updated: Now uses a single down chevron for all states (simplified UI)
   */
  describe('sort indicator icons', () => {
    it('displays down chevron icon when column is sortable', () => {
      render(
        <ColumnHeader
          {...defaultProps}
          sortable={true}
          currentSort={{ field: null, direction: 'asc' }}
        />
      )

      const headerButton = screen.getByRole('button')

      // Check for down chevron icon (simplified - same icon for all states)
      const chevronIcon = headerButton.querySelector(
        'svg path[d*="M19 9l-7 7-7-7"]'
      )
      expect(chevronIcon).toBeInTheDocument()
    })

    it('displays down chevron with blue color when column is sorted ascending', () => {
      render(
        <ColumnHeader
          {...defaultProps}
          sortable={true}
          currentSort={{ field: 'name', direction: 'asc' }}
        />
      )

      const headerButton = screen.getByRole('button')

      // Check for blue-colored chevron (active state indicator)
      const blueIcon = headerButton.querySelector(
        'svg[class*="text-tm-loyal-blue"]'
      )
      expect(blueIcon).toBeInTheDocument()
    })

    it('displays descending sort icon when column is sorted descending', () => {
      render(
        <ColumnHeader
          {...defaultProps}
          sortable={true}
          currentSort={{ field: 'name', direction: 'desc' }}
        />
      )

      const headerButton = screen.getByRole('button')

      // Check for descending sort icon (chevron down) - note: there are two chevron down icons
      // One for sort indicator and one for dropdown indicator
      const descIcons = headerButton.querySelectorAll(
        'svg path[d*="M19 9l-7 7-7-7"]'
      )
      expect(descIcons.length).toBeGreaterThanOrEqual(1)
    })

    it('does not display sort icon when column is not sortable', () => {
      render(
        <ColumnHeader {...defaultProps} sortable={false} filterable={true} />
      )

      const headerButton = screen.getByRole('button')

      // Should still have the dropdown chevron since it's filterable
      const chevronIcons = headerButton.querySelectorAll(
        'svg path[d*="M19 9l-7 7-7-7"]'
      )
      expect(chevronIcons.length).toBeGreaterThanOrEqual(1)
    })
  })

  /**
   * Tests for hover states and interactivity
   * Validates: Requirements 4.3
   */
  describe('hover states and interactivity', () => {
    it('has hover classes for visual feedback on interactive column', () => {
      render(
        <ColumnHeader {...defaultProps} sortable={true} filterable={true} />
      )

      const headerButton = screen.getByRole('button')
      const buttonClasses = headerButton.className

      // Hover bg/text feedback now lives in .clubs-col-header (#668 re-skin —
      // was hover:bg-gray-100 / hover:text-gray-900; the CSS rule swaps to
      // --surface-3 / --ink so dark mode remaps for free, R10).
      expect(buttonClasses).toMatch(/clubs-col-header/)
      expect(buttonClasses).toMatch(/hover:shadow-xs/)

      // Verify cursor-pointer for interactivity
      expect(buttonClasses).toMatch(/cursor-pointer/)

      // Verify transition classes for smooth effects
      expect(buttonClasses).toMatch(/transition-all/)
      expect(buttonClasses).toMatch(/duration-200/)
    })

    it('has hover classes on icons for visual feedback', () => {
      render(
        <ColumnHeader {...defaultProps} sortable={true} filterable={true} />
      )

      const headerButton = screen.getByRole('button')
      const icons = headerButton.querySelectorAll('svg')

      expect(icons.length).toBeGreaterThan(0)

      // At least one icon carries the re-skinned caret class (#668 — its
      // group-hover colour shift now lives in .clubs-col-header__arrow CSS;
      // was group-hover:text-gray-700) or the inline transition.
      const hasHoverIcon = Array.from(icons).some(icon => {
        const iconClasses =
          icon.className.baseVal || icon.getAttribute('class') || ''
        return (
          iconClasses.includes('clubs-col-header__arrow') ||
          iconClasses.includes('transition-all')
        )
      })
      expect(hasHoverIcon).toBe(true)
    })

    it('handles hover events without errors', () => {
      render(
        <ColumnHeader {...defaultProps} sortable={true} filterable={true} />
      )

      const headerButton = screen.getByRole('button')

      // Simulate hover events
      fireEvent.mouseEnter(headerButton)
      fireEvent.mouseLeave(headerButton)

      // Button should still be in the document
      expect(headerButton).toBeInTheDocument()
    })

    it('has focus ring classes for keyboard accessibility', () => {
      render(
        <ColumnHeader {...defaultProps} sortable={true} filterable={true} />
      )

      const headerButton = screen.getByRole('button')
      const buttonClasses = headerButton.className

      // Verify focus classes are present
      expect(buttonClasses).toMatch(/focus:outline-hidden/)
      expect(buttonClasses).toMatch(/focus:ring-2/)
      expect(buttonClasses).toMatch(/focus:ring-tm-loyal-blue/)
    })
  })

  /**
   * Tests for keyboard navigation
   */
  describe('keyboard navigation', () => {
    it('opens dropdown on Enter key press', () => {
      render(<ColumnHeader {...defaultProps} />)

      const headerButton = screen.getByRole('button', { expanded: false })

      fireEvent.keyDown(headerButton, { key: 'Enter' })

      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    })

    it('opens dropdown on Space key press', () => {
      render(<ColumnHeader {...defaultProps} />)

      const headerButton = screen.getByRole('button', { expanded: false })

      fireEvent.keyDown(headerButton, { key: ' ' })

      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    })

    it('closes dropdown on Escape key press', () => {
      render(<ColumnHeader {...defaultProps} />)

      const headerButton = screen.getByRole('button', { expanded: false })

      // Open dropdown
      fireEvent.click(headerButton)
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()

      // Close with Escape
      fireEvent.keyDown(headerButton, { key: 'Escape' })
      expect(
        screen.getByRole('button', { expanded: false })
      ).toBeInTheDocument()
    })

    it('opens dropdown on ArrowDown key press when closed', () => {
      render(<ColumnHeader {...defaultProps} />)

      const headerButton = screen.getByRole('button', { expanded: false })

      fireEvent.keyDown(headerButton, { key: 'ArrowDown' })

      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    })
  })

  /**
   * Tests for accessibility attributes
   */
  describe('accessibility attributes', () => {
    it('has correct aria-expanded attribute', () => {
      render(<ColumnHeader {...defaultProps} />)

      const headerButton = screen.getByRole('button')

      expect(headerButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(headerButton)

      expect(headerButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('has aria-haspopup attribute', () => {
      render(<ColumnHeader {...defaultProps} />)

      const headerButton = screen.getByRole('button')

      expect(headerButton).toHaveAttribute('aria-haspopup', 'true')
    })

    it('has descriptive aria-label for sortable and filterable column', () => {
      render(
        <ColumnHeader {...defaultProps} sortable={true} filterable={true} />
      )

      const headerButton = screen.getByRole('button')
      const ariaLabel = headerButton.getAttribute('aria-label')

      expect(ariaLabel).toContain('Club Name')
      expect(ariaLabel).toContain('Sortable')
      expect(ariaLabel).toContain('Filterable')
    })

    it('includes sort state in aria-label when sorted', () => {
      render(
        <ColumnHeader
          {...defaultProps}
          currentSort={{ field: 'name', direction: 'asc' }}
        />
      )

      const headerButton = screen.getByRole('button')
      const ariaLabel = headerButton.getAttribute('aria-label')

      expect(ariaLabel).toContain('Currently sorted')
      expect(ariaLabel).toContain('ascending')
    })

    it('includes filter state in aria-label when filtered', () => {
      const activeFilter: ColumnFilter = {
        field: 'name',
        type: 'text',
        value: 'test',
        operator: 'contains',
      }

      render(<ColumnHeader {...defaultProps} currentFilter={activeFilter} />)

      const headerButton = screen.getByRole('button')
      const ariaLabel = headerButton.getAttribute('aria-label')

      expect(ariaLabel).toContain('Has active filter')
    })
  })
})
