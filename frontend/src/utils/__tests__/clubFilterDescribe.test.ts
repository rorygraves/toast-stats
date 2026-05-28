/**
 * clubFilterDescribe — human-readable descriptors for active club filters
 * (#817, epic #818 Sprint 4). Shared by the active-filters summary bar and the
 * zero-results state so both name a filter identically.
 */
import { describe, it, expect } from 'vitest'
import { describeFilter, describeActiveFilters } from '../clubFilterDescribe'
import type { FilterState } from '../../components/filters/types'

describe('describeFilter', () => {
  it('labels a text filter with its column label and raw value', () => {
    expect(
      describeFilter({
        field: 'division',
        type: 'text',
        value: 'A',
        operator: 'contains',
      })
    ).toEqual({ field: 'division', label: 'Div', value: 'A' })
  })

  it('renders a closed numeric range with an en dash', () => {
    expect(
      describeFilter({
        field: 'membership',
        type: 'numeric',
        value: [5, 20],
        operator: 'range',
      }).value
    ).toBe('5–20')
  })

  it('renders a min-only numeric range as ≥min', () => {
    expect(
      describeFilter({
        field: 'membersNeeded',
        type: 'numeric',
        value: [2, null],
        operator: 'range',
      }).value
    ).toBe('≥2')
  })

  it('renders a max-only numeric range as ≤max', () => {
    expect(
      describeFilter({
        field: 'membership',
        type: 'numeric',
        value: [null, 20],
        operator: 'range',
      }).value
    ).toBe('≤20')
  })

  it('renders an exact numeric range as the single value', () => {
    expect(
      describeFilter({
        field: 'octoberRenewals',
        type: 'numeric',
        value: [0, 0],
        operator: 'range',
      }).value
    ).toBe('0')
  })

  it('maps status internal values to display names', () => {
    expect(
      describeFilter({
        field: 'status',
        type: 'categorical',
        value: ['intervention-required'],
        operator: 'in',
      })
    ).toEqual({ field: 'status', label: 'Status', value: 'Intervention' })
  })

  it('maps distinguished tier codes to display names, joined', () => {
    expect(
      describeFilter({
        field: 'distinguished',
        type: 'categorical',
        value: ['President', 'NotDistinguished'],
        operator: 'in',
      }).value
    ).toBe("President's, Not Distinguished")
  })

  it('passes club-status categorical values through as-is', () => {
    expect(
      describeFilter({
        field: 'clubStatus',
        type: 'categorical',
        value: ['Active', 'Suspended'],
        operator: 'in',
      }).value
    ).toBe('Active, Suspended')
  })
})

describe('describeActiveFilters', () => {
  it('skips null entries and returns one descriptor per active filter', () => {
    const state: FilterState = {
      division: { field: 'division', type: 'text', value: 'A' },
      membership: null,
      status: {
        field: 'status',
        type: 'categorical',
        value: ['thriving'],
        operator: 'in',
      },
    }
    const out = describeActiveFilters(state)
    expect(out.map(d => d.field).sort()).toEqual(['division', 'status'])
  })

  it('returns an empty array for an empty state', () => {
    expect(describeActiveFilters({})).toEqual([])
  })
})
