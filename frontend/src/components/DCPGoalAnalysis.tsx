import React from 'react'

interface DCPGoal {
  goalNumber: number
  achievementCount: number
  achievementPercentage: number
}

interface DCPGoalAnalysisData {
  mostCommonlyAchieved: DCPGoal[]
  leastCommonlyAchieved: DCPGoal[]
}

interface DCPGoalAnalysisProps {
  dcpGoalAnalysis: DCPGoalAnalysisData | null
  isLoading: boolean
}

export const DCPGoalAnalysis: React.FC<DCPGoalAnalysisProps> = ({
  dcpGoalAnalysis,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="redesign-panel">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded-sm w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-sm"></div>
        </div>
      </div>
    )
  }

  if (!dcpGoalAnalysis) {
    return (
      <div className="redesign-panel">
        <p className="text-gray-600">
          No DCP goal analysis available. Please use the Admin Panel to collect
          historical data.
        </p>
      </div>
    )
  }

  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 75) return 'bg-tm-loyal-blue'
    if (percentage >= 50) return 'bg-tm-happy-yellow'
    if (percentage >= 25) return 'bg-tm-happy-yellow-80'
    return 'bg-tm-true-maroon'
  }

  const getPercentageTextColor = (percentage: number): string => {
    if (percentage >= 75) return 'text-tm-loyal-blue'
    if (percentage >= 50) return 'text-tm-happy-yellow'
    if (percentage >= 25) return 'text-tm-happy-yellow-80'
    return 'text-tm-true-maroon'
  }

  const dcpGoalNames: { [key: number]: string } = {
    1: 'Level 1 awards (4 required)',
    2: 'Level 2 awards (2 required)',
    3: 'More Level 2 awards (2 required)',
    4: 'Level 3 awards (2 required)',
    5: 'Level 4, Path Completion, or DTM award (1 required)',
    6: 'One more Level 4, Path Completion, or DTM award (1 required)',
    7: 'New members (4 required)',
    8: 'More new members (4 required)',
    9: 'Club officer roles trained (4 June-Aug, 4 Nov-Feb)',
    10: 'Membership-renewal dues on time & Club officer list on time',
  }

  const renderGoalBar = (goal: DCPGoal) => (
    <div
      key={goal.goalNumber}
      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-tm-loyal-blue-20 text-tm-loyal-blue font-semibold text-sm">
            {goal.goalNumber}
          </span>
          <div>
            <h4 className="font-semibold text-gray-900">
              Goal {goal.goalNumber}
            </h4>
            <p className="text-xs text-gray-600">
              {dcpGoalNames[goal.goalNumber] || 'DCP Goal'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-bold ${getPercentageTextColor(goal.achievementPercentage)}`}
          >
            {goal.achievementPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600">{goal.achievementCount} clubs</p>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${getPercentageColor(goal.achievementPercentage)}`}
          style={{ width: `${Math.min(goal.achievementPercentage, 100)}%` }}
        ></div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="redesign-panel">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-tm-loyal-blue"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-gray-600">Most Achieved Goal</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            Goal {dcpGoalAnalysis.mostCommonlyAchieved[0]?.goalNumber || 'N/A'}
          </p>
          <p className="text-sm text-tm-loyal-blue font-medium mt-1">
            {dcpGoalAnalysis.mostCommonlyAchieved[0]?.achievementPercentage.toFixed(
              1
            )}
            % of clubs
          </p>
        </div>

        <div className="redesign-panel">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-tm-true-maroon"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-gray-600">Least Achieved Goal</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            Goal {dcpGoalAnalysis.leastCommonlyAchieved[0]?.goalNumber || 'N/A'}
          </p>
          <p className="text-sm text-tm-true-maroon font-medium mt-1">
            {dcpGoalAnalysis.leastCommonlyAchieved[0]?.achievementPercentage.toFixed(
              1
            )}
            % of clubs
          </p>
        </div>

        <div className="redesign-panel">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-tm-loyal-blue"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <p className="text-sm text-gray-600">Average Achievement</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(
              dcpGoalAnalysis.mostCommonlyAchieved.reduce(
                (sum, g) => sum + g.achievementPercentage,
                0
              ) / dcpGoalAnalysis.mostCommonlyAchieved.length
            ).toFixed(1)}
            %
          </p>
          <p className="text-sm text-gray-600 mt-1">across all goals</p>
        </div>
      </div>

      {/* Most Commonly Achieved Goals */}
      <div className="redesign-panel">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-6 h-6 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">
            Most Commonly Achieved Goals
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Goals that clubs are successfully achieving across the district
        </p>
        <div className="space-y-3">
          {dcpGoalAnalysis.mostCommonlyAchieved.map(goal =>
            renderGoalBar(goal)
          )}
        </div>
      </div>

      {/* Least Commonly Achieved Goals */}
      <div className="redesign-panel">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">
            Goals Needing Attention
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Goals that clubs are struggling to achieve - opportunities for
          district support
        </p>
        <div className="space-y-3">
          {dcpGoalAnalysis.leastCommonlyAchieved.map(goal =>
            renderGoalBar(goal)
          )}
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div className="redesign-panel">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          DCP Goal Achievement Heatmap
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Visual representation of goal achievement across all 10 DCP goals
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...dcpGoalAnalysis.mostCommonlyAchieved]
            .sort((a, b) => a.goalNumber - b.goalNumber)
            .map(goal => (
              <div key={goal.goalNumber} className="relative group">
                <div
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center p-3 transition-transform hover:scale-105 ${
                    goal.achievementPercentage >= 75
                      ? 'bg-green-100 border-2 border-green-500'
                      : goal.achievementPercentage >= 50
                        ? 'bg-yellow-100 border-2 border-yellow-500'
                        : goal.achievementPercentage >= 25
                          ? 'bg-orange-100 border-2 border-orange-500'
                          : 'bg-red-100 border-2 border-red-500'
                  }`}
                >
                  <span className="text-2xl font-bold text-gray-900">
                    {goal.goalNumber}
                  </span>
                  <span
                    className={`text-lg font-semibold mt-1 ${getPercentageTextColor(goal.achievementPercentage)}`}
                  >
                    {goal.achievementPercentage.toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-600 mt-1 text-center">
                    {goal.achievementCount} clubs
                  </span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {dcpGoalNames[goal.goalNumber] || `Goal ${goal.goalNumber}`}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-green-500"></div>
            <span className="text-gray-600">≥75%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-yellow-500"></div>
            <span className="text-gray-600">50-74%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-orange-500"></div>
            <span className="text-gray-600">25-49%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-red-500"></div>
            <span className="text-gray-600">&lt;25%</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 rounded-lg shadow-md p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-tm-loyal-blue flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              District Support Recommendations
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-tm-loyal-blue mt-0.5">•</span>
                <span>
                  Focus training and resources on goals with low achievement
                  rates (below 50%)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-tm-loyal-blue mt-0.5">•</span>
                <span>
                  Share best practices from clubs successfully achieving
                  difficult goals
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-tm-loyal-blue mt-0.5">•</span>
                <span>
                  Provide targeted coaching for clubs struggling with specific
                  goals
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-tm-loyal-blue mt-0.5">•</span>
                <span>
                  Celebrate and recognize clubs achieving high-difficulty goals
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
