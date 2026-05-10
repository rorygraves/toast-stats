import React from 'react'
import { LoadingSkeleton } from './LoadingSkeleton'
import { Tooltip, InfoIcon } from './Tooltip'

interface DistinguishedProgressChartProps {
  distinguishedClubs: {
    smedley: number
    presidents: number
    select: number
    distinguished: number
    total: number
  }
  distinguishedProjection: number
  totalClubs: number
  isLoading?: boolean
}

export const DistinguishedProgressChart: React.FC<
  DistinguishedProgressChartProps
> = ({
  distinguishedClubs,
  distinguishedProjection,
  totalClubs,
  isLoading = false,
}) => {
  // Calculate percentages
  const currentPercentage =
    totalClubs > 0 ? (distinguishedClubs.total / totalClubs) * 100 : 0
  const projectedPercentage =
    totalClubs > 0 ? (distinguishedProjection / totalClubs) * 100 : 0

  // Calculate individual level percentages for the breakdown
  const smedleyPercentage =
    distinguishedClubs.total > 0
      ? (distinguishedClubs.smedley / distinguishedClubs.total) * 100
      : 0
  const presidentsPercentage =
    distinguishedClubs.total > 0
      ? (distinguishedClubs.presidents / distinguishedClubs.total) * 100
      : 0
  const selectPercentage =
    distinguishedClubs.total > 0
      ? (distinguishedClubs.select / distinguishedClubs.total) * 100
      : 0
  const distinguishedPercentage =
    distinguishedClubs.total > 0
      ? (distinguishedClubs.distinguished / distinguishedClubs.total) * 100
      : 0

  return (
    <div className="redesign-panel">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-xl font-tm-headline font-bold text-tm-black">
          Distinguished Club Progress
        </h3>
        <Tooltip content="Track clubs achieving Distinguished (5+ goals), Select (7+ goals), President's (9+ goals), or Smedley (10+ goals) status">
          <InfoIcon />
        </Tooltip>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSkeleton variant="chart" />}

      {!isLoading && (
        <div className="space-y-6">
          {/* Current Progress Gauge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-tm-body font-medium text-gray-700">
                Current Progress
              </span>
              <span className="text-sm font-tm-body font-bold text-gray-900">
                {distinguishedClubs.total} / {totalClubs} (
                {currentPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-tm-loyal-blue transition-all duration-500 ease-out flex items-center justify-center"
                style={{ width: `${Math.min(currentPercentage, 100)}%` }}
              >
                {currentPercentage > 10 && (
                  <span className="text-xs font-tm-body font-bold text-white">
                    {distinguishedClubs.total} clubs
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Projected Year-End */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-tm-body font-medium text-gray-700">
                Projected Year-End
              </span>
              <span className="text-sm font-tm-body font-bold text-gray-900">
                {distinguishedProjection} / {totalClubs} (
                {projectedPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-tm-happy-yellow transition-all duration-500 ease-out flex items-center justify-center"
                style={{ width: `${Math.min(projectedPercentage, 100)}%` }}
              >
                {projectedPercentage > 10 && (
                  <span className="text-xs font-tm-body font-bold text-tm-black">
                    {distinguishedProjection} clubs
                  </span>
                )}
              </div>
            </div>
            {distinguishedProjection > distinguishedClubs.total && (
              <p className="text-xs font-tm-body text-gray-600 mt-1">
                +{distinguishedProjection - distinguishedClubs.total} clubs
                projected to achieve distinguished status
              </p>
            )}
          </div>

          {/* Breakdown by Level */}
          <div className="border-t border-t-gray-200 pt-4">
            <h4 className="text-sm font-tm-headline font-semibold text-gray-900 mb-3">
              Breakdown by Level
            </h4>
            <div className="space-y-3">
              {/* Smedley Distinguished */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-tm-happy-yellow rounded-full"></div>
                    <span className="text-sm font-tm-body text-gray-700">
                      Smedley Distinguished
                    </span>
                  </div>
                  <span className="text-sm font-tm-body font-medium text-gray-900">
                    {distinguishedClubs.smedley}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tm-happy-yellow transition-all duration-500"
                    style={{ width: `${smedleyPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* President's Distinguished */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-tm-loyal-blue rounded-full"></div>
                    <span className="text-sm font-tm-body text-gray-700">
                      President's Distinguished
                    </span>
                  </div>
                  <span className="text-sm font-tm-body font-medium text-gray-900">
                    {distinguishedClubs.presidents}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tm-loyal-blue transition-all duration-500"
                    style={{ width: `${presidentsPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Select Distinguished */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-tm-true-maroon rounded-full"></div>
                    <span className="text-sm font-tm-body text-gray-700">
                      Select Distinguished
                    </span>
                  </div>
                  <span className="text-sm font-tm-body font-medium text-gray-900">
                    {distinguishedClubs.select}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tm-true-maroon transition-all duration-500"
                    style={{ width: `${selectPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Distinguished */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-tm-cool-gray rounded-full"></div>
                    <span className="text-sm font-tm-body text-gray-700">
                      Distinguished
                    </span>
                  </div>
                  <span className="text-sm font-tm-body font-medium text-gray-900">
                    {distinguishedClubs.distinguished}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tm-cool-gray transition-all duration-500"
                    style={{ width: `${distinguishedPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3 pt-4 border-t border-t-gray-200">
            <div className="text-center">
              <p className="text-xl font-tm-headline font-bold text-tm-happy-yellow">
                {distinguishedClubs.smedley}
              </p>
              <p className="text-xs font-tm-body text-gray-600 mt-1">Smedley</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-tm-headline font-bold text-tm-loyal-blue">
                {distinguishedClubs.presidents}
              </p>
              <p className="text-xs font-tm-body text-gray-600 mt-1">
                President's
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-tm-headline font-bold text-tm-true-maroon">
                {distinguishedClubs.select}
              </p>
              <p className="text-xs font-tm-body text-gray-600 mt-1">Select</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-tm-headline font-bold text-tm-cool-gray">
                {distinguishedClubs.distinguished}
              </p>
              <p className="text-xs font-tm-body text-gray-600 mt-1">
                Distinguished
              </p>
            </div>
          </div>

          {/* Achievement Rate */}
          <div className="bg-tm-loyal-blue-10 rounded-lg p-4 border border-tm-loyal-blue-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-tm-body font-medium text-tm-loyal-blue">
                  Achievement Rate
                </p>
                <p className="text-xs font-tm-body text-tm-loyal-blue-70 mt-1">
                  {currentPercentage.toFixed(1)}% of clubs have achieved
                  distinguished status
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-tm-headline font-bold text-tm-loyal-blue">
                  {currentPercentage.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
