/**
 * clubFilterUrl — round-trip between FilterState and URL search params (#817,
 * epic #818 Sprint 4). Generalises the status+search-only mapping that lived
 * inline in DistrictClubsPage so EVERY filterable column survives a reload.
 */
import { describe, it, expect } from 'vitest'
import {
  paramsToFilterState,
  filterStateToParams,
  FILTER_PARAM_KEYS,
  PRESET_PARAM,
  PRESET_CLOSE_TO_DISTINGUISHED,
  paramsToPresetActive,
} from '../clubFilterUrl'
import type { FilterState } from '../../components/filters/types'

const params = (s: string) => new URLSearchParams(s)
const toRecord = (state: FilterState) =>
  Object.fromEntries(filterStateToParams(state))

describe('clubFilterUrl — paramsToFilterState (read)', () => {
  it('maps ?status=intervention to the intervention-required categorical filter', () => {
    const state = paramsToFilterState(params('status=intervention'))
    expect(state['status']).toEqual({
      field: 'status',
      type: 'categorical',
      value: ['intervention-required'],
      operator: 'in',
    })
  })

  it('maps ?search to the name text filter', () => {
    const state = paramsToFilterState(params('search=alpha'))
    expect(state['name']).toEqual({
      field: 'name',
      type: 'text',
      value: 'alpha',
      operator: 'contains',
    })
  })

  it('maps a bare text column param to a contains text filter', () => {
    const state = paramsToFilterState(params('division=A'))
    expect(state['division']).toEqual({
      field: 'division',
      type: 'text',
      value: 'A',
      operator: 'contains',
    })
  })

  it('parses a numeric range "min..max"', () => {
    const state = paramsToFilterState(params('membership=5..20'))
    expect(state['membership']).toEqual({
      field: 'membership',
      type: 'numeric',
      value: [5, 20],
      operator: 'range',
    })
  })

  it('parses an open-ended numeric range "2.." (min only)', () => {
    const state = paramsToFilterState(params('membersNeeded=2..'))
    expect(state['membersNeeded']?.value).toEqual([2, null])
  })

  it('parses an open-ended numeric range "..20" (max only)', () => {
    const state = paramsToFilterState(params('membership=..20'))
    expect(state['membership']?.value).toEqual([null, 20])
  })

  it('parses an exact numeric "0..0"', () => {
    const state = paramsToFilterState(params('octoberRenewals=0..0'))
    expect(state['octoberRenewals']?.value).toEqual([0, 0])
  })

  it('parses a comma-joined categorical (distinguished)', () => {
    const state = paramsToFilterState(params('distinguished=President,Select'))
    expect(state['distinguished']).toEqual({
      field: 'distinguished',
      type: 'categorical',
      value: ['President', 'Select'],
      operator: 'in',
    })
  })

  it('ignores reserved non-filter params (py, date, sort, dir)', () => {
    const state = paramsToFilterState(
      params('py=2025&date=2026-04-26&sort=membership&dir=desc')
    )
    expect(Object.keys(state)).toHaveLength(0)
  })

  it('drops an unparseable numeric range rather than crashing', () => {
    const state = paramsToFilterState(params('membership=abc..xyz'))
    expect(state['membership']).toBeUndefined()
  })
})

describe('clubFilterUrl — filterStateToParams (write)', () => {
  it('writes the status display alias, not the internal value', () => {
    const rec = toRecord({
      status: {
        field: 'status',
        type: 'categorical',
        value: ['intervention-required'],
        operator: 'in',
      },
    })
    expect(rec['status']).toBe('intervention')
  })

  it('writes name as ?search', () => {
    const rec = toRecord({
      name: {
        field: 'name',
        type: 'text',
        value: 'alpha',
        operator: 'contains',
      },
    })
    expect(rec['search']).toBe('alpha')
    expect(rec['name']).toBeUndefined()
  })

  it('encodes a numeric range as min..max and an open end as 2..', () => {
    expect(
      toRecord({
        membership: {
          field: 'membership',
          type: 'numeric',
          value: [5, 20],
          operator: 'range',
        },
      })['membership']
    ).toBe('5..20')
    expect(
      toRecord({
        membersNeeded: {
          field: 'membersNeeded',
          type: 'numeric',
          value: [2, null],
          operator: 'range',
        },
      })['membersNeeded']
    ).toBe('2..')
  })

  it('encodes a categorical as comma-joined', () => {
    expect(
      toRecord({
        distinguished: {
          field: 'distinguished',
          type: 'categorical',
          value: ['President', 'Select'],
          operator: 'in',
        },
      })['distinguished']
    ).toBe('President,Select')
  })

  it('omits empty/null filters from the params', () => {
    const rec = toRecord({ membership: null, name: null })
    expect(Object.keys(rec)).toHaveLength(0)
  })

  it('FILTER_PARAM_KEYS includes every key the writer can emit', () => {
    // Guards the parent reconcile loop: every param the writer can set must be
    // deletable, or a removed filter would stick in the URL.
    const everyType: FilterState = {
      status: { field: 'status', type: 'categorical', value: ['thriving'] },
      name: { field: 'name', type: 'text', value: 'x', operator: 'contains' },
      division: { field: 'division', type: 'text', value: 'A' },
      membership: { field: 'membership', type: 'numeric', value: [1, 2] },
      distinguished: {
        field: 'distinguished',
        type: 'categorical',
        value: ['President'],
      },
    }
    for (const [key] of filterStateToParams(everyType)) {
      expect(FILTER_PARAM_KEYS).toContain(key)
    }
  })
})

describe('clubFilterUrl — round-trip', () => {
  it('round-trips a mixed FilterState through params and back', () => {
    const original: FilterState = {
      status: {
        field: 'status',
        type: 'categorical',
        value: ['vulnerable'],
        operator: 'in',
      },
      name: {
        field: 'name',
        type: 'text',
        value: 'speak',
        operator: 'contains',
      },
      division: {
        field: 'division',
        type: 'text',
        value: 'B',
        operator: 'contains',
      },
      membership: {
        field: 'membership',
        type: 'numeric',
        value: [10, null],
        operator: 'range',
      },
      distinguished: {
        field: 'distinguished',
        type: 'categorical',
        value: ['President', 'Distinguished'],
        operator: 'in',
      },
    }
    const sp = new URLSearchParams(filterStateToParams(original))
    expect(paramsToFilterState(sp)).toEqual(original)
  })
})

describe('clubFilterUrl — "Close to Distinguished" preset (#979)', () => {
  it('reads ?preset=close-to-distinguished as active', () => {
    expect(
      paramsToPresetActive(
        params(`${PRESET_PARAM}=${PRESET_CLOSE_TO_DISTINGUISHED}`)
      )
    ).toBe(true)
  })

  it('treats an absent preset param as inactive', () => {
    expect(paramsToPresetActive(params(''))).toBe(false)
    expect(paramsToPresetActive(params('status=vulnerable'))).toBe(false)
  })

  it('ignores an unknown preset value (only the canonical token activates)', () => {
    expect(paramsToPresetActive(params(`${PRESET_PARAM}=something-else`))).toBe(
      false
    )
  })

  it('keeps `preset` OUT of FILTER_PARAM_KEYS so a filter reconcile never wipes it', () => {
    // The filter reconcile in DistrictClubsPage deletes every FILTER_PARAM_KEYS
    // entry then re-emits present filters. The preset is a separate pipeline
    // step (not a column filter), written by its own handler — including it here
    // would silently clear the preset on any filter change.
    expect(FILTER_PARAM_KEYS).not.toContain(PRESET_PARAM)
  })
})
