import React from 'react'
import { Link } from 'react-router-dom'
import { Tooltip } from './Tooltip'
import type { RegionRollup } from '../utils/aggregateRegions'

/* RegionGrid (#495) — 14 region KPI cards; the sole representation on
   /regions since the duplicate leaderboard table was removed (CC-9, #881).
   Each card is a single clickable link to /region/:n. The
   requirements ribbon surfaces TI's 5 region-level requirements
   (DSP / Training / Mkt Plan / Comm Plan / RA Mtgs) with a small
   tooltip showing the met/total ratio per indicator. */

export interface RegionGridProps {
  rollups: ReadonlyArray<RegionRollup>
}

const REQUIREMENT_LABELS: ReadonlyArray<{
  key: keyof RegionRollup['requirements']
  label: string
}> = [
  { key: 'dspSubmitted', label: 'DSP' },
  { key: 'trainingMet', label: 'Training' },
  { key: 'marketAnalysisSubmitted', label: 'Mkt Plan' },
  { key: 'communicationPlanSubmitted', label: 'Comm Plan' },
  { key: 'regionAdvisorVisitMet', label: 'RA Mtgs' },
]

export const RegionGrid: React.FC<RegionGridProps> = ({ rollups }) => {
  if (rollups.length === 0) return null

  // Default sort (#882): region number ascending. Chosen over a data-driven
  // order (e.g. paid clubs descending) because a navigation grid of the 14
  // fixed regions reads best in a stable, predictable sequence that matches
  // the RegionFinder's numeric order — a metric-ranked order would reshuffle
  // the cards as the season's data shifts. The grid owns this sort so it holds
  // regardless of the order rollups arrive in (don't lean on aggregateRegions'
  // incidental ordering — see RegionGrid.test.tsx #882).
  const sorted = [...rollups].sort(
    (a, b) => Number(a.region) - Number(b.region)
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sorted.map(r => (
        <Link
          key={r.region}
          to={`/region/${r.region}`}
          aria-label={`Region ${r.region} — ${r.districtCount} districts`}
          className="block bg-white theme-dark:bg-gray-800 rounded-lg p-4 border border-gray-200 theme-dark:border-gray-700 hover:border-tm-loyal-blue theme-dark:hover:border-blue-400 hover:shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-tm-loyal-blue"
        >
          <header className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-tm-loyal-blue theme-dark:text-blue-300">
              Region {r.region}
            </p>
            <h3 className="text-sm font-tm-headline text-gray-900 theme-dark:text-gray-50 mt-1">
              leader: {r.leadingDistrictName}
            </h3>
          </header>

          <ul className="grid grid-cols-3 gap-2 text-xs mb-3" role="list">
            <li>
              <span className="block text-gray-500 theme-dark:text-gray-400">
                {r.districtCount} districts
              </span>
            </li>
            <li>
              <span className="block text-gray-900 theme-dark:text-gray-100 font-semibold tabular-nums">
                {r.paidClubs.toLocaleString()}
              </span>
              <span className="block text-gray-500 theme-dark:text-gray-400">
                paid clubs
              </span>
            </li>
            <li>
              <span className="block text-gray-900 theme-dark:text-gray-100 font-semibold tabular-nums">
                {Math.round(r.distinguishedPercent)}%
              </span>
              <span className="block text-gray-500 theme-dark:text-gray-400">
                distinguished
              </span>
            </li>
          </ul>

          <div
            className="flex items-center gap-1 pt-3 border-t border-gray-100 theme-dark:border-gray-700"
            aria-label="Requirements ribbon"
          >
            {REQUIREMENT_LABELS.map(({ key, label }) => {
              const ratio = r.requirements[key]
              const met = ratio.met > 0
              return (
                <Tooltip
                  key={key}
                  content={`${label}: ${ratio.met}/${ratio.total} districts`}
                >
                  <span
                    data-requirement={key}
                    data-met={met}
                    className={
                      'inline-block w-2 h-2 rounded-full ' +
                      (met
                        ? 'bg-green-500 theme-dark:bg-green-400'
                        : 'bg-gray-300 theme-dark:bg-gray-600')
                    }
                  />
                </Tooltip>
              )
            })}
          </div>
        </Link>
      ))}
    </div>
  )
}
