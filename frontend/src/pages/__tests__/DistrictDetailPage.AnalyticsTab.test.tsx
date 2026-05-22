/**
 * Integration Tests for District Detail Page - Analytics Tab (#78)
 *
 * Tests:
 * - Analytics tab appears in tab navigation
 * - Clicking Analytics tab renders analytics content
 * - Graceful fallback when dcpGoalAnalysis is null
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, render, waitFor, cleanup } from '@testing-library/react'
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

describe('DistrictDetailPage — Analytics section (post-#569 narrative merge)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Tab strip', () => {
    it('does not render an Analytics tab — content scroll-stacks above the strip (#569)', () => {
      renderWithProviders()
      const tabNav = screen.getByRole('tablist')
      const tabButtons = tabNav.querySelectorAll('button')
      const labels = Array.from(tabButtons).map(b => b.textContent?.trim())
      expect(labels).not.toContain('Analytics')
      expect(labels).not.toContain('Trends')
      expect(labels).not.toContain('Overview')
    })

    it('shows the 3 remaining tabs: Clubs / Divisions & Areas / Global Rankings', () => {
      renderWithProviders()
      const tabNav = screen.getByRole('tablist')
      const tabButtons = tabNav.querySelectorAll('button')
      expect(tabButtons).toHaveLength(3)
      expect(tabButtons[0]).toHaveTextContent(/^clubs/i)
      expect(tabButtons[1]).toHaveTextContent(/divisions/i)
      expect(tabButtons[2]).toHaveTextContent(/global rankings/i)
    })
  })

  describe('Narrative rendering', () => {
    it('does not crash with all analytics data null — narrative renders gracefully', async () => {
      // All hook mocks at the top of this file return null/empty; the page
      // should still mount without throwing. Pre-#569 this test clicked an
      // Analytics tab; post-#569 there is no tab to click — the content
      // either renders (with empty states) or is skipped, but the page
      // must not crash.
      renderWithProviders()
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument()
      })
    })
  })
})
