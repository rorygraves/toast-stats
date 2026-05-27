/**
 * FiltersPanel — the dedicated, discoverable Filters drawer (#816, epic #818
 * Sprint 3 / table-ux-review §B3). Replaces the hidden per-column header filter
 * dropdowns + their mandatory "Apply" button with one slide-over panel that
 * applies every change INSTANTLY.
 *
 * These tests pin the contract that matters for the sprint:
 *  - it is a labelled, dismissible dialog (Escape / backdrop / close button);
 *  - it surfaces the filterable columns EXCEPT `name` (owned by the #814 search
 *    box) and the non-filterable `yearsChartered`;
 *  - changing any control mutates filter state immediately — there is NO Apply
 *    button anywhere in the panel;
 *  - it reflects the current filter state passed in via getFilter.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from '@testing-library/react'
import { FiltersPanel } from '../FiltersPanel'
import { ColumnFilter, SortField } from '../types'

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  setFilter: vi.fn(),
  clearAllFilters: vi.fn(),
  getFilter: (_field: SortField): ColumnFilter | null => null,
  activeFilterCount: 0,
}

function renderPanel(overrides: Partial<typeof defaultProps> = {}) {
  return render(<FiltersPanel {...defaultProps} {...overrides} />)
}

describe('FiltersPanel', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    renderPanel({ isOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a labelled modal dialog when open', () => {
    renderPanel()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName(/filters/i)
  })

  it('has NO Apply button — every change is instant-apply', () => {
    renderPanel()
    expect(
      screen.queryByRole('button', { name: /^apply/i })
    ).not.toBeInTheDocument()
  })

  it('surfaces filterable columns but excludes the name search and non-filterable columns', () => {
    renderPanel()
    const dialog = screen.getByRole('dialog')
    // Club Status (categorical) IS surfaced — its "Suspended" option is unique.
    expect(
      within(dialog).getByRole('checkbox', { name: /suspended/i })
    ).toBeInTheDocument()
    // `name` (label "Club") is owned by the search box — not duplicated here.
    expect(
      within(dialog).queryByText('Club', { selector: 'h3, h4, label, span' })
    ).not.toBeInTheDocument()
    // `yearsChartered` (label "Years") is filterable:false — no control for it.
    expect(within(dialog).queryByText(/years/i)).not.toBeInTheDocument()
  })

  it('applies a categorical change instantly via setFilter', () => {
    const setFilter = vi.fn()
    renderPanel({ setFilter })
    fireEvent.click(screen.getByRole('checkbox', { name: /suspended/i }))
    expect(setFilter).toHaveBeenCalledWith('clubStatus', {
      field: 'clubStatus',
      type: 'categorical',
      value: ['Suspended'],
      operator: 'in',
    })
  })

  it('applies a numeric change instantly via setFilter', () => {
    const setFilter = vi.fn()
    renderPanel({ setFilter })
    fireEvent.change(screen.getByLabelText(/minimum members value/i), {
      target: { value: '5' },
    })
    expect(setFilter).toHaveBeenCalledWith('membership', {
      field: 'membership',
      type: 'numeric',
      value: [5, null],
      operator: 'range',
    })
  })

  it('reflects an existing categorical filter as selected', () => {
    const getFilter = (field: SortField): ColumnFilter | null =>
      field === 'clubStatus'
        ? {
            field: 'clubStatus',
            type: 'categorical',
            value: ['Suspended'],
            operator: 'in',
          }
        : null
    renderPanel({ getFilter })
    expect(
      screen.getByRole('checkbox', { name: /suspended/i })
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    renderPanel({ onClose })
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn()
    renderPanel({ onClose })
    fireEvent.click(screen.getByTestId('filters-panel-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('closes via the close button', () => {
    const onClose = vi.fn()
    renderPanel({ onClose })
    fireEvent.click(screen.getByRole('button', { name: /close filters/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('clears every filter via Clear all when filters are active', () => {
    const clearAllFilters = vi.fn()
    renderPanel({ clearAllFilters, activeFilterCount: 3 })
    const clearAll = screen.getByRole('button', { name: /clear all/i })
    expect(clearAll).toHaveTextContent('3')
    fireEvent.click(clearAll)
    expect(clearAllFilters).toHaveBeenCalled()
  })

  it('hides Clear all when no filters are active', () => {
    renderPanel({ activeFilterCount: 0 })
    expect(
      screen.queryByRole('button', { name: /clear all/i })
    ).not.toBeInTheDocument()
  })
})
