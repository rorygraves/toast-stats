import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegionPage from '../RegionPage'
import { fetchCdnRankings } from '../../services/cdn'

vi.mock('../../services/cdn', () => ({
  fetchCdnRankings: vi.fn(),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

const mkRanking = (overrides: Record<string, unknown>) => ({
  districtId: '1',
  districtName: '1',
  region: '1',
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
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
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

describe('RegionPage KPI strip — base / current / Δ / ±% (#514 #513)', () => {
  it('shows current totals (existing behaviour)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '60',
          region: '2',
          paidClubs: 150,
          paidClubBase: 140,
          totalPayments: 6000,
          paymentBase: 5500,
          distinguishedClubs: 50,
        }),
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 200,
          paidClubBase: 190,
          totalPayments: 8000,
          paymentBase: 7000,
          distinguishedClubs: 70,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    // Paid Clubs card shows current total 350 = 150 + 200.
    const paidClubsCard = await screen.findByLabelText(/paid clubs kpi/i)
    expect(within(paidClubsCard).getByText('350')).toBeInTheDocument()
  })

  it('shows base, delta and ±% for Paid Clubs and Payments', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '60',
          region: '2',
          paidClubs: 150,
          paidClubBase: 140,
          totalPayments: 6000,
          paymentBase: 5500,
          distinguishedClubs: 50,
        }),
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 200,
          paidClubBase: 190,
          totalPayments: 8000,
          paymentBase: 7000,
          distinguishedClubs: 70,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    // Paid Clubs: base 330, current 350, Δ +20, +6.1%
    const paidCard = await screen.findByLabelText(/paid clubs kpi/i)
    expect(within(paidCard).getByTestId('kpi-base').textContent).toContain(
      '330'
    )
    expect(within(paidCard).getByTestId('kpi-delta').textContent).toContain(
      '+20'
    )
    expect(within(paidCard).getByTestId('kpi-percent').textContent).toMatch(
      /\+6\.1%/
    )

    // Payments: base 12500, current 14000, Δ +1500, +12.0%
    const paymentsCard = screen.getByLabelText(/payments kpi/i)
    expect(within(paymentsCard).getByTestId('kpi-base').textContent).toContain(
      '12,500'
    )
    expect(within(paymentsCard).getByTestId('kpi-delta').textContent).toContain(
      '+1,500'
    )
    expect(within(paymentsCard).getByTestId('kpi-percent').textContent).toMatch(
      /\+12\.0%/
    )
  })

  it('treats Distinguished Clubs as year-cumulative — base 0, delta = current', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          distinguishedClubs: 48,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    const card = await screen.findByLabelText(/distinguished clubs kpi/i)
    expect(within(card).getByTestId('kpi-base').textContent).toContain('0')
    expect(within(card).getByTestId('kpi-delta').textContent).toContain('+48')
  })

  it('renders negative deltas in red (Δ < 0)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 130,
          paidClubBase: 140,
          totalPayments: 5000,
          paymentBase: 5500,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    const paidCard = await screen.findByLabelText(/paid clubs kpi/i)
    const delta = within(paidCard).getByTestId('kpi-delta')
    expect(delta.textContent).toContain('-10')
    expect(delta).toHaveClass('text-tm-true-maroon')
  })
})

describe('RegionPage rank-within-region column (#515 #513)', () => {
  it('renders a "Region Rank" column header on the district table', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({ districtId: '1', region: '1', aggregateScore: 300 }),
      ],
      date: '2026-05-12',
    })
    renderRegion('1')
    expect(
      await screen.findByRole('columnheader', { name: /region rank/i })
    ).toBeInTheDocument()
  })

  it('ranks districts within the region by aggregateScore descending', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '60',
          region: '2',
          aggregateScore: 100,
          overallRank: 50,
        }),
        mkRanking({
          districtId: '61',
          region: '2',
          aggregateScore: 300,
          overallRank: 10,
        }),
        mkRanking({
          districtId: '31',
          region: '2',
          aggregateScore: 200,
          overallRank: 30,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    const rows = await screen.findAllByRole('row')
    // skip header row at index 0
    const rank1 = within(rows[1]!).getByTestId('region-rank-cell')
    const rank2 = within(rows[2]!).getByTestId('region-rank-cell')
    const rank3 = within(rows[3]!).getByTestId('region-rank-cell')
    expect(rank1.textContent).toContain('#1')
    expect(rank2.textContent).toContain('#2')
    expect(rank3.textContent).toContain('#3')
    // D61 (score 300) ranks #1 within region 2.
    expect(within(rows[1]!).getByText(/D61/)).toBeInTheDocument()
  })

  it('marks tied region ranks (same aggregateScore) as tied', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '7',
          region: '3',
          aggregateScore: 250,
          overallRank: 20,
        }),
        mkRanking({
          districtId: '8',
          region: '3',
          aggregateScore: 250,
          overallRank: 21,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('3')

    const rows = await screen.findAllByRole('row')
    expect(
      within(rows[1]!).getByTestId('region-rank-cell').textContent
    ).toMatch(/#1.*tied/i)
    expect(
      within(rows[2]!).getByTestId('region-rank-cell').textContent
    ).toMatch(/#1.*tied/i)
  })
})
