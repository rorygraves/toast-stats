import React from 'react'
import { Link } from 'react-router-dom'
import { Tooltip } from './Tooltip'

interface RegionRankChipProps {
  region: string
  regionRank: number | null
}

/**
 * Compact chip rendering a district's region rank ("05: #3"). Links
 * to `/region/<digits>` when the region label contains digits; falls
 * back to a plain span when it doesn't (no route exists for "Unknown"
 * or other non-numeric regions).
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
  const sharedClasses = 'px-2 py-1 rounded-sm bg-gray-100 text-gray-700'
  return (
    <Tooltip content={tooltipContent}>
      {digits ? (
        <Link
          to={`/region/${digits}`}
          className={`${sharedClasses} hover:bg-gray-200`}
          data-testid="region-rank"
          aria-label={`View Region ${digits} overview`}
        >
          {label}
        </Link>
      ) : (
        <span className={sharedClasses} data-testid="region-rank">
          {label}
        </span>
      )}
    </Tooltip>
  )
}

export default RegionRankChip
