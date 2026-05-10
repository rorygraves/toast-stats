import React, { useState, useMemo } from 'react'
import {
  DivisionAnalytics,
  DivisionRecognition,
  AreaDivisionRecognitionLevel,
} from '../hooks/useDistrictAnalytics'
import { LoadingSkeleton } from './LoadingSkeleton'
import { EmptyState } from './ErrorDisplay'

interface DivisionRankingsProps {
  divisions: DivisionAnalytics[]
  recognition?: DivisionRecognition[]
  isLoading?: boolean
}

type SortField =
  | 'rank'
  | 'name'
  | 'clubs'
  | 'dcpGoals'
  | 'health'
  | 'trend'
  | 'recognition'
type SortDirection = 'asc' | 'desc'

// Recognition level ordinal values for sorting
const RECOGNITION_LEVEL_ORDER: Record<AreaDivisionRecognitionLevel, number> = {
  NotDistinguished: 0,
  Distinguished: 1,
  Select: 2,
  Presidents: 3,
}

// Get recognition badge styling and label
const getRecognitionBadge = (
  level: AreaDivisionRecognitionLevel
): { className: string; label: string } | null => {
  switch (level) {
    case 'Presidents':
      return {
        className:
          'bg-tm-happy-yellow text-gray-900 border-yellow-500 font-semibold',
        label: "President's Distinguished",
      }
    case 'Select':
      return {
        className: 'bg-tm-cool-gray text-gray-900 border-gray-400',
        label: 'Select Distinguished',
      }
    case 'Distinguished':
      return {
        className: 'bg-tm-true-maroon text-white border-tm-true-maroon',
        label: 'Distinguished',
      }
    default:
      return null
  }
}

// Sort icon component moved outside render
const SortIcon: React.FC<{
  field: SortField
  sortField: SortField
  sortDirection: SortDirection
}> = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) {
    return (
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    )
  }
  return sortDirection === 'asc' ? (
    <svg
      className="w-4 h-4 text-tm-loyal-blue"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    </svg>
  ) : (
    <svg
      className="w-4 h-4 text-tm-loyal-blue"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
}

export const DivisionRankings: React.FC<DivisionRankingsProps> = ({
  divisions,
  recognition,
  isLoading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Create a map of division recognition for quick lookup
  const recognitionMap = useMemo(() => {
    if (!recognition) return new Map<string, DivisionRecognition>()
    return new Map(recognition.map(r => [r.divisionId, r]))
  }, [recognition])

  // Get trend icon and color
  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return (
          <div className="flex items-center gap-1 text-green-600">
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span className="text-xs font-medium">Improving</span>
          </div>
        )
      case 'declining':
        return (
          <div className="flex items-center gap-1 text-red-600">
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
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
            <span className="text-xs font-medium">Declining</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 text-gray-600">
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
                d="M5 12h14"
              />
            </svg>
            <span className="text-xs font-medium">Stable</span>
          </div>
        )
    }
  }

  // Get rank badge styling
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    } else if (rank === 2) {
      return 'bg-gray-100 text-gray-800 border-gray-300'
    } else if (rank === 3) {
      return 'bg-orange-100 text-orange-800 border-orange-300'
    }
    return 'bg-tm-cool-gray bg-opacity-20 text-tm-loyal-blue border-tm-cool-gray'
  }

  // Check if division is "Best Practice" (top 20% with high scores)
  const isBestPractice = (division: DivisionAnalytics): boolean => {
    const topPercentile = Math.ceil(divisions.length * 0.2)
    const avgHealthThreshold = 5 // Average of 5+ DCP goals per club
    return (
      division.rank <= topPercentile &&
      division.averageClubHealth >= avgHealthThreshold
    )
  }

  // Sort divisions
  const sortedDivisions = useMemo(() => {
    const sorted = [...divisions].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'rank':
          aValue = a.rank
          bValue = b.rank
          break
        case 'name':
          aValue = a.divisionName.toLowerCase()
          bValue = b.divisionName.toLowerCase()
          break
        case 'clubs':
          aValue = a.totalClubs
          bValue = b.totalClubs
          break
        case 'dcpGoals':
          aValue = a.totalDcpGoals
          bValue = b.totalDcpGoals
          break
        case 'health':
          aValue = a.averageClubHealth
          bValue = b.averageClubHealth
          break
        case 'trend': {
          const trendOrder = { improving: 2, stable: 1, declining: 0 }
          aValue = trendOrder[a.trend]
          bValue = trendOrder[b.trend]
          break
        }
        case 'recognition': {
          const aRecog = recognitionMap.get(a.divisionId)
          const bRecog = recognitionMap.get(b.divisionId)
          aValue = aRecog
            ? RECOGNITION_LEVEL_ORDER[aRecog.recognitionLevel]
            : -1
          bValue = bRecog
            ? RECOGNITION_LEVEL_ORDER[bRecog.recognitionLevel]
            : -1
          break
        }
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [divisions, sortField, sortDirection, recognitionMap])

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'rank' ? 'asc' : 'desc') // Default to ascending for rank, descending for others
    }
  }

  return (
    <div className="redesign-panel">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Division Rankings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Performance comparison across all divisions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
              <svg
                className="w-4 h-4 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-medium text-yellow-700">
                Best Practice
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSkeleton variant="table" count={5} />}

      {/* No Data */}
      {!isLoading && divisions.length === 0 && (
        <EmptyState
          title="No Division Data"
          message="No division performance data is available. This may be because no data has been cached yet."
          icon="data"
        />
      )}

      {/* Table */}
      {!isLoading && divisions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort('rank')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Rank
                    <SortIcon
                      field="rank"
                      sortField={sortField}
                      sortDirection={sortDirection}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Division
                    <SortIcon
                      field="name"
                      sortField={sortField}
                      sortDirection={sortDirection}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('clubs')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Total Clubs
                    <SortIcon
                      field="clubs"
                      sortField={sortField}
                      sortDirection={sortDirection}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dcpGoals')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Total DCP Goals
                    <SortIcon
                      field="dcpGoals"
                      sortField={sortField}
                      sortDirection={sortDirection}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('health')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Health Score
                    <SortIcon
                      field="health"
                      sortField={sortField}
                      sortDirection={sortDirection}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('trend')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Trend
                    <SortIcon
                      field="trend"
                      sortField={sortField}
                      sortDirection={sortDirection}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('recognition')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Recognition
                    <SortIcon
                      field="recognition"
                      sortField={sortField}
                      sortDirection={sortDirection}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedDivisions.map(division => {
                const bestPractice = isBestPractice(division)
                const divRecognition = recognitionMap.get(division.divisionId)
                const badge = divRecognition
                  ? getRecognitionBadge(divRecognition.recognitionLevel)
                  : null
                return (
                  <tr
                    key={division.divisionId}
                    className={`${
                      bestPractice
                        ? 'bg-yellow-50 hover:bg-yellow-100'
                        : 'bg-white hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold ${getRankBadge(
                          division.rank
                        )}`}
                      >
                        {division.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {division.divisionName}
                        </span>
                        {bestPractice && (
                          <svg
                            className="w-5 h-5 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {division.totalClubs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {division.totalDcpGoals}
                        </span>
                        <span className="text-xs text-gray-500">
                          of {division.totalClubs * 10} possible
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {division.averageClubHealth.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">/ 10</span>
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                division.averageClubHealth >= 7
                                  ? 'bg-green-500'
                                  : division.averageClubHealth >= 5
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{
                                width: `${(division.averageClubHealth / 10) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTrendIcon(division.trend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {badge ? (
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${badge.className}`}
                          title={
                            divRecognition
                              ? `${divRecognition.paidAreasPercent.toFixed(0)}% paid areas, ${divRecognition.distinguishedAreasPercent.toFixed(0)}% distinguished`
                              : ''
                          }
                        >
                          {badge.label}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer with Legend */}
      {!isLoading && divisions.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">Health Score:</span>
              <span>Average DCP goals per club (0-10)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Best Practice:</span>
              <span>Top 20% divisions with health score ≥ 5.0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
