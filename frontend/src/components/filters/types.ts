/**
 * Filter component types and interfaces for the ClubsTable
 */

import { ClubTrend } from '../../hooks/useDistrictAnalytics'

/**
 * Sortable field types for the clubs table
 */
export type SortField =
  | 'name'
  | 'membership'
  | 'dcpGoals'
  | 'status'
  | 'division'
  | 'area'
  | 'distinguished'
  | 'octoberRenewals'
  | 'aprilRenewals'
  | 'newMembers'
  | 'clubStatus'
  | 'membersNeeded'
  | 'yearsChartered'

/**
 * Sort direction types
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Column groups for the show/hide model (ADR-006 §4, #819 epic #821 Sprint 2).
 *
 * A growing column set (#688, #687, and #795's delta columns) overflows when
 * every column is always-on. Each column declares a `group`; the user shows or
 * hides whole groups (Identity / Membership / Renewals / Recognition /
 * Changes). `changes` is reserved for #795's opt-in delta columns (Sprint 3)
 * and is empty until then — `ColumnGroupsMenu` filters empty groups out of the
 * popover, so there's no dead toggle.
 */
export type ColumnGroup =
  | 'identity'
  | 'membership'
  | 'renewals'
  | 'recognition'
  | 'changes'

/** Canonical group ids, in display order. */
export const COLUMN_GROUP_IDS: readonly ColumnGroup[] = [
  'identity',
  'membership',
  'renewals',
  'recognition',
  'changes',
] as const

/** Group id + human label for the show/hide control, in display order. */
export const COLUMN_GROUPS: readonly { id: ColumnGroup; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'membership', label: 'Membership' },
  { id: 'renewals', label: 'Renewals' },
  { id: 'recognition', label: 'Recognition' },
  { id: 'changes', label: 'Changes' },
] as const

/**
 * The sticky key column. It is the row's own label, so the group show/hide
 * control never hides it (ADR-006 §3 — key column never hidden), even when its
 * group (Identity) is hidden. Wired to TanStack `columnVisibility` in
 * ClubsTable so the table model agrees with the CSS-level sticky behaviour.
 */
export const STICKY_COLUMN_FIELD: SortField = 'name'

/**
 * Filter operators for different data types
 */
export type FilterOperator =
  | 'contains'
  | 'startsWith'
  | 'equals'
  | 'range'
  | 'in'

/**
 * Individual column filter configuration
 */
export interface ColumnFilter {
  field: SortField
  type: 'text' | 'numeric' | 'categorical'
  value: string | (number | null)[] | string[]
  operator?: FilterOperator
}

/**
 * Filter state for all columns
 */
export interface FilterState {
  [key: string]: ColumnFilter | null
}

/**
 * Column configuration for filtering and sorting
 */
export interface ColumnConfig {
  field: SortField
  label: string
  sortable: boolean
  filterable: boolean
  filterType: 'text' | 'numeric' | 'categorical'
  filterOptions?: string[]
  sortCustom?: (a: unknown, b: unknown) => number
  /** Show/hide group this column belongs to (ADR-006 §4, #819). */
  group: ColumnGroup
}

/**
 * Props for column header component.
 *
 * Sort-only since #816 (epic #818 Sprint 3): filtering moved out of the hidden
 * per-column header dropdown into the dedicated FiltersPanel drawer, so the
 * header no longer carries `filterable`/`filterType`/`currentFilter`/`onFilter`/
 * `options`. The header is now exclusively a sort control.
 */
export interface ColumnHeaderProps {
  field: SortField
  label: string
  sortable: boolean
  currentSort: { field: SortField | null; direction: SortDirection }
  onSort: (field: SortField) => void
  className?: string
}

/**
 * Base props for all filter components
 */
export interface BaseFilterProps {
  onClear: () => void
  className?: string
}

/**
 * Props for text filter component
 */
export interface TextFilterProps extends BaseFilterProps {
  value: string
  onChange: (value: string, operator: 'contains' | 'startsWith') => void
  placeholder?: string
}

/**
 * Props for numeric filter component
 */
export interface NumericFilterProps extends BaseFilterProps {
  value: [number | null, number | null]
  onChange: (min: number | null, max: number | null) => void
  label: string
  min?: number
  max?: number
}

/**
 * Props for categorical filter component
 */
export interface CategoricalFilterProps extends BaseFilterProps {
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  label: string
  multiple?: boolean
}

export interface ProcessedClubTrend extends ClubTrend {
  // Computed values for filtering
  latestMembership: number
  latestDcpGoals: number
  distinguishedOrder: number // For proper Distinguished column sorting
  membersNeeded: number // For "Members Needed" column filtering/sorting
  /** Whole years since charter, or null when charterDate is missing
   *  or invalid. Powers the Years Chartered column (#448) + sorting. */
  yearsChartered: number | null
}

/**
 * Column configurations for the clubs table.
 *
 * Order reconciled to the HANDOFF column set (#669, epic #665 Sprint 3):
 * Club, Div, Area, Status, Members, Needed, New, Oct Renew, Apr Renew,
 * DCP, Tier — then the kept extras (Club Status, Years) appended. The
 * ClubsTable body `<td>` cells are hand-ordered to match this array, so
 * the two MUST stay in lockstep.
 */
export const COLUMN_CONFIGS: ColumnConfig[] = [
  {
    field: 'name',
    group: 'identity',
    label: 'Club',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    field: 'division',
    group: 'identity',
    label: 'Div',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    field: 'area',
    group: 'identity',
    label: 'Area',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    field: 'status',
    group: 'recognition',
    label: 'Status',
    sortable: true,
    filterable: true,
    filterType: 'categorical',
    filterOptions: ['thriving', 'vulnerable', 'intervention-required'],
  },
  {
    field: 'membership',
    group: 'membership',
    label: 'Members',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'membersNeeded',
    group: 'membership',
    label: 'Needed',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'newMembers',
    group: 'membership',
    label: 'New',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'octoberRenewals',
    group: 'renewals',
    label: 'Oct Renew',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'aprilRenewals',
    group: 'renewals',
    label: 'Apr Renew',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'dcpGoals',
    group: 'recognition',
    label: 'DCP',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'distinguished',
    group: 'recognition',
    label: 'Tier',
    sortable: true,
    filterable: true,
    filterType: 'categorical',
    filterOptions: [
      'Distinguished',
      'Select',
      'President',
      'Smedley',
      'NotDistinguished',
    ],
    sortCustom: (a: unknown, b: unknown) => {
      const order = {
        Distinguished: 0,
        Select: 1,
        President: 2,
        Smedley: 3,
        NotDistinguished: 4,
      }
      const aValue = a as keyof typeof order
      const bValue = b as keyof typeof order
      return (order[aValue] || 999) - (order[bValue] || 999)
    },
  },
  {
    field: 'clubStatus',
    group: 'identity',
    label: 'Club Status',
    sortable: true,
    filterable: true,
    filterType: 'categorical',
    filterOptions: ['Active', 'Suspended', 'Ineligible', 'Low'],
  },
  {
    field: 'yearsChartered',
    group: 'identity',
    label: 'Years',
    sortable: true,
    filterable: false,
    filterType: 'numeric',
  },
]
