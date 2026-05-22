import React from 'react'
import { Link } from 'react-router-dom'
import { Tooltip } from './Tooltip'

interface RegionRankChipProps {
  region: string
  regionRank: number | null
}

/**
 * Inline region rank ("05: #3"). Links to `/region/<digits>` when the
 * region label contains digits; falls back to a plain span when it
 * doesn't (no route exists for "Unknown" / other non-numeric regions).
 * Renders as inline text — no chip background — so it sits alongside
 * the other rank-line elements (world rank, percentile) at equal
 * visual weight.
 */
export const RegionRankChip: React.FC<RegionRankChipProps> = ({
  region,
  regionRank,
}) => {
  const digits = String(region).match(/\d+/)?.[0]
  const tooltipContent =
    regionRank !== null
      ? `District's rank within ${region} region (1 = best)`
      : `Regional ranking data unavailable for ${region}`
  const label = (
    <>
      {region}: {regionRank !== null ? `#${regionRank}` : '—'}
    </>
  )
  return (
    <Tooltip content={tooltipContent}>
      {digits ? (
        <Link
          to={`/region/${digits}`}
          className="text-tm-loyal-blue hover:underline"
          data-testid="region-rank"
          aria-label={`View Region ${digits} overview`}
        >
          {label}
        </Link>
      ) : (
        <span data-testid="region-rank">{label}</span>
      )}
    </Tooltip>
  )
}

export default RegionRankChip
