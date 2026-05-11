import { describe, expect, it, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePersistedState } from '../usePersistedState'
import { storageKey } from '../../utils/localStorageStore'

describe('usePersistedState (#416)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the initial value when nothing is stored', () => {
    const { result } = renderHook(() =>
      usePersistedState<string>('greeting', 'hello')
    )
    expect(result.current[0]).toBe('hello')
  })

  it('returns the stored value when present', () => {
    localStorage.setItem(storageKey('greeting'), JSON.stringify('hi'))
    const { result } = renderHook(() =>
      usePersistedState<string>('greeting', 'hello')
    )
    expect(result.current[0]).toBe('hi')
  })

  it('writes new values to localStorage', () => {
    const { result } = renderHook(() => usePersistedState<number>('count', 0))
    act(() => result.current[1](42))
    expect(localStorage.getItem(storageKey('count'))).toBe('42')
  })

  it('supports the functional setter form', () => {
    const { result } = renderHook(() => usePersistedState<number>('count', 0))
    act(() => result.current[1](prev => prev + 5))
    expect(result.current[0]).toBe(5)
    act(() => result.current[1](prev => prev + 5))
    expect(result.current[0]).toBe(10)
    expect(localStorage.getItem(storageKey('count'))).toBe('10')
  })

  it('handles arrays and objects', () => {
    const { result } = renderHook(() =>
      usePersistedState<string[]>('regions', [])
    )
    act(() => result.current[1](['1', '7', '11']))
    expect(result.current[0]).toEqual(['1', '7', '11'])
    expect(
      JSON.parse(localStorage.getItem(storageKey('regions')) ?? '[]')
    ).toEqual(['1', '7', '11'])
  })
})
