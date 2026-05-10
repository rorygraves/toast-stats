import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import { LoadingSkeleton } from './LoadingSkeleton'
import { EmptyState } from './ErrorDisplay'
import { formatLongDate, parseLocalDate } from '../utils/dateFormatting'
import { useResponsiveTickInterval } from '../hooks/useResponsiveChartTicks'

/** A named set of data points for one program year */
export interface YearTrendData {
  label: string
  data: Array<{ date: string; count: number }>
}

interface MembershipTrendChartProps {
  membershipTrend: Array<{ date: string; count: number }>
  isLoading?: boolean
  /** Prior-year trend data for YoY comparison overlay (#238) */
  priorYearTrends?: YearTrendData[] | undefined
}

interface Period {
  start: number
  end: number
  type: 'growth' | 'decline'
}

// Custom tooltip moved outside render
const CustomTooltip = ({
  active,
  payload,
  sortedData,
  periods,
}: {
  active?: boolean
  payload?: Array<{ payload: { date: string; count: number } }>
  sortedData: Array<{ date: string; count: number }>
  periods: Period[]
}) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    if (!data) return null

    const formattedDate = formatLongDate(data.date)

    // Find if this point is in a growth/decline period
    const pointIndex = sortedData.findIndex(d => d.date === data.date)
    const period = periods.find(
      p => pointIndex >= p.start && pointIndex <= p.end
    )

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {formattedDate}
        </p>
        <p className="text-sm text-tm-loyal-blue font-semibold">
          Members: {data.count.toLocaleString()}
        </p>
        {period && (
          <p
            className={`text-xs mt-1 ${
              period.type === 'growth' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {period.type === 'growth'
              ? '📈 Growth Period'
              : '📉 Decline Period'}
          </p>
        )}
      </div>
    )
  }
  return null
}

const PRIOR_YEAR_COLORS = ['var(--tm-cool-gray)', 'var(--tm-true-maroon-80)']

export const MembershipTrendChart: React.FC<MembershipTrendChartProps> = ({
  membershipTrend,
  isLoading,
  priorYearTrends,
}) => {
  // Responsive tick interval for mobile (#237) — must be called before early returns
  const tickInterval = useResponsiveTickInterval(membershipTrend?.length ?? 0)

  if (isLoading) {
    return <LoadingSkeleton variant="chart" />
  }

  if (!membershipTrend || membershipTrend.length === 0) {
    return (
      <EmptyState
        title="No Membership Trend Data"
        message="There isn't enough historical data to display membership trends. Collect more data over time to see trends."
        icon="data"
      />
    )
  }

  // Sort current year data by date
  const rawSorted = [...membershipTrend].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // --- Merge prior-year data into unified dataset (#243) ---
  // Use program-year month index (Jul=0, Aug=1, ..., Jun=11) for alignment
  const toMonthIndex = (dateStr: string): number => {
    const d = parseLocalDate(dateStr)
    const m = d.getMonth() // 0=Jan ... 6=Jul ... 11=Dec
    return m >= 6 ? m - 6 : m + 6 // Jul=0, Aug=1, ..., Jun=11
  }

  // Build a map from monthIndex → prior year membership for each prior year
  const priorYearKeys: string[] = []
  const priorMonthMaps: Map<number, number>[] = []
  if (priorYearTrends && priorYearTrends.length > 0) {
    for (const yt of priorYearTrends) {
      priorYearKeys.push(yt.label)
      const monthMap = new Map<number, number>()
      for (const dp of yt.data) {
        const mi = toMonthIndex(dp.date)
        // If multiple points in same month, use the latest
        monthMap.set(mi, dp.count)
      }
      priorMonthMaps.push(monthMap)
    }
  }

  // Merge: add prior year values to each current-year data point
  type MergedDataPoint = {
    date: string
    count: number
    [key: string]: string | number | undefined
  }
  const sortedData: MergedDataPoint[] = rawSorted.map(point => {
    const merged: MergedDataPoint = { date: point.date, count: point.count }
    const mi = toMonthIndex(point.date)
    for (let i = 0; i < priorYearKeys.length; i++) {
      const key = `prior_${i}`
      merged[key] = priorMonthMaps[i]?.get(mi)
    }
    return merged
  })

  // Calculate statistics
  const counts = sortedData.map(d => d.count)
  const maxMembership = Math.max(...counts)
  const minMembership = Math.min(...counts)
  const startMembership = counts[0] ?? 0
  const endMembership = counts[counts.length - 1] ?? 0
  const netChange = endMembership - startMembership
  const percentChange =
    startMembership > 0
      ? ((netChange / startMembership) * 100).toFixed(1)
      : '0.0'

  // Detect growth/decline periods (3+ consecutive increases/decreases)
  const periods: Array<{
    start: number
    end: number
    type: 'growth' | 'decline'
  }> = []
  let currentPeriod: { start: number; type: 'growth' | 'decline' } | null = null

  for (let i = 1; i < sortedData.length; i++) {
    const current = sortedData[i]
    const previous = sortedData[i - 1]
    if (!current || !previous) continue

    const change = current.count - previous.count
    const type = change > 0 ? 'growth' : change < 0 ? 'decline' : null

    if (type) {
      if (!currentPeriod || currentPeriod.type !== type) {
        if (currentPeriod && i - currentPeriod.start >= 3) {
          periods.push({ ...currentPeriod, end: i - 1 })
        }
        currentPeriod = { start: i - 1, type }
      }
    } else {
      if (currentPeriod && i - currentPeriod.start >= 3) {
        periods.push({ ...currentPeriod, end: i - 1 })
      }
      currentPeriod = null
    }
  }

  if (currentPeriod && sortedData.length - currentPeriod.start >= 3) {
    periods.push({ ...currentPeriod, end: sortedData.length - 1 })
  }

  // Detect seasonal patterns (simple: compare same months across different periods)
  const monthlyAverages: { [key: string]: number[] } = {}
  sortedData.forEach(point => {
    const month = new Date(point.date).getMonth()
    if (!monthlyAverages[month]) {
      monthlyAverages[month] = []
    }
    monthlyAverages[month].push(point.count)
  })

  // Find months with consistent patterns
  const seasonalMonths: Array<{ month: number; pattern: 'high' | 'low' }> = []
  Object.entries(monthlyAverages).forEach(([month, values]) => {
    if (values.length >= 2) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const overallAvg = counts.reduce((a, b) => a + b, 0) / counts.length
      const deviation = ((avg - overallAvg) / overallAvg) * 100

      if (Math.abs(deviation) > 5) {
        seasonalMonths.push({
          month: parseInt(month),
          pattern: deviation > 0 ? 'high' : 'low',
        })
      }
    }
  })

  // Program year milestones (Toastmasters year: July 1 - June 30)
  const milestones: Array<{ date: string; label: string }> = []
  const firstDataPoint = sortedData[0]
  const lastDataPoint = sortedData[sortedData.length - 1]

  if (!firstDataPoint || !lastDataPoint) {
    return <div>No data available</div>
  }

  const startDate = new Date(firstDataPoint.date)
  const endDate = new Date(lastDataPoint.date)

  // Add program year start dates (July 1)
  for (
    let year = startDate.getFullYear();
    year <= endDate.getFullYear() + 1;
    year++
  ) {
    const julyFirst = new Date(year, 6, 1) // Month is 0-indexed
    if (julyFirst >= startDate && julyFirst <= endDate) {
      const dateString = julyFirst.toISOString().split('T')[0]
      if (dateString) {
        milestones.push({
          date: dateString,
          label: `PY ${year}-${year + 1}`,
        })
      }
    }
  }

  // Format date for X-axis (using utility to avoid UTC timezone shift)
  const formatXAxis = (dateStr: string) => {
    const date = parseLocalDate(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const chartDescription = `Line chart showing district membership trend from ${firstDataPoint.date} to ${lastDataPoint.date}. Membership ${netChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(netChange)} members (${percentChange}%).`

  return (
    <div
      className="redesign-panel"
      aria-label="District membership trend chart"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 font-tm-headline flex items-center">
          District Membership Trend
          <a
            href="/methodology#district-membership-trend"
            aria-label="info"
            title="How is this calculated?"
            className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </h2>
        <p className="text-sm text-gray-600 mt-1 font-tm-body">
          Paid members per snapshot · Source: Toastmasters District Performance
          · Program-year milestones overlaid
        </p>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-tm-loyal-blue-10 rounded-lg p-3 border border-tm-loyal-blue-20">
          <p className="text-xs text-tm-loyal-blue font-medium font-tm-body">
            Current
          </p>
          <p className="text-2xl font-bold text-tm-loyal-blue font-tm-headline">
            {endMembership.toLocaleString()}
          </p>
        </div>
        <div
          className={`rounded-lg p-3 border ${
            netChange >= 0
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <p
            className={`text-xs font-medium font-tm-body ${
              netChange >= 0 ? 'text-green-700' : 'text-red-700'
            }`}
          >
            Net Change
          </p>
          <p
            className={`text-2xl font-bold font-tm-headline ${
              netChange >= 0 ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {netChange >= 0 ? '+' : ''}
            {netChange}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-700 font-medium font-tm-body">Peak</p>
          <p className="text-2xl font-bold text-gray-900 font-tm-headline">
            {maxMembership.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-700 font-medium font-tm-body">Low</p>
          <p className="text-2xl font-bold text-gray-900 font-tm-headline">
            {minMembership.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Insights */}
      {(periods.length > 0 || seasonalMonths.length > 0) && (
        <div className="mb-6 p-4 bg-tm-loyal-blue-10 border border-tm-loyal-blue-20 rounded-lg">
          <h3 className="text-sm font-semibold text-tm-loyal-blue mb-2 font-tm-headline">
            📊 Insights
          </h3>
          <ul className="space-y-1 text-sm text-tm-loyal-blue-80 font-tm-body">
            {periods.filter(p => p.type === 'growth').length > 0 && (
              <li>
                • {periods.filter(p => p.type === 'growth').length} sustained
                growth period(s) detected
              </li>
            )}
            {periods.filter(p => p.type === 'decline').length > 0 && (
              <li>
                • {periods.filter(p => p.type === 'decline').length} sustained
                decline period(s) detected
              </li>
            )}
            {seasonalMonths.length > 0 && (
              <li>
                • Seasonal patterns detected in {seasonalMonths.length} month(s)
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Chart */}
      <div
        role="img"
        aria-label={chartDescription}
        className="w-full overflow-x-auto"
      >
        <div className="min-w-[320px]">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={sortedData}
              margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--tm-cool-gray-20)"
              />
              <XAxis
                dataKey="date"
                stroke="var(--tm-cool-gray)"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={tickInterval}
                tickFormatter={formatXAxis}
              />
              <YAxis
                stroke="var(--tm-cool-gray)"
                style={{ fontSize: '11px' }}
                label={{
                  value: 'Total Members',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '12px' },
                }}
              />
              <Tooltip
                content={
                  <CustomTooltip sortedData={sortedData} periods={periods} />
                }
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                verticalAlign="top"
                height={36}
              />

              {/* Program year milestone lines */}
              {milestones.map((milestone, index) => (
                <ReferenceLine
                  key={index}
                  x={milestone.date}
                  stroke="var(--tm-true-maroon)" // TM True Maroon
                  strokeDasharray="5 5"
                  label={{
                    value: milestone.label,
                    position: 'top',
                    fill: 'var(--tm-true-maroon)',
                    fontSize: 10,
                  }}
                />
              ))}

              {/* Main membership line */}
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--tm-loyal-blue)" // TM Loyal Blue
                strokeWidth={3}
                dot={{ fill: 'var(--tm-loyal-blue)', r: 0.3 }}
                activeDot={{ r: 0.3 }}
                name="Total Membership"
              />

              {/* Prior year overlay lines (#238, #243) */}
              {priorYearKeys.map((label, i) => {
                const color =
                  PRIOR_YEAR_COLORS[i % PRIOR_YEAR_COLORS.length] ??
                  'var(--tm-cool-gray)'
                return (
                  <Line
                    key={label}
                    type="monotone"
                    dataKey={`prior_${i}`}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                    strokeOpacity={0.5}
                    dot={false}
                    activeDot={{ r: 2 }}
                    name={label}
                    connectNulls
                  />
                )
              })}

              {/* Highlight growth periods */}
              {periods.map((period, index) => {
                if (period.type === 'growth') {
                  const startPoint = sortedData[period.start]
                  const endPoint = sortedData[period.end]
                  if (!startPoint || !endPoint) return null

                  const startDate = startPoint.date
                  const endDate = endPoint.date
                  return (
                    <React.Fragment key={`growth-${index}`}>
                      <ReferenceLine
                        x={startDate}
                        stroke="var(--tm-loyal-blue)"
                        strokeWidth={2}
                        strokeOpacity={0.3}
                      />
                      <ReferenceLine
                        x={endDate}
                        stroke="var(--tm-loyal-blue)"
                        strokeWidth={2}
                        strokeOpacity={0.3}
                      />
                    </React.Fragment>
                  )
                }
                return null
              })}

              {/* Highlight decline periods */}
              {periods.map((period, index) => {
                if (period.type === 'decline') {
                  const startPoint = sortedData[period.start]
                  const endPoint = sortedData[period.end]
                  if (!startPoint || !endPoint) return null

                  const startDate = startPoint.date
                  const endDate = endPoint.date
                  return (
                    <React.Fragment key={`decline-${index}`}>
                      <ReferenceLine
                        x={startDate}
                        stroke="var(--tm-true-maroon)"
                        strokeWidth={2}
                        strokeOpacity={0.3}
                      />
                      <ReferenceLine
                        x={endDate}
                        stroke="var(--tm-true-maroon)"
                        strokeWidth={2}
                        strokeOpacity={0.3}
                      />
                    </React.Fragment>
                  )
                }
                return null
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend for highlights */}
      {periods.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-0.5 bg-tm-true-maroon"
              style={{ borderTop: '2px dashed' }}
            ></div>
            <span className="font-tm-body">Program Year Start</span>
          </div>
          {periods.some(p => p.type === 'growth') && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span className="font-tm-body">Growth Period</span>
            </div>
          )}
          {periods.some(p => p.type === 'decline') && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500"></div>
              <span className="font-tm-body">Decline Period</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
