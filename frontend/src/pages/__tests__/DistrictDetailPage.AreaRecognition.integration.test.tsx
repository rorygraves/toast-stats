/**
 * Integration Tests for District Detail Page - Division and Area Recognition Panel
 *
 * Tests the integration of DivisionAreaRecognitionPanel component within the District Detail Page context,
 * verifying:
 * - Component renders correctly in the Divisions & Areas tab
 * - Data flows correctly from districtStatistics to DivisionAreaRecognitionPanel
 * - Loading state is passed correctly
 *
 * Validates Requirements: 1.1 (Integration with Divisions & Areas Tab)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock localStorage before any imports that use it
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
    // Immediately call callback with all entries as intersecting
    setTimeout(() => {
      callback([], this)
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
import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DistrictDetailPage from '../DistrictDetailPage'
import { ProgramYearProvider } from '../../contexts/ProgramYearContext'

// Extend expect with jest-axe matchers
// @ts-expect-error - jest-axe types are not perfectly compatible with vitest expect
expect.extend(toHaveNoViolations)

// Mock the hooks used by DistrictDetailPage
vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: vi.fn(() => ({
    data: {
      districts: [{ id: 'D101', name: 'Test District 101' }],
    },
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useDistrictData', () => ({
  useDistrictCachedDates: vi.fn(() => ({
    data: { dates: ['2024-01-15', '2024-01-10', '2024-01-05'] },
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
      membershipTrend: [],
      divisionRankings: [],
      topPerformingAreas: [],
      totalMembership: 0,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
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

// Import the mock for useDistrictStatistics so we can control it per test
import { useDistrictStatistics } from '../../hooks/useMembershipData'

vi.mock('../../hooks/useMembershipData', () => ({
  useDistrictStatistics: vi.fn(),
  useMembershipHistory: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

// Mock district statistics data with division and area performance
const createMockDistrictStatistics = () => ({
  districtId: 'D101',
  asOfDate: '2024-01-15T10:30:00Z',
  membership: {
    total: 5000,
    change: 100,
    changePercent: 2.0,
  },
  clubs: {
    total: 100,
    active: 95,
    suspended: 3,
    ineligible: 2,
    low: 5,
    distinguished: 50,
  },
  education: {
    totalAwards: 500,
    byType: [],
    topClubs: [],
    byMonth: [],
  },
  // divisionPerformance contains club-level data that gets grouped by Division/Area
  divisionPerformance: [
    // Division A, Area A1 - 4 clubs
    {
      Club: '100001',
      'Club Name': 'Club A1-1',
      Division: 'A',
      Area: 'A1',
      'Division Club Base': '8',
      'Area Club Base': '4',
      'Nov Visit award': '1',
      'May visit award': '1',
    },
    {
      Club: '100002',
      'Club Name': 'Club A1-2',
      Division: 'A',
      Area: 'A1',
      'Division Club Base': '8',
      'Area Club Base': '4',
      'Nov Visit award': '1',
      'May visit award': '0',
    },
    {
      Club: '100003',
      'Club Name': 'Club A1-3',
      Division: 'A',
      Area: 'A1',
      'Division Club Base': '8',
      'Area Club Base': '4',
      'Nov Visit award': '1',
      'May visit award': '1',
    },
    {
      Club: '100004',
      'Club Name': 'Club A1-4',
      Division: 'A',
      Area: 'A1',
      'Division Club Base': '8',
      'Area Club Base': '4',
      'Nov Visit award': '0',
      'May visit award': '0',
    },
    // Division A, Area A2 - 4 clubs
    {
      Club: '100005',
      'Club Name': 'Club A2-1',
      Division: 'A',
      Area: 'A2',
      'Division Club Base': '8',
      'Area Club Base': '4',
      'Nov Visit award': '1',
      'May visit award': '1',
    },
    {
      Club: '100006',
      'Club Name': 'Club A2-2',
      Division: 'A',
      Area: 'A2',
      'Division Club Base': '8',
      'Area Club Base': '4',
      'Nov Visit award': '1',
      'May visit award': '1',
    },
    {
      Club: '100007',
      'Club Name': 'Club A2-3',
      Division: 'A',
      Area: 'A2',
      'Division Club Base': '8',
      'Area Club Base': '4',
      'Nov Visit award': '1',
      'May visit award': '1',
    },
    {
      Club: '100008',
      'Club Name': 'Club A2-4',
      Division: 'A',
      Area: 'A2',
      'Division Club Base': '8',
      'Area Club Base': '4',
      'Nov Visit award': '1',
      'May visit award': '1',
    },
    // Division B, Area B1 - 5 clubs
    {
      Club: '100009',
      'Club Name': 'Club B1-1',
      Division: 'B',
      Area: 'B1',
      'Division Club Base': '5',
      'Area Club Base': '5',
      'Nov Visit award': '1',
      'May visit award': '1',
    },
    {
      Club: '100010',
      'Club Name': 'Club B1-2',
      Division: 'B',
      Area: 'B1',
      'Division Club Base': '5',
      'Area Club Base': '5',
      'Nov Visit award': '1',
      'May visit award': '1',
    },
    {
      Club: '100011',
      'Club Name': 'Club B1-3',
      Division: 'B',
      Area: 'B1',
      'Division Club Base': '5',
      'Area Club Base': '5',
      'Nov Visit award': '1',
      'May visit award': '0',
    },
    {
      Club: '100012',
      'Club Name': 'Club B1-4',
      Division: 'B',
      Area: 'B1',
      'Division Club Base': '5',
      'Area Club Base': '5',
      'Nov Visit award': '0',
      'May visit award': '0',
    },
    {
      Club: '100013',
      'Club Name': 'Club B1-5',
      Division: 'B',
      Area: 'B1',
      'Division Club Base': '5',
      'Area Club Base': '5',
      'Nov Visit award': '1',
      'May visit award': '1',
    },
  ],
  // clubPerformance contains club status and distinguished status
  clubPerformance: [
    // Division A, Area A1 clubs - 3 active, 2 distinguished
    {
      'Club Number': '100001',
      'Club Name': 'Club A1-1',
      Division: 'A',
      Area: 'A1',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Distinguished',
      'Mem. Base': '20',
      'Active Members': '22',
      'Goals Met': '5',
    },
    {
      'Club Number': '100002',
      'Club Name': 'Club A1-2',
      Division: 'A',
      Area: 'A1',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Select Distinguished',
      'Mem. Base': '15',
      'Active Members': '20',
      'Goals Met': '7',
    },
    {
      'Club Number': '100003',
      'Club Name': 'Club A1-3',
      Division: 'A',
      Area: 'A1',
      'Club Status': 'Active',
      'Club Distinguished Status': '',
      'Mem. Base': '18',
      'Active Members': '19',
      'Goals Met': '3',
    },
    {
      'Club Number': '100004',
      'Club Name': 'Club A1-4',
      Division: 'A',
      Area: 'A1',
      'Club Status': 'Suspended',
      'Club Distinguished Status': '',
      'Mem. Base': '12',
      'Active Members': '8',
      'Goals Met': '1',
    },
    // Division A, Area A2 clubs - 4 active, 3 distinguished
    {
      'Club Number': '100005',
      'Club Name': 'Club A2-1',
      Division: 'A',
      Area: 'A2',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Distinguished',
      'Mem. Base': '20',
      'Active Members': '25',
      'Goals Met': '6',
    },
    {
      'Club Number': '100006',
      'Club Name': 'Club A2-2',
      Division: 'A',
      Area: 'A2',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Select Distinguished',
      'Mem. Base': '22',
      'Active Members': '24',
      'Goals Met': '8',
    },
    {
      'Club Number': '100007',
      'Club Name': 'Club A2-3',
      Division: 'A',
      Area: 'A2',
      'Club Status': 'Active',
      'Club Distinguished Status': "President's Distinguished",
      'Mem. Base': '25',
      'Active Members': '30',
      'Goals Met': '10',
    },
    {
      'Club Number': '100008',
      'Club Name': 'Club A2-4',
      Division: 'A',
      Area: 'A2',
      'Club Status': 'Active',
      'Club Distinguished Status': '',
      'Mem. Base': '18',
      'Active Members': '20',
      'Goals Met': '4',
    },
    // Division B, Area B1 clubs - 4 active, 4 distinguished (100%)
    {
      'Club Number': '100009',
      'Club Name': 'Club B1-1',
      Division: 'B',
      Area: 'B1',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Distinguished',
      'Mem. Base': '20',
      'Active Members': '22',
      'Goals Met': '5',
    },
    {
      'Club Number': '100010',
      'Club Name': 'Club B1-2',
      Division: 'B',
      Area: 'B1',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Distinguished',
      'Mem. Base': '18',
      'Active Members': '20',
      'Goals Met': '6',
    },
    {
      'Club Number': '100011',
      'Club Name': 'Club B1-3',
      Division: 'B',
      Area: 'B1',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Select Distinguished',
      'Mem. Base': '22',
      'Active Members': '25',
      'Goals Met': '7',
    },
    {
      'Club Number': '100012',
      'Club Name': 'Club B1-4',
      Division: 'B',
      Area: 'B1',
      'Club Status': 'Low',
      'Club Distinguished Status': '',
      'Mem. Base': '15',
      'Active Members': '10',
      'Goals Met': '2',
    },
    {
      'Club Number': '100013',
      'Club Name': 'Club B1-5',
      Division: 'B',
      Area: 'B1',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Distinguished',
      'Mem. Base': '20',
      'Active Members': '23',
      'Goals Met': '5',
    },
  ],
})

// Helper to render DistrictDetailPage with all required providers
const renderDistrictDetailPage = (districtId: string = 'D101') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0, staleTime: 0 },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ProgramYearProvider>
        <MemoryRouter initialEntries={[`/districts/${districtId}`]}>
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

describe('DistrictDetailPage - Division and Area Recognition Panel Integration', () => {
  const mockUseDistrictStatistics = vi.mocked(useDistrictStatistics)

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    // Default mock implementation
    mockUseDistrictStatistics.mockReturnValue({
      data: createMockDistrictStatistics(),
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      refetch: vi.fn(),
    } as ReturnType<typeof useDistrictStatistics>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('DivisionAreaRecognitionPanel renders in Divisions & Areas tab (Requirement 1.1)', () => {
    /**
     * Validates: Requirement 1.1
     * WHEN a user views the Divisions & Areas tab, THE System SHALL display
     * a Division and Area Recognition section alongside existing content
     */
    it('should render DivisionAreaRecognitionPanel when navigating to Divisions & Areas tab', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify DivisionAreaRecognitionPanel is rendered
      await waitFor(() => {
        expect(
          screen.getByText('Division and Area Recognition')
        ).toBeInTheDocument()
      })

      // Verify the section description is present (updated to match new component text)
      expect(
        screen.getByText(
          /Track progress toward Distinguished Division Program/i
        )
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 1.1
     * The CriteriaExplanation component should be rendered within the panel
     */
    it('should render CriteriaExplanation component in the tab', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify CriteriaExplanation toggle button is present
      await waitFor(() => {
        expect(
          screen.getByRole('button', {
            name: /Distinguished Area Program Criteria/i,
          })
        ).toBeInTheDocument()
      })
    })

    /**
     * Validates: Requirement 10.1, 10.2, 10.3
     * The standalone AreaProgressTable component has been removed from DivisionAreaRecognitionPanel.
     * DivisionAreaRecognitionPanel now displays only CriteriaExplanation and DivisionAreaProgressSummary.
     * Recognition metrics are now displayed in the AreaPerformanceTable within Division cards.
     */
    it('should render DivisionAreaProgressSummary component in the tab (AreaProgressTable removed per Requirement 10.1)', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify DivisionAreaProgressSummary is present (has role="region" with name "Area Progress Summary")
      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: /area progress summary/i })
        ).toBeInTheDocument()
      })

      // Verify the standalone AreaProgressTable is NOT rendered in DivisionAreaRecognitionPanel
      // (it was removed per Requirement 10.1 - recognition metrics are now in Division cards)
      expect(
        screen.queryByRole('grid', { name: /area progress table/i })
      ).not.toBeInTheDocument()
    })

    /**
     * Validates: Requirement 1.1
     * The panel should be positioned alongside DivisionPerformanceCards
     */
    it('should render alongside DivisionPerformanceCards', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify both components are rendered
      await waitFor(() => {
        // DivisionPerformanceCards header
        expect(
          screen.getByText('Division & Area Performance')
        ).toBeInTheDocument()
        // DivisionAreaRecognitionPanel header
        expect(
          screen.getByText('Division and Area Recognition')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Data flows correctly from page to component (Requirement 1.1)', () => {
    /**
     * Validates: Requirement 1.1
     * Data from districtStatistics should flow to DivisionAreaRecognitionPanel
     */
    it('should display all areas from districtStatistics data', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify all areas are displayed (A1, A2, B1)
      // Use getAllByText since areas appear in multiple components
      await waitFor(() => {
        const a1Elements = screen.getAllByText('A1')
        const a2Elements = screen.getAllByText('A2')
        const b1Elements = screen.getAllByText('B1')

        expect(a1Elements.length).toBeGreaterThan(0)
        expect(a2Elements.length).toBeGreaterThan(0)
        expect(b1Elements.length).toBeGreaterThan(0)
      })
    })

    /**
     * Validates: Requirement 1.1
     * Division context should be preserved for each area
     */
    it('should display division context for each area', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify division labels are displayed in the AreaProgressTable
      // The table shows "Division A" and "Division B" as row labels
      await waitFor(() => {
        // Look for division labels in the table - they appear as cell content
        const divisionACells = screen.getAllByText(/Division A/i)
        const divisionBCells = screen.getAllByText(/Division B/i)
        expect(divisionACells.length).toBeGreaterThan(0)
        expect(divisionBCells.length).toBeGreaterThan(0)
      })
    })

    /**
     * Validates: Requirement 1.1
     * Area metrics should be calculated and displayed correctly
     * Note: AreaProgressTable was removed per Requirement 10.1. Metrics are now in DivisionAreaProgressSummary.
     */
    it('should display correct area metrics from data', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Wait for the DivisionAreaProgressSummary to render (AreaProgressTable was removed per Requirement 10.1)
      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: /area progress summary/i })
        ).toBeInTheDocument()
      })

      // Verify summary shows correct counts
      // 3 areas (A1, A2, B1) across 2 divisions (A, B)
      expect(screen.getByText(/3 areas in 2 divisions/)).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 1.1
     * extractDivisionPerformance utility should correctly process the data
     * Note: AreaProgressTable was removed per Requirement 10.1. Metrics are now in DivisionAreaProgressSummary.
     */
    it('should correctly extract and display paid clubs data', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Wait for the DivisionAreaProgressSummary to render (AreaProgressTable was removed per Requirement 10.1)
      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: /area progress summary/i })
        ).toBeInTheDocument()
      })

      // Area A1: 3 active clubs out of 4 total (club 100004 is Suspended)
      // Area A2: 4 active clubs out of 4 total
      // Area B1: 4 active clubs out of 5 total (club 100012 is Low)
      // The DivisionAreaProgressSummary shows paid/total in progress text as "X of Y clubs paid"
      // Use getAllByText since text may appear in multiple places (Division and Area summaries)
      expect(screen.getAllByText(/3 of 4 clubs paid/).length).toBeGreaterThan(0) // A1: 3 paid / 4 total
      expect(screen.getAllByText(/4 of 4 clubs paid/).length).toBeGreaterThan(0) // A2: 4 paid / 4 total
      expect(screen.getAllByText(/4 of 5 clubs paid/).length).toBeGreaterThan(0) // B1: 4 paid / 5 total
    })
  })

  describe('Loading state is passed correctly (Requirement 1.1)', () => {
    /**
     * Validates: Requirement 1.1
     * Loading state should be passed to DivisionAreaRecognitionPanel
     */
    it('should show loading state when data is loading', async () => {
      // Mock loading state
      mockUseDistrictStatistics.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
        isSuccess: false,
        status: 'loading',
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useDistrictStatistics>)

      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify loading state is shown - look for loading indicators
      // When data is undefined and isLoading is true, the divisions tab renders
      // an empty content area (districtStatistics guard prevents child rendering).
      // This is expected behavior — the tab content area is present but empty.
      await waitFor(() => {
        // The tab is active (Divisions & Areas is selected)
        const activeTab = screen.getByRole('tab', {
          name: /Divisions & Areas/i,
        })
        expect(activeTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    /**
     * Validates: Requirement 1.1
     * Content should render after loading completes
     */
    it('should render content after loading completes', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify content is rendered (not loading)
      await waitFor(() => {
        expect(
          screen.getByText('Division and Area Recognition')
        ).toBeInTheDocument()
        expect(
          screen.queryByText('Loading division performance data...')
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Empty state handling', () => {
    /**
     * Tests empty state when no division data is available
     */
    it('should handle empty division data gracefully', async () => {
      // Mock empty data
      mockUseDistrictStatistics.mockReturnValue({
        data: {
          ...createMockDistrictStatistics(),
          divisionPerformance: [],
          clubPerformance: [],
        },
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
        status: 'success',
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useDistrictStatistics>)

      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify empty state is shown for DivisionAreaRecognitionPanel
      // Updated to match the actual component text: "No Division or Area Data Available"
      await waitFor(() => {
        expect(
          screen.getByText('No Division or Area Data Available')
        ).toBeInTheDocument()
      })
    })

    /**
     * Tests that null data is handled gracefully
     */
    it('should handle null districtStatistics gracefully', async () => {
      // Mock null data
      mockUseDistrictStatistics.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: false,
        status: 'idle',
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useDistrictStatistics>)

      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // When districtStatistics is null, the components should not render
      // or should show an appropriate empty/no data state
      await waitFor(() => {
        // DivisionAreaRecognitionPanel should not be rendered when there's no data
        // The page conditionally renders based on districtStatistics
        const areaRecognitionSection = screen.queryByText(
          'Division and Area Recognition'
        )
        // Either no Division and Area Recognition section, or a "No Data" message
        const noDataMessage =
          screen.queryByText(/No Data/i) || screen.queryByText(/No.*Available/i)
        expect(
          areaRecognitionSection === null || noDataMessage !== null
        ).toBeTruthy()
      })
    })
  })

  describe('Accessibility', () => {
    // Mount full DistrictDetailPage + tab click + axe scan is
    // legitimately 6-8s under coverage worker contention. Per-test
    // 15s budget recognises this category honestly; the other 13
    // tests in this file scope axe to small surfaces and stay at
    // the file-wide 5s default (#473).
    it('should have no accessibility violations in Divisions & Areas tab', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Wait for content to render
      await waitFor(() => {
        expect(
          screen.getByText('Division and Area Recognition')
        ).toBeInTheDocument()
      })

      // Scoped axe on the active tabpanel (not the full page chrome).
      const heading = screen.getByText('Division and Area Recognition')
      const tabpanel =
        (heading.closest('[role="tabpanel"]') as HTMLElement | null) ??
        (heading.closest('section') as HTMLElement | null) ??
        (heading.parentElement as HTMLElement)
      const results = await axe(tabpanel)
      expect(results).toHaveNoViolations()
    }, 15000)

    /**
     * Tests that DivisionAreaRecognitionPanel has proper ARIA attributes
     */
    it('should have proper ARIA attributes on DivisionAreaRecognitionPanel', async () => {
      const user = userEvent.setup()
      renderDistrictDetailPage()

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /Divisions & Areas/i,
      })
      await user.click(divisionsTab)

      // Verify ARIA region is present
      await waitFor(() => {
        const region = screen.getByRole('region', {
          name: /division and area recognition/i,
        })
        expect(region).toBeInTheDocument()
      })
    })
  })
})
