import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { DivisionPerformance } from '../utils/divisionStatus'

/* District IA Phase 3 (#571) — inline summary of all divisions on the
   narrative landing page. Shows one row per division (letter, status
   badge, paid/distinguished counts) with a Letter ⇄ Performance sort
   toggle. Links to the dedicated /district/:id/divisions route for the
   full DDP criteria explainer, per-division detail cards, and area
   recognition panel. */

export type DivisionsSort = 'letter' | 'performance'

const STATUS_RANK: Record<DivisionPerformance['status'], number> = {
  'presidents-distinguished': 0,
  'select-distinguished': 1,
  distinguished: 2,
  'not-distinguished': 3,
}

const STATUS_LABEL: Record<DivisionPerformance['status'], string> = {
  'presidents-distinguished': "President's",
  'select-distinguished': 'Select',
  distinguished: 'Distinguished',
  'not-distinguished': 'Not yet',
}

const STATUS_CLASS: Record<DivisionPerformance['status'], string> = {
  'presidents-distinguished':
    'bg-tm-happy-yellow text-tm-black border-yellow-500',
  'select-distinguished': 'bg-tm-cool-gray text-tm-black border-gray-400',
  distinguished: 'bg-tm-true-maroon text-white border-tm-true-maroon',
  'not-distinguished': 'bg-gray-100 text-gray-600 border-gray-300',
}

export interface DivisionsSummaryNarrativeProps {
  districtId: string
  divisions: DivisionPerformance[]
  /** Lets tests override the default ('letter'). */
  defaultSort?: DivisionsSort
}

const DivisionsSummaryNarrative: React.FC<DivisionsSummaryNarrativeProps> = ({
  districtId,
  divisions,
  defaultSort = 'letter',
}) => {
  const [sort, setSort] = useState<DivisionsSort>(defaultSort)

  const sorted = useMemo(() => {
    const copy = [...divisions]
    if (sort === 'letter') {
      copy.sort((a, b) => a.divisionId.localeCompare(b.divisionId))
    } else {
      copy.sort((a, b) => {
        const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status]
        if (rank !== 0) return rank
        // Tiebreak: higher distinguished share wins
        const aShare = a.clubBase > 0 ? a.distinguishedClubs / a.clubBase : 0
        const bShare = b.clubBase > 0 ? b.distinguishedClubs / b.clubBase : 0
        return bShare - aShare
      })
    }
    return copy
  }, [divisions, sort])

  if (divisions.length === 0) return null

  return (
    <section
      aria-labelledby="divisions-summary-heading"
      className="redesign-panel"
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <h2
          id="divisions-summary-heading"
          className="tm-h2 tm-text-loyal-blue font-tm-headline"
        >
          Divisions
        </h2>
        <div
          role="group"
          aria-label="Sort divisions"
          className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm font-tm-body"
        >
          <button
            type="button"
            onClick={() => setSort('letter')}
            aria-pressed={sort === 'letter'}
            className={
              'px-3 py-1.5 min-h-[36px] ' +
              (sort === 'letter'
                ? 'bg-tm-loyal-blue text-white'
                : 'bg-white text-tm-black hover:bg-gray-100')
            }
          >
            Letter
          </button>
          <button
            type="button"
            onClick={() => setSort('performance')}
            aria-pressed={sort === 'performance'}
            className={
              'px-3 py-1.5 min-h-[36px] border-l border-gray-300 ' +
              (sort === 'performance'
                ? 'bg-tm-loyal-blue text-white'
                : 'bg-white text-tm-black hover:bg-gray-100')
            }
          >
            Performance
          </button>
        </div>
      </header>

      <ul
        className="divide-y divide-gray-200"
        aria-label="Division summary list"
      >
        {sorted.map(div => (
          <li
            key={div.divisionId}
            className="flex flex-wrap items-center justify-between gap-2 py-2"
          >
            <span className="font-tm-headline font-semibold tm-text-loyal-blue min-w-[3.5rem]">
              Div {div.divisionId}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${STATUS_CLASS[div.status]}`}
              aria-label={`Status: ${STATUS_LABEL[div.status]}`}
            >
              {STATUS_LABEL[div.status]}
            </span>
            <span className="text-sm font-tm-body tm-text-cool-gray">
              Paid {div.paidClubs}/{div.clubBase}
            </span>
            <span className="text-sm font-tm-body tm-text-cool-gray">
              Dist. {div.distinguishedClubs}/{div.requiredDistinguishedClubs}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 text-right">
        <Link
          to={`/district/${districtId}/divisions`}
          className="text-tm-loyal-blue hover:underline font-tm-headline font-medium"
        >
          See all areas →
        </Link>
      </div>
    </section>
  )
}

export default DivisionsSummaryNarrative
