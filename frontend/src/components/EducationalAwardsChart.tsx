import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { useEducationalAwards } from '../hooks/useEducationalAwards'
import { useDistrictStatistics } from '../hooks/useMembershipData'
import { ExportButton } from './ExportButton'
import { exportEducationalAwards } from '../utils/csvExport'
import { ChartContainer } from './ChartLegend'
import { ChartTooltip, DateTooltip } from './ChartTooltip'
import { parseLocalDate } from '../utils/dateFormatting'
import {
  getChartColorPalette,
  generateChartDescription,
  CHART_STYLES,
} from '../utils/chartAccessibility'

interface EducationalAwardsChartProps {
  districtId: string
  districtName: string
  months?: number
}

type ChartView = 'byType' | 'byMonth' | 'topClubs'

const EducationalAwardsChart: React.FC<EducationalAwardsChartProps> = ({
  districtId,
  districtName,
  months = 12,
}) => {
  const [chartView, setChartView] = useState<ChartView>('byType')
  const { data, isLoading, isError, error } = useEducationalAwards(
    districtId,
    months
  )
  const { data: statistics } = useDistrictStatistics(districtId)

  const handleExport = () => {
    if (data) {
      exportEducationalAwards(data, districtId, districtName)
    }
  }

  if (isLoading) {
    return (
      <section
        className="redesign-panel"
        aria-busy="true"
        aria-label="Loading educational awards"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Educational Awards
        </h2>
        <div className="flex items-center justify-center h-80">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
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
        aria-label="Educational awards error"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Educational Awards
        </h2>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">
              Failed to load educational awards data
            </p>
            <p className="text-gray-600 text-sm">
              {error?.message || 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section
        className="redesign-panel"
        role="status"
        aria-label="Educational awards"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Educational Awards
        </h2>
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-600">No educational awards data available</p>
        </div>
      </section>
    )
  }

  // Calculate average awards per member
  const totalMembers = statistics?.membership.total || 0
  const averageAwardsPerMember =
    totalMembers > 0 ? (data.totalAwards / totalMembers).toFixed(2) : '0.00'

  // Color palette for charts
  const colors = getChartColorPalette(8)
  const fallbackColor = '#888888'

  // Format data for by-type chart
  const byTypeData = data.byType.map((item, index) => ({
    ...item,
    color: colors[index % colors.length] ?? fallbackColor,
  }))

  // Format data for monthly chart
  const byMonthData = data.byMonth.map(point => ({
    month: parseLocalDate(point.month).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
    awards: point.count,
    fullDate: point.month,
  }))

  // Format data for top clubs
  const topClubsData = data.topClubs.slice(0, 10).map((club, index) => ({
    ...club,
    color: colors[index % colors.length] ?? fallbackColor,
  }))

  // Generate chart descriptions for accessibility
  const byTypeDescription = generateChartDescription(
    'bar',
    byTypeData.length,
    'Educational Awards by Type',
    `Shows ${data.totalAwards} total awards distributed across ${byTypeData.length} award types`
  )

  const byMonthDescription = generateChartDescription(
    'line',
    byMonthData.length,
    'Educational Awards Over Time',
    `Shows award trends over ${months} months with ${data.totalAwards} total awards`
  )

  const topClubsDescription = generateChartDescription(
    'bar',
    topClubsData.length,
    'Top Performing Clubs',
    `Shows top ${topClubsData.length} clubs ranked by educational awards earned`
  )

  return (
    <ChartContainer
      title="Educational Awards"
      subtitle={`Total Awards: ${data.totalAwards.toLocaleString()} | Avg per Member: ${averageAwardsPerMember}`}
      isLoading={isLoading}
      {...(isError
        ? {
            error: error ? String(error) : 'An unexpected error occurred',
          }
        : {})}
      className="tm-brand-compliant"
    >
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <ExportButton
            onExport={handleExport}
            disabled={!data}
            label="Export"
            className="text-xs sm:text-sm px-3 py-2 min-h-[44px] self-start"
          />
        </div>

        {/* View Toggle Buttons */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Chart view options"
        >
          <button
            onClick={() => setChartView('byType')}
            className={`min-h-[44px] px-3 py-2 text-xs sm:text-sm font-tm-body font-medium rounded-md transition-colors ${
              chartView === 'byType'
                ? 'bg-tm-loyal-blue text-tm-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="View awards by type"
            aria-pressed={chartView === 'byType'}
          >
            By Type
          </button>
          <button
            onClick={() => setChartView('byMonth')}
            className={`min-h-[44px] px-3 py-2 text-xs sm:text-sm font-tm-body font-medium rounded-md transition-colors ${
              chartView === 'byMonth'
                ? 'bg-tm-loyal-blue text-tm-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="View awards by month"
            aria-pressed={chartView === 'byMonth'}
          >
            By Month
          </button>
          <button
            onClick={() => setChartView('topClubs')}
            className={`min-h-[44px] px-3 py-2 text-xs sm:text-sm font-tm-body font-medium rounded-md transition-colors ${
              chartView === 'topClubs'
                ? 'bg-tm-loyal-blue text-tm-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="View top performing clubs"
            aria-pressed={chartView === 'topClubs'}
          >
            Top Clubs
          </button>
        </div>
      </div>

      {/* Chart Display */}
      <div className="mt-4">
        {chartView === 'byType' && (
          <div>
            <h3 className="text-xs sm:text-sm font-tm-headline font-semibold text-tm-black mb-3">
              Awards by Type
            </h3>
            {byTypeData.length > 0 ? (
              <div
                role="img"
                aria-label={byTypeDescription}
                className="w-full overflow-x-auto"
              >
                <div className="min-w-[320px]">
                  <ResponsiveContainer width="100%" height={280} minWidth={320}>
                    <BarChart
                      data={byTypeData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                      aria-hidden="true"
                    >
                      <CartesianGrid
                        strokeDasharray={CHART_STYLES.GRID.strokeDasharray}
                        stroke={CHART_STYLES.GRID.stroke}
                      />
                      <XAxis
                        dataKey="type"
                        stroke={CHART_STYLES.AXIS.stroke}
                        style={{
                          fontSize: CHART_STYLES.AXIS.fontSize,
                          fontFamily: CHART_STYLES.AXIS.fontFamily,
                        }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke={CHART_STYLES.AXIS.stroke}
                        style={{
                          fontSize: CHART_STYLES.AXIS.fontSize,
                          fontFamily: CHART_STYLES.AXIS.fontFamily,
                        }}
                        allowDecimals={false}
                        width={40}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        contentStyle={CHART_STYLES.TOOLTIP}
                      />
                      <Bar dataKey="count" name="Awards" radius={[8, 8, 0, 0]}>
                        {byTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80">
                <p className="text-tm-cool-gray font-tm-body">
                  No award type data available
                </p>
              </div>
            )}
          </div>
        )}

        {chartView === 'byMonth' && (
          <div>
            <h3 className="text-xs sm:text-sm font-tm-headline font-semibold text-tm-black mb-3">
              Awards Over Time ({months} Months)
            </h3>
            {byMonthData.length > 0 ? (
              <div
                role="img"
                aria-label={byMonthDescription}
                className="w-full overflow-x-auto"
              >
                <div className="min-w-[320px]">
                  <ResponsiveContainer width="100%" height={280} minWidth={320}>
                    <LineChart
                      data={byMonthData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                      aria-hidden="true"
                    >
                      <CartesianGrid
                        strokeDasharray={CHART_STYLES.GRID.strokeDasharray}
                        stroke={CHART_STYLES.GRID.stroke}
                      />
                      <XAxis
                        dataKey="month"
                        stroke={CHART_STYLES.AXIS.stroke}
                        style={{
                          fontSize: CHART_STYLES.AXIS.fontSize,
                          fontFamily: CHART_STYLES.AXIS.fontFamily,
                        }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke={CHART_STYLES.AXIS.stroke}
                        style={{
                          fontSize: CHART_STYLES.AXIS.fontSize,
                          fontFamily: CHART_STYLES.AXIS.fontFamily,
                        }}
                        allowDecimals={false}
                        tickFormatter={value => value.toLocaleString()}
                        width={50}
                      />
                      <Tooltip content={<DateTooltip />} />
                      <Legend
                        wrapperStyle={CHART_STYLES.LEGEND}
                        iconType="line"
                        verticalAlign="top"
                        height={36}
                      />
                      <Line
                        type="monotone"
                        dataKey="awards"
                        stroke={colors[0] ?? 'var(--tm-loyal-blue)'}
                        strokeWidth={2}
                        dot={{
                          fill: colors[0] ?? 'var(--tm-loyal-blue)',
                          r: 0.3,
                        }}
                        activeDot={{ r: 0.5 }}
                        name="Awards Earned"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80">
                <p className="text-tm-cool-gray font-tm-body">
                  No monthly data available
                </p>
              </div>
            )}
          </div>
        )}

        {chartView === 'topClubs' && (
          <div>
            <h3 className="text-xs sm:text-sm font-tm-headline font-semibold text-tm-black mb-3">
              Top Performing Clubs (by Educational Awards)
            </h3>
            {topClubsData.length > 0 ? (
              <div
                role="img"
                aria-label={topClubsDescription}
                className="w-full overflow-x-auto"
              >
                <div className="min-w-[320px]">
                  <ResponsiveContainer width="100%" height={320} minWidth={320}>
                    <BarChart
                      data={topClubsData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 100 }}
                      layout="horizontal"
                      aria-hidden="true"
                    >
                      <CartesianGrid
                        strokeDasharray={CHART_STYLES.GRID.strokeDasharray}
                        stroke={CHART_STYLES.GRID.stroke}
                      />
                      <XAxis
                        dataKey="clubName"
                        stroke={CHART_STYLES.AXIS.stroke}
                        style={{
                          fontSize: '9px',
                          fontFamily: CHART_STYLES.AXIS.fontFamily,
                        }}
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        interval={0}
                      />
                      <YAxis
                        stroke={CHART_STYLES.AXIS.stroke}
                        style={{
                          fontSize: CHART_STYLES.AXIS.fontSize,
                          fontFamily: CHART_STYLES.AXIS.fontFamily,
                        }}
                        allowDecimals={false}
                        width={40}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        contentStyle={CHART_STYLES.TOOLTIP}
                      />
                      <Bar dataKey="awards" name="Awards" radius={[8, 8, 0, 0]}>
                        {topClubsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80">
                <p className="text-tm-cool-gray font-tm-body">
                  No club data available
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ChartContainer>
  )
}

export default EducationalAwardsChart
