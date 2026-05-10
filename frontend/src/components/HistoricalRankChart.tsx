import React, { useState } from 'react'
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
import type { RankHistoryResponse } from '../types/districts'
import { formatLongDate, parseLocalDate } from '../utils/dateFormatting'
import { useResponsiveTickInterval } from '../hooks/useResponsiveChartTicks'

interface HistoricalRankChartProps {
  data: RankHistoryResponse[]
  isLoading: boolean
  isError: boolean
  error?: Error | null
  /** Override program year label (prevents stale label from cached data) */
  selectedProgramYear?: {
    year: string | number
    startDate: string
    endDate: string
  }
}

type RankMetric = 'aggregate' | 'clubs' | 'payments' | 'distinguished'

interface TooltipPayload {
  dataKey: string
  value: number
  color: string
}

// Custom tooltip moved outside render
const CustomTooltip = ({
  active,
  payload,
  data,
  selectedMetric,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  data: RankHistoryResponse[]
  selectedMetric: RankMetric
}) => {
  if (active && payload && payload.length) {
    const date = (payload[0] as unknown as { payload: { date: string } })
      .payload.date
    const formattedDate = formatLongDate(date)

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs">
        <p className="text-sm font-medium text-gray-900 mb-2">
          {formattedDate}
        </p>
        {payload.map((entry: TooltipPayload, index: number) => {
          const districtData = data.find(d => d.districtId === entry.dataKey)
          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-semibold">
                {districtData?.districtName || entry.dataKey}:
              </span>{' '}
              {selectedMetric === 'aggregate'
                ? `Score ${Math.round(entry.value)}`
                : `Rank #${entry.value}`}
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

const DISTRICT_COLORS = [
  'var(--tm-loyal-blue)', // Primary data series - TM Loyal Blue
  'var(--tm-true-maroon)', // Secondary data series - TM True Maroon
  'var(--tm-cool-gray)', // Tertiary data series - TM Cool Gray
  'var(--tm-happy-yellow)', // Accent data series - TM Happy Yellow
  'var(--tm-loyal-blue-80)', // Additional series with opacity
  'var(--tm-true-maroon-80)', // Additional series with opacity
  'var(--tm-cool-gray-80)', // Additional series with opacity
  'var(--tm-happy-yellow-80)', // Additional series with opacity
]

const HistoricalRankChart: React.FC<HistoricalRankChartProps> = ({
  data,
  isLoading,
  isError,
  error,
  selectedProgramYear,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<RankMetric>('aggregate')
  // Responsive tick interval for mobile (#237) — must be called before early returns
  const tickInterval = useResponsiveTickInterval(
    data?.reduce((count, d) => count + d.history.length, 0) ?? 0
  )

  if (isLoading) {
    return (
      <section
        className="redesign-panel"
        aria-busy="true"
        aria-label="Loading historical rank data"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Historical Rank Progression
        </h2>
        <div className="flex items-center justify-center h-80">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 w-32 bg-gray-300 rounded-sm mb-2"></div>
            <div className="h-4 w-24 bg-gray-300 rounded-sm"></div>
          </div>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section
        className="redesign-panel"
        role="alert"
        aria-label="Historical rank data error"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Historical Rank Progression
        </h2>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">
              Failed to load historical rank data
            </p>
            <p className="text-gray-600 text-sm">
              {error?.message || 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (!data || data.length === 0) {
    return (
      <section
        className="redesign-panel"
        role="status"
        aria-label="Historical rank data"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Historical Rank Progression
        </h2>
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-600">
            No historical rank data available. Select regions above to view rank
            progression.
          </p>
        </div>
      </section>
    )
  }

  // Use selectedProgramYear prop if provided, fall back to data (#232)
  const programYear = selectedProgramYear ?? data[0]?.programYear

  // Combine all dates from all districts
  const allDates = new Set<string>()
  data.forEach(district => {
    district.history.forEach(point => {
      allDates.add(point.date)
    })
  })

  // Sort dates chronologically
  const sortedDates = Array.from(allDates).sort()

  // Transform data for chart
  const chartData = sortedDates.map(date => {
    const dataPoint: Record<string, string | number> = { date }

    data.forEach(district => {
      const point = district.history.find(p => p.date === date)
      if (point) {
        let value: number
        switch (selectedMetric) {
          case 'clubs':
            value = point.clubsRank
            break
          case 'payments':
            value = point.paymentsRank
            break
          case 'distinguished':
            value = point.distinguishedRank
            break
          default:
            value = point.aggregateScore
        }
        dataPoint[district.districtId] = value
      }
    })

    return dataPoint
  })

  // Generate chart description for accessibility
  const metricLabel = {
    aggregate: 'Overall Score',
    clubs: 'Paid Clubs Rank',
    payments: 'Total Payments Rank',
    distinguished: 'Distinguished Clubs Rank',
  }[selectedMetric]

  const chartDescription = `Line chart showing ${metricLabel} progression for ${data.length} district${data.length !== 1 ? 's' : ''} over the program year from ${programYear?.startDate || 'July 1'} to ${programYear?.endDate || 'June 30'}.`

  return (
    <section
      className="redesign-panel sm:p-6"
      aria-label="Historical rank progression chart"
    >
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Historical Rank Progression
          </h2>
          {programYear && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Program Year: {programYear.year} ({programYear.startDate} to{' '}
              {programYear.endDate})
            </p>
          )}
        </div>

        {/* Metric Toggle */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mr-2">
            View:
          </span>
          <button
            onClick={() => setSelectedMetric('aggregate')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors font-tm-body ${
              selectedMetric === 'aggregate'
                ? 'bg-tm-loyal-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={selectedMetric === 'aggregate'}
          >
            Overall Score
          </button>
          <button
            onClick={() => setSelectedMetric('clubs')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors font-tm-body ${
              selectedMetric === 'clubs'
                ? 'bg-tm-loyal-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={selectedMetric === 'clubs'}
          >
            Paid Clubs
          </button>
          <button
            onClick={() => setSelectedMetric('payments')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors font-tm-body ${
              selectedMetric === 'payments'
                ? 'bg-tm-loyal-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={selectedMetric === 'payments'}
          >
            Total Payments
          </button>
          <button
            onClick={() => setSelectedMetric('distinguished')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors font-tm-body ${
              selectedMetric === 'distinguished'
                ? 'bg-tm-loyal-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={selectedMetric === 'distinguished'}
          >
            Distinguished
          </button>
        </div>
      </div>

      <div
        role="img"
        aria-label={chartDescription}
        aria-describedby="rank-chart-desc"
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
                interval={tickInterval || 'preserveStartEnd'}
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
                reversed={selectedMetric !== 'aggregate'}
                label={
                  selectedMetric === 'aggregate'
                    ? {
                        value: 'Score (lower is better)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '12px' },
                      }
                    : {
                        value: 'Rank (lower is better)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '12px' },
                      }
                }
              />
              <Tooltip
                content={
                  <CustomTooltip data={data} selectedMetric={selectedMetric} />
                }
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                verticalAlign="top"
                height={36}
                formatter={value => {
                  const district = data.find(d => d.districtId === value)
                  return district?.districtName || value
                }}
              />
              {data.map((district, index) => {
                const color =
                  DISTRICT_COLORS[index % DISTRICT_COLORS.length] ??
                  'var(--tm-loyal-blue)'
                return (
                  <Line
                    key={district.districtId}
                    type="monotone"
                    dataKey={district.districtId}
                    stroke={color}
                    strokeWidth={2}
                    dot={{
                      fill: color,
                      r: 0.3,
                    }}
                    activeDot={{ r: 0.5 }}
                    name={district.districtId}
                    connectNulls
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p id="rank-chart-desc" className="sr-only">
        {chartDescription}
      </p>
    </section>
  )
}

export default HistoricalRankChart
