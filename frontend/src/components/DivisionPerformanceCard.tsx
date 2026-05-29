/**
 * DivisionPerformanceCard Component
 *
 * Displays a comprehensive performance card for a single division, combining
 * a division summary section at the top with a detailed area performance table below.
 *
 * This component validates Requirements 1.1, 8.1, 8.7:
 * - 1.1: Display one performance card for each division in the district
 * - 8.1: Use TM Loyal Blue (#004165) for primary elements including headers
 * - 8.7: Ensure minimum 44px touch targets for interactive elements
 *
 * The component uses the Card component from the design system to ensure
 * consistent styling and brand compliance across the application.
 */

import React from 'react'
import { DivisionPerformance } from '../utils/divisionStatus'
import { calculateDivisionGapAnalysis } from '../utils/divisionGapAnalysis'
import DivisionSummary from './DivisionSummary'
import { AreaPerformanceTable } from './AreaPerformanceTable'
import { Card } from './ui/Card/Card'

/**
 * Props for the DivisionPerformanceCard component
 */
export interface DivisionPerformanceCardProps {
  /** Division performance data including summary metrics and area details */
  division: DivisionPerformance
  /** District id — when set, the card heading links to the division page
   *  (CC-7, #872). */
  districtId?: string | undefined
}

/**
 * DivisionPerformanceCard Component
 *
 * Renders a card containing:
 * 1. DivisionSummary at the top - displays division identifier, status badge,
 *    paid clubs progress, and distinguished clubs progress
 * 2. AreaPerformanceTable below - displays detailed performance data for all
 *    areas within the division
 *
 * The card uses the tm-card design system component with default variant and
 * no padding (padding is handled by child components) to ensure consistent
 * styling with other cards in the application.
 *
 * @component
 * @example
 * ```tsx
 * <DivisionPerformanceCard
 *   division={{
 *     divisionId: "A",
 *     status: "distinguished",
 *     clubBase: 50,
 *     paidClubs: 52,
 *     netGrowth: 2,
 *     distinguishedClubs: 26,
 *     requiredDistinguishedClubs: 25,
 *     areas: [...]
 *   }}
 * />
 * ```
 */
export const DivisionPerformanceCard: React.FC<
  DivisionPerformanceCardProps
> = ({ division, districtId }) => {
  // Calculate gap analysis for the division
  // Requirements: 9.1, 9.2, 9.3, 9.4
  const gapAnalysis = calculateDivisionGapAnalysis({
    clubBase: division.clubBase,
    paidClubs: division.paidClubs,
    distinguishedClubs: division.distinguishedClubs,
  })

  return (
    <Card
      variant="default"
      padding="sm"
      className="mb-6"
      aria-label={`Division ${division.divisionId} performance card`}
    >
      {/* Division Summary Section - displays high-level metrics */}
      <DivisionSummary
        divisionId={division.divisionId}
        status={division.status}
        paidClubs={division.paidClubs}
        clubBase={division.clubBase}
        netGrowth={division.netGrowth}
        distinguishedClubs={division.distinguishedClubs}
        requiredDistinguishedClubs={division.requiredDistinguishedClubs}
        gapAnalysis={gapAnalysis}
        to={
          districtId
            ? `/district/${districtId}/division/${division.divisionId}`
            : undefined
        }
      />

      {/* Area Performance Table - displays detailed area metrics */}
      <div className="p-6">
        <AreaPerformanceTable areas={division.areas} />
      </div>
    </Card>
  )
}

export default DivisionPerformanceCard
