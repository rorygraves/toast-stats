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

    // Wait for data to load and check for rank numbers
    const clubsRank = await screen.findByText('Rank #5')
    const paymentsRank = await screen.findByText('Rank #3')
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

    // Check paid clubs column
    expect(table.getByText('100')).toBeInTheDocument()
    expect(table.getByText('Rank #5')).toBeInTheDocument()
    expect(table.getByText('+12.5%')).toBeInTheDocument()

    // Check total payments column
    expect(table.getByText('5,000')).toBeInTheDocument()
    expect(table.getByText('Rank #3')).toBeInTheDocument()
    expect(table.getByText('+11.1%')).toBeInTheDocument()

    // Verify the rank and percentage are in the same container (text-xs class)
    const rankElements = screen.getAllByText(/Rank #\d+/)
    // Check that rank elements exist and are styled correctly
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
