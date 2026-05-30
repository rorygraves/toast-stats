import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { RegionRollup } from '../utils/aggregateRegions'
import { useUrlSort } from '../hooks/useUrlSort'
import { SortableHeader } from '../components/SortableHeader'

/* RegionsLeaderboard (#494, restored #964) — the PRIMARY sortable table for
   the /regions overview. 14 region rows × six columns.

   Sort state is URL-synced (?sort=&dir=) via the shared useUrlSort +
   SortableHeader infra (#851/#857), so reload, back/forward, and shared links
   carry the sort. The DEFAULT sort is region number ascending (#964) — a fixed
   navigation list of the 14 regions reads best in a stable, predictable order
   (matches the RegionFinder), and the table OWNS that order rather than leaning
   on the order rollups happen to arrive in (Lesson 138 / #882).

   useUrlSort validates the ?sort field against SORT_FIELDS and falls back to
   the default for any unknown value, so a hand-edited / shared URL can't seed
   an out-of-range sort (Lesson 144). The ?sort/?dir params are disjoint from
   the page's ?region finder param and are written by a distinct gesture, so
   there is no same-batch setSearchParams race (Lesson 070/145). */

export interface RegionsLeaderboardProps {
  rollups: ReadonlyArray<RegionRollup>
}

const SORT_FIELDS = [
  'region',
  'districts',
  'paidClubs',
  'payments',
  'distinguished',
  'score',
] as const
type SortField = (typeof SORT_FIELDS)[number]

/** Numeric sort key for a region row, per field. region sorts by its numeric
 *  value (01, 02, … 14), not lexically. */
const sortValue = (field: SortField, r: RegionRollup): number => {
  switch (field) {
    case 'region':
      return Number(r.region)
    case 'districts':
      return r.districtCount
    case 'paidClubs':
      return r.paidClubs
    case 'payments':
      return r.totalPayments
    case 'distinguished':
      return r.distinguishedClubs
    case 'score':
      return r.aggregateScore
  }
}

const HEADER_TH =
  'px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500'

export const RegionsLeaderboard: React.FC<RegionsLeaderboardProps> = ({
  rollups,
}) => {
  // URL-synced click-header sort. Default: region number ascending (#964).
  // A new-column click starts descending (metric columns read "best first").
  const { sort, toggleSort } = useUrlSort<SortField>({
    fields: SORT_FIELDS,
    defaultField: 'region',
    defaultDirection: 'asc',
    newFieldDirection: 'desc',
  })

  const sorted = useMemo(() => {
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...rollups].sort(
      (a, b) => (sortValue(sort.field, a) - sortValue(sort.field, b)) * dir
    )
  }, [rollups, sort])

  if (rollups.length === 0) {
    return (
      <p className="text-sm text-gray-500 theme-dark:text-gray-400 italic px-4 py-6">
        No regions to display.
      </p>
    )
  }

  return (
    // Intentional, documented horizontal scroll (#689). role=region + tabIndex
    // + aria-label make the overflow keyboard-operable (WCAG 2.1.1); the
    // scroll-cue overlay (in the relative wrap) signals more columns to the
    // right so the scroll isn't a hidden trap on a phone.
    <div className="region-rankings__scroll-wrap">
      <div
        className="overflow-x-auto region-rankings__scroll"
        role="region"
        tabIndex={0}
        aria-label="Region rankings — scroll horizontally to see all metrics"
      >
        <table
          className="w-full text-sm font-tm-body"
          aria-label="Region rankings"
        >
          <thead className="border-b border-gray-200 theme-dark:border-gray-700">
            <tr>
              <SortableHeader<SortField>
                field="region"
                label="Region"
                currentSort={sort}
                onSort={toggleSort}
                thClassName={`${HEADER_TH} text-left`}
              />
              <SortableHeader<SortField>
                field="districts"
                label="Districts"
                currentSort={sort}
                onSort={toggleSort}
                thClassName={`${HEADER_TH} text-right`}
                numeric
              />
              <SortableHeader<SortField>
                field="paidClubs"
                label="Paid Clubs"
                currentSort={sort}
                onSort={toggleSort}
                thClassName={`${HEADER_TH} text-right`}
                numeric
              />
              <SortableHeader<SortField>
                field="payments"
                label="Payments"
                currentSort={sort}
                onSort={toggleSort}
                thClassName={`${HEADER_TH} text-right`}
                numeric
              />
              <SortableHeader<SortField>
                field="distinguished"
                label="Distinguished"
                currentSort={sort}
                onSort={toggleSort}
                thClassName={`${HEADER_TH} text-right`}
                numeric
              />
              <SortableHeader<SortField>
                field="score"
                label="Score"
                currentSort={sort}
                onSort={toggleSort}
                thClassName={`${HEADER_TH} text-right`}
                numeric
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 theme-dark:divide-gray-800">
            {sorted.map(r => (
              <tr
                key={r.region}
                className="hover:bg-gray-50 theme-dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-left">
                  <Link
                    to={`/region/${r.region}`}
                    aria-label={`Region ${r.region} — leader ${r.leadingDistrictName}`}
                    className="flex items-center gap-3 text-tm-loyal-blue hover:underline"
                  >
                    <span
                      className="inline-block px-2 py-0.5 text-xs font-mono rounded bg-tm-loyal-blue/10 text-tm-loyal-blue theme-dark:bg-tm-loyal-blue/30 theme-dark:text-blue-200"
                      aria-hidden="true"
                    >
                      Region {r.region}
                    </span>
                    <span className="text-gray-700 theme-dark:text-gray-200 text-xs">
                      leader: {r.leadingDistrictName}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 theme-dark:text-gray-200">
                  {r.districtCount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 theme-dark:text-gray-200">
                  {r.paidClubs.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 theme-dark:text-gray-200">
                  {r.totalPayments.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 theme-dark:text-gray-200">
                  {r.distinguishedClubs.toLocaleString()}
                  <span className="text-gray-500 theme-dark:text-gray-400 ml-1">
                    · {Math.round(r.distinguishedPercent)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900 theme-dark:text-gray-50">
                  {r.aggregateScore.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="region-rankings__scroll-cue" aria-hidden="true" />
    </div>
  )
}
