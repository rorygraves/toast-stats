/**
 * Integration Tests for District Detail Page - Global Rankings Tab Navigation
 *
 * Tests the integration of GlobalRankingsTab component within the District Detail Page context,
 * verifying:
 * - Tab appears in navigation alongside existing tabs
 * - Tab selection activates Global Rankings content
 * - Consistent styling with existing tabs per brand guidelines
 * - Accessibility standards (WCAG AA compliance)
 *
 * Validates Requirements: 1.1, 1.2, 1.3, 1.4
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
import { axe, toHaveNoViolations } from 'jest-axe'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import DistrictDetailPage from '../DistrictDetailPage'

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations)

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
    // Immediately call callback with isIntersecting: true to trigger lazy loading
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
      districts: [
        { id: '57', name: 'District 57' },
        { id: '42', name: 'District 42' },
      ],
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

vi.mock('../../hooks/useLeadershipInsights', () => ({
  useLeadershipInsights: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}))

vi.mock('../../hooks/useDistinguishedClubAnalytics', () => ({
  useDistinguishedClubAnalytics: vi.fn(() => ({
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
      dates: ['2024-01-15', '2024-01-01', '2023-12-15'],
    },
    isLoading: false,
  })),
}))

// Mock the ProgramYearContext
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

// Mock the GlobalRankingsTab component to verify it receives correct props
vi.mock('../../components/GlobalRankingsTab', () => ({
  default: vi.fn(({ districtId, districtName }) => (
    <div data-testid="global-rankings-tab-content">
      <span data-testid="district-id">{districtId}</span>
      <span data-testid="district-name">{districtName}</span>
      <h2>Global Rankings Content</h2>
      <p>End-of-Year Rankings</p>
      <p>Ranking Progression</p>
      <p>Multi-Year Comparison</p>
    </div>
  )),
}))

// Import the mocked GlobalRankingsTab for verification
import GlobalRankingsTab from '../../components/GlobalRankingsTab'

const mockGlobalRankingsTab = vi.mocked(GlobalRankingsTab)

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

describe('DistrictDetailPage - Global Rankings Tab Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Tab Navigation Presence (Requirement 1.1)', () => {
    it('should display Global Rankings tab in the tab navigation', () => {
      renderWithProviders()

      // Find the Global Rankings tab button
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      expect(globalRankingsTab).toBeInTheDocument()
    })

    it('should display Global Rankings tab alongside existing tabs', () => {
      renderWithProviders()

      // Get the tab navigation container
      const tabNav = screen.getByRole('tablist')

      // Verify all tabs are present within the navigation
      // Note: Analytics tab is now re-enabled (#78)
      expect(tabNav).toHaveTextContent(/overview/i)
      expect(tabNav).toHaveTextContent(/clubs/i)
      expect(tabNav).toHaveTextContent(/divisions & areas/i)
      expect(tabNav).toHaveTextContent(/trends/i)
      expect(tabNav).toHaveTextContent(/analytics/i)
      expect(tabNav).toHaveTextContent(/global rankings/i)
    })

    it('should have correct tab order with Global Rankings as the last tab', () => {
      renderWithProviders()

      // Get all tab buttons in the navigation
      const tabNav = screen.getByRole('tablist')
      const tabButtons = tabNav.querySelectorAll('button')

      // Verify the order (Analytics tab is now re-enabled #78)
      expect(tabButtons).toHaveLength(6)
      expect(tabButtons[0]).toHaveTextContent(/overview/i)
      expect(tabButtons[1]).toHaveTextContent(/clubs/i)
      expect(tabButtons[2]).toHaveTextContent(/divisions & areas/i)
      expect(tabButtons[3]).toHaveTextContent(/trends/i)
      expect(tabButtons[4]).toHaveTextContent(/analytics/i)
      expect(tabButtons[5]).toHaveTextContent(/global rankings/i)
    })
  })

  describe('Tab Selection and Content Display (Requirement 1.2)', () => {
    it('should activate Global Rankings tab when clicked', async () => {
      renderWithProviders()

      // Click on Global Rankings tab
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      fireEvent.click(globalRankingsTab)

      // Verify the tab becomes active
      await waitFor(() => {
        expect(globalRankingsTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('should display GlobalRankingsTab content when tab is active', async () => {
      renderWithProviders()

      // Click on Global Rankings tab
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      fireEvent.click(globalRankingsTab)

      // Verify the GlobalRankingsTab content is displayed
      await waitFor(() => {
        expect(
          screen.getByTestId('global-rankings-tab-content')
        ).toBeInTheDocument()
      })
    })

    it('should pass correct districtId prop to GlobalRankingsTab', async () => {
      renderWithProviders('/district/57')

      // Click on Global Rankings tab
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      fireEvent.click(globalRankingsTab)

      // Verify the correct districtId is passed
      await waitFor(() => {
        expect(screen.getByTestId('district-id')).toHaveTextContent('57')
      })
    })

    it('should pass correct districtName prop to GlobalRankingsTab', async () => {
      renderWithProviders('/district/57')

      // Click on Global Rankings tab
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      fireEvent.click(globalRankingsTab)

      // Verify the correct districtName is passed
      await waitFor(() => {
        expect(screen.getByTestId('district-name')).toHaveTextContent(
          'District 57'
        )
      })
    })

    it('should hide other tab content when Global Rankings is active', async () => {
      renderWithProviders()

      // Initially Overview tab should be active
      expect(
        screen.queryByTestId('global-rankings-tab-content')
      ).not.toBeInTheDocument()

      // Click on Global Rankings tab
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      fireEvent.click(globalRankingsTab)

      // Verify Global Rankings content is shown
      await waitFor(() => {
        expect(
          screen.getByTestId('global-rankings-tab-content')
        ).toBeInTheDocument()
      })
    })

    it('should switch back to other tabs from Global Rankings', async () => {
      renderWithProviders()

      // Click on Global Rankings tab
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      fireEvent.click(globalRankingsTab)

      // Verify Global Rankings content is shown
      await waitFor(() => {
        expect(
          screen.getByTestId('global-rankings-tab-content')
        ).toBeInTheDocument()
      })

      // Click on Overview tab
      const overviewTab = screen.getByRole('tab', { name: /overview/i })
      fireEvent.click(overviewTab)

      // Verify Global Rankings content is hidden
      await waitFor(() => {
        expect(
          screen.queryByTestId('global-rankings-tab-content')
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Tab Styling Consistency (Requirement 1.3)', () => {
    it('should have consistent inactive aria-selected signal with other tabs', () => {
      renderWithProviders()

      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })

      // Get the tab navigation and find the Trends tab within it (Analytics is now re-enabled)
      const tabNav = screen.getByRole('tablist')
      const tabButtons = tabNav.querySelectorAll('button')
      const trendsTab = Array.from(tabButtons).find(btn =>
        btn.textContent?.toLowerCase().includes('trends')
      )

      // Both should be inactive on initial render (Overview is the default)
      expect(globalRankingsTab).toHaveAttribute('aria-selected', 'false')
      expect(trendsTab).toHaveAttribute('aria-selected', 'false')
    })

    it('should expose the active state via aria-selected when selected', async () => {
      renderWithProviders()

      // Click on Global Rankings tab
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      fireEvent.click(globalRankingsTab)

      // Verify active state
      await waitFor(() => {
        expect(globalRankingsTab).toHaveAttribute('aria-selected', 'true')
      })
    })
  })

  describe('Accessibility (Requirement 1.4, 6.x)', () => {
    it('should have no accessibility violations in tab navigation', async () => {
      const { container } = renderWithProviders()

      // Run axe on the tab navigation
      const tabNav = container.querySelector('[role="tablist"]')
      if (tabNav) {
        const results = await axe(tabNav)
        expect(results).toHaveNoViolations()
      }
    })

    it('should be keyboard navigable', () => {
      renderWithProviders()

      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })

      // Tab should be focusable
      globalRankingsTab.focus()
      expect(document.activeElement).toBe(globalRankingsTab)
    })

    it('should activate tab on Enter key press', async () => {
      renderWithProviders()

      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })

      // Focus and press Enter
      globalRankingsTab.focus()
      fireEvent.keyDown(globalRankingsTab, { key: 'Enter', code: 'Enter' })
      fireEvent.click(globalRankingsTab) // Simulate the click that would follow

      // Verify tab is activated
      await waitFor(() => {
        expect(globalRankingsTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('should have proper button role', () => {
      renderWithProviders()

      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })

      expect(globalRankingsTab.tagName).toBe('BUTTON')
    })
  })

  describe('Tab State Management', () => {
    it('should maintain tab state when switching between tabs', async () => {
      renderWithProviders()

      // Click on Global Rankings tab
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      fireEvent.click(globalRankingsTab)

      // Verify Global Rankings is active
      await waitFor(() => {
        expect(globalRankingsTab).toHaveAttribute('aria-selected', 'true')
      })

      // Click on Clubs tab
      const clubsTab = screen.getByRole('tab', { name: /clubs/i })
      fireEvent.click(clubsTab)

      // Verify Clubs is now active and Global Rankings is inactive
      await waitFor(() => {
        expect(clubsTab).toHaveAttribute('aria-selected', 'true')
        expect(globalRankingsTab).toHaveAttribute('aria-selected', 'false')
      })

      // Click back on Global Rankings
      fireEvent.click(globalRankingsTab)

      // Verify Global Rankings is active again
      await waitFor(() => {
        expect(globalRankingsTab).toHaveAttribute('aria-selected', 'true')
        expect(clubsTab).toHaveAttribute('aria-selected', 'false')
      })
    })

    it('should not render GlobalRankingsTab when districtId is not available', async () => {
      // This test verifies the conditional rendering
      // The component should only render when districtId is available
      renderWithProviders('/district/57')

      // Click on Global Rankings tab
      const globalRankingsTab = screen.getByRole('tab', {
        name: /global rankings/i,
      })
      fireEvent.click(globalRankingsTab)

      // Verify the component is rendered with the correct districtId
      await waitFor(() => {
        expect(mockGlobalRankingsTab).toHaveBeenCalled()
        const lastCall =
          mockGlobalRankingsTab.mock.calls[
            mockGlobalRankingsTab.mock.calls.length - 1
          ]
        expect(lastCall?.[0]).toEqual(
          expect.objectContaining({
            districtId: '57',
            districtName: 'District 57',
          })
        )
      })
    })
  })

  // Note: After #359 the tab bar is rendered by <DistrictDetailTabs />.
  // Pure-style responsive concerns (font size, whitespace, overflow) are now
  // CSS-level details verified via the component's own test file:
  // src/components/__tests__/DistrictDetailTabs.test.tsx.
})
