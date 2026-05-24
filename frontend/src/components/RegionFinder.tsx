import React from 'react'

/* RegionFinder (#685) — a small filter bar above the /regions index so a
   user can jump straight to one region instead of scanning 14 rows
   (Amy: "I have to scroll through each to find region seven").

   "All regions" resets; each numbered chip isolates that region across
   both the leaderboard and the card grid. State is owned by the parent
   page (R3) and threaded into both surfaces as a filter step (R11).

   Styling reuses the token-driven region-chip primitive (see
   .region-finder in app-shell.css) so contrast remaps correctly in dark
   mode without any Tailwind utility-pair asymmetry (Lesson 094). */

export interface RegionFinderProps {
  /** Zero-padded region ids, already sorted numerically. */
  regions: ReadonlyArray<string>
  /** Currently isolated region, or null for "All regions". */
  selected: string | null
  onSelect: (region: string | null) => void
}

export const RegionFinder: React.FC<RegionFinderProps> = ({
  regions,
  selected,
  onSelect,
}) => {
  if (regions.length === 0) return null

  return (
    <div className="region-finder" role="group" aria-label="Find a region">
      <span className="region-finder__label">Find a region:</span>
      <button
        type="button"
        className={
          'region-finder__chip' +
          (selected === null ? ' region-finder__chip--active' : '')
        }
        aria-pressed={selected === null}
        onClick={() => onSelect(null)}
      >
        All regions
      </button>
      {regions.map(region => {
        const isActive = selected === region
        return (
          <button
            key={region}
            type="button"
            className={
              'region-finder__chip' +
              (isActive ? ' region-finder__chip--active' : '')
            }
            aria-pressed={isActive}
            aria-label={`Region ${region}`}
            onClick={() => onSelect(region)}
          >
            {region}
          </button>
        )
      })}
    </div>
  )
}
