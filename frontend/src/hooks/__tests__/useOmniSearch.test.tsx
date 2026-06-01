/* useOmniSearch (epic #1055 Sprint 3, #1058) — the shared search behavior
   behind the modal palette and the desktop header combobox. These tests lock
   the logic-dense, surface-independent contract: lazy index gating, keyboard
   navigation (arrow clamping, Enter→onSelect, Escape→onDismiss), and the
   query-reset-clears-active-row rule. Both consumers rely on this. */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { useOmniSearch } from '../useOmniSearch'
import { fetchCdnRankings, fetchCdnClubIndex } from '../../services/cdn'

vi.mock('../../services/cdn', () => ({
  fetchCdnRankings: vi.fn(),
  fetchCdnClubIndex: vi.fn(),
}))

const mockedRankings = vi.mocked(fetchCdnRankings)
const mockedClubIndex = vi.mocked(fetchCdnClubIndex)

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

// A minimal KeyboardEvent stand-in — handleKeyDown only reads `key` and calls
// preventDefault().
const keyEvent = (key: string) =>
  ({
    key,
    preventDefault: vi.fn(),
  }) as unknown as React.KeyboardEvent<HTMLInputElement>

const setupCdn = () => {
  mockedRankings.mockResolvedValue({
    rankings: [
      { districtId: '57', districtName: 'District 57', region: '7' },
      { districtId: '61', districtName: 'District 61', region: '7' },
    ],
    date: '2025-11-22',
  } as Awaited<ReturnType<typeof fetchCdnRankings>>)
  mockedClubIndex.mockResolvedValue({
    clubs: { '12345': { districtId: '61', clubName: 'Toast of the Town' } },
  } as Awaited<ReturnType<typeof fetchCdnClubIndex>>)
}

describe('useOmniSearch (#1058)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupCdn()
  })

  it('does not fetch the index while disabled (lazy gate)', () => {
    renderHook(() => useOmniSearch({ onSelect: vi.fn(), enabled: false }), {
      wrapper,
    })
    expect(mockedRankings).not.toHaveBeenCalled()
    expect(mockedClubIndex).not.toHaveBeenCalled()
  })

  it('fetches the index once enabled and matches a query into grouped results', async () => {
    const { result } = renderHook(() => useOmniSearch({ onSelect: vi.fn() }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.index).toBeDefined())
    act(() => result.current.setQuery('61'))
    expect(result.current.flat.length).toBeGreaterThan(0)
    expect(result.current.flat[0].route).toBe('/district/61')
    expect(result.current.hasQuery).toBe(true)
  })

  it('ArrowDown advances the active row and clamps at the last result', async () => {
    const { result } = renderHook(() => useOmniSearch({ onSelect: vi.fn() }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.index).toBeDefined())
    act(() => result.current.setQuery('7')) // matches both districts + region
    const last = result.current.flat.length - 1
    expect(result.current.activeIndex).toBe(0)
    for (let i = 0; i < last + 3; i++) {
      act(() => result.current.handleKeyDown(keyEvent('ArrowDown')))
    }
    expect(result.current.activeIndex).toBe(last) // clamped, never overruns
  })

  it('ArrowUp clamps at the first result', async () => {
    const { result } = renderHook(() => useOmniSearch({ onSelect: vi.fn() }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.index).toBeDefined())
    act(() => result.current.setQuery('7'))
    act(() => result.current.handleKeyDown(keyEvent('ArrowDown')))
    act(() => result.current.handleKeyDown(keyEvent('ArrowUp')))
    act(() => result.current.handleKeyDown(keyEvent('ArrowUp')))
    expect(result.current.activeIndex).toBe(0)
  })

  it('Enter selects the active entity', async () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() => useOmniSearch({ onSelect }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.index).toBeDefined())
    act(() => result.current.setQuery('61'))
    const active = result.current.activeEntity
    act(() => result.current.handleKeyDown(keyEvent('Enter')))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(active)
  })

  it('Enter with no results is a no-op (does not call onSelect)', async () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() => useOmniSearch({ onSelect }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.index).toBeDefined())
    // Empty query → no results, no active entity.
    expect(result.current.activeEntity).toBeUndefined()
    act(() => result.current.handleKeyDown(keyEvent('Enter')))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('Escape calls onDismiss', async () => {
    const onDismiss = vi.fn()
    const { result } = renderHook(
      () => useOmniSearch({ onSelect: vi.fn(), onDismiss }),
      { wrapper }
    )
    await waitFor(() => expect(result.current.index).toBeDefined())
    act(() => result.current.handleKeyDown(keyEvent('Escape')))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('changing the query resets the active row to the first result', async () => {
    const { result } = renderHook(() => useOmniSearch({ onSelect: vi.fn() }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.index).toBeDefined())
    act(() => result.current.setQuery('7'))
    act(() => result.current.handleKeyDown(keyEvent('ArrowDown')))
    expect(result.current.activeIndex).toBe(1)
    act(() => result.current.setQuery('61')) // new query
    expect(result.current.activeIndex).toBe(0)
  })
})
