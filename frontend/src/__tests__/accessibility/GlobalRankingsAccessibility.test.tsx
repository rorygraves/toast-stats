/**
 * Accessibility Tests for Global Rankings Components
 *
 * **Validates: Requirement 6 - Accessibility Compliance**
 *
 * This test file verifies WCAG AA compliance for all Global Rankings components:
 * - RankingCard
 * - EndOfYearRankingsPanel
 * - FullYearRankingChart
 * - MultiYearComparisonTable
 * - GlobalRankingsTab
 *
 * Tests cover:
 * - 9.1 axe-core accessibility tests on all new components
 * - 9.2 Keyboard navigation for all interactive elements
 * - 9.3 Screen reader compatibility for chart and data
 * - 9.4 Color-independent meaning (icons/text with color indicators)
 */

import React from 'react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import '@testing-library/jest-dom'

import { cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RankingCard from '../../components/RankingCard'
import EndOfYearRankingsPanel from '../../components/EndOfYearRankingsPanel'
import FullYearRankingChart from '../../components/FullYearRankingChart'
import MultiYearComparisonTable from '../../components/MultiYearComparisonTable'
import GlobalRankingsTab from '../../components/GlobalRankingsTab'

// 4 of 5 components tested here are pure presentational; only
// GlobalRankingsTab uses useSearchParams via useUrlState. Replace the
// heavy renderWithProviders (createMemoryRouter + RouterProvider +
// QueryClient + PerformanceWrapper) with a lightweight MemoryRouter
// wrapper. 36 axe-test renders × ~30ms saved each = the difference
// between this file consistently passing the parallel suite or being
// a contention amplifier (#473).
const renderWithProviders = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)
const cleanupAllResources = () => cleanup()
import type { ProgramYear } from '../../utils/programYear'
import type {
  EndOfYearRankings,
  YearlyRankingSummary,
} from '../../hooks/useGlobalRankings'
import type { RankHistoryResponse } from '../../types/districts'

// Extend expect with jest-axe matchers
// @ts-expect-error - jest-axe types are not perfectly compatible with vitest expect
expect.extend(toHaveNoViolations)

// Axe synchronization to prevent concurrent runs
let axeRunning = false
const axeQueue: Array<() => Promise<void>> = []

const runAxeSynchronized = async (container: Element): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const wrappedFn = async () => {
      try {
        const results = await axe(container)
        resolve(results)
      } catch (error) {
        reject(error)
      } finally {
        axeRunning = false
        // Process next item in queue
        const next = axeQueue.shift()
        if (next) {
          axeRunning = true
          next()
        }
      }
    }

    if (axeRunning) {
      // Add to queue
      axeQueue.push(wrappedFn)
    } else {
      // Run immediately
      axeRunning = true
      wrappedFn()
    }
  })
}

// Mock the useGlobalRankings hook
vi.mock('../../hooks/useGlobalRankings', () => ({
  useGlobalRankings: vi.fn(),
}))

import { useGlobalRankings } from '../../hooks/useGlobalRankings'
const mockUseGlobalRankings = vi.mocked(useGlobalRankings)

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

const mockEndOfYearRankings: EndOfYearRankings = {
  overall: { rank: 15, totalDistricts: 126, percentile: 88.1 },
  paidClubs: { rank: 10, totalDistricts: 126, percentile: 92.1 },
  membershipPayments: { rank: 20, totalDistricts: 126, percentile: 84.1 },
  distinguishedClubs: { rank: 5, totalDistricts: 126, percentile: 96.0 },
  asOfDate: '2024-09-15',
  isPartialYear: true,
}

const mockRankHistory: RankHistoryResponse = {
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

const mockYearlyRankings: YearlyRankingSummary[] = [
  {
    programYear: '2024-2025',
    overallRank: 15,
    clubsRank: 10,
    paymentsRank: 20,
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
    paymentsRank: 18,
    distinguishedRank: 10,
    totalDistricts: 126,
    isPartialYear: false,
    yearOverYearChange: null,
  },
]

// Trophy icon for testing
const TrophyIcon: React.FC = () => (
  <svg
    className="w-6 h-6"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M12 2C13.1 2 14 2.9 14 4H19V8C19 10.21 17.21 12 15 12H14.92C14.43 13.96 12.68 15.5 10.5 15.91V18H13V21H9V18H11V15.91C8.82 15.5 7.07 13.96 6.58 12H6.5C4.29 12 2.5 10.21 2.5 8V4H8C8 2.9 8.9 2 10 2H12Z" />
  </svg>
)

describe('Global Rankings Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupAllResources()
  })

  /**
   * Task 9.1: Run axe-core accessibility tests on all new components
   */
  describe('9.1 axe-core Accessibility Tests', () => {
    describe('RankingCard', () => {
      it('should have no accessibility violations in default state', async () => {
        const { container } = render(
          <RankingCard
            title="Overall Rank"
            rank={15}
            totalDistricts={126}
            percentile={88.1}
            icon={<TrophyIcon />}
            colorScheme="blue"
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations with year-over-year change', async () => {
        const { container } = render(
          <RankingCard
            title="Overall Rank"
            rank={15}
            totalDistricts={126}
            percentile={88.1}
            icon={<TrophyIcon />}
            colorScheme="blue"
            previousYearRank={20}
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations in loading state', async () => {
        const { container } = render(
          <RankingCard
            title="Overall Rank"
            rank={0}
            totalDistricts={0}
            percentile={0}
            icon={<TrophyIcon />}
            colorScheme="blue"
            isLoading={true}
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })
    })

    describe('EndOfYearRankingsPanel', () => {
      it('should have no accessibility violations with data', async () => {
        const { container } = render(
          <EndOfYearRankingsPanel
            rankings={mockEndOfYearRankings}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations in loading state', async () => {
        const { container } = render(
          <EndOfYearRankingsPanel
            rankings={null}
            isLoading={true}
            programYear={mockProgramYear2024}
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations with previous year comparison', async () => {
        const { container } = render(
          <EndOfYearRankingsPanel
            rankings={mockEndOfYearRankings}
            isLoading={false}
            programYear={mockProgramYear2024}
            previousYearRankings={{
              overall: { rank: 20, totalDistricts: 126, percentile: 84.1 },
              paidClubs: { rank: 13, totalDistricts: 126, percentile: 89.7 },
              membershipPayments: {
                rank: 18,
                totalDistricts: 126,
                percentile: 85.7,
              },
              distinguishedClubs: {
                rank: 10,
                totalDistricts: 126,
                percentile: 92.1,
              },
              asOfDate: '2024-06-30',
              isPartialYear: false,
            }}
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })
    })

    describe('FullYearRankingChart', () => {
      it('should have no accessibility violations with data', async () => {
        const { container } = renderWithProviders(
          <FullYearRankingChart
            data={mockRankHistory}
            selectedMetric="aggregate"
            onMetricChange={() => {}}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations in loading state', async () => {
        const { container } = renderWithProviders(
          <FullYearRankingChart
            data={null}
            selectedMetric="aggregate"
            onMetricChange={() => {}}
            isLoading={true}
            programYear={mockProgramYear2024}
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations in empty state', async () => {
        const { container } = renderWithProviders(
          <FullYearRankingChart
            data={null}
            selectedMetric="aggregate"
            onMetricChange={() => {}}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })
    })

    describe('MultiYearComparisonTable', () => {
      it('should have no accessibility violations with data', async () => {
        const { container } = renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations in loading state', async () => {
        const { container } = renderWithProviders(
          <MultiYearComparisonTable yearlyRankings={[]} isLoading={true} />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations in empty state', async () => {
        const { container } = renderWithProviders(
          <MultiYearComparisonTable yearlyRankings={[]} isLoading={false} />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })
    })

    describe('GlobalRankingsTab', () => {
      const mockRefetch = vi.fn()

      const createMockHookResult = (overrides = {}) => ({
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

      it('should have no accessibility violations with data', async () => {
        mockUseGlobalRankings.mockReturnValue(createMockHookResult())
        const { container } = renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations in loading state', async () => {
        mockUseGlobalRankings.mockReturnValue(
          createMockHookResult({
            isLoading: true,
            isLoadingChart: false,
            isLoadingMultiYear: false,
            currentYearHistory: null,
            endOfYearRankings: null,
            availableProgramYears: [],
            yearlyRankings: [],
          })
        )
        const { container } = renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations in error state', async () => {
        mockUseGlobalRankings.mockReturnValue(
          createMockHookResult({
            isError: true,
            error: new Error('Failed to load data'),
            currentYearHistory: null,
            endOfYearRankings: null,
            availableProgramYears: [],
            yearlyRankings: [],
          })
        )
        const { container } = renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations in empty state', async () => {
        mockUseGlobalRankings.mockReturnValue(
          createMockHookResult({
            availableProgramYears: [],
            currentYearHistory: null,
            endOfYearRankings: null,
            yearlyRankings: [],
          })
        )
        const { container } = renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )
        const results = await runAxeSynchronized(container)
        expect(results).toHaveNoViolations()
      })
    })
  })

  /**
   * Task 9.2: Verify keyboard navigation for all interactive elements
   */
  describe('9.2 Keyboard Navigation', () => {
    describe('FullYearRankingChart metric toggle buttons', () => {
      it('should allow keyboard navigation between metric toggle buttons', async () => {
        const user = userEvent.setup()
        const onMetricChange = vi.fn()

        renderWithProviders(
          <FullYearRankingChart
            data={mockRankHistory}
            selectedMetric="aggregate"
            onMetricChange={onMetricChange}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        // Find all metric toggle buttons
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

        // Verify all buttons are focusable
        expect(overallButton).not.toHaveAttribute('tabindex', '-1')
        expect(clubsButton).not.toHaveAttribute('tabindex', '-1')
        expect(paymentsButton).not.toHaveAttribute('tabindex', '-1')
        expect(distinguishedButton).not.toHaveAttribute('tabindex', '-1')

        // Tab to first button and verify focus
        await user.tab()
        // Focus should be on one of the interactive elements

        // Click using keyboard (Enter)
        clubsButton.focus()
        await user.keyboard('{Enter}')
        expect(onMetricChange).toHaveBeenCalledWith('clubs')

        // Click using keyboard (Space)
        onMetricChange.mockClear()
        paymentsButton.focus()
        await user.keyboard(' ')
        expect(onMetricChange).toHaveBeenCalledWith('payments')
      })

      it('should have aria-pressed attribute on toggle buttons', () => {
        renderWithProviders(
          <FullYearRankingChart
            data={mockRankHistory}
            selectedMetric="clubs"
            onMetricChange={() => {}}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        const clubsButton = screen.getByRole('button', {
          name: /View Paid Clubs Rank/i,
        })
        const overallButton = screen.getByRole('button', {
          name: /View Overall Rank/i,
        })

        expect(clubsButton).toHaveAttribute('aria-pressed', 'true')
        expect(overallButton).toHaveAttribute('aria-pressed', 'false')
      })
    })

    describe('GlobalRankingsTab program year (parent-provided)', () => {
      it('should not render its own combobox for program year selection', () => {
        const mockRefetch = vi.fn()

        mockUseGlobalRankings.mockReturnValue({
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
        })

        renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )

        // Tab uses the page-level selector — no combobox inside the tab
        const selector = screen.queryByRole('combobox', {
          name: /program year/i,
        })
        expect(selector).not.toBeInTheDocument()
      })
    })

    describe('GlobalRankingsTab retry button in error state', () => {
      it('should allow keyboard activation of retry button', async () => {
        const user = userEvent.setup()
        const mockRefetch = vi.fn()

        mockUseGlobalRankings.mockReturnValue({
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
          isLoading: false,
          isLoadingChart: false,
          isLoadingMultiYear: false,
          isError: true,
          error: new Error('Network error'),
          refetch: mockRefetch,
        })

        renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )

        const retryButton = screen.getByRole('button', { name: /retry/i })
        expect(retryButton).toBeInTheDocument()

        // Verify button is focusable
        expect(retryButton).not.toHaveAttribute('tabindex', '-1')

        // Activate with Enter key
        retryButton.focus()
        await user.keyboard('{Enter}')
        expect(mockRefetch).toHaveBeenCalledTimes(1)

        // Activate with Space key
        mockRefetch.mockClear()
        await user.keyboard(' ')
        expect(mockRefetch).toHaveBeenCalledTimes(1)
      })

      it('retry button should have minimum 44px touch target', () => {
        const mockRefetch = vi.fn()

        mockUseGlobalRankings.mockReturnValue({
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
          isLoading: false,
          isLoadingChart: false,
          isLoadingMultiYear: false,
          isError: true,
          error: new Error('Network error'),
          refetch: mockRefetch,
        })

        renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )

        const retryButton = screen.getByRole('button', { name: /retry/i })
        expect(retryButton).toHaveClass('min-h-[44px]')
      })
    })

    describe('MultiYearComparisonTable navigation', () => {
      it('should have proper table structure for keyboard navigation', () => {
        renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )

        // Table should have proper structure
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()

        // Should have column headers
        const columnHeaders = screen.getAllByRole('columnheader')
        expect(columnHeaders.length).toBeGreaterThan(0)

        // Should have row headers or data cells
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(1) // Header row + data rows
      })

      it('should have accessible table description', () => {
        renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )

        // Table should have aria-describedby
        const table = screen.getByRole('table')
        expect(table).toHaveAttribute('aria-describedby')

        // Description should exist
        const descriptionId = table.getAttribute('aria-describedby')
        const description = document.getElementById(descriptionId!)
        expect(description).toBeInTheDocument()
      })
    })
  })

  /**
   * Task 9.3: Verify screen reader compatibility for chart and data
   */
  describe('9.3 Screen Reader Compatibility', () => {
    describe('FullYearRankingChart aria-labels', () => {
      it('should have aria-label on chart container', () => {
        renderWithProviders(
          <FullYearRankingChart
            data={mockRankHistory}
            selectedMetric="aggregate"
            onMetricChange={() => {}}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        // Chart should have aria-label
        const chartSection = screen.getByRole('img')
        expect(chartSection).toHaveAttribute('aria-label')
        expect(chartSection.getAttribute('aria-label')).toContain('District 57')
      })

      it('should have screen reader accessible description for chart', () => {
        renderWithProviders(
          <FullYearRankingChart
            data={mockRankHistory}
            selectedMetric="aggregate"
            onMetricChange={() => {}}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        // Should have aria-describedby pointing to description
        const chartSection = screen.getByRole('img')
        expect(chartSection).toHaveAttribute('aria-describedby')

        // Description should exist and contain meaningful content
        const descriptionId = chartSection.getAttribute('aria-describedby')
        const description = document.getElementById(descriptionId!)
        expect(description).toBeInTheDocument()
        expect(description?.textContent).toContain('Line chart')
        expect(description?.textContent).toContain('District 57')
      })

      it('should have sr-only class on chart description', () => {
        const { container } = renderWithProviders(
          <FullYearRankingChart
            data={mockRankHistory}
            selectedMetric="aggregate"
            onMetricChange={() => {}}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        // Description should be visually hidden but accessible to screen readers
        const srOnlyElements = container.querySelectorAll('.sr-only')
        expect(srOnlyElements.length).toBeGreaterThan(0)
      })
    })

    describe('aria-live regions for dynamic content', () => {
      it('should have aria-live region for error state', () => {
        const mockRefetch = vi.fn()

        mockUseGlobalRankings.mockReturnValue({
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
          isLoading: false,
          isLoadingChart: false,
          isLoadingMultiYear: false,
          isError: true,
          error: new Error('Network error'),
          refetch: mockRefetch,
        })

        renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )

        // Error state should have aria-live for screen reader announcement
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toHaveAttribute('aria-live', 'polite')
      })

      it('should have aria-busy on loading states', () => {
        const mockRefetch = vi.fn()

        mockUseGlobalRankings.mockReturnValue({
          currentYearHistory: null,
          endOfYearRankings: null,
          availableProgramYears: [],
          yearlyRankings: [],
          isLoading: true,
          isLoadingChart: false,
          isLoadingMultiYear: false,
          isError: false,
          error: null,
          refetch: mockRefetch,
        })

        renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )

        // Loading state should have aria-busy
        const loadingSection = screen.getByLabelText(
          'Loading global rankings data'
        )
        expect(loadingSection).toHaveAttribute('aria-busy', 'true')
      })

      it('RankingCard loading state should have aria-busy', () => {
        render(
          <RankingCard
            title="Overall Rank"
            rank={0}
            totalDistricts={0}
            percentile={0}
            icon={<TrophyIcon />}
            colorScheme="blue"
            isLoading={true}
          />
        )

        const loadingCard = screen.getByRole('status')
        expect(loadingCard).toHaveAttribute('aria-busy', 'true')
        expect(loadingCard).toHaveAttribute(
          'aria-label',
          'Loading Overall Rank ranking'
        )
      })
    })

    describe('Proper heading hierarchy', () => {
      it('EndOfYearRankingsPanel should have proper heading', () => {
        render(
          <EndOfYearRankingsPanel
            rankings={mockEndOfYearRankings}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        const heading = screen.getByRole('heading', {
          name: /End-of-Year Rankings/i,
        })
        expect(heading).toBeInTheDocument()
        expect(heading.tagName).toBe('H2')
      })

      it('FullYearRankingChart should have proper heading', () => {
        renderWithProviders(
          <FullYearRankingChart
            data={mockRankHistory}
            selectedMetric="aggregate"
            onMetricChange={() => {}}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        const heading = screen.getByRole('heading', {
          name: /Ranking Progression/i,
        })
        expect(heading).toBeInTheDocument()
        expect(heading.tagName).toBe('H2')
      })

      it('MultiYearComparisonTable should have proper heading', () => {
        renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )

        const heading = screen.getByRole('heading', {
          name: /Multi-Year Comparison/i,
        })
        expect(heading).toBeInTheDocument()
        expect(heading.tagName).toBe('H2')
      })
    })

    describe('Section labeling', () => {
      it('EndOfYearRankingsPanel should have aria-labelledby', () => {
        const { container } = render(
          <EndOfYearRankingsPanel
            rankings={mockEndOfYearRankings}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        const section = container.querySelector('section')
        expect(section).toHaveAttribute(
          'aria-labelledby',
          'end-of-year-rankings-heading'
        )
      })

      it('MultiYearComparisonTable should have aria-labelledby', () => {
        const { container } = renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )

        const section = container.querySelector('section')
        expect(section).toHaveAttribute(
          'aria-labelledby',
          'multi-year-comparison-heading'
        )
      })

      it('GlobalRankingsTab should have region with aria-label', () => {
        const mockRefetch = vi.fn()

        mockUseGlobalRankings.mockReturnValue({
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
        })

        renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )

        const region = screen.getByRole('region', {
          name: /Global rankings for District 57/i,
        })
        expect(region).toBeInTheDocument()
      })
    })
  })

  /**
   * Task 9.4: Verify color-independent meaning (icons/text with color indicators)
   */
  describe('9.4 Color-Independent Meaning', () => {
    describe('RankingCard change indicators', () => {
      it('should have both icon AND text for improvement indicator', () => {
        render(
          <RankingCard
            title="Overall Rank"
            rank={15}
            totalDistricts={126}
            percentile={88.1}
            icon={<TrophyIcon />}
            colorScheme="blue"
            previousYearRank={20}
          />
        )

        // Find the year-over-year indicator
        const indicator = screen.getByRole('status', { name: /improved/i })
        expect(indicator).toBeInTheDocument()

        // Should have arrow icon (↑)
        expect(indicator.textContent).toContain('↑')

        // Should have numeric text showing the change
        expect(indicator.textContent).toContain('+5')
      })

      it('should have both icon AND text for decline indicator', () => {
        render(
          <RankingCard
            title="Overall Rank"
            rank={20}
            totalDistricts={126}
            percentile={84.1}
            icon={<TrophyIcon />}
            colorScheme="blue"
            previousYearRank={15}
          />
        )

        // Find the year-over-year indicator
        const indicator = screen.getByRole('status', { name: /declined/i })
        expect(indicator).toBeInTheDocument()

        // Should have arrow icon (↓)
        expect(indicator.textContent).toContain('↓')

        // Should have numeric text showing the change
        expect(indicator.textContent).toContain('-5')
      })

      it('should have both icon AND text for unchanged indicator', () => {
        render(
          <RankingCard
            title="Overall Rank"
            rank={15}
            totalDistricts={126}
            percentile={88.1}
            icon={<TrophyIcon />}
            colorScheme="blue"
            previousYearRank={15}
          />
        )

        // Find the year-over-year indicator
        const indicator = screen.getByRole('status', { name: /unchanged/i })
        expect(indicator).toBeInTheDocument()

        // Should have arrow icon (→)
        expect(indicator.textContent).toContain('→')

        // Should have text showing zero change
        expect(indicator.textContent).toContain('0')
      })

      it('should have aria-label describing the change for screen readers', () => {
        render(
          <RankingCard
            title="Overall Rank"
            rank={15}
            totalDistricts={126}
            percentile={88.1}
            icon={<TrophyIcon />}
            colorScheme="blue"
            previousYearRank={20}
          />
        )

        const indicator = screen.getByRole('status', {
          name: /improved by 5 positions/i,
        })
        expect(indicator).toBeInTheDocument()
      })
    })

    describe('MultiYearComparisonTable change indicators', () => {
      it('should have both icon AND text for improvement in table', () => {
        renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )

        // Find improvement indicators (overall improved by 5)
        const improvementIndicators = screen.getAllByRole('status', {
          name: /improved/i,
        })
        expect(improvementIndicators.length).toBeGreaterThan(0)

        // Each should have both icon and text
        improvementIndicators.forEach(indicator => {
          expect(indicator.textContent).toContain('↑')
          expect(indicator.textContent).toMatch(/\+\d+/)
        })
      })

      it('should have both icon AND text for decline in table', () => {
        renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )

        // Find decline indicators (payments declined by 2)
        const declineIndicators = screen.getAllByRole('status', {
          name: /declined/i,
        })
        expect(declineIndicators.length).toBeGreaterThan(0)

        // Each should have both icon and text
        declineIndicators.forEach(indicator => {
          expect(indicator.textContent).toContain('↓')
          expect(indicator.textContent).toMatch(/-\d+/)
        })
      })

      it('should have aria-label on change indicators for screen readers', () => {
        renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )

        // Get all status elements and filter to only change indicators (not partial year badges)
        const allIndicators = screen.getAllByRole('status')
        const changeIndicators = allIndicators.filter(indicator => {
          const ariaLabel = indicator.getAttribute('aria-label')
          // Filter out partial year badges
          return ariaLabel && !ariaLabel.toLowerCase().includes('partial')
        })

        expect(changeIndicators.length).toBeGreaterThan(0)
        changeIndicators.forEach(indicator => {
          const ariaLabel = indicator.getAttribute('aria-label')
          expect(ariaLabel).toBeTruthy()
          // Should describe the change direction and amount
          expect(ariaLabel).toMatch(/(improved|declined|unchanged)/i)
        })
      })
    })

    describe('Partial year indicator', () => {
      it('should have text label for partial year badge, not just color', () => {
        render(
          <EndOfYearRankingsPanel
            rankings={mockEndOfYearRankings}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        // Partial year indicator should have text "Partial Year"
        const partialBadge = screen.getByRole('status', {
          name: /partial year/i,
        })
        expect(partialBadge).toBeInTheDocument()
        expect(partialBadge.textContent).toContain('Partial')
      })

      it('should have icon in addition to text for partial year badge', () => {
        render(
          <EndOfYearRankingsPanel
            rankings={mockEndOfYearRankings}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        const partialBadge = screen.getByRole('status', {
          name: /partial year/i,
        })
        // Should contain an SVG icon
        const icon = partialBadge.querySelector('svg')
        expect(icon).toBeInTheDocument()
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })

      it('MultiYearComparisonTable should have partial year indicator with text', () => {
        renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )

        // Find partial year badges
        const partialBadges = screen.getAllByRole('status', {
          name: /partial year/i,
        })
        expect(partialBadges.length).toBeGreaterThan(0)

        // Each should have text content
        partialBadges.forEach(badge => {
          expect(badge.textContent).toContain('Partial')
        })
      })
    })

    describe('Percentile badges', () => {
      it('should have text label for percentile, not just color', () => {
        render(
          <RankingCard
            title="Overall Rank"
            rank={15}
            totalDistricts={126}
            percentile={88.1}
            icon={<TrophyIcon />}
            colorScheme="blue"
          />
        )

        // Percentile badge should have ordinal percentile text (#305)
        const percentileBadge = screen.getByRole('status', {
          name: /88th percentile/i,
        })
        expect(percentileBadge).toBeInTheDocument()
        expect(percentileBadge.textContent).toContain('percentile')
      })
    })

    describe('Icon decorative marking', () => {
      it('RankingCard icons should be marked as decorative', () => {
        const { container } = render(
          <RankingCard
            title="Overall Rank"
            rank={15}
            totalDistricts={126}
            percentile={88.1}
            icon={<TrophyIcon />}
            colorScheme="blue"
          />
        )

        // Icons should have aria-hidden="true" since they are decorative
        const icons = container.querySelectorAll('svg')
        icons.forEach(icon => {
          expect(icon).toHaveAttribute('aria-hidden', 'true')
        })
      })

      it('EndOfYearRankingsPanel icons should be marked as decorative', () => {
        const { container } = render(
          <EndOfYearRankingsPanel
            rankings={mockEndOfYearRankings}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        // All SVG icons should have aria-hidden="true"
        const icons = container.querySelectorAll('svg')
        icons.forEach(icon => {
          expect(icon).toHaveAttribute('aria-hidden', 'true')
        })
      })
    })
  })

  /**
   * Additional accessibility tests for comprehensive coverage
   */
  describe('Additional Accessibility Requirements', () => {
    describe('Touch target sizes (44px minimum)', () => {
      it('FullYearRankingChart metric buttons should have 44px minimum height', () => {
        renderWithProviders(
          <FullYearRankingChart
            data={mockRankHistory}
            selectedMetric="aggregate"
            onMetricChange={() => {}}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
          // Chrome refresh moved the 44px min-height to an inline style.
          expect(button.style.minHeight).toBe('44px')
        })
      })
    })

    describe('RankingCard comprehensive aria-label', () => {
      it('should have complete aria-label with all ranking information', () => {
        const { container } = render(
          <RankingCard
            title="Overall Rank"
            rank={15}
            totalDistricts={126}
            percentile={88.1}
            icon={<TrophyIcon />}
            colorScheme="blue"
            previousYearRank={20}
          />
        )

        // Card should have comprehensive aria-label
        const card = container.querySelector('[aria-label]')
        expect(card).toBeInTheDocument()

        const ariaLabel = card?.getAttribute('aria-label')
        expect(ariaLabel).toContain('Overall Rank')
        expect(ariaLabel).toContain('Rank 15')
        expect(ariaLabel).toContain('of 126')
        expect(ariaLabel).toContain('88th percentile')
        expect(ariaLabel).toContain('improved')
      })
    })

    describe('List semantics for ranking cards', () => {
      it('EndOfYearRankingsPanel should use list semantics for cards', () => {
        render(
          <EndOfYearRankingsPanel
            rankings={mockEndOfYearRankings}
            isLoading={false}
            programYear={mockProgramYear2024}
          />
        )

        // Should have a list container
        const list = screen.getByRole('list', {
          name: /End-of-year ranking metrics/i,
        })
        expect(list).toBeInTheDocument()

        // Should have list items
        const listItems = within(list).getAllByRole('listitem')
        expect(listItems.length).toBe(4) // 4 ranking cards
      })
    })

    describe('Mobile card view accessibility', () => {
      it('MultiYearComparisonTable mobile view should use list semantics', () => {
        const { container } = renderWithProviders(
          <MultiYearComparisonTable
            yearlyRankings={mockYearlyRankings}
            isLoading={false}
          />
        )

        // Mobile view should have list with proper role
        const mobileList = container.querySelector(
          '[role="list"][aria-label="Multi-year rankings"]'
        )
        expect(mobileList).toBeInTheDocument()
      })
    })

    describe('Data freshness timestamp accessibility', () => {
      it('should have accessible label for data freshness timestamp', () => {
        const mockRefetch = vi.fn()

        mockUseGlobalRankings.mockReturnValue({
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
        })

        renderWithProviders(
          <GlobalRankingsTab districtId="57" districtName="District 57" />
        )

        // Timestamp should have aria-label
        const timestamp = screen.getByLabelText(/Rankings last updated/i)
        expect(timestamp).toBeInTheDocument()
      })
    })
  })
})
