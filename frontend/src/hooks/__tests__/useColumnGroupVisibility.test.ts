/**
 * useColumnGroupVisibility (#819, epic #821 Sprint 1).
 *
 * A localStorage-backed set of HIDDEN column groups for the club table. Chosen
 * over URL sync because group visibility is a durable per-user VIEW preference
 * (like dark mode), not shareable filter data — keeping it out of the URL
 * avoids the filter↔URL reconcile race surface (lessons 070/130). Default is
 * all-visible (empty hidden set) so the table is unchanged until the user opts
 * to hide a group.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useColumnGroupVisibility,
  COLUMN_GROUP_VISIBILITY_STORAGE_KEY,
} from '../useColumnGroupVisibility'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('useColumnGroupVisibility (#819)', () => {
  it('defaults to all groups visible (no hidden groups)', () => {
    const { result } = renderHook(() => useColumnGroupVisibility())
    expect(result.current.hiddenGroups.size).toBe(0)
    expect(result.current.isGroupHidden('membership')).toBe(false)
  })

  it('toggles a group hidden and back visible', () => {
    const { result } = renderHook(() => useColumnGroupVisibility())
    act(() => result.current.toggleGroup('renewals'))
    expect(result.current.isGroupHidden('renewals')).toBe(true)
    act(() => result.current.toggleGroup('renewals'))
    expect(result.current.isGroupHidden('renewals')).toBe(false)
  })

  it('persists the hidden set to localStorage', () => {
    const { result } = renderHook(() => useColumnGroupVisibility())
    act(() => result.current.toggleGroup('recognition'))
    const stored = JSON.parse(
      localStorage.getItem(COLUMN_GROUP_VISIBILITY_STORAGE_KEY) || '[]'
    )
    expect(stored).toContain('recognition')
  })

  it('rehydrates the hidden set from localStorage on mount', () => {
    localStorage.setItem(
      COLUMN_GROUP_VISIBILITY_STORAGE_KEY,
      JSON.stringify(['identity', 'renewals'])
    )
    const { result } = renderHook(() => useColumnGroupVisibility())
    expect(result.current.isGroupHidden('identity')).toBe(true)
    expect(result.current.isGroupHidden('renewals')).toBe(true)
    expect(result.current.isGroupHidden('membership')).toBe(false)
  })

  it('ignores unknown / malformed stored ids', () => {
    localStorage.setItem(
      COLUMN_GROUP_VISIBILITY_STORAGE_KEY,
      JSON.stringify(['identity', 'bogus', 42])
    )
    const { result } = renderHook(() => useColumnGroupVisibility())
    expect(result.current.isGroupHidden('identity')).toBe(true)
    expect(result.current.hiddenGroups.size).toBe(1)
  })

  it('survives a corrupt (non-JSON) stored value', () => {
    localStorage.setItem(COLUMN_GROUP_VISIBILITY_STORAGE_KEY, '{not json')
    const { result } = renderHook(() => useColumnGroupVisibility())
    expect(result.current.hiddenGroups.size).toBe(0)
  })
})
