import React from 'react'
import { Card } from './ui/Card'
import { toOrdinal } from '../utils/ordinal'

/**
 * Color scheme configuration for RankingCard
 * Maps color scheme names to brand-compliant CSS classes
 */
type ColorScheme = 'blue' | 'green' | 'purple' | 'yellow'

interface ColorSchemeConfig {
  iconBg: string
  iconText: string
  accentBorder: string
}

const colorSchemeMap: Record<ColorScheme, ColorSchemeConfig> = {
  blue: {
    iconBg: 'tm-bg-loyal-blue-10',
    iconText: 'tm-text-loyal-blue',
    accentBorder: 'border-l-[var(--tm-loyal-blue)]',
  },
  green: {
    // Using loyal blue with different opacity for green variant
    // (staying within brand palette)
    iconBg: 'tm-bg-loyal-blue-20',
    iconText: 'tm-text-loyal-blue',
    accentBorder: 'border-l-[var(--tm-loyal-blue)]',
  },
  purple: {
    iconBg: 'tm-bg-true-maroon-10',
    iconText: 'tm-text-true-maroon',
    accentBorder: 'border-l-[var(--tm-true-maroon)]',
  },
  yellow: {
    iconBg: 'tm-bg-happy-yellow-30',
    iconText: 'tm-text-black',
    accentBorder: 'border-l-[var(--tm-happy-yellow)]',
  },
}

export interface RankingCardProps {
  /** Title of the ranking metric (e.g., "Overall Rank", "Paid Clubs") */
  title: string
  /** Current rank position */
  rank: number
  /** Total number of districts being ranked */
  totalDistricts: number
  /** Percentile position (0-100, where lower is better for rankings) */
  percentile: number
  /** Icon to display for this metric */
  icon: React.ReactNode
  /** Color scheme for the card accent */
  colorScheme: ColorScheme
  /** Previous year's rank for showing year-over-year change */
  previousYearRank?: number
  /** Whether the card is in loading state */
  isLoading?: boolean
}

/**
 * RankingCard Component
 *
 * Displays a single ranking metric with rank position, total districts,
 * percentile, and optional year-over-year change indicator.
 *
 * Follows Toastmasters brand guidelines:
 * - Uses brand color palette
 * - Meets WCAG AA contrast requirements
 * - Provides 44px minimum touch targets
 * - Uses Montserrat for headings, Source Sans 3 for body
 */
const RankingCard: React.FC<RankingCardProps> = ({
  title,
  rank,
  totalDistricts,
  percentile,
  icon,
  colorScheme,
  previousYearRank,
  isLoading = false,
}) => {
  const colors = colorSchemeMap[colorScheme]

  // Calculate year-over-year change (negative = improved, positive = declined)
  const yearOverYearChange =
    previousYearRank !== undefined ? previousYearRank - rank : null

  // Format percentile as ordinal (e.g., "12th percentile") (#305)
  const rounded = Math.round(percentile)
  const percentileDisplay = `${toOrdinal(rounded)} percentile`

  if (isLoading) {
    return (
      <Card
        className="animate-pulse border-l-4 border-l-[var(--tm-cool-gray)]"
        role="status"
        aria-busy="true"
        aria-label={`Loading ${title} ranking`}
      >
        <div className="flex items-start gap-4">
          {/* Icon skeleton */}
          <div className="w-12 h-12 tm-bg-cool-gray-30 tm-rounded-md flex-shrink-0" />

          <div className="flex-1 min-w-0">
            {/* Title skeleton */}
            <div className="h-4 tm-bg-cool-gray-30 tm-rounded-sm w-24 mb-3" />

            {/* Rank skeleton */}
            <div className="h-10 tm-bg-cool-gray-30 tm-rounded-sm w-16 mb-2" />

            {/* Total districts skeleton */}
            <div className="h-4 tm-bg-cool-gray-30 tm-rounded-sm w-20 mb-2" />

            {/* Percentile skeleton */}
            <div className="h-5 tm-bg-cool-gray-30 tm-rounded-lg w-16" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`border-l-4 ${colors.accentBorder} hover:shadow-lg transition-shadow duration-200`}
      aria-label={`${title}: Rank ${rank} of ${totalDistricts}, ${percentileDisplay}${yearOverYearChange !== null ? `, ${yearOverYearChange > 0 ? 'improved' : yearOverYearChange < 0 ? 'declined' : 'unchanged'} by ${Math.abs(yearOverYearChange)} positions` : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon container with color scheme background */}
        <div
          className={`w-12 h-12 ${colors.iconBg} tm-rounded-md flex items-center justify-center flex-shrink-0`}
          aria-hidden="true"
        >
          <span className={colors.iconText}>{icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="tm-body-small font-medium tm-text-cool-gray mb-1">
            {title}
          </h3>

          {/* Rank display */}
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="tm-h2 tm-text-black font-bold"
              aria-label={`Rank ${rank}`}
            >
              {rank}
            </span>
            <span className="tm-body-small tm-text-cool-gray">
              of {totalDistricts}
            </span>
          </div>

          {/* Percentile badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 tm-rounded-lg tm-body-small font-medium ${colors.iconBg} ${colors.iconText}`}
              role="status"
              aria-label={percentileDisplay}
            >
              {percentileDisplay}
            </span>

            {/* Year-over-year change indicator */}
            {yearOverYearChange !== null && (
              <YearOverYearIndicator change={yearOverYearChange} />
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Year-over-year change indicator component
 * Shows improvement (negative change = moved up in rank) or decline
 */
interface YearOverYearIndicatorProps {
  change: number
}

const YearOverYearIndicator: React.FC<YearOverYearIndicatorProps> = ({
  change,
}) => {
  // For rankings, positive change means improvement (moved up in rank)
  // e.g., previousRank=20, currentRank=15 → change=5 (improved by 5 positions)
  // negative change means decline (moved down in rank)
  // e.g., previousRank=10, currentRank=15 → change=-5 (declined by 5 positions)
  const isImproved = change > 0
  const isDeclined = change < 0
  const isUnchanged = change === 0

  const getIndicatorStyles = () => {
    if (isImproved) {
      return {
        bgClass: 'tm-bg-loyal-blue-10',
        textClass: 'tm-text-loyal-blue',
        icon: '↑',
        label: 'improved',
      }
    }
    if (isDeclined) {
      return {
        bgClass: 'tm-bg-true-maroon-10',
        textClass: 'tm-text-true-maroon',
        icon: '↓',
        label: 'declined',
      }
    }
    return {
      bgClass: 'tm-bg-cool-gray-20',
      textClass: 'tm-text-cool-gray',
      icon: '→',
      label: 'unchanged',
    }
  }

  const styles = getIndicatorStyles()
  const absoluteChange = Math.abs(change)

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 tm-rounded-lg tm-body-small font-medium ${styles.bgClass} ${styles.textClass}`}
      role="status"
      aria-label={`${styles.label}${!isUnchanged ? ` by ${absoluteChange} position${absoluteChange !== 1 ? 's' : ''}` : ''}`}
    >
      {/* Icon - visible but not read by screen readers */}
      <span className="mr-1" aria-hidden="true">
        {styles.icon}
      </span>
      {/* Text showing change amount */}
      {!isUnchanged && (
        <span>
          {isImproved ? '+' : '-'}
          {absoluteChange}
        </span>
      )}
      {isUnchanged && <span>0</span>}
    </span>
  )
}

export default RankingCard
