/**
 * District Analytics Page — Sprint 6 of the District IA epic (#680, ADR-005 §1/§2).
 *
 * Top-growth / top-DCP-achiever lists (and the education-levels rollup) moved
 * off the Overview hub onto their own deep-linkable route
 * `/district/:districtId/analytics`.
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

const topGrowthProps: Array<{
  topGrowthClubs: unknown[]
  topDCPClubs?: unknown[]
}> = []

vi.mock('../../hooks/useDistrictAnalytics', () => ({
  useDistrictAnalytics: vi.fn(() => ({
    data: {
      allClubs: [
        {
          clubId: 'c1',
          clubName: 'Alpha',
          dcpGoalsTrend: [{ goalsAchieved: 9 }],
          distinguishedLevel: 'Select',
        },
        {
          clubId: 'c2',
          clubName: 'Beta',
          dcpGoalsTrend: [{ goalsAchieved: 5 }],
        },
      ],
      topGrowthClubs: [{ clubId: 'c1', clubName: 'Alpha', growth: 12 }],
      distinguishedClubs: { total: 10 },
      totalMembership: 1000,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('../../hooks/useMembershipData', () => ({
  useDistrictStatistics: vi.fn(() => ({
    data: { asOfDate: '2024-10-15', divisions: [] },
    isLoading: false,
  })),
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

vi.mock('../../hooks/useAggregatedAnalytics', () => ({
  useAggregatedAnalytics: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    usedFallback: false,
  })),
}))

vi.mock('../../hooks/useCompetitiveAwards', () => ({
  useCompetitiveAwards: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../components/TopGrowthClubs', () => ({
  TopGrowthClubs: (props: {
    topGrowthClubs: unknown[]
    topDCPClubs?: unknown[]
  }) => {
    topGrowthProps.push(props)
    return (
      <div data-testid="top-growth-clubs">
        <span data-testid="growth-count">{props.topGrowthClubs.length}</span>
        <span data-testid="dcp-count">{props.topDCPClubs?.length ?? 0}</span>
      </div>
    )
  },
}))

vi.mock('../../components/EducationLevelsCard', () => ({
  EducationLevelsCard: () => <div data-testid="education-levels-card" />,
}))

const DistrictAnalyticsPage = React.lazy(
  () => import('../DistrictAnalyticsPage')
)

const renderAt = (initialUrl: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const routes: RouteObject[] = [
    { path: '/district/:districtId', element: <DistrictDetailPage /> },
    {
      path: '/district/:districtId/analytics',
      element: (
        <Suspense fallback={<div>Loading…</div>}>
          <DistrictAnalyticsPage />
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

describe('DistrictAnalyticsPage (#680 — ADR-005)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    topGrowthProps.length = 0
  })
  afterEach(() => cleanup())

  it('renders Top Growth / Top DCP and the education-levels rollup', async () => {
    renderAt('/district/61/analytics')
    expect(await screen.findByTestId('top-growth-clubs')).toBeInTheDocument()
    expect(screen.getByTestId('education-levels-card')).toBeInTheDocument()
  })

  it('derives the top DCP list from analytics.allClubs (sorted, capped)', async () => {
    renderAt('/district/61/analytics')
    await screen.findByTestId('top-growth-clubs')
    expect(screen.getByTestId('growth-count')).toHaveTextContent('1')
    // Both mocked clubs have a dcpGoalsTrend entry → 2 DCP achievers.
    expect(screen.getByTestId('dcp-count')).toHaveTextContent('2')
  })

  it('renders the section subnav with Analytics active', async () => {
    renderAt('/district/61/analytics')
    await screen.findByTestId('top-growth-clubs')
    expect(
      screen.getByRole('navigation', { name: 'District sections' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Analytics', current: 'page' })
    ).toBeInTheDocument()
  })

  it('shows a back-to-district breadcrumb', async () => {
    renderAt('/district/61/analytics')
    await screen.findByTestId('top-growth-clubs')
    expect(screen.getByRole('link', { name: 'District 61' })).toHaveAttribute(
      'href',
      '/district/61'
    )
  })

  it('redirects /district/:id?tab=analytics to /district/:id/analytics', async () => {
    const { router } = renderAt('/district/61?tab=analytics')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/district/61/analytics')
    })
  })
})
