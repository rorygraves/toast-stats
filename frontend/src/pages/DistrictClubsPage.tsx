import React, { useCallback, useMemo } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { useDistricts } from '../hooks/useDistricts'
import { useDistrictAnalytics, ClubTrend } from '../hooks/useDistrictAnalytics'
import { useDistrictCachedDates } from '../hooks/useDistrictData'
import { useUrlProgramYear } from '../hooks/useUrlProgramYear'
import {
  getAvailableProgramYears,
  filterDatesByProgramYear,
  getMostRecentDateInProgramYear,
  isDateInProgramYear,
} from '../utils/programYear'
import { DistrictDetailHeader } from '../components/DistrictDetailHeader'
import { SubpageBreadcrumb } from '../components/SubpageBreadcrumb'
import { ClubsTable } from '../components/ClubsTable'
import { ProspectiveClubsPanel } from '../components/ProspectiveClubsPanel'
import ErrorBoundary from '../components/ErrorBoundary'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import type {
  FilterState,
  SortDirection,
  SortField,
} from '../components/filters/types'

/* District Clubs Page (#570, epic #568 Phase 2).
   Dedicated route for the clubs subview. URL params (clean spec):
     ?status=<thriving|vulnerable|intervention>
     ?search=<q>
     ?sort=<field>&dir=<asc|desc>
     ?page=<n>
   Other column filters (Distinguished, Members range, etc.) stay
   in-session — they're discoverable through the table UI but no
   longer survive a reload. The router-level redirect from the legacy
   `?tab=clubs` URL lives in App.tsx and translates `f_status`/`f_name`
   into the new names. */

const statusUrlToInternal = (raw: string | null): string | null => {
  switch (raw) {
    case 'thriving':
    case 'vulnerable':
      return raw
    case 'intervention':
      return 'intervention-required'
    default:
      return null
  }
}

const statusInternalToUrl = (raw: string): string | null => {
  if (raw === 'thriving' || raw === 'vulnerable') return raw
  if (raw === 'intervention-required') return 'intervention'
  return null
}

const buildFilterStateFromUrl = (params: URLSearchParams): FilterState => {
  const state: FilterState = {}
  const status = statusUrlToInternal(params.get('status'))
  if (status) {
    state['status'] = {
      field: 'status',
      type: 'categorical',
      value: [status],
      operator: 'in',
    }
  }
  const search = params.get('search')
  if (search) {
    state['name'] = {
      field: 'name',
      type: 'text',
      value: search,
      operator: 'contains',
    }
  }
  return state
}

const filterStateToUrlPatch = (
  state: FilterState
): { status: string | null; search: string | null } => {
  const statusFilter = state['status']
  let status: string | null = null
  if (statusFilter && Array.isArray(statusFilter.value)) {
    const values = statusFilter.value as string[]
    if (values.length === 1 && values[0]) {
      status = statusInternalToUrl(values[0])
    }
  }
  const nameFilter = state['name']
  const search =
    nameFilter && typeof nameFilter.value === 'string' && nameFilter.value
      ? (nameFilter.value as string)
      : null
  return { status, search }
}

const DistrictClubsPage: React.FC = () => {
  const { districtId } = useParams<{ districtId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Sort / page URL state -- mirrors DistrictDetailPage's conventions so
  // sort field names line up with ClubsTable's existing SortField union.
  const initialSortField = (searchParams.get('sort') ?? undefined) as
    | SortField
    | undefined
  const initialSortDir =
    (searchParams.get('dir') as SortDirection | null) || undefined
  const initialPageRaw = searchParams.get('page')
  const initialPage = initialPageRaw ? parseInt(initialPageRaw, 10) : undefined

  const initialFilterState = useMemo(
    () => buildFilterStateFromUrl(searchParams),
    // Intentionally only computed once on mount — URL is the source of
    // truth for INITIAL state; later updates flow through callbacks
    // instead of re-reading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleSortChange = useCallback(
    (field: string, direction: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (field === 'name' && direction === 'asc') {
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

  const handlePageChange = useCallback(
    (page: number) => {
      // Bail when there's nothing to write: ClubsTable's auto-reset to
      // page 1 on filter change fires onPageChange in the same React
      // batch as the filter update. Both setSearchParams(prev => …)
      // calls see the SAME stale `prev` snapshot, so the second call
      // would clobber the first (status=vulnerable would disappear).
      // Skipping the no-op write keeps the filter URL intact.
      if (page === 1 && !searchParams.has('page')) return
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (page === 1) {
            next.delete('page')
          } else {
            next.set('page', page.toString())
          }
          return next
        },
        { replace: true }
      )
    },
    [searchParams, setSearchParams]
  )

  const handleFilterChange = useCallback(
    (state: FilterState) => {
      const patch = filterStateToUrlPatch(state)
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (patch.status) {
            next.set('status', patch.status)
          } else {
            next.delete('status')
          }
          if (patch.search) {
            next.set('search', patch.search)
          } else {
            next.delete('search')
          }
          // Reset pagination when filters change.
          next.delete('page')
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // Program-year + date wiring (matches DistrictDetailPage so the header
  // controls behave the same way across the two routes).
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

  const { data: analytics, isLoading } = useDistrictAnalytics(
    hasValidDates ? districtId || null : null,
    effectiveProgramYear?.startDate,
    effectiveEndDate ?? undefined
  )

  const allClubs = analytics?.allClubs || []

  const rawName = selectedDistrict?.name || districtId || ''
  const districtName = /^\d+$/.test(rawName) ? `District ${rawName}` : rawName

  const availableDates = cachedDatesInProgramYear.sort((a, b) =>
    b.localeCompare(a)
  )

  const handleClubClick = useCallback(
    (club: ClubTrend) => {
      // #577 — carry the current filter/search so the club page's "Clubs"
      // breadcrumb can round-trip back to this exact filtered list.
      navigate(`/district/${districtId}/club/${club.clubId}`, {
        state: { fromClubsSearch: location.search },
      })
    },
    [navigate, districtId, location.search]
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

          <div className="space-y-4 sm:space-y-6">
            {isLoading && allClubs.length === 0 ? (
              <LoadingSkeleton variant="table" count={6} />
            ) : (
              <>
                <ClubsTable
                  clubs={allClubs}
                  districtId={districtId}
                  isLoading={isLoading}
                  onClubClick={handleClubClick}
                  initialSortField={initialSortField}
                  initialSortDirection={initialSortDir}
                  onSortChange={handleSortChange}
                  initialPage={initialPage}
                  onPageChange={handlePageChange}
                  initialFilterState={initialFilterState}
                  onFilterChange={handleFilterChange}
                />
                <ProspectiveClubsPanel clubs={analytics?.prospectiveClubs} />
              </>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default DistrictClubsPage
