import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import FullYearRankingChart, {
  FullYearRankingChartProps,
  RankMetric,
} from '../FullYearRankingChart'
import {
  renderWithProviders,
  cleanupAllResources,
} from '../../__tests__/utils/componentTestUtils'
import type { RankHistoryResponse } from '../../types/districts'
import type { ProgramYear } from '../../utils/programYear'

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="chart-line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ reversed }: { reversed?: boolean }) => (
    <div data-testid="y-axis" data-reversed={reversed ? 'true' : 'false'} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('FullYearRankingChart', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Test data fixtures
  const mockProgramYear: ProgramYear = {
    year: 2024,
    startDate: '2024-07-01',
    endDate: '2025-06-30',
    label: '2024-2025',
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
        totalDistricts: 120,
        overallRank: 50,
      },
      {
        date: '2024-08-15',
        aggregateScore: 140,
        clubsRank: 12,
        paymentsRank: 18,
        distinguishedRank: 8,
        totalDistricts: 120,
        overallRank: 40,
      },
      {
        date: '2024-09-15',
        aggregateScore: 130,
        clubsRank: 10,
        paymentsRank: 15,
        distinguishedRank: 5,
        totalDistricts: 120,
        overallRank: 30,
      },
    ],
    programYear: {
      startDate: '2024-07-01',
      endDate: '2025-06-30',
      year: '2024-2025',
    },
  }

  const mockOnMetricChange = vi.fn()

  const baseProps: FullYearRankingChartProps = {
    data: mockRankHistory,
    selectedMetric: 'clubs',
    onMetricChange: mockOnMetricChange,
    isLoading: false,
    programYear: mockProgramYear,
  }

  describe('Loading State', () => {
    it('renders loading skeleton when isLoading is true', () => {
      renderWithProviders(
        <FullYearRankingChart {...baseProps} isLoading={true} />
      )

      expect(
        screen.getByLabelText('Loading ranking progression chart')
      ).toBeInTheDocument()
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
    })

    it('loading skeleton has aria-busy attribute', () => {
      renderWithProviders(
        <FullYearRankingChart {...baseProps} isLoading={true} />
      )

      const loadingSection = screen.getByLabelText(
        'Loading ranking progression chart'
      )
      expect(loadingSection).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('Empty State', () => {
    it('renders empty state when data is null', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} data={null} />)

      expect(
        screen.getByText(
          /No ranking data available for the 2024-2025 program year/i
        )
      ).toBeInTheDocument()
    })

    it('renders empty state when history is empty', () => {
      const emptyHistory: RankHistoryResponse = {
        ...mockRankHistory,
        history: [],
      }

      renderWithProviders(
        <FullYearRankingChart {...baseProps} data={emptyHistory} />
      )

      expect(
        screen.getByText(
          /No ranking data available for the 2024-2025 program year/i
        )
      ).toBeInTheDocument()
    })

    it('empty state has proper aria-label', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} data={null} />)

      expect(
        screen.getByLabelText('No ranking data available')
      ).toBeInTheDocument()
    })
  })

  describe('Chart Rendering', () => {
    it('renders chart when data is available', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('chart-line')).toBeInTheDocument()
    })

    it('displays program year information', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      expect(screen.getByText(/Program Year: 2024-2025/)).toBeInTheDocument()
      expect(screen.getByText(/2024-07-01 to 2025-06-30/)).toBeInTheDocument()
    })

    it('renders chart title', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      expect(screen.getByText('Ranking Progression')).toBeInTheDocument()
    })
  })

  describe('Metric Toggle', () => {
    it('renders all four metric toggle buttons', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      expect(
        screen.getByRole('button', { name: /View Overall Rank/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /View Paid Clubs Rank/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /View Membership Payments Rank/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /View Distinguished Clubs Rank/i })
      ).toBeInTheDocument()
    })

    it('shows selected metric button as pressed', () => {
      renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="clubs" />
      )

      const clubsButton = screen.getByRole('button', {
        name: /View Paid Clubs Rank/i,
      })
      expect(clubsButton).toHaveAttribute('aria-pressed', 'true')

      const overallButton = screen.getByRole('button', {
        name: /View Overall Rank/i,
      })
      expect(overallButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('calls onMetricChange when a metric button is clicked', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      const paymentsButton = screen.getByRole('button', {
        name: /View Membership Payments Rank/i,
      })
      fireEvent.click(paymentsButton)

      expect(mockOnMetricChange).toHaveBeenCalledWith('payments')
    })

    it('calls onMetricChange with correct metric for each button', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      const metrics: RankMetric[] = [
        'aggregate',
        'clubs',
        'payments',
        'distinguished',
      ]
      const buttonLabels = [
        /View Overall Rank/i,
        /View Paid Clubs Rank/i,
        /View Membership Payments Rank/i,
        /View Distinguished Clubs Rank/i,
      ]

      metrics.forEach((metric, index) => {
        mockOnMetricChange.mockClear()
        const button = screen.getByRole('button', { name: buttonLabels[index] })
        fireEvent.click(button)
        expect(mockOnMetricChange).toHaveBeenCalledWith(metric)
      })
    })

    it('metric toggle group has proper aria-label', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      expect(
        screen.getByRole('group', { name: 'Select ranking metric' })
      ).toBeInTheDocument()
    })
  })

  describe('Inverted Y-Axis', () => {
    it('Y-axis is reversed for rank metrics (clubs)', () => {
      renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="clubs" />
      )

      const yAxis = screen.getByTestId('y-axis')
      expect(yAxis).toHaveAttribute('data-reversed', 'true')
    })

    it('Y-axis is reversed for rank metrics (payments)', () => {
      renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="payments" />
      )

      const yAxis = screen.getByTestId('y-axis')
      expect(yAxis).toHaveAttribute('data-reversed', 'true')
    })

    it('Y-axis is reversed for rank metrics (distinguished)', () => {
      renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="distinguished" />
      )

      const yAxis = screen.getByTestId('y-axis')
      expect(yAxis).toHaveAttribute('data-reversed', 'true')
    })

    it('Y-axis IS reversed for overall rank', () => {
      renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="aggregate" />
      )

      const yAxis = screen.getByTestId('y-axis')
      expect(yAxis).toHaveAttribute('data-reversed', 'true')
    })
  })

  describe('Accessibility', () => {
    it('chart has aria-label describing content', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      const chartContainer = screen.getByRole('img')
      expect(chartContainer).toHaveAttribute('aria-label')
      expect(chartContainer.getAttribute('aria-label')).toContain('District 57')
      expect(chartContainer.getAttribute('aria-label')).toContain('2024-2025')
    })

    it('chart has aria-describedby pointing to screen reader description', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      const chartContainer = screen.getByRole('img')
      expect(chartContainer).toHaveAttribute(
        'aria-describedby',
        'full-year-rank-chart-desc'
      )
    })

    it('screen reader description is present and hidden visually', () => {
      const { container } = renderWithProviders(
        <FullYearRankingChart {...baseProps} />
      )

      const srDescription = container.querySelector(
        '#full-year-rank-chart-desc'
      )
      expect(srDescription).toBeInTheDocument()
      expect(srDescription).toHaveClass('sr-only')
    })

    it('screen reader description contains meaningful content', () => {
      const { container } = renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="clubs" />
      )

      const srDescription = container.querySelector(
        '#full-year-rank-chart-desc'
      )
      expect(srDescription?.textContent).toContain('Paid Clubs Rank')
      expect(srDescription?.textContent).toContain('District 57')
      expect(srDescription?.textContent).toContain('2024-2025')
      expect(srDescription?.textContent).toContain('3 data points')
    })

    it('metric toggle buttons have minimum touch target size', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      // Chrome refresh moved off the `min-h-[44px]` Tailwind class to an
      // inline style attribute. The 44px guarantee remains.
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.style.minHeight).toBe('44px')
      })
    })

    it('section has proper aria-label', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      expect(
        screen.getByLabelText('Full year ranking progression chart')
      ).toBeInTheDocument()
    })
  })

  describe('Screen Reader Description Content', () => {
    it('describes improvement trend correctly', () => {
      // History shows improvement: rank 15 -> 12 -> 10
      const { container } = renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="clubs" />
      )

      const srDescription = container.querySelector(
        '#full-year-rank-chart-desc'
      )
      expect(srDescription?.textContent).toContain('improved')
      expect(srDescription?.textContent).toContain('rank 15')
      expect(srDescription?.textContent).toContain('rank 10')
    })

    it('describes decline trend correctly', () => {
      const decliningHistory: RankHistoryResponse = {
        ...mockRankHistory,
        history: [
          {
            date: '2024-07-15',
            aggregateScore: 130,
            clubsRank: 5,
            paymentsRank: 10,
            distinguishedRank: 8,
            totalDistricts: 120,
            overallRank: 20,
          },
          {
            date: '2024-08-15',
            aggregateScore: 140,
            clubsRank: 10,
            paymentsRank: 15,
            distinguishedRank: 12,
            totalDistricts: 120,
            overallRank: 30,
          },
        ],
      }

      const { container } = renderWithProviders(
        <FullYearRankingChart
          {...baseProps}
          data={decliningHistory}
          selectedMetric="clubs"
        />
      )

      const srDescription = container.querySelector(
        '#full-year-rank-chart-desc'
      )
      expect(srDescription?.textContent).toContain('declined')
    })

    it('describes unchanged trend correctly', () => {
      const unchangedHistory: RankHistoryResponse = {
        ...mockRankHistory,
        history: [
          {
            date: '2024-07-15',
            aggregateScore: 130,
            clubsRank: 10,
            paymentsRank: 15,
            distinguishedRank: 8,
            totalDistricts: 120,
            overallRank: 25,
          },
          {
            date: '2024-08-15',
            aggregateScore: 130,
            clubsRank: 10,
            paymentsRank: 15,
            distinguishedRank: 8,
            totalDistricts: 120,
            overallRank: 25,
          },
        ],
      }

      const { container } = renderWithProviders(
        <FullYearRankingChart
          {...baseProps}
          data={unchangedHistory}
          selectedMetric="clubs"
        />
      )

      const srDescription = container.querySelector(
        '#full-year-rank-chart-desc'
      )
      expect(srDescription?.textContent).toContain('remained')
    })

    it('mentions inverted Y-axis for rank metrics', () => {
      const { container } = renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="clubs" />
      )

      const srDescription = container.querySelector(
        '#full-year-rank-chart-desc'
      )
      expect(srDescription?.textContent).toContain('rank 1 at the top')
    })

    it('mentions inverted Y-axis for overall rank', () => {
      const { container } = renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="aggregate" />
      )

      const srDescription = container.querySelector(
        '#full-year-rank-chart-desc'
      )
      expect(srDescription?.textContent).toContain('rank 1 at the top')
    })
  })

  describe('Responsive Design', () => {
    it('chart container has horizontal scroll for mobile', () => {
      const { container } = renderWithProviders(
        <FullYearRankingChart {...baseProps} />
      )

      const scrollContainer = container.querySelector('.overflow-x-auto')
      expect(scrollContainer).toBeInTheDocument()
    })

    it('chart has minimum width for mobile scrolling', () => {
      const { container } = renderWithProviders(
        <FullYearRankingChart {...baseProps} />
      )

      const minWidthContainer = container.querySelector('.min-w-\\[320px\\]')
      expect(minWidthContainer).toBeInTheDocument()
    })
  })

  describe('Brand Compliance', () => {
    it('uses Toastmasters headline font for title', () => {
      renderWithProviders(<FullYearRankingChart {...baseProps} />)

      const title = screen.getByText('Ranking Progression')
      expect(title).toHaveClass('font-tm-headline')
    })

    it('selected metric button is announced as pressed', () => {
      // Chrome refresh moved off the `bg-tm-loyal-blue` Tailwind class to
      // the shared `.districts-toolbar__sort-btn--active` token-driven
      // class. The browser/screen-reader contract is `aria-pressed='true'`.
      renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="clubs" />
      )

      const selectedButton = screen.getByRole('button', {
        name: /View Paid Clubs Rank/i,
      })
      expect(selectedButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('unselected metric buttons are announced as not pressed', () => {
      renderWithProviders(
        <FullYearRankingChart {...baseProps} selectedMetric="clubs" />
      )

      const unselectedButton = screen.getByRole('button', {
        name: /View Overall Rank/i,
      })
      expect(unselectedButton).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Data Transformation', () => {
    it('sorts history data chronologically', () => {
      // Provide unsorted data
      const unsortedHistory: RankHistoryResponse = {
        ...mockRankHistory,
        history: [
          {
            date: '2024-09-15',
            aggregateScore: 130,
            clubsRank: 10,
            paymentsRank: 15,
            distinguishedRank: 5,
            totalDistricts: 120,
            overallRank: 30,
          },
          {
            date: '2024-07-15',
            aggregateScore: 150,
            clubsRank: 15,
            paymentsRank: 20,
            distinguishedRank: 10,
            totalDistricts: 120,
            overallRank: 50,
          },
          {
            date: '2024-08-15',
            aggregateScore: 140,
            clubsRank: 12,
            paymentsRank: 18,
            distinguishedRank: 8,
            totalDistricts: 120,
            overallRank: 40,
          },
        ],
      }

      // Component should still render correctly with sorted data
      const { container } = renderWithProviders(
        <FullYearRankingChart {...baseProps} data={unsortedHistory} />
      )

      // The screen reader description should show the correct trend
      // (from first chronological point to last)
      const srDescription = container.querySelector(
        '#full-year-rank-chart-desc'
      )
      expect(srDescription?.textContent).toContain('improved')
      expect(srDescription?.textContent).toContain('rank 15')
      expect(srDescription?.textContent).toContain('rank 10')
    })
  })
})
