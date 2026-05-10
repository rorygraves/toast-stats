/**
 * Unit tests for DistrictsPage search bar (#91)
 *
 * Verifies:
 * - Search input renders with placeholder
 * - Typing a district number filters the table
 * - Typing a district name filters the table
 * - Clear button resets the filter
 * - Search is case-insensitive
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
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

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: () => ({
    data: { districts: [] },
    isLoading: false,
    isError: false,
  }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

const MOCK_RANKINGS = [
  {
    districtId: '57',
    districtName: 'District 57',
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
    overallRank: 1,
  },
  {
    districtId: '61',
    districtName: 'District 61',
    region: '2',
    paidClubs: 80,
    paidClubBase: 75,
    clubGrowthPercent: 6.7,
    totalPayments: 3000,
    paymentBase: 2800,
    paymentGrowthPercent: 7.1,
    activeClubs: 80,
    distinguishedClubs: 30,
    selectDistinguished: 10,
    presidentsDistinguished: 5,
    distinguishedPercent: 37.5,
    clubsRank: 2,
    paymentsRank: 2,
    distinguishedRank: 2,
    aggregateScore: 250,
    overallRank: 2,
  },
  {
    districtId: '83',
    districtName: 'District 83',
    region: '1',
    paidClubs: 60,
    paidClubBase: 65,
    clubGrowthPercent: -7.7,
    totalPayments: 2000,
    paymentBase: 2200,
    paymentGrowthPercent: -9.1,
    activeClubs: 60,
    distinguishedClubs: 20,
    selectDistinguished: 5,
    presidentsDistinguished: 3,
    distinguishedPercent: 33.3,
    clubsRank: 3,
    paymentsRank: 3,
    distinguishedRank: 3,
    aggregateScore: 200,
  },
]

const setupWithData = () => {
  // Rankings query from CDN (#173)
  mockedFetchCdnRankings.mockResolvedValueOnce({
    rankings: MOCK_RANKINGS,
    date: '2025-11-22',
    generatedAt: '2025-01-01T00:00:00Z',
  })
}

describe('DistrictsPage - District Search (#91)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render a search input with appropriate placeholder', async () => {
    setupWithData()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 57')

    const searchInput = screen.getByPlaceholderText(/search/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('should filter table rows when typing a district number', async () => {
    setupWithData()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 57')
    expect(screen.getByText('District 61')).toBeInTheDocument()
    expect(screen.getByText('District 83')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: '61' } })

    // Should show District 61 but not the others
    expect(screen.getByText('District 61')).toBeInTheDocument()
    expect(screen.queryByText('District 57')).not.toBeInTheDocument()
    expect(screen.queryByText('District 83')).not.toBeInTheDocument()
  })

  it('should filter table rows when typing a district name', async () => {
    setupWithData()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 57')

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'district 83' } })

    expect(screen.getByText('District 83')).toBeInTheDocument()
    expect(screen.queryByText('District 57')).not.toBeInTheDocument()
    expect(screen.queryByText('District 61')).not.toBeInTheDocument()
  })

  it('should clear search and show all districts when clear button is clicked', async () => {
    setupWithData()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 57')

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: '57' } })

    // Only District 57 visible
    expect(screen.queryByText('District 61')).not.toBeInTheDocument()

    // Click the clear button
    const clearButton = screen.getByRole('button', {
      name: /clear search/i,
    })
    fireEvent.click(clearButton)

    // All districts should be visible again
    expect(screen.getByText('District 57')).toBeInTheDocument()
    expect(screen.getByText('District 61')).toBeInTheDocument()
    expect(screen.getByText('District 83')).toBeInTheDocument()
  })

  it('should retain original rank when filtering (#102)', async () => {
    setupWithData()
    renderWithProviders(<DistrictsPage />)

    await screen.findByText('District 57')

    // Before filtering: D57=rank 1 (score 300), D61=rank 2 (score 250), D83=rank 3 (score 200)
    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: '61' } })

    // District 61 should retain its original rank of 2, NOT become rank 1
    expect(screen.getByText('District 61')).toBeInTheDocument()

    // The rank badge should show "2" not "1"
    const rankBadges = screen.getAllByText('2')
    const rankBadge = rankBadges.find(el =>
      el.closest('td')?.classList.contains('sticky')
    )
    expect(rankBadge).toBeDefined()

    // Rank "1" should NOT be present (District 57 is filtered out)
    const allOnes = screen.queryAllByText('1')
    const rankOneInSticky = allOnes.find(el =>
      el.closest('td')?.classList.contains('sticky')
    )
    expect(rankOneInSticky).toBeUndefined()
  })
})
