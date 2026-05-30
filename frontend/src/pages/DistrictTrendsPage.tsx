import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useDistricts } from '../hooks/useDistricts'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDistrictCachedDates } from '../hooks/useDistrictData'
import { useAggregatedAnalytics } from '../hooks/useAggregatedAnalytics'
import { useTimeSeries } from '../hooks/useTimeSeries'
import { usePerformanceTargets } from '../hooks/usePerformanceTargets'
import { usePaymentsTrend } from '../hooks/usePaymentsTrend'
import type { MultiYearPaymentData } from '../hooks/usePaymentsTrend'
import {
  computeYearOverYear,
  computePaymentYoYFromTimeSeries,
  getLatestPayments,
} from '../hooks/useTimeSeriesYoY'
import { useUrlProgramYear } from '../hooks/useUrlProgramYear'
import {
  getAvailableProgramYears,
  filterDatesByProgramYear,
  getMostRecentDateInProgramYear,
  isDateInProgramYear,
  calculateProgramYearDay,
} from '../utils/programYear'
import { DistrictDetailHeader } from '../components/DistrictDetailHeader'
import { SubpageBreadcrumb } from '../components/SubpageBreadcrumb'
import { DistrictSubnav } from '../components/DistrictSubnav'
import {
  LazyMembershipTrendChart as MembershipTrendChart,
  LazyMembershipPaymentsChart as MembershipPaymentsChart,
  LazyYearOverYearComparison as YearOverYearComparison,
} from '../components/LazyCharts'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import ErrorBoundary from '../components/ErrorBoundary'
import { ChartSparklineExpand } from '../components/ChartSparklineExpand'

/* District Trends Page (#680, epic #674 Sprint 6, ADR-005 §1).
   Dedicated deep-linkable route for the membership / payments / YoY trend
   charts that previously scroll-stacked on the Overview hub. Lifted verbatim
   from DistrictDetailPage so the data wiring (#170 time-series preference,
   #243 multi-year payments, #269/#319 YoY override) is unchanged — only the
   address moved. PY / as-of-date state is URL-synced via useUrlProgramYear,
   so the route is shareable and survives reload + back. */

const DistrictTrendsPage: React.FC = () => {
  const { districtId } = useParams<{ districtId: string }>()

  const {
    selectedProgramYear,
    setSelectedProgramYear,
    selectedDate,
    setSelectedDate,
  } = useUrlProgramYear()

  const { data: districtsData } = useDistricts()
  const selectedDistrict = districtsData?.districts?.find(
    d => d.id === districtId
  )

  const { data: cachedDatesData } = useDistrictCachedDates(districtId || '')
  const allCachedDates = useMemo(
    () => cachedDatesData?.dates || [],
    [cachedDatesData?.dates]
  )
  const availableProgramYears = useMemo(
    () => getAvailableProgramYears(allCachedDates),
    [allCachedDates]
  )

  React.useEffect(() => {
    if (availableProgramYears.length > 0) {
      const has = availableProgramYears.some(
        py => py.year === selectedProgramYear.year
      )
      if (!has) {
        const mostRecent = availableProgramYears[0]
        if (mostRecent) setSelectedProgramYear(mostRecent)
      }
    }
  }, [availableProgramYears, selectedProgramYear.year, setSelectedProgramYear])

  const cachedDatesInProgramYear = useMemo(
    () => filterDatesByProgramYear(allCachedDates, selectedProgramYear),
    [allCachedDates, selectedProgramYear]
  )

  const effectiveProgramYear = useMemo(() => {
    if (availableProgramYears.length === 0) return null
    const has = availableProgramYears.some(
      py => py.year === selectedProgramYear.year
    )
    if (has) return selectedProgramYear
    return availableProgramYears[0] ?? null
  }, [availableProgramYears, selectedProgramYear])

  const effectiveEndDate = useMemo(() => {
    if (!effectiveProgramYear) return null
    if (
      selectedDate &&
      isDateInProgramYear(selectedDate, effectiveProgramYear)
    ) {
      return selectedDate
    }
    const mostRecent = getMostRecentDateInProgramYear(
      allCachedDates,
      effectiveProgramYear
    )
    return mostRecent || effectiveProgramYear.endDate
  }, [selectedDate, effectiveProgramYear, allCachedDates])

  const hasValidDates =
    effectiveProgramYear !== null && effectiveEndDate !== null

  const { data: aggregatedAnalytics, isLoading: isLoadingAggregated } =
    useAggregatedAnalytics(
      hasValidDates ? districtId || null : null,
      effectiveEndDate ?? undefined
    )

  const { data: timeSeries } = useTimeSeries(
    hasValidDates ? districtId || null : null
  )

  const { data: performanceTargets } = usePerformanceTargets(
    hasValidDates ? districtId || null : null,
    effectiveEndDate ?? undefined
  )

  const { data: paymentsTrendData, isLoading: isLoadingPaymentsTrend } =
    usePaymentsTrend(
      hasValidDates ? districtId || null : null,
      undefined,
      effectiveEndDate ?? undefined,
      effectiveProgramYear ?? undefined,
      performanceTargets ?? null
    )

  // #875 (epic #876, CC-3): the membership/payments charts are multi-series
  // Recharts that smear at 375px. Derive the collapsed-mobile sparkline series
  // from the SAME points the charts plot, so the sparkline-then-expand wrapper
  // (ChartSparklineExpand) previews the real trend. Desktop is untouched — the
  // wrapper renders its children verbatim at and above the 768px breakpoint.
  const membershipTrendPoints = useMemo(
    () =>
      timeSeries?.years[timeSeries.currentProgramYear]?.dataPoints.map(dp => ({
        date: dp.date,
        count: dp.membership,
      })) ??
      aggregatedAnalytics?.trends.membership ??
      [],
    [timeSeries, aggregatedAnalytics]
  )
  const membershipSparkline = useMemo(
    () => membershipTrendPoints.map(p => p.count),
    [membershipTrendPoints]
  )
  const latestMembership =
    membershipTrendPoints[membershipTrendPoints.length - 1]?.count ?? null
  const paymentsSparkline = useMemo(
    () => (paymentsTrendData?.currentYearTrend ?? []).map(p => p.payments),
    [paymentsTrendData]
  )
  const latestPayments = paymentsSparkline[paymentsSparkline.length - 1] ?? null

  const rawName = selectedDistrict?.name || districtId || ''
  const districtName = /^\d+$/.test(rawName) ? `District ${rawName}` : rawName
  useDocumentTitle(districtName ? `${districtName} Trends` : null)

  const availableDates = cachedDatesInProgramYear.sort((a, b) =>
    b.localeCompare(a)
  )

  if (!districtId) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="district-detail-page-root">
        <div className="district-detail-page">
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

          <SubpageBreadcrumb
            crumbs={[{ label: districtName, to: `/district/${districtId}` }]}
          />

          <DistrictSubnav districtId={districtId} />

          <section
            aria-label="Membership and payment trends"
            className="space-y-4 sm:space-y-6"
          >
            {/* Membership Trend Chart */}
            {aggregatedAnalytics ? (
              // #675: charts are React.lazy code-split; reserve space with a
              // fixed-height div but do NOT gate rendering on viewport
              // intersection.
              <ChartSparklineExpand
                urlId="membership"
                title="Membership trend"
                sparklineData={membershipSparkline}
                headline={
                  <>
                    {latestMembership !== null
                      ? `${latestMembership.toLocaleString()} members`
                      : 'Membership trend'}
                  </>
                }
              >
                <div style={{ minHeight: '400px' }}>
                  <MembershipTrendChart
                    membershipTrend={membershipTrendPoints}
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
              </ChartSparklineExpand>
            ) : (
              isLoadingAggregated && (
                <LoadingSkeleton variant="chart" height="400px" />
              )
            )}

            {/* Membership Payments Chart (#243) */}
            {paymentsTrendData ? (
              <ChartSparklineExpand
                urlId="payments"
                title="Payments trend"
                sparklineData={paymentsSparkline}
                headline={
                  <>
                    {latestPayments !== null
                      ? `${latestPayments.toLocaleString()} payments`
                      : 'Payments trend'}
                  </>
                }
              >
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
                      // multi-year payment history (analytics CDN is
                      // current-year-only)
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
              </ChartSparklineExpand>
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
                    // Use time-series membership when available (#319) to match
                    // the membership chart above.
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
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default DistrictTrendsPage
