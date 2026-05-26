/**
 * District Trends Page — Sprint 6 of the District IA epic (#680, ADR-005).
 *
 * The membership / payments / YoY trend charts moved off the Overview hub
 * onto their own deep-linkable route `/district/:districtId/trends`. This
 * relocates the data-source-wiring assertions that previously lived in
 * DistrictDetailPage.TrendsTab.test.tsx (the hub no longer renders them).
 */

import React, { Suspense } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom'
import { ProgramYearProvider } from '../../contexts/ProgramYearContext'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import DistrictDetailPage from '../DistrictDetailPage'

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: vi.fn(() => ({
    data: { districts: [{ id: '61', name: 'District 61' }] },
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useDistrictData', () => ({
  useDistrictCachedDates: vi.fn(() => ({
    data: {
      dates: ['2024-10-15', '2024-10-01'],
      dateRange: { startDate: '2024-10-01', endDate: '2024-10-15' },
    },
    isLoading: false,
  })),
}))

vi.mock('../../hooks/useDistrictAnalytics', () => ({
  useDistrictAnalytics: vi.fn(() => ({
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
  usePaymentsTrend: vi.fn(() => ({
    data: {
      currentYearTrend: [{ date: '2024-10-15', payments: 100 }],
      multiYearData: null,
      statistics: { currentPayments: 100 },
    },
    isLoading: false,
  })),
}))

vi.mock('../../hooks/useTimeSeries', () => ({
  useTimeSeries: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/useCompetitiveAwards', () => ({
  useCompetitiveAwards: vi.fn(() => ({ data: null, isLoading: false })),
}))

import { useAggregatedAnalytics } from '../../hooks/useAggregatedAnalytics'

vi.mock('../../hooks/useAggregatedAnalytics', () => ({
  useAggregatedAnalytics: vi.fn(),
}))

const mockUseAggregated = vi.mocked(useAggregatedAnalytics)

// Capture props passed to the charts without rendering Recharts.
const trendChartProps: Array<{ membershipTrend: unknown[] }> = []
vi.mock('../../components/LazyCharts', () => ({
  LazyMembershipTrendChart: (props: { membershipTrend: unknown[] }) => {
    trendChartProps.push(props)
    return (
      <div data-testid="membership-trend-chart">
        <span data-testid="trend-count">{props.membershipTrend.length}</span>
      </div>
    )
  },
  LazyMembershipPaymentsChart: () => (
    <div data-testid="membership-payments-chart" />
  ),
  LazyYearOverYearComparison: () => (
    <div data-testid="year-over-year-comparison" />
  ),
}))

function aggregated() {
  return {
    districtId: '61',
    dateRange: { start: '2024-07-01', end: '2024-10-15' },
    summary: {
      totalMembership: 5200,
      membershipChange: 150,
      clubCounts: {
        total: 120,
        thriving: 85,
        vulnerable: 20,
        interventionRequired: 15,
      },
      distinguishedClubs: {
        smedley: 5,
        presidents: 10,
        select: 15,
        distinguished: 20,
        total: 50,
      },
      distinguishedProjection: 60,
    },
    trends: {
      membership: [
        { date: '2024-07-15', count: 5000 },
        { date: '2024-08-15', count: 5050 },
        { date: '2024-09-15', count: 5100 },
        { date: '2024-10-15', count: 5200 },
      ],
    },
    yearOverYear: {
      membershipChange: 3.5,
      distinguishedChange: 10,
      clubHealthChange: -2.1,
    },
    dataSource: 'precomputed' as const,
    computedAt: '2024-10-15T12:00:00Z',
  }
}

const DistrictTrendsPage = React.lazy(() => import('../DistrictTrendsPage'))

const renderAt = (initialUrl: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const routes: RouteObject[] = [
    { path: '/district/:districtId', element: <DistrictDetailPage /> },
    {
      path: '/district/:districtId/trends',
      element: (
        <Suspense fallback={<div>Loading…</div>}>
          <DistrictTrendsPage />
        </Suspense>
      ),
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

describe('DistrictTrendsPage (#680 — ADR-005)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    trendChartProps.length = 0
    mockUseAggregated.mockReturnValue({
      data: aggregated(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      usedFallback: false,
    })
  })
  afterEach(() => cleanup())

  it('renders the three trend charts at /district/:id/trends', async () => {
    renderAt('/district/61/trends')
    expect(
      await screen.findByTestId('membership-trend-chart')
    ).toBeInTheDocument()
    expect(screen.getByTestId('membership-payments-chart')).toBeInTheDocument()
    expect(screen.getByTestId('year-over-year-comparison')).toBeInTheDocument()
  })

  it('feeds MembershipTrendChart the aggregated time-series points', async () => {
    renderAt('/district/61/trends')
    await screen.findByTestId('membership-trend-chart')
    expect(screen.getByTestId('trend-count')).toHaveTextContent('4')
  })

  it('renders the section subnav with Trends active', async () => {
    renderAt('/district/61/trends')
    await screen.findByTestId('membership-trend-chart')
    expect(
      screen.getByRole('navigation', { name: 'District sections' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Trends', current: 'page' })
    ).toBeInTheDocument()
  })

  it('shows a back-to-district breadcrumb', async () => {
    renderAt('/district/61/trends')
    await screen.findByTestId('membership-trend-chart')
    expect(screen.getByRole('link', { name: 'District 61' })).toHaveAttribute(
      'href',
      '/district/61'
    )
  })

  it('does not render the charts when aggregated analytics is unavailable', async () => {
    mockUseAggregated.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      usedFallback: false,
    })
    renderAt('/district/61/trends')
    await screen.findByRole('navigation', { name: 'District sections' })
    expect(
      screen.queryByTestId('membership-trend-chart')
    ).not.toBeInTheDocument()
  })

  it('redirects /district/:id?tab=trends to /district/:id/trends', async () => {
    const { router } = renderAt('/district/61?tab=trends')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/district/61/trends')
    })
  })
})
