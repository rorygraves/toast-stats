import React from 'react'
import { ColumnHeaderProps } from './filters/types'

/**
 * Interactive column header — direct click toggles sort (#851).
 *
 * Pre-#851 this rendered a popover (Sort A-Z / Sort Z-A) on click; the
 * popover was vestigial after #816 stripped filtering out of the header,
 * and Sprint 851's "click a column header to sort by it; click again to
 * flip direction" rule made the extra hop redundant. Clicking the
 * header BUTTON now calls onSort(field) directly — the parent table
 * (ClubsTable) interprets that as toggle-direction-on-same-field /
 * new-field-resets-to-asc, identical to the prior popover behaviour
 * minus one click.
 *
 * Affordance: a chevron oriented up (asc) or down (desc) when this column
 * is the active sort key; muted when it isn't. Direction reads from
 * shape, not color (a11y house rule, no color-alone).
 */
export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  field,
  label,
  sortable,
  currentSort,
  onSort,
  className = '',
}) => {
  // Non-sortable column: a plain, non-interactive label.
  if (!sortable) {
    return (
      <div
        className={`clubs-col-header flex items-center gap-1 px-2 py-2 text-left text-[9px] font-medium uppercase tracking-wider ${className}`.trim()}
      >
        <span className="flex-1">{label}</span>
      </div>
    )
  }

  const isActive = currentSort.field === field
  const direction = isActive ? currentSort.direction : null

  const ariaLabel = isActive
    ? `Sort by ${label}, currently sorted ${direction === 'asc' ? 'ascending' : 'descending'}. Click to flip direction.`
    : `Sort by ${label}.`

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`clubs-col-header group flex items-center gap-1 px-2 py-2 text-left text-[9px] font-medium uppercase tracking-wider hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue focus:ring-inset transition-all duration-200 w-full cursor-pointer${
          isActive ? ' clubs-col-header--active' : ''
        }`}
        aria-label={ariaLabel}
      >
        <span className="flex-1">{label}</span>
        <SortIndicator direction={direction} />
      </button>
    </div>
  )
}

function SortIndicator({
  direction,
}: {
  direction: 'asc' | 'desc' | null
}): React.JSX.Element {
  // Two arrows stacked — the active one tints, the inactive stays muted.
  // Active triangle has full opacity; the inactive one is dimmed but still
  // drawn, so a screenshot or a colour-blind viewer can still read which
  // direction is active from shape alone.
  return (
    <span
      className="clubs-col-header__indicator"
      aria-hidden="true"
      data-sort-indicator={direction ?? 'none'}
    >
      <svg
        width="8"
        height="10"
        viewBox="0 0 8 10"
        fill="none"
        focusable="false"
      >
        <path
          d="M4 0 L8 4 L0 4 Z"
          fill="currentColor"
          opacity={direction === 'asc' ? 1 : 0.3}
        />
        <path
          d="M0 6 L8 6 L4 10 Z"
          fill="currentColor"
          opacity={direction === 'desc' ? 1 : 0.3}
        />
      </svg>
    </span>
  )
}
