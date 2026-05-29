/**
 * DivisionPerformanceCards Component
 *
 * Container component that orchestrates the rendering of division performance cards
 * for all divisions in a district. This component processes district snapshot data
 * and displays comprehensive performance metrics for divisions and their areas.
 *
 * This component validates Requirements 1.1, 1.2, 1.3, 10.3, 10.4:
 * - 1.1: Display one performance card for each division in the district
 * - 1.2: Display all division performance cards simultaneously on the same page
 * - 1.3: Order division performance cards by division identifier
 * - 10.3: Display the timestamp of the current snapshot data
 * - 10.4: Indicate loading state to the user when snapshot data is being refreshed
 *
 * The component uses the extractDivisionPerformance utility to transform raw
 * snapshot data into typed performance structures, then renders a DivisionPerformanceCard
 * for each division.
 */

import React from 'react'
import { extractDivisionPerformance } from '../utils/extractDivisionPerformance'
import { DivisionPerformanceCard } from './DivisionPerformanceCard'
import { formatDisplayDate } from '../utils/dateFormatting'
import { logger } from '../utils/logger'

/**
 * Props for the DivisionPerformanceCards component
 */
export interface DivisionPerformanceCardsProps {
  /** Raw district snapshot data containing division and area information */
  districtSnapshot: unknown
  /** Optional loading state indicator */
  isLoading?: boolean
  /** Optional snapshot timestamp for display */
  snapshotTimestamp?: string
  /** District id — threaded to each card so its heading links to the division
   *  page (CC-7, #872). */
  districtId?: string | undefined
}

/**
 * DivisionPerformanceCards Component
 *
 * Renders a collection of division performance cards with the following features:
 * 1. Snapshot timestamp display at the top
 * 2. Loading state handling
 * 3. Error state handling for invalid data
 * 4. Ordered rendering of division cards (by division identifier)
 * 5. Empty state handling when no divisions are present
 *
 * The component follows the existing patterns in DistrictDetailPage.tsx and uses
 * Toastmasters brand styling (TM Loyal Blue, Montserrat fonts) for consistency.
 *
 * @component
 * @example
 * ```tsx
 * <DivisionPerformanceCards
 *   districtSnapshot={snapshot}
 *   isLoading={false}
 *   snapshotTimestamp="2024-01-15T10:30:00Z"
 * />
 * ```
 */
export const DivisionPerformanceCards: React.FC<
  DivisionPerformanceCardsProps
> = ({ districtSnapshot, isLoading = false, snapshotTimestamp, districtId }) => {
  // Extract division performance data from snapshot
  const divisions = React.useMemo(() => {
    if (isLoading || !districtSnapshot) {
      return []
    }
    try {
      return extractDivisionPerformance(districtSnapshot, snapshotTimestamp)
    } catch (error) {
      logger.error('Error extracting division performance:', error)
      return []
    }
  }, [districtSnapshot, isLoading, snapshotTimestamp])

  // Loading state
  if (isLoading) {
    return (
      <div className="redesign-panel">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-tm-loyal-blue mb-4"></div>
            <p
              className="font-tm-body text-gray-600"
              style={{ fontSize: '14px' }}
            >
              Loading division performance data...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state - invalid or missing data
  if (!districtSnapshot) {
    return (
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3
            className="font-tm-headline font-semibold text-gray-900 mb-2"
            style={{ fontSize: '18px' }}
          >
            No Data Available
          </h3>
          <p
            className="font-tm-body text-gray-600"
            style={{ fontSize: '14px' }}
          >
            District snapshot data is not available. Please try refreshing the
            page.
          </p>
        </div>
      </div>
    )
  }

  // Empty state - no divisions found
  if (divisions.length === 0) {
    return (
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
            No Divisions Found
          </h3>
          <p
            className="font-tm-body text-gray-600"
            style={{ fontSize: '14px' }}
          >
            No division data was found in the district snapshot.
          </p>
        </div>
      </div>
    )
  }

  // Main render - display divisions with timestamp
  return (
    <div className="space-y-6">
      {/* Snapshot Timestamp Header */}
      {snapshotTimestamp && (
        <div className="redesign-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="font-tm-headline font-semibold text-tm-black"
                style={{ fontSize: '18px' }}
              >
                Division & Area Performance
              </h2>
              <p
                className="font-tm-body text-gray-600 mt-1"
                style={{ fontSize: '14px' }}
              >
                Performance metrics for all divisions and areas
              </p>
            </div>
            <div className="text-right">
              <p
                className="font-tm-body text-gray-500 uppercase tracking-wide"
                style={{ fontSize: '12px' }}
              >
                Data as of
              </p>
              <p
                className="font-tm-body font-medium text-gray-900"
                style={{ fontSize: '14px' }}
              >
                {formatDisplayDate(snapshotTimestamp)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Division Performance Cards */}
      <div
        className="space-y-6"
        role="region"
        aria-label="Division performance cards"
      >
        {divisions.map(division => (
          <DivisionPerformanceCard
            key={division.divisionId}
            division={division}
            districtId={districtId}
          />
        ))}
      </div>

      {/* Summary Footer */}
      <div className="redesign-panel">
        <p
          className="font-tm-body text-gray-600 text-center"
          style={{ fontSize: '14px' }}
        >
          Showing {divisions.length} division
          {divisions.length !== 1 ? 's' : ''} with{' '}
          {divisions.reduce((sum, div) => sum + div.areas.length, 0)} total area
          {divisions.reduce((sum, div) => sum + div.areas.length, 0) !== 1
            ? 's'
            : ''}
        </p>
      </div>
    </div>
  )
}

export default DivisionPerformanceCards
