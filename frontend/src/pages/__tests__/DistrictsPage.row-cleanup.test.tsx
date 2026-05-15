import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import DistrictsPage from '../DistrictsPage'
import { fetchCdnRankings } from '../../services/cdn'
import { renderWithProviders } from '../../__tests__/test-utils'

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

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

const baseRanking = {
  region: '1',
  paidClubs: 100,
  paidClubBase: 90,
  clubGrowthPercent: 10,
  totalPayments: 5000,
  paymentBase: 4500,
  paymentGrowthPercent: 10,
  activeClubs: 100,
  distinguishedClubs: 50,
  selectDistinguished: 20,
  presidentsDistinguished: 10,
  distinguishedPercent: 50,
  clubsRank: 1,
  paymentsRank: 1,
  distinguishedRank: 1,
  aggregateScore: 300,
}

describe('DistrictsPage data controls bar (#530 #528)', () => {
  it('renders the unified DataControlsBar toolbar', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [{ ...baseRanking, districtId: '86', districtName: '86' }],
      date: '2025-11-22',
    })
    renderWithProviders(<DistrictsPage />)

    expect(
      await screen.findByRole('toolbar', { name: /data controls/i })
    ).toBeInTheDocument()
  })

  it('does not render the legacy DataFreshnessBadge', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [{ ...baseRanking, districtId: '86', districtName: '86' }],
      date: '2025-11-22',
    })
    renderWithProviders(<DistrictsPage />)

    await screen.findByTestId('district-number-chip-D86')
    expect(screen.queryByTestId('data-freshness-badge')).toBeNull()
  })

  it('does not render the legacy "View Specific Date" filters card label', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [{ ...baseRanking, districtId: '86', districtName: '86' }],
      date: '2025-11-22',
    })
    renderWithProviders(<DistrictsPage />)

    await screen.findByTestId('district-number-chip-D86')
    expect(screen.queryByText(/view specific date/i)).toBeNull()
  })
})

describe('DistrictsPage row cleanup (#519 #520)', () => {
  it('does not render an "Analytics" chip on any ranking row', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [{ ...baseRanking, districtId: '86', districtName: '86' }],
      date: '2025-11-22',
    })

    renderWithProviders(<DistrictsPage />)
    await screen.findByTestId('district-number-chip-D86')

    expect(screen.queryAllByText(/^Analytics$/i)).toHaveLength(0)
  })

  it('omits the bare district number when districtName is purely numeric', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [{ ...baseRanking, districtId: '86', districtName: '86' }],
      date: '2025-11-22',
    })

    renderWithProviders(<DistrictsPage />)
    const chip = await screen.findByTestId('district-number-chip-D86')
    expect(chip.textContent).toBe('D86')

    const row = chip.closest('tr')!
    expect(within(row).queryByText('86', { selector: 'span' })).toBeNull()
  })

  it('keeps a richer district name when it is not purely numeric', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        {
          ...baseRanking,
          districtId: '57',
          districtName: 'District 57 Carolinas',
        },
      ],
      date: '2025-11-22',
    })

    renderWithProviders(<DistrictsPage />)
    expect(await screen.findByText('District 57 Carolinas')).toBeInTheDocument()
  })
})
