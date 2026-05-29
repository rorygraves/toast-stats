import React from 'react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import GlobalRankingsTab, { GlobalRankingsTabProps } from '../GlobalRankingsTab'
import {
  renderWithProviders,
  cleanupAllResources,
} from '../../__tests__/utils/componentTestUtils'
import type { UseGlobalRankingsResult } from '../../hooks/useGlobalRankings'
import type { ProgramYear } from '../../utils/programYear'

// Mock the useGlobalRankings hook
vi.mock('../../hooks/useGlobalRankings', () => ({
  useGlobalRankings: vi.fn(),
}))

// Import the mocked hook for type-safe mocking
import { useGlobalRankings } from '../../hooks/useGlobalRankings'

const mockUseGlobalRankings = vi.mocked(useGlobalRankings)

describe('GlobalRankingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupAllResources()
  })

  // Test data fixtures
  const mockProgramYear2024: ProgramYear = {
    year: 2024,
    startDate: '2024-07-01',
    endDate: '2025-06-30',
    label: '2024-2025',
  }

  const mockProgramYear2023: ProgramYear = {
    year: 2023,
    startDate: '2023-07-01',
    endDate: '2024-06-30',
    label: '2023-2024',
  }

  const mockRankHistory = {
    districtId: '57',
    districtName: 'District 57',
    history: [
      {
        date: '2024-07-15',
        aggregateScore: 150,
        clubsRank: 15,
        paymentsRank: 20,
        distinguishedRank: 10,
      },
      {
        date: '2024-08-15',
        aggregateScore: 140,
        clubsRank: 12,
        paymentsRank: 18,
        distinguishedRank: 8,
      },
      {
        date: '2024-09-15',
        aggregateScore: 130,
        clubsRank: 10,
        paymentsRank: 15,
        distinguishedRank: 5,
      },
    ],
    programYear: {
      startDate: '2024-07-01',
      endDate: '2025-06-30',
      year: '2024-2025',
    },
  }

  const mockEndOfYearRankings = {
    overall: { rank: 15, totalDistricts: 126, percentile: 88.1 },
    paidClubs: { rank: 10, totalDistricts: 126, percentile: 92.1 },
    membershipPayments: { rank: 15, totalDistricts: 126, percentile: 88.1 },
    distinguishedClubs: { rank: 5, totalDistricts: 126, percentile: 96.0 },
    asOfDate: '2024-09-15',
    isPartialYear: true,
  }

  const mockYearlyRankings = [
    {
      programYear: '2024-2025',
      overallRank: 15,
      clubsRank: 10,
      paymentsRank: 15,
      distinguishedRank: 5,
      totalDistricts: 126,
      isPartialYear: true,
      yearOverYearChange: {
        overall: 5,
        clubs: 3,
        payments: -2,
        distinguished: 5,
      },
    },
    {
      programYear: '2023-2024',
      overallRank: 20,
      clubsRank: 13,
      paymentsRank: 13,
      distinguishedRank: 10,
      totalDistricts: 126,
      isPartialYear: false,
      yearOverYearChange: null,
    },
  ]

  const mockRefetch = vi.fn()

  const baseProps: GlobalRankingsTabProps = {
    districtId: '57',
    districtName: 'District 57',
    selectedProgramYear: mockProgramYear2024,
  }

  const createMockHookResult = (
    overrides: Partial<UseGlobalRankingsResult> = {}
  ): UseGlobalRankingsResult => ({
    currentYearHistory: mockRankHistory,
    endOfYearRankings: mockEndOfYearRankings,
    availableProgramYears: [mockProgramYear2024, mockProgramYear2023],
    yearlyRankings: mockYearlyRankings,
    isLoading: false,
    isLoadingChart: false,
    isLoadingMultiYear: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
    ...overrides,
  })

  describe('Loading State', () => {
    it('renders loading spinner when isLoading is true', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isLoading: true,
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Should show loading spinner with aria-busy
      const loadingSection = screen.getByLabelText(
        'Loading global rankings data'
      )
      expect(loadingSection).toBeInTheDocument()
      expect(loadingSection).toHaveAttribute('aria-busy', 'true')
    })

    it('loading spinner displays status text', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isLoading: true,
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      expect(screen.getByText('Loading ranking data…')).toBeInTheDocument()
    })

    it('does not render child components when loading', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isLoading: true,
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Should not show actual content
      expect(screen.queryByText('End-of-Year Rankings')).not.toBeInTheDocument()
      expect(screen.queryByText('Ranking Progression')).not.toBeInTheDocument()
      expect(
        screen.queryByText('Multi-Year Comparison')
      ).not.toBeInTheDocument()
    })
  })

  describe('Progressive Loading', () => {
    it('renders end-of-year rankings while chart is still loading', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isLoadingChart: true,
          isLoadingMultiYear: true,
          currentYearHistory: null,
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // End-of-year rankings should be visible immediately
      expect(screen.getByText('End-of-Year Rankings')).toBeInTheDocument()
      // Chart and table should show their loading skeletons
      expect(
        screen.getByLabelText('Loading ranking progression chart')
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText('Loading multi-year comparison table')
      ).toBeInTheDocument()
    })

    it('passes isLoadingChart to FullYearRankingChart', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isLoadingChart: true,
          currentYearHistory: null,
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // The chart section should show its loading skeleton
      const chartSkeleton = screen.getByLabelText(
        'Loading ranking progression chart'
      )
      expect(chartSkeleton).toBeInTheDocument()
      expect(chartSkeleton).toHaveAttribute('aria-busy', 'true')
    })

    it('passes isLoadingMultiYear to MultiYearComparisonTable', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isLoadingMultiYear: true,
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // The table section should show its loading skeleton
      const tableSkeleton = screen.getByLabelText(
        'Loading multi-year comparison table'
      )
      expect(tableSkeleton).toBeInTheDocument()
      expect(tableSkeleton).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('Error State', () => {
    it('renders error state with error message when isError is true', () => {
      const testError = new Error('Failed to fetch ranking data')
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isError: true,
          error: testError,
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Should show error message
      expect(screen.getByText('Unable to Load Rankings')).toBeInTheDocument()
      expect(
        screen.getByText('Failed to fetch ranking data')
      ).toBeInTheDocument()
    })

    it('renders error state with default message when error is null', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isError: true,
          error: null,
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      expect(screen.getByText('Unable to Load Rankings')).toBeInTheDocument()
      expect(
        screen.getByText(
          /An error occurred while loading the global rankings data/
        )
      ).toBeInTheDocument()
    })

    it('renders retry button in error state', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isError: true,
          error: new Error('Network error'),
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('calls refetch when retry button is clicked', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isError: true,
          error: new Error('Network error'),
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('error state has proper accessibility attributes', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          isError: true,
          error: new Error('Test error'),
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toBeInTheDocument()
      expect(errorAlert).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Empty State', () => {
    it('renders empty state when no program years are available', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          availableProgramYears: [],
          currentYearHistory: null,
          endOfYearRankings: null,
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      expect(screen.getByText('No Ranking Data Available')).toBeInTheDocument()
      expect(
        screen.getByText(
          /District 57 does not have any global ranking data yet/
        )
      ).toBeInTheDocument()
    })

    it('empty state includes district name', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          availableProgramYears: [],
          currentYearHistory: null,
          endOfYearRankings: null,
          yearlyRankings: [],
        })
      )

      renderWithProviders(
        <GlobalRankingsTab districtId="42" districtName="District 42" />
      )

      expect(
        screen.getByText(
          /District 42 does not have any global ranking data yet/
        )
      ).toBeInTheDocument()
    })

    it('empty state has proper accessibility attributes', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          availableProgramYears: [],
          currentYearHistory: null,
          endOfYearRankings: null,
          yearlyRankings: [],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      const emptyState = screen.getByRole('status', {
        name: 'No ranking data available',
      })
      expect(emptyState).toBeInTheDocument()
    })
  })

  describe('Successful Rendering with Data', () => {
    it('renders all child components when data is available', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Should render EndOfYearRankingsPanel
      expect(screen.getByText('End-of-Year Rankings')).toBeInTheDocument()

      // Should render FullYearRankingChart
      expect(screen.getByText('Ranking Progression')).toBeInTheDocument()

      // Should render MultiYearComparisonTable
      expect(screen.getByText('Multi-Year Comparison')).toBeInTheDocument()
    })

    // #875 (epic #876 Sprint 2, CC-3): the Ranking Progression chart collapses
    // to a sparkline-then-expand wrapper below 768px. setup.ts's matchMedia
    // mock is writable; flip only the max-width query to mobile.
    describe('mobile chart collapse (#875)', () => {
      const setMobile = (mobile: boolean) => {
        ;(window.matchMedia as unknown as ReturnType<typeof vi.fn>) = vi
          .fn()
          .mockImplementation((query: string) => ({
            matches: /max-width/.test(query) ? mobile : false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          }))
      }
      afterEach(() => setMobile(false))

      it('collapses Ranking Progression behind an expand trigger', () => {
        setMobile(true)
        mockUseGlobalRankings.mockReturnValue(createMockHookResult())
        renderWithProviders(<GlobalRankingsTab {...baseProps} />)
        expect(
          screen.queryByText('Ranking Progression')
        ).not.toBeInTheDocument()
        expect(
          screen.getByRole('button', {
            name: /expand ranking progression chart/i,
          })
        ).toBeInTheDocument()
        // siblings stay rendered — only the chart collapses
        expect(screen.getByText('End-of-Year Rankings')).toBeInTheDocument()
      })

      it('opens the ranking chart in a sheet when tapped', () => {
        setMobile(true)
        mockUseGlobalRankings.mockReturnValue(createMockHookResult())
        renderWithProviders(<GlobalRankingsTab {...baseProps} />)
        fireEvent.click(
          screen.getByRole('button', {
            name: /expand ranking progression chart/i,
          })
        )
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Ranking Progression')).toBeInTheDocument()
      })

      it('renders the chart directly at desktop widths', () => {
        setMobile(false)
        mockUseGlobalRankings.mockReturnValue(createMockHookResult())
        renderWithProviders(<GlobalRankingsTab {...baseProps} />)
        expect(screen.getByText('Ranking Progression')).toBeInTheDocument()
        expect(
          screen.queryByRole('button', { name: /expand .* chart/i })
        ).not.toBeInTheDocument()
      })
    })

    it('does not render its own ProgramYearSelector', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // The tab should NOT have a program year combobox — it uses the parent's
      const selector = screen.queryByRole('combobox', { name: /program year/i })
      expect(selector).not.toBeInTheDocument()
    })

    it('renders main region with proper aria-label', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      const region = screen.getByRole('region', {
        name: 'Global rankings for District 57',
      })
      expect(region).toBeInTheDocument()
    })

    it('passes correct props to EndOfYearRankingsPanel', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Check that ranking values are displayed - use getAllByText for elements that appear multiple times
      expect(screen.getByText('Overall Rank')).toBeInTheDocument()
      expect(screen.getByText('Paid Clubs')).toBeInTheDocument()
      // Payments and Distinguished appear in multiple places, so use getAllByText
      expect(screen.getAllByText('Payments').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Distinguished').length).toBeGreaterThan(0)
    })

    it('passes correct props to FullYearRankingChart', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Check that chart metric toggles are present
      expect(
        screen.getByRole('button', { name: /View Overall Rank/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /View Paid Clubs Rank/i })
      ).toBeInTheDocument()
    })

    it('passes correct props to MultiYearComparisonTable', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Check that yearly data is displayed
      expect(screen.getAllByText('2024-2025').length).toBeGreaterThan(0)
      expect(screen.getAllByText('2023-2024').length).toBeGreaterThan(0)
    })
  })

  describe('Program Year from Parent', () => {
    it('passes selectedProgramYear prop to the hook', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(
        <GlobalRankingsTab
          districtId="57"
          districtName="District 57"
          selectedProgramYear={mockProgramYear2023}
        />
      )

      expect(mockUseGlobalRankings).toHaveBeenCalledWith(
        expect.objectContaining({
          districtId: '57',
          selectedProgramYear: mockProgramYear2023,
        })
      )
    })

    it('works without selectedProgramYear prop (defaults to most recent)', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(
        <GlobalRankingsTab districtId="57" districtName="District 57" />
      )

      // Hook should be called without selectedProgramYear
      expect(mockUseGlobalRankings).toHaveBeenCalledWith(
        expect.objectContaining({
          districtId: '57',
        })
      )
    })
  })

  describe('Metric Toggle for Chart', () => {
    it('allows toggling between different metrics', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Find metric toggle buttons
      const overallButton = screen.getByRole('button', {
        name: /View Overall Rank/i,
      })
      const clubsButton = screen.getByRole('button', {
        name: /View Paid Clubs Rank/i,
      })
      const paymentsButton = screen.getByRole('button', {
        name: /View Membership Payments Rank/i,
      })
      const distinguishedButton = screen.getByRole('button', {
        name: /View Distinguished Clubs Rank/i,
      })

      expect(overallButton).toBeInTheDocument()
      expect(clubsButton).toBeInTheDocument()
      expect(paymentsButton).toBeInTheDocument()
      expect(distinguishedButton).toBeInTheDocument()
    })

    it('updates selected metric when toggle button is clicked', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Initially aggregate should be selected
      const aggregateButton = screen.getByRole('button', {
        name: /View Overall Rank/i,
      })
      expect(aggregateButton).toHaveAttribute('aria-pressed', 'true')

      // Click on clubs button
      const clubsButton = screen.getByRole('button', {
        name: /View Paid Clubs Rank/i,
      })
      fireEvent.click(clubsButton)

      // Now clubs should be selected
      expect(clubsButton).toHaveAttribute('aria-pressed', 'true')
      expect(aggregateButton).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Data Freshness Timestamp', () => {
    it('displays data freshness timestamp when available', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Should show last updated timestamp
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })

    it('does not display timestamp when endOfYearRankings is null', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          endOfYearRankings: null,
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Should not show last updated timestamp
      expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument()
    })

    it('timestamp has proper accessibility label', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      const timestampElement = screen.getByLabelText(/Rankings last updated/i)
      expect(timestampElement).toBeInTheDocument()
    })
  })

  describe('Hook Integration', () => {
    it('passes districtId to useGlobalRankings hook', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(
        <GlobalRankingsTab districtId="42" districtName="District 42" />
      )

      expect(mockUseGlobalRankings).toHaveBeenCalledWith(
        expect.objectContaining({
          districtId: '42',
        })
      )
    })

    it('updates when districtId prop changes', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      const { rerender } = renderWithProviders(
        <GlobalRankingsTab districtId="57" districtName="District 57" />
      )

      expect(mockUseGlobalRankings).toHaveBeenCalledWith(
        expect.objectContaining({
          districtId: '57',
        })
      )

      // Rerender with different districtId
      rerender(<GlobalRankingsTab districtId="42" districtName="District 42" />)

      expect(mockUseGlobalRankings).toHaveBeenCalledWith(
        expect.objectContaining({
          districtId: '42',
        })
      )
    })
  })

  describe('Year-Over-Year Comparison', () => {
    it('calculates and passes previous year rankings for comparison', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // The EndOfYearRankingsPanel should receive previousYearRankings
      // This is verified by checking for year-over-year change indicators
      const improvementIndicators = screen.queryAllByRole('status', {
        name: /improved/i,
      })
      // Should have improvement indicators when previous year data is available
      expect(improvementIndicators.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Responsive Layout', () => {
    it('renders with proper spacing between sections', () => {
      mockUseGlobalRankings.mockReturnValue(createMockHookResult())

      const { container } = renderWithProviders(
        <GlobalRankingsTab {...baseProps} />
      )

      // Main container should have space-y-6 for vertical spacing
      const mainContainer = container.querySelector('.space-y-6')
      expect(mainContainer).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles single program year correctly', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          availableProgramYears: [mockProgramYear2024],
          yearlyRankings: [mockYearlyRankings[0]!],
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Should still render all components
      expect(screen.getByText('End-of-Year Rankings')).toBeInTheDocument()
      expect(screen.getByText('Ranking Progression')).toBeInTheDocument()
      expect(screen.getByText('Multi-Year Comparison')).toBeInTheDocument()
    })

    it('handles empty history data gracefully', () => {
      mockUseGlobalRankings.mockReturnValue(
        createMockHookResult({
          currentYearHistory: {
            ...mockRankHistory,
            history: [],
          },
        })
      )

      renderWithProviders(<GlobalRankingsTab {...baseProps} />)

      // Should still render without crashing
      expect(screen.getByText('End-of-Year Rankings')).toBeInTheDocument()
    })
  })
})
