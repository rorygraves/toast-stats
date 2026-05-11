import React from 'react'
import { useDistrictAnalytics } from '../hooks/useDistrictAnalytics'
import type { DistrictPerformanceTargets } from '../hooks/useDistrictAnalytics'
import { LoadingSkeleton } from './LoadingSkeleton'
import { ErrorDisplay, EmptyState } from './ErrorDisplay'
import { TargetProgressCard } from './TargetProgressCard'
import DistinguishedCompositionBar from './DistinguishedCompositionBar'

interface DistrictOverviewProps {
  districtId: string
  selectedDate?: string
  programYearStartDate?: string
  /**
   * Pre-fetched performance targets from the usePerformanceTargets hook.
   * Contains world rank, percentile, region rank, and target thresholds.
   * Fixes #183 — rankings now populated from CDN performance-targets.json.
   */
  performanceTargets?: DistrictPerformanceTargets | undefined
  /**
   * Net member count change for the program year, computed from the rich
   * aggregated analytics trend (134+ data points). When provided, this
   * overrides the locally-derived value from the sparse /analytics endpoint
   * which only has 2 points and computes a cross-year diff instead of
   * a program-year diff. See #76.
   */
  netMemberChange?: number | undefined
}

export const DistrictOverview: React.FC<DistrictOverviewProps> = ({
  districtId,
  selectedDate,
  programYearStartDate,
  performanceTargets,
  netMemberChange,
}) => {
  // Fetch analytics with program year boundaries
  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error,
  } = useDistrictAnalytics(districtId, programYearStartDate, selectedDate)

  // Get club counts from the new separate arrays
  const interventionRequiredClubsCount = React.useMemo(() => {
    return analytics?.interventionRequiredClubs?.length || 0
  }, [analytics?.interventionRequiredClubs])

  const vulnerableClubsCount = React.useMemo(() => {
    return analytics?.vulnerableClubs?.length || 0
  }, [analytics?.vulnerableClubs])

  const isLoading = isLoadingAnalytics

  // Merge performance targets: prefer prop (from usePerformanceTargets CDN hook),
  // fall back to analytics.performanceTargets (inline in analytics JSON).
  const pt = performanceTargets ?? analytics?.performanceTargets

  // Use the prop value from aggregated analytics when available (correct program-year diff).
  // Fall back to deriving from sparse /analytics trend (cross-year diff, less accurate).
  // Fix #76: the sparse membershipTrend only has 2 points spanning a full calendar year,
  // giving a cross-year diff (+61) instead of the program-year diff (-66).
  // TODO(#170): Once time-series data is served via CDN, use base membership count
  // (not payments) for program-year member change calculation.
  const actualMemberCountChange = React.useMemo(() => {
    if (netMemberChange !== undefined) return netMemberChange
    const trend = analytics?.membershipTrend
    if (!trend || trend.length < 2) return 0
    const first = trend[0]
    const last = trend[trend.length - 1]
    if (!first || !last) return 0
    return last.count - first.count
  }, [netMemberChange, analytics?.membershipTrend])

  const nullRankings = {
    worldRank: null,
    worldPercentile: null,
    regionRank: null,
    totalDistricts: 0,
    totalInRegion: 0,
    region: null,
  }

  return (
    <div className="redesign-panel">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton variant="stat" />
          <LoadingSkeleton variant="stat" />
          <LoadingSkeleton variant="stat" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorDisplay
          error={error}
          title="Failed to Load District Analytics"
          onRetry={() => window.location.reload()}
          showDetails={true}
        />
      )}

      {/* No Data State */}
      {!isLoading && !error && !analytics && (
        <EmptyState
          title="No Cached Data Available"
          message="This district doesn't have any cached historical data yet. Use the Admin Panel to start collecting performance data over time."
          icon="data"
          action={{
            label: 'Go to Admin Panel',
            onClick: () => {
              window.location.href = '/admin'
            },
          }}
        />
      )}

      {/* Key Metrics */}
      {!isLoading && !error && analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Paid Clubs - replaces Total Clubs */}
          <TargetProgressCard
            title="Paid Clubs"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            current={pt?.paidClubs.current ?? analytics.allClubs.length}
            base={pt?.paidClubs.base ?? null}
            targets={pt?.paidClubs.targets ?? null}
            achievedLevel={pt?.paidClubs.achievedLevel ?? null}
            rankings={pt?.paidClubs.rankings ?? nullRankings}
            colorScheme="blue"
            tooltipContent="Paid clubs count with targets for each recognition level. Thriving, Vulnerable, and Intervention Required badges show club health status."
            badges={
              <>
                <span
                  className="text-xs text-tm-loyal-blue bg-tm-loyal-blue-10 px-2 py-1 rounded font-tm-body"
                  title="Average membership count per club"
                >
                  Avg{' '}
                  {analytics.allClubs.length > 0
                    ? (
                        analytics.totalMembership / analytics.allClubs.length
                      ).toFixed(1)
                    : '—'}{' '}
                  members/club
                </span>
                <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                  {analytics.thrivingClubs.length} Thriving
                </span>
                {vulnerableClubsCount > 0 && (
                  <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    {vulnerableClubsCount} Vulnerable
                  </span>
                )}
                {interventionRequiredClubsCount > 0 && (
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                    {interventionRequiredClubsCount} Intervention Required
                  </span>
                )}
              </>
            }
          />

          {/* Membership Payments - replaces Total Membership */}
          <TargetProgressCard
            title="Membership Payments"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
            current={
              pt?.membershipPayments.current ?? analytics.totalMembership
            }
            base={pt?.membershipPayments.base ?? null}
            targets={pt?.membershipPayments.targets ?? null}
            achievedLevel={pt?.membershipPayments.achievedLevel ?? null}
            rankings={pt?.membershipPayments.rankings ?? nullRankings}
            colorScheme="green"
            tooltipContent="Total membership payments (New + April + October + Late + Charter) with targets for each recognition level."
            badges={
              <span
                className={`text-xs px-2 py-1 rounded ${
                  actualMemberCountChange >= 0
                    ? 'text-green-700 bg-green-100'
                    : 'text-red-700 bg-red-100'
                }`}
              >
                {actualMemberCountChange >= 0 ? '+' : ''}
                {actualMemberCountChange} members
              </span>
            }
          />

          {/* Distinguished Clubs - enhanced with targets */}
          <TargetProgressCard
            title="Distinguished Clubs"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            }
            current={
              pt?.distinguishedClubs.current ??
              analytics.distinguishedClubs.total
            }
            base={pt?.distinguishedClubs.base ?? null}
            targets={pt?.distinguishedClubs.targets ?? null}
            achievedLevel={pt?.distinguishedClubs.achievedLevel ?? null}
            rankings={pt?.distinguishedClubs.rankings ?? nullRankings}
            colorScheme="purple"
            tooltipContent="Clubs achieving DCP goals + membership requirements with targets for each recognition level. Distinguished (5 goals + 20 members), Select (7 goals + 20 members), President's (9 goals + 20 members), Smedley (10 goals + 25 members)."
            badges={
              <>
                {analytics.distinguishedClubs.smedley > 0 && (
                  <span className="text-xs font-tm-body text-tm-happy-yellow bg-tm-happy-yellow-20 px-2 py-1 rounded font-semibold">
                    {analytics.distinguishedClubs.smedley} Smedley
                  </span>
                )}
                {analytics.distinguishedClubs.presidents > 0 && (
                  <span className="text-xs font-tm-body text-tm-loyal-blue bg-tm-loyal-blue-20 px-2 py-1 rounded">
                    {analytics.distinguishedClubs.presidents} President's
                  </span>
                )}
                {analytics.distinguishedClubs.select > 0 && (
                  <span className="text-xs font-tm-body text-tm-true-maroon bg-tm-true-maroon-20 px-2 py-1 rounded">
                    {analytics.distinguishedClubs.select} Select
                  </span>
                )}
                {analytics.distinguishedClubs.distinguished > 0 && (
                  <span className="text-xs font-tm-body text-tm-cool-gray bg-tm-cool-gray-20 px-2 py-1 rounded">
                    {analytics.distinguishedClubs.distinguished} Distinguished
                  </span>
                )}
              </>
            }
          />

          {/* Total Members (#428) — sums latest active-member counts across
              every club in the district. Distinct from Membership Payments
              (which counts payment events; members typically pay twice/yr). */}
          <TargetProgressCard
            title="Total Members"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
            current={analytics.allClubs.reduce((sum, c) => {
              const last = c.membershipTrend[c.membershipTrend.length - 1]
              return sum + (last?.count ?? 0)
            }, 0)}
            base={null}
            targets={null}
            achievedLevel={null}
            rankings={nullRankings}
            colorScheme="blue"
            tooltipContent="Sum of current paid members across every club in this district. Distinct from Membership Payments — members typically pay twice per year, so payments ≈ 2× members over a full program year."
            badges={
              <span
                className="text-xs font-tm-body text-tm-loyal-blue bg-tm-loyal-blue-10 px-2 py-1 rounded"
                title="Active clubs included in the sum"
              >
                across {analytics.allClubs.length} club
                {analytics.allClubs.length === 1 ? '' : 's'}
              </span>
            }
          />
        </div>
      )}

      {/* Distinguished Composition stack-bar (#360 redesign slice 2). */}
      {!isLoading && !error && analytics && analytics.allClubs.length > 0 && (
        <div className="mt-4">
          <DistinguishedCompositionBar
            smedley={analytics.distinguishedClubs.smedley}
            presidents={analytics.distinguishedClubs.presidents}
            select={analytics.distinguishedClubs.select}
            distinguished={analytics.distinguishedClubs.distinguished}
            totalClubs={analytics.allClubs.length}
          />
        </div>
      )}
    </div>
  )
}
