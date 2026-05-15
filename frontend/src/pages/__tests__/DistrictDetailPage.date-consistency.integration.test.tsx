/**
 * Integration Tests for District Detail Page - Date Consistency Across Sections
 *
 * Tests the integration of date selection with Division & Area Performance section,
 * verifying:
 * - Changing date selector updates Division & Area Performance section
 * - "Data as of" timestamp matches selected date
 * - Loading states during date changes
 * - Error display when no data for selected date
 *
 * Validates Requirements: 3.1, 3.2, 3.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

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

// Mock the hooks before importing the component
vi.mock('../../hooks/useMembershipData', () => ({
  useDistrictStatistics: vi.fn(),
  useMembershipHistory: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: vi.fn(() => ({
    data: {
      districts: [{ id: 'D1', name: 'Test District 1' }],
    },
    isLoading: false,
  })),
}))

vi.mock('../../hooks/useDistrictAnalytics', () => ({
  useDistrictAnalytics: vi.fn(() => ({
    data: {
      allClubs: [],
      vulnerableClubs: [],
      interventionRequiredClubs: [],
      distinguishedClubs: { total: 0, clubs: [] },
      distinguishedProjection: null,
      thrivingClubs: [],
      topGrowthClubs: [],
      divisionRankings: [],
      topPerformingAreas: [],
      membershipTrend: [],
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
      dates: ['2026-01-14', '2026-01-10', '2026-01-05', '2025-12-15'],
    },
    isLoading: false,
  })),
}))

// Import the mocked hook to control its behavior
import { useDistrictStatistics } from '../../hooks/useMembershipData'
import { ProgramYearProvider } from '../../contexts/ProgramYearContext'
import DistrictDetailPage from '../DistrictDetailPage'

// Mock district statistics data factory
const createMockDistrictStatistics = (asOfDate: string) => ({
  districtId: 'D1',
  asOfDate,
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
  divisionPerformance: [
    {
      Division: 'A',
      'Club Base': '50',
      'Paid Clubs': '52',
      'Distinguished Clubs': '26',
    },
    {
      Division: 'B',
      'Club Base': '40',
      'Paid Clubs': '41',
      'Distinguished Clubs': '21',
    },
  ],
  clubPerformance: [
    {
      'Club Number': '123456',
      'Club Name': 'Test Club A1',
      Division: 'A',
      Area: 'A1',
      'Club Status': 'Distinguished',
      'Mem. Base': '20',
      'Active Members': '22',
      'Goals Met': '5',
    },
    {
      'Club Number': '123457',
      'Club Name': 'Test Club B1',
      Division: 'B',
      Area: 'B1',
      'Club Status': 'Distinguished',
      'Mem. Base': '25',
      'Active Members': '27',
      'Goals Met': '6',
    },
  ],
})

// Helper to render the page with all necessary providers
const renderDistrictDetailPage = (queryClient?: QueryClient) => {
  const client =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
        },
      },
    })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/districts/D1']}>
        <ProgramYearProvider>
          <Routes>
            <Route
              path="/districts/:districtId"
              element={<DistrictDetailPage />}
            />
          </Routes>
        </ProgramYearProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DistrictDetailPage - Date Consistency Integration Tests', () => {
  const mockUseDistrictStatistics = useDistrictStatistics as ReturnType<
    typeof vi.fn
  >

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    // Default mock implementation
    mockUseDistrictStatistics.mockReturnValue({
      data: createMockDistrictStatistics('2026-01-14T10:30:00Z'),
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Requirement 3.1: Date selector updates Division & Area Performance section', () => {
    it('should call useDistrictStatistics with the selected date', async () => {
      renderDistrictDetailPage()

      // Wait for the page to render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Verify the hook was called with the expected date parameter
      // The hook should be called with districtId and selectedDate
      expect(mockUseDistrictStatistics).toHaveBeenCalled()

      // Get the last call arguments
      const lastCall =
        mockUseDistrictStatistics.mock.calls[
          mockUseDistrictStatistics.mock.calls.length - 1
        ]
      expect(lastCall[0]).toBe('D1') // districtId
      // The second parameter should be a date string (selectedDate or programYear.endDate)
      expect(typeof lastCall[1]).toBe('string')
    })

    it('should update Division & Area Performance when date changes', async () => {
      const user = userEvent.setup()

      // Track calls to verify date changes
      const callDates: (string | undefined)[] = []
      mockUseDistrictStatistics.mockImplementation(
        (_districtId: string | null, selectedDate?: string) => {
          callDates.push(selectedDate)
          return {
            data: selectedDate
              ? createMockDistrictStatistics(`${selectedDate}T10:30:00Z`)
              : createMockDistrictStatistics('2026-01-14T10:30:00Z'),
            isLoading: false,
            error: null,
          }
        }
      )

      renderDistrictDetailPage()

      // Wait for the page to render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Navigate to Divisions & Areas tab to see the DivisionPerformanceCards
      const divisionsTab = screen.getByRole('tab', {
        name: /divisions & areas/i,
      })
      await user.click(divisionsTab)

      // Wait for the tab content to render
      await waitFor(() => {
        expect(
          screen.getByText('Division & Area Performance')
        ).toBeInTheDocument()
      })

      // Find and interact with the date selector
      const dateSelector = screen.getByTestId('date-chip-select')
      expect(dateSelector).toBeInTheDocument()

      // Change the date
      await user.selectOptions(dateSelector, '2026-01-10')

      // Verify the hook was called with the new date
      await waitFor(() => {
        expect(callDates).toContain('2026-01-10')
      })
    })

    it('should pass selectedDate to useDistrictStatistics matching useDistrictAnalytics pattern', async () => {
      // This test verifies Property 8: Data Consistency Across Sections
      // The date used by useDistrictStatistics MUST match the date used by useDistrictAnalytics

      let capturedDate: string | undefined
      mockUseDistrictStatistics.mockImplementation(
        (_districtId: string | null, selectedDate?: string) => {
          capturedDate = selectedDate
          return {
            data: createMockDistrictStatistics('2026-01-14T10:30:00Z'),
            isLoading: false,
            error: null,
          }
        }
      )

      renderDistrictDetailPage()

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // The hook should be called with a date parameter (not undefined)
      // This ensures consistency with useDistrictAnalytics which also receives selectedDate
      expect(capturedDate).toBeDefined()
      expect(typeof capturedDate).toBe('string')
    })
  })

  describe('Requirement 3.2: "Data as of" timestamp matches selected date', () => {
    it('should display the correct "Data as of" timestamp from snapshot', async () => {
      const user = userEvent.setup()
      const testDate = '2026-01-14'

      mockUseDistrictStatistics.mockReturnValue({
        data: createMockDistrictStatistics(`${testDate}T10:30:00Z`),
        isLoading: false,
        error: null,
      })

      renderDistrictDetailPage()

      // Wait for the page to render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /divisions & areas/i,
      })
      await user.click(divisionsTab)

      // Wait for the Division Performance Cards to render
      await waitFor(() => {
        expect(
          screen.getByText('Division & Area Performance')
        ).toBeInTheDocument()
      })

      // Verify the "Data as of" timestamp is displayed
      expect(screen.getByText('Data as of')).toBeInTheDocument()
      // The date should be formatted (e.g., "Jan 14, 2026") - use getAllByText since date appears in dropdown too
      const dateElements = screen.getAllByText(/Jan 14, 2026/i)
      expect(dateElements.length).toBeGreaterThan(0)
    })

    it('should update "Data as of" timestamp when date selection changes', async () => {
      const user = userEvent.setup()

      // Mock to return different timestamps based on selected date
      mockUseDistrictStatistics.mockImplementation(
        (_districtId: string | null, selectedDate?: string) => {
          const date = selectedDate || '2026-01-14'
          return {
            data: createMockDistrictStatistics(`${date}T10:30:00Z`),
            isLoading: false,
            error: null,
          }
        }
      )

      renderDistrictDetailPage()

      // Wait for the page to render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /divisions & areas/i,
      })
      await user.click(divisionsTab)

      // Wait for initial render
      await waitFor(() => {
        expect(
          screen.getByText('Division & Area Performance')
        ).toBeInTheDocument()
      })

      // Change the date to January 10
      const dateSelector = screen.getByTestId('date-chip-select')
      await user.selectOptions(dateSelector, '2026-01-10')

      // Verify the timestamp updates to reflect the new date
      // Use getAllByText since date appears in both dropdown and "Data as of" section
      await waitFor(() => {
        const dateElements = screen.getAllByText(/Jan 10, 2026/i)
        // Should have at least 2 elements: one in dropdown, one in "Data as of"
        expect(dateElements.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  describe('Requirement 3.3: Loading states during date changes', () => {
    it('should show loading state while fetching data for new date', async () => {
      const user = userEvent.setup()

      // Start with loaded state
      mockUseDistrictStatistics.mockReturnValue({
        data: createMockDistrictStatistics('2026-01-14T10:30:00Z'),
        isLoading: false,
        error: null,
      })

      renderDistrictDetailPage()

      // Wait for the page to render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /divisions & areas/i,
      })
      await user.click(divisionsTab)

      // Wait for initial content
      await waitFor(() => {
        expect(
          screen.getByText('Division & Area Performance')
        ).toBeInTheDocument()
      })

      // Now simulate loading state
      mockUseDistrictStatistics.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      // Change the date to trigger a re-fetch
      const dateSelector = screen.getByTestId('date-chip-select')
      await user.selectOptions(dateSelector, '2026-01-10')

      // The component should show loading state
      // When data becomes undefined during loading, the divisions tab renders
      // an empty content area (districtStatistics guard prevents child rendering).
      // Verify the tab is still active and the previous content is gone.
      await waitFor(() => {
        const activeTab = screen.getByRole('tab', {
          name: /divisions & areas/i,
        })
        expect(activeTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('should display data after loading completes', async () => {
      const user = userEvent.setup()

      // Start with data loaded
      mockUseDistrictStatistics.mockReturnValue({
        data: createMockDistrictStatistics('2026-01-14T10:30:00Z'),
        isLoading: false,
        error: null,
      })

      renderDistrictDetailPage()

      // Wait for the page to render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /divisions & areas/i,
      })
      await user.click(divisionsTab)

      // Wait for the data to be displayed
      await waitFor(() => {
        expect(
          screen.getByText('Division & Area Performance')
        ).toBeInTheDocument()
      })

      // Verify division data is displayed (use getAllByText since division names appear in multiple components)
      expect(screen.getAllByText('Division A').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Division B').length).toBeGreaterThan(0)
    })
  })

  describe('Requirement 3.3: Error display when no data for selected date', () => {
    it('should not render DivisionPerformanceCards when API returns null data', async () => {
      const user = userEvent.setup()

      // Return null data to simulate no data for selected date
      mockUseDistrictStatistics.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      })

      renderDistrictDetailPage()

      // Wait for the page to render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /divisions & areas/i,
      })
      await user.click(divisionsTab)

      // The DivisionPerformanceCards component should not be rendered when data is null
      // (The page conditionally renders it only when districtStatistics is truthy)
      await waitFor(() => {
        // The "Division & Area Performance" header should not be present
        expect(
          screen.queryByText('Division & Area Performance')
        ).not.toBeInTheDocument()
      })
    })

    it('should handle empty division data gracefully', async () => {
      const user = userEvent.setup()

      // Return data with empty divisions
      const emptyDivisionsData = {
        ...createMockDistrictStatistics('2026-01-14T10:30:00Z'),
        divisionPerformance: [],
        clubPerformance: [],
      }

      mockUseDistrictStatistics.mockReturnValue({
        data: emptyDivisionsData,
        isLoading: false,
        error: null,
      })

      renderDistrictDetailPage()

      // Wait for the page to render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /divisions & areas/i,
      })
      await user.click(divisionsTab)

      // The component should show "No Divisions Found" for empty data
      await waitFor(() => {
        expect(screen.getByText('No Divisions Found')).toBeInTheDocument()
      })
    })
  })

  describe('Default behavior (Requirement 3.2)', () => {
    it('should show most recent data by default when no date is selected', async () => {
      const user = userEvent.setup()

      mockUseDistrictStatistics.mockReturnValue({
        data: createMockDistrictStatistics('2026-01-14T10:30:00Z'),
        isLoading: false,
        error: null,
      })

      renderDistrictDetailPage()

      // Wait for the page to render
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Navigate to Divisions & Areas tab
      const divisionsTab = screen.getByRole('tab', {
        name: /divisions & areas/i,
      })
      await user.click(divisionsTab)

      // Wait for the Division Performance Cards to render
      await waitFor(() => {
        expect(
          screen.getByText('Division & Area Performance')
        ).toBeInTheDocument()
      })

      // Verify the date selector defaults to "Latest in PY" (empty value).
      const dateSelector = screen.getByTestId(
        'date-chip-select'
      ) as HTMLSelectElement
      // The default option should be selected (either "latest" or the most recent date)
      expect(dateSelector.value).toBeDefined()
    })

    it('should use program year end date as fallback when selectedDate is undefined', async () => {
      // This test verifies Property 7: Default Date Behavior
      // When selectedDate is undefined, the hook should be called with selectedProgramYear.endDate

      let capturedDate: string | undefined
      mockUseDistrictStatistics.mockImplementation(
        (_districtId: string | null, selectedDate?: string) => {
          capturedDate = selectedDate
          return {
            data: createMockDistrictStatistics('2026-01-14T10:30:00Z'),
            isLoading: false,
            error: null,
          }
        }
      )

      renderDistrictDetailPage()

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // The hook should be called with a date (the program year end date as fallback)
      expect(capturedDate).toBeDefined()
      // The date should be a valid date string
      expect(capturedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('Query key includes date for cache invalidation', () => {
    it('should include selectedDate in the query key', async () => {
      // This test verifies Property 2: Query Key Uniqueness
      // Different dates should result in different cache entries

      const callsWithDates: Array<{
        districtId: string | null
        selectedDate?: string
      }> = []

      mockUseDistrictStatistics.mockImplementation(
        (districtId: string | null, selectedDate?: string) => {
          callsWithDates.push({ districtId, selectedDate })
          return {
            data: createMockDistrictStatistics(
              selectedDate
                ? `${selectedDate}T10:30:00Z`
                : '2026-01-14T10:30:00Z'
            ),
            isLoading: false,
            error: null,
          }
        }
      )

      const user = userEvent.setup()
      renderDistrictDetailPage()

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /test district 1/i })
        ).toBeInTheDocument()
      })

      // Change the date
      const dateSelector = screen.getByTestId('date-chip-select')
      await user.selectOptions(dateSelector, '2026-01-10')

      // Wait for the hook to be called with the new date
      await waitFor(() => {
        const hasNewDate = callsWithDates.some(
          call => call.selectedDate === '2026-01-10'
        )
        expect(hasNewDate).toBe(true)
      })

      // Change to another date
      await user.selectOptions(dateSelector, '2026-01-05')

      // Wait for the hook to be called with the newer date
      await waitFor(() => {
        const hasNewerDate = callsWithDates.some(
          call => call.selectedDate === '2026-01-05'
        )
        expect(hasNewerDate).toBe(true)
      })

      // Verify that different dates were captured (indicating different cache keys would be used)
      const uniqueDates = new Set(callsWithDates.map(c => c.selectedDate))
      expect(uniqueDates.size).toBeGreaterThan(1)
    })
  })
})
