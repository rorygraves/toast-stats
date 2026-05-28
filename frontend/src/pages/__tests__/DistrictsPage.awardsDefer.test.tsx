/**
 * Landing Awards-Race mobile deferral (#862, epic #865 Sprint 2).
 *
 * Mobile-first triage: at <768px the heavy 3-card Awards Race section is the
 * single biggest above-the-fold block that isn't "find my district". It already
 * has a canonical home at `/awards`, so on mobile we replace it with a compact
 * "See Awards →" link and hide the full section; at ≥768px the section is shown
 * and the link hidden — desktop is visually unchanged.
 *
 * jsdom has no layout/media queries (Lesson 66), so these assert the structural
 * hooks the CSS keys off (the always-rendered section + always-rendered link,
 * each carrying the class its `@media` rule toggles `display` on). The live
 * per-breakpoint show/hide is proven on the PR preview channel in both engines.
 *
 * Both surfaces stay mounted in the DOM at every width — the toggle is pure CSS
 * `display`. That keeps the desktop section render path (and its #750 reserved
 * skeleton / CLS contract) untouched: this sprint only adds a sibling link and a
 * media query, it does not change AwardsRaceSection.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import DistrictsPage from '../DistrictsPage'
import { fetchCdnRankings } from '../../services/cdn'
import type { CompetitiveAwardStandings } from '../../services/cdn'
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

const mockStandings: CompetitiveAwardStandings = {
  metadata: {
    snapshotId: '2025-11-22',
    calculatedAt: '2025-11-22T00:00:00.000Z',
    totalDistricts: 1,
  },
  extensionAward: [
    {
      districtId: '7',
      districtName: 'District 7',
      region: '7',
      rank: 1,
      value: 14,
      isWinner: false,
    },
  ],
  twentyPlusAward: [],
  retentionAward: [],
  byDistrict: {},
}

vi.mock('../../hooks/useCompetitiveAwards', () => ({
  useCompetitiveAwards: () => ({ data: mockStandings, isLoading: false }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

const setupSingleRow = () => {
  mockedFetchCdnRankings.mockResolvedValue({
    rankings: [
      {
        districtId: '7',
        districtName: 'District 7',
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
        overallRank: 1,
      },
    ],
    date: '2025-11-22',
  } as never)
}

describe('DistrictsPage — defer Awards Race behind a mobile link (#862)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a "See Awards →" link to /awards carrying the mobile-only class', async () => {
    setupSingleRow()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    const link = screen.getByRole('link', { name: /see awards/i })
    expect(link).toHaveAttribute('href', '/awards')
    // The class its `@media (min-width: 768px) { display: none }` rule keys off.
    expect(link.className).toMatch(/awards-race-mobile-link/)
  })

  it('keeps the full Awards Race section mounted (the ≥768px desktop slot is unchanged)', async () => {
    setupSingleRow()
    const { container } = renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    // Section still in DOM at every width; CSS hides it <768px. The render
    // path (incl. the #750 reserved-skeleton CLS contract) is untouched.
    const section = container.querySelector('.awards-race')
    expect(section).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: /awards race/i })
    ).toBeInTheDocument()
  })

  it('places the mobile link in the hero stack, adjacent to the deferred section', async () => {
    setupSingleRow()
    const { container } = renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    const stack = container.querySelector('.districts-hero-stack')
    expect(stack).not.toBeNull()
    expect(stack!.querySelector('.awards-race-mobile-link')).not.toBeNull()
    expect(stack!.querySelector('.awards-race')).not.toBeNull()
  })
})
