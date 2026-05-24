import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCdnRankings } from '../services/cdn'
import { aggregateRegions } from '../utils/aggregateRegions'
import { RegionsLeaderboard } from '../components/RegionsLeaderboard'
import { RegionGrid } from '../components/RegionGrid'
import { RegionFinder } from '../components/RegionFinder'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'

/* RegionsPage (#496) — overview of all 14 numbered regions.

   Composes the Sprint A utility + Sprint B components against the
   shared rankings.json feed. No new data; no pipeline changes; the
   /regions surface is purely a client-side grouping of the existing
   per-district feed.

   DNAR (District-Not-Assigned-Region) districts are filtered OUT of
   both the leaderboard and the grid. When non-zero, they're surfaced
   as a small footnote so the count is visible without polluting the
   leaderboard. */

const RegionsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['district-rankings', 'latest'],
    queryFn: async () => {
      const cdn = await fetchCdnRankings()
      return { rankings: cdn.rankings, date: cdn.date }
    },
    staleTime: 15 * 60 * 1000,
  })

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const rollups = useMemo(
    () => (data?.rankings ? aggregateRegions(data.rankings) : []),
    [data]
  )

  // Available region ids for the finder, sorted numerically (01, 02, … 14).
  const regionIds = useMemo(
    () => rollups.map(r => r.region).sort((a, b) => Number(a) - Number(b)),
    [rollups]
  )

  // Derive (don't sync) the effective selection: a stale selection that a
  // refetch dropped self-heals to "All" at render time, so the user is never
  // stranded on an empty leaderboard + grid — and no setState-in-effect.
  const effectiveRegion =
    selectedRegion && regionIds.includes(selectedRegion) ? selectedRegion : null

  // Filter step (R11): "All" (null) shows every region; a selection isolates
  // one across both the leaderboard and the grid so the user can jump
  // straight to it instead of scanning all 14 rows (#685).
  const displayedRollups = useMemo(
    () =>
      effectiveRegion
        ? rollups.filter(r => r.region === effectiveRegion)
        : rollups,
    [rollups, effectiveRegion]
  )

  const dnarCount = useMemo(
    () =>
      data?.rankings
        ? data.rankings.filter(r => !/^\d+$/.test(r.region)).length
        : 0,
    [data]
  )

  if (isLoading) return <LoadingSkeleton variant="card" />
  if (error || !data) {
    return (
      <EmptyState
        title="Could not load regions"
        message="The rankings file is unavailable. Try again in a moment."
        icon="data"
      />
    )
  }

  return (
    <div className="app-shell__page">
      <header className="districts-page-header">
        <div className="districts-page-header__intro">
          <p className="districts-page-header__eyebrow">
            All regions · 14 worldwide
          </p>
          <h1 className="districts-page-header__title">Regions</h1>
          <p className="districts-page-header__lede">
            Aggregate ranking of all 14 Toastmasters regions. Click any region
            to drill into its districts.
          </p>
        </div>
      </header>

      <RegionFinder
        regions={regionIds}
        selected={effectiveRegion}
        onSelect={setSelectedRegion}
      />

      <section className="my-6" aria-labelledby="regions-leaderboard-heading">
        <h2 id="regions-leaderboard-heading" className="sr-only">
          Region leaderboard
        </h2>
        <RegionsLeaderboard rollups={displayedRollups} />
      </section>

      <section className="my-8" aria-labelledby="regions-grid-heading">
        <h2
          id="regions-grid-heading"
          className="text-lg font-tm-headline text-gray-900 dark:text-gray-50 mb-3"
        >
          Region cards
        </h2>
        <RegionGrid rollups={displayedRollups} />
      </section>

      {dnarCount > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 italic">
          {dnarCount} district{dnarCount === 1 ? '' : 's'} not yet assigned to a
          region — not shown above.
        </p>
      )}
    </div>
  )
}

export default RegionsPage
