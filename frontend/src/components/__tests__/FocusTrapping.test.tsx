import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ColumnHeader } from '../ColumnHeader'
import { FiltersPanel } from '../filters/FiltersPanel'
import type { SortField, SortDirection, ColumnFilter } from '../filters/types'

/**
 * Focus-management tests for the clubs filtering UI.
 *
 * #816 (epic #818 Sprint 3) split the old single "header dropdown" focus trap in
 * two: the ColumnHeader keeps a small SORT popover (trapped), and the relocated
 * FILTER controls live in the FiltersPanel modal (its own trap). This guards
 * both so keyboard-only users stay contained in whichever surface is open
 * (Requirements 6.5).
 */
const getFocusableElements = (container: Element): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )

const defaultSort = {
  field: 'name' as SortField,
  direction: 'asc' as SortDirection,
}

describe('Focus Trapping', () => {
  describe('ColumnHeader click-to-sort (no popover since #851)', () => {
    const renderHeader = (onSort = vi.fn()) =>
      render(
        <ColumnHeader
          field="name"
          label="Club Name"
          sortable
          currentSort={defaultSort}
          onSort={onSort}
        />
      )

    it('clicking the header button calls onSort directly — no popover opens', () => {
      const onSort = vi.fn()
      const { container } = renderHeader(onSort)
      const headerButton = container.querySelector('button') as HTMLButtonElement
      expect(headerButton).toBeTruthy()
      fireEvent.click(headerButton)
      expect(onSort).toHaveBeenCalledWith('name')
      // No absolutely-positioned dropdown got added.
      expect(container.querySelector('[class*="absolute"]')).toBeFalsy()
    })
  })

  describe('FiltersPanel modal', () => {
    const panelProps = {
      isOpen: true,
      onClose: vi.fn(),
      getFilter: (_f: SortField): ColumnFilter | null => null,
      setFilter: vi.fn(),
      clearAllFilters: vi.fn(),
      activeFilterCount: 0,
    }

    it('moves focus to the close button when it opens', () => {
      render(<FiltersPanel {...panelProps} />)
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: /close filters/i })
      )
    })

    it('contains the relocated filter controls within the dialog', () => {
      render(<FiltersPanel {...panelProps} />)
      const dialog = screen.getByRole('dialog')
      const focusables = getFocusableElements(dialog)
      // close button + per-column text inputs / numeric inputs / option toggles
      expect(focusables.length).toBeGreaterThanOrEqual(5)
      focusables.forEach(el => expect(dialog.contains(el)).toBe(true))
    })

    it('closes on Escape', () => {
      const onClose = vi.fn()
      render(<FiltersPanel {...panelProps} onClose={onClose} />)
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
      expect(onClose).toHaveBeenCalled()
    })
  })
})
