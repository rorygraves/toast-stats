import React from 'react'
import { AreaPerformance } from '../utils/divisionStatus'
import {
  calculateAreaGapAnalysis,
  calculatePaidClubsPercentage,
  calculateDistinguishedPercentage,
} from '../utils/areaGapAnalysis'
import { renderRecognitionBadge } from '../utils/areaRecognitionBadge'

/**
 * Props for the AreaPerformanceTable component
 */
interface AreaPerformanceTableProps {
  /** Array of area performance data to display */
  areas: AreaPerformance[]
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
 * AreaPerformanceTable Component
 *
 * Displays a comprehensive table of area performance metrics within a division.
 * Each row represents a single area and shows:
 * - Area identifier
 * - Paid/Base: paid clubs count vs club base with percentage
 * - Distinguished: distinguished clubs count vs club base with percentage
 * - First Round Visits: first round visit completion status
 * - Second Round Visits: second round visit completion status
 * - Recognition: badge showing current recognition level
 * - Gap to D: distinguished clubs needed for Distinguished
 * - Gap to S: distinguished clubs needed for Select Distinguished
 * - Gap to P: distinguished clubs needed for President's Distinguished
 *
 * The table follows Toastmasters brand guidelines with proper typography,
 * colors, and accessibility features including semantic table structure,
 * proper headers, and minimum touch targets.
 *
 * Requirements:
 * - 9.1: Display columns in order: Area, Paid/Base, Distinguished, First Round Visits,
 *        Second Round Visits, Recognition, Gap to D, Gap to S, Gap to P
 * - 9.2: Paid/Base column shows paid clubs count vs club base with percentage
 * - 9.3: Distinguished column shows distinguished clubs count vs club base with percentage
 * - 9.5: Recognition column displays badge indicating current recognition level
 * - 9.6: Gap columns show number of additional distinguished clubs needed
 * - 6.8: Order areas by area identifier
 * - 8.6: Ensure minimum 44px touch targets for interactive elements
 * - 8.7: Apply responsive table styling
 *
 * @component
 * @example
 * ```tsx
 * <AreaPerformanceTable
 *   areas={[
 *     {
 *       areaId: "A1",
 *       status: "distinguished",
 *       clubBase: 10,
 *       paidClubs: 11,
 *       netGrowth: 1,
 *       distinguishedClubs: 6,
 *       requiredDistinguishedClubs: 5,
 *       firstRoundVisits: { completed: 8, required: 8, percentage: 80, meetsThreshold: true },
 *       secondRoundVisits: { completed: 8, required: 8, percentage: 80, meetsThreshold: true },
 *       isQualified: true
 *     }
 *   ]}
 * />
 * ```
 */
export const AreaPerformanceTable: React.FC<AreaPerformanceTableProps> = ({
  areas,
}) => {
  // Sort areas by area identifier (Requirement 6.8)
  const sortedAreas = [...areas].sort((a, b) =>
    a.areaId.localeCompare(b.areaId)
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead className="bg-tm-cool-gray-10 border-b-2 border-tm-loyal-blue">
          <tr>
            {/* Area column header */}
            <th
              scope="col"
              className="px-4 py-3 text-left font-semibold text-gray-900 font-tm-headline"
              style={{ fontSize: '14px', minHeight: '44px' }}
            >
              Area
            </th>

            {/* Paid/Base column header - Requirement 9.2 */}
            <th
              scope="col"
              className="px-4 py-3 text-center font-tm-headline"
              style={{ minHeight: '44px' }}
            >
              <div
                className="font-semibold text-gray-900"
                style={{ fontSize: '14px' }}
              >
                Paid / Base
              </div>
              <div
                className="font-normal text-gray-500"
                style={{ fontSize: '11px' }}
              >
                (≥ club base required)
              </div>
            </th>

            {/* Distinguished column header - Requirement 9.3 */}
            <th
              scope="col"
              className="px-4 py-3 text-center font-tm-headline"
              style={{ minHeight: '44px' }}
            >
              <div
                className="font-semibold text-gray-900"
                style={{ fontSize: '14px' }}
              >
                Distinguished
              </div>
              <div
                className="font-normal text-gray-500"
                style={{ fontSize: '11px' }}
              >
                (of club base)
              </div>
            </th>

            {/* First Round Visits column header */}
            <th
              scope="col"
              className="px-4 py-3 text-center font-tm-headline"
              style={{ minHeight: '44px' }}
            >
              <div
                className="font-semibold text-gray-900"
                style={{ fontSize: '14px' }}
              >
                First Round Visits
              </div>
              <div
                className="font-normal text-gray-500"
                style={{ fontSize: '11px' }}
              >
                (75% of club base)
              </div>
            </th>

            {/* Second Round Visits column header */}
            <th
              scope="col"
              className="px-4 py-3 text-center font-tm-headline"
              style={{ minHeight: '44px' }}
            >
              <div
                className="font-semibold text-gray-900"
                style={{ fontSize: '14px' }}
              >
                Second Round Visits
              </div>
              <div
                className="font-normal text-gray-500"
                style={{ fontSize: '11px' }}
              >
                (75% of club base)
              </div>
            </th>

            {/* Recognition column header - Requirement 9.5 */}
            <th
              scope="col"
              className="px-4 py-3 text-center font-semibold text-gray-900 font-tm-headline"
              style={{ fontSize: '14px', minHeight: '44px' }}
            >
              Recognition
            </th>

            {/* Gap to D column header - Requirement 9.6 */}
            <th
              scope="col"
              className="px-4 py-3 text-center font-tm-headline"
              style={{ minHeight: '44px' }}
            >
              <div
                className="font-semibold text-gray-900"
                style={{ fontSize: '14px' }}
              >
                Gap to D
              </div>
              <div
                className="font-normal text-gray-500"
                style={{ fontSize: '11px' }}
              >
                (50% of base)
              </div>
            </th>

            {/* Gap to S column header - Requirement 9.6 */}
            <th
              scope="col"
              className="px-4 py-3 text-center font-tm-headline"
              style={{ minHeight: '44px' }}
            >
              <div
                className="font-semibold text-gray-900"
                style={{ fontSize: '14px' }}
              >
                Gap to S
              </div>
              <div
                className="font-normal text-gray-500"
                style={{ fontSize: '11px' }}
              >
                (50% + 1)
              </div>
            </th>

            {/* Gap to P column header - Requirement 9.6 */}
            <th
              scope="col"
              className="px-4 py-3 text-center font-tm-headline"
              style={{ minHeight: '44px' }}
            >
              <div
                className="font-semibold text-gray-900"
                style={{ fontSize: '14px' }}
              >
                Gap to P
              </div>
              <div
                className="font-normal text-gray-500"
                style={{ fontSize: '11px' }}
              >
                (base+1, 50%+1)
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Render row for each area */}
          {sortedAreas.map(area => {
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

            // Source-of-truth recognition badge (#832) — visit-deadline gate
            // lives in `deriveAreaRecognitionState`; this is a pure presenter.
            const badge = renderRecognitionBadge(area.recognitionState)

            return (
              <tr
                key={area.areaId}
                className="hover:bg-gray-50 transition-colors"
              >
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
                    {area.distinguishedClubs}/{area.clubBase}{' '}
                    {distinguishedPercentage}%
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
          })}
        </tbody>
      </table>
    </div>
  )
}
