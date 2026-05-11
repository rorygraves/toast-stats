/* DistinguishedCompositionBar (#360 redesign) — single stacked bar
   showing the breakdown of clubs in each Distinguished tier vs
   not-yet-distinguished, with a legend. Replaces the legacy stack of
   per-tier badges; same data, denser visual. */

import React from 'react'

interface DistinguishedCompositionBarProps {
  smedley: number
  presidents: number
  select: number
  distinguished: number
  totalClubs: number
}

interface Segment {
  key: string
  label: string
  count: number
  /** Tailwind/inline background class for the bar segment. */
  bgClassName: string
  /** Display swatch in the legend (must visually match bg). */
  swatchClassName: string
}

const DistinguishedCompositionBar: React.FC<
  DistinguishedCompositionBarProps
> = ({ smedley, presidents, select, distinguished, totalClubs }) => {
  if (totalClubs <= 0) return null

  const distinguishedTotal = smedley + presidents + select + distinguished
  const notYet = Math.max(0, totalClubs - distinguishedTotal)

  const segments: Segment[] = [
    {
      key: 'smedley',
      label: 'Smedley',
      count: smedley,
      bgClassName: 'bg-tm-true-maroon',
      swatchClassName: 'bg-tm-true-maroon',
    },
    {
      key: 'presidents',
      label: "President's",
      count: presidents,
      bgClassName: 'bg-tm-loyal-blue',
      swatchClassName: 'bg-tm-loyal-blue',
    },
    {
      key: 'select',
      label: 'Select',
      count: select,
      bgClassName: 'bg-tm-loyal-blue-80',
      swatchClassName: 'bg-tm-loyal-blue-80',
    },
    {
      key: 'distinguished',
      label: 'Distinguished',
      count: distinguished,
      bgClassName: 'bg-green-600',
      swatchClassName: 'bg-green-600',
    },
    {
      key: 'notYet',
      label: 'Not yet',
      count: notYet,
      bgClassName: 'bg-gray-200',
      swatchClassName: 'bg-gray-200 border border-gray-300',
    },
  ]

  const distinguishedPct =
    totalClubs > 0 ? Math.round((distinguishedTotal / totalClubs) * 100) : 0

  return (
    <section
      className="redesign-panel"
      aria-labelledby="distinguished-composition-heading"
      data-testid="distinguished-composition"
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2
          id="distinguished-composition-heading"
          className="text-lg font-semibold text-gray-900 font-tm-headline"
        >
          Distinguished Clubs · Composition
        </h2>
        <span className="text-sm text-gray-600 font-tm-body">
          {distinguishedTotal} of {totalClubs} paid ({distinguishedPct}%)
        </span>
      </div>

      <div
        className="flex w-full h-7 rounded-md overflow-hidden border border-gray-200"
        role="img"
        aria-label={`Distinguished club composition: Smedley ${smedley}, President's ${presidents}, Select ${select}, Distinguished ${distinguished}, Not yet ${notYet}, total ${totalClubs}`}
      >
        {segments.map(seg => {
          if (seg.count === 0) return null
          const widthPct = (seg.count / totalClubs) * 100
          return (
            <div
              key={seg.key}
              className={`${seg.bgClassName} flex items-center justify-center text-[11px] font-medium text-white`}
              style={{ width: `${widthPct}%`, minWidth: 0 }}
              title={`${seg.label}: ${seg.count}`}
            >
              {widthPct >= 4 ? seg.count : ''}
            </div>
          )
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-3 list-none text-xs font-tm-body text-gray-700">
        {segments.map(seg => (
          <li key={seg.key} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`inline-block w-3 h-3 rounded-sm ${seg.swatchClassName}`}
            />
            <span>
              {seg.label} · {seg.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default DistinguishedCompositionBar
