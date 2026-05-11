import React from 'react'
import { Tooltip, InfoIcon } from './Tooltip'
import type { EducationLevelsTotals } from '../utils/extractEducationLevels'

/* Education Levels rollup card (#426).

   Shows the four bucketed education-award totals for the program year
   alongside the participation rate (clubs with ≥1 award / total clubs).
   No per-Pathway breakdown — TI doesn't publish that in the district
   dashboard, so we don't fake one.

   Skipped from render when total === 0 (per the issue: "Skip if data
   is empty for the snapshot"). */

interface EducationLevelsCardProps {
  totals: EducationLevelsTotals
  /** Show a Loading skeleton instead of the totals. */
  isLoading?: boolean
}

const LEVELS: ReadonlyArray<{
  key: keyof Pick<
    EducationLevelsTotals,
    'level1' | 'level2' | 'level3' | 'level4PathDtm'
  >
  label: string
  description: string
}> = [
  {
    key: 'level1',
    label: 'Level 1',
    description: 'Mastering Fundamentals — first speech project completed.',
  },
  {
    key: 'level2',
    label: 'Level 2',
    description:
      'Learning Your Style — two speech projects + Add. Level 2 awards.',
  },
  {
    key: 'level3',
    label: 'Level 3',
    description: 'Increasing Knowledge — three speech projects completed.',
  },
  {
    key: 'level4PathDtm',
    label: 'Level 4+ · Path · DTM',
    description:
      'Bundled per TI: Level 4 awards, complete Pathway completions, and Distinguished Toastmaster awards. TI does not break out individual pathways in the district dashboard.',
  },
]

export const EducationLevelsCard: React.FC<EducationLevelsCardProps> = ({
  totals,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <section
        className="bg-white rounded-lg p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
        aria-busy="true"
        aria-label="Loading education levels rollup"
      >
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Education Levels
        </p>
        <p className="text-xs text-gray-500 mt-2">Loading…</p>
      </section>
    )
  }

  if (totals.total === 0) return null

  const participationPct =
    totals.totalClubs > 0
      ? Math.round((totals.contributingClubs / totals.totalClubs) * 100)
      : 0

  return (
    <section
      className="bg-white rounded-lg p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
      aria-labelledby="education-levels-card-title"
      aria-label="education levels"
    >
      <header className="mb-3">
        <h3
          id="education-levels-card-title"
          className="flex items-center gap-1 text-sm font-semibold text-gray-800 dark:text-gray-100"
        >
          Education Levels
          <Tooltip content="Total education awards earned this program year, summed across all clubs. Source: clubPerformance.csv columns Level 1s, Level 2s, Level 3s, and the bundled Level 4 / Path Completion / DTM column. TI does not publish per-Pathway breakdowns in the district dashboard.">
            <InfoIcon />
          </Tooltip>
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          <strong className="text-gray-900 dark:text-gray-50">
            {totals.total.toLocaleString()}
          </strong>{' '}
          total awards · {totals.contributingClubs}/{totals.totalClubs} clubs
          earned ≥ 1 ({participationPct}%)
        </p>
      </header>
      <ul className="space-y-2" role="list">
        {LEVELS.map(spec => {
          const count = totals[spec.key]
          const pct =
            totals.total > 0 ? Math.round((count / totals.total) * 100) : 0
          return (
            <li
              key={spec.key}
              className="grid grid-cols-[6.5rem_1fr_5rem] items-center gap-2 text-xs"
            >
              <span className="flex items-center gap-1 text-gray-700 dark:text-gray-200">
                {spec.label}
                <Tooltip content={spec.description}>
                  <InfoIcon />
                </Tooltip>
              </span>
              <span
                className="h-2 rounded-full bg-tm-loyal-blue/80 dark:bg-tm-loyal-blue/60"
                aria-hidden="true"
                style={{ width: `${pct}%` }}
              />
              <span className="text-right text-gray-700 dark:text-gray-200">
                <strong className="text-gray-900 dark:text-gray-50">
                  {count.toLocaleString()}
                </strong>{' '}
                <span className="text-gray-500 dark:text-gray-400">{pct}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
