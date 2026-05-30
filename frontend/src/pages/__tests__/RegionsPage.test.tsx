import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegionsPage from '../RegionsPage'

/* Reads the live URL search string so URL-sync round-trips are assertable
   (#979 — region deep link). */
const LocationProbe = () => {
  const { search } = useLocation()
  return <div data-testid="loc-search">{search}</div>
}

/* Sprint C test suite (#496, #492). Red-first per Lesson 54. */

afterEach(() => cleanup())

// vi.mock is hoisted; inline the fixtures so they don't reference
// the outer-scope mkRanking before initialization.
vi.mock('../../services/cdn', () => {
  const baseRanking = (
    region: string,
    districtId: string,
    aggregateScore: number
  ) => ({
    districtId,
    districtName: `District ${districtId}`,
    region,
    paidClubs: 50,
    paidClubBase: 48,
    clubGrowthPercent: 4,
    totalPayments: 2000,
    paymentBase: 1900,
    paymentGrowthPercent: 5,
    activeClubs: 50,
    distinguishedClubs: 20,
    selectDistinguished: 5,
    presidentsDistinguished: 3,
    distinguishedPercent: 40,
    clubsRank: 1,
    paymentsRank: 1,
    distinguishedRank: 1,
    overallRank: 1,
    aggregateScore,
    smedleyDistinguished: 2,
    dspSubmitted: true,
    trainingMet: true,
    marketAnalysisSubmitted: true,
    communicationPlanSubmitted: true,
    regionAdvisorVisitMet: true,
    clubsWith20PlusMembers: 10,
    newCharteredClubs: 1,
    newPayments: 100,
    aprilPayments: 200,
    octoberPayments: 300,
    latePayments: 0,
    charterPayments: 0,
  })
  return {
    fetchCdnRankings: vi.fn().mockResolvedValue({
      date: '2026-05-12',
      rankings: [
        baseRanking('01', '01', 500),
        baseRanking('01', '02', 400),
        baseRanking('07', '57', 350),
        baseRanking('07', '60', 300),
        baseRanking('DNAR', '99', 50),
      ],
    }),
  }
})

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/regions']}>
        <Routes>
          <Route path="/regions" element={<RegionsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const renderPageAt = (url: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <LocationProbe />
        <Routes>
          <Route path="/regions" element={<RegionsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RegionsPage (#496)', () => {
  it('renders the page header with eyebrow + h1 "Regions"', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', { level: 1, name: /^regions$/i })
    ).toBeInTheDocument()
  })

  it('renders the leaderboard table as the primary view, not a card grid (#964)', async () => {
    renderPage()
    // The leaderboard table is the loaded marker now that the card grid is
    // gone (#964 reverses the CC-9 cards-only decision).
    const table = await screen.findByRole('table', {
      name: /region rankings/i,
    })
    expect(table).toBeInTheDocument()
    // Region rows link out to each region detail page.
    expect(screen.getByRole('link', { name: /^region 01/i })).toHaveAttribute(
      'href',
      '/region/01'
    )
    expect(screen.getByRole('link', { name: /^region 07/i })).toHaveAttribute(
      'href',
      '/region/07'
    )
  })

  it('excludes DNAR districts from the table', async () => {
    renderPage()
    await screen.findByRole('link', { name: /^region 01/i })
    // DNAR (region "DNAR") must not appear
    expect(screen.queryByText(/Region DNAR/)).not.toBeInTheDocument()
  })

  it('shows a DNAR footnote when DNAR districts exist in the data', async () => {
    renderPage()
    await screen.findByRole('link', { name: /^region 01/i })
    // 1 DNAR district in the fixture → footnote should appear
    expect(
      screen.getByText(/1 district.*not.*assigned to a region/i)
    ).toBeInTheDocument()
  })

  it('renders a "Find a region" filter bar with the available regions (#685)', async () => {
    renderPage()
    await screen.findByRole('link', { name: /^region 01/i })
    const group = screen.getByRole('group', { name: /find a region/i })
    expect(group).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /all regions/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^region 01$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^region 07$/i })
    ).toBeInTheDocument()
  })

  it('isolates a single region in the table when selected (#685)', async () => {
    renderPage()
    await screen.findByRole('link', { name: /^region 01/i })
    // Both regions visible initially (table rows).
    expect(screen.getAllByText(/Region 01/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Region 07/).length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: /^region 07$/i }))

    // Region 01 content is filtered out; Region 07 remains.
    expect(screen.queryByText(/Region 01/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/Region 07/).length).toBeGreaterThan(0)
  })

  it('restores all regions when "All regions" is clicked (#685)', async () => {
    renderPage()
    await screen.findByRole('link', { name: /^region 01/i })
    await userEvent.click(screen.getByRole('button', { name: /^region 07$/i }))
    expect(screen.queryByText(/Region 01/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /all regions/i }))
    expect(screen.getAllByText(/Region 01/).length).toBeGreaterThan(0)
  })

  describe('deep-link region selection (#979)', () => {
    it('isolates the region named in ?region= on load', async () => {
      renderPageAt('/regions?region=07')
      await screen.findByRole('link', { name: /^region 07/i })
      // Region 07 is pre-selected from the URL; Region 01 is filtered out.
      expect(
        screen.getByRole('button', { name: /^region 07$/i })
      ).toHaveAttribute('aria-pressed', 'true')
      expect(screen.queryByText(/Region 01/)).not.toBeInTheDocument()
    })

    it('writes ?region= to the URL when a region is selected', async () => {
      renderPageAt('/regions')
      await screen.findByRole('link', { name: /^region 01/i })

      await userEvent.click(
        screen.getByRole('button', { name: /^region 07$/i })
      )
      await waitFor(() =>
        expect(screen.getByTestId('loc-search').textContent).toContain(
          'region=07'
        )
      )
    })

    it('clears ?region= when "All regions" is reselected', async () => {
      renderPageAt('/regions?region=07')
      await screen.findByRole('link', { name: /^region 07/i })

      await userEvent.click(
        screen.getByRole('button', { name: /all regions/i })
      )
      await waitFor(() =>
        expect(screen.getByTestId('loc-search').textContent).not.toContain(
          'region='
        )
      )
    })

    it('self-heals an unknown ?region= to All (page-level validation, Lesson 124)', async () => {
      renderPageAt('/regions?region=99')
      await screen.findByRole('link', { name: /^region 01/i })
      // 99 is not a real region id, so the table shows everything and "All
      // regions" is the effective selection — never a stranded empty table.
      expect(
        screen.getByRole('button', { name: /all regions/i })
      ).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getAllByText(/Region 01/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Region 07/).length).toBeGreaterThan(0)
    })
  })
})
