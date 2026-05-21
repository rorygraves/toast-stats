import React from 'react'
import { useDistrictAnalytics } from '../hooks/useDistrictAnalytics'
import { useDistrictRanking } from '../hooks/useDistrictRanking'
import type { DistrictPerformanceTargets } from '../hooks/useDistrictAnalytics'
import { LoadingSkeleton } from './LoadingSkeleton'
import { ErrorDisplay, EmptyState } from './ErrorDisplay'
import { KpiBulletCard } from './KpiBulletCard'
import DistinguishedCompositionBar from './DistinguishedCompositionBar'
import PaymentCompositionDonut from './PaymentCompositionDonut'

interface DistrictOverviewProps {
  districtId: string
  selectedDate?: string
  programYearStartDate?: string
  /**
   * Pre-fetched performance targets from the usePerformanceTargets hook.
   * Contains world rank, percentile, region rank, and target thresholds.
   */
  performanceTargets?: DistrictPerformanceTargets | undefined
}

const NULL_RANKINGS = {
  worldRank: null,
  worldPercentile: null,
  regionRank: null,
  totalDistricts: 0,
  totalInRegion: 0,
  region: null,
}

export const DistrictOverview: React.FC<DistrictOverviewProps> = ({
  districtId,
  selectedDate,
  programYearStartDate,
  performanceTargets,
}) => {
  const {
    data: analytics,
    isLoading,
    error,
  } = useDistrictAnalytics(districtId, programYearStartDate, selectedDate)

  // District-level fields not carried in per-club analytics (payment breakdowns).
  const { ranking: districtRanking } = useDistrictRanking(districtId)

  // Prefer prop (from usePerformanceTargets CDN hook), fall back to inline analytics.
  const pt = performanceTargets ?? analytics?.performanceTargets

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

      {!isLoading && !error && analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <KpiBulletCard
            title="Paid Clubs"
            current={pt?.paidClubs.current ?? analytics.allClubs.length}
            targets={pt?.paidClubs.targets ?? null}
            rankings={pt?.paidClubs.rankings ?? NULL_RANKINGS}
            tooltipContent="Paid clubs count with thresholds for each Distinguished District recognition level."
          />

          <KpiBulletCard
            title="Membership Payments"
            current={
              pt?.membershipPayments.current ?? analytics.totalMembership
            }
            targets={pt?.membershipPayments.targets ?? null}
            rankings={pt?.membershipPayments.rankings ?? NULL_RANKINGS}
            tooltipContent="Total membership payments (New + April + October + Late + Charter) with thresholds for each recognition level."
          />

          <KpiBulletCard
            title="Distinguished Clubs"
            current={
              pt?.distinguishedClubs.current ??
              analytics.distinguishedClubs.total
            }
            targets={pt?.distinguishedClubs.targets ?? null}
            rankings={pt?.distinguishedClubs.rankings ?? NULL_RANKINGS}
            tooltipContent="Clubs achieving DCP goals + membership requirements with thresholds for each recognition level. Distinguished (5 goals + 20 members), Select (7 goals + 20 members), President's (9 goals + 20 members), Smedley (10 goals + 25 members)."
          />
        </div>
      )}

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
