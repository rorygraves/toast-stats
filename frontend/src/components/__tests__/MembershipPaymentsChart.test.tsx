/**
 * MembershipPaymentsChart Unit Tests
 *
 * Tests for the MembershipPaymentsChart component with well-chosen examples
 * covering chart rendering, statistics display, loading/empty states,
 * year-over-year changes, and accessibility.
 *
 * Converted from property-based tests to example-based unit tests per
 * property-testing-guidance.md - UI component tests are better served
 * by 3-5 well-chosen examples than random generation.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import '@testing-library/jest-dom'
import { MembershipPaymentsChart } from '../MembershipPaymentsChart'
import type { PaymentTrendDataPoint } from '../../utils/paymentTrend'
import type {
  MultiYearPaymentData,
  PaymentStatistics,
} from '../../hooks/usePaymentsTrend'

// Test fixtures - well-chosen examples for different scenarios

const singleDataPoint: PaymentTrendDataPoint[] = [
  { date: '2024-07-15', payments: 1500, programYearDay: 14 },
]

const multipleDataPoints: PaymentTrendDataPoint[] = [
  { date: '2024-07-01', payments: 1000, programYearDay: 0 },
  { date: '2024-08-01', payments: 1250, programYearDay: 31 },
  { date: '2024-09-01', payments: 1500, programYearDay: 62 },
  { date: '2024-10-01', payments: 1800, programYearDay: 92 },
  { date: '2024-11-01', payments: 2100, programYearDay: 123 },
]

const baseStatistics: PaymentStatistics = {
  currentPayments: 2100,
  paymentBase: 1800,
  yearOverYearChange: 150,
  trendDirection: 'up',
}

const statisticsWithNullBase: PaymentStatistics = {
  currentPayments: 1500,
  paymentBase: null,
  yearOverYearChange: null,
  trendDirection: null,
}

const statisticsWithDownTrend: PaymentStatistics = {
  currentPayments: 1200,
  paymentBase: 1500,
  yearOverYearChange: -300,
  trendDirection: 'down',
}

const statisticsWithStableTrend: PaymentStatistics = {
  currentPayments: 1500,
  paymentBase: 1500,
  yearOverYearChange: 0,
  trendDirection: 'stable',
}

const multiYearData: MultiYearPaymentData = {
  currentYear: {
    label: '2024-2025',
    data: multipleDataPoints,
  },
  previousYears: [
    {
      label: '2023-2024',
      data: [
        { date: '2023-07-01', payments: 900, programYearDay: 0 },
        { date: '2023-08-01', payments: 1100, programYearDay: 31 },
        { date: '2023-09-01', payments: 1300, programYearDay: 62 },
      ],
    },
  ],
}

describe('MembershipPaymentsChart', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  describe('Chart Rendering', () => {
    it('renders chart with single data point', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={singleDataPoint}
          statistics={baseStatistics}
          isLoading={false}
        />
      )

      // Chart container should be rendered
      const chartContainer = screen.getByRole('img', {
        name: /line chart showing ytd membership payments/i,
      })
      expect(chartContainer).toBeInTheDocument()

      // Chart title should be visible
      expect(screen.getByText('Membership Payments Trend')).toBeInTheDocument()
    })

    it('renders chart with multiple data points', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={baseStatistics}
          isLoading={false}
        />
      )

      const chartContainer = screen.getByRole('img', {
        name: /line chart showing ytd membership payments/i,
      })
      expect(chartContainer).toBeInTheDocument()
      expect(screen.getByText('Membership Payments Trend')).toBeInTheDocument()
    })

    it('renders chart with multi-year comparison data', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          multiYearData={multiYearData}
          statistics={baseStatistics}
          isLoading={false}
        />
      )

      const chartContainer = screen.getByRole('img', {
        name: /line chart showing ytd membership payments/i,
      })
      expect(chartContainer).toBeInTheDocument()
      expect(screen.getByText('Membership Payments Trend')).toBeInTheDocument()
    })
  })

  describe('Statistics Display', () => {
    it('displays current YTD payments statistic', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={baseStatistics}
          isLoading={false}
        />
      )

      // Current YTD Payments label should be visible
      const currentYTDLabel = screen.getByText('Current YTD Payments')
      expect(currentYTDLabel).toBeInTheDocument()

      // The value should be displayed within the Current YTD Payments section
      const currentYTDSection = currentYTDLabel.closest('div')
      expect(currentYTDSection).toBeInTheDocument()
      expect(within(currentYTDSection!).getByText('2,100')).toBeInTheDocument()
    })

    it('displays payment base when available', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={baseStatistics}
          isLoading={false}
        />
      )

      // Payment Base label should be visible
      expect(screen.getByText('Payment Base')).toBeInTheDocument()

      // The payment base value should be displayed
      const paymentBaseSection = screen.getByText('Payment Base').closest('div')
      expect(paymentBaseSection).toBeInTheDocument()
      expect(within(paymentBaseSection!).getByText('1,800')).toBeInTheDocument()
    })

    it('displays N/A when payment base is null', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={statisticsWithNullBase}
          isLoading={false}
        />
      )

      // Payment Base label should be visible
      expect(screen.getByText('Payment Base')).toBeInTheDocument()

      // N/A should be displayed for payment base
      const paymentBaseSection = screen.getByText('Payment Base').closest('div')
      expect(paymentBaseSection).toBeInTheDocument()
      expect(within(paymentBaseSection!).getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('Year-over-Year Change', () => {
    it('displays positive year-over-year change with up indicator', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={baseStatistics}
          isLoading={false}
        />
      )

      // Year-over-Year label should be visible
      expect(screen.getByText('Year-over-Year')).toBeInTheDocument()

      // The positive change value should be displayed with + sign
      const changeElements = screen.getAllByText('+150')
      expect(changeElements.length).toBeGreaterThan(0)
    })

    it('displays negative year-over-year change with down indicator', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={statisticsWithDownTrend}
          isLoading={false}
        />
      )

      expect(screen.getByText('Year-over-Year')).toBeInTheDocument()

      // The negative change value should be displayed
      const changeElements = screen.getAllByText('-300')
      expect(changeElements.length).toBeGreaterThan(0)
    })

    it('displays stable year-over-year change when no change', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={statisticsWithStableTrend}
          isLoading={false}
        />
      )

      expect(screen.getByText('Year-over-Year')).toBeInTheDocument()

      // Zero change should be displayed with + sign
      const changeElements = screen.getAllByText('+0')
      expect(changeElements.length).toBeGreaterThan(0)
    })

    it('displays N/A when year-over-year change is null', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={statisticsWithNullBase}
          isLoading={false}
        />
      )

      expect(screen.getByText('Year-over-Year')).toBeInTheDocument()

      // N/A should be displayed in the Year-over-Year section
      const yoySection = screen.getByText('Year-over-Year').closest('div')
      expect(yoySection).toBeInTheDocument()
      expect(within(yoySection!).getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('displays loading skeleton when isLoading is true', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={baseStatistics}
          isLoading={true}
        />
      )

      // Loading skeleton should be visible
      const loadingElement = screen.getByRole('status', {
        name: /loading chart/i,
      })
      expect(loadingElement).toBeInTheDocument()

      // Chart should NOT be visible
      const chartContainer = screen.queryByRole('img', {
        name: /line chart showing ytd membership payments/i,
      })
      expect(chartContainer).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('displays empty state when payment trend data is empty', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={[]}
          statistics={baseStatistics}
          isLoading={false}
        />
      )

      // Empty state should be visible
      expect(screen.getByText('No Payment Data Available')).toBeInTheDocument()

      // Chart should NOT be visible
      const chartContainer = screen.queryByRole('img', {
        name: /line chart showing ytd membership payments/i,
      })
      expect(chartContainer).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has appropriate ARIA labels for chart container', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={baseStatistics}
          isLoading={false}
        />
      )

      // Main container should have aria-label
      const mainContainer = screen.getByLabelText(
        'Membership payments trend chart'
      )
      expect(mainContainer).toBeInTheDocument()

      // Chart should have role="img" with descriptive aria-label
      const chartImg = screen.getByRole('img')
      expect(chartImg).toHaveAttribute('aria-label')
      expect(chartImg.getAttribute('aria-label')).toMatch(
        /line chart showing ytd membership payments/i
      )
    })

    it('includes statistics in chart description for screen readers', () => {
      renderWithProviders(
        <MembershipPaymentsChart
          paymentsTrend={multipleDataPoints}
          statistics={baseStatistics}
          isLoading={false}
        />
      )

      const chartImg = screen.getByRole('img')
      const ariaLabel = chartImg.getAttribute('aria-label')

      // Should include current payments in description
      expect(ariaLabel).toContain('2,100')
      // Should include year-over-year change
      expect(ariaLabel).toContain('+150')
    })
  })
})
