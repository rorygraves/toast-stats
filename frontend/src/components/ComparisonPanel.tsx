/**
 * ComparisonPanel — Side-by-side district comparison (#93)
 *
 * Displays a sticky panel above the rankings table when 2-3 districts
 * are pinned. Includes a radar chart and metrics comparison table.
 *
 * Fix #109: Overall Rank now shows actual position in allRankings
 * Fix #110: Radar chart 'Overall' axis uses normalizeRank with actual rank
 */

import React from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { DistrictRanking } from '../types/districts'

export interface ComparisonPanelProps {
  pinnedDistricts: DistrictRanking[]
  allRankings: DistrictRanking[]
  totalDistricts: number
  onRemove: (districtId: string) => void
  onClearAll: () => void
}

const CHART_COLORS = ['#004165', '#e2231a', '#00a3e0']

/** Invert a rank so higher = better for radar display */
const normalizeRank = (rank: number, total: number): number => {
  if (total <= 1) return 100
  return Math.round(((total - rank + 1) / total) * 100)
}

/** Normalize a percentage (0-100 scale, clamped) */
const normalizePercent = (pct: number): number => {
  return Math.max(0, Math.min(100, pct))
}

/**
 * Look up a district's overall rank (1-indexed position) in the sorted list.
 * Returns the position or '-' if not found.
 */
const getOverallRank = (
  d: DistrictRanking,
  allRankings: DistrictRanking[]
): number | null => {
  const idx = allRankings.findIndex(r => r.districtId === d.districtId)
  return idx >= 0 ? idx + 1 : null
}

const buildMetricRows = (allRankings: DistrictRanking[]) =>
  [
    {
      key: 'rank',
      label: 'Overall Rank',
      format: (d: DistrictRanking) => {
        const rank = getOverallRank(d, allRankings)
        return rank !== null ? `#${rank}` : '-'
      },
    },
    {
      key: 'paidClubs',
      label: 'Paid Clubs',
      format: (d: DistrictRanking) => d.paidClubs.toLocaleString(),
    },
    {
      key: 'clubGrowth',
      label: 'Club Growth',
      format: (d: DistrictRanking) =>
        `${d.clubGrowthPercent > 0 ? '+' : ''}${d.clubGrowthPercent.toFixed(1)}%`,
    },
    {
      key: 'payments',
      label: 'Payments',
      format: (d: DistrictRanking) => d.totalPayments.toLocaleString(),
    },
    {
      key: 'paymentGrowth',
      label: 'Payment Growth',
      format: (d: DistrictRanking) =>
        `${d.paymentGrowthPercent > 0 ? '+' : ''}${d.paymentGrowthPercent.toFixed(1)}%`,
    },
    {
      key: 'distinguished',
      label: 'Distinguished',
      format: (d: DistrictRanking) => d.distinguishedClubs.toLocaleString(),
    },
    {
      key: 'distPct',
      label: 'Distinguished %',
      format: (d: DistrictRanking) => `${d.distinguishedPercent.toFixed(1)}%`,
    },
    {
      key: 'score',
      label: 'Score',
      format: (d: DistrictRanking) =>
        Math.round(d.aggregateScore).toLocaleString(),
    },
  ] as const

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  pinnedDistricts,
  allRankings,
  totalDistricts,
  onRemove,
  onClearAll,
}) => {
  const metricRows = React.useMemo(
    () => buildMetricRows(allRankings),
    [allRankings]
  )

  if (pinnedDistricts.length < 2) return null

  // Radar chart data: 4 axes, each district is a separate series
  const radarData = [
    {
      metric: 'Clubs Rank',
      ...Object.fromEntries(
        pinnedDistricts.map(d => [
          d.districtId,
          normalizeRank(d.clubsRank, totalDistricts),
        ])
      ),
    },
    {
      metric: 'Payments Rank',
      ...Object.fromEntries(
        pinnedDistricts.map(d => [
          d.districtId,
          normalizeRank(d.paymentsRank, totalDistricts),
        ])
      ),
    },
    {
      metric: 'Distinguished',
      ...Object.fromEntries(
        pinnedDistricts.map(d => [
          d.districtId,
          normalizePercent(d.distinguishedPercent),
        ])
      ),
    },
    {
      metric: 'Overall',
      ...Object.fromEntries(
        pinnedDistricts.map(d => {
          // Fix #110: Use actual rank from allRankings, normalized like other rank axes
          const rank = getOverallRank(d, allRankings) ?? totalDistricts
          return [d.districtId, normalizeRank(rank, totalDistricts)]
        })
      ),
    },
  ]

  return (
    <div className="redesign-panel mb-4 p-4 border-l-4 border-tm-loyal-blue">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 font-tm-headline">
          Comparing {pinnedDistricts.length} Districts
        </h3>
        <button
          onClick={onClearAll}
          aria-label="Clear all"
          className="text-sm text-gray-500 hover:text-red-600 transition-colors font-tm-body"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="h-64 lg:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              {pinnedDistricts.map((d, i) => (
                <Radar
                  key={d.districtId}
                  name={d.districtName}
                  dataKey={d.districtId}
                  stroke={CHART_COLORS[i]}
                  fill={CHART_COLORS[i]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 text-left font-medium text-gray-500 font-tm-headline">
                  Metric
                </th>
                {pinnedDistricts.map((d, i) => (
                  <th
                    key={d.districtId}
                    className="py-2 px-3 text-right font-medium font-tm-headline"
                    style={{ color: CHART_COLORS[i] }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{d.districtName}</span>
                      <button
                        onClick={() => onRemove(d.districtId)}
                        aria-label={`Remove ${d.districtName}`}
                        className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricRows.map(row => (
                <tr
                  key={row.key}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2 pr-4 text-gray-600 font-tm-body whitespace-nowrap">
                    {row.label}
                  </td>
                  {pinnedDistricts.map(d => (
                    <td
                      key={d.districtId}
                      className="py-2 px-3 text-right text-gray-900 font-tm-body tabular-nums"
                    >
                      {row.format(d)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ComparisonPanel
