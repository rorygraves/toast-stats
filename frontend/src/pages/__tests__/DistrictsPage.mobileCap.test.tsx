/**
 * DistrictsPage landing rankings — cap the list to top-N on mobile with a
 * "Show all <count>" disclosure (#863, epic #865 Sprint 3).
 *
 * Mobile-first triage (mobile-ux-audit-2026-05-28 §Epic A): the user landed on
 * `/` to find THEIR district, not to read a 138-row leaderboard on a phone. So
 * below 768px the rankings render only the top MOBILE_RANKINGS_CAP rows by
 * default, followed by a "Show all <n> districts" disclosure that reveals the
 * rest. Desktop (≥768px) is unchanged — it shows the full list and never sees
 * the disclosure.
 *
 * jsdom has no real media queries, so useIsMobile reads from a stubbed
 * window.matchMedia (Lesson 66 — live per-breakpoint layout is proven on the
 * PR preview channel in both engines). matches:true ⇒ mobile, matches:false ⇒
 * desktop.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: () => ({
    data: { districts: [] },
    isLoading: false,
    isError: false,
  }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

const makeRow = (i: number) => ({
  districtId: String(i),
  districtName: `District ${i}`,
  region: String((i % 14) + 1),
  paidClubs: 200 - i,
  paidClubBase: 190 - i,
  clubGrowthPercent: 5,
  totalPayments: 5000 - i,
  paymentBase: 4500,
  paymentGrowthPercent: 5,
  activeClubs: 200 - i,
  distinguishedClubs: 50,
  selectDistinguished: 20,
  presidentsDistinguished: 10,
  distinguishedPercent: 25,
  clubsRank: i,
  paymentsRank: i,
  distinguishedRank: i,
  aggregateScore: 1000 - i,
  overallRank: i,
})

/** Resolve the rankings fetch with `n` districts (ids 1..n). */
const setupRows = (n: number) => {
  mockedFetchCdnRankings.mockResolvedValue({
    rankings: Array.from({ length: n }, (_, idx) => makeRow(idx + 1)),
    date: '2025-11-22',
  } as never)
}

/** Stub matchMedia so useIsMobile(768) resolves to the given viewport. */
const stubViewport = (mobile: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: mobile,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

const rowCount = () => screen.getAllByTestId(/^district-row-/).length

describe('DistrictsPage mobile top-N cap + disclosure (#863)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('caps the list to the top 20 on mobile and shows a "Show all 25 districts" disclosure', async () => {
    stubViewport(true)
    setupRows(25)
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 1')

    expect(rowCount()).toBe(20)

    const showAll = screen.getByTestId('mobile-show-all-districts')
    expect(showAll).toHaveTextContent(/show all 25 districts/i)
    expect(showAll).toHaveAttribute('aria-expanded', 'false')
    // Rows beyond the cap are not in the DOM yet.
    expect(screen.queryByTestId('district-row-25')).toBeNull()
  })

  it('reveals the full list when the disclosure is tapped, and toggles its label/aria', async () => {
    stubViewport(true)
    setupRows(25)
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 1')

    await userEvent.click(screen.getByTestId('mobile-show-all-districts'))

    expect(rowCount()).toBe(25)
    expect(screen.getByTestId('district-row-25')).toBeInTheDocument()
    const showAll = screen.getByTestId('mobile-show-all-districts')
    expect(showAll).toHaveAttribute('aria-expanded', 'true')
    expect(showAll).toHaveTextContent(/show top 20/i)
  })

  it('shows the full list and no disclosure on desktop', async () => {
    stubViewport(false)
    setupRows(25)
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 1')

    expect(rowCount()).toBe(25)
    expect(screen.queryByTestId('mobile-show-all-districts')).toBeNull()
  })

  it('does not cap when the list is already at or below the cap on mobile', async () => {
    stubViewport(true)
    setupRows(12)
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 1')

    expect(rowCount()).toBe(12)
    expect(screen.queryByTestId('mobile-show-all-districts')).toBeNull()
  })

  it('does not cap an active search on mobile (search must not hide matches)', async () => {
    stubViewport(true)
    setupRows(25)
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 1')

    // "District" matches every row by name → 25 results, all shown, no cap.
    const search = screen.getByRole('textbox', { name: /search districts/i })
    await userEvent.type(search, 'District')

    expect(rowCount()).toBe(25)
    expect(screen.queryByTestId('mobile-show-all-districts')).toBeNull()
  })
})
