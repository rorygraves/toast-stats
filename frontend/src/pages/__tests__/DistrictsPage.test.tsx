import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import DistrictsPage from '../DistrictsPage'
import { fetchCdnRankings } from '../../services/cdn'
import { renderWithProviders } from '../../__tests__/test-utils'

// Mock CDN service — all data now comes from CDN (#173)
vi.mock('../../services/cdn', () => ({
  fetchCdnDates: vi.fn().mockResolvedValue({
    dates: [],
    count: 0,
    generatedAt: '2025-01-01T00:00:00Z',
  }),
  fetchCdnSnapshotIndex: vi.fn().mockResolvedValue({}),
  fetchCdnRankings: vi.fn(),
  fetchCdnManifest: vi.fn().mockResolvedValue({
    latestSnapshotDate: '2025-11-22',
    generatedAt: '2025-01-01T00:00:00Z',
  }),
  cdnAnalyticsUrl: vi.fn().mockReturnValue('https://cdn.taverns.red/test'),
  fetchFromCdn: vi.fn(),
}))

// Mock useDistricts to prevent CDN consumption
vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: () => ({
    data: { districts: [] },
    isLoading: false,
    isError: false,
  }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

// renderWithProviders is provided by test-utils to include ProgramYearProvider and common wrappers

describe('DistrictsPage - Percentage Formatting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatPercentage function', () => {
    it('should return "+" prefix and green color for positive percentages', async () => {
      // Rankings query (dates now come from CDN mock)
      mockedFetchCdnRankings.mockResolvedValueOnce({
        rankings: [
          {
            districtId: 'D1',
            districtName: 'District 1',
            region: '1',
            paidClubs: 100,
            paidClubBase: 90,
            clubGrowthPercent: 12.5,
            totalPayments: 5000,
            paymentBase: 4500,
            paymentGrowthPercent: 11.1,
            activeClubs: 100,
            distinguishedClubs: 50,
            selectDistinguished: 20,
            presidentsDistinguished: 10,
            distinguishedPercent: 50,
            clubsRank: 1,
            paymentsRank: 1,
            distinguishedRank: 1,
            aggregateScore: 300,
          },
        ],
        date: '2025-11-22',
      })

      renderWithProviders(<DistrictsPage />)

      // Wait for data to load and check for positive percentage with + prefix
      const element = await screen.findByText('+12.5%')
      expect(element).toBeInTheDocument()
      expect(element).toHaveClass('text-green-600')
    })

    it('should return "-" prefix and red color for negative percentages', async () => {
      mockedFetchCdnRankings.mockResolvedValueOnce({
        rankings: [
          {
            districtId: 'D1',
            districtName: 'District 1',
            region: '1',
            paidClubs: 80,
            paidClubBase: 90,
            clubGrowthPercent: -11.1,
            totalPayments: 4000,
            paymentBase: 4500,
            paymentGrowthPercent: -8.5,
            activeClubs: 80,
            distinguishedClubs: 40,
            selectDistinguished: 15,
            presidentsDistinguished: 5,
            distinguishedPercent: 50,
            clubsRank: 1,
            paymentsRank: 1,
            distinguishedRank: 1,
            aggregateScore: 300,
          },
        ],
        date: '2025-11-22',
      })

      renderWithProviders(<DistrictsPage />)

      // Wait for data to load and check for negative percentage
      const element = await screen.findByText('-11.1%')
      expect(element).toBeInTheDocument()
      expect(element).toHaveClass('text-red-600')
    })

    it('should return "0.0%" with gray color for zero percentages', async () => {
      mockedFetchCdnRankings.mockResolvedValueOnce({
        rankings: [
          {
            districtId: 'D1',
            districtName: 'District 1',
            region: '1',
            paidClubs: 90,
            paidClubBase: 90,
            clubGrowthPercent: 0,
            totalPayments: 4500,
            paymentBase: 4500,
            paymentGrowthPercent: 1.5,
            activeClubs: 90,
            distinguishedClubs: 45,
            selectDistinguished: 15,
            presidentsDistinguished: 5,
            distinguishedPercent: 50,
            clubsRank: 1,
            paymentsRank: 1,
            distinguishedRank: 1,
            aggregateScore: 300,
          },
        ],
        date: '2025-11-22',
      })

      renderWithProviders(<DistrictsPage />)

      // Wait for data to load and check for zero percentage
      const element = await screen.findByText('0.0%')
      expect(element).toBeInTheDocument()
      expect(element).toHaveClass('text-gray-600')
    })

    it('should format percentages to 1 decimal place precision', async () => {
      mockedFetchCdnRankings.mockResolvedValueOnce({
        rankings: [
          {
            districtId: 'D1',
            districtName: 'District 1',
            region: '1',
            paidClubs: 100,
            paidClubBase: 90,
            clubGrowthPercent: 12.567,
            totalPayments: 5000,
            paymentBase: 4500,
            paymentGrowthPercent: 8.333,
            activeClubs: 100,
            distinguishedClubs: 50,
            selectDistinguished: 20,
            presidentsDistinguished: 10,
            distinguishedPercent: 50,
            clubsRank: 1,
            paymentsRank: 1,
            distinguishedRank: 1,
            aggregateScore: 300,
          },
        ],
        date: '2025-11-22',
      })

      renderWithProviders(<DistrictsPage />)

      // Wait for data to load and check for 1 decimal place formatting
      const element1 = await screen.findByText('+12.6%')
      const element2 = await screen.findByText('+8.3%')
      expect(element1).toBeInTheDocument()
      expect(element2).toBeInTheDocument()
    })
  })
})

describe('DistrictsPage - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display welcome message and backfill button when no snapshots are available', async () => {
    // Mock CDN rankings fetch returning 404 (no v1/rankings.json yet)
    mockedFetchCdnRankings.mockRejectedValueOnce(
      new Error('CDN rankings fetch failed: 404')
    )

    renderWithProviders(<DistrictsPage />)

    // Wait for error state to render
    const welcomeHeading = await screen.findByText('Welcome to Toast-Stats!')
    expect(welcomeHeading).toBeInTheDocument()

    // Check for guidance message
    expect(
      screen.getByText(
        "No data snapshots are available yet. To get started, you'll need to fetch data from the Toastmasters dashboard."
      )
    ).toBeInTheDocument()

    // Check for "Check Again" button (now the primary action)
    expect(screen.getByText('Check Again')).toBeInTheDocument()

    // Check for setup instructions
    expect(screen.getByText('What happens next:')).toBeInTheDocument()
    expect(
      screen.getByText(/The data pipeline will automatically collect data/)
    ).toBeInTheDocument()
  })

  it('should display generic error message for other types of errors', async () => {
    // Mock rankings call to return a different error (dates come from CDN)
    const mockError = new Error('Something went wrong')
    mockedFetchCdnRankings.mockRejectedValueOnce(mockError)

    renderWithProviders(<DistrictsPage />)

    // Wait for error state to render
    const errorHeading = await screen.findByText('Error Loading Rankings')
    expect(errorHeading).toBeInTheDocument()

    // Check for generic error message
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Check for "Try Again" button
    expect(screen.getByText('Try Again')).toBeInTheDocument()

    // Should NOT show the welcome message
    expect(
      screen.queryByText('Welcome to Toast-Stats!')
    ).not.toBeInTheDocument()
  })

  // #826 — Both isError branches must use the SAME outer geometry as the
  // loaded page (.districts-page-root > .districts-page). The legacy
  // wrapper (.container mx-auto px-4 py-8) re-introduced #488's CLS
  // geometry swap whenever the CDN flaked into error (Lesson 125 / #811
  // discovery, intermittent ~0.198 on PR #825).
  it('should wrap the no-snapshot welcome state in stable .districts-page geometry', async () => {
    mockedFetchCdnRankings.mockRejectedValueOnce(
      new Error('CDN rankings fetch failed: 404')
    )

    const { container } = renderWithProviders(<DistrictsPage />)

    const welcomeHeading = await screen.findByText('Welcome to Toast-Stats!')
    expect(welcomeHeading.closest('.districts-page')).not.toBeNull()
    expect(
      container.querySelector('.districts-page-root .districts-page')
    ).not.toBeNull()
  })

  it('should wrap the generic error state in stable .districts-page geometry', async () => {
    mockedFetchCdnRankings.mockRejectedValueOnce(
      new Error('Something went wrong')
    )

    const { container } = renderWithProviders(<DistrictsPage />)

    const errorHeading = await screen.findByText('Error Loading Rankings')
    expect(errorHeading.closest('.districts-page')).not.toBeNull()
    expect(
      container.querySelector('.districts-page-root .districts-page')
    ).not.toBeNull()
  })
})

describe('DistrictsPage - Table Cell Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display rank number correctly', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        {
          districtId: 'D1',
          districtName: 'District 1',
          region: '1',
          paidClubs: 100,
          paidClubBase: 90,
          clubGrowthPercent: 12.5,
          totalPayments: 5000,
          paymentBase: 4500,
          paymentGrowthPercent: 11.1,
          activeClubs: 100,
          distinguishedClubs: 50,
          selectDistinguished: 20,
          presidentsDistinguished: 10,
          distinguishedPercent: 50,
          clubsRank: 5,
          paymentsRank: 3,
          distinguishedRank: 1,
          aggregateScore: 300,
        },
      ],
      date: '2025-11-22',
    })

    renderWithProviders(<DistrictsPage />)

    // Wait for data to load and check for rank numbers.
    // Per #546 the "Rank " word prefix is dropped — the per-metric
    // cells now show just "#N · +X.X%".
    const clubsRank = await screen.findByText('#5')
    const paymentsRank = await screen.findByText('#3')
    expect(clubsRank).toBeInTheDocument()
    expect(clubsRank).toHaveClass('text-tm-loyal-blue')
    expect(paymentsRank).toBeInTheDocument()
    expect(paymentsRank).toHaveClass('text-tm-loyal-blue')
  })

  it('should display percentage with correct color', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        {
          districtId: 'D1',
          districtName: 'District 1',
          region: '1',
          paidClubs: 100,
          paidClubBase: 90,
          clubGrowthPercent: 15.5,
          totalPayments: 4000,
          paymentBase: 4500,
          paymentGrowthPercent: -11.1,
          activeClubs: 100,
          distinguishedClubs: 50,
          selectDistinguished: 20,
          presidentsDistinguished: 10,
          distinguishedPercent: 50,
          clubsRank: 1,
          paymentsRank: 1,
          distinguishedRank: 1,
          aggregateScore: 300,
        },
      ],
      date: '2025-11-22',
    })

    renderWithProviders(<DistrictsPage />)

    // Wait for data to load and check for percentage colors
    const positivePercent = await screen.findByText('+15.5%')
    const negativePercent = await screen.findByText('-11.1%')
    expect(positivePercent).toBeInTheDocument()
    expect(positivePercent).toHaveClass('text-green-600')
    expect(negativePercent).toBeInTheDocument()
    expect(negativePercent).toHaveClass('text-red-600')
  })

  it('should display bullet separator between rank and percentage', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        {
          districtId: 'D1',
          districtName: 'District 1',
          region: '1',
          paidClubs: 100,
          paidClubBase: 90,
          clubGrowthPercent: 12.5,
          totalPayments: 5000,
          paymentBase: 4500,
          paymentGrowthPercent: 11.1,
          activeClubs: 100,
          distinguishedClubs: 50,
          selectDistinguished: 20,
          presidentsDistinguished: 10,
          distinguishedPercent: 50,
          clubsRank: 1,
          paymentsRank: 1,
          distinguishedRank: 1,
          aggregateScore: 300,
        },
      ],
      date: '2025-11-22',
    })

    renderWithProviders(<DistrictsPage />)

    // Wait for data to load and check for bullet separators
    await screen.findByText('District 1')
    const bullets = screen.getAllByText('•')
    // Should have 2 bullets (one for paid clubs, one for total payments)
    expect(bullets.length).toBeGreaterThanOrEqual(2)
    bullets.forEach(bullet => {
      expect(bullet).toHaveClass('text-gray-400')
    })
  })

  it('should display both rank and percentage values visible and properly aligned', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        {
          districtId: 'D1',
          districtName: 'District 1',
          region: '1',
          paidClubs: 100,
          paidClubBase: 90,
          clubGrowthPercent: 12.5,
          totalPayments: 5000,
          paymentBase: 4500,
          paymentGrowthPercent: 11.1,
          activeClubs: 100,
          distinguishedClubs: 50,
          selectDistinguished: 20,
          presidentsDistinguished: 10,
          distinguishedPercent: 50,
          clubsRank: 5,
          paymentsRank: 3,
          distinguishedRank: 1,
          aggregateScore: 300,
        },
      ],
      date: '2025-11-22',
    })

    const { container } = renderWithProviders(<DistrictsPage />)

    // Wait for data to load and verify all elements are present
    await screen.findByText('District 1')

    // Scope to the rankings table — the KPI strip from #356 also renders
    // these same numbers as global totals.
    const table = within(container.querySelector('table')!)

    // Check paid clubs column. Per #546 the "Rank " word prefix is
    // dropped — per-metric cells show just "#N · +X.X%".
    expect(table.getByText('100')).toBeInTheDocument()
    expect(table.getByText('#5')).toBeInTheDocument()
    expect(table.getByText('+12.5%')).toBeInTheDocument()

    // Check total payments column
    expect(table.getByText('5,000')).toBeInTheDocument()
    expect(table.getByText('#3')).toBeInTheDocument()
    expect(table.getByText('+11.1%')).toBeInTheDocument()

    // Verify the rank elements exist and are styled correctly.
    const rankElements = screen.getAllByText(/^#\d+$/)
    expect(rankElements.length).toBeGreaterThan(0)
    rankElements.forEach(rankElement => {
      expect(rankElement).toHaveClass('text-tm-loyal-blue')
    })
  })
})

describe('DistrictsPage - Layout Order (#83)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to set up a standard data render
  const setupWithData = () => {
    // Rankings query (dates come from CDN mock)
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        {
          districtId: 'D1',
          districtName: 'District 1',
          region: '1',
          paidClubs: 100,
          paidClubBase: 90,
          clubGrowthPercent: 12.5,
          totalPayments: 5000,
          paymentBase: 4500,
          paymentGrowthPercent: 11.1,
          activeClubs: 100,
          distinguishedClubs: 50,
          selectDistinguished: 20,
          presidentsDistinguished: 10,
          distinguishedPercent: 50,
          clubsRank: 1,
          paymentsRank: 1,
          distinguishedRank: 1,
          aggregateScore: 300,
        },
      ],
      date: '2025-11-22',
    })
  }

  it('should render the rankings table before Historical Rank Progression in DOM order', async () => {
    setupWithData()

    const { container } = renderWithProviders(<DistrictsPage />)

    // Wait for data
    await screen.findByText('District 1')

    // Rankings table should exist
    const table = container.querySelector('table')
    expect(table).toBeInTheDocument()

    // Find the Historical Rank Progression <details> by its summary text
    const allDetails = container.querySelectorAll('details')
    const historyDetails = Array.from(allDetails).find(d =>
      d
        .querySelector('summary')
        ?.textContent?.match(/Historical Rank Progression/i)
    )
    expect(historyDetails).toBeDefined()

    // Table should appear before the history details in DOM order.
    // (#main-content moved up to AppShell in #354 — query the page root.)
    const allElements = container.querySelectorAll('table, details')
    const elements = Array.from(allElements)
    const tableIndex = elements.findIndex(el => el.tagName === 'TABLE')
    const historyIndex = elements.indexOf(historyDetails!)
    expect(tableIndex).toBeLessThan(historyIndex)
  })

  it('should render Historical Rank Progression inside a collapsed <details> element', async () => {
    setupWithData()

    const { container } = renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 1')

    // Find the Historical Rank Progression <details> specifically
    const allDetails = container.querySelectorAll('details')
    const historyDetails = Array.from(allDetails).find(d =>
      d
        .querySelector('summary')
        ?.textContent?.match(/Historical Rank Progression/i)
    )
    expect(historyDetails).toBeDefined()
    expect(historyDetails).not.toHaveAttribute('open')

    // Summary should mention Historical Rank Progression
    const summary = historyDetails!.querySelector('summary')
    expect(summary).toBeInTheDocument()
    expect(summary!.textContent).toMatch(/Historical Rank Progression/i)
  })

  // #875 (epic #876 Sprint 2, CC-3): below 768px the multi-series rank chart
  // collapses to a sparkline-then-expand wrapper. setup.ts's matchMedia mock is
  // writable; flip only the max-width query to mobile, restore in finally.
  it('collapses Historical Rank Progression behind an expand trigger at <768px (#875)', async () => {
    const original = window.matchMedia
    ;(window.matchMedia as unknown as ReturnType<typeof vi.fn>) = vi
      .fn()
      .mockImplementation((query: string) => ({
        matches: /max-width/.test(query),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    try {
      setupWithData()
      const { container } = renderWithProviders(<DistrictsPage />)
      await screen.findByText('District 1')
      const historyDetails = Array.from(
        container.querySelectorAll('details')
      ).find(d =>
        d
          .querySelector('summary')
          ?.textContent?.match(/Historical Rank Progression/i)
      )
      expect(historyDetails).toBeDefined()
      // The collapsed view renders a tap target instead of the chart itself.
      expect(
        within(historyDetails!).getByRole('button', {
          name: /expand historical rank progression chart/i,
        })
      ).toBeInTheDocument()
    } finally {
      window.matchMedia = original
    }
  })

  // #980 — the historical-rank region selection and its mobile disclosure now
  // deep-link via the URL, so a shared/reloaded link restores them.
  it('restores the historical region selection from ?historyRegions', async () => {
    setupWithData()
    renderWithProviders(<DistrictsPage />, {
      initialEntries: ['/?historyRegions=1'],
    })
    await screen.findByText('District 1')
    // Region "1" is pre-selected from the URL → the count reflects it.
    expect(screen.getByText(/Select Regions \(1 regions,/)).toBeInTheDocument()
    expect(screen.getByText(/from 1 selected region/i)).toBeInTheDocument()
  })

  it('restores the history region disclosure open state from ?historyExpanded', async () => {
    setupWithData()
    renderWithProviders(<DistrictsPage />, {
      initialEntries: ['/?historyExpanded=1'],
    })
    await screen.findByText('District 1')
    const selectRegionsButton = screen.getByRole('button', {
      name: /Select Regions \(/i,
    })
    expect(selectRegionsButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders the redesign h1 "District Rankings" (#356)', async () => {
    setupWithData()

    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 1')

    // The h1 was rewritten in #356 — old wording was "Toastmasters District
    // Rankings" with a text-2xl class; the redesign uses just "District
    // Rankings" with the .districts-page-header__title class (Montserrat
    // 800 / 28px). The chrome contract is asserted in detail by
    // DistrictsPage.redesign.test.tsx.
    const heading = screen.getByRole('heading', {
      level: 1,
      name: /^district rankings$/i,
    })
    expect(heading).toBeInTheDocument()
  })

  it('should render region filter as always-visible pill toggle bar (#326)', async () => {
    setupWithData()

    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 1')

    // "All" pill should be visible and active by default
    const allPill = screen.getByRole('button', { name: 'All' })
    expect(allPill).toBeInTheDocument()

    // Region pills should be visible (not hidden behind disclosure)
    const regionPills = screen.getAllByRole('button', {
      name: /^Region /i,
    })
    expect(regionPills.length).toBeGreaterThan(0)
  })
})

// ============================================================
// My District — sticky-pin to top of rankings (#417)
// ============================================================
describe('DistrictsPage - My District sticky pin (#417)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const setupTwoRows = () => {
    const baseRow = (
      i: number
    ): import('../../services/cdn').AllDistrictsRanking => ({
      districtId: `${i}`,
      districtName: `District ${i}`,
      region: '1',
      paidClubs: 100,
      paidClubBase: 90,
      clubGrowthPercent: 0,
      totalPayments: 5000,
      paymentBase: 4500,
      paymentGrowthPercent: 0,
      activeClubs: 100,
      distinguishedClubs: 50,
      selectDistinguished: 20,
      presidentsDistinguished: 10,
      distinguishedPercent: 50,
      clubsRank: i,
      paymentsRank: i,
      distinguishedRank: i,
      aggregateScore: 300 - i,
    })
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [baseRow(1), baseRow(2)],
      date: '2025-11-22',
    })
  }

  it('renders a my-district star button per row, defaulting to off', async () => {
    setupTwoRows()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 1')
    const stars = screen.getAllByRole('button', {
      name: /set district \d+ as my district/i,
    })
    expect(stars.length).toBe(2)
  })

  it('clicking the star sets the district as mine and pins it to the top', async () => {
    const { fireEvent } = await import('@testing-library/react')
    setupTwoRows()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 1')

    // District 2 starts below District 1 in rankings (rank 2 vs 1)
    const star2 = screen.getByRole('button', {
      name: /set district 2 as my district/i,
    })
    fireEvent.click(star2)

    // After click, District 2 should appear before District 1 in DOM order
    const rows = screen.getAllByRole('row')
    const dataRows = rows.slice(1) // skip header
    const firstDistrictText =
      dataRows[0]?.querySelector('td:first-child')?.textContent || ''
    expect(firstDistrictText).toMatch(/D2/)
  })

  it('persists the my-district choice to localStorage', async () => {
    const { fireEvent } = await import('@testing-library/react')
    setupTwoRows()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 1')

    const star1 = screen.getByRole('button', {
      name: /set district 1 as my district/i,
    })
    fireEvent.click(star1)

    // Wait a tick for the useEffect that writes to localStorage
    await new Promise(r => setTimeout(r, 0))
    expect(localStorage.getItem('toast-stats:v1:my-district-id')).toBe(
      JSON.stringify('1')
    )
  })
})

// ============================================================
// Rankings table — column order + click affordance (#436)
// ============================================================
describe('DistrictsPage - Rankings column order (#436)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const setupSingleRow = () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        {
          districtId: '61',
          districtName: 'District 61',
          region: '7',
          paidClubs: 100,
          paidClubBase: 90,
          clubGrowthPercent: 11.1,
          totalPayments: 5000,
          paymentBase: 4500,
          paymentGrowthPercent: 11.1,
          activeClubs: 100,
          distinguishedClubs: 50,
          selectDistinguished: 20,
          presidentsDistinguished: 10,
          distinguishedPercent: 50,
          clubsRank: 1,
          paymentsRank: 1,
          distinguishedRank: 1,
          aggregateScore: 300,
        },
      ],
      date: '2025-11-22',
    })
  }

  it('renders District as the leftmost column header (before Rank)', async () => {
    setupSingleRow()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 61')

    const headers = screen.getAllByRole('columnheader')
    const headerTexts = headers.map(h => h.textContent?.trim() ?? '')
    const districtIdx = headerTexts.findIndex(t => /^district$/i.test(t))
    const rankIdx = headerTexts.findIndex(t => /^rank$/i.test(t))
    expect(districtIdx).toBeGreaterThanOrEqual(0)
    expect(rankIdx).toBeGreaterThan(districtIdx)
  })

  it('renders the district number as a standalone visual chip (#436)', async () => {
    setupSingleRow()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 61')

    // The number "61" should appear as its own element (chip) — not just
    // inline within "District 61"
    const chip = screen.getByTestId('district-number-chip-D61')
    expect(chip).toBeInTheDocument()
    expect(chip.textContent).toMatch(/61/)
  })
})

// ============================================================
// Region filter — solo-select pattern (#434)
// ============================================================
describe('DistrictsPage - Region filter solo-select (#434)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Multi-region fixture — three districts in three different regions so we
  // can verify solo-isolation actually filters the table.
  const setupThreeRegions = () => {
    const baseRow = (
      i: number,
      region: string
    ): import('../../services/cdn').AllDistrictsRanking => ({
      districtId: `D${i}`,
      districtName: `District ${i}`,
      region,
      paidClubs: 100,
      paidClubBase: 90,
      clubGrowthPercent: 0,
      totalPayments: 5000,
      paymentBase: 4500,
      paymentGrowthPercent: 0,
      activeClubs: 100,
      distinguishedClubs: 50,
      selectDistinguished: 20,
      presidentsDistinguished: 10,
      distinguishedPercent: 50,
      clubsRank: i,
      paymentsRank: i,
      distinguishedRank: i,
      aggregateScore: 300 - i,
    })
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [baseRow(1, '1'), baseRow(2, '2'), baseRow(3, '3')],
      date: '2025-11-22',
    })
  }

  it('clicking a region pill enters solo mode — only that region remains', async () => {
    const { fireEvent } = await import('@testing-library/react')
    setupThreeRegions()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 1')
    expect(screen.getByText('District 2')).toBeInTheDocument()
    expect(screen.getByText('District 3')).toBeInTheDocument()

    const region2Pill = screen.getByRole('button', { name: 'Region 2' })
    fireEvent.click(region2Pill)

    // Only District 2 (region 2) should remain in the table
    expect(screen.queryByText('District 1')).not.toBeInTheDocument()
    expect(screen.getByText('District 2')).toBeInTheDocument()
    expect(screen.queryByText('District 3')).not.toBeInTheDocument()

    // Pill is marked active
    expect(region2Pill).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking the active solo pill returns to all regions', async () => {
    const { fireEvent } = await import('@testing-library/react')
    setupThreeRegions()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 1')
    const region2Pill = screen.getByRole('button', { name: 'Region 2' })

    // Solo Region 2
    fireEvent.click(region2Pill)
    expect(screen.queryByText('District 1')).not.toBeInTheDocument()

    // Click again — back to all
    fireEvent.click(region2Pill)
    expect(screen.getByText('District 1')).toBeInTheDocument()
    expect(screen.getByText('District 2')).toBeInTheDocument()
    expect(screen.getByText('District 3')).toBeInTheDocument()
  })

  it('shift-click adds a region to the current solo selection (additive)', async () => {
    const { fireEvent } = await import('@testing-library/react')
    setupThreeRegions()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 1')

    fireEvent.click(screen.getByRole('button', { name: 'Region 2' }))
    expect(screen.queryByText('District 3')).not.toBeInTheDocument()

    // Shift-click Region 3 — add without removing Region 2
    fireEvent.click(screen.getByRole('button', { name: 'Region 3' }), {
      shiftKey: true,
    })
    expect(screen.getByText('District 2')).toBeInTheDocument()
    expect(screen.getByText('District 3')).toBeInTheDocument()
    expect(screen.queryByText('District 1')).not.toBeInTheDocument()
  })

  it('renders a state badge that reflects the current selection', async () => {
    const { fireEvent } = await import('@testing-library/react')
    setupThreeRegions()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 1')

    // Default: showing all regions
    expect(screen.getByText(/showing all regions/i)).toBeInTheDocument()

    // Solo Region 2
    fireEvent.click(screen.getByRole('button', { name: 'Region 2' }))
    expect(screen.getByText(/showing region 2 only/i)).toBeInTheDocument()

    // Shift-click Region 3 → 2 of 3 selected
    fireEvent.click(screen.getByRole('button', { name: 'Region 3' }), {
      shiftKey: true,
    })
    expect(screen.getByText(/showing 2 of 3 regions/i)).toBeInTheDocument()
  })
})
