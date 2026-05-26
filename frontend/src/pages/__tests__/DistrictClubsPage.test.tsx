/**
 * District Clubs Page — Phase 2 of the District IA migration (#570).
 *
 * Verifies the new route `/district/:districtId/clubs` plus its URL-param
 * contract:
 *   - `?status=<thriving|vulnerable|intervention>` for the segmented chip
 *   - `?search=<q>` for the club-name text filter
 *   - `?sort=<field>&dir=<asc|desc>` for sort
 *   - `?page=<n>` for pagination
 * And the legacy redirect: `/district/:id?tab=clubs[&extra]` 301-equivalents
 * to `/district/:id/clubs[?extra]`, translating `f_status`/`f_name` into
 * the new clean parameter names.
 */

import React, { Suspense } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'
import { ProgramYearProvider } from '../../contexts/ProgramYearContext'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import DistrictDetailPage from '../DistrictDetailPage'

const TEST_CLUBS: ClubTrend[] = [
  {
    clubId: '1001',
    clubName: 'Alpha Toastmasters',
    divisionId: 'A',
    divisionName: 'Division A',
    areaId: '11',
    areaName: 'Area 11',
    currentStatus: 'thriving',
    distinguishedLevel: 'Distinguished',
    riskFactors: [],
    membershipTrend: [{ date: '2025-07-01', count: 28 }],
    dcpGoalsTrend: [{ date: '2025-07-01', goalsAchieved: 7 }],
  },
  {
    clubId: '1002',
    clubName: 'Beta Speakers',
    divisionId: 'A',
    divisionName: 'Division A',
    areaId: '12',
    areaName: 'Area 12',
    currentStatus: 'vulnerable',
    distinguishedLevel: 'Select',
    riskFactors: ['DCP checkpoint not met'],
    membershipTrend: [{ date: '2025-07-01', count: 14 }],
    dcpGoalsTrend: [{ date: '2025-07-01', goalsAchieved: 4 }],
  },
  {
    clubId: '1003',
    clubName: 'Gamma Communicators',
    divisionId: 'B',
    divisionName: 'Division B',
    areaId: '21',
    areaName: 'Area 21',
    currentStatus: 'intervention-required',
    distinguishedLevel: 'NotDistinguished',
    riskFactors: ['Membership below 12'],
    membershipTrend: [{ date: '2025-07-01', count: 9 }],
    dcpGoalsTrend: [{ date: '2025-07-01', goalsAchieved: 1 }],
  },
  {
    clubId: '1004',
    clubName: 'Delta Orators',
    divisionId: 'B',
    divisionName: 'Division B',
    areaId: '22',
    areaName: 'Area 22',
    currentStatus: 'thriving',
    distinguishedLevel: 'Smedley',
    riskFactors: [],
    membershipTrend: [{ date: '2025-07-01', count: 31 }],
    dcpGoalsTrend: [{ date: '2025-07-01', goalsAchieved: 9 }],
  },
]

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: vi.fn(() => ({
    data: {
      districts: [{ id: '61', name: 'District 61' }],
    },
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useDistrictAnalytics', () => ({
  useDistrictAnalytics: vi.fn(() => ({
    data: {
      allClubs: TEST_CLUBS,
      interventionRequiredClubs: [],
      vulnerableClubs: [],
      distinguishedClubs: { total: 1 },
      distinguishedProjection: null,
      thrivingClubs: [],
      divisionRankings: [],
      topPerformingAreas: [],
      membershipTrend: [],
      topGrowthClubs: [],
      totalMembership: 100,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('../../hooks/useAggregatedAnalytics', () => ({
  useAggregatedAnalytics: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('../../hooks/useMembershipData', () => ({
  useDistrictStatistics: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/usePerformanceTargets', () => ({
  usePerformanceTargets: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/usePaymentsTrend', () => ({
  usePaymentsTrend: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/useTimeSeries', () => ({
  useTimeSeries: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/useDistrictData', () => ({
  useDistrictCachedDates: vi.fn(() => ({
    data: {
      dates: ['2025-07-15', '2025-07-01'],
      dateRange: { startDate: '2025-07-01', endDate: '2025-07-15' },
    },
    isLoading: false,
  })),
}))

vi.mock('../../hooks/useCompetitiveAwards', () => ({
  useCompetitiveAwards: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../components/LazyCharts', () => ({
  LazyMembershipTrendChart: () => null,
  LazyMembershipPaymentsChart: () => null,
  LazyYearOverYearComparison: () => null,
}))

vi.mock('../../components/GlobalRankingsTab', () => ({
  default: () => null,
}))

const DistrictClubsPage = React.lazy(() => import('../DistrictClubsPage'))

const renderAt = (initialUrl: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const routes: RouteObject[] = [
    { path: '/district/:districtId', element: <DistrictDetailPage /> },
    {
      path: '/district/:districtId/clubs',
      element: (
        <Suspense fallback={<div>Loading…</div>}>
          <DistrictClubsPage />
        </Suspense>
      ),
    },
    // Stub club-detail route so row-click navigation resolves and we can
    // assert the navigation state (filter round-trip, #577).
    {
      path: '/district/:districtId/club/:clubId',
      element: <div>club detail stub</div>,
    },
  ]

  const router = createMemoryRouter(routes, { initialEntries: [initialUrl] })

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ProgramYearProvider>
        <DarkModeProvider>
          <RouterProvider router={router} />
        </DarkModeProvider>
      </ProgramYearProvider>
    </QueryClientProvider>
  )
  return { ...utils, router }
}

describe('DistrictClubsPage (#570 — Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the ClubsTable at /district/:districtId/clubs', async () => {
    renderAt('/district/61/clubs')

    expect(await screen.findByText(/alpha toastmasters/i)).toBeInTheDocument()
    expect(screen.getByText(/beta speakers/i)).toBeInTheDocument()
  })

  it('shows a back-to-district breadcrumb crumb, not the old back button (#577)', async () => {
    renderAt('/district/61/clubs')

    await screen.findByText(/alpha toastmasters/i)

    // The District 61 crumb links back to the overview.
    const crumb = screen.getByRole('link', { name: 'District 61' })
    expect(crumb).toHaveAttribute('href', '/district/61')

    // The ad-hoc "← Back to District 61" button is gone — the breadcrumb
    // is the single back affordance.
    expect(
      screen.queryByRole('button', { name: /Back to District 61/i })
    ).not.toBeInTheDocument()
  })

  it('renders the District section subnav with Clubs active (#678)', async () => {
    renderAt('/district/61/clubs')
    await screen.findByText(/alpha toastmasters/i)

    const subnav = screen.getByRole('navigation', { name: 'District sections' })
    expect(within(subnav).getByRole('link', { name: 'Clubs' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('round-trips the current filter into club navigation state (#577)', async () => {
    const user = userEvent.setup()
    const { router } = renderAt('/district/61/clubs?status=vulnerable')

    // Only Beta Speakers is vulnerable; click its row.
    const beta = await screen.findByText(/beta speakers/i)
    await user.click(beta)

    expect(router.state.location.pathname).toBe('/district/61/club/1002')
    expect(
      (router.state.location.state as { fromClubsSearch?: string } | null)
        ?.fromClubsSearch
    ).toBe('?status=vulnerable')
  })

  it('applies ?status=vulnerable to filter clubs on load', async () => {
    renderAt('/district/61/clubs?status=vulnerable')

    await screen.findByText(/beta speakers/i)
    expect(screen.queryByText(/alpha toastmasters/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/gamma communicators/i)).not.toBeInTheDocument()
  })

  it('maps the "intervention" URL param to the intervention-required filter value', async () => {
    renderAt('/district/61/clubs?status=intervention')

    await screen.findByText(/gamma communicators/i)
    expect(screen.queryByText(/alpha toastmasters/i)).not.toBeInTheDocument()
  })

  it('writes ?status= to the URL when a status chip is activated', async () => {
    const user = userEvent.setup()
    const { router } = renderAt('/district/61/clubs')

    await screen.findByText(/alpha toastmasters/i)

    const statusStrip = screen.getByRole('tablist', {
      name: /filter clubs by health status/i,
    })
    const vulnerableChip = within(statusStrip).getByRole('tab', {
      name: /^vulnerable/i,
    })
    await user.click(vulnerableChip)

    await waitFor(() => {
      const params = new URLSearchParams(router.state.location.search)
      expect(params.get('status')).toBe('vulnerable')
    })
  })

  it('clears ?status= from the URL when chip is deactivated', async () => {
    const user = userEvent.setup()
    const { router } = renderAt('/district/61/clubs?status=vulnerable')

    await screen.findByText(/beta speakers/i)

    const statusStrip = screen.getByRole('tablist', {
      name: /filter clubs by health status/i,
    })
    const allChip = within(statusStrip).getByRole('tab', { name: /^all\b/i })
    await user.click(allChip)

    await waitFor(() => {
      const params = new URLSearchParams(router.state.location.search)
      expect(params.get('status')).toBeNull()
    })
  })

  it('honors ?sort=membership&dir=desc on load', async () => {
    renderAt('/district/61/clubs?sort=membership&dir=desc')

    const rows = await screen.findAllByRole('row')
    // First data row should be Delta (31), then Alpha (28).
    const dataRows = rows.filter(
      r =>
        r.textContent?.includes('Toastmasters') ||
        r.textContent?.includes('Speakers') ||
        r.textContent?.includes('Communicators') ||
        r.textContent?.includes('Orators')
    )
    expect(dataRows[0]?.textContent).toMatch(/delta orators/i)
  })

  it('ignores a legacy ?page= param and renders all clubs — #667', async () => {
    // #667 (epic #665) — pagination removed. A stale ?page= in the URL
    // (e.g. a bookmarked link) must not break the page; all clubs render.
    renderAt('/district/61/clubs?page=2')
    await screen.findByText(/alpha toastmasters/i)
    expect(screen.getByText(/beta speakers/i)).toBeInTheDocument()
  })

  it('redirects /district/:id?tab=clubs to /district/:id/clubs', async () => {
    const { router } = renderAt('/district/61?tab=clubs')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/district/61/clubs')
    })
  })

  it('translates legacy ?tab=clubs&f_status=vulnerable to ?status=vulnerable', async () => {
    const { router } = renderAt('/district/61?tab=clubs&f_status=vulnerable')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/district/61/clubs')
      // Order of query params is not contractual; assert presence.
      const params = new URLSearchParams(router.state.location.search)
      expect(params.get('status')).toBe('vulnerable')
    })
  })

  it('translates legacy ?tab=clubs&f_name=alpha to ?search=alpha', async () => {
    const { router } = renderAt('/district/61?tab=clubs&f_name=alpha')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/district/61/clubs')
      const params = new URLSearchParams(router.state.location.search)
      expect(params.get('search')).toBe('alpha')
    })
  })

  it('preserves sort/dir but strips legacy page during redirect — #667', async () => {
    // #667 (epic #665) — pagination removed; the legacy redirect drops
    // the obsolete ?page= param while keeping sort/dir.
    const { router } = renderAt(
      '/district/61?tab=clubs&sort=membership&dir=desc&page=2'
    )

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/district/61/clubs')
      const params = new URLSearchParams(router.state.location.search)
      expect(params.get('sort')).toBe('membership')
      expect(params.get('dir')).toBe('desc')
      expect(params.get('page')).toBeNull()
    })
  })
})
