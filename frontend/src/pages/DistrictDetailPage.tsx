import React, { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDistricts } from '../hooks/useDistricts'
import { useDistrictAnalytics, ClubTrend } from '../hooks/useDistrictAnalytics'
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
import { ProgramYearSelector } from '../components/ProgramYearSelector'
import {
  getAvailableProgramYears,
  filterDatesByProgramYear,
  getMostRecentDateInProgramYear,
  isDateInProgramYear,
  calculateProgramYearDay,
} from '../utils/programYear'
import type { MultiYearPaymentData } from '../hooks/usePaymentsTrend'
import { formatDisplayDate } from '../utils/dateFormatting'
import {
  parseFilterState,
  serializeFilterState,
  FILTER_URL_PREFIX,
} from '../utils/filterUrlCodec'
import { extractDivisionPerformance } from '../utils/extractDivisionPerformance'
import { DistrictOverview } from '../components/DistrictOverview'
import DataAsOfBanner from '../components/DataAsOfBanner'
import { DistinguishedDistrictTrophyCase } from '../components/DistinguishedDistrictTrophyCase'
import { PaymentCompositionCard } from '../components/PaymentCompositionCard'
import { useCompetitiveAwards } from '../hooks/useCompetitiveAwards'

import { DistinguishedProgressChart } from '../components/DistinguishedProgressChart'
import { ClubsTable } from '../components/ClubsTable'
import {
  LazyMembershipTrendChart as MembershipTrendChart,
  LazyMembershipPaymentsChart as MembershipPaymentsChart,
  LazyYearOverYearComparison as YearOverYearComparison,
} from '../components/LazyCharts'
import { TopGrowthClubs } from '../components/TopGrowthClubs'
import { DivisionPerformanceCards } from '../components/DivisionPerformanceCards'
import { DivisionAreaRecognitionPanel } from '../components/DivisionAreaRecognitionPanel'

import ErrorBoundary from '../components/ErrorBoundary'
import { ErrorDisplay, EmptyState } from '../components/ErrorDisplay'
import { LoadingSkeleton } from '../components/LoadingSkeleton'

import { LazyChart } from '../components/LazyChart'
import GlobalRankingsTab from '../components/GlobalRankingsTab'

type TabType =
  | 'overview'
  | 'clubs'
  | 'divisions'
  | 'trends'
  | 'analytics'
  | 'globalRankings'

/**
 * Helper function to extract distinguished projection value from either
 * a number or an object (backend returns object from /analytics endpoint)
 */
function getDistinguishedProjectionValue(
  projection: number | { projectedDistinguished?: number } | null | undefined
): number {
  if (projection === null || projection === undefined) {
    return 0
  }
  if (typeof projection === 'number') {
    return projection
  }
  return projection.projectedDistinguished ?? 0
}

const DistrictDetailPage: React.FC = () => {
  const { districtId } = useParams<{ districtId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Read active tab from URL params (defaults to 'overview') (#230)
  const VALID_TABS: TabType[] = [
    'overview',
    'clubs',
    'divisions',
    'trends',
    'analytics',
    'globalRankings',
  ]
  const tabParam = searchParams.get('tab') as TabType | null
  const activeTab: TabType =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview'

  const setActiveTab = useCallback(
    (tab: TabType) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (tab === 'overview') {
            next.delete('tab')
          } else {
            next.set('tab', tab)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // Read sort state from URL params (#230)
  const initialSortField = (searchParams.get('sort') ?? undefined) as
    | import('../components/filters/types').SortField
    | undefined
  const initialSortDir =
    (searchParams.get('dir') as 'asc' | 'desc') || undefined

  const handleSortChange = useCallback(
    (field: string, direction: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (field === 'name' && direction === 'asc') {
            // Default sort — remove params to keep URL clean
            next.delete('sort')
            next.delete('dir')
          } else {
            next.set('sort', field)
            next.set('dir', direction)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // Read pagination state from URL params (#272)
  const initialPageRaw = searchParams.get('page')
  const initialPage = initialPageRaw ? parseInt(initialPageRaw, 10) : undefined

  const handlePageChange = useCallback(
    (page: number) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (page === 1) {
            // Default page — remove param to keep URL clean
            next.delete('page')
          } else {
            next.set('page', page.toString())
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // Read initial filter state from URL params (#272)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialFilterState = useMemo(() => parseFilterState(searchParams), [])

  const handleFilterChange = useCallback(
    (state: import('../components/filters/types').FilterState) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          // Remove all existing filter params
          const keysToDelete: string[] = []
          next.forEach((_, key) => {
            if (key.startsWith(FILTER_URL_PREFIX)) keysToDelete.push(key)
          })
          keysToDelete.forEach(key => next.delete(key))
          // Add new filter params
          const serialized = serializeFilterState(state)
          for (const [key, value] of Object.entries(serialized)) {
            next.set(key, value)
          }
          // Reset pagination when filters change
          next.delete('page')
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // Tab scroll-fade detection refs (#86)
  const tabScrollRef = React.useRef<HTMLDivElement>(null)
  const tabNavRef = React.useRef<HTMLDivElement>(null)
  const [isTabScrollableRight, setIsTabScrollableRight] = useState(false)

  React.useEffect(() => {
    const nav = tabNavRef.current
    if (!nav) return

    const checkScroll = () => {
      const canScrollRight =
        nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 1
      setIsTabScrollableRight(canScrollRight)
    }

    checkScroll()
    nav.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)

    return () => {
      nav.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

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
  const { data: districtStatistics, isLoading: isLoadingStatistics } =
    useDistrictStatistics(
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

  // Payment breakdown for this district (#327)
  const paymentBreakdown = React.useMemo(() => {
    if (!districtId || !competitiveAwards?.paymentBreakdown) return null
    return competitiveAwards.paymentBreakdown[districtId] ?? null
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

  // Tab configuration
  const tabs: Array<{ id: TabType; label: string; disabled?: boolean }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'clubs', label: 'Clubs' },
    { id: 'divisions', label: 'Divisions & Areas' },
    { id: 'trends', label: 'Trends' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'globalRankings', label: 'Global Rankings' },
  ]

  // Handle club click — navigate to subpage (#208)
  const handleClubClick = (club: ClubTrend) => {
    navigate(`/district/${districtId}/club/${club.clubId}`)
  }

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedDate(value === 'latest' ? undefined : value)
  }

  // Format date for display (using utility to avoid UTC timezone shift)
  const formatDate = (dateStr: string) => formatDisplayDate(dateStr)

  // If districts data has loaded but this district isn't in the tracked list,
  // show a limited page with Global Rankings (available for all districts)
  // instead of blank data. Only 6 districts have detailed per-district analytics.
  if (districtsData && !selectedDistrict && districtId) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-100">
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
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          {/* Header */}
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-tm-headline font-bold text-tm-black">
                  {districtName}
                </h1>
                <p className="text-sm sm:text-base font-tm-body text-gray-600 mt-1">
                  District Statistics & Performance Analytics
                </p>
              </div>

              {/* Program Year, Date Selector and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
                {/* Program Year Selector */}
                {availableProgramYears.length > 0 && (
                  <div className="flex-shrink-0">
                    <ProgramYearSelector
                      availableProgramYears={availableProgramYears}
                      selectedProgramYear={selectedProgramYear}
                      onProgramYearChange={setSelectedProgramYear}
                      showProgress={true}
                    />
                  </div>
                )}

                {/* Date Selector - Shows only dates in selected program year */}
                {availableDates.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="global-date-selector"
                      className="text-xs sm:text-sm font-tm-body font-medium text-gray-700"
                    >
                      View Specific Date
                    </label>
                    <select
                      id="global-date-selector"
                      value={selectedDate || 'latest'}
                      onChange={handleDateChange}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue focus:border-transparent bg-white text-gray-900 text-sm font-tm-body"
                      style={{ color: 'var(--tm-black)' }}
                    >
                      <option value="latest" className="text-gray-900 bg-white">
                        Latest in Program Year
                      </option>
                      {availableDates.map(date => (
                        <option
                          key={date}
                          value={date}
                          className="text-gray-900 bg-white"
                        >
                          {formatDate(date)}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs font-tm-body text-gray-500">
                      {availableDates.length} date
                      {availableDates.length !== 1 ? 's' : ''} in program year
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
            <div className="border-b border-gray-200">
              <div
                className="tab-scroll-fade"
                ref={tabScrollRef}
                data-scrollable-right={isTabScrollableRight}
              >
                <div
                  className="flex -mb-px overflow-x-auto scrollbar-hide"
                  ref={tabNavRef}
                  role="tablist"
                  aria-label="District analysis tabs"
                >
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => !tab.disabled && setActiveTab(tab.id)}
                      disabled={tab.disabled}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      className={`
                        px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-tm-headline font-medium whitespace-nowrap transition-colors
                        ${
                          activeTab === tab.id
                            ? 'border-b-2 border-tm-loyal-blue text-tm-loyal-blue'
                            : tab.disabled
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-tm-cool-gray'
                        }
                      `}
                    >
                      {tab.label}
                      {tab.disabled && (
                        <span className="ml-2 text-xs font-tm-body text-gray-400">
                          (Coming Soon)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Data freshness banner (#214) */}
          <DataAsOfBanner
            key={selectedDate ?? 'none'}
            selectedDate={selectedDate}
            latestAvailableDate={cachedDatesData?.dateRange?.endDate}
            className="mb-4"
          />

          {/* Global Error State */}
          {overviewError && activeTab === 'overview' && (
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

          {/* Tab Content */}
          <div className="space-y-4 sm:space-y-6">
            {activeTab === 'overview' && districtId && hasOverviewData && (
              <>
                {/* District Overview - Now uses global date selector */}
                {hasValidDates && effectiveProgramYear && (
                  <DistrictOverview
                    districtId={districtId}
                    {...(effectiveEndDate && {
                      selectedDate: effectiveEndDate,
                    })}
                    programYearStartDate={effectiveProgramYear.startDate}
                    performanceTargets={performanceTargets ?? undefined}
                    netMemberChange={
                      // #170: prefer time-series member change (base membership based)
                      timeSeries?.memberChange
                    }
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

                {/* Payment Composition (#327) */}
                {paymentBreakdown && (
                  <PaymentCompositionCard
                    newPayments={paymentBreakdown.newPayments}
                    aprilPayments={paymentBreakdown.aprilPayments}
                    octoberPayments={paymentBreakdown.octoberPayments}
                    latePayments={paymentBreakdown.latePayments}
                    charterPayments={paymentBreakdown.charterPayments}
                    totalPayments={paymentBreakdown.totalPayments}
                  />
                )}

                {/* Distinguished Progress Chart - uses aggregated data for faster load */}
                {/* Falls back to full analytics if aggregated not available */}
                <LazyChart height="300px">
                  <DistinguishedProgressChart
                    distinguishedClubs={
                      overviewData?.distinguishedClubs ??
                      analytics?.distinguishedClubs ?? {
                        smedley: 0,
                        presidents: 0,
                        select: 0,
                        distinguished: 0,
                        total: 0,
                      }
                    }
                    distinguishedProjection={getDistinguishedProjectionValue(
                      overviewData?.distinguishedProjection ??
                        analytics?.distinguishedProjection
                    )}
                    totalClubs={
                      overviewData?.clubCounts.total ??
                      analytics?.allClubs.length ??
                      0
                    }
                    isLoading={isLoadingOverview}
                  />
                </LazyChart>
              </>
            )}

            {activeTab === 'clubs' && districtId && (
              <ClubsTable
                clubs={allClubs}
                districtId={districtId}
                isLoading={isLoadingAnalytics}
                onClubClick={handleClubClick}
                initialSortField={initialSortField}
                initialSortDirection={initialSortDir}
                onSortChange={handleSortChange}
                initialPage={initialPage}
                onPageChange={handlePageChange}
                initialFilterState={initialFilterState}
                onFilterChange={handleFilterChange}
              />
            )}

            {activeTab === 'divisions' && (
              <>
                {/* Division Performance Cards */}
                {districtStatistics ? (
                  <DivisionPerformanceCards
                    districtSnapshot={districtStatistics}
                    isLoading={isLoadingStatistics}
                    snapshotTimestamp={districtStatistics.asOfDate}
                  />
                ) : (
                  isLoadingStatistics && <LoadingSkeleton variant="card" />
                )}

                {/* Division and Area Recognition Panel */}
                {districtStatistics ? (
                  <DivisionAreaRecognitionPanel
                    divisions={extractDivisionPerformance(districtStatistics)}
                    isLoading={isLoadingStatistics}
                  />
                ) : (
                  isLoadingStatistics && (
                    <LoadingSkeleton variant="table" count={3} />
                  )
                )}
              </>
            )}

            {activeTab === 'trends' && (
              <>
                {/* Membership Trend Chart */}
                {aggregatedAnalytics ? (
                  <LazyChart height="400px">
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
                  </LazyChart>
                ) : (
                  isLoadingAggregated && (
                    <LoadingSkeleton variant="chart" height="400px" />
                  )
                )}

                {/* Membership Payments Chart (#243) */}
                {paymentsTrendData ? (
                  <LazyChart height="450px">
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
                  </LazyChart>
                ) : (
                  isLoadingPaymentsTrend && (
                    <LoadingSkeleton variant="chart" height="450px" />
                  )
                )}

                {/* Year-Over-Year Comparison */}
                {aggregatedAnalytics ? (
                  <LazyChart height="300px">
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
                        totalClubs:
                          aggregatedAnalytics.summary.clubCounts.total,
                      }}
                      isLoading={isLoadingAggregated}
                    />
                  </LazyChart>
                ) : (
                  isLoadingAggregated && (
                    <LoadingSkeleton variant="chart" height="300px" />
                  )
                )}
              </>
            )}

            {activeTab === 'analytics' && (
              <>
                {/* Top Growth Clubs */}
                {analytics ? (
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
                ) : (
                  isLoadingAnalytics && <LoadingSkeleton variant="card" />
                )}
              </>
            )}

            {activeTab === 'globalRankings' && districtId && (
              <GlobalRankingsTab
                districtId={districtId}
                districtName={districtName}
                selectedProgramYear={selectedProgramYear}
              />
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default DistrictDetailPage
