/**
 * Tests for useUrlBoolean hook (#980)
 *
 * A boolean drop-in for useState<boolean>(false) that persists in a URL search
 * param: `?key=1` when true, param absent when false (the clean default). Built
 * on useUrlState, so it inherits the prev-callback form that preserves unrelated
 * params (Lesson 070 / urlConcurrentWrites tripwire).
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useUrlBoolean } from '../useUrlBoolean'

function createWrapper(initialEntries: string[] = ['/']) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries }, children)
}

describe('useUrlBoolean', () => {
  it('defaults to false when the param is absent', () => {
    const { result } = renderHook(() => useUrlBoolean('expandChanges'), {
      wrapper: createWrapper(),
    })
    expect(result.current[0]).toBe(false)
  })

  it('reads true from `?key=1`', () => {
    const { result } = renderHook(() => useUrlBoolean('expandChanges'), {
      wrapper: createWrapper(['/?expandChanges=1']),
    })
    expect(result.current[0]).toBe(true)
  })

  it('writes `?key=1` to the URL when set true', () => {
    const { result } = renderHook(
      () => {
        const [open, setOpen] = useUrlBoolean('expandChanges')
        const search = useLocation().search
        return { open, setOpen, search }
      },
      { wrapper: createWrapper() }
    )
    act(() => result.current.setOpen(true))
    expect(result.current.open).toBe(true)
    expect(
      new URLSearchParams(result.current.search).get('expandChanges')
    ).toBe('1')
  })

  it('removes the param when set back to false (clean default)', () => {
    const { result } = renderHook(
      () => {
        const [open, setOpen] = useUrlBoolean('expandChanges')
        const search = useLocation().search
        return { open, setOpen, search }
      },
      { wrapper: createWrapper(['/?expandChanges=1']) }
    )
    act(() => result.current.setOpen(false))
    expect(result.current.open).toBe(false)
    expect(
      new URLSearchParams(result.current.search).has('expandChanges')
    ).toBe(false)
  })

  it('supports a functional updater (toggle)', () => {
    const { result } = renderHook(() => useUrlBoolean('expandChanges'), {
      wrapper: createWrapper(),
    })
    act(() => result.current[1](prev => !prev))
    expect(result.current[0]).toBe(true)
    act(() => result.current[1](prev => !prev))
    expect(result.current[0]).toBe(false)
  })

  it('honours a defaultValue of true (param absent ⇒ true, `?key=0` ⇒ false)', () => {
    const open = renderHook(
      () => useUrlBoolean('clubsExpanded', { defaultValue: true }),
      { wrapper: createWrapper() }
    )
    expect(open.result.current[0]).toBe(true)

    const closed = renderHook(
      () => useUrlBoolean('clubsExpanded', { defaultValue: true }),
      { wrapper: createWrapper(['/?clubsExpanded=0']) }
    )
    expect(closed.result.current[0]).toBe(false)
  })

  it('preserves an unrelated param when toggled', () => {
    const { result } = renderHook(
      () => {
        const [open, setOpen] = useUrlBoolean('expandChanges')
        const search = useLocation().search
        return { open, setOpen, search }
      },
      { wrapper: createWrapper(['/?from=2026-05-01']) }
    )
    act(() => result.current.setOpen(true))
    const params = new URLSearchParams(result.current.search)
    expect(params.get('from')).toBe('2026-05-01')
    expect(params.get('expandChanges')).toBe('1')
  })
})
