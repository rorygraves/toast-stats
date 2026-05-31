/**
 * DivisionAreaProgressSummary Component
 *
 * Displays all divisions and areas with concise English paragraphs describing their progress
 * toward Distinguished recognition. Divisions are displayed first, followed by their areas.
 *
 * This component provides a narrative view of division and area progress, complementing the
 * tabular view provided by other components. Each division's progress is described
 * in a single paragraph that includes:
 * - Current recognition level achieved (or that it's not yet distinguished)
 * - What's needed to reach the next achievable level
 * - Incremental differences for higher levels (building on previous requirements)
 *
 * Requirements validated:
 * - 10.5: Augment existing AreaProgressSummary to include division progress narratives
 * - 10.6: Division progress narratives appear before area progress narratives
 * - 11.1: Display division progress narratives grouped by division
 * - 11.2: First display the division's progress narrative
 * - 11.3: Then display the area progress narratives for all areas within that division
 * - 11.4: Division narratives use the same paragraph-based format as area narratives
 * - 11.5: Division narratives are visually distinguished from area narratives
 *
 * Brand Guidelines:
 * - Uses TM Loyal Blue (#004165) for headers and primary elements
 * - Uses TM True Maroon (#772432) for emphasis
 * - Uses TM Cool Gray (#A9B2B1) for backgrounds
 * - Minimum 44px touch targets for interactive elements
 * - WCAG AA contrast requirements met
 * - Semantic HTML with appropriate ARIA labels
 */

import React, { useMemo } from 'react'
import { DivisionPerformance, AreaPerformance } from '../utils/divisionStatus'
import { calculateAreaGapAnalysis } from '../utils/areaGapAnalysis'
import { renderRecognitionBadge } from '../utils/areaRecognitionBadge'
import {
  generateAreaProgressText,
  AreaProgressText,
} from '../utils/areaProgressText'
import {
  calculateDivisionGapAnalysis,
  DivisionRecognitionLevel,
} from '../utils/divisionGapAnalysis'
import {
  generateDivisionProgressText,
  DivisionProgressText,
} from '../utils/divisionProgressText'
import { LoadingSkeleton } from './LoadingSkeleton'
import { EmptyState } from './ErrorDisplay'

/**
 * Area performance data with parent division context
 *
 * Extends AreaPerformance with the division ID to provide context
 * when displaying areas outside of their division grouping.
 *
 * @deprecated Use DivisionPerformance[] instead which includes areas
 */
export interface AreaWithDivision extends AreaPerformance {
  /** Parent division identifier */
  divisionId: string
}

/**
 * Props for the DivisionAreaProgressSummary component
 *
 * Requirements: 10.5, 11.1
 */
export interface DivisionAreaProgressSummaryProps {
  /** All divisions with their areas */
  divisions: DivisionPerformance[]
  /** Loading state indicator */
  isLoading?: boolean
}

/**
 * Processed area data for display
 */
interface ProcessedArea {
  area: AreaPerformance
  divisionId: string
  progressText: AreaProgressText
}

/**
 * Division group with processed areas and division progress text
 */
interface DivisionGroup {
  divisionId: string
  division: DivisionPerformance
  divisionProgressText: DivisionProgressText
  areas: ProcessedArea[]
}

/**
 * Get badge styling for division recognition level
 * Uses Toastmasters brand colors with visual distinction from area badges
 *
 * Requirements: 7.1, 7.2, 11.5
 */
const getDivisionRecognitionBadgeClass = (
  level: DivisionRecognitionLevel,
  meetsNoNetLossRequirement: boolean
): string => {
  if (!meetsNoNetLossRequirement) {
    return 'bg-red-100 text-red-800 border-red-300'
  }

  switch (level) {
    case 'presidents':
      return 'bg-tm-happy-yellow text-gray-900 border-yellow-500 font-semibold'
    case 'select':
      return 'bg-tm-cool-gray text-gray-900 border-gray-400'
    case 'distinguished':
      return 'bg-tm-true-maroon text-white border-tm-true-maroon'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300'
  }
}

/**
 * Get display label for division recognition level
 */
const getDivisionRecognitionLabel = (
  level: DivisionRecognitionLevel,
  meetsNoNetLossRequirement: boolean
): string => {
  if (!meetsNoNetLossRequirement) {
    return 'Net Loss'
  }

  switch (level) {
    case 'presidents':
      return "President's Distinguished"
    case 'select':
      return 'Select Distinguished'
    case 'distinguished':
      return 'Distinguished'
    default:
      return 'Not Distinguished'
  }
}

/**
 * DivisionAreaProgressSummary Component
 *
 * Displays all divisions and areas with concise English paragraphs describing their progress
 * toward Distinguished recognition. Divisions are displayed first, followed by their areas.
 *
 * Features:
 * - Division grouping with division narrative first
 * - Semantic HTML (section, article elements)
 * - Progress paragraphs generated using progress text utilities
 * - Loading and empty states
 * - Accessible with proper ARIA attributes
 * - Toastmasters brand styling
 * - Visual distinction between division and area narratives
 *
 * @component
 * @example
 * ```tsx
 * <DivisionAreaProgressSummary
 *   divisions={divisionPerformanceArray}
 *   isLoading={false}
 * />
 * ```
 */
export const DivisionAreaProgressSummary: React.FC<
  DivisionAreaProgressSummaryProps
> = ({ divisions, isLoading = false }) => {
  /**
   * Process divisions and areas: calculate gap analysis, generate progress text
   *
   * Property 7: All divisions displayed exactly once
   * Requirements: 10.5, 11.1, 11.2, 11.3
   */
  const divisionGroups: DivisionGroup[] = useMemo(() => {
    if (isLoading || !divisions || divisions.length === 0) {
      return []
    }

    // Process each division and its areas
    const groups: DivisionGroup[] = divisions.map(division => {
      // Calculate division gap analysis and generate division progress text
      // Requirements: 10.5, 10.6, 11.2
      const divisionGapAnalysis = calculateDivisionGapAnalysis({
        clubBase: division.clubBase,
        paidClubs: division.paidClubs,
        distinguishedClubs: division.distinguishedClubs,
      })

      const divisionProgress = generateDivisionProgressText(
        division,
        divisionGapAnalysis
      )

      // Process areas within this division
      const processedAreas: ProcessedArea[] = division.areas.map(area => {
        const gapAnalysis = calculateAreaGapAnalysis({
          clubBase: area.clubBase,
          paidClubs: area.paidClubs,
          distinguishedClubs: area.distinguishedClubs,
        })

        // Create area with division context for progress text generation.
        // The current-round visit fields (#973) and recognitionState (#832)
        // travel on `area`, so the generator reads them directly (#974).
        const areaWithDivision: AreaWithDivision = {
          ...area,
          divisionId: division.divisionId,
        }

        const progressText = generateAreaProgressText(
          areaWithDivision,
          gapAnalysis
        )

        return {
          area,
          divisionId: division.divisionId,
          progressText,
        }
      })

      // Sort areas within division
      processedAreas.sort((a, b) => a.area.areaId.localeCompare(b.area.areaId))

      return {
        divisionId: division.divisionId,
        division,
        divisionProgressText: divisionProgress,
        areas: processedAreas,
      }
    })

    // Sort divisions alphabetically
    groups.sort((a, b) => a.divisionId.localeCompare(b.divisionId))

    return groups
  }, [divisions, isLoading])

  // Calculate total areas count
  const totalAreas = useMemo(() => {
    return divisionGroups.reduce((sum, group) => sum + group.areas.length, 0)
  }, [divisionGroups])

  // Loading state
  if (isLoading) {
    return (
      <div
        className="redesign-panel"
        role="status"
        aria-label="Loading division and area progress summaries"
        aria-busy="true"
      >
        {/* Header Skeleton */}
        <div className="p-6 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6">
          <LoadingSkeleton variant="text" count={6} />
        </div>

        <span className="sr-only">
          Loading division and area progress summaries...
        </span>
      </div>
    )
  }

  // Empty state
  if (!divisions || divisions.length === 0) {
    return (
      <div className="redesign-panel">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 font-tm-headline">
            Division and Area Progress Summary
          </h3>
          <p className="text-sm text-gray-600 mt-1 font-tm-body">
            Narrative descriptions of each division and area's progress toward
            recognition
          </p>
        </div>

        {/* Empty State */}
        <EmptyState
          title="No Division Data"
          message="No division performance data is available. This may be because no data has been cached yet."
          icon="data"
        />
      </div>
    )
  }

  // Main render
  return (
    <section
      className="redesign-panel"
      aria-label="Division and Area Progress Summary"
      role="region"
    >
      {/* Header */}
      <header className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-tm-headline">
              Division and Area Progress Summary
            </h3>
            <p className="text-sm text-gray-600 mt-1 font-tm-body">
              Narrative descriptions of each division and area's progress toward
              recognition
            </p>
          </div>
          <div className="text-sm text-gray-500 font-tm-body">
            {totalAreas} {totalAreas === 1 ? 'area' : 'areas'} in{' '}
            {divisionGroups.length}{' '}
            {divisionGroups.length === 1 ? 'division' : 'divisions'}
          </div>
        </div>
      </header>

      {/* Division Groups */}
      <div className="divide-y divide-gray-100">
        {divisionGroups.map(group => {
          // Calculate division gap analysis for badge display
          const divisionGapAnalysis = calculateDivisionGapAnalysis({
            clubBase: group.division.clubBase,
            paidClubs: group.division.paidClubs,
            distinguishedClubs: group.division.distinguishedClubs,
          })

          const divisionBadgeClass = getDivisionRecognitionBadgeClass(
            group.divisionProgressText.currentLevel,
            divisionGapAnalysis.meetsNoNetLossRequirement
          )

          const divisionBadgeLabel = getDivisionRecognitionLabel(
            group.divisionProgressText.currentLevel,
            divisionGapAnalysis.meetsNoNetLossRequirement
          )

          return (
            <section
              key={group.divisionId}
              className="p-6"
              aria-labelledby={`division-${group.divisionId}-heading`}
            >
              {/* Division Header */}
              <h4
                id={`division-${group.divisionId}-heading`}
                className="text-lg font-semibold text-tm-loyal-blue font-tm-headline mb-4"
              >
                Division {group.divisionId}
              </h4>

              {/* Division Progress Narrative - Requirements: 10.5, 10.6, 11.2, 11.4, 11.5 */}
              <article
                className="bg-tm-loyal-blue/10 rounded-lg p-4 border-2 border-tm-loyal-blue/30 mb-4"
                aria-labelledby={`division-${group.divisionId}-narrative-heading`}
              >
                {/* Division Narrative Header with Badge */}
                <div className="flex items-center justify-between mb-2">
                  <h5
                    id={`division-${group.divisionId}-narrative-heading`}
                    className="font-bold text-tm-loyal-blue font-tm-headline"
                  >
                    Division {group.divisionId} Progress
                  </h5>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${divisionBadgeClass}`}
                    aria-label={`Division recognition status: ${divisionBadgeLabel}`}
                  >
                    {divisionBadgeLabel}
                  </span>
                </div>

                {/* Division Progress Paragraph */}
                <p
                  className="text-gray-800 font-tm-body leading-relaxed font-medium"
                  style={{ fontSize: '15px' }}
                >
                  {group.divisionProgressText.progressText}
                </p>
              </article>

              {/* Area Articles - Requirements: 11.3 */}
              <div className="space-y-4">
                {group.areas.map(({ area, progressText }) => {
                  // Source-of-truth recognition badge (#832) — deadline-aware
                  // visit gate lives in `deriveAreaRecognitionState`; this is
                  // a pure presenter.
                  const badge = renderRecognitionBadge(area.recognitionState)

                  return (
                    <article
                      key={`${group.divisionId}-${area.areaId}`}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      aria-labelledby={`area-${group.divisionId}-${area.areaId}-heading`}
                    >
                      {/* Area Header with Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <h5
                          id={`area-${group.divisionId}-${area.areaId}-heading`}
                          className="font-semibold text-gray-900 font-tm-headline"
                        >
                          Area {area.areaId}
                        </h5>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${badge.className}`}
                          aria-label={`Recognition status: ${badge.label}`}
                          title={badge.tooltip}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Progress Paragraph */}
                      <p
                        className="text-gray-700 font-tm-body leading-relaxed"
                        style={{ fontSize: '14px' }}
                      >
                        {progressText.progressText}
                      </p>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Footer */}
      <footer className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600 font-tm-body text-center">
          Progress descriptions include current metrics, eligibility status,
          gaps to each recognition level, and club visit completion status.
        </p>
      </footer>
    </section>
  )
}

export default DivisionAreaProgressSummary
