import React from 'react'
import { useDistrictAnalytics } from '../hooks/useDistrictAnalytics'
import { useDistrictRanking } from '../hooks/useDistrictRanking'
import type { DistrictPerformanceTargets } from '../hooks/useDistrictAnalytics'
import { LoadingSkeleton } from './LoadingSkeleton'
import { ErrorDisplay, EmptyState } from './ErrorDisplay'
import DistinguishedCompositionBar from './DistinguishedCompositionBar'
import PaymentCompositionDonut from './PaymentCompositionDonut'

interface DistrictOverviewProps {
  districtId: string
  selectedDate?: string
  programYearStartDate?: string
  /**
   * Pre-fetched performance targets from the usePerformanceTargets hook.
   * Currently consumed only for the future-proofed prop signature
   * (#572 moved the KPI cards out into DistrictKpiStrip, but the
   * targets are still authoritative for downstream consumers).
   */
  performanceTargets?: DistrictPerformanceTargets | undefined
}

export const DistrictOverview: React.FC<DistrictOverviewProps> = ({
  districtId,
  selectedDate,
  programYearStartDate,
}) => {
  const {
    data: analytics,
    isLoading,
    error,
  } = useDistrictAnalytics(districtId, programYearStartDate, selectedDate)

  // District-level fields not carried in per-club analytics (payment breakdowns).
  const { ranking: districtRanking } = useDistrictRanking(districtId)

  const clubCount = analytics?.allClubs.length ?? 0
  const avgMembersPerClub =
    clubCount > 0 && analytics
      ? (analytics.totalMembership / clubCount).toFixed(1)
      : null

  return (
    <div className="redesign-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        {analytics && clubCount > 0 && (
          <p className="mt-1 text-sm text-gray-600">
            {clubCount} club{clubCount === 1 ? '' : 's'}
            {avgMembersPerClub && (
              <>
                <span className="mx-1.5 text-gray-400" aria-hidden="true">
                  ·
                </span>
                avg {avgMembersPerClub} members/club
              </>
            )}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <LoadingSkeleton variant="stat" />
          <LoadingSkeleton variant="stat" />
          <LoadingSkeleton variant="stat" />
        </div>
      )}

      {!isLoading && error && (
        <ErrorDisplay
          error={error}
          title="Failed to Load District Analytics"
          onRetry={() => window.location.reload()}
          showDetails={true}
        />
      )}

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

      {/* KPI cards moved to <DistrictKpiStrip> (#572). The sticky strip
          sits above the narrative so the four numbers stay visible as
          the user scrolls. The composition bar + payment donut below
          remain the Overview section's "long-form" content. */}

      {/* Distinguished Composition stack-bar + Payment Composition donut */}
      {!isLoading && !error && analytics && analytics.allClubs.length > 0 && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DistinguishedCompositionBar
            smedley={analytics.distinguishedClubs.smedley}
            presidents={analytics.distinguishedClubs.presidents}
            select={analytics.distinguishedClubs.select}
            distinguished={analytics.distinguishedClubs.distinguished}
            totalClubs={analytics.allClubs.length}
          />
          <PaymentCompositionDonut
            totalMembership={analytics.totalMembership}
            newPayments={districtRanking?.newPayments ?? 0}
            aprilPayments={districtRanking?.aprilPayments ?? 0}
            octoberPayments={districtRanking?.octoberPayments ?? 0}
            latePayments={districtRanking?.latePayments ?? 0}
            charterPayments={districtRanking?.charterPayments ?? 0}
          />
        </div>
      )}
    </div>
  )
}
