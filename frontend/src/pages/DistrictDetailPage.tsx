import React, { useMemo } from 'react'
import {
  Link,
  Navigate,
  useParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { redirectLegacyDistrictTab } from '../utils/legacyTabRedirect'
import { useDistricts } from '../hooks/useDistricts'
import { DistrictDetailHeader } from '../components/DistrictDetailHeader'
import { DistrictSubnav } from '../components/DistrictSubnav'
import { useDistrictAnalytics } from '../hooks/useDistrictAnalytics'
import { useAggregatedAnalytics } from '../hooks/useAggregatedAnalytics'
import { useDistrictStatistics } from '../hooks/useMembershipData'
import { usePerformanceTargets } from '../hooks/usePerformanceTargets'
import { usePaymentsTrend } from '../hooks/usePaymentsTrend'
import { useTimeSeries } from '../hooks/useTimeSeries'
import {
  computeYearOverYear,
  computePaymentYoYFromTimeSeries,
  getLatestPayments,
} from '../hooks/useTimeSeriesYoY'
import { useDistrictCachedDates } from '../hooks/useDistrictData'
import { useUrlProgramYear } from '../hooks/useUrlProgramYear'
import {
  getAvailableProgramYears,
  filterDatesByProgramYear,
  getMostRecentDateInProgramYear,
  isDateInProgramYear,
  calculateProgramYearDay,
} from '../utils/programYear'
import type { MultiYearPaymentData } from '../hooks/usePaymentsTrend'
import { DistrictOverview } from '../components/DistrictOverview'
import { NotableDatesSection } from '../components/NotableDatesSection'
import { LongestServingClubsLeaderboard } from '../components/LongestServingClubsLeaderboard'
import { DistinguishedDistrictTrophyCase } from '../components/DistinguishedDistrictTrophyCase'
import { useCompetitiveAwards } from '../hooks/useCompetitiveAwards'

import {
  LazyMembershipTrendChart as MembershipTrendChart,
  LazyMembershipPaymentsChart as MembershipPaymentsChart,
  LazyYearOverYearComparison as YearOverYearComparison,
} from '../components/LazyCharts'
import { TopGrowthClubs } from '../components/TopGrowthClubs'
import { EducationLevelsCard } from '../components/EducationLevelsCard'
import { extractEducationLevels } from '../utils/extractEducationLevels'
import {
  DistrictKpiStrip,
  type DistrictKpiStripData,
} from '../components/DistrictKpiStrip'

// Synthetic rankings used when performance-targets CDN data is missing
// and the inline analytics rollup is the only source. Stable module-level
// const so the kpiStripData memo stays referentially clean.
const NULL_RANKINGS = {
  worldRank: null,
  worldPercentile: null,
  regionRank: null,
  totalDistricts: 0,
  totalInRegion: 0,
  region: null,
}

import ErrorBoundary from '../components/ErrorBoundary'
import { ErrorDisplay, EmptyState } from '../components/ErrorDisplay'
import { LoadingSkeleton } from '../components/LoadingSkeleton'

import GlobalRankingsTab from '../components/GlobalRankingsTab'

const DistrictDetailPageInner: React.FC = () => {
  const { districtId } = useParams<{ districtId: string }>()
  const navigate = useNavigate()

  // #571 (IA Phase 3) retired the tab strip. The page is now a single
  // scrollable narrative; the Clubs / Divisions / Rankings subviews
  // each live at their own route and the legacy `?tab=` URLs redirect
  // there via the outer DistrictDetailPage wrapper.

  // Use URL-synced program year and date (#272)
  const {
    selectedProgramYear,
    setSelectedProgramYear,
    selectedDate,
    setSelectedDate,
  } = useUrlProgramYear()

  // Fetch district info
  const { data: districtsData } = useDistricts()
  const selectedDistrict = districtsData?.districts?.find(
    d => d.id === districtId
  )

  // Fetch cached dates for date selector
  const { data: cachedDatesData } = useDistrictCachedDates(districtId || '')

  // Get all cached dates
  const allCachedDates = React.useMemo(
    () => cachedDatesData?.dates || [],
    [cachedDatesData?.dates]
  )

  // Get available program years from cached dates
  const availableProgramYears = React.useMemo(() => {
    return getAvailableProgramYears(allCachedDates)
  }, [allCachedDates])

  // Auto-select a valid program year if current selection is not in available list
  React.useEffect(() => {
    if (availableProgramYears.length > 0) {
      const isCurrentYearAvailable = availableProgramYears.some(
        py => py.year === selectedProgramYear.year
      )
      if (!isCurrentYearAvailable) {
        // Select the most recent available program year
        const mostRecentYear = availableProgramYears[0]
        if (mostRecentYear) {
          setSelectedProgramYear(mostRecentYear)
        }
      }
    }
  }, [availableProgramYears, selectedProgramYear.year, setSelectedProgramYear])

  // Filter cached dates by selected program year
  const cachedDatesInProgramYear = React.useMemo(() => {
    return filterDatesByProgramYear(allCachedDates, selectedProgramYear)
  }, [allCachedDates, selectedProgramYear])

  // Compute effective program year - use selected if available, otherwise most recent available
  // This prevents API calls with invalid date ranges during the transition period
  const effectiveProgramYear = React.useMemo(() => {
    if (availableProgramYears.length === 0) {
      return null // No data yet, don't make API calls
    }
    const isCurrentYearAvailable = availableProgramYears.some(
      py => py.year === selectedProgramYear.year
    )
    if (isCurrentYearAvailable) {
      return selectedProgramYear
    }
    // Fall back to most recent available
    return availableProgramYears[0] ?? null
  }, [availableProgramYears, selectedProgramYear])

  // Compute effective end date - must be within the effective program year
  const effectiveEndDate = React.useMemo(() => {
    if (!effectiveProgramYear) return null
    if (
      selectedDate &&
      isDateInProgramYear(selectedDate, effectiveProgramYear)
    ) {
      return selectedDate
    }
    // Use the most recent date in the effective program year, or the program year end date
    const mostRecent = getMostRecentDateInProgramYear(
      allCachedDates,
      effectiveProgramYear
    )
    return mostRecent || effectiveProgramYear.endDate
  }, [selectedDate, effectiveProgramYear, allCachedDates])

  // Determine if we have valid dates for API calls
  const hasValidDates =
    effectiveProgramYear !== null && effectiveEndDate !== null

  // Reset selectedDate when it's outside the selected program year
  // This prevents invalid date ranges where startDate > endDate
  React.useEffect(() => {
    if (
      selectedDate &&
      !isDateInProgramYear(selectedDate, selectedProgramYear)
    ) {
      // Clear the date so the next effect can pick a valid one
      setSelectedDate(undefined)
    }
  }, [selectedDate, selectedProgramYear, setSelectedDate])

  // Auto-select most recent date in program year when program year changes
  React.useEffect(() => {
    if (cachedDatesInProgramYear.length > 0 && !selectedDate) {
      const mostRecent = getMostRecentDateInProgramYear(
        allCachedDates,
        selectedProgramYear
      )
      if (mostRecent) {
        setSelectedDate(mostRecent)
      }
    }
  }, [
    selectedProgramYear,
    cachedDatesInProgramYear,
    allCachedDates,
    selectedDate,
    setSelectedDate,
  ])

  // Fetch aggregated analytics for overview tab (summary, trends, yearOverYear)
  // CDN-only: fetches pre-computed analytics from Cloud CDN (#173)
  // Requirements: 5.1, 5.2
  const {
    data: aggregatedAnalytics,
    isLoading: isLoadingAggregated,
    error: aggregatedError,
    refetch: refetchAggregated,
  } = useAggregatedAnalytics(
    hasValidDates ? districtId || null : null,
    effectiveEndDate ?? undefined
  )

  // Fetch time-series data for multi-point trends + base membership (#170)
  const { data: timeSeries } = useTimeSeries(
    hasValidDates ? districtId || null : null
  )

  // Fetch full analytics for detailed views (clubs, divisions, analytics tabs)
  // This provides full club arrays needed for tables and detailed panels
  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useDistrictAnalytics(
    hasValidDates ? districtId || null : null,
    effectiveProgramYear?.startDate,
    effectiveEndDate ?? undefined
  )

  // Fetch district statistics for division/area performance cards
  const { data: districtStatistics } = useDistrictStatistics(
    hasValidDates ? districtId || null : null,
    effectiveEndDate ?? undefined,
    'divisions'
  )

  // Fetch performance targets and rankings for overview cards (#183)
  const { data: performanceTargets } = usePerformanceTargets(
    hasValidDates ? districtId || null : null,
    effectiveEndDate ?? undefined
  )

  // Fetch payment trend data for trends tab - fetch 3 years for multi-year comparison
  const { data: paymentsTrendData, isLoading: isLoadingPaymentsTrend } =
    usePaymentsTrend(
      hasValidDates ? districtId || null : null,
      undefined, // Let hook fetch 3 years automatically for comparison
      effectiveEndDate ?? undefined,
      effectiveProgramYear ?? undefined, // Pass selected program year
      performanceTargets ?? null // Pass CDN performance-targets for currentPayments (#183)
    )

  const rawName = selectedDistrict?.name || districtId || ''
  const districtName = /^\d+$/.test(rawName) ? `District ${rawName}` : rawName

  // Get all clubs from analytics
  const allClubs = analytics?.allClubs || []

  // This uses pre-computed data for faster initial load
  // Requirements: 5.1, 5.2
  const overviewData = React.useMemo(() => {
    if (!aggregatedAnalytics) return null

    return {
      // Summary metrics from aggregated endpoint
      totalMembership: aggregatedAnalytics.summary.totalMembership,
      membershipChange: aggregatedAnalytics.summary.membershipChange,
      clubCounts: aggregatedAnalytics.summary.clubCounts,
      distinguishedClubs: aggregatedAnalytics.summary.distinguishedClubs,
      distinguishedProjection:
        aggregatedAnalytics.summary.distinguishedProjection,
      // Trend data from time-series index
      membershipTrend: aggregatedAnalytics.trends.membership,
      // Year-over-year comparison
      yearOverYear: aggregatedAnalytics.yearOverYear,
      // Metadata
      dataSource: aggregatedAnalytics.dataSource,
      computedAt: aggregatedAnalytics.computedAt,
    }
  }, [aggregatedAnalytics])

  // Fetch competitive awards / Distinguished District status (#332)
  const { data: competitiveAwards } = useCompetitiveAwards(
    effectiveEndDate ?? undefined
  )
  const distinguishedDistrictStatus = React.useMemo(() => {
    if (!districtId || !competitiveAwards?.distinguishedDistrict) return null
    return competitiveAwards.distinguishedDistrict[districtId] ?? null
  }, [districtId, competitiveAwards])

  // Extract threshold + officer award results for this district (#333)
  const clubStrengthResult = React.useMemo(() => {
    if (!districtId || !competitiveAwards?.clubStrengthAward) return null
    return (
      competitiveAwards.clubStrengthAward.allDistricts.find(
        d => d.districtId === districtId
      ) ?? null
    )
  }, [districtId, competitiveAwards])

  const leadershipExcellenceResult = React.useMemo(() => {
    if (!districtId || !competitiveAwards?.leadershipExcellenceAward)
      return null
    return (
      competitiveAwards.leadershipExcellenceAward.allDistricts.find(
        d => d.districtId === districtId
      ) ?? null
    )
  }, [districtId, competitiveAwards])

  const officerAwardsResult = React.useMemo(() => {
    if (!districtId || !competitiveAwards?.officerAwards) return null
    return {
      educationTraining:
        competitiveAwards.officerAwards.educationTraining.find(
          d => d.districtId === districtId
        ) ?? null,
      clubGrowth:
        competitiveAwards.officerAwards.clubGrowth.find(
          d => d.districtId === districtId
        ) ?? null,
    }
  }, [districtId, competitiveAwards])

  // Determine if we have data for the overview tab
  // Use aggregated data if available, otherwise fall back to full analytics
  const hasOverviewData = overviewData !== null || analytics !== null

  // Loading state for overview tab - prefer aggregated, but show loading if both are loading
  const isLoadingOverview = isLoadingAggregated && isLoadingAnalytics

  // Error state for overview - only show error if both fail
  const overviewError =
    aggregatedError && analyticsError ? aggregatedError : null

  // Get available dates sorted in descending order (filtered by program year)
  const availableDates = cachedDatesInProgramYear.sort((a, b) =>
    b.localeCompare(a)
  )

  // Sticky KPI strip data (#572). Prefer the usePerformanceTargets CDN
  // hook; fall back to inline analytics so existing snapshots keep
  // working while the targets pipeline is catching up.
  const kpiStripData: DistrictKpiStripData | null = useMemo(() => {
    if (!analytics) return null
    const pt = performanceTargets ?? analytics.performanceTargets
    return {
      paidClubs: {
        current: pt?.paidClubs.current ?? analytics.allClubs.length,
        targets: pt?.paidClubs.targets ?? null,
        rankings: pt?.paidClubs.rankings ?? NULL_RANKINGS,
      },
      membershipPayments: {
        current: pt?.membershipPayments.current ?? analytics.totalMembership,
        targets: pt?.membershipPayments.targets ?? null,
        rankings: pt?.membershipPayments.rankings ?? NULL_RANKINGS,
      },
      distinguishedClubs: {
        current:
          pt?.distinguishedClubs.current ?? analytics.distinguishedClubs.total,
        targets: pt?.distinguishedClubs.targets ?? null,
        rankings: pt?.distinguishedClubs.rankings ?? NULL_RANKINGS,
      },
    }
  }, [analytics, performanceTargets])

  // If districts data has loaded but this district isn't in the tracked list,
  // show a limited page with Global Rankings (available for all districts)
  // instead of blank data. Only 6 districts have detailed per-district analytics.
  if (districtsData && !selectedDistrict && districtId) {
    return (
      <ErrorBoundary>
        <div className="district-detail-page-root">
          <div className="container mx-auto px-4 py-4 sm:py-8">
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-tm-loyal-blue hover:text-tm-loyal-blue-80 font-tm-headline font-medium transition-colors mb-4"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Rankings
              </button>
              <h1 className="text-2xl sm:text-3xl font-tm-headline font-bold text-tm-black">
                {districtName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                District Statistics & Performance Analytics
              </p>
            </div>

            {/* Limited data banner */}
            <div className="bg-tm-happy-yellow bg-opacity-20 border border-tm-happy-yellow rounded-lg p-4 mb-6 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-tm-loyal-blue mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-tm-black">
                  This district has limited data available.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Detailed analytics (clubs, divisions, trends) are not yet
                  tracked for this district. Global rankings are available
                  below.
                </p>
              </div>
            </div>

            {/* Global Rankings tab for untracked districts */}
            <GlobalRankingsTab
              districtId={districtId}
              districtName={districtName}
              selectedProgramYear={selectedProgramYear}
            />
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="district-detail-page-root">
        <div className="district-detail-page">
          {districtId && (
            <DistrictDetailHeader
              districtId={districtId}
              districtName={districtName}
              selectedProgramYear={selectedProgramYear}
              setSelectedProgramYear={setSelectedProgramYear}
              availableProgramYears={availableProgramYears}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              availableDates={availableDates}
              latestSnapshotDate={
                cachedDatesData?.dateRange?.endDate ?? availableDates[0]
              }
            />
          )}

          {/* Lateral section nav (#678, ADR-005 §3). Landing-opt-IN — renders
              on the hub and every flat sub-page (unlike the breadcrumb). */}
          {districtId && <DistrictSubnav districtId={districtId} />}

          {/* Global Error State */}
          {overviewError && (
            <ErrorDisplay
              error={overviewError}
              title="Failed to Load District Data"
              onRetry={() => {
                refetchAggregated()
                refetchAnalytics()
              }}
              showDetails={true}
            />
          )}

          {/* No Data Prompt */}
          {!isLoadingOverview &&
            !overviewError &&
            !hasOverviewData &&
            districtId && (
              <EmptyState
                title="No District Data Available"
                message="This district doesn't have any cached historical data yet. Data will be available after the next pipeline run."
                icon="data"
                action={{
                  label: 'Back to Rankings',
                  onClick: () => {
                    navigate('/')
                  },
                }}
              />
            )}

          {/* Sticky KPI strip (#572). Sits above the narrative so the
              4 numbers stay pinned as the user scrolls; mobile gets a
              collapse chevron. */}
          {districtId && hasOverviewData && (
            <DistrictKpiStrip kpis={kpiStripData} />
          )}

          {/* Narrative content. #571 retired the tab strip; #679 (ADR-005)
              trimmed the hub to a lean Overview — the inline Divisions and
              "Vs world" duplicates and the "On this page" anchor rail were
              removed (DistrictSubnav owns wayfinding at every width). The
              remaining sections scroll as one story, with CTAs at the bottom
              that link out to the dedicated routes. */}
          <div className="space-y-4 sm:space-y-6">
            {districtId && hasOverviewData && (
              <section aria-label="District overview">
                {/* District Overview - Now uses global date selector */}
                {hasValidDates && effectiveProgramYear && (
                  <DistrictOverview
                    districtId={districtId}
                    {...(effectiveEndDate && {
                      selectedDate: effectiveEndDate,
                    })}
                    programYearStartDate={effectiveProgramYear.startDate}
                    performanceTargets={performanceTargets ?? undefined}
                  />
                )}

                {/* Distinguished District Trophy Case (#332) */}
                <DistinguishedDistrictTrophyCase
                  status={distinguishedDistrictStatus}
                  clubStrengthQualifies={clubStrengthResult?.qualifies}
                  clubStrengthGrowth={clubStrengthResult?.growthPercent}
                  leadershipExcellenceQualifies={
                    leadershipExcellenceResult?.qualifies
                  }
                  leadershipExcellenceYears={
                    leadershipExcellenceResult?.consecutiveYears
                  }
                  educationTrainingQualifies={
                    officerAwardsResult?.educationTraining?.qualifies
                  }
                  clubGrowthQualifies={
                    officerAwardsResult?.clubGrowth?.qualifies
                  }
                />

                {/* Notable dates (#551) */}
                <NotableDatesSection
                  clubs={allClubs}
                  {...(districtId !== undefined && { districtId })}
                  {...(effectiveProgramYear?.year !== undefined && {
                    programYearStart: effectiveProgramYear.year,
                  })}
                />

                {/* Longest-serving clubs leaderboard (#449) */}
                <LongestServingClubsLeaderboard
                  clubs={allClubs}
                  {...(districtId !== undefined && { districtId })}
                />
              </section>
            )}

            {/* Trends */}
            <section aria-label="Membership and payment trends">
              {/* Membership Trend Chart */}
              {aggregatedAnalytics ? (
                // #675: charts are already React.lazy code-split; reserve
                // space with a fixed-height div but do NOT gate rendering on
                // viewport intersection (that left below-fold charts stuck on
                // the skeleton in any non-scroll context — see #675).
                <div style={{ minHeight: '400px' }}>
                  <MembershipTrendChart
                    membershipTrend={
                      // #170: prefer time-series monthly data over inline 1-point trend
                      timeSeries?.years[
                        timeSeries.currentProgramYear
                      ]?.dataPoints.map(dp => ({
                        date: dp.date,
                        count: dp.membership,
                      })) ?? aggregatedAnalytics.trends.membership
                    }
                    isLoading={isLoadingAggregated}
                    priorYearTrends={
                      // #238: overlay prior years for YoY comparison
                      timeSeries
                        ? timeSeries.availableYears
                            .filter(y => y !== timeSeries.currentProgramYear)
                            .map(y => ({
                              label: y,
                              data:
                                timeSeries.years[y]?.dataPoints.map(dp => ({
                                  date: dp.date,
                                  count: dp.membership,
                                })) ?? [],
                            }))
                            .filter(yt => yt.data.length > 0)
                        : undefined
                    }
                  />
                </div>
              ) : (
                isLoadingAggregated && (
                  <LoadingSkeleton variant="chart" height="400px" />
                )
              )}

              {/* Membership Payments Chart (#243) */}
              {paymentsTrendData ? (
                <div style={{ minHeight: '450px' }}>
                  <MembershipPaymentsChart
                    paymentsTrend={paymentsTrendData.currentYearTrend}
                    multiYearData={
                      // #243: Build multi-year payment data from time-series CDN
                      // (analytics CDN only has current year payments)
                      timeSeries
                        ? ((): MultiYearPaymentData => {
                            const currentPY = timeSeries.currentProgramYear
                            const currentData =
                              timeSeries.years[currentPY]?.dataPoints.map(
                                dp => ({
                                  date: dp.date,
                                  payments: dp.payments,
                                  programYearDay: calculateProgramYearDay(
                                    dp.date
                                  ),
                                })
                              ) ?? []
                            const previousYears = timeSeries.availableYears
                              .filter(y => y !== currentPY)
                              .map(y => ({
                                label: y,
                                data:
                                  timeSeries.years[y]?.dataPoints.map(dp => ({
                                    date: dp.date,
                                    payments: dp.payments,
                                    programYearDay: calculateProgramYearDay(
                                      dp.date
                                    ),
                                  })) ?? [],
                              }))
                              .filter(yt => yt.data.length > 0)
                            return {
                              currentYear: {
                                label: currentPY,
                                data: currentData,
                              },
                              previousYears,
                            }
                          })()
                        : paymentsTrendData.multiYearData
                    }
                    statistics={
                      // #269: Override YoY when time-series data provides
                      // multi-year payment history (analytics CDN is current-year-only)
                      (() => {
                        const tsYoY = computePaymentYoYFromTimeSeries(
                          timeSeries ?? null
                        )
                        if (tsYoY) {
                          // Use time-series payments for consistency (#319)
                          const tsPayments = getLatestPayments(
                            timeSeries ?? null
                          )
                          return {
                            ...paymentsTrendData.statistics,
                            ...(tsPayments !== null && {
                              currentPayments: tsPayments,
                            }),
                            yearOverYearChange: tsYoY.yearOverYearChange,
                            trendDirection: tsYoY.trendDirection,
                          }
                        }
                        return paymentsTrendData.statistics
                      })()
                    }
                    isLoading={isLoadingPaymentsTrend}
                  />
                </div>
              ) : (
                isLoadingPaymentsTrend && (
                  <LoadingSkeleton variant="chart" height="450px" />
                )
              )}

              {/* Year-Over-Year Comparison */}
              {aggregatedAnalytics ? (
                <div style={{ minHeight: '300px' }}>
                  <YearOverYearComparison
                    {...(computeYearOverYear(timeSeries ?? null) && {
                      yearOverYear: computeYearOverYear(timeSeries ?? null)!,
                    })}
                    currentYear={{
                      // Use time-series membership when available (#319)
                      // to match the membership chart above
                      totalMembership:
                        timeSeries?.currentMembership ??
                        aggregatedAnalytics.summary.totalMembership,
                      distinguishedClubs:
                        aggregatedAnalytics.summary.distinguishedClubs.total,
                      thrivingClubs:
                        aggregatedAnalytics.summary.clubCounts.thriving,
                      totalClubs: aggregatedAnalytics.summary.clubCounts.total,
                    }}
                    isLoading={isLoadingAggregated}
                  />
                </div>
              ) : (
                isLoadingAggregated && (
                  <LoadingSkeleton variant="chart" height="300px" />
                )
              )}
            </section>

            {/* Top clubs */}
            <section aria-label="Top clubs">
              {/* Top Growth Clubs */}
              {analytics && (
                <TopGrowthClubs
                  topGrowthClubs={analytics.topGrowthClubs}
                  topDCPClubs={analytics.allClubs
                    .filter(club => club.dcpGoalsTrend.length > 0)
                    .map(club => ({
                      clubId: club.clubId,
                      clubName: club.clubName,
                      goalsAchieved:
                        club.dcpGoalsTrend[club.dcpGoalsTrend.length - 1]
                          ?.goalsAchieved || 0,
                      ...(club.distinguishedLevel &&
                        [
                          'Smedley',
                          'President',
                          'Select',
                          'Distinguished',
                        ].includes(club.distinguishedLevel) && {
                          distinguishedLevel: club.distinguishedLevel as
                            | 'Smedley'
                            | 'President'
                            | 'Select'
                            | 'Distinguished',
                        }),
                    }))
                    .sort((a, b) => b.goalsAchieved - a.goalsAchieved)
                    .slice(0, 10)}
                  isLoading={isLoadingAnalytics}
                />
              )}
            </section>

            {/* Analytics */}
            <section aria-label="District analytics">
              {/* Education Levels rollup (#426) */}
              {districtStatistics && (
                <EducationLevelsCard
                  totals={extractEducationLevels(districtStatistics)}
                />
              )}
            </section>

            {/* Subview CTAs — replace the retired tab strip. The inline
                Divisions and Vs-world previews moved to their own routes
                (#679, ADR-005); these CTAs are now the only path to them. */}
            {districtId && (
              <nav
                aria-label="District subviews"
                className="flex flex-wrap gap-2 pt-2"
              >
                <Link
                  to={`/district/${districtId}/clubs`}
                  className="inline-flex items-center px-4 py-2 min-h-[44px] rounded-md bg-tm-loyal-blue text-white font-tm-headline font-medium hover:bg-tm-loyal-blue-80"
                >
                  View all clubs →
                </Link>
                <Link
                  to={`/district/${districtId}/divisions`}
                  className="inline-flex items-center px-4 py-2 min-h-[44px] rounded-md border border-tm-loyal-blue text-tm-loyal-blue font-tm-headline font-medium hover:bg-tm-loyal-blue-10"
                >
                  Divisions &amp; areas →
                </Link>
                <Link
                  to={`/district/${districtId}/rankings`}
                  className="inline-flex items-center px-4 py-2 min-h-[44px] rounded-md border border-tm-loyal-blue text-tm-loyal-blue font-tm-headline font-medium hover:bg-tm-loyal-blue-10"
                >
                  Global rankings →
                </Link>
              </nav>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

/**
 * Default export: thin wrapper that intercepts the legacy `?tab=…` URLs
 * (clubs / divisions / globalRankings) and redirects to their new routes
 * BEFORE the heavy DistrictDetailPageInner hooks run. Without this
 * guard, inner effects (date selection, etc.) would race against
 * `<Navigate>` and clobber the new URL's search params after the route
 * transition.
 */
const DistrictDetailPage: React.FC = () => {
  const { districtId } = useParams<{ districtId: string }>()
  const [searchParams] = useSearchParams()
  const legacyTarget = redirectLegacyDistrictTab(
    `http://localhost/district/${districtId ?? ''}?${searchParams.toString()}`,
    districtId
  )
  if (legacyTarget) {
    const [pathname, search = ''] = legacyTarget.split('?') as [string, string?]
    return (
      <Navigate to={{ pathname, search: search ? `?${search}` : '' }} replace />
    )
  }
  return <DistrictDetailPageInner />
}

export default DistrictDetailPage
