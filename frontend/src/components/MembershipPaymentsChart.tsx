/**
 * MembershipPaymentsChart Component
 *
 * Displays YTD membership payment data over time with multi-year comparison.
 * Shows current year trend line plus up to 2 previous years for comparison.
 *
 * Requirements: 1.2, 1.3, 1.4, 2.3, 2.5, 5.1, 5.5, 6.1, 6.3
 */

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { LoadingSkeleton } from './LoadingSkeleton'
import { EmptyState } from './ErrorDisplay'
import { useResponsiveTickInterval } from '../hooks/useResponsiveChartTicks'
import type { PaymentTrendDataPoint } from '../utils/paymentTrend'
import type {
  MultiYearPaymentData,
  PaymentStatistics,
} from '../hooks/usePaymentsTrend'

/**
 * Props for the MembershipPaymentsChart component
 */
export interface MembershipPaymentsChartProps {
  /** Current year payment trend data */
  paymentsTrend: PaymentTrendDataPoint[]
  /** Multi-year data for comparison (current + previous years) */
  multiYearData?: MultiYearPaymentData | null
  /** Payment statistics including YoY change */
  statistics: PaymentStatistics
  /** Loading state */
  isLoading?: boolean
}

/**
 * Chart data point structure for Recharts
 * Uses programYearDay as X-axis for multi-year alignment
 */
interface ChartDataPoint {
  programYearDay: number
  [key: string]: number | undefined
}

/**
 * Brand colors for chart lines
 * TM Loyal Blue for current year, TM True Maroon for previous year, TM Cool Gray for older
 */
const YEAR_COLORS = [
  'var(--tm-loyal-blue)', // Current year
  'var(--tm-true-maroon)', // Previous year
  'var(--tm-cool-gray)', // Older year
]

/**
 * Custom tooltip component for the chart
 * Shows date and payment count for each year at the hovered point
 */
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    payload: ChartDataPoint
  }>
  label?: number
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">
        Day {payload[0]?.payload.programYearDay} of Program Year
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-semibold">{entry.name}:</span>{' '}
            {entry.value?.toLocaleString() ?? 'N/A'} payments
          </p>
        ))}
      </div>
    </div>
  )
}

/**
 * Year-over-year change indicator component
 * Shows up/down arrow with percentage change
 *
 * Requirements: 6.2, 6.4
 */
interface YearOverYearIndicatorProps {
  change: number | null
  direction: 'up' | 'down' | 'stable' | null
}

const YearOverYearIndicator: React.FC<YearOverYearIndicatorProps> = ({
  change,
  direction,
}) => {
  if (change === null || direction === null) {
    return null
  }

  const isPositive = direction === 'up'
  const isNegative = direction === 'down'

  return (
    <div
      className={`flex items-center gap-1 ${
        isPositive
          ? 'text-green-600'
          : isNegative
            ? 'text-red-600'
            : 'text-gray-600'
      }`}
      aria-label={`Year over year change: ${change >= 0 ? '+' : ''}${change} payments`}
    >
      {isPositive && (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      )}
      {isNegative && (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      )}
      {direction === 'stable' && (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14"
          />
        </svg>
      )}
      <span className="text-sm font-semibold">
        {change >= 0 ? '+' : ''}
        {change}
      </span>
    </div>
  )
}

/**
 * Build chart data from multi-year payment data
 * Aligns data points by programYearDay for accurate comparison
 */
function buildChartData(
  multiYearData: MultiYearPaymentData | null | undefined,
  currentYearTrend: PaymentTrendDataPoint[]
): ChartDataPoint[] {
  if (!multiYearData) {
    // Single year mode - just use current year data
    return currentYearTrend.map(point => ({
      programYearDay: point.programYearDay,
      'Current Year': point.payments,
    }))
  }

  // Collect all unique programYearDays
  const allDays = new Set<number>()

  multiYearData.currentYear.data.forEach(p => allDays.add(p.programYearDay))
  multiYearData.previousYears.forEach(year => {
    year.data.forEach(p => allDays.add(p.programYearDay))
  })

  // Sort days
  const sortedDays = Array.from(allDays).sort((a, b) => a - b)

  // Build data points for each day
  return sortedDays.map(day => {
    const point: ChartDataPoint = { programYearDay: day }

    // Current year
    const currentPoint = multiYearData.currentYear.data.find(
      p => p.programYearDay === day
    )
    if (currentPoint) {
      point[multiYearData.currentYear.label] = currentPoint.payments
    }

    // Previous years
    multiYearData.previousYears.forEach(year => {
      const yearPoint = year.data.find(p => p.programYearDay === day)
      if (yearPoint) {
        point[year.label] = yearPoint.payments
      }
    })

    return point
  })
}

/**
 * Get all year labels for the legend
 */
function getYearLabels(
  multiYearData: MultiYearPaymentData | null | undefined
): string[] {
  if (!multiYearData) {
    return ['Current Year']
  }

  return [
    multiYearData.currentYear.label,
    ...multiYearData.previousYears.map(y => y.label),
  ]
}

/**
 * MembershipPaymentsChart Component
 *
 * Displays a line chart of YTD membership payments over time with multi-year comparison.
 * Includes statistics summary panel, custom tooltip, and legend.
 *
 * Requirements:
 * - 1.2: Display line chart with time on X-axis and YTD payment count on Y-axis
 * - 1.3: Show YTD payments trend line for current program year
 * - 1.4: Display tooltip showing date and YTD payment count on hover
 * - 2.3: Visually distinguish each year's data using different colors
 * - 2.5: Include legend identifying each year's data series
 * - 5.1: Use Toastmasters brand colors
 * - 5.5: Use same styling patterns as MembershipTrendChart
 * - 6.1: Display summary statistics including current YTD payments
 * - 6.3: Display payment base value when available
 */
export const MembershipPaymentsChart: React.FC<
  MembershipPaymentsChartProps
> = ({ paymentsTrend, multiYearData, statistics, isLoading = false }) => {
  // Responsive tick interval for mobile (#237) — must be called before early returns
  const tickInterval = useResponsiveTickInterval(paymentsTrend?.length ?? 0)

  // Loading state - Requirement 4.1
  if (isLoading) {
    return <LoadingSkeleton variant="chart" />
  }

  // Empty state - Requirements 4.2, 4.3
  if (!paymentsTrend || paymentsTrend.length === 0) {
    return (
      <EmptyState
        title="No Payment Data Available"
        message="There isn't enough historical data to display payment trends. Payment data will appear here once snapshots with payment information are collected."
        icon="data"
      />
    )
  }

  const chartData = buildChartData(multiYearData, paymentsTrend)
  const yearLabels = getYearLabels(multiYearData)

  // Calculate chart description for accessibility
  const chartDescription = `Line chart showing YTD membership payments over time. Current payments: ${statistics.currentPayments.toLocaleString()}${
    statistics.yearOverYearChange !== null
      ? `. Year-over-year change: ${statistics.yearOverYearChange >= 0 ? '+' : ''}${statistics.yearOverYearChange}`
      : ''
  }.`

  // Format X-axis label (program year day to month approximation)
  const formatXAxis = (day: number): string => {
    // Approximate month from program year day (July = 0, August = 31, etc.)
    const months = [
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
    ]
    const monthIndex = Math.min(Math.floor(day / 30.5), 11)
    return months[monthIndex] ?? ''
  }

  return (
    <div
      className="redesign-panel"
      aria-label="Membership payments trend chart"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 font-tm-headline">
          Membership Payments Trend
        </h2>
        <p className="text-sm text-gray-600 mt-1 font-tm-body">
          YTD membership payments over time with year-over-year comparison
        </p>
      </div>

      {/* Statistics Summary Panel - Requirements 6.1, 6.2, 6.3, 6.4 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {/* Current YTD Payments */}
        <div className="bg-tm-loyal-blue-10 rounded-lg p-3 border border-tm-loyal-blue-20">
          <p className="text-xs text-tm-loyal-blue font-medium font-tm-body">
            Current YTD Payments
          </p>
          <p className="text-2xl font-bold text-tm-loyal-blue font-tm-headline">
            {statistics.currentPayments.toLocaleString()}
          </p>
        </div>

        {/* Year-over-Year Change */}
        <div
          className={`rounded-lg p-3 border ${
            statistics.trendDirection === 'up'
              ? 'bg-green-50 border-green-200'
              : statistics.trendDirection === 'down'
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
          }`}
        >
          <p
            className={`text-xs font-medium font-tm-body ${
              statistics.trendDirection === 'up'
                ? 'text-green-700'
                : statistics.trendDirection === 'down'
                  ? 'text-red-700'
                  : 'text-gray-700'
            }`}
          >
            Year-over-Year
          </p>
          {statistics.yearOverYearChange !== null ? (
            <div className="flex items-baseline gap-2">
              <p
                className={`text-2xl font-bold font-tm-headline ${
                  statistics.trendDirection === 'up'
                    ? 'text-green-900'
                    : statistics.trendDirection === 'down'
                      ? 'text-red-900'
                      : 'text-gray-900'
                }`}
              >
                {statistics.yearOverYearChange >= 0 ? '+' : ''}
                {statistics.yearOverYearChange}
              </p>
              <YearOverYearIndicator
                change={statistics.yearOverYearChange}
                direction={statistics.trendDirection}
              />
            </div>
          ) : (
            <p className="text-lg text-gray-500 font-tm-body">N/A</p>
          )}
        </div>

        {/* Payment Base */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-700 font-medium font-tm-body">
            Payment Base
          </p>
          <p className="text-2xl font-bold text-gray-900 font-tm-headline">
            {statistics.paymentBase !== null
              ? statistics.paymentBase.toLocaleString()
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Chart - Requirements 1.2, 1.3, 1.4, 2.3, 5.2, 5.3 */}
      <div
        role="img"
        aria-label={chartDescription}
        className="w-full overflow-x-auto"
      >
        <div className="min-w-[320px]">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--tm-cool-gray-20)"
              />
              <XAxis
                dataKey="programYearDay"
                stroke="var(--tm-cool-gray)"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={formatXAxis}
                interval={tickInterval}
                label={{
                  value: 'Program Year Month',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: '12px' },
                }}
              />
              <YAxis
                stroke="var(--tm-cool-gray)"
                style={{ fontSize: '11px' }}
                label={{
                  value: 'YTD Payments',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '12px' },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                verticalAlign="top"
                height={36}
              />

              {/* Render a line for each year */}
              {yearLabels.map((label, index) => {
                const color =
                  YEAR_COLORS[index] ?? YEAR_COLORS[2] ?? 'var(--tm-cool-gray)'
                return (
                  <Line
                    key={label}
                    type="monotone"
                    dataKey={label}
                    stroke={color}
                    strokeWidth={index === 0 ? 3 : 2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    name={label}
                    connectNulls
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend explanation */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-1 rounded-sm"
            style={{ backgroundColor: 'var(--tm-loyal-blue)' }}
          ></div>
          <span className="font-tm-body">Current Year</span>
        </div>
        {multiYearData && multiYearData.previousYears.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-1 rounded-sm"
                style={{ backgroundColor: 'var(--tm-true-maroon)' }}
              ></div>
              <span className="font-tm-body">Previous Year</span>
            </div>
            {multiYearData.previousYears.length > 1 && (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-1 rounded-sm"
                  style={{ backgroundColor: 'var(--tm-cool-gray)' }}
                ></div>
                <span className="font-tm-body">2 Years Ago</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
