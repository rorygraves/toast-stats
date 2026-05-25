/**
 * RegionPage responsive scroll-region (#689, epic #683 Sprint 6).
 *
 * The region detail table is 19 columns — far wider than a phone. The UX
 * decision (ron-ux) is an INTENTIONAL, DOCUMENTED horizontal scroll, not a
 * card-collapse: a regional ranking table exists to compare districts across
 * rows, which a stacked card destroys. To stop the scroll being a "trap" the
 * scroll container must be (a) keyboard-operable — a focusable, labelled
 * region (WCAG 2.1.1, the axe "scrollable-region-focusable" rule) — and the
 * row-identity columns (Region Rank + District) must stick to the left so the
 * row stays labelled while the metric columns scroll out of view.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegionPage from '../RegionPage'
import { fetchCdnRankings } from '../../services/cdn'

vi.mock('../../services/cdn', () => ({
  fetchCdnRankings: vi.fn(),
  fetchCdnCompetitiveAwards: vi.fn().mockResolvedValue(null),
  fetchCdnManifest: vi
    .fn()
    .mockResolvedValue({ latestSnapshotDate: '2026-05-12', generatedAt: 'x' }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

const mkRanking = (overrides: Record<string, unknown>) => ({
  districtId: '1',
  districtName: '1',
  region: '7',
  paidClubs: 100,
  totalPayments: 5000,
  distinguishedClubs: 50,
  aggregateScore: 300,
  overallRank: 1,
  paidClubBase: 90,
  paymentBase: 4500,
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

const renderRegion = (region: string) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/region/${region}`]}>
        <Routes>
          <Route path="/region/:n" element={<RegionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('RegionPage responsive scroll region (#689)', () => {
  it('wraps the rankings table in a focusable, labelled scroll region', async () => {
    mockedFetchCdnRankings.mockResolvedValue({
      rankings: [mkRanking({ districtId: '7', districtName: 'Seven' })],
      date: '2026-05-12',
    } as never)

    renderRegion('7')

    // role=region + accessible name + tabindex=0 = a keyboard-scrollable
    // region (axe scrollable-region-focusable). Match by the scroll affordance
    // accessible name so we assert the right element, not the page landmark.
    const scroller = await screen.findByRole('region', {
      name: /scroll/i,
    })
    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller.className).toMatch(/overflow-x-auto/)
  })

  it('sticks the Region Rank and District identity columns to the left', async () => {
    mockedFetchCdnRankings.mockResolvedValue({
      rankings: [mkRanking({ districtId: '7', districtName: 'Seven' })],
      date: '2026-05-12',
    } as never)

    renderRegion('7')

    const rankCell = await screen.findByTestId('region-rank-cell')
    const districtCell = await screen.findByTestId('region-district-cell')
    expect(rankCell.className).toMatch(/region-rankings__sticky-col/)
    expect(districtCell.className).toMatch(/region-rankings__sticky-col/)
  })
})
