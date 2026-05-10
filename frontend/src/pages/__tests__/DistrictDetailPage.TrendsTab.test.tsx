/**
 * Unit Tests for Trends Tab Data Source Wiring
 *
 * Tests that the Trends tab in DistrictDetailPage correctly sources its data
 * from aggregatedAnalytics (time-series data from /analytics-summary) instead
 * of analytics (single-snapshot data from /analytics).
 *
 * Property 1: Trends tab data source wiring
 *   For any rendering of the Trends tab where aggregatedAnalytics is available,
 *   MembershipTrendChart must receive aggregatedAnalytics.trends.membership,
 *   and YearOverYearComparison must receive time-series-derived YoY data
 *   and aggregatedAnalytics.summary-derived metrics.
 *
 * Property 2: Trends tab guard condition
 *   For any rendering of the Trends tab where aggregatedAnalytics is null,
 *   MembershipTrendChart and YearOverYearComparison must not be rendered.
 *
 * Validates: Requirements 1.1, 2.1, 2.2, 3.1, 3.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, render, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import DistrictDetailPage from '../DistrictDetailPage'
import { ProgramYearProvider } from '../../contexts/ProgramYearContext'

// ---------------------------------------------------------------------------
// Global mocks (before any component imports that depend on them)
// ---------------------------------------------------------------------------

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
}
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock IntersectionObserver so LazyChart renders children immediately
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  constructor(
    callback: (
      entries: IntersectionObserverEntry[],
      observer: IntersectionObserver
    ) => void
  ) {
    // Immediately trigger with isIntersecting: true so LazyChart renders children
    setTimeout(() => {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], this)
    }, 0)
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

Object.defineProperty(global, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true,
})

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: vi.fn(() => ({
    data: {
      districts: [{ id: 'D42', name: 'Test District 42' }],
    },
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useDistrictData', () => ({
  useDistrictCachedDates: vi.fn(() => ({
    data: { dates: ['2024-10-15', '2024-10-01', '2024-09-15'] },
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useDistrictAnalytics', () => ({
  useDistrictAnalytics: vi.fn(() => ({
    data: {
      allClubs: [],
      interventionRequiredClubs: [],
      vulnerableClubs: [],
      distinguishedClubs: { total: 0 },
      distinguishedProjection: null,
      thrivingClubs: [],
      topGrowthClubs: [],
      membershipTrend: [{ date: '2024-10-15', count: 999 }],
      divisionRankings: [],
      topPerformingAreas: [],
      totalMembership: 999,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('../../hooks/useMembershipData', () => ({
  useDistrictStatistics: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}))

vi.mock('../../hooks/useLeadershipInsights', () => ({
  useLeadershipInsights: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useDistinguishedClubAnalytics', () => ({
  useDistinguishedClubAnalytics: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/usePaymentsTrend', () => ({
  usePaymentsTrend: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useTimeSeries', () => ({
  useTimeSeries: vi.fn(() => ({
    data: {
      currentProgramYear: '2024-2025',
      years: {
        '2024-2025': {
          districtId: 'D42',
          programYear: '2024-2025',
          startDate: '2024-07-01',
          endDate: '2025-06-30',
          lastUpdated: '2024-10-15T12:00:00Z',
          dataPoints: [
            {
              date: '2024-07-15',
              snapshotId: '2024-07-15',
              membership: 5000,
              payments: 0,
              dcpGoals: 0,
              distinguishedTotal: 40,
              clubCounts: {
                total: 120,
                thriving: 80,
                vulnerable: 25,
                interventionRequired: 15,
              },
            },
            {
              date: '2024-08-15',
              snapshotId: '2024-08-15',
              membership: 5050,
              payments: 0,
              dcpGoals: 0,
              distinguishedTotal: 42,
              clubCounts: {
                total: 120,
                thriving: 82,
                vulnerable: 23,
                interventionRequired: 15,
              },
            },
            {
              date: '2024-09-15',
              snapshotId: '2024-09-15',
              membership: 5100,
              payments: 0,
              dcpGoals: 0,
              distinguishedTotal: 45,
              clubCounts: {
                total: 120,
                thriving: 83,
                vulnerable: 22,
                interventionRequired: 15,
              },
            },
            {
              date: '2024-10-15',
              snapshotId: '2024-10-15',
              membership: 5200,
              payments: 0,
              dcpGoals: 0,
              distinguishedTotal: 50,
              clubCounts: {
                total: 120,
                thriving: 85,
                vulnerable: 20,
                interventionRequired: 15,
              },
            },
          ],
          summary: {
            totalDataPoints: 4,
            membershipStart: 5000,
            membershipEnd: 5200,
            membershipPeak: 5200,
            membershipLow: 5000,
          },
        },
        '2023-2024': {
          districtId: 'D42',
          programYear: '2023-2024',
          startDate: '2023-07-01',
          endDate: '2024-06-30',
          lastUpdated: '2024-10-15T12:00:00Z',
          dataPoints: [
            {
              date: '2023-10-15',
              snapshotId: '2023-10-15',
              membership: 5000,
              payments: 0,
              dcpGoals: 0,
              distinguishedTotal: 45,
              clubCounts: {
                total: 115,
                thriving: 75,
                vulnerable: 25,
                interventionRequired: 15,
              },
            },
          ],
          summary: {
            totalDataPoints: 1,
            membershipStart: 5000,
            membershipEnd: 5000,
            membershipPeak: 5000,
            membershipLow: 5000,
          },
        },
      },
      availableYears: ['2024-2025', '2023-2024'],
      baseMembership: 5000,
      currentMembership: 5200,
      memberChange: 200,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

// Import the hook so we can control its return value per test
import { useAggregatedAnalytics } from '../../hooks/useAggregatedAnalytics'

vi.mock('../../hooks/useAggregatedAnalytics', () => ({
  useAggregatedAnalytics: vi.fn(),
}))

const mockUseAggregatedAnalytics = vi.mocked(useAggregatedAnalytics)

// ---------------------------------------------------------------------------
// Mock child components to capture props without rendering Recharts
// ---------------------------------------------------------------------------

vi.mock('../../components/MembershipTrendChart', () => ({
  MembershipTrendChart: vi.fn(
    (props: {
      membershipTrend: Array<{ date: string; count: number }>
      isLoading?: boolean
    }) => (
      <div data-testid="membership-trend-chart">
        <span data-testid="membership-trend-count">
          {props.membershipTrend.length}
        </span>
        <span data-testid="membership-trend-loading">
          {String(props.isLoading ?? false)}
        </span>
      </div>
    )
  ),
}))

vi.mock('../../components/YearOverYearComparison', () => ({
  YearOverYearComparison: vi.fn(
    (props: {
      yearOverYear?: {
        membershipChange: number
        distinguishedChange: number
        clubHealthChange: number
      }
      currentYear: {
        totalMembership: number
        distinguishedClubs: number
        thrivingClubs: number
        totalClubs: number
      }
      isLoading?: boolean
    }) => (
      <div data-testid="year-over-year-comparison">
        <span data-testid="yoy-has-data">
          {String(props.yearOverYear !== undefined)}
        </span>
        <span data-testid="yoy-total-membership">
          {props.currentYear.totalMembership}
        </span>
        <span data-testid="yoy-distinguished-clubs">
          {props.currentYear.distinguishedClubs}
        </span>
        <span data-testid="yoy-thriving-clubs">
          {props.currentYear.thrivingClubs}
        </span>
        <span data-testid="yoy-total-clubs">
          {props.currentYear.totalClubs}
        </span>
        <span data-testid="yoy-loading">
          {String(props.isLoading ?? false)}
        </span>
      </div>
    )
  ),
}))

// Import mocked components for call verification
import { MembershipTrendChart } from '../../components/MembershipTrendChart'
import { YearOverYearComparison } from '../../components/YearOverYearComparison'

const mockMembershipTrendChart = vi.mocked(MembershipTrendChart)
const mockYearOverYearComparison = vi.mocked(YearOverYearComparison)

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createMockAggregatedAnalytics() {
  return {
    districtId: 'D42',
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
      distinguishedChange: 10.0,
      clubHealthChange: -2.1,
    },
    dataSource: 'precomputed' as const,
    computedAt: '2024-10-15T12:00:00Z',
  }
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderDistrictDetailPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ProgramYearProvider>
        <MemoryRouter initialEntries={['/districts/D42']}>
          <Routes>
            <Route
              path="/districts/:districtId"
              element={<DistrictDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </ProgramYearProvider>
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DistrictDetailPage - Trends Tab Data Source Wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    cleanup()
  })

  // =========================================================================
  // Property 1: Trends tab data source wiring
  // Validates: Requirements 1.1, 2.1, 2.2, 3.1
  // =========================================================================
  describe('Property 1: Trends tab data source wiring', () => {
    /**
     * **Validates: Requirements 1.1**
     *
     * WHEN the Trends tab renders the MembershipTrendChart,
     * it SHALL pass membership trend data from aggregatedAnalytics.trends.membership
     * (the full time-series with multiple data points).
     */
    it('should pass aggregated membership trend data to MembershipTrendChart', async () => {
      const mockData = createMockAggregatedAnalytics()
      mockUseAggregatedAnalytics.mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        usedFallback: false,
      })

      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Trends tab
      const trendsTab = screen.getByRole('tab', { name: /Trends/i })
      await user.click(trendsTab)

      // Wait for LazyChart IntersectionObserver to fire
      await waitFor(() => {
        expect(screen.getByTestId('membership-trend-chart')).toBeInTheDocument()
      })

      // Verify MembershipTrendChart received the aggregated data (4 points, not 1)
      expect(screen.getByTestId('membership-trend-count')).toHaveTextContent(
        '4'
      )

      // Verify via mock call args that the exact aggregated data was passed
      const lastCall =
        mockMembershipTrendChart.mock.calls[
          mockMembershipTrendChart.mock.calls.length - 1
        ]
      expect(lastCall).toBeDefined()
      const props = lastCall![0]
      expect(props.membershipTrend).toEqual(mockData.trends.membership)
      expect(props.membershipTrend).toHaveLength(4)
    })

    /**
     * **Validates: Requirements 2.1, 2.2**
     *
     * WHEN the Trends tab renders the YearOverYearComparison,
     * it SHALL pass yearOverYear data from aggregatedAnalytics.yearOverYear
     * and currentYear metrics derived from aggregatedAnalytics.summary.
     */
    it('should pass aggregated yearOverYear and summary data to YearOverYearComparison', async () => {
      const mockData = createMockAggregatedAnalytics()
      mockUseAggregatedAnalytics.mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        usedFallback: false,
      })

      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Trends tab
      const trendsTab = screen.getByRole('tab', { name: /Trends/i })
      await user.click(trendsTab)

      // Wait for YearOverYearComparison to render
      await waitFor(() => {
        expect(
          screen.getByTestId('year-over-year-comparison')
        ).toBeInTheDocument()
      })

      // Verify yearOverYear data was passed (now computed from time-series, not aggregatedAnalytics)
      expect(screen.getByTestId('yoy-has-data')).toHaveTextContent('true')

      // Verify currentYear metrics come from aggregatedAnalytics.summary
      expect(screen.getByTestId('yoy-total-membership')).toHaveTextContent(
        '5200'
      )
      expect(screen.getByTestId('yoy-distinguished-clubs')).toHaveTextContent(
        '50'
      )
      expect(screen.getByTestId('yoy-thriving-clubs')).toHaveTextContent('85')
      expect(screen.getByTestId('yoy-total-clubs')).toHaveTextContent('120')

      // Verify via mock call args that YoY data is present (from time-series)
      const lastCall =
        mockYearOverYearComparison.mock.calls[
          mockYearOverYearComparison.mock.calls.length - 1
        ]
      expect(lastCall).toBeDefined()
      const props = lastCall![0]
      expect(props.yearOverYear).toBeDefined()
      expect(props.yearOverYear!.membershipChange).toBeGreaterThan(0)
      expect(props.currentYear).toEqual({
        totalMembership: 5200,
        distinguishedClubs: 50,
        thrivingClubs: 85,
        totalClubs: 120,
      })
    })

    /**
     * **Validates: Requirements 3.1**
     *
     * WHEN aggregatedAnalytics is available, both MembershipTrendChart and
     * YearOverYearComparison SHALL render using that data.
     */
    it('should render both trend components when aggregatedAnalytics is available', async () => {
      const mockData = createMockAggregatedAnalytics()
      mockUseAggregatedAnalytics.mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        usedFallback: false,
      })

      const user = userEvent.setup()
      renderDistrictDetailPage()

      const trendsTab = screen.getByRole('tab', { name: /Trends/i })
      await user.click(trendsTab)

      await waitFor(() => {
        expect(screen.getByTestId('membership-trend-chart')).toBeInTheDocument()
        expect(
          screen.getByTestId('year-over-year-comparison')
        ).toBeInTheDocument()
      })
    })
  })

  // =========================================================================
  // Property 2: Trends tab guard condition
  // Validates: Requirement 3.2
  // =========================================================================
  describe('Property 2: Trends tab guard condition', () => {
    /**
     * **Validates: Requirements 3.2**
     *
     * WHEN aggregatedAnalytics is null (not yet loaded or errored),
     * MembershipTrendChart and YearOverYearComparison SHALL NOT be rendered.
     */
    it('should not render MembershipTrendChart or YearOverYearComparison when aggregatedAnalytics is null', async () => {
      mockUseAggregatedAnalytics.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        usedFallback: false,
      })

      const user = userEvent.setup()
      renderDistrictDetailPage()

      const trendsTab = screen.getByRole('tab', { name: /Trends/i })
      await user.click(trendsTab)

      // Verify the Trends tab is active
      await waitFor(() => {
        const trendsButton = screen.getByRole('tab', { name: /Trends/i })
        expect(trendsButton).toHaveAttribute('aria-selected', 'true')
      })

      // Neither component should be rendered
      expect(
        screen.queryByTestId('membership-trend-chart')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('year-over-year-comparison')
      ).not.toBeInTheDocument()
    })

    /**
     * **Validates: Requirements 3.2**
     *
     * WHEN aggregatedAnalytics is null but single-snapshot analytics IS available,
     * the Trends tab still SHALL NOT render MembershipTrendChart or
     * YearOverYearComparison — confirming the guard is on aggregatedAnalytics,
     * not on the old analytics source.
     */
    it('should not render trend components even when single-snapshot analytics is available but aggregatedAnalytics is null', async () => {
      // aggregatedAnalytics is null
      mockUseAggregatedAnalytics.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        usedFallback: false,
      })

      // single-snapshot analytics IS available (via the default mock above)
      // This verifies the guard is on aggregatedAnalytics, not analytics

      const user = userEvent.setup()
      renderDistrictDetailPage()

      const trendsTab = screen.getByRole('tab', { name: /Trends/i })
      await user.click(trendsTab)

      // Verify the Trends tab is active
      await waitFor(() => {
        const trendsButton = screen.getByRole('tab', { name: /Trends/i })
        expect(trendsButton).toHaveAttribute('aria-selected', 'true')
      })

      // Neither component should be rendered despite analytics being available
      expect(
        screen.queryByTestId('membership-trend-chart')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('year-over-year-comparison')
      ).not.toBeInTheDocument()
    })
  })
})
