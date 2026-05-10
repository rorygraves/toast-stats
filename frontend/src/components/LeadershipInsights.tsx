import React from 'react'
import { formatDisplayDate } from '../utils/dateFormatting'

interface LeadershipEffectivenessScore {
  divisionId: string
  divisionName: string
  healthScore: number
  growthScore: number
  dcpScore: number
  overallScore: number
  rank: number
  isBestPractice: boolean
}

interface LeadershipChange {
  divisionId: string
  divisionName: string
  changeDate: string
  performanceBeforeChange: number
  performanceAfterChange: number
  performanceDelta: number
  trend: 'improved' | 'declined' | 'stable'
}

interface AreaDirectorCorrelation {
  areaId: string
  areaName: string
  divisionId: string
  clubPerformanceScore: number
  activityIndicator: 'high' | 'medium' | 'low'
  correlation: 'positive' | 'neutral' | 'negative'
}

interface LeadershipInsightsData {
  leadershipScores: LeadershipEffectivenessScore[]
  bestPracticeDivisions: LeadershipEffectivenessScore[]
  leadershipChanges: LeadershipChange[]
  areaDirectorCorrelations: AreaDirectorCorrelation[]
  summary: {
    topPerformingDivisions: Array<{
      divisionId: string
      divisionName: string
      score: number
    }>
    topPerformingAreas: Array<{
      areaId: string
      areaName: string
      score: number
    }>
    averageLeadershipScore: number
    totalBestPracticeDivisions: number
  }
}

interface LeadershipInsightsProps {
  insights: LeadershipInsightsData | null
  isLoading: boolean
}

export const LeadershipInsights: React.FC<LeadershipInsightsProps> = ({
  insights,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="redesign-panel">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded-sm w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded-sm"></div>
          <div className="h-32 bg-gray-200 rounded-sm"></div>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="redesign-panel">
        <p className="text-gray-600">
          No leadership insights available. Please use the Admin Panel to
          collect historical data.
        </p>
      </div>
    )
  }

  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number): string => {
    if (score >= 75) return 'bg-green-100'
    if (score >= 50) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getTrendIcon = (
    trend: 'improved' | 'declined' | 'stable'
  ): React.ReactElement => {
    if (trend === 'improved') {
      return (
        <svg
          className="w-5 h-5 text-green-600"
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
      )
    }
    if (trend === 'declined') {
      return (
        <svg
          className="w-5 h-5 text-red-600"
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
      )
    }
    return (
      <svg
        className="w-5 h-5 text-gray-600"
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
    )
  }

  const getActivityColor = (indicator: 'high' | 'medium' | 'low'): string => {
    if (indicator === 'high') return 'text-green-600 bg-green-100'
    if (indicator === 'medium') return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="redesign-panel">
          <p className="text-sm text-gray-600 mb-1">Average Leadership Score</p>
          <p
            className={`text-3xl font-bold ${getScoreColor(insights.summary.averageLeadershipScore)}`}
          >
            {insights.summary.averageLeadershipScore}
          </p>
        </div>
        <div className="redesign-panel">
          <p className="text-sm text-gray-600 mb-1">Best Practice Divisions</p>
          <p className="text-3xl font-bold text-tm-loyal-blue">
            {insights.summary.totalBestPracticeDivisions}
          </p>
        </div>
        <div className="redesign-panel">
          <p className="text-sm text-gray-600 mb-1">Top Division</p>
          <p className="text-lg font-semibold text-gray-900 truncate">
            {insights.summary.topPerformingDivisions[0]?.divisionName || 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            Score: {insights.summary.topPerformingDivisions[0]?.score || 0}
          </p>
        </div>
        <div className="redesign-panel">
          <p className="text-sm text-gray-600 mb-1">Top Area</p>
          <p className="text-lg font-semibold text-gray-900 truncate">
            {insights.summary.topPerformingAreas[0]?.areaName || 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            Score: {insights.summary.topPerformingAreas[0]?.score || 0}
          </p>
        </div>
      </div>

      {/* Leadership Effectiveness Scores */}
      <div className="redesign-panel">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Leadership Effectiveness Scores
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Weighted: 40% Health, 30% Growth, 30% DCP Goals
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DCP
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {insights.leadershipScores.slice(0, 10).map(score => (
                <tr key={score.divisionId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{score.rank}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {score.divisionName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getScoreBgColor(score.overallScore)} ${getScoreColor(score.overallScore)}`}
                    >
                      {score.overallScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getScoreBgColor(score.healthScore)} ${getScoreColor(score.healthScore)}`}
                    >
                      {score.healthScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getScoreBgColor(score.growthScore)} ${getScoreColor(score.growthScore)}`}
                    >
                      {score.growthScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getScoreBgColor(score.dcpScore)} ${getScoreColor(score.dcpScore)}`}
                    >
                      {score.dcpScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {score.isBestPractice && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Best Practice
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Practice Divisions */}
      {insights.bestPracticeDivisions.length > 0 && (
        <div className="redesign-panel">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Best Practice Divisions
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Divisions with consistently high performance (score ≥ 75, top 20%)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.bestPracticeDivisions.map(division => (
              <div
                key={division.divisionId}
                className="border border-blue-200 rounded-lg p-4 bg-blue-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {division.divisionName}
                  </h4>
                  <span className="text-2xl font-bold text-tm-loyal-blue">
                    {division.overallScore}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Health:</span>
                    <span className="font-medium">{division.healthScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Growth:</span>
                    <span className="font-medium">{division.growthScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DCP:</span>
                    <span className="font-medium">{division.dcpScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leadership Changes */}
      {insights.leadershipChanges.length > 0 && (
        <div className="redesign-panel">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Performance Changes
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Significant performance shifts (potential leadership changes)
          </p>
          <div className="space-y-3">
            {insights.leadershipChanges.slice(0, 5).map((change, index) => (
              <div
                key={`${change.divisionId}-${index}`}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {change.divisionName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDisplayDate(change.changeDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(change.trend)}
                    <span
                      className={`text-lg font-bold ${
                        change.trend === 'improved'
                          ? 'text-green-600'
                          : change.trend === 'declined'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {change.performanceDelta > 0 ? '+' : ''}
                      {change.performanceDelta.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    Before: {change.performanceBeforeChange.toFixed(1)}
                  </span>
                  <span>→</span>
                  <span>After: {change.performanceAfterChange.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Area Director Correlations */}
      <div className="redesign-panel">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Area Performance Indicators
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Correlation between area activity and club performance
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance Score
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity Level
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correlation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {insights.areaDirectorCorrelations
                .slice(0, 10)
                .map(correlation => (
                  <tr key={correlation.areaId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {correlation.areaName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {correlation.divisionId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getScoreBgColor(correlation.clubPerformanceScore)} ${getScoreColor(correlation.clubPerformanceScore)}`}
                      >
                        {correlation.clubPerformanceScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(correlation.activityIndicator)}`}
                      >
                        {correlation.activityIndicator.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {correlation.correlation === 'positive' && (
                        <span className="text-green-600 font-medium">
                          Positive
                        </span>
                      )}
                      {correlation.correlation === 'neutral' && (
                        <span className="text-gray-600">Neutral</span>
                      )}
                      {correlation.correlation === 'negative' && (
                        <span className="text-red-600 font-medium">
                          Negative
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
