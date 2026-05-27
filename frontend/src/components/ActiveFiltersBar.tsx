import React from 'react'
import { ColumnFilter, FilterState, SortField } from './filters/types'
import { describeActiveFilters } from '../utils/clubFilterDescribe'

export interface ActiveFiltersBarProps {
  filterState: FilterState
  setFilter: (field: SortField, filter: ColumnFilter | null) => void
  clearAllFilters: () => void
}

/**
 * ActiveFiltersBar — the visible, removable summary of every active club filter
 * (#817, epic #818 Sprint 4 / table-ux-review §B4).
 *
 * Sprints 1–3 left the active filter set implicit: the preset chips lit up, the
 * Filters-drawer trigger carried a count badge, but a filter set INSIDE the
 * drawer (e.g. "Division contains A", "Members ≥ 20") was invisible once the
 * drawer closed. This bar makes the full set legible and individually
 * removable, reusing the shared `describeActiveFilters` so a chip here names a
 * filter exactly as the zero-results state does.
 *
 * It does not own filter state — it reads `filterState` and calls back through
 * the same `setFilter`/`clearAllFilters` the drawer and presets use (R11: one
 * filter state, more entry points, pipeline untouched).
 */
export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  filterState,
  setFilter,
  clearAllFilters,
}) => {
  const descriptors = describeActiveFilters(filterState)
  if (descriptors.length === 0) return null

  return (
    <div
      className="clubs-active-filters"
      role="region"
      aria-label="Active filters"
    >
      <span className="clubs-active-filters__label">Active:</span>
      <ul className="clubs-active-filters__list">
        {descriptors.map(({ field, label, value }) => (
          <li key={field} className="clubs-active-filters__chip">
            <span className="clubs-active-filters__chip-label">{label}:</span>
            <span className="clubs-active-filters__chip-value">{value}</span>
            <button
              type="button"
              className="clubs-active-filters__remove"
              aria-label={`Remove ${label} filter`}
              onClick={() => setFilter(field as SortField, null)}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="clubs-active-filters__clear-all"
        onClick={clearAllFilters}
      >
        Clear all
      </button>
    </div>
  )
}
