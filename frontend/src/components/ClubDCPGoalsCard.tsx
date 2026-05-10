/**
 * ClubDCPGoalsCard (#242)
 *
 * Displays per-goal DCP progress for a single club, sourced from raw CSV data.
 * Shows all 10 goals grouped by category with achieved/required counts and status.
 */

import React from 'react'
import {
  type DcpGoalProgress,
  type ScrapedRecord,
  extractDcpGoalProgress,
} from '../utils/dcpGoals'

// ── Component ──────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<
  DcpGoalProgress['category'],
  { bg: string; text: string; border: string }
> = {
  Education: {
    bg: 'bg-tm-loyal-blue',
    text: 'text-white',
    border: 'border-tm-loyal-blue-30',
  },
  Membership: {
    bg: 'bg-tm-happy-yellow-80',
    text: 'text-tm-black',
    border: 'border-tm-happy-yellow',
  },
  Training: {
    bg: 'bg-tm-true-maroon-80',
    text: 'text-white',
    border: 'border-tm-true-maroon-30',
  },
  Administration: {
    bg: 'bg-tm-cool-gray-80',
    text: 'text-white',
    border: 'border-tm-cool-gray-30',
  },
}

interface ClubDCPGoalsCardProps {
  clubRecord: ScrapedRecord | null | undefined
  isLoading: boolean
}

export const ClubDCPGoalsCard: React.FC<ClubDCPGoalsCardProps> = ({
  clubRecord,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="redesign-panel">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded-sm w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded-sm w-full"></div>
          <div className="h-4 bg-gray-200 rounded-sm w-full"></div>
          <div className="h-4 bg-gray-200 rounded-sm w-full"></div>
          <div className="h-4 bg-gray-200 rounded-sm w-full"></div>
          <div className="h-4 bg-gray-200 rounded-sm w-full"></div>
        </div>
      </div>
    )
  }

  if (!clubRecord) {
    return null // No raw CSV data available
  }

  const goals = extractDcpGoalProgress(clubRecord)
  const achievedCount = goals.filter(g => g.achieved).length

  // Group by category
  const categories: DcpGoalProgress['category'][] = [
    'Education',
    'Membership',
    'Training',
    'Administration',
  ]

  return (
    <div className="redesign-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 font-tm-headline flex items-center gap-2">
          <svg
            className="w-5 h-5 text-tm-loyal-blue"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          DCP Goals Progress
        </h2>
        <span className="text-sm font-medium text-gray-600 font-tm-body tabular-nums">
          {achievedCount} / 10 goals
        </span>
      </div>

      {/* Goals table */}
      <div className="space-y-1">
        {categories.map(category => {
          const categoryGoals = goals.filter(g => g.category === category)
          const colors = CATEGORY_COLORS[category]
          return (
            <React.Fragment key={category}>
              {/* Category header */}
              <div
                className={`${colors.bg} ${colors.text} px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-t-md mt-3 first:mt-0`}
              >
                {category}
              </div>

              {/* Goal rows */}
              {categoryGoals.map(goal => (
                <div key={goal.goalNumber}>
                  {goal.subItems.length === 1 ? (
                    /* Simple single-row goal */
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 border-x border-b ${colors.border} ${
                        goal.achieved ? 'bg-tm-loyal-blue-10' : 'bg-white'
                      }`}
                    >
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs shrink-0">
                        {goal.goalNumber}
                      </span>
                      <span className="text-sm text-gray-900 flex-1">
                        {goal.name}
                      </span>
                      <span className="text-sm text-gray-600 tabular-nums font-tm-body w-12 text-center">
                        {goal.subItems[0]?.required === 'Y'
                          ? 'Y'
                          : goal.subItems[0]?.required}
                      </span>
                      <span
                        className={`text-sm tabular-nums font-tm-body w-12 text-center font-semibold ${
                          goal.achieved ? 'text-tm-loyal-blue' : 'text-gray-900'
                        }`}
                      >
                        {goal.subItems[0]?.achieved}
                      </span>
                      <span className="w-36 text-right">
                        {goal.achieved ? (
                          <span className="text-tm-loyal-blue font-semibold text-sm">
                            ✓
                          </span>
                        ) : (
                          <span className="text-xs text-red-700 font-tm-body">
                            {goal.statusText}
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    /* Multi-sub-item goal (e.g., Goal 9, 10) */
                    <>
                      {goal.subItems.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 px-3 py-2 border-x border-b ${colors.border} ${
                            goal.achieved ? 'bg-tm-loyal-blue-10' : 'bg-white'
                          }`}
                        >
                          {idx === 0 ? (
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs shrink-0">
                              {goal.goalNumber}
                            </span>
                          ) : (
                            <span className="w-7 shrink-0"></span>
                          )}
                          <span className="text-sm text-gray-700 flex-1">
                            {item.label}
                          </span>
                          <span className="text-sm text-gray-600 tabular-nums font-tm-body w-12 text-center">
                            {item.required === 'Y' ? 'Y' : item.required}
                          </span>
                          <span
                            className={`text-sm tabular-nums font-tm-body w-12 text-center font-semibold ${
                              (
                                item.required === 'Y'
                                  ? item.achieved >= 1
                                  : item.achieved >= item.required
                              )
                                ? 'text-tm-loyal-blue'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.achieved}
                          </span>
                          <span className="w-36 text-right">
                            {idx === 0 &&
                              (goal.achieved ? (
                                <span className="text-tm-loyal-blue font-semibold text-sm">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-xs text-red-700 font-tm-body">
                                  {goal.statusText}
                                </span>
                              ))}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </React.Fragment>
          )
        })}
      </div>

      {/* Column headers legend */}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 px-3">
        <span className="w-7 shrink-0"></span>
        <span className="flex-1">Goals to Achieve</span>
        <span className="w-12 text-center">Goal</span>
        <span className="w-12 text-center">To Date</span>
        <span className="w-36 text-right">Status</span>
      </div>
    </div>
  )
}

export default ClubDCPGoalsCard
