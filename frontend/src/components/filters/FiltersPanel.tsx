import React, { useEffect, useRef } from 'react'
import { COLUMN_CONFIGS, ColumnConfig, ColumnFilter, SortField } from './types'
import { TextFilter } from './TextFilter'
import { NumericFilter } from './NumericFilter'
import { CategoricalFilter } from './CategoricalFilter'

export interface FiltersPanelProps {
  isOpen: boolean
  onClose: () => void
  getFilter: (field: SortField) => ColumnFilter | null
  setFilter: (field: SortField, filter: ColumnFilter | null) => void
  clearAllFilters: () => void
  activeFilterCount: number
}

/**
 * FiltersPanel — the dedicated, discoverable Filters drawer (#816, epic #818
 * Sprint 3 / table-ux-review §B3).
 *
 * Replaces the hidden per-column header filter dropdowns + their mandatory
 * "Apply" button with ONE slide-over panel that applies every change instantly.
 * It reuses the existing column filter primitives (TextFilter / NumericFilter /
 * CategoricalFilter) — they already carry the local-state + debounce that keeps
 * a controlled input from dropping fast keystrokes (Lesson 127), render-phase
 * prop-sync (#340), token-driven dark mode (R10) and the a11y the column
 * dropdown relied on. The Apply button in ColumnHeader was the only thing
 * gating their `onChange`; wiring that straight to `setFilter` here is the
 * whole "instant-apply" change. The filter pipeline is untouched (R11).
 *
 * Columns surfaced: every `filterable` column EXCEPT `name` (owned by the #814
 * search box) — `yearsChartered` is `filterable:false` and so is absent too.
 * Column GROUPS (Identity / Membership / …) are Epic C, not this sprint: a flat
 * list in COLUMN_CONFIGS order.
 */
export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  isOpen,
  onClose,
  getFilter,
  setFilter,
  clearAllFilters,
  activeFilterCount,
}) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Move focus into the panel when it opens (it's a modal dialog), and keep Tab
  // inside it while open — mirrors the focus trap the column dropdown used.
  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    const panel = panelRef.current
    panel?.addEventListener('keydown', handleTab)
    return () => panel?.removeEventListener('keydown', handleTab)
  }, [isOpen])

  if (!isOpen) return null

  const filterableColumns = COLUMN_CONFIGS.filter(
    c => c.filterable && c.field !== 'name'
  )

  // Instant-apply wiring: a change in any control commits to filter state right
  // away. Empty/cleared values remove the filter rather than writing an empty
  // one — the same normalisation ColumnHeader's Apply used to do.
  const applyText =
    (field: SortField) =>
    (value: string, operator: 'contains' | 'startsWith') =>
      setFilter(
        field,
        value.trim() ? { field, type: 'text', value, operator } : null
      )
  const applyNumeric =
    (field: SortField) => (min: number | null, max: number | null) =>
      setFilter(
        field,
        min !== null || max !== null
          ? { field, type: 'numeric', value: [min, max], operator: 'range' }
          : null
      )
  const applyCategorical = (field: SortField) => (values: string[]) =>
    setFilter(
      field,
      values.length
        ? { field, type: 'categorical', value: values, operator: 'in' }
        : null
    )
  const clearField = (field: SortField) => () => setFilter(field, null)

  const renderControl = (config: ColumnConfig) => {
    const { field, label, filterType } = config
    const current = getFilter(field)
    switch (filterType) {
      case 'text':
        return (
          <TextFilter
            value={typeof current?.value === 'string' ? current.value : ''}
            onChange={applyText(field)}
            onClear={clearField(field)}
            placeholder={`Filter ${label.toLowerCase()}…`}
          />
        )
      case 'numeric': {
        const v = Array.isArray(current?.value)
          ? (current.value as (number | null)[])
          : []
        return (
          <NumericFilter
            value={[v[0] ?? null, v[1] ?? null]}
            onChange={applyNumeric(field)}
            onClear={clearField(field)}
            label={label}
          />
        )
      }
      case 'categorical':
        return (
          <CategoricalFilter
            options={config.filterOptions ?? []}
            selectedValues={
              Array.isArray(current?.value) ? (current.value as string[]) : []
            }
            onChange={applyCategorical(field)}
            onClear={clearField(field)}
            label={label}
            multiple
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="clubs-filters-overlay">
      <div
        data-testid="filters-panel-backdrop"
        className="clubs-filters-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="clubs-filters-panel"
        onKeyDown={e => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            onClose()
          }
        }}
      >
        <div className="clubs-filters-panel__header">
          <h2 className="clubs-filters-panel__title">Filters</h2>
          <div className="clubs-filters-panel__header-actions">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="clubs-filters-panel__clear-all"
              >
                Clear all ({activeFilterCount})
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="clubs-filters-panel__close"
              aria-label="Close filters"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="clubs-filters-panel__body">
          {filterableColumns.map(config => (
            <section
              key={config.field}
              className="clubs-filters-panel__field"
              aria-label={config.label}
            >
              <h3 className="clubs-filters-panel__field-label">
                {config.label}
              </h3>
              {renderControl(config)}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
