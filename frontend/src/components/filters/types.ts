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
}

/**
 * Props for column header component
 */
export interface ColumnHeaderProps {
  field: SortField
  label: string
  sortable: boolean
  filterable: boolean
  filterType: 'text' | 'numeric' | 'categorical'
  currentSort: { field: SortField | null; direction: SortDirection }
  currentFilter: ColumnFilter | null
  onSort: (field: SortField) => void
  onFilter: (field: SortField, filter: ColumnFilter | null) => void
  options?: string[]
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
 * Column configurations for the clubs table
 */
export const COLUMN_CONFIGS: ColumnConfig[] = [
  {
    field: 'name',
    label: 'Club Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    field: 'division',
    label: 'Division',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    field: 'area',
    label: 'Area',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    field: 'membership',
    label: 'Members',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'dcpGoals',
    label: 'DCP Goals',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'membersNeeded',
    label: 'Members Needed',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'distinguished',
    label: 'Distinguished',
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
    field: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    filterType: 'categorical',
    filterOptions: ['thriving', 'vulnerable', 'intervention-required'],
  },
  {
    field: 'clubStatus',
    label: 'Club Status',
    sortable: true,
    filterable: true,
    filterType: 'categorical',
    filterOptions: ['Active', 'Suspended', 'Ineligible', 'Low'],
  },
  {
    field: 'octoberRenewals',
    label: 'Oct Ren',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'aprilRenewals',
    label: 'Apr Ren',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'newMembers',
    label: 'New',
    sortable: true,
    filterable: true,
    filterType: 'numeric',
  },
  {
    field: 'yearsChartered',
    label: 'Years',
    sortable: true,
    filterable: false,
    filterType: 'numeric',
  },
]
