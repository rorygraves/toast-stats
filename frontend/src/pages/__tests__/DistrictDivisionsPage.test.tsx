/**
 * District Divisions Page — Phase 3 of the District IA migration (#571).
 *
 * Verifies the new route `/district/:districtId/divisions` and the legacy
 * `?tab=divisions` redirect introduced in this phase.
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
  useDistrictStatistics: vi.fn(() => ({
    data: {
      asOfDate: '2025-07-15',
      divisions: [
        {
          divisionId: 'A',
          divisionName: 'Division A',
          areas: [],
          totalClubs: 5,
          paidClubs: 4,
          distinguishedClubs: 2,
          membership: 100,
          clubBase: 5,
        },
      ],
    },
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

vi.mock('../../hooks/useCompetitiveAwards', () => ({
  useCompetitiveAwards: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../components/LazyCharts', () => ({
  LazyMembershipTrendChart: () => null,
  LazyMembershipPaymentsChart: () => null,
  LazyYearOverYearComparison: () => null,
}))

vi.mock('../../components/GlobalRankingsTab', () => ({ default: () => null }))

vi.mock('../../components/DivisionPerformanceCards', () => ({
  DivisionPerformanceCards: () => (
    <div data-testid="division-performance-cards">division cards</div>
  ),
}))

vi.mock('../../components/DivisionAreaRecognitionPanel', () => ({
  DivisionAreaRecognitionPanel: () => (
    <div data-testid="division-area-recognition-panel">area recognition</div>
  ),
}))

vi.mock('../../components/DistinguishedProgramCriteriaExplainer', () => ({
  default: () => (
    <div data-testid="ddp-criteria-explainer">criteria explainer</div>
  ),
}))

const DistrictDivisionsPage = React.lazy(
  () => import('../DistrictDivisionsPage')
)

const renderAt = (initialUrl: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const routes: RouteObject[] = [
    { path: '/district/:districtId', element: <DistrictDetailPage /> },
    {
      path: '/district/:districtId/divisions',
      element: (
        <Suspense fallback={<div>Loading…</div>}>
          <DistrictDivisionsPage />
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

describe('DistrictDivisionsPage (#571 — Phase 3)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('renders the divisions panels at /district/:districtId/divisions', async () => {
    renderAt('/district/61/divisions')

    expect(
      await screen.findByTestId('division-performance-cards')
    ).toBeInTheDocument()
    expect(screen.getByTestId('ddp-criteria-explainer')).toBeInTheDocument()
    expect(
      screen.getByTestId('division-area-recognition-panel')
    ).toBeInTheDocument()
  })

  it('redirects /district/:id?tab=divisions to /district/:id/divisions', async () => {
    const { router } = renderAt('/district/61?tab=divisions')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/district/61/divisions')
    })
  })
})
