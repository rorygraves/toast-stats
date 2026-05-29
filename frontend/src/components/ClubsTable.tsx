import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnPinningState,
  type VisibilityState,
} from '@tanstack/react-table'
import type { SnapshotDiff } from '@toastmasters/shared-contracts'
import { ClubTrend } from '../hooks/useDistrictAnalytics'
import { ExportButton } from './ExportButton'
import { exportClubPerformance, exportSnapshotDiff } from '../utils/csvExport'
import { LoadingSkeleton } from './LoadingSkeleton'
import { useColumnFilters } from '../hooks/useColumnFilters'
import { ColumnHeader } from './ColumnHeader'
import { FiltersPanel } from './filters/FiltersPanel'
import { ActiveFiltersBar } from './ActiveFiltersBar'
import { ColumnGroupsMenu } from './ColumnGroupsMenu'
import { describeActiveFilters } from '../utils/clubFilterDescribe'
import {
  SortField,
  SortDirection,
  COLUMN_CONFIGS,
  COLUMN_GROUPS,
  COLUMN_GROUP_IDS,
  STICKY_COLUMN_FIELD,
  type ColumnGroup,
  type ProcessedClubTrend,
} from './filters/types'
import { usePersistedState } from '../hooks/usePersistedState'
import {
  clubsColumns,
  clubColumnPriorityClass,
  clubColumnTdClass,
} from './clubsColumns'
import {
  buildClubsDeltaColumns,
  CLUBS_DELTA_COLUMN_IDS,
} from './clubsDeltaColumns'
import { CLOSE_TO_DISTINGUISHED_MAX_MEMBERS } from '../utils/closeToDistinguished'
import ClubCard from './ClubCard'
import { useIsMobile } from '../hooks/useIsMobile'
import { useDebounce } from '../hooks/useDebounce'

// The column model — order, headers, responsive priority (sticky key column +
// tablet-tier hiding), per-cell render, and the sort fns — lives in
// `clubsColumns.tsx` (the TanStack migration, #835). The DCP tier pill maps,
// status-rank sort key, and sticky/desktop priority that ClubsTable used to own
// inline moved there. ClubsTable keeps only the row-level concerns below.

/** Persisted-store name for the club table's hidden column groups (#819).
 *  Passed to the versioned localStorage primitive (#420), which prefixes it
 *  with `toast-stats:v<N>:` so it migrates with every other persisted key. */
const HIDDEN_GROUPS_STORAGE_NAME = 'clubs-table:hidden-groups'
/** Persisted opt-in toggle for the Changes group (#795). Stored independently
 *  of HIDDEN_GROUPS so the default (off) is honoured even for users whose
 *  hidden-groups store predates the group's existence. */
const CHANGES_VISIBLE_STORAGE_NAME = 'clubs-table:changes-visible'

const VALID_GROUPS = new Set<ColumnGroup>(COLUMN_GROUP_IDS)
/** A stale/corrupt store must never hide phantom groups or wedge the table
 *  into an unusable column set — keep only known group ids. */
const sanitizeHiddenGroups = (raw: unknown): ColumnGroup[] =>
  Array.isArray(raw)
    ? raw.filter((g): g is ColumnGroup => VALID_GROUPS.has(g as ColumnGroup))
    : []

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
 * Visible club-name search box (#814). Mirrors the column TextFilter pattern:
 * a LOCAL input value keeps typing instant, while the heavy table re-filter is
 * driven off a 300ms-debounced value. Without the local/debounced split the
 * controlled input is gated on the 100+-row re-sort and drops fast keystrokes.
 *
 * `value` is the external `name`-filter value (URL on load, the column
 * dropdown, or Clear-all). It is pulled into the local input whenever it
 * changes externally; debounce coalescing means our own outbound writes settle
 * to the same value and don't fight the user mid-type.
 */
const ClubSearchBox: React.FC<{
  value: string
  onSearchChange: (value: string) => void
}> = ({ value, onSearchChange }) => {
  const [input, setInput] = useState(value)
  const debounced = useDebounce(input, 300)

  // Pull external changes (Clear-all, column dropdown, back/forward) back into
  // the local input. Render-phase sync (tracked-value compare) avoids
  // setState-in-effect — the established pattern here, see TextFilter (#340):
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [trackedValue, setTrackedValue] = useState(value)
  if (value !== trackedValue) {
    setTrackedValue(value)
    setInput(value)
  }

  // Push the settled input outward (filter + URL) when it diverges. Only push
  // once the debounce has SETTLED to the current input (`debounced === input`):
  // when an external clear (Clear-all) resets `value`→'' the render-phase sync
  // above sets `input`→'' while `debounced` still lags at the old text — pushing
  // that stale `debounced` would re-apply the filter we just cleared (#817).
  useEffect(() => {
    if (debounced === input && debounced !== value) onSearchChange(debounced)
  }, [debounced, input, value, onSearchChange])

  return (
    <div className="clubs-search">
      <svg
        className="clubs-search__icon"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        className="clubs-search__input"
        placeholder="Search clubs by name…"
        aria-label="Search clubs by name"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      {input && (
        <button
          type="button"
          className="clubs-search__clear"
          aria-label="Clear search"
          onClick={() => setInput('')}
        >
          ✕
        </button>
      )}
    </div>
  )
}

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
  /** Optional callback when a club row is clicked (whole-row mouse convenience;
   *  the club name itself is a real <Link> regardless — CC-7, #872). */
  onClubClick?: (club: ClubTrend) => void
  /** Router location state to attach to every club link (CC-7, #872). The
   *  clubs page passes `{ fromClubsSearch }` so the club page's breadcrumb can
   *  round-trip back to the exact filtered list (#577). */
  clubLinkState?: unknown
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
  /**
   * Snapshot-to-snapshot diff for the opt-in "Changes" column group (#795).
   * When provided, ClubsTable surfaces the five delta columns under the Changes
   * group (hidden by default, opt-in via the Columns menu) AND offers a sibling
   * CSV export of the diff. Absent ⇒ no Changes group, no diff export — the
   * table is byte-identical to its pre-#795 self.
   */
  snapshotDiff?: SnapshotDiff | undefined
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
  clubLinkState,
  initialSortField,
  initialSortDirection,
  onSortChange,
  initialFilterState,
  onFilterChange,
  referenceDate,
  snapshotDiff,
}) => {
  const [sortField, setSortField] = useState<SortField>(
    initialSortField ?? 'name'
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    initialSortDirection ?? 'asc'
  )
  // The dedicated Filters drawer (#816). Replaces the hidden per-column header
  // filter dropdowns with one discoverable, instant-apply panel.
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  // Return focus to the trigger when the drawer closes (WCAG 2.4.3) — a modal
  // dialog must restore focus to the control that opened it.
  const filtersTriggerRef = useRef<HTMLButtonElement>(null)
  const closeFilters = useCallback(() => {
    setIsFiltersOpen(false)
    filtersTriggerRef.current?.focus()
  }, [])
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

  // Visible-search → `name` text filter (#814). Empty/whitespace clears the
  // filter rather than writing `?search=` junk to the URL.
  const handleSearchChange = useCallback(
    (raw: string) => {
      setFilter(
        'name',
        raw.trim()
          ? { field: 'name', type: 'text', value: raw, operator: 'contains' }
          : null
      )
    },
    [setFilter]
  )

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

  // Health-band presets (#815 B2). Merged into the ONE preset row below: the
  // old segmented `role="tablist"` status control and the quick-filter chips
  // read as two unrelated systems (table-ux-review §1). These filter the same
  // `status` field, single-select (choosing one replaces the prior; clicking
  // the active one clears it). "All" is the absence of an active band — the
  // "Total / Showing N" count line already carries the total. `aria-pressed`
  // (not `role="tab"`): a filter toggles a set, it doesn't switch a panel — and
  // it unifies the affordance with the intent chips in the same row.
  const statusFilterValue = (() => {
    const f = getFilter('status')
    return Array.isArray(f?.value) ? (f.value as string[]) : []
  })()
  const isStatusActive = (status: string) =>
    statusFilterValue.length === 1 && statusFilterValue[0] === status
  const setStatusPreset = (status: string) => {
    setFilter(
      'status',
      isStatusActive(status)
        ? null
        : { field: 'status', type: 'categorical', value: [status] }
    )
  }
  // One pass, memoized on `clubs` (the sort below memoizes for the same
  // reason) — the badges recompute only when the data changes, not on every
  // filter/sort/scroll-cue re-render.
  const statusCounts = useMemo(() => {
    const counts = { thriving: 0, vulnerable: 0, intervention: 0 }
    for (const c of clubs) {
      if (c.currentStatus === 'thriving') counts.thriving++
      else if (c.currentStatus === 'vulnerable') counts.vulnerable++
      else if (c.currentStatus === 'intervention-required')
        counts.intervention++
    }
    return counts
  }, [clubs])

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

  // TanStack Table owns sort / sizing / pinning / visibility (#835, epic #821
  // Sprint 1). The filter pipeline (useColumnFilters → filteredClubs) and its
  // metadata (COLUMN_CONFIGS) are unchanged (R11) — the table presents over it.
  //
  // Feed the table a name-ascending base order so its STABLE sort reproduces the
  // pre-migration "secondary sort by club name (always ascending)" tiebreak in
  // both directions (see clubsColumns.tsx). Memoized on filteredClubs.
  const nameSortedClubs = useMemo(
    () =>
      [...filteredClubs].sort((a, b) =>
        a.clubName.toLowerCase().localeCompare(b.clubName.toLowerCase())
      ),
    [filteredClubs]
  )

  // Sort state is CONTROLLED by sortField/sortDirection — the URL-synced source
  // of truth that ColumnHeader drives via handleSort. The table derives the row
  // order from it; nothing calls the table's own sort API, so no onSortingChange.
  const sorting: SortingState = useMemo(
    () => [{ id: sortField, desc: sortDirection === 'desc' }],
    [sortField, sortDirection]
  )

  // The sticky key column ('name') is the left-pinned column (ADR-006 §3,
  // Lesson 105); the existing CSS (.clubs-table__sticky-col) renders the
  // stickiness, the pinning state is the model of record.
  const columnPinning: ColumnPinningState = useMemo(
    () => ({ left: [STICKY_COLUMN_FIELD], right: [] }),
    []
  )

  // Column-group show/hide (#819, ADR-006 §4). Persisted to localStorage so the
  // selection survives reload. Group visibility is a durable per-user VIEW
  // preference (like dark mode), not shareable filter data — keeping it out of
  // the URL avoids the filter↔URL reconcile race surface (lessons 070/130).
  // The hidden set is the source of truth (default empty = all visible, so the
  // table is unchanged until the user opts in). Drives TanStack's native
  // `columnVisibility` state — no parallel responsive logic, no hand-rolled
  // filter on the body (TanStack's row.getVisibleCells keeps header/body in
  // lockstep automatically). The sticky 'name' column is forced visible so
  // hiding the Identity group can't strip the row's own label (ADR-006 §3).
  const [storedHiddenGroups, setStoredHiddenGroups] = usePersistedState<
    ColumnGroup[]
  >(HIDDEN_GROUPS_STORAGE_NAME, [])
  // Opt-in show for the Changes group (#795). Stored as a boolean (default
  // false) so the Changes columns stay hidden until the user toggles them on,
  // independently of the hide-on-toggle behaviour the other groups use. The
  // pre-existing `hiddenGroups` store can be `[]` for users who saved it before
  // 'changes' existed — without a separate flag, they'd be opted IN by default.
  const [changesVisible, setChangesVisible] = usePersistedState<boolean>(
    CHANGES_VISIBLE_STORAGE_NAME,
    false
  )
  const hiddenGroups = useMemo(() => {
    const s = new Set(sanitizeHiddenGroups(storedHiddenGroups))
    if (!changesVisible) s.add('changes')
    return s
  }, [storedHiddenGroups, changesVisible])
  const isGroupHidden = useCallback(
    (group: ColumnGroup) => hiddenGroups.has(group),
    [hiddenGroups]
  )
  const toggleGroup = useCallback(
    (group: ColumnGroup) => {
      if (group === 'changes') {
        setChangesVisible(v => !v)
        return
      }
      setStoredHiddenGroups(prev => {
        const next = new Set(sanitizeHiddenGroups(prev))
        if (next.has(group)) next.delete(group)
        else next.add(group)
        return [...next]
      })
    },
    [setStoredHiddenGroups, setChangesVisible]
  )

  // The 'changes' group is offered ONLY when a snapshot diff is provided —
  // toggling a column set with nothing in it would be a dead control. The other
  // groups are offered when at least one column claims them (so 'identity',
  // 'membership', 'renewals', 'recognition' are always offered today; this
  // shape is forward-compatible if any of them ever empties out).
  const availableColumnGroups = useMemo(
    () =>
      COLUMN_GROUPS.filter(
        g =>
          (g.id === 'changes' && !!snapshotDiff) ||
          (g.id !== 'changes' && COLUMN_CONFIGS.some(c => c.group === g.id))
      ),
    [snapshotDiff]
  )

  // ClubDiff lookup keyed by clubId, recomputed only when the diff changes.
  // The delta column defs close over this Map so each cell can render its
  // row's own diff without re-walking `snapshotDiff.clubs.bothPresent`.
  const clubDiffsById = useMemo(() => {
    const m = new Map<
      string,
      import('@toastmasters/shared-contracts').ClubDiff
    >()
    if (snapshotDiff) {
      for (const c of snapshotDiff.clubs.bothPresent) m.set(c.clubId, c)
    }
    return m
  }, [snapshotDiff])

  // Delta column defs (#795). Only appended when a diff is provided — absent ⇒
  // the table is byte-identical to its pre-#795 self. The 'changes' group's
  // visibility is driven by `hiddenGroups` (opt-in, default hidden).
  const tableColumns = useMemo(
    () =>
      snapshotDiff
        ? [...clubsColumns, ...buildClubsDeltaColumns(clubDiffsById)]
        : clubsColumns,
    [snapshotDiff, clubDiffsById]
  )

  const columnVisibility = useMemo<VisibilityState>(() => {
    const vis: VisibilityState = {}
    for (const c of COLUMN_CONFIGS) {
      // The sticky key column is the row's label — never hidden by a group.
      if (c.field === STICKY_COLUMN_FIELD) continue
      if (hiddenGroups.has(c.group)) vis[c.field] = false
    }
    // Delta columns belong to the 'changes' group; hide the whole set when the
    // group is hidden. They live outside COLUMN_CONFIGS (they're display-only
    // columns, no filter or sort metadata to register) so the loop above
    // doesn't reach them.
    if (hiddenGroups.has('changes')) {
      for (const id of CLUBS_DELTA_COLUMN_IDS) vis[id] = false
    }
    return vis
  }, [hiddenGroups])

  // CC-7 (#872): build the club-detail href once; the sticky name cell renders
  // it as a real <Link> (via table.meta), and the mobile ClubCard reuses it.
  const clubLinkTo = useCallback(
    (club: ProcessedClubTrend) => `/district/${districtId}/club/${club.clubId}`,
    [districtId]
  )

  const table = useReactTable<ProcessedClubTrend>({
    data: nameSortedClubs,
    columns: tableColumns,
    state: { sorting, columnPinning, columnVisibility },
    meta: { clubLinkTo, clubLinkState },
    // columnVisibility is fully controlled by hiddenGroups above — TanStack
    // never writes it directly, so onColumnVisibilityChange is intentionally
    // omitted (R11 — drive the existing state, don't add a parallel one).
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
  })

  const rowModel = table.getRowModel()
  // The ordered ProcessedClubTrend[] backing CSV export, the count line, the
  // card view, and the scroll-cue effect — mirrors the displayed row order.
  const sortedClubs = useMemo(
    () => rowModel.rows.map(r => r.original),
    [rowModel]
  )

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
          <div className="clubs-export-group">
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
            {/* Diff CSV export (#795). A SIBLING of the clubs export — the diff
                rows are from/to/Δ across two snapshots, not current-snapshot
                fields, so a single combined CSV would conflate two datasets
                (lesson 117). Shown only when a snapshot diff is loaded. */}
            {snapshotDiff && (
              <ExportButton
                onExport={() => exportSnapshotDiff(snapshotDiff)}
                label="Export Changes"
                disabled={
                  snapshotDiff.clubs.bothPresent.length === 0 &&
                  snapshotDiff.clubs.onlyInFrom.length === 0 &&
                  snapshotDiff.clubs.onlyInTo.length === 0
                }
              />
            )}
          </div>
        </div>

        {/* Visible name search (#814, epic #818 Sprint 1). Recognition over
            recall: a prominent box at the top of the table replaces the search
            that was buried in the hidden "Club" column-header dropdown. A
            second UI entry point onto the EXISTING `name` text filter (R11), so
            it stays in sync with that dropdown and URL-syncs through the parent
            (DistrictClubsPage maps `name` ⇄ `?search=`). */}
        <div className="clubs-filter-toolbar">
          <ClubSearchBox
            value={
              typeof getFilter('name')?.value === 'string'
                ? (getFilter('name')!.value as string)
                : ''
            }
            onSearchChange={handleSearchChange}
          />
          {/* Discoverable entry to the Filters drawer (#816). The hidden
              per-column header dropdowns are gone; this button + its
              active-count badge is the single, visible way into precise
              column filtering. */}
          <button
            ref={filtersTriggerRef}
            type="button"
            className="clubs-filters-trigger"
            onClick={() => setIsFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isFiltersOpen}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="clubs-filters-trigger__badge">
                {activeFilterCount}
              </span>
            )}
          </button>
          {/* Column-group show/hide (#819, ADR-006 §4). Same toolbar slot as
              the Filters trigger so the two table-shape controls live together;
              uses the same .clubs-filters-trigger styling for a single visual
              language. */}
          <ColumnGroupsMenu
            groups={availableColumnGroups}
            isGroupHidden={isGroupHidden}
            onToggle={toggleGroup}
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

          {/* ONE preset row (#815 B2): health bands + intent presets, merged
              from the former segmented control and the separate chip strip.
              Health bands first (single-select, with counts) so a leader can
              narrow by health, then layer an intent preset on top. */}
          <div className="clubs-quick-filters">
            <span className="clubs-quick-filters__label">Quick filters:</span>

            {/* Health bands — Thriving / Vulnerable / Intervention, single-select
                (#361 → #815). Each carries its count; "All" = none active. */}
            {(
              [
                ['thriving', 'Thriving', statusCounts.thriving],
                ['vulnerable', 'Vulnerable', statusCounts.vulnerable],
                [
                  'intervention-required',
                  'Intervention',
                  statusCounts.intervention,
                ],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusPreset(value)}
                className={
                  'clubs-quick-filter-chip' +
                  (isStatusActive(value)
                    ? ' clubs-quick-filter-chip--active'
                    : '')
                }
                aria-pressed={isStatusActive(value)}
              >
                {label}
                <span className="clubs-quick-filter-chip__count">{count}</span>
              </button>
            ))}

            {/* ⭐ Close to Distinguished — 1–4 more members (#433).
                Threshold shared with ClubDetailPage banner. */}
            <button
              type="button"
              onClick={() => {
                if (isCloseToDistinguishedActive) {
                  setFilter('membersNeeded', null)
                } else {
                  // Filter only — no hidden auto-sort (#815 B2). The chip used
                  // to silently re-sort by membersNeeded, surprising the user
                  // and overriding any column sort they'd chosen.
                  setFilter('membersNeeded', {
                    field: 'membersNeeded',
                    type: 'numeric',
                    value: [1, CLOSE_TO_DISTINGUISHED_MAX_MEMBERS],
                  })
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

      {/* Active-filters summary bar (#817). Visible, removable summary of the
          full filter set — including drawer-only filters the preset chips
          don't surface. Same filter state, another entry point (R11). */}
      <div className="px-6">
        <ActiveFiltersBar
          filterState={filterState}
          setFilter={setFilter}
          clearAllFilters={clearAllFilters}
        />
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
          {/* Name the filters doing the excluding (#817) — a dead "adjust your
              filters" leaves the user guessing which one to loosen. */}
          {describeActiveFilters(filterState).length > 0 && (
            <p className="clubs-text-muted text-sm mt-1">
              Active:{' '}
              {describeActiveFilters(filterState)
                .map(d => `${d.label} ${d.value}`)
                .join(' · ')}
            </p>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="clubs-quick-filter-chip clubs-quick-filter-chip__clear mt-4 mx-auto"
            >
              Clear all filters
            </button>
          )}
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
                to={clubLinkTo(club)}
                state={clubLinkState}
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
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const isSortable = header.column.getCanSort()
                      const isActiveSort = sortField === header.column.id
                      const ariaSort: React.AriaAttributes['aria-sort'] =
                        !isSortable
                          ? undefined
                          : isActiveSort
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          aria-sort={ariaSort}
                          className={`p-0 ${clubColumnPriorityClass(header.column.id)}`.trim()}
                        >
                          <ColumnHeader
                            field={header.column.id as SortField}
                            label={header.column.columnDef.header as string}
                            sortable={isSortable}
                            currentSort={{
                              field: sortField,
                              direction: sortDirection,
                            }}
                            onSort={handleSort}
                          />
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rowModel.rows.map(row => {
                  const club = row.original
                  const tint = rowTint(club.currentStatus)
                  return (
                    <tr
                      key={club.clubId}
                      onClick={() => onClubClick?.(club)}
                      className={`${getRowColor(club.currentStatus)} cursor-pointer transition-colors`}
                    >
                      {/* Cells render in the column-model order (clubsColumns.tsx):
                      Club, Div, Area, Status, Members, Needed, New, Oct Renew,
                      Apr Renew, DCP, Tier, Club Status, Years. Each td's class
                      (base + responsive priority) comes from clubColumnTdClass;
                      only the sticky key column ('name') carries data-row-tint so
                      the CSS repaints it opaque to the row status bg (Lesson 105). */}
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className={clubColumnTdClass(cell.column.id)}
                          data-row-tint={
                            cell.column.id === 'name' ? tint : undefined
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
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

      {/* Dedicated Filters drawer (#816). Instant-apply over the SAME filter
          state the quick-filter chips and search box write to (R11) — one
          mechanism, three entry points. */}
      <FiltersPanel
        isOpen={isFiltersOpen}
        onClose={closeFilters}
        getFilter={getFilter}
        setFilter={setFilter}
        clearAllFilters={clearAllFilters}
        activeFilterCount={activeFilterCount}
      />
    </div>
  )
}
