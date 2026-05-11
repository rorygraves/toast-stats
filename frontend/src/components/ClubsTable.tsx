import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { ClubTrend } from '../hooks/useDistrictAnalytics'
import type { ClubHealthStatus } from '../hooks/useDistrictAnalytics'
import { ExportButton } from './ExportButton'
import { exportClubPerformance } from '../utils/csvExport'
import { LoadingSkeleton } from './LoadingSkeleton'
import { isProvisionallyDistinguished } from '../utils/provisionalDistinguished'
import { EmptyState } from './ErrorDisplay'
import { usePagination } from '../hooks/usePagination'
import { Pagination } from './Pagination'
import { useColumnFilters } from '../hooks/useColumnFilters'
import { ColumnHeader } from './ColumnHeader'
import { SortField, SortDirection, COLUMN_CONFIGS } from './filters/types'
import { CLOSE_TO_DISTINGUISHED_MAX_MEMBERS } from '../utils/closeToDistinguished'
import ClubCard from './ClubCard'
import { useIsMobile } from '../hooks/useIsMobile'

/**
 * Props for the ClubsTable component
 */
interface ClubsTableProps {
  /** Array of club trends to display in the table */
  clubs: ClubTrend[]
  /** District ID for export functionality */
  districtId: string
  /** Whether the data is currently loading */
  isLoading?: boolean
  /** Optional callback when a club row is clicked */
  onClubClick?: (club: ClubTrend) => void
  /** Initial sort field from URL params (#230) */
  initialSortField?: SortField | undefined
  /** Initial sort direction from URL params (#230) */
  initialSortDirection?: SortDirection | undefined
  /** Callback when sort changes — for URL param sync (#230) */
  onSortChange?:
    | ((field: SortField, direction: SortDirection) => void)
    | undefined
  /** Initial page from URL params (#272) */
  initialPage?: number | undefined
  /** Callback when page changes — for URL param sync (#272) */
  onPageChange?: ((page: number) => void) | undefined
  /** Initial filter state from URL params (#272) */
  initialFilterState?: import('./filters/types').FilterState | undefined
  /** Callback when filters change — for URL param sync (#272) */
  onFilterChange?:
    | ((state: import('./filters/types').FilterState) => void)
    | undefined
}

/**
 * ClubsTable Component
 *
 * Displays a comprehensive, sortable, and filterable table of all clubs in a district.
 * The table provides rich functionality for analyzing club performance at a glance.
 *
 * Features:
 * - Individual column filtering with different filter types (text, numeric, categorical)
 * - Multi-column sorting with visual indicators
 * - Color-coded rows based on club health status
 * - Pagination for large club lists (25 clubs per page)
 * - CSV export functionality
 * - Click-through to detailed club view
 * - Loading skeletons and empty states
 * - Clear all filters functionality
 *
 * Performance Optimizations:
 * - Debounced text filtering (300ms) to reduce re-renders
 * - Memoized filtering and sorting
 * - Pagination to limit DOM nodes
 *
 * @component
 * @example
 * ```tsx
 * <ClubsTable
 *   clubs={allClubs}
 *   districtId="123"
 *   isLoading={false}
 *   onClubClick={(club) => showClubDetails(club)}
 * />
 * ```
 */
export const ClubsTable: React.FC<ClubsTableProps> = ({
  clubs,
  districtId,
  isLoading = false,
  onClubClick,
  initialSortField,
  initialSortDirection,
  onSortChange,
  initialPage,
  onPageChange,
  initialFilterState,
  onFilterChange,
}) => {
  const [sortField, setSortField] = useState<SortField>(
    initialSortField ?? 'name'
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    initialSortDirection ?? 'asc'
  )
  const isMobile = useIsMobile(768)

  // Use column filters hook with optional URL-initialized state (#272)
  const {
    filteredClubs,
    filterState,
    setFilter: setFilterInternal,
    clearAllFilters: clearAllFiltersInternal,
    getFilter,
    hasActiveFilters,
    activeFilterCount,
  } = useColumnFilters(clubs, initialFilterState)

  // Wrap setFilter to notify parent of changes for URL sync
  const setFilter = useCallback(
    (
      field: SortField,
      filter: import('./filters/types').ColumnFilter | null
    ) => {
      setFilterInternal(field, filter)
      // Notify after state update via microtask
      if (onFilterChange) {
        const next = { ...filterState, [field]: filter }
        if (!filter) delete next[field]
        onFilterChange(next)
      }
    },
    [setFilterInternal, onFilterChange, filterState]
  )

  const clearAllFilters = useCallback(() => {
    clearAllFiltersInternal()
    onFilterChange?.({})
  }, [clearAllFiltersInternal, onFilterChange])

  // Quick-filter chip active flags — derived once per render from filterState.
  // The membersNeeded filter is shared by two chips that interpret different
  // ranges (#433 close-to-distinguished = [1, 4]; needs-members = [2, ∞)).
  //
  // NOTE: this chip uses `membersNeeded` (computeMembersToDistinguished —
  // qualification-aware, includes Goal 7/8 paths), while ClubDetailPage's
  // banner uses `gap.members` (raw tier gap). They share the numeric ≤4
  // bound but are not perfectly equivalent — a club can appear in this
  // chip's filtered results without firing the banner on its detail page
  // (e.g. goalsAchieved=4 with a Goal-7 path) and vice versa.
  const membersNeededValue = (() => {
    const f = getFilter('membersNeeded')
    return Array.isArray(f?.value) ? f.value : null
  })()
  const isCloseToDistinguishedActive =
    membersNeededValue?.[0] === 1 &&
    membersNeededValue?.[1] === CLOSE_TO_DISTINGUISHED_MAX_MEMBERS
  const isNeedsMembersActive =
    membersNeededValue?.[0] === 2 && membersNeededValue?.[1] === null

  // Get status badge styling
  const getStatusBadge = (
    status: 'thriving' | 'vulnerable' | 'intervention-required'
  ) => {
    switch (status) {
      case 'intervention-required':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'vulnerable':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-green-100 text-green-800 border-green-300'
    }
  }

  // Get row background color based on status
  const getRowColor = (
    status: 'thriving' | 'vulnerable' | 'intervention-required'
  ) => {
    switch (status) {
      case 'intervention-required':
        return 'bg-red-50 hover:bg-red-100'
      case 'vulnerable':
        return 'bg-yellow-50 hover:bg-yellow-100'
      default:
        return 'bg-white hover:bg-gray-50'
    }
  }

  // Get display label for status
  const getStatusLabel = (
    status: 'thriving' | 'vulnerable' | 'intervention-required'
  ) => {
    switch (status) {
      case 'intervention-required':
        return 'Intervention Required'
      case 'vulnerable':
        return 'Vulnerable'
      default:
        return 'Thriving'
    }
  }

  // Sort the filtered clubs
  const sortedClubs = useMemo(() => {
    const sorted = [...filteredClubs].sort((a, b) => {
      let aValue: string | number | undefined
      let bValue: string | number | undefined

      switch (sortField) {
        case 'name':
          aValue = a.clubName.toLowerCase()
          bValue = b.clubName.toLowerCase()
          break
        case 'membership':
          aValue = a.latestMembership
          bValue = b.latestMembership
          break
        case 'dcpGoals':
          aValue = a.latestDcpGoals
          bValue = b.latestDcpGoals
          break
        case 'status': {
          const statusOrder: Record<ClubHealthStatus, number> = {
            'intervention-required': 0,
            vulnerable: 1,
            thriving: 2,
          }
          aValue = statusOrder[a.currentStatus]
          bValue = statusOrder[b.currentStatus]
          break
        }
        case 'division':
          aValue = a.divisionName.toLowerCase()
          bValue = b.divisionName.toLowerCase()
          break
        case 'area':
          aValue = a.areaName.toLowerCase()
          bValue = b.areaName.toLowerCase()
          break
        case 'distinguished': {
          // Use the custom sort order for Distinguished column
          aValue = a.distinguishedOrder
          bValue = b.distinguishedOrder
          break
        }
        case 'octoberRenewals':
          aValue = a.octoberRenewals
          bValue = b.octoberRenewals
          break
        case 'aprilRenewals':
          aValue = a.aprilRenewals
          bValue = b.aprilRenewals
          break
        case 'newMembers':
          aValue = a.newMembers
          bValue = b.newMembers
          break
        case 'membersNeeded':
          aValue = a.membersNeeded
          bValue = b.membersNeeded
          break
        case 'clubStatus':
          aValue = a.clubStatus?.toLowerCase()
          bValue = b.clubStatus?.toLowerCase()
          break
        default:
          return 0
      }

      // Handle undefined values - treat as lowest value (sort to end)
      const aIsUndefined = aValue === undefined
      const bIsUndefined = bValue === undefined

      if (aIsUndefined && bIsUndefined) {
        // Both undefined - use secondary sort by club name
        return a.clubName.toLowerCase().localeCompare(b.clubName.toLowerCase())
      }
      if (aIsUndefined) {
        // a is undefined, sort to end regardless of direction
        return 1
      }
      if (bIsUndefined) {
        // b is undefined, sort to end regardless of direction
        return -1
      }

      // Both values are defined - compare normally
      // TypeScript needs explicit assertion after undefined checks
      const aVal = aValue as string | number
      const bVal = bValue as string | number
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1

      // Equal values - use secondary sort by club name
      return a.clubName.toLowerCase().localeCompare(b.clubName.toLowerCase())
    })

    return sorted
  }, [filteredClubs, sortField, sortDirection])

  // Pagination for large club lists
  const pagination = usePagination({
    items: sortedClubs,
    itemsPerPage: 25,
  })

  // Sync initial page from URL params (#272)
  const initialPageApplied = React.useRef(false)
  useEffect(() => {
    if (initialPage && initialPage > 1 && !initialPageApplied.current) {
      pagination.goToPage(initialPage)
      initialPageApplied.current = true
    }
  }, [initialPage, pagination.goToPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wrap goToPage to notify parent of page changes (#272)
  const handleGoToPage = React.useCallback(
    (page: number) => {
      pagination.goToPage(page)
      onPageChange?.(page)
    },
    [pagination.goToPage, onPageChange] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Reset pagination to page 1 when filtered results change
  const isInitialLoad = React.useRef(true)
  useEffect(() => {
    // If going from 0 -> N clubs on initial load, don't reset pagination
    // This allows URL sync (e.g. from Back button) to restore page correctly
    if (isInitialLoad.current && filteredClubs.length > 0) {
      isInitialLoad.current = false
      return
    }

    if (!isInitialLoad.current) {
      pagination.goToPage(1)
      onPageChange?.(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredClubs.length, pagination.goToPage]) // Intentionally excluding 'pagination' to avoid infinite loop

  // Handle sort
  const handleSort = (field: SortField) => {
    let newField = sortField
    let newDirection = sortDirection
    if (sortField === field) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
      setSortDirection(newDirection)
    } else {
      newField = field
      newDirection = 'asc'
      setSortField(newField)
      setSortDirection(newDirection)
    }
    onSortChange?.(newField, newDirection)
  }

  return (
    <div className="redesign-panel">
      {/* Header with Export and Results Count */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 font-tm-headline">
            All Clubs
          </h3>
          <ExportButton
            onExport={() =>
              exportClubPerformance(
                sortedClubs.map(club => ({
                  clubId: club.clubId,
                  clubName: club.clubName,
                  divisionName: club.divisionName,
                  areaName: club.areaName,
                  membershipTrend: club.membershipTrend,
                  dcpGoalsTrend: club.dcpGoalsTrend,
                  currentStatus: club.currentStatus,
                  distinguishedLevel: club.distinguishedLevel,
                  riskFactors: club.riskFactors,
                  octoberRenewals: club.octoberRenewals,
                  aprilRenewals: club.aprilRenewals,
                  newMembers: club.newMembers,
                })),
                districtId
              )
            }
            label="Export Clubs"
            disabled={sortedClubs.length === 0}
          />
        </div>

        {/* Results Count and Quick Filters */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div>
            {sortedClubs.length === clubs.length ? (
              <>Total: {clubs.length} clubs</>
            ) : (
              <>
                Showing {sortedClubs.length} of {clubs.length} clubs
              </>
            )}
          </div>

          {/* Status segmented filter (#361) — All / Thriving / Vulnerable
              / Intervention with counts, per design mockup. Sits above the
              quick-filter chips so users can narrow by club health first,
              then refine. */}
          {(() => {
            const statusFilter = getFilter('status')
            const activeStatuses =
              statusFilter && Array.isArray(statusFilter.value)
                ? (statusFilter.value as string[])
                : []
            const isActive = (status: string) =>
              activeStatuses.length === 1 && activeStatuses[0] === status
            const isAllActive = activeStatuses.length === 0
            const counts = {
              all: clubs.length,
              thriving: clubs.filter(c => c.currentStatus === 'thriving')
                .length,
              vulnerable: clubs.filter(c => c.currentStatus === 'vulnerable')
                .length,
              intervention: clubs.filter(
                c => c.currentStatus === 'intervention-required'
              ).length,
            }
            const setStatus = (status: string | null) => {
              if (status === null) {
                setFilter('status', null)
              } else {
                setFilter('status', {
                  field: 'status',
                  type: 'categorical',
                  value: [status],
                })
              }
            }
            return (
              <div
                className="clubs-status-segmented"
                role="tablist"
                aria-label="Filter clubs by health status"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isAllActive}
                  onClick={() => setStatus(null)}
                  className={
                    'clubs-status-segmented__btn' +
                    (isAllActive ? ' clubs-status-segmented__btn--active' : '')
                  }
                >
                  All{' '}
                  <span className="clubs-status-segmented__count">
                    {counts.all}
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive('thriving')}
                  onClick={() =>
                    setStatus(isActive('thriving') ? null : 'thriving')
                  }
                  className={
                    'clubs-status-segmented__btn' +
                    (isActive('thriving')
                      ? ' clubs-status-segmented__btn--active'
                      : '')
                  }
                >
                  Thriving{' '}
                  <span className="clubs-status-segmented__count">
                    {counts.thriving}
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive('vulnerable')}
                  onClick={() =>
                    setStatus(isActive('vulnerable') ? null : 'vulnerable')
                  }
                  className={
                    'clubs-status-segmented__btn' +
                    (isActive('vulnerable')
                      ? ' clubs-status-segmented__btn--active'
                      : '')
                  }
                >
                  Vulnerable{' '}
                  <span className="clubs-status-segmented__count">
                    {counts.vulnerable}
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive('intervention-required')}
                  onClick={() =>
                    setStatus(
                      isActive('intervention-required')
                        ? null
                        : 'intervention-required'
                    )
                  }
                  className={
                    'clubs-status-segmented__btn' +
                    (isActive('intervention-required')
                      ? ' clubs-status-segmented__btn--active'
                      : '')
                  }
                >
                  Intervention{' '}
                  <span className="clubs-status-segmented__count">
                    {counts.intervention}
                  </span>
                </button>
              </div>
            )
          })()}

          <div className="clubs-quick-filters">
            <span className="clubs-quick-filters__label">Quick filters:</span>

            {/* ⭐ Close to Distinguished — 1–4 more members (#433).
                Threshold shared with ClubDetailPage banner. */}
            <button
              type="button"
              onClick={() => {
                if (isCloseToDistinguishedActive) {
                  setFilter('membersNeeded', null)
                } else {
                  setFilter('membersNeeded', {
                    field: 'membersNeeded',
                    type: 'numeric',
                    value: [1, CLOSE_TO_DISTINGUISHED_MAX_MEMBERS],
                  })
                  setSortField('membersNeeded')
                  setSortDirection('asc')
                  onSortChange?.('membersNeeded', 'asc')
                }
              }}
              className={
                'clubs-quick-filter-chip' +
                (isCloseToDistinguishedActive
                  ? ' clubs-quick-filter-chip--active'
                  : '')
              }
              aria-pressed={isCloseToDistinguishedActive}
            >
              <span
                aria-hidden="true"
                className="clubs-quick-filter-chip__star"
              >
                ★
              </span>
              Close to Distinguished
            </button>

            {/* Needs members — clubs short by 2+ to reach next tier */}
            <button
              type="button"
              onClick={() => {
                if (isNeedsMembersActive) {
                  setFilter('membersNeeded', null)
                } else {
                  setFilter('membersNeeded', {
                    field: 'membersNeeded',
                    type: 'numeric',
                    value: [2, null],
                  })
                }
              }}
              className={
                'clubs-quick-filter-chip' +
                (isNeedsMembersActive ? ' clubs-quick-filter-chip--active' : '')
              }
              aria-pressed={isNeedsMembersActive}
            >
              Needs members
            </button>

            {/* Missing renewals — clubs with 0 October renewals */}
            <button
              type="button"
              onClick={() => {
                const current = getFilter('octoberRenewals')
                const isActive =
                  Array.isArray(current?.value) &&
                  current.value[0] === 0 &&
                  current.value[1] === 0
                if (isActive) {
                  setFilter('octoberRenewals', null)
                } else {
                  setFilter('octoberRenewals', {
                    field: 'octoberRenewals',
                    type: 'numeric',
                    value: [0, 0],
                  })
                }
              }}
              className={
                'clubs-quick-filter-chip' +
                (() => {
                  const f = getFilter('octoberRenewals')
                  return Array.isArray(f?.value) &&
                    f.value[0] === 0 &&
                    f.value[1] === 0
                    ? ' clubs-quick-filter-chip--active'
                    : ''
                })()
              }
              aria-pressed={(() => {
                const f = getFilter('octoberRenewals')
                return (
                  Array.isArray(f?.value) &&
                  f.value[0] === 0 &&
                  f.value[1] === 0
                )
              })()}
            >
              Missing renewals
            </button>

            {/* President's tier only */}
            <button
              type="button"
              onClick={() => {
                const current = getFilter('distinguished')
                const isActive =
                  Array.isArray(current?.value) &&
                  (current.value as string[]).includes('President')
                if (isActive) {
                  setFilter('distinguished', null)
                } else {
                  setFilter('distinguished', {
                    field: 'distinguished',
                    type: 'categorical',
                    value: ['President'],
                  })
                }
              }}
              className={
                'clubs-quick-filter-chip' +
                (() => {
                  const f = getFilter('distinguished')
                  return Array.isArray(f?.value) &&
                    (f.value as string[]).includes('President')
                    ? ' clubs-quick-filter-chip--active'
                    : ''
                })()
              }
              aria-pressed={(() => {
                const f = getFilter('distinguished')
                return (
                  Array.isArray(f?.value) &&
                  (f.value as string[]).includes('President')
                )
              })()}
            >
              President's tier only
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="clubs-quick-filter-chip clubs-quick-filter-chip__clear"
              >
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSkeleton variant="table" count={5} />}

      {/* No Results */}
      {!isLoading && sortedClubs.length === 0 && clubs.length === 0 && (
        <EmptyState
          title="No Clubs Found"
          message="No club data is available for this district. This may be because no data has been cached yet."
          icon="data"
        />
      )}

      {/* No Search Results */}
      {!isLoading && sortedClubs.length === 0 && clubs.length > 0 && (
        <div className="p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-gray-600 font-medium">
            No clubs match your filters
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your column filters
          </p>
        </div>
      )}

      {/* Mobile Card View (#217) */}
      {!isLoading && sortedClubs.length > 0 && isMobile && (
        <div className="p-4">
          {/* Mobile sort dropdown */}
          <div className="flex items-center gap-2 mb-3">
            <label
              htmlFor="mobile-sort"
              className="text-xs text-gray-500 font-medium"
            >
              Sort by:
            </label>
            <select
              id="mobile-sort"
              value={sortField}
              onChange={e => {
                const field = e.target.value as SortField
                if (field === sortField) {
                  setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
                } else {
                  setSortField(field)
                  setSortDirection('asc')
                }
              }}
              className="text-xs border border-gray-300 rounded-md px-2 py-1 text-gray-700 bg-white"
              aria-label="Sort clubs"
            >
              {COLUMN_CONFIGS.filter(c => c.sortable).map(config => (
                <option key={config.field} value={config.field}>
                  {config.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
              }
              className="text-xs text-gray-500 hover:text-gray-700 px-1"
              aria-label={`Sort direction: ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          {/* Card list */}
          <div className="space-y-3">
            {pagination.paginatedItems.map(club => (
              <ClubCard
                key={club.clubId}
                club={club}
                onClick={onClubClick ? () => onClubClick(club) : undefined}
              />
            ))}
          </div>
          {/* Mobile pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handleGoToPage}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              totalItems={pagination.totalItems}
              canGoNext={pagination.canGoNext}
              canGoPrevious={pagination.canGoPrevious}
            />
          </div>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && sortedClubs.length > 0 && !isMobile && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {COLUMN_CONFIGS.map(config => (
                  <th key={config.field} className="p-0">
                    <ColumnHeader
                      field={config.field}
                      label={config.label}
                      sortable={config.sortable}
                      filterable={config.filterable}
                      filterType={config.filterType}
                      currentSort={{
                        field: sortField,
                        direction: sortDirection,
                      }}
                      currentFilter={getFilter(config.field)}
                      onSort={handleSort}
                      onFilter={setFilter}
                      {...(config.filterOptions && {
                        options: config.filterOptions,
                      })}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagination.paginatedItems.map(club => (
                <tr
                  key={club.clubId}
                  onClick={() => onClubClick?.(club)}
                  className={`${getRowColor(club.currentStatus)} cursor-pointer transition-colors`}
                >
                  <td className="px-2 py-3 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">
                      {club.clubName}
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                    {club.divisionName}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                    {club.areaName}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center text-gray-900">
                    {club.latestMembership}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center text-gray-900">
                    {club.latestDcpGoals}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center text-gray-900 font-medium">
                    {club.membersNeeded > 0 ? (
                      <span className="text-tm-true-maroon">
                        {club.membersNeeded}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    {club.distinguishedLevel &&
                    club.distinguishedLevel !== 'NotDistinguished' ? (
                      <span
                        className="px-1.5 py-0.5 text-xs font-medium bg-tm-happy-yellow-20 text-tm-true-maroon rounded-sm font-tm-body"
                        title={
                          isProvisionallyDistinguished(club)
                            ? 'Provisional — membership not yet confirmed by April renewals'
                            : 'Confirmed — April renewals recorded'
                        }
                      >
                        {club.distinguishedLevel}
                        {isProvisionallyDistinguished(club) ? '*' : ''}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <span
                      className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(club.currentStatus)}`}
                    >
                      {getStatusLabel(club.currentStatus)}
                    </span>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-center">
                    {club.clubStatus ? (
                      <span className="text-gray-900">{club.clubStatus}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center">
                    {club.octoberRenewals !== undefined ? (
                      <span
                        className={
                          club.octoberRenewals === 0
                            ? 'text-gray-500'
                            : 'text-gray-900'
                        }
                      >
                        {club.octoberRenewals}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center">
                    {club.aprilRenewals !== undefined ? (
                      <span
                        className={
                          club.aprilRenewals === 0
                            ? 'text-gray-500'
                            : 'text-gray-900'
                        }
                      >
                        {club.aprilRenewals}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center">
                    {club.newMembers !== undefined ? (
                      <span
                        className={
                          club.newMembers === 0
                            ? 'text-gray-500'
                            : 'text-gray-900'
                        }
                      >
                        {club.newMembers}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && sortedClubs.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handleGoToPage}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          totalItems={pagination.totalItems}
          canGoNext={pagination.canGoNext}
          canGoPrevious={pagination.canGoPrevious}
        />
      )}
    </div>
  )
}
