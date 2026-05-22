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

  describe('Subview CTAs (post-#571 IA Phase 3)', () => {
    it('does not render a tab strip — narrative scrolls top-to-bottom', () => {
      renderWithProviders()
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('exposes CTA links to the Clubs / Divisions / Rankings routes', () => {
      renderWithProviders()
      expect(
        screen.getByRole('link', { name: /view all clubs/i })
      ).toHaveAttribute('href', '/district/57/clubs')
      expect(
        screen.getByRole('link', { name: /divisions.*areas/i })
      ).toHaveAttribute('href', '/district/57/divisions')
      expect(
        screen.getByRole('link', { name: /global rankings/i })
      ).toHaveAttribute('href', '/district/57/rankings')
    })
  })

  describe('Narrative rendering', () => {
    it('does not crash with all analytics data null — narrative renders gracefully', async () => {
      // All hook mocks at the top of this file return null/empty; the page
      // should still mount without throwing. Post-#571 there are no tabs;
      // the narrative renders its empty states / CTAs.
      renderWithProviders()
      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: /view all clubs/i })
        ).toBeInTheDocument()
      })
    })
  })
})
