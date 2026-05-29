import React, { useCallback, useMemo } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { useDistricts } from '../hooks/useDistricts'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDistrictAnalytics, ClubTrend } from '../hooks/useDistrictAnalytics'
import { useDistrictCachedDates } from '../hooks/useDistrictData'
import { previousRecordedDate, useSnapshotDiff } from '../hooks/useSnapshotDiff'
import { useUrlProgramYear } from '../hooks/useUrlProgramYear'
import {
  getAvailableProgramYears,
  filterDatesByProgramYear,
  getMostRecentDateInProgramYear,
  isDateInProgramYear,
} from '../utils/programYear'
import { DistrictDetailHeader } from '../components/DistrictDetailHeader'
import { SubpageBreadcrumb } from '../components/SubpageBreadcrumb'
import { DistrictSubnav } from '../components/DistrictSubnav'
import { ClubsTable } from '../components/ClubsTable'
import { ProspectiveClubsPanel } from '../components/ProspectiveClubsPanel'
import ErrorBoundary from '../components/ErrorBoundary'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import type { SortDirection, SortField } from '../components/filters/types'
import type { FilterState } from '../components/filters/types'
import {
  paramsToFilterState,
  filterStateToParams,
  FILTER_PARAM_KEYS,
} from '../utils/clubFilterUrl'

/* District Clubs Page (#570, epic #568 Phase 2; URL-sync generalised #817).
   Dedicated route for the clubs subview. URL params (clean spec):
     ?status=<thriving|vulnerable|intervention>   (health band)
     ?search=<q>                                   (club name)
     ?sort=<field>&dir=<asc|desc>                  (sort)
     ?<column>=<value>                             (every other filter, #817)
   Since #817 EVERY filterable column round-trips through the URL (numeric as
   `min..max`, categorical comma-joined) via `clubFilterUrl` — so a filtered
   club list is shareable/bookmarkable, not just the status/search subset.
   Pagination was removed in #667 (epic #665) — all clubs render in one
   sticky-header scroll container, so there is no `?page=` param. A stale
   legacy `?page=` is harmless (ignored on load; the legacy `?tab=clubs`
   redirect strips it). The router-level redirect from the legacy `?tab=clubs`
   URL lives in App.tsx and translates `f_status`/`f_name` into the new names. */

const DistrictClubsPage: React.FC = () => {
  const { districtId } = useParams<{ districtId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Sort URL state -- mirrors DistrictDetailPage's conventions so sort
  // field names line up with ClubsTable's existing SortField union.
  // (No page state since #667 — pagination was removed.)
  const initialSortField = (searchParams.get('sort') ?? undefined) as
    | SortField
    | undefined
  const initialSortDir =
    (searchParams.get('dir') as SortDirection | null) || undefined

  const initialFilterState = useMemo(
    () => paramsToFilterState(searchParams),
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

  const handleFilterChange = useCallback(
    (state: FilterState) => {
      // Wholesale reconcile: drop EVERY filter param this module owns, then set
      // the ones present in `state`. Reconciling the full set (rather than
      // incrementally set/delete one key) sidesteps the same-batch prev-snapshot
      // race in lesson 070 — the result is the same regardless of write order —
      // and leaves reserved params (py/date/sort/dir) untouched.
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          for (const key of FILTER_PARAM_KEYS) next.delete(key)
          for (const [key, value] of filterStateToParams(state))
            next.set(key, value)
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

  // Default snapshot-diff pair = (previous recorded date → latest recorded
  // date) for this district (#795, epic #821 Sprint 3). The diff feeds the
  // opt-in "Changes" column group ON the clubs table — independent of the
  // dedicated "What Changed" page (`/district/:id/changes`), which owns its
  // own URL-synced arbitrary date pair (#794). The pair is owned here and
  // passed as props (R3 — never re-derive from response data). When fewer
  // than two snapshots exist the hook is disabled (`enabled: !!from && !!to`)
  // and ClubsTable gets `snapshotDiff: undefined` — the Changes group simply
  // doesn't surface, matching the same precondition the changes page uses.
  const sortedRecordedDates = useMemo(
    () => [...allCachedDates].sort((a, b) => a.localeCompare(b)),
    [allCachedDates]
  )
  const defaultDiffPair = useMemo(
    () => previousRecordedDate(sortedRecordedDates),
    [sortedRecordedDates]
  )
  const { data: snapshotDiff } = useSnapshotDiff(
    districtId,
    defaultDiffPair?.from,
    defaultDiffPair?.to
  )

  const rawName = selectedDistrict?.name || districtId || ''
  const districtName = /^\d+$/.test(rawName) ? `District ${rawName}` : rawName
  useDocumentTitle(districtName ? `${districtName} Clubs` : null)

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

          <DistrictSubnav districtId={districtId} />

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
                  clubLinkState={{ fromClubsSearch: location.search }}
                  initialSortField={initialSortField}
                  initialSortDirection={initialSortDir}
                  onSortChange={handleSortChange}
                  initialFilterState={initialFilterState}
                  onFilterChange={handleFilterChange}
                  snapshotDiff={snapshotDiff}
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
