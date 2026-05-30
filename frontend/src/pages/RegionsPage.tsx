import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCdnRankings } from '../services/cdn'
import { aggregateRegions } from '../utils/aggregateRegions'
import { RegionGrid } from '../components/RegionGrid'
import { RegionFinder } from '../components/RegionFinder'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'
import { useUrlState } from '../hooks/useUrlState'

/* Region selection is URL state (#979) so it survives reload, back, and shared
   links — `?region=07`. Module-level options keep a stable reference so
   useUrlState's value memo isn't busted each render. `null` ("All regions")
   serialises to '' and is dropped from the URL, keeping the default clean. */
const REGION_URL_OPTIONS = {
  parse: (raw: string): string | null => raw || null,
  serialize: (value: string | null): string => value ?? '',
}

/* RegionsPage (#496) — overview of all 14 numbered regions.

   Composes the Sprint A utility + Sprint B components against the
   shared rankings.json feed. No new data; no pipeline changes; the
   /regions surface is purely a client-side grouping of the existing
   per-district feed.

   DNAR (District-Not-Assigned-Region) districts are filtered OUT of
   the grid. When non-zero, they're surfaced as a small footnote so the
   count is visible without polluting the card grid. */

const RegionsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['district-rankings', 'latest'],
    queryFn: async () => {
      const cdn = await fetchCdnRankings()
      return { rankings: cdn.rankings, date: cdn.date }
    },
    staleTime: 15 * 60 * 1000,
  })

  const [selectedRegion, setSelectedRegion] = useUrlState<string | null>(
    'region',
    null,
    REGION_URL_OPTIONS
  )

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
  // stranded on an empty grid — and no setState-in-effect.
  const effectiveRegion =
    selectedRegion && regionIds.includes(selectedRegion) ? selectedRegion : null

  // Filter step (R11): "All" (null) shows every region; a selection isolates
  // one in the grid so the user can jump straight to it instead of scanning
  // all 14 cards (#685).
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

      <section className="my-6" aria-labelledby="regions-grid-heading">
        <h2 id="regions-grid-heading" className="sr-only">
          Region cards
        </h2>
        <RegionGrid rollups={displayedRollups} />
      </section>

      {dnarCount > 0 && (
        <p className="text-xs text-gray-500 theme-dark:text-gray-400 mt-6 italic">
          {dnarCount} district{dnarCount === 1 ? '' : 's'} not yet assigned to a
          region — not shown above.
        </p>
      )}
    </div>
  )
}

export default RegionsPage
