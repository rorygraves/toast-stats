import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { RegionRollup } from '../utils/aggregateRegions'

/* RegionsLeaderboard (#494) — sortable table for the /regions overview.
   14 region rows × six columns. Default sort: aggregateScore desc
   ("which region is winning right now"). Reuses Tailwind utility
   classes for visual consistency with the DistrictsPage rankings
   table — same chip + hover affordance. */

export interface RegionsLeaderboardProps {
  rollups: ReadonlyArray<RegionRollup>
}

type SortKey =
  | 'region'
  | 'districtCount'
  | 'paidClubs'
  | 'totalPayments'
  | 'distinguishedClubs'
  | 'aggregateScore'

type SortDir = 'asc' | 'desc'

const COLUMNS: ReadonlyArray<{
  key: SortKey
  label: string
  align: 'left' | 'right'
}> = [
  { key: 'region', label: 'Region', align: 'left' },
  { key: 'districtCount', label: 'Districts', align: 'right' },
  { key: 'paidClubs', label: 'Paid Clubs', align: 'right' },
  { key: 'totalPayments', label: 'Payments', align: 'right' },
  { key: 'distinguishedClubs', label: 'Distinguished', align: 'right' },
  { key: 'aggregateScore', label: 'Score', align: 'right' },
]

const compareBy = (key: SortKey, a: RegionRollup, b: RegionRollup): number => {
  if (key === 'region') return Number(a.region) - Number(b.region)
  return (a[key] ?? 0) - (b[key] ?? 0)
}

export const RegionsLeaderboard: React.FC<RegionsLeaderboardProps> = ({
  rollups,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('aggregateScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    const copy = [...rollups]
    copy.sort((a, b) => {
      const cmp = compareBy(sortKey, a, b)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [rollups, sortKey, sortDir])

  if (rollups.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic px-4 py-6">
        No regions to display.
      </p>
    )
  }

  const handleHeaderClick = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      // Default direction per column: region → asc (numeric), others → desc.
      setSortDir(key === 'region' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-sm font-tm-body"
        aria-label="Region rankings"
      >
        <thead className="border-b border-gray-200 dark:border-gray-700">
          <tr>
            {COLUMNS.map(col => {
              const isActive = col.key === sortKey
              const arrow = isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={
                    'px-4 py-3 cursor-pointer select-none text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300 ' +
                    (col.align === 'right' ? 'text-right' : 'text-left')
                  }
                  aria-sort={
                    isActive
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  onClick={() => handleHeaderClick(col.key)}
                >
                  {col.label}
                  {arrow}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.map(r => (
            <tr
              key={r.region}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td className="px-4 py-3 text-left">
                <Link
                  to={`/region/${r.region}`}
                  className="flex items-center gap-3 text-tm-loyal-blue hover:underline"
                >
                  <span
                    className="inline-block px-2 py-0.5 text-xs font-mono rounded bg-tm-loyal-blue/10 text-tm-loyal-blue dark:bg-tm-loyal-blue/30 dark:text-blue-200"
                    aria-hidden="true"
                  >
                    Region {r.region}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 text-xs">
                    leader: {r.leadingDistrictName}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-200">
                {r.districtCount}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-200">
                {r.paidClubs.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-200">
                {r.totalPayments.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-200">
                {r.distinguishedClubs.toLocaleString()}
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  · {Math.round(r.distinguishedPercent)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900 dark:text-gray-50">
                {r.aggregateScore.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
