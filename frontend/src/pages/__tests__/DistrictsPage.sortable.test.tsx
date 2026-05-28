/**
 * @vitest-environment jsdom
 *
 * Sprint 851 — click-any-column-to-sort + URL-synced sort.
 *
 * The landing rankings table replaces its bespoke 4-button sort enum with
 * per-column click-header sort. The sort field/direction live in the URL
 * (?sort=&dir=) so reload / back-forward / share carry the sort state.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DistrictsPage from '../DistrictsPage'
import { fetchCdnRankings } from '../../services/cdn'
import { renderWithProviders } from '../../__tests__/test-utils'

vi.mock('../../services/cdn', () => ({
  fetchCdnDates: vi
    .fn()
    .mockResolvedValue({ dates: [], count: 0, generatedAt: '2025-01-01' }),
  fetchCdnSnapshotIndex: vi.fn().mockResolvedValue({}),
  fetchCdnRankings: vi.fn(),
  fetchCdnRankingsForDate: vi.fn(),
  fetchCdnManifest: vi.fn().mockResolvedValue({
    latestSnapshotDate: '2025-11-22',
    generatedAt: '2025-01-01',
  }),
  cdnAnalyticsUrl: vi.fn().mockReturnValue(''),
  fetchFromCdn: vi.fn(),
}))

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: () => ({ data: { districts: [] }, isLoading: false }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

const baseRanking = {
  selectDistinguished: 0,
  presidentsDistinguished: 0,
  clubGrowthPercent: 0,
  paymentGrowthPercent: 0,
  distinguishedPercent: 0,
  paidClubBase: 0,
  paymentBase: 0,
  overallRank: 1,
}

// Three distinct districts, distinct ranks per category so each sort
// produces an observable row-order change.
//   D86  — best on Aggregate (overallRank 1), worst on Paid Clubs (#3)
//   D74  — middle aggregate, best on Paid Clubs (#1)
//   D60  — worst aggregate, middle on Paid Clubs (#2)
const rankings = [
  {
    ...baseRanking,
    districtId: '86',
    districtName: 'District 86',
    region: 'R',
    paidClubs: 50,
    activeClubs: 50,
    totalPayments: 9000,
    distinguishedClubs: 30,
    aggregateScore: 300,
    clubsRank: 3,
    paymentsRank: 1,
    distinguishedRank: 1,
    overallRank: 1,
  },
  {
    ...baseRanking,
    districtId: '74',
    districtName: 'District 74',
    region: 'R',
    paidClubs: 90,
    activeClubs: 90,
    totalPayments: 5000,
    distinguishedClubs: 20,
    aggregateScore: 200,
    clubsRank: 1,
    paymentsRank: 2,
    distinguishedRank: 2,
    overallRank: 2,
  },
  {
    ...baseRanking,
    districtId: '60',
    districtName: 'District 60',
    region: 'R',
    paidClubs: 70,
    activeClubs: 70,
    totalPayments: 4000,
    distinguishedClubs: 10,
    aggregateScore: 100,
    clubsRank: 2,
    paymentsRank: 3,
    distinguishedRank: 3,
    overallRank: 3,
  },
]

const getRowOrder = (): string[] => {
  const table = document.querySelector('.districts-rankings-table')
  const rows = table?.querySelectorAll('tbody tr[data-testid^="district-row-"]')
  return Array.from(rows ?? []).map(
    r => r.getAttribute('data-testid')?.replace('district-row-', '') ?? ''
  )
}

describe('DistrictsPage — click-header sort (#851)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedFetchCdnRankings.mockResolvedValue({
      rankings,
      date: '2025-11-22',
    })
  })

  afterEach(cleanup)

  it('default sort is Score descending', async () => {
    renderWithProviders(<DistrictsPage />)
    await screen.findByTestId('district-row-86')
    expect(getRowOrder()).toEqual(['86', '74', '60'])
  })

  it('clicking Paid Clubs header sorts by clubsRank ascending', async () => {
    renderWithProviders(<DistrictsPage />)
    await screen.findByTestId('district-row-86')

    const clubsHeader = screen.getByRole('button', {
      name: /Sort by Paid Clubs/i,
    })
    fireEvent.click(clubsHeader)

    await waitFor(() => {
      // D74 has clubsRank=1 → first; D60=2 → second; D86=3 → third
      expect(getRowOrder()).toEqual(['74', '60', '86'])
    })
  })

  it('clicking the same header again flips direction', async () => {
    renderWithProviders(<DistrictsPage />)
    await screen.findByTestId('district-row-86')

    const clubsHeader = screen.getByRole('button', {
      name: /Sort by Paid Clubs/i,
    })
    fireEvent.click(clubsHeader) // asc by clubsRank
    fireEvent.click(clubsHeader) // desc

    await waitFor(() => {
      expect(getRowOrder()).toEqual(['86', '60', '74'])
    })
  })

  it('aria-sort flips to ascending after clicking Paid Clubs (URL-synced)', async () => {
    renderWithProviders(<DistrictsPage />)
    await screen.findByTestId('district-row-86')

    const btn = screen.getByRole('button', { name: /Sort by Paid Clubs/i })
    const th = btn.closest('th')
    expect(th?.getAttribute('aria-sort')).toBe('none')

    fireEvent.click(btn)
    await waitFor(() => {
      expect(th?.getAttribute('aria-sort')).toBe('ascending')
    })
  })

  it('reads initial sort from the URL on mount', async () => {
    renderWithProviders(<DistrictsPage />, {
      initialEntries: ['/?sort=clubs&dir=asc'],
    })
    await screen.findByTestId('district-row-86')
    await waitFor(() => {
      expect(getRowOrder()).toEqual(['74', '60', '86'])
    })
  })

  it('aria-sort reflects the active sort column', async () => {
    renderWithProviders(<DistrictsPage />, {
      initialEntries: ['/?sort=clubs&dir=desc'],
    })
    await screen.findByTestId('district-row-86')

    const clubsHeader = screen
      .getByRole('button', { name: /Sort by Paid Clubs/i })
      .closest('th')
    expect(clubsHeader?.getAttribute('aria-sort')).toBe('descending')
  })

  it('exposes a Score column header that toggles the default sort key', async () => {
    renderWithProviders(<DistrictsPage />)
    await screen.findByTestId('district-row-86')

    // Score is the default sort — toggling it should flip to ascending
    const scoreBtn = screen.getByRole('button', { name: /Sort by Score/i })
    fireEvent.click(scoreBtn)
    await waitFor(() => {
      expect(getRowOrder()).toEqual(['60', '74', '86'])
    })
  })
})
