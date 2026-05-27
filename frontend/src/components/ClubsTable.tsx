import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ClubTrend } from '../hooks/useDistrictAnalytics'
import type { ClubHealthStatus } from '../hooks/useDistrictAnalytics'
import { ExportButton } from './ExportButton'
import { exportClubPerformance } from '../utils/csvExport'
import { LoadingSkeleton } from './LoadingSkeleton'
import { isProvisionallyDistinguished } from '../utils/provisionalDistinguished'
import {
  getClubHealthStatusLabel,
  getClubHealthStatusPillModifier,
} from '../utils/clubHealthStatus'
import { useColumnFilters } from '../hooks/useColumnFilters'
import { ColumnHeader } from './ColumnHeader'
import { SortField, SortDirection, COLUMN_CONFIGS } from './filters/types'
import { CLOSE_TO_DISTINGUISHED_MAX_MEMBERS } from '../utils/closeToDistinguished'
import ClubCard from './ClubCard'
import { useIsMobile } from '../hooks/useIsMobile'

// DCP tier pill maps (#669). Confirmed tiers carry their HANDOFF §256 color
// (Smedley maroon, President's loyal-500, Select loyal-400, Distinguished
// green); a provisional tier shows the striped-yellow "projected" stripe
// instead, since the membership isn't yet confirmed by April renewals.
// NotDistinguished has no pill — a muted em-dash (neutral "not yet").
// Module-scope: these are constant, so they don't re-allocate per render.
type ConfirmedTier = Exclude<
  ClubTrend['distinguishedLevel'],
  'NotDistinguished'
>

const TIER_DISPLAY: Record<ConfirmedTier, string> = {
  Distinguished: 'Distinguished',
  Select: 'Select',
  President: "President's",
  Smedley: 'Smedley',
}

const TIER_MODIFIER: Record<ConfirmedTier, string> = {
  Distinguished: 'clubs-tier-pill--distinguished',
  Select: 'clubs-tier-pill--select',
  President: 'clubs-tier-pill--presidents',
  Smedley: 'clubs-tier-pill--smedley',
}

// Per-column responsive priority (ADR-006 §3, #812). The table renders only at
// the tablet tier and up (≥768px; below that is the card view). Two visibility
// levels:
//   • Core (always shown when the table renders): Club (sticky key), Status,
//     Members, Needed, DCP, Tier — the triage set a leader scans first.
//   • Detail (clubs-table__col--desktop — hidden 768–1279, revealed ≥1280):
//     Div, Area, New, Oct Renew, Apr Renew, Club Status, Years.
// The card view at true mobile carries the full record, so nothing is lost.
const DESKTOP_ONLY_FIELDS: ReadonlySet<SortField> = new Set([
  'division',
  'area',
  'newMembers',
  'octoberRenewals',
  'aprilRenewals',
  'clubStatus',
  'yearsChartered',
])

// The sticky key column — pinned at left:0 so the row stays labelled while the
// metric columns scroll horizontally (Lesson 105). It is never hidden.
const STICKY_FIELD: SortField = 'name'

/** Responsive priority class for a column header/cell, by field. */
const colPriorityClass = (field: SortField): string =>
  field === STICKY_FIELD
    ? 'clubs-table__sticky-col'
    : DESKTOP_ONLY_FIELDS.has(field)
      ? 'clubs-table__col--desktop'
      : ''

/** Row-tint key for the sticky cell, so it can repaint OPAQUE per row status
 *  (a sticky cell must be opaque or scrolled columns bleed through it). Mirrors
 *  the row bg set by getRowColor: intervention → red-50, vulnerable → yellow-50,
 *  everything else → the themed --surface (no repaint needed). */
const rowTint = (
  status: 'thriving' | 'vulnerable' | 'intervention-required'
): 'intervention' | 'vulnerable' | 'none' =>
  status === 'intervention-required'
    ? 'intervention'
    : status === 'vulnerable'
      ? 'vulnerable'
      : 'none'

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
  /** Initial filter state from URL params (#272) */
  initialFilterState?: import('./filters/types').FilterState | undefined
  /** Callback when filters change — for URL param sync (#272) */
  onFilterChange?:
    | ((state: import('./filters/types').FilterState) => void)
    | undefined
  /** Reference date for anniversary computation. Defaults to `new Date()`.
   *  Tests inject a fixed date to keep year counts deterministic (#448). */
  referenceDate?: Date
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
 * - All clubs in one sticky-header scroll container (no pagination, #667)
 * - CSV export functionality
 * - Click-through to detailed club view
 * - Loading skeletons and empty states
 * - Clear all filters functionality
 *
 * Performance Optimizations:
 * - Debounced text filtering (300ms) to reduce re-renders
 * - Memoized filtering and sorting
 * - Render budget guarded by a perf test (#667); virtualization deferred
 *   (epic #665) until a real district exceeds the budget
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
  initialFilterState,
  onFilterChange,
  referenceDate,
}) => {
  const [sortField, setSortField] = useState<SortField>(
    initialSortField ?? 'name'
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    initialSortDirection ?? 'asc'
  )
  // Collapse the table to cards at the 768px tablet boundary (ADR-006 §2, epic
  // #813 Sprint 4, #812). The card view is for TRUE mobile only (< 768px);
  // 768–1279px shows the table with low-priority columns hidden (the
  // priority-column model below), and ≥1280px shows the full set. Clubs are
  // browsed one-at-a-time, so card-collapse at true mobile is the right pattern
  // (lesson 105) — but the old 640px value made the table→card swap a cliff
  // with no tablet tier. The tablet tier is what #812 adds.
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
  } = useColumnFilters(clubs, initialFilterState, referenceDate)

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

  // Status-pill modifier + label come from the shared clubHealthStatus helpers
  // so the desktop row and the mobile ClubCard render the same datum
  // identically (lesson 052). Token-driven via the CSS layer so dark mode
  // "just works" (R10); the label carries meaning too (never color-alone).
  const getStatusPillModifier = getClubHealthStatusPillModifier
  const getStatusLabel = getClubHealthStatusLabel

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
        // Default (non-status) row — token-driven surface + hover (#668).
        // Status rows above keep their semantic red/yellow bg (Sprint 3 #669).
        return 'clubs-table-row'
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
        case 'yearsChartered':
          // null (missing charterDate) falls through to the
          // undefined-handling below, sorting to end either direction.
          aValue = a.yearsChartered ?? undefined
          bValue = b.yearsChartered ?? undefined
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

  // No pagination (#667): the full sorted+filtered set renders in a single
  // sticky-header scroll container. Sort / filter / search span every row;
  // the "Showing N of M clubs" count line is the only progress indicator.

  // Handle sort
  const handleSort = (field: SortField) => {
    let newField = sortField
    let newDirection: SortDirection
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

  // Show the right-edge scroll-cue ONLY when the table actually overflows to
  // the right. A permanent fade would wash out the right-aligned numeric
  // columns on a wide desktop where the full set fits and nothing scrolls — a
  // false affordance. Toggled imperatively via a data-attr on the scroll-wrap
  // (gated in CSS) so scroll/resize don't re-render the whole table. Mirrors
  // the landing rankings table (#811).
  const tableScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = tableScrollRef.current
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
  }, [sortedClubs, isMobile])

  return (
    <div className="redesign-panel">
      {/* Header with Export and Results Count */}
      <div className="p-6 clubs-panel-header">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold clubs-panel-title">All Clubs</h3>
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
        <div className="flex flex-wrap items-center gap-4 text-sm clubs-text-muted">
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

      {/* No Results — no data at all. Token-driven inline markup mirroring
          the filter-empty state below (#672), so the clubs table is gray-free
          in every state it renders. Distinct copy from the filter-empty case:
          this is "nothing cached yet", not "your filters excluded everything". */}
      {!isLoading && sortedClubs.length === 0 && clubs.length === 0 && (
        <div className="p-12 text-center" role="status">
          <svg
            className="w-16 h-16 clubs-text-muted mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="clubs-text-muted font-medium">No Clubs Found</p>
          <p className="clubs-text-muted text-sm mt-1 max-w-lg mx-auto">
            No club data is available for this district. This may be because no
            data has been cached yet.
          </p>
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && sortedClubs.length === 0 && clubs.length > 0 && (
        <div className="p-12 text-center">
          <svg
            className="w-16 h-16 clubs-text-muted mx-auto mb-4"
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
          <p className="clubs-text-muted font-medium">
            No clubs match your filters
          </p>
          <p className="clubs-text-muted text-sm mt-1">
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
              className="text-xs clubs-text-muted font-medium"
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
              className="text-xs clubs-mobile-select rounded-md"
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
              className="text-xs clubs-sort-dir px-1"
              aria-label={`Sort direction: ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          {/* Card list — all clubs, no pagination (#667) */}
          <div className="space-y-3">
            {sortedClubs.map(club => (
              <ClubCard
                key={club.clubId}
                club={club}
                onClick={onClubClick ? () => onClubClick(club) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Desktop Table — all clubs in one capped-height scroll container
          with a sticky header (#667). The container is keyboard-operable
          (role/tabindex/aria-label) so keyboard-only users can scroll it
          (WCAG 2.1.1; axe scrollable-region-focusable). */}
      {!isLoading && sortedClubs.length > 0 && !isMobile && (
        <div className="clubs-table__scroll-wrap">
          <div
            ref={tableScrollRef}
            className="clubs-table-scroll overflow-x-auto"
            role="region"
            aria-label="All clubs table"
            tabIndex={0}
          >
            <table id="clubs-table" className="w-full table-auto">
              <thead className="clubs-table-sticky-head">
                <tr>
                  {COLUMN_CONFIGS.map(config => (
                    <th
                      key={config.field}
                      className={`p-0 ${colPriorityClass(config.field)}`.trim()}
                    >
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
              <tbody>
                {sortedClubs.map(club => {
                  const tint = rowTint(club.currentStatus)
                  return (
                    <tr
                      key={club.clubId}
                      onClick={() => onClubClick?.(club)}
                      className={`${getRowColor(club.currentStatus)} cursor-pointer transition-colors`}
                    >
                      {/* Cell order MUST match COLUMN_CONFIGS (filters/types.ts):
                      Club, Div, Area, Status, Members, Needed, New, Oct Renew,
                      Apr Renew, DCP, Tier, Club Status, Years (#669). The
                      responsive priority class on each cell MUST match its
                      header above (colPriorityClass, #812). */}
                      {/* Club — the sticky key column. data-row-tint lets the CSS
                        repaint it opaque to match the row's status bg so the
                        scrolled columns don't bleed through (Lesson 105). */}
                      <td
                        className="px-2 py-3 whitespace-nowrap clubs-table__sticky-col"
                        data-row-tint={tint}
                      >
                        <div className="font-medium text-sm">
                          {club.clubName}
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm clubs-cell-muted text-center clubs-table__col--desktop">
                        {club.divisionName}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm clubs-cell-muted text-center clubs-table__col--desktop">
                        {club.areaName}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        <span
                          className={`clubs-status-pill ${getStatusPillModifier(club.currentStatus)}`}
                        >
                          {getStatusLabel(club.currentStatus)}
                        </span>
                      </td>
                      {/* Members — current / base (#669). Base omitted when the
                      snapshot has no membershipBase (pre-merge data). */}
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-center clubs-members-cell">
                        <span className="tabular-nums">
                          {club.latestMembership}
                        </span>
                        {club.membershipBase !== undefined && (
                          <span className="clubs-cell-muted tabular-nums">
                            {' / '}
                            {club.membershipBase}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center font-medium">
                        {club.membersNeeded > 0 ? (
                          <span className="text-tm-true-maroon">
                            {club.membersNeeded}
                          </span>
                        ) : (
                          <span className="clubs-cell-muted">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center clubs-table__col--desktop">
                        {club.newMembers !== undefined ? (
                          <span
                            className={
                              club.newMembers === 0
                                ? 'clubs-cell-muted'
                                : undefined
                            }
                          >
                            {club.newMembers}
                          </span>
                        ) : (
                          <span className="clubs-cell-muted">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center clubs-table__col--desktop">
                        {club.octoberRenewals !== undefined ? (
                          <span
                            className={
                              club.octoberRenewals === 0
                                ? 'clubs-cell-muted'
                                : undefined
                            }
                          >
                            {club.octoberRenewals}
                          </span>
                        ) : (
                          <span className="clubs-cell-muted">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center clubs-table__col--desktop">
                        {club.aprilRenewals !== undefined ? (
                          <span
                            className={
                              club.aprilRenewals === 0
                                ? 'clubs-cell-muted'
                                : undefined
                            }
                          >
                            {club.aprilRenewals}
                          </span>
                        ) : (
                          <span className="clubs-cell-muted">—</span>
                        )}
                      </td>
                      {/* DCP — inline progress bar over the canonical goals-achieved
                      count (0–10). Reads latestDcpGoals from the analytics
                      trend; no Goals-1-N inference (DCP-independence tripwire). */}
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        {(() => {
                          const goals = Math.max(
                            0,
                            Math.min(10, club.latestDcpGoals)
                          )
                          const pct = (goals / 10) * 100
                          return (
                            <div className="clubs-dcp-cell">
                              <span className="clubs-dcp-cell__val tabular-nums">
                                {goals}/10
                              </span>
                              <div
                                className="clubs-dcp-bar"
                                role="progressbar"
                                aria-valuenow={goals}
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-label="DCP goals achieved"
                              >
                                <div
                                  className="clubs-dcp-bar__fill"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      {/* Tier — DCP recognition pill (#669). Color by tier; a
                      provisional tier shows the striped-yellow "projected"
                      treatment instead (membership unconfirmed pre-April). */}
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        {club.distinguishedLevel !== 'NotDistinguished' ? (
                          (() => {
                            const provisional =
                              isProvisionallyDistinguished(club)
                            const modifier = provisional
                              ? 'clubs-tier-pill--projected'
                              : TIER_MODIFIER[club.distinguishedLevel]
                            return (
                              <span
                                className={`clubs-tier-pill ${modifier}`}
                                title={
                                  provisional
                                    ? 'Provisional — membership not yet confirmed by April renewals'
                                    : 'Confirmed — April renewals recorded'
                                }
                              >
                                {TIER_DISPLAY[club.distinguishedLevel]}
                                {provisional ? '*' : ''}
                              </span>
                            )
                          })()
                        ) : (
                          <span className="text-sm clubs-cell-muted">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-center clubs-table__col--desktop">
                        {club.clubStatus ? (
                          <span>{club.clubStatus}</span>
                        ) : (
                          <span className="clubs-cell-muted">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm tabular-nums text-center clubs-table__col--desktop">
                        {club.yearsChartered !== null ? (
                          <span>{club.yearsChartered}</span>
                        ) : (
                          <span className="clubs-cell-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Right-edge fade cue: "there's more →". Shown only when the table
              overflows right (data-scrollable-right, set by the effect above);
              pointer-events:none so it never blocks taps/scroll (#812). */}
          <div className="clubs-table__scroll-cue" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
