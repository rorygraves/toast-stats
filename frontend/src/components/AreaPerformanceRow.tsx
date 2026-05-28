import React from 'react'
import { AreaPerformance } from '../utils/divisionStatus'
import {
  calculateAreaGapAnalysis,
  calculatePaidClubsPercentage,
  calculateDistinguishedPercentage,
} from '../utils/areaGapAnalysis'
import { renderRecognitionBadge } from '../utils/areaRecognitionBadge'

/**
 * Props for the AreaPerformanceRow component
 */
interface AreaPerformanceRowProps {
  /** Area performance data to display */
  area: AreaPerformance
}

/**
 * Get styling for visit status indicator
 * Meets threshold: TM Loyal Blue, does not meet: TM True Maroon
 */
const getVisitStatusStyle = (meetsThreshold: boolean): string => {
  return meetsThreshold ? 'text-tm-loyal-blue' : 'text-tm-true-maroon'
}

/**
 * Format visit status display
 */
const formatVisitStatus = (
  completed: number,
  required: number,
  meetsThreshold: boolean
): string => {
  return `${completed}/${required} ${meetsThreshold ? '✓' : '✗'}`
}

/**
 * Format gap display - shows the number of additional distinguished clubs needed
 * Returns "-" if level is already achieved, "N/A" if not achievable
 *
 * Requirements: 9.6
 */
const formatGap = (
  distinguishedClubsNeeded: number,
  achieved: boolean,
  achievable: boolean
): string => {
  if (achieved) {
    return '-'
  }
  if (!achievable) {
    return 'N/A'
  }
  return `+${distinguishedClubsNeeded}`
}

/**
 * AreaPerformanceRow Component
 *
 * Displays performance metrics for a single area in a table row format.
 * Shows area identifier, paid/base with percentage, distinguished clubs with percentage,
 * visit completion status for both rounds, recognition badge, and gap analysis.
 *
 * Column Structure (matching AreaPerformanceTable):
 * - Area: Area identifier
 * - Paid/Base: paid clubs count vs club base with percentage
 * - Distinguished: distinguished clubs count vs club base with percentage
 * - First Round Visits: first round visit completion status
 * - Second Round Visits: second round visit completion status
 * - Recognition: badge showing current recognition level
 * - Gap to D: distinguished clubs needed for Distinguished
 * - Gap to S: distinguished clubs needed for Select Distinguished
 * - Gap to P: distinguished clubs needed for President's Distinguished
 *
 * Requirements:
 * - 9.1: Display columns in order: Area, Paid/Base, Distinguished, First Round Visits,
 *        Second Round Visits, Recognition, Gap to D, Gap to S, Gap to P
 * - 9.2: Paid/Base column shows paid clubs count vs club base with percentage
 * - 9.3: Distinguished column shows distinguished clubs count vs club base with percentage
 * - 9.5: Recognition column displays badge indicating current recognition level
 * - 9.6: Gap columns show number of additional distinguished clubs needed
 *
 * @component
 * @example
 * ```tsx
 * <AreaPerformanceRow
 *   area={{
 *     areaId: "A1",
 *     status: "distinguished",
 *     clubBase: 10,
 *     paidClubs: 11,
 *     netGrowth: 1,
 *     distinguishedClubs: 6,
 *     requiredDistinguishedClubs: 5,
 *     firstRoundVisits: { completed: 8, required: 8, percentage: 80, meetsThreshold: true },
 *     secondRoundVisits: { completed: 8, required: 8, percentage: 80, meetsThreshold: true },
 *     isQualified: true
 *   }}
 * />
 * ```
 */
export const AreaPerformanceRow: React.FC<AreaPerformanceRowProps> = ({
  area,
}) => {
  // Calculate gap analysis for this area
  const gapAnalysis = calculateAreaGapAnalysis({
    clubBase: area.clubBase,
    paidClubs: area.paidClubs,
    distinguishedClubs: area.distinguishedClubs,
  })

  // Calculate percentages
  const paidPercentage = calculatePaidClubsPercentage(
    area.clubBase,
    area.paidClubs
  )
  const distinguishedPercentage = calculateDistinguishedPercentage(
    area.clubBase,
    area.distinguishedClubs
  )

  // Source-of-truth recognition badge — deadline-aware visit gate lives in
  // `deriveAreaRecognitionState`. This component is a pure presenter (#832).
  const badge = renderRecognitionBadge(area.recognitionState)

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Area Identifier */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div
          className="font-medium text-gray-900 font-tm-body"
          style={{ fontSize: '14px' }}
        >
          {area.areaId}
        </div>
      </td>

      {/* Paid/Base with percentage - Requirement 9.2 */}
      <td
        className="px-4 py-3 whitespace-nowrap text-center font-tm-body"
        style={{ fontSize: '14px' }}
      >
        <span className="text-gray-900 tabular-nums">
          {area.paidClubs}/{area.clubBase} {paidPercentage}%
        </span>
      </td>

      {/* Distinguished with percentage - Requirement 9.3 */}
      <td
        className="px-4 py-3 whitespace-nowrap text-center font-tm-body"
        style={{ fontSize: '14px' }}
      >
        <span className="text-gray-900 tabular-nums">
          {area.distinguishedClubs}/{area.clubBase} {distinguishedPercentage}%
        </span>
      </td>

      {/* First Round Visit Status */}
      <td
        className="px-4 py-3 whitespace-nowrap text-center font-tm-body"
        style={{ fontSize: '14px' }}
      >
        <span
          className={`font-medium tabular-nums ${getVisitStatusStyle(area.firstRoundVisits.meetsThreshold)}`}
        >
          {formatVisitStatus(
            area.firstRoundVisits.completed,
            area.firstRoundVisits.required,
            area.firstRoundVisits.meetsThreshold
          )}
        </span>
      </td>

      {/* Second Round Visit Status */}
      <td
        className="px-4 py-3 whitespace-nowrap text-center font-tm-body"
        style={{ fontSize: '14px' }}
      >
        <span
          className={`font-medium tabular-nums ${getVisitStatusStyle(area.secondRoundVisits.meetsThreshold)}`}
        >
          {formatVisitStatus(
            area.secondRoundVisits.completed,
            area.secondRoundVisits.required,
            area.secondRoundVisits.meetsThreshold
          )}
        </span>
      </td>

      {/* Recognition Badge - Requirement 9.5 */}
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${badge.className}`}
          aria-label={`Recognition status: ${badge.label}`}
          title={badge.tooltip}
        >
          {badge.label}
        </span>
      </td>

      {/* Gap to D - Requirement 9.6 */}
      <td
        className="px-4 py-3 whitespace-nowrap text-center font-tm-body"
        style={{ fontSize: '14px' }}
      >
        <span className="text-gray-900 tabular-nums">
          {formatGap(
            gapAnalysis.distinguishedGap.distinguishedClubsNeeded,
            gapAnalysis.distinguishedGap.achieved,
            gapAnalysis.distinguishedGap.achievable
          )}
        </span>
      </td>

      {/* Gap to S - Requirement 9.6 */}
      <td
        className="px-4 py-3 whitespace-nowrap text-center font-tm-body"
        style={{ fontSize: '14px' }}
      >
        <span className="text-gray-900 tabular-nums">
          {formatGap(
            gapAnalysis.selectGap.distinguishedClubsNeeded,
            gapAnalysis.selectGap.achieved,
            gapAnalysis.selectGap.achievable
          )}
        </span>
      </td>

      {/* Gap to P - Requirement 9.6 */}
      <td
        className="px-4 py-3 whitespace-nowrap text-center font-tm-body"
        style={{ fontSize: '14px' }}
      >
        <span className="text-gray-900 tabular-nums">
          {formatGap(
            gapAnalysis.presidentsGap.distinguishedClubsNeeded,
            gapAnalysis.presidentsGap.achieved,
            gapAnalysis.presidentsGap.achievable
          )}
        </span>
      </td>
    </tr>
  )
}
