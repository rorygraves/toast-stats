/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import React from 'react'
import { useUrlSort } from '../useUrlSort'

const fields = ['aggregate', 'clubs', 'payments', 'distinguished'] as const
type Field = (typeof fields)[number]

function wrapper({
  children,
  initial = '/',
}: {
  children: React.ReactNode
  initial?: string
}) {
  return <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
}

function useHookWithLocation(initial = '/') {
  const sortApi = useUrlSort<Field>({
    fields,
    defaultField: 'aggregate',
    defaultDirection: 'desc',
  })
  const location = useLocation()
  return { ...sortApi, search: location.search, _initial: initial }
}

describe('useUrlSort', () => {
  it('returns the default field/direction when no URL params', () => {
    const { result } = renderHook(() => useHookWithLocation(), {
      wrapper: ({ children }) => wrapper({ children }),
    })
    expect(result.current.sort).toEqual({
      field: 'aggregate',
      direction: 'desc',
    })
    expect(result.current.search).toBe('')
  })

  it('reads the field/direction from the URL', () => {
    const { result } = renderHook(
      () =>
        useUrlSort<Field>({
          fields,
          defaultField: 'aggregate',
          defaultDirection: 'desc',
        }),
      {
        wrapper: ({ children }) =>
          wrapper({ children, initial: '/?sort=clubs&dir=asc' }),
      }
    )
    expect(result.current.sort).toEqual({ field: 'clubs', direction: 'asc' })
  })

  it('ignores unknown fields and falls back to defaults', () => {
    const { result } = renderHook(
      () =>
        useUrlSort<Field>({
          fields,
          defaultField: 'aggregate',
          defaultDirection: 'desc',
        }),
      {
        wrapper: ({ children }) =>
          wrapper({ children, initial: '/?sort=bogus&dir=asc' }),
      }
    )
    expect(result.current.sort).toEqual({
      field: 'aggregate',
      direction: 'desc',
    })
  })

  it('toggleSort on a new field sets it (with default direction)', () => {
    const { result } = renderHook(() => useHookWithLocation(), {
      wrapper: ({ children }) => wrapper({ children }),
    })
    act(() => result.current.toggleSort('clubs'))
    // re-render reads location
    expect(result.current.sort).toEqual({ field: 'clubs', direction: 'desc' })
    // URL contains both sort= and dir=
    expect(result.current.search).toContain('sort=clubs')
    expect(result.current.search).toContain('dir=desc')
  })

  it('toggleSort on the same field flips direction', () => {
    const { result } = renderHook(() => useHookWithLocation(), {
      wrapper: ({ children }) => wrapper({ children }),
    })
    act(() => result.current.toggleSort('clubs')) // desc
    act(() => result.current.toggleSort('clubs')) // asc
    expect(result.current.sort).toEqual({ field: 'clubs', direction: 'asc' })
  })

  it('clears URL params when returning to the default sort', () => {
    const { result } = renderHook(() => useHookWithLocation(), {
      wrapper: ({ children }) => wrapper({ children }),
    })
    act(() => result.current.toggleSort('clubs'))
    act(() => result.current.toggleSort('aggregate')) // back to default field
    expect(result.current.sort).toEqual({
      field: 'aggregate',
      direction: 'desc',
    })
    expect(result.current.search).not.toContain('sort=')
    expect(result.current.search).not.toContain('dir=')
  })

  it('preserves unrelated URL params on toggle', () => {
    const { result } = renderHook(() => useHookWithLocation(), {
      wrapper: ({ children }) =>
        wrapper({ children, initial: '/?status=vulnerable' }),
    })
    act(() => result.current.toggleSort('clubs'))
    expect(result.current.search).toContain('status=vulnerable')
    expect(result.current.search).toContain('sort=clubs')
  })
})
