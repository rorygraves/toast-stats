import React, { useState } from 'react'
import { AreaAnalytics } from '../hooks/useDistrictAnalytics'
import { LoadingSkeleton } from './LoadingSkeleton'
import { EmptyState } from './ErrorDisplay'

interface AreaPerformanceChartProps {
  areas: AreaAnalytics[]
  isLoading?: boolean
}

type ViewMode = 'bar' | 'heatmap'

export const AreaPerformanceChart: React.FC<AreaPerformanceChartProps> = ({
  areas,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('bar')
  const [hoveredArea, setHoveredArea] = useState<string | null>(null)

  // Get color based on normalized score
  const getScoreColor = (score: number): string => {
    if (score >= 7) return 'bg-green-500'
    if (score >= 5) return 'bg-yellow-500'
    if (score >= 3) return 'bg-orange-500'
    return 'bg-red-500'
  }

  // Get color intensity for heatmap
  const getHeatmapColor = (score: number): string => {
    if (score >= 8) return 'bg-green-700'
    if (score >= 7) return 'bg-green-600'
    if (score >= 6) return 'bg-green-500'
    if (score >= 5) return 'bg-yellow-500'
    if (score >= 4) return 'bg-orange-400'
    if (score >= 3) return 'bg-orange-500'
    if (score >= 2) return 'bg-red-400'
    return 'bg-red-600'
  }

  // Get text color for heatmap cells
  const getHeatmapTextColor = (score: number): string => {
    return score >= 5 ? 'text-white' : 'text-gray-900'
  }

  // Calculate max score for bar chart scaling
  const maxScore = Math.max(...areas.map(a => a.normalizedScore), 10)

  // Group areas by division for heatmap view
  const areasByDivision = areas.reduce(
    (acc, area) => {
      if (!acc[area.divisionId]) {
        acc[area.divisionId] = []
      }
      acc[area.divisionId]?.push(area)
      return acc
    },
    {} as Record<string, AreaAnalytics[]>
  )

  // Get tooltip content
  const getTooltipContent = (area: AreaAnalytics) => {
    return (
      <div className="absolute z-10 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 min-w-[200px]">
        <div className="font-bold mb-2">{area.areaName}</div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Division:</span>
            <span className="font-medium">{area.divisionId}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Total Clubs:</span>
            <span className="font-medium">{area.totalClubs}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Total DCP Goals:</span>
            <span className="font-medium">{area.totalDcpGoals}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Avg Health:</span>
            <span className="font-medium">
              {area.averageClubHealth.toFixed(1)} / 10
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-300">Performance Score:</span>
            <span className="font-medium">
              {area.normalizedScore.toFixed(1)} / 10
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="redesign-panel">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Area Performance
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Normalized metrics for fair comparison across areas
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('bar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'bar'
                  ? 'bg-white text-tm-loyal-blue shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Bar Chart
              </div>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'heatmap'
                  ? 'bg-white text-tm-loyal-blue shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
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
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                  />
                </svg>
                Heatmap
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSkeleton variant="chart" />}

      {/* No Data */}
      {!isLoading && areas.length === 0 && (
        <EmptyState
          title="No Area Data"
          message="No area performance data is available. This may be because no data has been cached yet."
          icon="data"
        />
      )}

      {/* Bar Chart View */}
      {!isLoading && areas.length > 0 && viewMode === 'bar' && (
        <div className="p-6">
          <div className="space-y-4">
            {areas.map(area => (
              <div
                key={area.areaId}
                className="relative"
                onMouseEnter={() => setHoveredArea(area.areaId)}
                onMouseLeave={() => setHoveredArea(null)}
              >
                <div className="flex items-center gap-4">
                  {/* Area Label */}
                  <div className="w-32 flex-shrink-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {area.areaName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Div {area.divisionId}
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 relative">
                    <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${getScoreColor(
                          area.normalizedScore
                        )} transition-all duration-300 flex items-center justify-end px-3`}
                        style={{
                          width: `${(area.normalizedScore / maxScore) * 100}%`,
                        }}
                      >
                        <span className="text-xs font-bold text-white">
                          {area.normalizedScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="w-40 flex-shrink-0 text-xs text-gray-600">
                    <div>{area.totalClubs} clubs</div>
                    <div>{area.totalDcpGoals} DCP goals</div>
                  </div>
                </div>

                {/* Tooltip */}
                {hoveredArea === area.areaId && (
                  <div className="absolute left-32 top-0 z-10">
                    {getTooltipContent(area)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap View */}
      {!isLoading && areas.length > 0 && viewMode === 'heatmap' && (
        <div className="p-6">
          <div className="space-y-6">
            {Object.entries(areasByDivision).map(
              ([divisionId, divisionAreas]) => (
                <div key={divisionId}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Division {divisionId}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {divisionAreas.map(area => (
                      <div
                        key={area.areaId}
                        className="relative"
                        onMouseEnter={() => setHoveredArea(area.areaId)}
                        onMouseLeave={() => setHoveredArea(null)}
                      >
                        <div
                          className={`${getHeatmapColor(
                            area.normalizedScore
                          )} ${getHeatmapTextColor(
                            area.normalizedScore
                          )} rounded-lg p-4 cursor-pointer transition-transform hover:scale-105 shadow-xs`}
                        >
                          <div className="text-center">
                            <div className="text-xs font-medium mb-1 truncate">
                              {area.areaName}
                            </div>
                            <div className="text-2xl font-bold">
                              {area.normalizedScore.toFixed(1)}
                            </div>
                            <div className="text-xs opacity-90 mt-1">
                              {area.totalClubs} clubs
                            </div>
                          </div>
                        </div>

                        {/* Tooltip */}
                        {hoveredArea === area.areaId && (
                          <div className="absolute left-1/2 top-0 z-10">
                            {getTooltipContent(area)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      {!isLoading && areas.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-xs font-medium text-gray-700">
              Performance Score:
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                <span className="text-xs text-gray-600">Excellent (7-10)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
                <span className="text-xs text-gray-600">Good (5-7)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
                <span className="text-xs text-gray-600">Fair (3-5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                <span className="text-xs text-gray-600">
                  Needs Attention (&lt;3)
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Note:</span> Performance score is
            normalized by club count for fair comparison
          </div>
        </div>
      )}
    </div>
  )
}
