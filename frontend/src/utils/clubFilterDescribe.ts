/**
 * clubFilterDescribe — turn a ColumnFilter into a short, human-readable
 * descriptor (#817, epic #818 Sprint 4).
 *
 * One source of truth for "what does this active filter say", consumed by the
 * active-filters summary bar (removable chips) and the zero-results state
 * ("no clubs match: Div A · Members ≥20"). Keeping it shared means the two
 * surfaces can never drift on how a filter is named.
 */
import {
  COLUMN_CONFIGS,
  ColumnFilter,
  FilterState,
} from '../components/filters/types'

export interface FilterDescriptor {
  field: string
  /** Column label, e.g. "Div", "Members", "Tier". */
  label: string
  /** Value summary, e.g. "A", "5–20", "≥2", "President's, Select". */
  value: string
}

const LABELS: Record<string, string> = Object.fromEntries(
  COLUMN_CONFIGS.map(c => [c.field, c.label])
)

/** Internal status code → display name (mirrors the quick-filter chip labels). */
const STATUS_DISPLAY: Record<string, string> = {
  thriving: 'Thriving',
  vulnerable: 'Vulnerable',
  'intervention-required': 'Intervention',
}

/** Distinguished tier code → display name. */
const TIER_DISPLAY: Record<string, string> = {
  Distinguished: 'Distinguished',
  Select: 'Select',
  President: "President's",
  Smedley: 'Smedley',
  NotDistinguished: 'Not Distinguished',
}

const displayCategorical = (field: string, value: string): string => {
  if (field === 'status') return STATUS_DISPLAY[value] ?? value
  if (field === 'distinguished') return TIER_DISPLAY[value] ?? value
  return value
}

const describeNumeric = (value: (number | null)[]): string => {
  const min = value[0] ?? null
  const max = value[1] ?? null
  if (min !== null && max !== null) {
    return min === max ? `${min}` : `${min}–${max}`
  }
  if (min !== null) return `≥${min}`
  if (max !== null) return `≤${max}`
  return ''
}

const describeValue = (filter: ColumnFilter): string => {
  if (filter.type === 'text') {
    return typeof filter.value === 'string' ? filter.value : ''
  }
  if (filter.type === 'numeric') {
    return describeNumeric(filter.value as (number | null)[])
  }
  const values = Array.isArray(filter.value) ? (filter.value as string[]) : []
  return values
    .filter(Boolean)
    .map(v => displayCategorical(filter.field, v))
    .join(', ')
}

export function describeFilter(filter: ColumnFilter): FilterDescriptor {
  return {
    field: filter.field,
    label: LABELS[filter.field] ?? filter.field,
    value: describeValue(filter),
  }
}

export function describeActiveFilters(state: FilterState): FilterDescriptor[] {
  return (Object.values(state).filter(Boolean) as ColumnFilter[]).map(
    describeFilter
  )
}
