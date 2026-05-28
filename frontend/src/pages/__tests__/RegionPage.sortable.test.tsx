/**
 * @vitest-environment jsdom
 *
 * Sprint 851 — click-any-column-to-sort on the RegionPage district table.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'
import RegionPage from '../RegionPage'
import {
  fetchCdnRankings,
  fetchCdnCompetitiveAwards,
} from '../../services/cdn'

vi.mock('../../services/cdn', () => ({
  fetchCdnRankings: vi.fn(),
  fetchCdnCompetitiveAwards: vi.fn().mockResolvedValue(null),
  fetchCdnManifest: vi
    .fn()
    .mockResolvedValue({ latestSnapshotDate: '2026-05-12', generatedAt: 'x' }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

const mk = (overrides: Record<string, unknown>) => ({
  districtId: '1',
  districtName: '1',
  region: '1',
  paidClubs: 100,
  paidClubBase: 90,
  totalPayments: 5000,
  paymentBase: 4500,
  distinguishedClubs: 50,
  aggregateScore: 300,
  overallRank: 1,
  clubGrowthPercent: 10,
  paymentGrowthPercent: 10,
  activeClubs: 100,
  selectDistinguished: 20,
  presidentsDistinguished: 10,
  distinguishedPercent: 50,
  clubsRank: 1,
  paymentsRank: 1,
  distinguishedRank: 1,
  ...overrides,
})

// Three districts in region 1 with distinct values per metric.
const rankings = [
  mk({
    districtId: '86',
    districtName: 'D86',
    aggregateScore: 300,
    paidClubs: 50,
    totalPayments: 9000,
    distinguishedClubs: 30,
    overallRank: 1,
  }),
  mk({
    districtId: '74',
    districtName: 'D74',
    aggregateScore: 200,
    paidClubs: 90,
    totalPayments: 5000,
    distinguishedClubs: 20,
    overallRank: 5,
  }),
  mk({
    districtId: '60',
    districtName: 'D60',
    aggregateScore: 100,
    paidClubs: 70,
    totalPayments: 4000,
    distinguishedClubs: 10,
    overallRank: 9,
  }),
]

const renderRegion = (region: string, initialPath?: string) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const path = initialPath ?? `/region/${region}`
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/region/:n" element={<RegionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const getRowOrder = (): string[] => {
  const rows = document.querySelectorAll(
    '.districts-rankings-table tbody tr'
  )
  return Array.from(rows).map(r => {
    const id = r
      .querySelector('[data-testid="region-district-cell"]')
      ?.textContent?.match(/D(\d+)/)?.[1]
    return id ?? ''
  })
}

describe('RegionPage — click-header sort (#851)', () => {
  beforeEach(() => {
    mockedFetchCdnRankings.mockResolvedValue({
      rankings,
      date: '2025-11-22',
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('default sort: by aggregateScore descending', async () => {
    renderRegion('1')
    await screen.findAllByTestId('region-district-cell')
    expect(getRowOrder()).toEqual(['86', '74', '60'])
  })

  it('clicking Paid Clubs header sorts by paidClubs ascending', async () => {
    renderRegion('1')
    await screen.findAllByTestId('region-district-cell')

    fireEvent.click(
      screen.getByRole('button', { name: /Sort by Paid Clubs/i })
    )
    await waitFor(() => {
      // D86=50, D60=70, D74=90 → asc
      expect(getRowOrder()).toEqual(['86', '60', '74'])
    })
  })

  it('clicking the same header again flips to descending', async () => {
    renderRegion('1')
    await screen.findAllByTestId('region-district-cell')

    const btn = screen.getByRole('button', { name: /Sort by Paid Clubs/i })
    fireEvent.click(btn) // asc
    fireEvent.click(btn) // desc

    await waitFor(() => {
      expect(getRowOrder()).toEqual(['74', '60', '86'])
    })
  })

  it('reads initial sort from the URL', async () => {
    renderRegion('1', '/region/1?sort=payments&dir=asc')
    await screen.findAllByTestId('region-district-cell')
    await waitFor(() => {
      // D60=4000, D74=5000, D86=9000 → asc
      expect(getRowOrder()).toEqual(['60', '74', '86'])
    })
  })

  it('exposes a sortable World Rank header', async () => {
    renderRegion('1')
    await screen.findAllByTestId('region-district-cell')
    expect(
      screen.getByRole('button', { name: /Sort by World Rank/i })
    ).toBeInTheDocument()
  })
})
