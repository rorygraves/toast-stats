/**
 * Unit tests for useProgramYearSummaries (#892).
 *
 * The hook assembles the /history per-year cards from two EXISTING CDN
 * endpoints — the dates index (year-end date per completed program year) and
 * that date's all-districts rankings — with no new pipeline step.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useProgramYearSummaries } from '../useProgramYearSummaries'
import { fetchCdnDates, fetchCdnRankingsForDate } from '../../services/cdn'
import { getCurrentProgramYear } from '../../utils/programYear'

vi.mock('../../services/cdn', () => ({
  fetchCdnDates: vi.fn(),
  fetchCdnRankingsForDate: vi.fn(),
}))

const mockedDates = vi.mocked(fetchCdnDates)
const mockedRankings = vi.mocked(fetchCdnRankingsForDate)

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const rankingEntry = (id: string, rank: number) => ({
  districtId: id,
  districtName: `District ${id}`,
  region: '1',
  paidClubs: 50,
  paidClubBase: 50,
  clubGrowthPercent: 0,
  totalPayments: 2000,
  paymentBase: 2000,
  paymentGrowthPercent: 0,
  activeClubs: 50,
  distinguishedClubs: 10,
  selectDistinguished: 2,
  presidentsDistinguished: 1,
  distinguishedPercent: 20,
  clubsRank: rank,
  paymentsRank: rank,
  distinguishedRank: rank,
  aggregateScore: 1000 - rank,
  overallRank: rank,
})

const rankingsData = (date: string) => ({
  rankings: [rankingEntry('1', 1), rankingEntry('2', 2), rankingEntry('3', 3)],
  date,
  generatedAt: `${date}T00:00:00Z`,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useProgramYearSummaries (#892)', () => {
  it('returns one summary per completed program year, newest first', async () => {
    // Two clearly-past, completed program years (2022-23 and 2023-24).
    mockedDates.mockResolvedValue({
      dates: [
        '2022-09-30',
        '2023-06-30', // year-end 2022-23
        '2023-09-30',
        '2024-06-30', // year-end 2023-24
      ],
      count: 4,
      generatedAt: '2024-07-01T00:00:00Z',
    })
    mockedRankings.mockImplementation(d => Promise.resolve(rankingsData(d)))

    const { result } = renderHook(() => useProgramYearSummaries(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.summaries.map(s => s.label)).toEqual([
      '2023-24',
      '2022-23',
    ])
    // Year-end snapshot date drives the rankings fetch for each year.
    expect(mockedRankings).toHaveBeenCalledWith('2024-06-30')
    expect(mockedRankings).toHaveBeenCalledWith('2023-06-30')
  })

  it('aggregates each year from its year-end rankings', async () => {
    mockedDates.mockResolvedValue({
      dates: ['2022-09-30', '2023-06-30'],
      count: 2,
      generatedAt: '2024-07-01T00:00:00Z',
    })
    mockedRankings.mockImplementation(d => Promise.resolve(rankingsData(d)))

    const { result } = renderHook(() => useProgramYearSummaries(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const s = result.current.summaries[0]!
    expect(s.totalDistricts).toBe(3)
    expect(s.totalPaidClubs).toBe(150)
    expect(s.topDistricts.map(d => d.overallRank)).toEqual([1, 2, 3])
  })

  it('excludes the current, incomplete program year', async () => {
    const current = getCurrentProgramYear()
    // A snapshot inside the current PY (Sept of its start year) — not yet frozen.
    mockedDates.mockResolvedValue({
      dates: [`${current.year}-09-30`, '2023-06-30'],
      count: 2,
      generatedAt: `${current.year}-09-30T00:00:00Z`,
    })
    mockedRankings.mockImplementation(d => Promise.resolve(rankingsData(d)))

    const { result } = renderHook(() => useProgramYearSummaries(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const labels = result.current.summaries.map(s => s.label)
    expect(labels).toContain('2022-23')
    expect(labels).not.toContain(
      `${current.year}-${String((current.year + 1) % 100).padStart(2, '0')}`
    )
  })

  it('drops a year whose year-end file fell back to current rankings', async () => {
    // cdn.ts silently returns CURRENT v1/rankings.json when a per-date file
    // 404s — that must never render current standings on a past "final" card.
    mockedDates.mockResolvedValue({
      dates: ['2022-09-30', '2023-06-30', '2023-09-30', '2024-06-30'],
      count: 4,
      generatedAt: '2024-07-01T00:00:00Z',
    })
    mockedRankings.mockImplementation(d =>
      // Simulate the fallback for 2022-23: returns data dated in 2025-26.
      Promise.resolve(rankingsData(d === '2023-06-30' ? '2026-05-28' : d))
    )

    const { result } = renderHook(() => useProgramYearSummaries(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // 2022-23 dropped (stale current data); 2023-24 kept.
    expect(result.current.summaries.map(s => s.label)).toEqual(['2023-24'])
  })

  it('surfaces an error when the dates index fetch fails', async () => {
    mockedDates.mockRejectedValue(new Error('CDN down'))

    const { result } = renderHook(() => useProgramYearSummaries(), { wrapper })
    // Query-level retry (×2 with backoff) delays the error by ~3s.
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(result.current.summaries).toEqual([])
  })
})
