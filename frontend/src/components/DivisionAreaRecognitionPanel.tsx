/**
 * DivisionAreaRecognitionPanel Component
 *
 * Container component for the Division and Area Recognition section within the Divisions & Areas tab.
 * This component combines the DivisionCriteriaExplanation, CriteriaExplanation, and AreaProgressSummary
 * components to provide a comprehensive view of Distinguished Division Program (DDP) and
 * Distinguished Area Program (DAP) criteria and each division/area's progress toward recognition.
 *
 * Note: The standalone AreaProgressTable has been removed from this panel. Recognition
 * metrics are now displayed in the AreaPerformanceTable within each Division card.
 *
 * Requirements validated:
 * - 10.1: Rename AreaRecognitionPanel to DivisionAreaRecognitionPanel
 * - 10.2: Rename section header from "Area Recognition" to "Division and Area Recognition"
 * - 10.3: Include DivisionCriteriaExplanation component
 * - 10.4: Include existing CriteriaExplanation component for DAP
 * - 10.7: Update all references from "Area Recognition" to "Division and Area Recognition"
 * - 1.1: Display Area Recognition section alongside existing content
 * - 1.2: Position logically within existing tab layout
 * - 1.3: Maintain consistent styling with existing components
 *
 * Architecture:
 * ```
 * DivisionAreaRecognitionPanel (this component)
 * ├── DivisionCriteriaExplanation - DDP criteria and eligibility requirements
 * ├── CriteriaExplanation - DAP criteria and eligibility requirements
 * └── AreaProgressSummary - Area progress with narrative descriptions
 * ```
 *
 * Brand Guidelines:
 * - Uses TM Loyal Blue (#004165) for headers and primary elements
 * - Uses TM True Maroon (#772432) for emphasis
 * - Uses TM Cool Gray (#A9B2B1) for backgrounds
 * - Minimum 44px touch targets for interactive elements
 * - WCAG AA contrast requirements met
 */

import React, { useMemo } from 'react'
import { DivisionPerformance } from '../utils/divisionStatus'
import { DivisionCriteriaExplanation } from './DivisionCriteriaExplanation'
import { CriteriaExplanation } from './CriteriaExplanation'
import { DivisionAreaProgressSummary } from './DivisionAreaProgressSummary'
import { LoadingSkeleton } from './LoadingSkeleton'

/**
 * Props for the DivisionAreaRecognitionPanel component
 */
export interface DivisionAreaRecognitionPanelProps {
  /** Division performance data containing area information */
  divisions: DivisionPerformance[]
  /** Loading state indicator */
  isLoading?: boolean
}

/**
 * DivisionAreaRecognitionPanel Component
 *
 * Main container component for the division and area recognition section. Extracts areas
 * from division performance data and renders the criteria explanation and
 * progress summary components.
 *
 * Features:
 * - Section header with title and description
 * - Division criteria explanation (collapsible) - DDP
 * - Area criteria explanation (collapsible) - DAP
 * - Area progress summary with narrative descriptions
 * - Loading state handling
 * - Empty state handling
 *
 * Note: Recognition metrics table has been moved to AreaPerformanceTable
 * within each Division card (see DivisionPerformanceCard).
 *
 * @component
 * @example
 * ```tsx
 * <DivisionAreaRecognitionPanel
 *   divisions={divisionPerformanceData}
 *   isLoading={false}
 * />
 * ```
 */
export const DivisionAreaRecognitionPanel: React.FC<
  DivisionAreaRecognitionPanelProps
> = ({ divisions, isLoading = false }) => {
  /**
   * Extract all areas from divisions with their parent division context
   *
   * This transforms the nested division/area structure into a flat array
   * of areas with division IDs attached for display in the progress table.
   *
   * Requirement 5.1: Display all areas in the district with their current progress
   */
  const totalAreaCount = useMemo(() => {
    if (isLoading || !divisions || divisions.length === 0) {
      return 0
    }

    return divisions.reduce(
      (count, division) => count + division.areas.length,
      0
    )
  }, [divisions, isLoading])

  // Loading state
  if (isLoading) {
    return (
      <section
        className="space-y-6"
        aria-label="Division and Area Recognition"
        aria-busy="true"
      >
        {/* Section Header Skeleton */}
        <div className="redesign-panel">
          <div className="animate-pulse">
            <div className="h-7 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>

        {/* Criteria Explanation Skeleton */}
        <LoadingSkeleton variant="card" />

        {/* Progress Table Skeleton */}
        <LoadingSkeleton variant="table" count={5} />
      </section>
    )
  }

  // Empty state - no divisions provided
  if (!divisions || divisions.length === 0) {
    return (
      <section className="space-y-6" aria-label="Division and Area Recognition">
        {/* Section Header */}
        <div className="redesign-panel">
          <h2 className="text-2xl font-bold text-gray-900 font-tm-headline">
            Division and Area Recognition
          </h2>
          <p
            className="text-gray-600 mt-1 font-tm-body"
            style={{ fontSize: '14px' }}
          >
            Distinguished Division Program (DDP) and Distinguished Area Program
            (DAP) criteria and progress tracking
          </p>
        </div>

        {/* Empty State Message */}
        <div className="redesign-panel">
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3
              className="font-tm-headline font-semibold text-gray-900 mb-2"
              style={{ fontSize: '18px' }}
            >
              No Division or Area Data Available
            </h3>
            <p
              className="font-tm-body text-gray-600"
              style={{ fontSize: '14px' }}
            >
              Division and area performance data is not available. This may be
              because no data has been cached yet.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Main render - display section with criteria and progress table
  return (
    <section
      className="space-y-6"
      aria-label="Division and Area Recognition"
      role="region"
    >
      {/* Section Header - Requirement 10.2, 10.7: Updated header */}
      <div className="redesign-panel">
        <div className="flex items-center gap-3 mb-2">
          <svg
            className="w-8 h-8 text-tm-loyal-blue flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 font-tm-headline">
            Division and Area Recognition
          </h2>
        </div>
        <p className="text-gray-600 font-tm-body" style={{ fontSize: '14px' }}>
          Track progress toward Distinguished Division Program (DDP) and
          Distinguished Area Program (DAP) recognition. Review the criteria
          below and see how each division and area is performing against the
          requirements for Distinguished, Select Distinguished, and
          President&apos;s Distinguished status.
        </p>
      </div>

      {/* Division Criteria Explanation - Requirements 10.3: DDP criteria */}
      <DivisionCriteriaExplanation defaultExpanded={false} />

      {/* Area Criteria Explanation - Requirements 2, 3, 4 (DAP) - Requirement 10.4 */}
      <CriteriaExplanation defaultExpanded={false} />

      {/* Area Progress Summary - Requirements 5, 6, 10.2, 10.3 */}
      <DivisionAreaProgressSummary divisions={divisions} isLoading={false} />

      {/* Summary Footer - Requirement 1.3: Consistent styling */}
      <div className="redesign-panel">
        <p
          className="font-tm-body text-gray-600 text-center"
          style={{ fontSize: '14px' }}
        >
          Showing {totalAreaCount} area
          {totalAreaCount !== 1 ? 's' : ''} across {divisions.length} division
          {divisions.length !== 1 ? 's' : ''}
        </p>
      </div>
    </section>
  )
}

export default DivisionAreaRecognitionPanel
