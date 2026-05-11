import React from 'react'
import { Tooltip, InfoIcon } from './Tooltip'
import { isLevelAchieved } from '../utils/targetProgressHelpers'

/**
 * Recognition levels for district performance targets
 * Ordered from lowest to highest achievement tier
 */
export type RecognitionLevel =
  | 'distinguished'
  | 'select'
  | 'presidents'
  | 'smedley'

/**
 * Target values for each recognition level
 */
export interface RecognitionTargets {
  distinguished: number
  select: number
  presidents: number
  smedley: number
}

/**
 * Complete ranking data for a metric
 */
export interface MetricRankings {
  worldRank: number | null
  worldPercentile: number | null
  regionRank: number | null
  totalDistricts: number
  totalInRegion: number
  region: string | null
}

/**
 * Color scheme options for the card
 */
export type ColorScheme = 'blue' | 'green' | 'purple'

/**
 * Props for the TargetProgressCard component
 */
export interface TargetProgressCardProps {
  /** Card title */
  title: string
  /** Icon to display */
  icon: React.ReactNode
  /** Current value of the metric */
  current: number
  /** Base value used for target calculation (null if unavailable) */
  base: number | null
  /** Calculated targets for each recognition level (null if base unavailable) */
  targets: RecognitionTargets | null
  /** Highest recognition level achieved (null if none achieved) */
  achievedLevel: RecognitionLevel | null
  /** Ranking data for the metric */
  rankings: MetricRankings
  /** Optional badges to display (e.g., health status badges, distinguished level badges) */
  badges?: React.ReactNode
  /** Color scheme for the card */
  colorScheme: ColorScheme
  /** Tooltip content for the title */
  tooltipContent?: string
}

/**
 * Recognition level display configuration
 */
const RECOGNITION_LEVELS: {
  key: RecognitionLevel
  label: string
  shortLabel: string
}[] = [
  { key: 'distinguished', label: 'Distinguished', shortLabel: 'D' },
  { key: 'select', label: 'Select', shortLabel: 'S' },
  { key: 'presidents', label: "President's", shortLabel: 'P' },
  { key: 'smedley', label: 'Smedley', shortLabel: 'SM' },
]

/**
 * Color scheme configurations
 */
const COLOR_SCHEMES: Record<
  ColorScheme,
  {
    gradient: string
    border: string
    iconBg: string
    iconText: string
    titleText: string
    valueText: string
    progressBg: string
    progressFill: string
    achievedBg: string
    achievedText: string
  }
> = {
  blue: {
    gradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconBg: 'bg-blue-200',
    iconText: 'text-tm-loyal-blue',
    titleText: 'text-tm-loyal-blue',
    valueText: 'text-blue-900',
    progressBg: 'bg-blue-100',
    progressFill: 'bg-tm-loyal-blue',
    achievedBg: 'bg-green-100',
    achievedText: 'text-green-700',
  },
  green: {
    gradient: 'bg-gradient-to-br from-green-50 to-green-100',
    border: 'border-green-200',
    iconBg: 'bg-green-200',
    iconText: 'text-green-700',
    titleText: 'text-green-700',
    valueText: 'text-green-900',
    progressBg: 'bg-green-100',
    progressFill: 'bg-green-600',
    achievedBg: 'bg-green-100',
    achievedText: 'text-green-700',
  },
  purple: {
    gradient: 'tm-bg-loyal-blue-10',
    border: 'border-tm-loyal-blue-20',
    iconBg: 'bg-tm-loyal-blue-20',
    iconText: 'text-tm-loyal-blue',
    titleText: 'text-tm-loyal-blue',
    valueText: 'text-tm-loyal-blue',
    progressBg: 'bg-tm-loyal-blue-10',
    progressFill: 'bg-tm-loyal-blue',
    achievedBg: 'bg-green-100',
    achievedText: 'text-green-700',
  },
}

/** Format number with ordinal suffix (1st, 2nd, 3rd, 4th, ...) */
function ordinalSuffix(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  const mod10 = n % 10
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}

/**
 * Format world percentile as ordinal (e.g., "12th percentile") (#305)
 */
function formatPercentile(percentile: number | null): string {
  if (percentile === null) return '—'
  // percentile is ((total - rank) / total) * 100, so invert to get rank-based
  const rankPercent = Math.round(100 - percentile)
  return `${ordinalSuffix(rankPercent)} percentile`
}

/**
 * TargetProgressCard Component
 *
 * Displays a metric card with progress bars for recognition level targets,
 * world rank, world percentile, and region rank.
 *
 * Requirements: 6.7, 6.8, 6.9
 */
export const TargetProgressCard: React.FC<TargetProgressCardProps> = ({
  title,
  icon,
  current,
  base: _base, // Available for display if needed in future
  targets,
  achievedLevel: _achievedLevel, // Used by isLevelAtOrBelowAchieved helper
  rankings,
  badges,
  colorScheme,
  tooltipContent,
}) => {
  const colors = COLOR_SCHEMES[colorScheme]

  // Suppress unused variable warnings - these are part of the component API
  void _base
  void _achievedLevel

  return (
    <div
      className={`${colors.gradient} rounded-lg p-4 border ${colors.border} relative`}
      data-testid="target-progress-card"
    >
      {/* Top-right rank badge (#360 redesign parity) — promoted from the
          bottom chip for higher visibility per design mockup. Renders only
          when world rank data is available. */}
      {rankings.worldRank !== null && rankings.totalDistricts > 0 && (
        <span
          className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/70 text-gray-700 border border-gray-200 backdrop-blur-sm"
          data-testid="kpi-rank-badge"
          title={`World rank ${rankings.worldRank} out of ${rankings.totalDistricts} districts`}
        >
          #{rankings.worldRank} of {rankings.totalDistricts}
        </span>
      )}

      {/* Header with title, value, and icon */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <p className={`text-sm font-medium ${colors.titleText}`}>{title}</p>
            {tooltipContent && (
              <Tooltip content={tooltipContent}>
                <InfoIcon />
              </Tooltip>
            )}
          </div>
          <p className={`text-3xl font-bold ${colors.valueText} mt-1`}>
            {current.toLocaleString()}
          </p>
        </div>
        <div className={`${colors.iconBg} rounded-full p-3`}>
          <div className={`w-6 h-6 ${colors.iconText}`}>{icon}</div>
        </div>
      </div>

      {/* Rankings display */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {/* World Rank */}
        <Tooltip
          content={
            rankings.worldRank !== null
              ? "District's rank among all districts worldwide (1 = best)"
              : 'Ranking data unavailable - district may not have sufficient data for ranking'
          }
        >
          <span
            className="px-2 py-1 rounded-sm bg-gray-100 text-gray-700"
            data-testid="world-rank"
          >
            World:{' '}
            {rankings.worldRank !== null ? `#${rankings.worldRank}` : '—'}
          </span>
        </Tooltip>

        {/* World Percentile */}
        <Tooltip
          content={
            rankings.worldPercentile !== null
              ? 'Percentage of districts this district outperforms worldwide'
              : 'Percentile data unavailable - requires world rank data'
          }
        >
          <span
            className="px-2 py-1 rounded-sm bg-gray-100 text-gray-700"
            data-testid="world-percentile"
          >
            {formatPercentile(rankings.worldPercentile)}
          </span>
        </Tooltip>

        {/* Region Rank - only show if region is known (Requirement 8.3) */}
        {rankings.region && (
          <Tooltip
            content={
              rankings.regionRank !== null
                ? `District's rank within ${rankings.region} region (1 = best)`
                : `Regional ranking data unavailable for ${rankings.region}`
            }
          >
            <span
              className="px-2 py-1 rounded-sm bg-gray-100 text-gray-700"
              data-testid="region-rank"
            >
              {rankings.region}:{' '}
              {rankings.regionRank !== null ? `#${rankings.regionRank}` : '—'}
            </span>
          </Tooltip>
        )}
      </div>

      {/* Target Progress Bars */}
      {targets ? (
        <div className="mt-3 space-y-2" data-testid="target-progress-bars">
          {RECOGNITION_LEVELS.map(({ key, label }) => {
            const target = targets[key]
            const achieved = isLevelAchieved(key, current, targets)
            const progress = Math.min((current / target) * 100, 100)

            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs w-24 text-gray-600">{label}</span>
                <div
                  className={`flex-1 h-2 ${colors.progressBg} rounded-full overflow-hidden`}
                >
                  <div
                    className={`h-full ${achieved ? 'bg-green-500' : colors.progressFill} transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                    data-testid={`progress-bar-${key}`}
                    data-achieved={achieved}
                  />
                </div>
                <span className="text-xs w-12 text-right text-gray-600">
                  {target.toLocaleString()}
                </span>
                {achieved && (
                  <span
                    className={`${colors.achievedBg} ${colors.achievedText} px-1.5 py-0.5 rounded-sm text-xs`}
                    data-testid={`achieved-indicator-${key}`}
                    aria-label={`${label} target achieved`}
                  >
                    ✓
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-3" data-testid="targets-unavailable">
          <Tooltip content="Base data unavailable for target calculation">
            <span className="text-xs text-gray-500">Targets: N/A</span>
          </Tooltip>
        </div>
      )}

      {/* Badges (existing sub-information) */}
      {badges && (
        <div
          className="mt-3 flex flex-wrap gap-1"
          data-testid="badges-container"
        >
          {badges}
        </div>
      )}
    </div>
  )
}

export default TargetProgressCard
