import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type {
  RankHistoryResponse,
  HistoricalRankPoint,
} from '../types/districts'
import type { ProgramYear } from '../utils/programYear'
import { formatLongDate, parseLocalDate } from '../utils/dateFormatting'

/**
 * Rank metric types for the chart
 */
export type RankMetric = 'aggregate' | 'clubs' | 'payments' | 'distinguished'

/**
 * Props for the FullYearRankingChart component
 */
export interface FullYearRankingChartProps {
  /** Rank history data for the selected program year */
  data: RankHistoryResponse | null
  /** Currently selected metric to display */
  selectedMetric: RankMetric
  /** Callback when metric selection changes */
  onMetricChange: (metric: RankMetric) => void
  /** Whether data is currently loading */
  isLoading: boolean
  /** The program year being displayed */
  programYear: ProgramYear
}

/**
 * Metric configuration for display labels and chart settings
 */
interface MetricConfig {
  label: string
  shortLabel: string
  dataKey: keyof HistoricalRankPoint
  description: string
}

const METRIC_CONFIG: Record<RankMetric, MetricConfig> = {
  aggregate: {
    label: 'Overall Rank',
    shortLabel: 'Overall',
    dataKey: 'overallRank',
    description: 'Overall ranking position based on aggregate score (1 = best)',
  },
  clubs: {
    label: 'Paid Clubs Rank',
    shortLabel: 'Clubs',
    dataKey: 'clubsRank',
    description: 'Ranking based on paid club count relative to base',
  },
  payments: {
    label: 'Membership Payments Rank',
    shortLabel: 'Payments',
    dataKey: 'paymentsRank',
    description: 'Ranking based on total membership payments relative to base',
  },
  distinguished: {
    label: 'Distinguished Clubs Rank',
    shortLabel: 'Distinguished',
    dataKey: 'distinguishedRank',
    description:
      'Ranking based on percentage of clubs achieving distinguished status',
  },
}

/**
 * Tooltip payload type for recharts
 */
interface TooltipPayload {
  dataKey: string
  value: number
  color: string
  payload: ChartDataPoint
}

/**
 * Chart data point structure
 */
interface ChartDataPoint {
  date: string
  value: number
}

/**
 * Custom tooltip component for the chart
 */
interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  selectedMetric: RankMetric
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  selectedMetric,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const dataPoint = payload[0]
  if (!dataPoint) {
    return null
  }

  // Use the label (date) from recharts, or fall back to payload data
  const dateToFormat = label || dataPoint.payload?.date
  const formattedDate = dateToFormat
    ? formatLongDate(dateToFormat)
    : 'Unknown date'
  const metricConfig = METRIC_CONFIG[selectedMetric]

  // Get the value - it could be in dataPoint.value or dataPoint.payload.value
  const value = dataPoint.value ?? dataPoint.payload?.value ?? 0

  return (
    <div
      className="redesign-panel"
      style={{ minWidth: 180, padding: 12 }}
      role="tooltip"
    >
      <p className="text-sm font-medium text-gray-900 mb-1 whitespace-nowrap">
        {formattedDate}
      </p>
      <p className="text-sm whitespace-nowrap" style={{ color: 'var(--link)' }}>
        {metricConfig.shortLabel}: Rank #{value}
      </p>
    </div>
  )
}

/**
 * Metric toggle button component
 */
interface MetricToggleButtonProps {
  metric: RankMetric
  selectedMetric: RankMetric
  onSelect: (metric: RankMetric) => void
}

const MetricToggleButton: React.FC<MetricToggleButtonProps> = ({
  metric,
  selectedMetric,
  onSelect,
}) => {
  const isSelected = metric === selectedMetric
  const config = METRIC_CONFIG[metric]

  return (
    <button
      onClick={() => onSelect(metric)}
      className={
        'districts-toolbar__sort-btn' +
        (isSelected ? ' districts-toolbar__sort-btn--active' : '')
      }
      style={{ minHeight: 44 }}
      aria-pressed={isSelected}
      aria-label={`View ${config.label}`}
    >
      {config.shortLabel}
    </button>
  )
}

/**
 * Loading skeleton for the chart
 */
const ChartLoadingSkeleton: React.FC = () => (
  <section
    className="redesign-panel sm:p-6"
    aria-busy="true"
    aria-label="Loading ranking progression chart"
  >
    <div className="flex flex-col gap-4 mb-4">
      <div className="h-6 w-48 bg-gray-300 rounded-sm animate-pulse" />
      <div className="h-4 w-32 bg-gray-300 rounded-sm animate-pulse" />
    </div>
    <div className="flex flex-wrap gap-2 mb-4">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="h-10 w-24 bg-gray-300 rounded-lg animate-pulse"
        />
      ))}
    </div>
    <div className="flex items-center justify-center h-80">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-4 w-32 bg-gray-300 rounded-sm mb-2" />
        <div className="h-4 w-24 bg-gray-300 rounded-sm" />
      </div>
    </div>
  </section>
)

/**
 * Empty state when no data is available
 */
interface EmptyStateProps {
  programYear: ProgramYear
}

const EmptyState: React.FC<EmptyStateProps> = ({ programYear }) => (
  <section
    className="redesign-panel sm:p-6"
    role="status"
    aria-label="No ranking data available"
  >
    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 font-tm-headline mb-4">
      Ranking Progression
    </h2>
    <div className="flex items-center justify-center h-80">
      <p className="text-base text-gray-600 font-tm-body text-center">
        No ranking data available for the {programYear.label} program year.
      </p>
    </div>
  </section>
)

/**
 * FullYearRankingChart Component
 *
 * Displays a line chart showing ranking progression throughout a program year.
 * Extends the HistoricalRankChart pattern with:
 * - Metric toggle (Overall/Clubs/Payments/Distinguished)
 * - Inverted Y-axis (rank 1 at top)
 * - Tooltip showing exact rank and date on hover
 * - Toastmasters brand colors
 * - Accessibility features (aria-label, screen reader description)
 * - Horizontal scroll for mobile viewports
 *
 * @example
 * ```tsx
 * <FullYearRankingChart
 *   data={rankHistory}
 *   selectedMetric="clubs"
 *   onMetricChange={setSelectedMetric}
 *   isLoading={false}
 *   programYear={currentProgramYear}
 * />
 * ```
 */
const FullYearRankingChart: React.FC<FullYearRankingChartProps> = ({
  data,
  selectedMetric,
  onMetricChange,
  isLoading,
  programYear,
}) => {
  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <ChartLoadingSkeleton />
  }

  // Show empty state if no data
  if (!data || data.history.length === 0) {
    return <EmptyState programYear={programYear} />
  }

  const metricConfig = METRIC_CONFIG[selectedMetric]

  // Sort history chronologically
  const sortedHistory = [...data.history].sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  // Transform data for the chart
  const chartData: ChartDataPoint[] = sortedHistory.map(point => ({
    date: point.date,
    value: point[metricConfig.dataKey] as number,
  }))

  // Generate accessible description
  const chartDescription = generateChartDescription(
    data,
    selectedMetric,
    programYear,
    chartData
  )

  return (
    <section
      className="redesign-panel sm:p-6"
      aria-label="Full year ranking progression chart"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 font-tm-headline">
            Ranking Progression
          </h2>
          <p className="text-sm text-gray-600 font-tm-body mt-1">
            Program Year: {programYear.label} ({programYear.startDate} to{' '}
            {programYear.endDate})
          </p>
        </div>

        {/* Metric Toggle */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Select ranking metric"
        >
          <span className="text-sm font-medium text-gray-600 font-tm-body self-center mr-2">
            View:
          </span>
          <MetricToggleButton
            metric="aggregate"
            selectedMetric={selectedMetric}
            onSelect={onMetricChange}
          />
          <MetricToggleButton
            metric="clubs"
            selectedMetric={selectedMetric}
            onSelect={onMetricChange}
          />
          <MetricToggleButton
            metric="payments"
            selectedMetric={selectedMetric}
            onSelect={onMetricChange}
          />
          <MetricToggleButton
            metric="distinguished"
            selectedMetric={selectedMetric}
            onSelect={onMetricChange}
          />
        </div>
      </div>

      {/* Chart container with horizontal scroll for mobile */}
      <div
        role="img"
        aria-label={chartDescription}
        aria-describedby="full-year-rank-chart-desc"
        className="w-full overflow-x-auto"
      >
        <div className="min-w-[320px]">
          <ResponsiveContainer width="100%" height={400} minWidth={320}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
              aria-hidden="true"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--tm-cool-gray-20)"
              />
              <XAxis
                dataKey="date"
                stroke="var(--tm-cool-gray)"
                style={{ fontSize: '10px' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
                tickFormatter={value => {
                  const date = parseLocalDate(value)
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }}
              />
              <YAxis
                stroke="var(--tm-cool-gray)"
                style={{ fontSize: '10px' }}
                width={50}
                reversed={true}
                domain={['dataMin', 'dataMax'] as const}
                label={{
                  value: 'Rank (1 = best)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '12px' },
                }}
              />
              <Tooltip
                content={<CustomTooltip selectedMetric={selectedMetric} />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--tm-loyal-blue)"
                strokeWidth={2}
                dot={{
                  fill: 'var(--tm-loyal-blue)',
                  r: 0.3,
                }}
                activeDot={{
                  r: 6,
                  fill: 'var(--tm-loyal-blue)',
                  stroke: 'var(--tm-white)',
                  strokeWidth: 2,
                }}
                name={metricConfig.label}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Screen reader accessible description */}
      <p id="full-year-rank-chart-desc" className="sr-only">
        {chartDescription}
      </p>
    </section>
  )
}

/**
 * Generate an accessible description of the chart for screen readers
 */
function generateChartDescription(
  data: RankHistoryResponse,
  selectedMetric: RankMetric,
  programYear: ProgramYear,
  chartData: ChartDataPoint[]
): string {
  const metricConfig = METRIC_CONFIG[selectedMetric]
  const dataPointCount = chartData.length

  if (dataPointCount === 0) {
    return `No ${metricConfig.label} data available for ${data.districtName} in the ${programYear.label} program year.`
  }

  const firstPoint = chartData[0]
  const lastPoint = chartData[dataPointCount - 1]

  if (!firstPoint || !lastPoint) {
    return `${metricConfig.label} chart for ${data.districtName} in the ${programYear.label} program year.`
  }

  // Calculate trend
  const startValue = firstPoint.value
  const endValue = lastPoint.value
  const change = endValue - startValue

  // All metrics are now rank-based (#89), lower rank is better
  let trendDescription: string
  if (change < 0) {
    trendDescription = `improved from rank ${startValue} to rank ${endValue}`
  } else if (change > 0) {
    trendDescription = `declined from rank ${startValue} to rank ${endValue}`
  } else {
    trendDescription = `remained at rank ${startValue}`
  }

  return `Line chart showing ${metricConfig.label} progression for ${data.districtName} over the ${programYear.label} program year. The chart contains ${dataPointCount} data points. The district ${trendDescription}. The rank is displayed on the Y-axis with rank 1 at the top, and dates are shown on the X-axis.`
}

export default FullYearRankingChart
