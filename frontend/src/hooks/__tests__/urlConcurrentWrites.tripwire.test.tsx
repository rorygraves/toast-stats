/**
 * @vitest-environment jsdom
 *
 * V4 tripwire (#916, epic #917 S5) — a sort write and a filter write must not
 * clobber each other's URL params.
 *
 * Lesson 070 (#570): the safe form is `setSearchParams(prev => {... mutate a
 * copy of prev ...})`. The unsafe form is a *snapshot* write
 * `setSearchParams(new URLSearchParams({ only my keys }))`, which silently drops
 * every param the writer doesn't know about — so a sort write erases the active
 * filter, and vice versa. `useUrlSort` and `useUrlState` both build their next
 * params from `prev`, so unrelated params survive.
 *
 * react-router's `setSearchParams` is last-navigate-wins, so two *independent*
 * hooks writing in the SAME React batch cannot both land (the app never does
 * this — filter and sort fire from separate user events, i.e. separate batches;
 * and the one page that writes both at once, DistrictClubsPage, reconciles them
 * in a SINGLE `prev =>` write). This guard therefore tests the real invariant:
 * across SEQUENTIAL writes, and against a PRE-EXISTING param, each writer
 * preserves the other's params. It is GREEN today and goes RED the moment
 * either hook regresses to the snapshot form L070 warns about. Unit test (no
 * page mount → fast unit project, V12).
 */
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import React from 'react'
import { useUrlSort } from '../useUrlSort'
import { useUrlState } from '../useUrlState'

const fields = ['aggregate', 'clubs', 'payments'] as const
type Field = (typeof fields)[number]

function wrapper(initial = '/') {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  )
}

/** A component that owns BOTH a URL-synced filter and URL-synced sort. */
function useSortAndFilter() {
  const { sort, toggleSort } = useUrlSort<Field>({
    fields,
    defaultField: 'aggregate',
    defaultDirection: 'desc',
  })
  const [filter, setFilter] = useUrlState('q', '')
  const location = useLocation()
  return { sort, toggleSort, filter, setFilter, search: location.search }
}

const paramsOf = (search: string) => new URLSearchParams(search)

describe('V4 tripwire — sort & filter URL writes preserve each other (L070)', () => {
  it('a filter write then a sort write (sequential) keeps both params', () => {
    const { result } = renderHook(() => useSortAndFilter(), {
      wrapper: wrapper('/'),
    })

    act(() => result.current.setFilter('hello'))
    act(() => result.current.toggleSort('clubs'))

    const params = paramsOf(result.current.search)
    expect(params.get('q')).toBe('hello') // filter not clobbered by sort write
    expect(params.get('sort')).toBe('clubs')
    expect(params.get('dir')).toBe('asc') // new-field click defaults to asc
  })

  it('a sort write then a filter write (sequential) keeps both params', () => {
    const { result } = renderHook(() => useSortAndFilter(), {
      wrapper: wrapper('/'),
    })

    act(() => result.current.toggleSort('payments'))
    act(() => result.current.setFilter('world'))

    const params = paramsOf(result.current.search)
    expect(params.get('sort')).toBe('payments')
    expect(params.get('dir')).toBe('asc')
    expect(params.get('q')).toBe('world') // sort not clobbered by filter write
  })

  it('a sort write preserves a filter already present in the URL', () => {
    const { result } = renderHook(() => useSortAndFilter(), {
      wrapper: wrapper('/?q=existing'),
    })

    act(() => result.current.toggleSort('clubs'))

    const params = paramsOf(result.current.search)
    expect(params.get('q')).toBe('existing') // untouched by the sort write
    expect(params.get('sort')).toBe('clubs')
  })

  it('a filter write preserves sort/dir already present in the URL', () => {
    const { result } = renderHook(() => useSortAndFilter(), {
      wrapper: wrapper('/?sort=clubs&dir=asc'),
    })

    act(() => result.current.setFilter('typed'))

    const params = paramsOf(result.current.search)
    expect(params.get('sort')).toBe('clubs') // untouched by the filter write
    expect(params.get('dir')).toBe('asc')
    expect(params.get('q')).toBe('typed')
  })
})
