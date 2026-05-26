import React, { useMemo } from 'react'
import { computeTiedRanks } from '../utils/tieRankingUtils'

interface TopGrowthClub {
  clubId: string
  clubName: string
  growth: number
}

interface TopDCPClub {
  clubId: string
  clubName: string
  goalsAchieved: number
  distinguishedLevel?: 'Smedley' | 'President' | 'Select' | 'Distinguished'
}

interface TopGrowthClubsProps {
  topGrowthClubs: TopGrowthClub[]
  topDCPClubs?: TopDCPClub[]
  isLoading: boolean
}

export const TopGrowthClubs: React.FC<TopGrowthClubsProps> = ({
  topGrowthClubs,
  topDCPClubs,
  isLoading,
}) => {
  // Defensive null check - treat undefined/null as empty array
  const safeTopGrowthClubs = useMemo(
    () => topGrowthClubs ?? [],
    [topGrowthClubs]
  )

  // Compute tie-aware ranks (#236)
  const growthRanks = useMemo(
    () => computeTiedRanks(safeTopGrowthClubs, c => c.growth),
    [safeTopGrowthClubs]
  )
  const dcpRanks = useMemo(
    () => computeTiedRanks(topDCPClubs ?? [], c => c.goalsAchieved),
    [topDCPClubs]
  )

  if (isLoading) {
    return (
      <div className="redesign-panel">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const getDistinguishedBadge = (
    level?: 'Smedley' | 'President' | 'Select' | 'Distinguished'
  ): React.ReactElement | null => {
    if (!level) return null

    const colors = {
      Smedley: 'bg-tm-happy-yellow-30 text-tm-true-maroon',
      President: 'bg-tm-true-maroon-20 text-tm-true-maroon',
      Select: 'bg-tm-loyal-blue-20 text-tm-loyal-blue',
      Distinguished: 'bg-green-100 text-green-800',
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-tm-body ${colors[level]}`}
      >
        {level}
      </span>
    )
  }

  const getGrowthIcon = (growth: number): React.ReactElement => {
    if (growth > 0) {
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
    return (
      <svg
        className="w-5 h-5 text-gray-400"
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

  const getTrophyIcon = (rank: number): React.ReactElement => {
    const colors = ['text-yellow-500', 'text-gray-400', 'text-orange-600']
    const color = colors[rank - 1] || 'text-gray-300'

    return (
      <svg
        className={`w-6 h-6 ${color}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 00-1.5 1.5v.5h-11v-.5A1.5 1.5 0 002.5 10H2a1 1 0 01-1-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5a1.5 1.5 0 013 0V4h1v-.5z" />
        <path d="M4 11h12v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" />
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Growth Clubs */}
      <div className="redesign-panel">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-6 h-6 text-green-600"
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
          <h3 className="text-xl font-semibold text-gray-900 font-tm-headline">
            Top Growth Clubs
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4 font-tm-body">
          Clubs with the highest membership growth over the analyzed period
        </p>

        {safeTopGrowthClubs.length === 0 ? (
          <p className="text-gray-500 text-center py-8 font-tm-body">
            No growth data available
          </p>
        ) : (
          <div className="space-y-3">
            {safeTopGrowthClubs.map((club, index) => {
              const { rank, isTied } = growthRanks[index]!
              return (
                <div
                  key={club.clubId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {rank <= 3 ? (
                        getTrophyIcon(rank)
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center text-gray-400 font-semibold">
                          {rank}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate font-tm-headline">
                          {club.clubName}
                        </h4>
                        {isTied && (
                          <span className="text-xs text-gray-600 font-tm-body">
                            (tied)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-tm-body">
                        Club #{club.clubId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getGrowthIcon(club.growth)}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 font-tm-headline">
                        +{club.growth}
                      </p>
                      <p className="text-xs text-gray-600 font-tm-body">
                        members
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top DCP Goal Achievement Clubs */}
      {topDCPClubs && topDCPClubs.length > 0 && (
        <div className="redesign-panel">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-6 h-6 text-tm-loyal-blue"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 font-tm-headline">
              Top DCP Goal Achievement
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4 font-tm-body">
            Clubs with the highest DCP goal achievement
          </p>

          <div className="space-y-3">
            {topDCPClubs.map((club, index) => {
              const { rank, isTied } = dcpRanks[index]!
              return (
                <div
                  key={club.clubId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {rank <= 3 ? (
                        getTrophyIcon(rank)
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center text-gray-400 font-semibold">
                          {rank}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate font-tm-headline">
                          {club.clubName}
                        </h4>
                        {getDistinguishedBadge(club.distinguishedLevel)}
                        {isTied && (
                          <span className="text-xs text-gray-600 font-tm-body">
                            (tied)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-tm-body">
                        Club #{club.clubId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-tm-loyal-blue font-tm-headline">
                      {club.goalsAchieved}
                    </p>
                    <p className="text-xs text-gray-600 font-tm-body">
                      of 10 goals
                    </p>
                    <div className="mt-1">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-tm-loyal-blue h-2 rounded-full"
                          style={{
                            width: `${(club.goalsAchieved / 10) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Achievement Summary. #682: token-driven redesign-panel (was a
          light-baked loyal-blue→cool-gray gradient that read lighter than the
          neighbouring panels in dark mode). The nested stat cards sit on
          --surface-2 (an arbitrary-value var that re-resolves live under the
          [data-theme='dark'] toggle, Lesson 093) so they stay distinct from
          the panel surface in both themes. */}
      <div className="redesign-panel">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 font-tm-headline">
          Achievement Highlights
        </h3>
        <div className="grid grid-cols-1 min-[980px]:grid-cols-2 gap-4">
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <h4 className="font-semibold text-gray-900 font-tm-headline">
                Total Growth
              </h4>
            </div>
            <p className="text-3xl font-bold text-green-600 font-tm-headline">
              +{safeTopGrowthClubs.reduce((sum, club) => sum + club.growth, 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1 font-tm-body">
              members across top {safeTopGrowthClubs.length} clubs
            </p>
          </div>

          {topDCPClubs && topDCPClubs.length > 0 && (
            <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-tm-loyal-blue"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h4 className="font-semibold text-gray-900 font-tm-headline">
                  Average DCP Goals
                </h4>
              </div>
              <p className="text-3xl font-bold text-tm-loyal-blue font-tm-headline">
                {(
                  topDCPClubs.reduce(
                    (sum, club) => sum + club.goalsAchieved,
                    0
                  ) / topDCPClubs.length
                ).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600 mt-1 font-tm-body">
                across top {topDCPClubs.length} clubs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
