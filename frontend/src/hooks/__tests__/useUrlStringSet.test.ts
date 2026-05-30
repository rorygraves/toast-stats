/**
 * Tests for useUrlStringSet hook (#980)
 *
 * A drop-in for useState<string[]>([]) that persists a SET of string keys in a
 * comma-joined URL param (sorted for a stable URL, deduped, param absent when
 * empty). Built on useUrlState, so unrelated params survive (Lesson 070).
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useUrlStringSet } from '../useUrlStringSet'

function createWrapper(initialEntries: string[] = ['/']) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries }, children)
}

function harness(key: string, entries?: string[]) {
  return renderHook(
    () => {
      const [values, setValues] = useUrlStringSet(key)
      const search = useLocation().search
      return { values, setValues, search }
    },
    { wrapper: createWrapper(entries) }
  )
}

describe('useUrlStringSet', () => {
  it('defaults to an empty array when the param is absent', () => {
    const { result } = harness('historyRegions')
    expect(result.current.values).toEqual([])
  })

  it('reads a comma-joined set from the URL', () => {
    const { result } = harness('historyRegions', ['/?historyRegions=12,5'])
    expect(result.current.values).toEqual(['12', '5'])
  })

  it('writes a sorted, comma-joined set to the URL', () => {
    const { result } = harness('historyRegions')
    act(() => result.current.setValues(['12', '5', '8']))
    expect(
      new URLSearchParams(result.current.search).get('historyRegions')
    ).toBe('12,5,8')
  })

  it('removes the param when set back to empty (clean default)', () => {
    const { result } = harness('historyRegions', ['/?historyRegions=12,5'])
    act(() => result.current.setValues([]))
    expect(
      new URLSearchParams(result.current.search).has('historyRegions')
    ).toBe(false)
    expect(result.current.values).toEqual([])
  })

  it('supports a functional updater for toggling membership', () => {
    const { result } = harness('historyRegions', ['/?historyRegions=12'])
    act(() =>
      result.current.setValues(prev =>
        prev.includes('5') ? prev.filter(r => r !== '5') : [...prev, '5']
      )
    )
    expect(result.current.values).toEqual(['12', '5'])
  })

  it('dedupes and ignores empties on read', () => {
    const { result } = harness('historyRegions', ['/?historyRegions=12,,12,5'])
    expect(result.current.values).toEqual(['12', '5'])
  })

  it('preserves an unrelated param when written', () => {
    const { result } = harness('historyRegions', ['/?historyExpanded=1'])
    act(() => result.current.setValues(['7']))
    const params = new URLSearchParams(result.current.search)
    expect(params.get('historyExpanded')).toBe('1')
    expect(params.get('historyRegions')).toBe('7')
  })
})
