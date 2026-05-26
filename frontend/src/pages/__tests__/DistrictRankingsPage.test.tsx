/**
 * District Rankings Page — Phase 3 of the District IA migration (#571).
 *
 * Verifies the new route `/district/:districtId/rankings` and the URL
 * contract:
 *   - `?metric=<paid|payments|distinguished|aggregate>` (default: aggregate)
 * Plus the legacy redirect:
 *   - `?tab=globalRankings[&rank_metric=clubs]` →
 *     `/district/:id/rankings[?metric=paid]`
 */

import React, { Suspense } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

vi.mock('../../hooks/useDistrictAnalytics', () => ({
  useDistrictAnalytics: vi.fn(() => ({
    data: null,
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

vi.mock('../../hooks/useDistrictData', () => ({
  useDistrictCachedDates: vi.fn(() => ({
    data: {
      dates: ['2025-07-15', '2025-07-01'],
      dateRange: { startDate: '2025-07-01', endDate: '2025-07-15' },
    },
    isLoading: false,
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

vi.mock('../../hooks/useCompetitiveAwards', () => ({
  useCompetitiveAwards: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../components/LazyCharts', () => ({
  LazyMembershipTrendChart: () => null,
  LazyMembershipPaymentsChart: () => null,
  LazyYearOverYearComparison: () => null,
}))

// Capture the metric prop the inner GlobalRankingsTab receives so we
// can assert the URL <-> selectedMetric mapping without rendering the
// heavy chart subtree.
const observedMetric = vi.fn()
vi.mock('../../components/GlobalRankingsTab', async () => {
  const { useUrlState } = await import('../../hooks/useUrlState')
  const FakeGlobalRankingsTab = () => {
    const [metric, setMetric] = useUrlState<string>('metric', 'aggregate', {
      parse: v => v,
      serialize: v => v,
    })
    observedMetric(metric)
    return (
      <div data-testid="global-rankings-tab">
        <span data-testid="metric-value">{metric}</span>
        <button type="button" onClick={() => setMetric('paid')}>
          select paid
        </button>
        <button type="button" onClick={() => setMetric('aggregate')}>
          select aggregate
        </button>
      </div>
    )
  }
  return { default: FakeGlobalRankingsTab }
})

const DistrictRankingsPage = React.lazy(() => import('../DistrictRankingsPage'))

const renderAt = (initialUrl: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const routes: RouteObject[] = [
    { path: '/district/:districtId', element: <DistrictDetailPage /> },
    {
      path: '/district/:districtId/rankings',
      element: (
        <Suspense fallback={<div>Loading…</div>}>
          <DistrictRankingsPage />
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

describe('DistrictRankingsPage (#571 — Phase 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    observedMetric.mockClear()
  })
  afterEach(() => cleanup())

  it('renders GlobalRankingsTab at /district/:districtId/rankings', async () => {
    renderAt('/district/61/rankings')
    expect(await screen.findByTestId('global-rankings-tab')).toBeInTheDocument()
  })

  it('renders the District section subnav with Rankings active (#678)', async () => {
    renderAt('/district/61/rankings')
    await screen.findByTestId('global-rankings-tab')

    expect(
      screen.getByRole('navigation', { name: 'District sections' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Rankings', current: 'page' })
    ).toBeInTheDocument()
  })

  it('shows a back-to-district breadcrumb, not the old back button (#577)', async () => {
    renderAt('/district/61/rankings')
    await screen.findByTestId('global-rankings-tab')

    expect(screen.getByRole('link', { name: 'District 61' })).toHaveAttribute(
      'href',
      '/district/61'
    )
    expect(
      screen.queryByRole('button', { name: /Back to District 61/i })
    ).not.toBeInTheDocument()
  })

  it('defaults metric to aggregate when ?metric is absent', async () => {
    renderAt('/district/61/rankings')
    expect(await screen.findByTestId('metric-value')).toHaveTextContent(
      'aggregate'
    )
  })

  it('honors ?metric=paid on load', async () => {
    renderAt('/district/61/rankings?metric=paid')
    expect(await screen.findByTestId('metric-value')).toHaveTextContent('paid')
  })

  it('writes ?metric= to the URL when a metric button is activated', async () => {
    const user = userEvent.setup()
    const { router } = renderAt('/district/61/rankings')

    await screen.findByTestId('global-rankings-tab')
    await user.click(screen.getByText(/select paid/i))

    await waitFor(() => {
      const params = new URLSearchParams(router.state.location.search)
      expect(params.get('metric')).toBe('paid')
    })
  })

  it('clears ?metric from the URL when the default value is selected', async () => {
    const user = userEvent.setup()
    const { router } = renderAt('/district/61/rankings?metric=paid')

    await screen.findByTestId('global-rankings-tab')
    await user.click(screen.getByText(/select aggregate/i))

    await waitFor(() => {
      const params = new URLSearchParams(router.state.location.search)
      expect(params.get('metric')).toBeNull()
    })
  })

  it('redirects /district/:id?tab=globalRankings to /district/:id/rankings', async () => {
    const { router } = renderAt('/district/61?tab=globalRankings')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/district/61/rankings')
    })
  })

  it('translates legacy rank_metric=clubs into metric=paid', async () => {
    const { router } = renderAt(
      '/district/61?tab=globalRankings&rank_metric=clubs'
    )

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/district/61/rankings')
      const params = new URLSearchParams(router.state.location.search)
      expect(params.get('metric')).toBe('paid')
    })
  })
})
