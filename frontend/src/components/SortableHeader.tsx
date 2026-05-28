import React from 'react'
import type { SortDirection } from '../hooks/useUrlSort'

export interface SortableHeaderProps<F extends string> {
  /** Field identifier this header sorts by. */
  field: F
  /** Visible header text. */
  label: React.ReactNode
  /** The currently active sort across the table. */
  currentSort: { field: F | null; direction: SortDirection }
  /** Toggle handler — same field flips direction, new field selects it. */
  onSort: (field: F) => void
  /** Optional class on the <th>. */
  thClassName?: string
  /** Optional class on the inner button. */
  buttonClassName?: string
  /** Right-aligned numeric columns set this to true. */
  numeric?: boolean
  /** Pass-through table-cell attributes for layouts with column groups. */
  colSpan?: number
  rowSpan?: number
  /** Pass-through scope (default 'col'; use 'colgroup' for spanning groups). */
  scope?: 'col' | 'colgroup'
}

/**
 * Click-header-to-sort table header (#851). Lesson 077: callers pass their
 * own classes — no variant taxonomy here. The component owns only the
 * click semantics (toggle), the affordance (up/down chevron, non-color),
 * and the a11y contract (`aria-sort` on the <th>, descriptive button
 * label).
 */
export function SortableHeader<F extends string>({
  field,
  label,
  currentSort,
  onSort,
  thClassName,
  buttonClassName,
  numeric = false,
  colSpan,
  rowSpan,
  scope = 'col',
}: SortableHeaderProps<F>): React.JSX.Element {
  const isActive = currentSort.field === field
  const direction = isActive ? currentSort.direction : null
  const ariaSort: React.AriaAttributes['aria-sort'] =
    direction === 'asc'
      ? 'ascending'
      : direction === 'desc'
        ? 'descending'
        : 'none'

  const ariaLabel = isActive
    ? `Sort by ${label}, currently ${direction === 'asc' ? 'ascending' : 'descending'}. Click to flip direction.`
    : `Sort by ${label}.`

  return (
    <th
      scope={scope}
      aria-sort={ariaSort}
      className={thClassName}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        aria-label={ariaLabel}
        className={
          buttonClassName ??
          `sortable-header__btn${numeric ? ' sortable-header__btn--numeric' : ''}${
            isActive ? ' sortable-header__btn--active' : ''
          }`
        }
      >
        <span className="sortable-header__label">{label}</span>
        <SortIndicator direction={direction} />
      </button>
    </th>
  )
}

function SortIndicator({
  direction,
}: {
  direction: SortDirection | null
}): React.JSX.Element {
  // Two arrows stacked — the active one tints; the inactive one is
  // muted but still drawn, so direction reads from shape not color
  // (a11y house rule, no color-alone).
  return (
    <span
      className="sortable-header__indicator"
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
