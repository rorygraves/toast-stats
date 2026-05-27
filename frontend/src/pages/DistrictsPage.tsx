import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchCdnSnapshotIndex,
  fetchCdnRankings,
  fetchCdnRankingsForDate,
} from '../services/cdn'
import { useCompetitiveAwards } from '../hooks/useCompetitiveAwards'
import { AwardsRaceSection } from '../components/AwardsRaceSection'
import { LazyHistoricalRankChart as HistoricalRankChart } from '../components/LazyCharts'
import { useUrlProgramYear } from '../hooks/useUrlProgramYear'
import { DataControlsBar } from '../components/DataControlsBar'
import { useRankHistory } from '../hooks/useRankHistory'
import InfoTooltip from '../components/InfoTooltip'
import DistrictTierChip from '../components/DistrictTierChip'
import { DistrictChipAndName } from '../components/DistrictChipAndName'
import { useMyDistrict } from '../hooks/useMyDistrict'
import { usePersistedState } from '../hooks/usePersistedState'
import { useLastVisit } from '../hooks/useLastVisit'
import { LazyComparisonPanel as ComparisonPanel } from '../components/LazyCharts'
import {
  getAvailableProgramYears,
  filterDatesByProgramYear,
  getMostRecentDateInProgramYear,
} from '../utils/programYear'
import { DistrictRanking } from '../types/districts'
import { arrayToCSV, downloadCSV } from '../utils/csvExport'

const DistrictsPage: React.FC = () => {
  const navigate = useNavigate()
  // sortBy persists across visits (#416). Default 'aggregate'.
  const [sortBy, setSortBy] = usePersistedState<
    'aggregate' | 'clubs' | 'payments' | 'distinguished'
  >('districts-sort-by', 'aggregate')
  // Intentionally NOT persisted — search query should reset between visits.
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [pinnedDistrictIds, setPinnedDistrictIds] = useState<Set<string>>(
    new Set()
  )
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchFocused, setSearchFocused] = useState<boolean>(false)
  const { myDistrictId, setMyDistrict, isMyDistrict } = useMyDistrict()

  // '/' keyboard shortcut focuses the search input — but only when no
  // other input is currently focused (don't steal focus while typing).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/') return
      const ae = document.activeElement
      if (
        ae instanceof HTMLInputElement ||
        ae instanceof HTMLTextAreaElement ||
        (ae instanceof HTMLElement && ae.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      searchInputRef.current?.focus()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // selectedRegions persists across visits (#416). Default = all (empty list,
  // which the existing useEffect inflates to all-known-regions on first
  // data render).
  const [selectedRegions, setSelectedRegions] = usePersistedState<string[]>(
    'districts-selected-regions',
    []
  )

  // Use URL-synced program year and date (#272)
  const {
    selectedProgramYear,
    setSelectedProgramYear,
    selectedDate,
    setSelectedDate,
  } = useUrlProgramYear()

  // Historical rank tracking state
  const [selectedRegionsForHistory, setSelectedRegionsForHistory] = useState<
    string[]
  >([])
  // Mobile-friendly collapsible region filters
  const [isHistoryRegionExpanded, setIsHistoryRegionExpanded] = useState(false)

  // Fetch cached dates from CDN snapshot index (#233)
  // Uses the same data source as DistrictDetailPage for consistency
  const { data: cachedDatesData } = useQuery({
    queryKey: ['cached-dates-from-index'],
    queryFn: async () => {
      const index = await fetchCdnSnapshotIndex()
      // Union of all district dates
      const dateSet = new Set<string>()
      for (const dates of Object.values(index)) {
        for (const d of dates) dateSet.add(d)
      }
      return { dates: [...dateSet].sort() }
    },
  })

  const allCachedDates: string[] = React.useMemo(
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
  const cachedDates = React.useMemo(() => {
    return filterDatesByProgramYear(allCachedDates, selectedProgramYear)
  }, [allCachedDates, selectedProgramYear])

  // Auto-select most recent date in program year when program year changes
  React.useEffect(() => {
    if (cachedDates.length > 0 && !selectedDate) {
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
    cachedDates,
    allCachedDates,
    selectedDate,
    setSelectedDate,
  ])

  // Effective date for rankings — most recent date in selected PY (#301)
  const effectiveRankingsDate = React.useMemo(() => {
    if (selectedDate) return selectedDate
    if (cachedDates.length > 0) {
      return [...cachedDates].sort((a, b) => b.localeCompare(a))[0]
    }
    return undefined
  }, [selectedDate, cachedDates])

  // Fetch rankings from CDN — date-aware (#301)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['district-rankings', effectiveRankingsDate ?? 'latest'],
    queryFn: async () => {
      if (effectiveRankingsDate) {
        return fetchCdnRankingsForDate(effectiveRankingsDate)
      }
      const cdnData = await fetchCdnRankings()
      return { rankings: cdnData.rankings, date: cdnData.date }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    placeholderData: prev => prev,
  })

  // Fetch competitive award standings for the same snapshot (#331).
  // isLoading reserves the AwardsRaceSection slot so its late arrival (this
  // query resolves separately from the rankings query above) doesn't shove
  // the toolbar + table down ~286px → CLS (#750).
  const { data: competitiveAwards, isLoading: isLoadingAwards } =
    useCompetitiveAwards(effectiveRankingsDate)

  const rankings: DistrictRanking[] = React.useMemo(
    () => data?.rankings || [],
    [data?.rankings]
  )

  // Global KPI strip totals (#356) — must run unconditionally so it lives
  // at the top of the component, BEFORE the loading/error early returns
  // (rules of hooks).
  const kpiTotals = React.useMemo(() => {
    let paidClubs = 0
    let totalPayments = 0
    let distinguishedClubs = 0
    for (const r of rankings) {
      paidClubs += r.paidClubs ?? 0
      totalPayments += r.totalPayments ?? 0
      distinguishedClubs += r.distinguishedClubs ?? 0
    }
    return {
      paidClubs,
      totalPayments,
      distinguishedClubs,
      tracked: rankings.length,
    }
  }, [rankings])

  // Get district IDs for selected regions
  const selectedDistricts = React.useMemo(() => {
    if (selectedRegionsForHistory.length === 0) return []
    return rankings
      .filter(r => selectedRegionsForHistory.includes(r.region))
      .map(r => r.districtId)
  }, [rankings, selectedRegionsForHistory])

  // Fetch historical rank data for selected districts
  const {
    data: rankHistoryData,
    isLoading: isLoadingRankHistory,
    isError: isErrorRankHistory,
    error: rankHistoryError,
  } = useRankHistory({
    districtIds: selectedDistricts,
    startDate: selectedProgramYear.startDate,
    endDate: selectedProgramYear.endDate,
  })

  // Get unique regions for filter
  const regions = React.useMemo(() => {
    const uniqueRegions = new Set(rankings.map(r => r.region))
    return Array.from(uniqueRegions).sort()
  }, [rankings])

  // Initialize selected regions to all regions when data loads
  React.useEffect(() => {
    if (regions.length > 0 && selectedRegions.length === 0) {
      setSelectedRegions(regions)
    }
  }, [regions, selectedRegions.length])

  // Filter by selected regions
  const filteredRankings = React.useMemo(() => {
    if (selectedRegions.length === 0) {
      return rankings
    }
    return rankings.filter(r => selectedRegions.includes(r.region))
  }, [rankings, selectedRegions])

  // Sort by selected column (before search, so ranks are stable)
  const sortedRankings = React.useMemo(() => {
    const sorted = [...filteredRankings]
    switch (sortBy) {
      case 'clubs':
        return sorted.sort((a, b) => a.clubsRank - b.clubsRank)
      case 'payments':
        return sorted.sort((a, b) => a.paymentsRank - b.paymentsRank)
      case 'distinguished':
        return sorted.sort((a, b) => a.distinguishedRank - b.distinguishedRank)
      default:
        return sorted.sort((a, b) => b.aggregateScore - a.aggregateScore)
    }
  }, [filteredRankings, sortBy])

  // Use overallRank from CDN data — supports ties (#303)
  const rankedRankings = React.useMemo(
    () => sortedRankings.map(d => ({ ...d, displayRank: d.overallRank })),
    [sortedRankings]
  )

  // Filter by search query (district number or name) — rank is preserved
  const filteredRankingsBySearch = React.useMemo(() => {
    if (!searchQuery.trim()) return rankedRankings
    const query = searchQuery.trim().toLowerCase()
    return rankedRankings.filter(
      r =>
        r.districtId.toLowerCase().includes(query) ||
        r.districtName.toLowerCase().includes(query)
    )
  }, [rankedRankings, searchQuery])

  // 'What changed since last visit' diff strip (#418). Compares the
  // current snapshot date + my-district rank to the previous-visit
  // snapshot stored in localStorage.
  const myDistrictCurrentRank = React.useMemo(() => {
    if (!myDistrictId) return null
    const row = rankedRankings.find(r => r.districtId === myDistrictId)
    return row?.displayRank ?? null
  }, [rankedRankings, myDistrictId])

  const { diff: lastVisitDiff, commit: commitLastVisit } = useLastVisit({
    currentDate: data?.date ?? null,
    currentMyRank: myDistrictCurrentRank,
    currentMyDistrictId: myDistrictId,
  })

  // Stamp the current visit forward whenever the snapshot date changes,
  // so the next visit reads it as the previous one. The effect runs once
  // per data load.
  React.useEffect(() => {
    if (data?.date) commitLastVisit()
  }, [data?.date, commitLastVisit])

  // Sticky-pin 'my district' to the top of the rankings table (#417).
  // Reorder ONLY for visual placement; ranks stay correct.
  const displayRankings = React.useMemo(() => {
    if (!myDistrictId) return filteredRankingsBySearch
    const myRow = filteredRankingsBySearch.find(
      r => r.districtId === myDistrictId
    )
    if (!myRow) return filteredRankingsBySearch
    const rest = filteredRankingsBySearch.filter(
      r => r.districtId !== myDistrictId
    )
    return [myRow, ...rest]
  }, [filteredRankingsBySearch, myDistrictId])

  // Type-ahead suggestions for the search bar (#435). Top 5 matches.
  const searchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return []
    return displayRankings.slice(0, 5)
  }, [displayRankings, searchQuery])

  // Show the right-edge scroll-cue ONLY when the rankings table actually
  // overflows to the right. A permanent fade would wash out the right-aligned
  // Score column on desktop, where the full set fits and nothing scrolls — a
  // false affordance over the headline metric. Toggled imperatively (a
  // data-attr on the scroll-wrap, gated in CSS) so scroll/resize don't
  // re-render the whole table. Unlike the regions leaderboard's always-on cue
  // (#689, 19 cols that always scroll), this one is conditional.
  const rankingsScrollRef = useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = rankingsScrollRef.current
    if (!el) return
    const update = () => {
      const moreToRight = el.scrollWidth - el.clientWidth - el.scrollLeft > 1
      el.parentElement?.setAttribute(
        'data-scrollable-right',
        String(moreToRight)
      )
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update)
      ro.observe(el)
    }
    return () => {
      el.removeEventListener('scroll', update)
      ro?.disconnect()
    }
  }, [displayRankings])

  const handleDistrictClick = (districtId: string) => {
    navigate(`/district/${districtId}`)
  }

  // Comparison mode — pin/unpin districts (#93)
  const MAX_PINNED = 3
  const togglePin = (districtId: string) => {
    setPinnedDistrictIds(prev => {
      const next = new Set(prev)
      if (next.has(districtId)) {
        next.delete(districtId)
      } else if (next.size < MAX_PINNED) {
        next.add(districtId)
      }
      return next
    })
  }

  const pinnedDistricts = React.useMemo(
    () => rankings.filter(r => pinnedDistrictIds.has(r.districtId)),
    [rankings, pinnedDistrictIds]
  )

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white'
    if (rank === 2) return 'bg-gray-400 text-white'
    if (rank === 3) return 'bg-amber-600 text-white'
    if (rank <= 10) return 'bg-tm-loyal-blue text-white'
    return 'bg-gray-200 text-gray-700'
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatPercentage = (
    percent: number
  ): { text: string; color: string } => {
    if (percent > 0) {
      return {
        text: `+${percent.toFixed(1)}%`,
        color: 'text-green-600',
      }
    } else if (percent < 0) {
      return {
        text: `${percent.toFixed(1)}%`,
        color: 'text-red-600',
      }
    } else {
      return {
        text: '0.0%',
        color: 'text-gray-600',
      }
    }
  }

  // Handle region selection for historical tracking
  const handleRegionSelection = (region: string) => {
    setSelectedRegionsForHistory(prev => {
      if (prev.includes(region)) {
        return prev.filter(r => r !== region)
      } else {
        return [...prev, region]
      }
    })
  }

  if (isLoading) {
    // #488 — Skeleton must use the SAME outer geometry as the loaded
    // page (districts-page-root > districts-page > districts-page-header
    // > districts-kpi-strip). Swapping a different wrapper (the prior
    // `container mx-auto px-4 py-8`) for the real `.districts-page`
    // wrapper on data-load was the dominant remaining CLS source — CI
    // attributed score 0.1998 to that container alone. The static
    // header text + KPI strip outer dimensions don't depend on the
    // rankings query, so they can render immediately.
    return (
      <div className="districts-page-root">
        <div className="districts-page">
          <div className="districts-page-header">
            <div className="districts-page-header__intro">
              <p className="districts-page-header__eyebrow">
                Program Year {selectedProgramYear.label.replace(/-/g, '–')}
              </p>
              <h1 className="districts-page-header__title">
                District Rankings
              </h1>
              <p className="districts-page-header__lede">
                Compare district performance across paid clubs, payments, and
                distinguished clubs.
              </p>
              <p className="districts-page-header__orientation">
                Each row below is one of the 117 Toastmasters districts
                worldwide. Click a district to drill into its clubs, divisions,
                and trends. Use the search bar (or press <kbd>/</kbd>) to jump
                to a district by number or name. Star (★) a district to keep it
                pinned at the top across visits.
              </p>
            </div>
          </div>
          <div className="districts-kpi-strip" aria-hidden="true">
            {[
              'Paid Clubs · Global',
              'Total Payments',
              'Distinguished Clubs',
              'Districts Tracked',
            ].map(label => (
              <div key={label} className="districts-kpi-card">
                <p className="districts-kpi-card__label">{label}</p>
                <div
                  className="districts-kpi-card__value animate-pulse bg-gray-200 rounded-sm"
                  style={{ height: 30, width: '60%' }}
                />
              </div>
            ))}
          </div>
          <div
            className="animate-pulse"
            role="status"
            aria-label="Loading district rankings"
          >
            <div className="h-20 bg-gray-100 rounded-sm mb-3" />
            <div className="h-12 bg-gray-100 rounded-sm mb-3" />
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    // Check if this is a "no snapshots available" error
    // CDN: fetchCdnRankings throws Error('CDN rankings fetch failed: 404') when v1/rankings.json doesn't exist
    // Express (legacy): error.response.data.error.code === 'NO_SNAPSHOT_AVAILABLE'
    const errorMessage = (error as Error)?.message || ''
    const isCdn404 = errorMessage.includes('CDN rankings fetch failed: 404')
    const legacyResponse = (
      error as Error & {
        response?: {
          data?: {
            error?: {
              code?: string
            }
          }
        }
      }
    )?.response?.data?.error
    const isNoSnapshotError =
      isCdn404 || legacyResponse?.code === 'NO_SNAPSHOT_AVAILABLE'

    if (isNoSnapshotError) {
      return (
        <div className="districts-page-root">
          <div className="container mx-auto px-4 py-8">
            <div
              className="bg-tm-happy-yellow bg-opacity-20 border border-tm-happy-yellow rounded-lg p-8 mx-auto"
              style={{ width: '100%', maxWidth: '42rem' }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-tm-loyal-blue rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-tm-black mb-3">
                  Welcome to Toast-Stats!
                </h2>
                <p className="text-tm-black mb-6 text-lg">
                  No data snapshots are available yet. To get started, you'll
                  need to fetch data from the Toastmasters dashboard.
                </p>

                <div className="bg-white rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold text-tm-black mb-3">
                    What happens next:
                  </h3>
                  <ul className="space-y-2 text-tm-black">
                    <li className="flex items-start">
                      <span className="text-tm-loyal-blue mr-2">1.</span>
                      The data pipeline will automatically collect data from the
                      Toastmasters dashboard
                    </li>
                    <li className="flex items-start">
                      <span className="text-tm-loyal-blue mr-2">2.</span>
                      Once complete, district rankings and analytics will be
                      available
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => refetch()}
                    className="px-6 py-3 text-lg bg-tm-loyal-blue text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                  >
                    Check Again
                  </button>
                </div>

                <p className="text-sm text-tm-cool-gray mt-4">
                  This is a one-time setup. Future visits will show your data
                  immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Handle other types of errors
    return (
      <div className="districts-page-root">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">
              Error Loading Rankings
            </h2>
            <p className="text-red-600">
              {(error as Error)?.message || 'Failed to load district rankings'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="districts-page-root">
      <div className="districts-page">
        {/* Redesigned page header (#356) */}
        <div className="districts-page-header">
          <div className="districts-page-header__intro">
            <p className="districts-page-header__eyebrow">
              Program Year {selectedProgramYear.label.replace(/-/g, '–')}
            </p>
            <h1 className="districts-page-header__title">District Rankings</h1>
            <p className="districts-page-header__lede">
              Compare district performance across paid clubs, payments, and
              distinguished clubs.
            </p>
            {/* Orientation strip (#415) — orients first-time visitors. */}
            <p className="districts-page-header__orientation">
              Each row below is one of the 117 Toastmasters districts worldwide.
              Click a district to drill into its clubs, divisions, and trends.
              Use the search bar (or press <kbd>/</kbd>) to jump to a district
              by number or name. Star (★) a district to keep it pinned at the
              top across visits.
            </p>
            {/* What changed since last visit (#418) — only renders when the
                user has visited before AND the snapshot date has changed.
                Quiet, no dismiss control needed (it self-clears next visit). */}
            {lastVisitDiff.isNewSnapshot && (
              <p
                className="districts-page-header__diff-strip"
                data-testid="last-visit-diff-strip"
              >
                <span aria-hidden="true">📍</span>
                <span>
                  New snapshot since your last visit
                  {lastVisitDiff.previousDate && (
                    <>
                      {' '}
                      (<time>{lastVisitDiff.previousDate}</time>).
                    </>
                  )}
                  {lastVisitDiff.myRankDelta !== null &&
                    lastVisitDiff.myRankDelta !== 0 && (
                      <>
                        {' '}
                        Your district moved{' '}
                        <strong>
                          {lastVisitDiff.myRankDelta > 0
                            ? `up ${lastVisitDiff.myRankDelta}`
                            : `down ${Math.abs(lastVisitDiff.myRankDelta)}`}
                        </strong>{' '}
                        {Math.abs(lastVisitDiff.myRankDelta) === 1
                          ? 'place'
                          : 'places'}
                        .
                      </>
                    )}
                </span>
              </p>
            )}
          </div>
          <div className="districts-page-header__actions">
            <DataControlsBar
              latestSnapshotDate={effectiveRankingsDate}
              availableProgramYears={availableProgramYears}
              selectedProgramYear={selectedProgramYear}
              onProgramYearChange={setSelectedProgramYear}
              availableDates={cachedDates}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
            <button
              type="button"
              className="districts-action-btn"
              onClick={() => {
                const header = [
                  'Rank',
                  'District',
                  'Region',
                  'Paid Clubs',
                  'Total Payments',
                  'Distinguished Clubs',
                  'Aggregate Score',
                ]
                const rows: (string | number)[][] = sortedRankings.map(
                  (r, i) => [
                    i + 1,
                    `D${r.districtId}`,
                    r.region,
                    r.paidClubs,
                    r.totalPayments,
                    r.distinguishedClubs,
                    r.aggregateScore,
                  ]
                )
                const csv = arrayToCSV([header, ...rows])
                const dateLabel = (effectiveRankingsDate ?? 'latest').replace(
                  /[^0-9a-z-]/gi,
                  ''
                )
                downloadCSV(csv, `district-rankings-${dateLabel}.csv`)
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M3 10v3h10v-3M8 2v9M5 8l3 3 3-3" />
              </svg>
              Export CSV
            </button>
            <button
              type="button"
              className="districts-action-btn districts-action-btn--primary"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  void navigator.clipboard.writeText(window.location.href)
                }
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <path d="M8 11.5V3.5M5 6l3-3 3 3M3 13h10" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Global KPI strip (#356, tooltips per #413) */}
        <div className="districts-kpi-strip">
          <div className="districts-kpi-card">
            <p className="districts-kpi-card__label">
              Paid Clubs · Global
              <InfoTooltip text="Sum of paid clubs across every tracked district worldwide. A 'paid club' has met its renewal obligations for the program year." />
            </p>
            <div
              className="districts-kpi-card__value"
              data-testid="kpi-paid-clubs"
            >
              {kpiTotals.paidClubs.toLocaleString()}
            </div>
          </div>
          <div className="districts-kpi-card">
            <p className="districts-kpi-card__label">
              Total Payments
              <InfoTooltip text="Year-to-date membership payment count summed across every tracked district. Members typically pay twice/year so this approximately doubles total membership over a full program year." />
            </p>
            <div
              className="districts-kpi-card__value"
              data-testid="kpi-total-payments"
            >
              {kpiTotals.totalPayments.toLocaleString()}
            </div>
          </div>
          <div className="districts-kpi-card">
            <p className="districts-kpi-card__label">
              Distinguished Clubs
              <InfoTooltip text="Clubs at Distinguished tier or higher (Distinguished / Select / President's / Smedley). See How it works for tier definitions." />
            </p>
            <div
              className="districts-kpi-card__value"
              data-testid="kpi-distinguished-clubs"
            >
              {kpiTotals.distinguishedClubs.toLocaleString()}
            </div>
          </div>
          <div className="districts-kpi-card">
            <p className="districts-kpi-card__label">
              Districts Tracked
              <InfoTooltip text="Number of districts in the current snapshot. Toastmasters has 117 districts worldwide; this counts those with usable data in the most recent rankings file." />
            </p>
            <div
              className="districts-kpi-card__value"
              data-testid="kpi-districts-tracked"
            >
              {kpiTotals.tracked.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Awards Race — competitive district awards (#331) */}
        <AwardsRaceSection
          standings={competitiveAwards ?? null}
          isLoading={isLoadingAwards}
        />

        {/* Sort Controls + Region Filter Toolbar — compact (#83) */}
        <div className="districts-toolbar">
          <div className="districts-toolbar__row">
            <span className="districts-toolbar__label">Sort by:</span>
            <button
              onClick={() => setSortBy('aggregate')}
              className={`districts-toolbar__sort-btn${sortBy === 'aggregate' ? ' districts-toolbar__sort-btn--active' : ''}`}
            >
              Overall Score
            </button>
            <button
              onClick={() => setSortBy('clubs')}
              className={`districts-toolbar__sort-btn${sortBy === 'clubs' ? ' districts-toolbar__sort-btn--active' : ''}`}
            >
              Paid Clubs
            </button>
            <button
              onClick={() => setSortBy('payments')}
              className={`districts-toolbar__sort-btn${sortBy === 'payments' ? ' districts-toolbar__sort-btn--active' : ''}`}
            >
              Total Payments
            </button>
            <button
              onClick={() => setSortBy('distinguished')}
              className={`districts-toolbar__sort-btn${sortBy === 'distinguished' ? ' districts-toolbar__sort-btn--active' : ''}`}
            >
              Distinguished Clubs
            </button>
          </div>

          {/* Region Filter — solo-select pill bar (#434).
              Plain click = solo that region; click again = back to all.
              Shift-click = additive toggle. The "All" pill explicitly
              selects every region and is the active state when no
              filtering is happening. */}
          {(() => {
            const isAllActive =
              regions.length > 0 &&
              (selectedRegions.length === 0 ||
                selectedRegions.length === regions.length)
            const handleRegionClick = (region: string, shiftKey: boolean) => {
              if (shiftKey) {
                setSelectedRegions(
                  selectedRegions.includes(region)
                    ? selectedRegions.filter(r => r !== region)
                    : [...selectedRegions, region]
                )
                return
              }
              const isSoloActive =
                selectedRegions.length === 1 && selectedRegions[0] === region
              setSelectedRegions(isSoloActive ? regions : [region])
            }
            const stateLabel = isAllActive
              ? 'Showing all regions'
              : selectedRegions.length === 1
                ? `Showing region ${selectedRegions[0]} only`
                : `Showing ${selectedRegions.length} of ${regions.length} regions`
            return (
              <div className="districts-toolbar__row">
                <span className="districts-toolbar__label">Regions:</span>
                <button
                  type="button"
                  onClick={() => setSelectedRegions(regions)}
                  className={`districts-toolbar__region-chip${isAllActive ? ' districts-toolbar__region-chip--active' : ''}`}
                  aria-pressed={isAllActive}
                >
                  All
                </button>
                {regions.map(region => {
                  const isActive = selectedRegions.includes(region)
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={e => handleRegionClick(region, e.shiftKey)}
                      className={`districts-toolbar__region-chip${isActive && !isAllActive ? ' districts-toolbar__region-chip--active' : ''}`}
                      aria-pressed={isActive && !isAllActive}
                      aria-label={`Region ${region}`}
                      title="Click to isolate · shift-click to add"
                    >
                      {region}
                    </button>
                  )
                })}
                <span
                  className="districts-toolbar__region-state"
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    marginLeft: 4,
                  }}
                >
                  {stateLabel}
                </span>
              </div>
            )
          })()}
        </div>

        {/* Search Bar — promoted to hero prominence (#435). Larger input,
            type-ahead suggestions, '/' keyboard shortcut. */}
        <div
          className="districts-toolbar__search districts-toolbar__search--hero"
          style={{ marginBottom: 12 }}
        >
          <div className="districts-toolbar__search-icon">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {
              // Delay so click on a suggestion can register before blur hides
              window.setTimeout(() => setSearchFocused(false), 150)
            }}
            placeholder="Search by district number or name… (press /)"
            aria-label="Search districts by number or name"
            aria-controls="district-search-suggestions"
            aria-expanded={searchFocused && searchSuggestions.length > 0}
            className="districts-toolbar__search-input"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 0,
                color: 'var(--ink-3)',
                cursor: 'pointer',
              }}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {searchFocused && searchSuggestions.length > 0 && (
            <ul
              id="district-search-suggestions"
              role="listbox"
              aria-label="District search suggestions"
              className="districts-toolbar__search-suggestions"
            >
              {searchSuggestions.map(s => (
                <li key={s.districtId} role="option" aria-selected={false}>
                  <Link
                    to={`/district/${s.districtId}`}
                    role="option"
                    aria-selected={false}
                    className="districts-toolbar__search-suggestion"
                  >
                    <DistrictChipAndName
                      districtId={s.districtId}
                      name={s.districtName}
                      chipClassName="districts-toolbar__search-suggestion-num"
                      nameClassName="districts-toolbar__search-suggestion-name"
                    />
                    <span className="districts-toolbar__search-suggestion-rank">
                      #{s.displayRank}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Comparison Panel (#93) */}
        <ComparisonPanel
          pinnedDistricts={pinnedDistricts}
          allRankings={rankings}
          totalDistricts={rankings.length}
          onRemove={districtId => togglePin(districtId)}
          onClearAll={() => setPinnedDistrictIds(new Set())}
        />

        {/* Rankings Table */}
        <div className="districts-rankings-table-wrap">
          {/* Methodology affordance — single visible "i" beside a quiet
              "About these metrics" label, replacing the four per-column
              tooltips that used to wrap the header row (#546). Kept
              outside the table so its focus ring is visible to keyboard
              users (Lesson 58 / WCAG 2.4.7). */}
          <div className="flex items-center justify-end mb-2 px-2">
            <span
              data-testid="rankings-table-methodology-affordance"
              className="text-xs text-gray-500 inline-flex items-center"
            >
              About these metrics
              <InfoTooltip text="Paid Clubs = clubs that have met renewal obligations for the program year. Total Payments = year-to-date membership payment count. Distinguished = clubs achieving Distinguished status or higher. Score = Borda-count composite of the three rankings. Higher is better on all four." />
            </span>
          </div>
          {/* Non-trap horizontal scroll (Lesson 105). This is a LEADERBOARD —
              its value is comparing districts across rows — so it keeps the
              table and makes the scroll non-trap rather than card-collapsing
              (which would destroy the comparison; that pattern is right for
              the club table, not this one). Three moves: (1) the scroller is a
              focusable, labelled region (WCAG 2.1.1 / axe
              scrollable-region-focusable); (2) the District identity column is
              the single sticky key column (no hardcoded second-sticky px seam);
              (3) the right-edge scroll-cue signals more columns. Low-priority
              columns hide at tablet/mobile via the __col--tablet/--desktop
              priority classes so a phone shows a sensible set. Don't "fix" this
              into a card collapse. */}
          <div className="districts-rankings-table__scroll-wrap">
            <div
              ref={rankingsScrollRef}
              className="overflow-x-auto"
              role="region"
              tabIndex={0}
              aria-label="District rankings — scroll horizontally to see all metrics"
            >
              <table
                className="districts-rankings-table"
                aria-label="District rankings"
              >
                <caption className="sr-only">
                  District rankings by Paid Clubs, Total Payments, Distinguished
                  club count, and Borda-count Score.
                </caption>
                <thead>
                  <tr>
                    <th className="districts-rankings-table__sticky-col px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="districts-rankings-table__col--desktop px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="districts-rankings-table__col--tablet px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Clubs
                    </th>
                    <th className="districts-rankings-table__col--tablet px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Payments
                    </th>
                    <th className="districts-rankings-table__col--tablet px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distinguished
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayRankings.map(district => {
                    const rank = district.displayRank
                    const isPinned = pinnedDistrictIds.has(district.districtId)
                    const pinDisabled =
                      !isPinned && pinnedDistrictIds.size >= MAX_PINNED
                    const isMine = isMyDistrict(district.districtId)
                    const rawTier =
                      competitiveAwards?.distinguishedDistrict?.[
                        district.districtId
                      ]?.currentTier ?? null
                    // The row-level data-tier hook is only meaningful for
                    // ACHIEVED tiers; CSS rules like [data-tier="Smedley"]
                    // never want to match NotDistinguished. So absence is
                    // the signal there too — same convention as the chip.
                    const ddpTier =
                      rawTier && rawTier !== 'NotDistinguished' ? rawTier : null
                    return (
                      <tr
                        key={district.districtId}
                        data-testid={`district-row-${district.districtId}`}
                        data-tier={ddpTier ?? undefined}
                        onClick={() => handleDistrictClick(district.districtId)}
                        className={`cursor-pointer ${
                          isMine
                            ? 'bg-yellow-50 border-l-4 border-l-tm-loyal-blue'
                            : isPinned
                              ? 'bg-blue-50'
                              : ''
                        }`}
                      >
                        {/* District cell first (#436) — primary entity, and the
                          single sticky key column (#811). The number is a
                          standalone chip so the click affordance reads as
                          interactive. (#417) Star toggles 'my district'.
                          The sticky cell needs an opaque themed background so
                          scrolled columns don't bleed through; data-row-tint
                          lets the CSS repaint the isMine/isPinned tint (token-
                          based, dark-safe — replaces the old hardcoded bg-white
                          that routed to the lighter dark scale, Lesson 116). */}
                        <td
                          data-testid={`district-cell-${district.districtId}`}
                          data-row-tint={
                            isMine ? 'mine' : isPinned ? 'pinned' : 'none'
                          }
                          className="districts-rankings-table__sticky-col px-6 py-4 whitespace-nowrap"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation()
                                setMyDistrict(
                                  isMine ? null : district.districtId
                                )
                              }}
                              aria-label={
                                isMine
                                  ? `Unset District ${district.districtId} as my district`
                                  : `Set District ${district.districtId} as my district`
                              }
                              aria-pressed={isMine}
                              title={
                                isMine
                                  ? 'Click to clear · this district pins to top across visits'
                                  : 'Click to mark as my district · pins to top across visits'
                              }
                              className={`districts-rankings-table__touch-btn flex-shrink-0 inline-flex items-center justify-center rounded transition-colors ${
                                isMine
                                  ? 'text-yellow-500 hover:text-gray-400'
                                  : 'text-gray-300 hover:text-yellow-500'
                              }`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill={isMine ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                            </button>
                            <DistrictChipAndName
                              districtId={district.districtId}
                              name={district.districtName}
                              nameClassName="text-sm font-medium text-gray-900"
                              ariaHidden
                            />
                            {/* Competitive award winner badges (#331) */}
                            {competitiveAwards?.byDistrict?.[
                              district.districtId
                            ]?.extensionIsWinner && (
                              <span
                                title="President's Extension Award winner"
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200"
                              >
                                <span aria-hidden="true">🏆</span>
                                <span className="ml-1">Extension</span>
                              </span>
                            )}
                            {competitiveAwards?.byDistrict?.[
                              district.districtId
                            ]?.twentyPlusIsWinner && (
                              <span
                                title="President's 20-Plus Award winner"
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200"
                              >
                                <span aria-hidden="true">🏆</span>
                                <span className="ml-1">20-Plus</span>
                              </span>
                            )}
                            {competitiveAwards?.byDistrict?.[
                              district.districtId
                            ]?.retentionIsWinner && (
                              <span
                                title="District Club Retention Award winner"
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200"
                              >
                                <span aria-hidden="true">🏆</span>
                                <span className="ml-1">Retention</span>
                              </span>
                            )}
                            {/* Region collapses into the District cell as
                              a quiet "· R<n>" suffix (#546) — saves the
                              standalone Region column's width. */}
                            {district.region && (
                              <span
                                data-testid={`district-region-suffix-${district.districtId}`}
                                className="text-xs text-gray-500"
                              >
                                · R{district.region}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Rank cell — second column (#436). No longer a second
                          sticky column (#811): the old `left-[200px]` magic
                          offset was a fragile px seam (AC #2) and the sticky
                          pair (~380px) alone overflowed a 375px phone. Only the
                          District identity column sticks now; this cell scrolls
                          and inherits the row tint through its transparent bg. */}
                        <td
                          data-testid={`rank-cell-${district.districtId}`}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                togglePin(district.districtId)
                              }}
                              disabled={pinDisabled}
                              aria-label={
                                isPinned
                                  ? `Unpin District ${district.districtId}`
                                  : `Pin District ${district.districtId}`
                              }
                              className={`districts-rankings-table__touch-btn flex-shrink-0 flex items-center justify-center rounded transition-colors ${
                                isPinned
                                  ? 'text-tm-loyal-blue hover:text-red-500'
                                  : pinDisabled
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-tm-loyal-blue'
                              }`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill={isPinned ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                />
                              </svg>
                            </button>
                            <span
                              data-testid={`rank-badge-${district.districtId}`}
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${getRankBadgeColor(rank)}`}
                            >
                              {rank}
                            </span>
                          </div>
                        </td>
                        <td className="districts-rankings-table__col--desktop px-4 py-4 whitespace-nowrap">
                          {ddpTier ? (
                            <DistrictTierChip
                              districtId={district.districtId}
                              tier={ddpTier}
                            />
                          ) : (
                            // Empty Tier cell: the column header "Tier"
                            // already provides context; an aria-label here
                            // would chatter on every NotDistinguished row
                            // (which is the majority).
                            <span
                              className="text-gray-400 text-sm"
                              aria-hidden="true"
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td className="districts-rankings-table__col--tablet px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatNumber(district.paidClubs)}
                          </div>
                          <div className="text-xs flex items-center justify-end gap-1">
                            <span className="text-tm-loyal-blue font-tm-body">
                              #{district.clubsRank}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span
                              className={
                                formatPercentage(district.clubGrowthPercent)
                                  .color
                              }
                            >
                              {
                                formatPercentage(district.clubGrowthPercent)
                                  .text
                              }
                            </span>
                          </div>
                        </td>
                        <td className="districts-rankings-table__col--tablet px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatNumber(district.totalPayments)}
                          </div>
                          <div className="text-xs flex items-center justify-end gap-1">
                            <span className="text-tm-loyal-blue font-tm-body">
                              #{district.paymentsRank}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span
                              className={
                                formatPercentage(district.paymentGrowthPercent)
                                  .color
                              }
                            >
                              {
                                formatPercentage(district.paymentGrowthPercent)
                                  .text
                              }
                            </span>
                          </div>
                        </td>
                        <td className="districts-rankings-table__col--tablet px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatNumber(district.distinguishedClubs)}
                          </div>
                          <div className="text-xs flex items-center justify-end gap-1">
                            <span className="text-tm-loyal-blue font-tm-body">
                              #{district.distinguishedRank}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span
                              className={
                                formatPercentage(district.distinguishedPercent)
                                  .color
                              }
                            >
                              {
                                formatPercentage(district.distinguishedPercent)
                                  .text
                              }
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-tm-loyal-blue font-tm-headline">
                            {formatNumber(Math.round(district.aggregateScore))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Right-edge fade cue — themed (transparent → --surface, remaps in
                dark); pointer-events:none so it never blocks taps/scroll. */}
            <div
              className="districts-rankings-table__scroll-cue"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Historical Rank Progression — collapsed by default (#83) */}
        <details className="bg-white rounded-lg shadow-md mt-4">
          <summary className="cursor-pointer select-none text-lg font-bold text-gray-900 p-4 hover:text-tm-loyal-blue transition-colors">
            Historical Rank Progression
          </summary>
          <div className="px-4 pb-4">
            <p className="text-gray-600 text-sm mb-3">
              Select regions to compare rank progression over time
            </p>

            {/* Region Multi-Select for Historical Tracking */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() =>
                    setIsHistoryRegionExpanded(!isHistoryRegionExpanded)
                  }
                  className="text-sm font-medium text-gray-700 flex items-center gap-2 md:cursor-default"
                  aria-expanded={isHistoryRegionExpanded}
                >
                  Select Regions ({selectedRegionsForHistory.length} regions,{' '}
                  {selectedDistricts.length} districts)
                  <svg
                    className={`w-4 h-4 transition-transform md:hidden ${isHistoryRegionExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {selectedRegionsForHistory.length > 0 && (
                  <button
                    onClick={() => setSelectedRegionsForHistory([])}
                    className="text-sm text-tm-loyal-blue hover:text-tm-loyal-blue-80 font-medium font-tm-body"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              <div
                className={`${isHistoryRegionExpanded ? 'block' : 'hidden'} md:block`}
              >
                <div className="flex flex-wrap gap-2">
                  {regions.map(region => {
                    const isSelected =
                      selectedRegionsForHistory.includes(region)
                    const districtCount = rankings.filter(
                      r => r.region === region
                    ).length
                    return (
                      <button
                        key={region}
                        onClick={() => handleRegionSelection(region)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors font-tm-body ${
                          isSelected
                            ? 'bg-tm-loyal-blue text-white hover:bg-tm-loyal-blue-80'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {region.trim()} ({districtCount})
                      </button>
                    )
                  })}
                </div>
              </div>
              {selectedRegionsForHistory.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing {selectedDistricts.length} districts from{' '}
                  {selectedRegionsForHistory.length} selected region
                  {selectedRegionsForHistory.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Historical Rank Chart */}
            <HistoricalRankChart
              data={rankHistoryData || []}
              isLoading={isLoadingRankHistory}
              isError={isErrorRankHistory}
              error={rankHistoryError}
              selectedProgramYear={selectedProgramYear}
            />
          </div>
        </details>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Scoring Methodology
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
            <div>
              <span className="font-medium text-gray-900">Paid Clubs:</span>{' '}
              Number of clubs with paid memberships
            </div>
            <div>
              <span className="font-medium text-gray-900">Total Payments:</span>{' '}
              Year-to-date membership payments
            </div>
            <div>
              <span className="font-medium text-gray-900">
                Distinguished Clubs:
              </span>{' '}
              Clubs achieving distinguished status
            </div>
          </div>
          <div className="bg-tm-loyal-blue-10 border-l-4 border-tm-loyal-blue p-4 text-sm">
            <p className="font-medium text-tm-loyal-blue mb-2 font-tm-headline">
              Ranking Formula (Borda Count System):
            </p>
            <p className="text-tm-loyal-blue-80 font-tm-body">
              Each district is ranked in three categories: Paid Clubs, Total
              Payments, and Distinguished Clubs. Points are awarded based on
              rank position (higher rank = more points).
            </p>
            <p className="text-tm-loyal-blue-70 mt-2 font-tm-body">
              <strong>Point Allocation:</strong> If there are N districts, rank
              #1 receives N points, rank #2 receives N-1 points, and so on. The{' '}
              <strong>Overall Score</strong> is the sum of points from all three
              categories (higher is better).
            </p>
            <p className="text-tm-loyal-blue-70 mt-2 text-xs font-tm-body">
              Example: With 100 districts, if a district ranks #5 in Paid Clubs
              (96 pts), #3 in Payments (98 pts), and #8 in Distinguished Clubs
              (93 pts), their Overall Score = 96 + 98 + 93 = 287 points
            </p>
          </div>
        </div>

        {/* Forward-pointer to the dedicated methodology page (#356).
            The legacy in-page Scoring Methodology block above stays as
            the canonical explainer until #368 ships real /methodology
            content; #369 will remove the duplication. */}
        <div className="districts-methodology-callout">
          Definitions, refresh cadence, and known caveats live on the{' '}
          <a
            href="/methodology"
            className="districts-methodology-callout__link"
          >
            Methodology
          </a>{' '}
          page.
        </div>
      </div>
    </div>
  )
}

export default DistrictsPage
