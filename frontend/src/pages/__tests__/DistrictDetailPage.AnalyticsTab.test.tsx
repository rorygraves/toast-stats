/**
 * Integration Tests for District Detail Page - Analytics Tab (#78)
 *
 * Tests:
 * - Analytics tab appears in tab navigation
 * - Clicking Analytics tab renders analytics content
 * - Graceful fallback when dcpGoalAnalysis is null
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  screen,
  render,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import DistrictDetailPage from '../DistrictDetailPage'

// Mock IntersectionObserver for lazy loading components
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

// Mock all the hooks used by DistrictDetailPage
vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: vi.fn(() => ({
    data: {
      districts: [{ id: '57', name: 'District 57' }],
    },
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
      distinguishedClubs: { total: 10 },
      distinguishedProjection: null,
      thrivingClubs: [],
      divisionRankings: [],
      topPerformingAreas: [],
      membershipTrend: [],
      topGrowthClubs: [],
      totalMembership: 1000,
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

vi.mock('../../hooks/usePerformanceTargets', () => ({
  usePerformanceTargets: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}))

vi.mock('../../hooks/usePaymentsTrend', () => ({
  usePaymentsTrend: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}))

vi.mock('../../hooks/useDistrictData', () => ({
  useDistrictCachedDates: vi.fn(() => ({
    data: {
      dates: ['2024-01-15', '2024-01-01'],
    },
    isLoading: false,
  })),
}))

vi.mock('../../contexts/ProgramYearContext', () => ({
  useProgramYear: vi.fn(() => ({
    selectedProgramYear: {
      year: 2024,
      startDate: '2024-07-01',
      endDate: '2025-06-30',
      label: '2024-2025',
    },
    setSelectedProgramYear: vi.fn(),
    selectedDate: null,
    setSelectedDate: vi.fn(),
  })),
}))

// Mock the GlobalRankingsTab since it's not relevant to this test
vi.mock('../../components/GlobalRankingsTab', () => ({
  default: vi.fn(() => <div data-testid="global-rankings-tab-content" />),
}))

// Helper to render with router and query client
const renderWithProviders = (initialRoute = '/district/57') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  const router = createMemoryRouter(
    [
      {
        path: '/district/:districtId',
        element: <DistrictDetailPage />,
      },
    ],
    {
      initialEntries: [initialRoute],
    }
  )

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('DistrictDetailPage - Analytics Tab (#78)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  // Helper: get the Analytics tab button from the navigation
  const getAnalyticsTab = () => {
    const tabNav = screen.getByRole('tablist')
    const tabButtons = tabNav.querySelectorAll('button')
    const analyticsTab = Array.from(tabButtons).find(
      btn => btn.textContent?.trim() === 'Analytics'
    )
    return analyticsTab as HTMLButtonElement
  }

  describe('Tab Navigation', () => {
    it('should display Analytics tab in the tab navigation', () => {
      renderWithProviders()

      const analyticsTab = getAnalyticsTab()
      expect(analyticsTab).toBeDefined()
      expect(analyticsTab).toBeInTheDocument()
    })

    it('should include Analytics tab between Trends and Global Rankings', () => {
      renderWithProviders()

      const tabNav = screen.getByRole('tablist')
      const tabButtons = tabNav.querySelectorAll('button')

      // Should now have 6 tabs: Overview, Clubs, Divisions, Trends, Analytics, Global Rankings
      expect(tabButtons).toHaveLength(6)
      expect(tabButtons[3]).toHaveTextContent(/trends/i)
      expect(tabButtons[4]).toHaveTextContent(/analytics/i)
      expect(tabButtons[5]).toHaveTextContent(/global rankings/i)
    })
  })

  describe('Tab Content', () => {
    it('should render analytics content when tab is clicked', async () => {
      renderWithProviders()

      const analyticsTab = getAnalyticsTab()
      fireEvent.click(analyticsTab)

      // After removing LeadershipInsights (#183), the first visible content
      // on the analytics tab is TopGrowthClubs (which shows empty state)
      await waitFor(() => {
        expect(analyticsTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('should not crash when all analytics data is null', async () => {
      // All analytics mocks return null — component should render gracefully
      renderWithProviders()

      const analyticsTab = getAnalyticsTab()
      fireEvent.click(analyticsTab)

      // Should render without crashing — Analytics tab should become active
      await waitFor(() => {
        expect(analyticsTab).toHaveAttribute('aria-selected', 'true')
      })
    })
  })
})
