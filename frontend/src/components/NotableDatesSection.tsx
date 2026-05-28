import React, { useMemo } from 'react'
import type { ClubTrend } from '../hooks/useDistrictAnalytics'
import {
  getCurrentProgramYear,
  formatProgramYearShort,
} from '../utils/programYear'
import {
  UpcomingAnniversariesPanel,
  hasUpcomingAnniversaries,
} from './UpcomingAnniversariesPanel'
import {
  MilestonesCallout,
  hasProgramYearMilestones,
} from './MilestonesCallout'
import { MobileDisclosure } from './MobileDisclosure'

export interface NotableDatesSectionProps {
  clubs: ClubTrend[]
  districtId?: string
  /**
   * Program year start year (e.g. 2025 for PY 2025-26). Falls back to
   * the current program year when omitted.
   */
  programYearStart?: number
  /**
   * Reference date for "upcoming" anniversary calculation. Falls back
   * to `now` inside `getClubAnniversary`.
   */
  referenceDate?: Date
}

/**
 * Orchestrates UpcomingAnniversariesPanel and MilestonesCallout:
 *
 * | upcoming | milestones | layout                                    |
 * |----------|------------|-------------------------------------------|
 * | empty    | empty      | single compact band                       |
 * | populated| empty      | full-width upcoming panel                 |
 * | empty    | populated  | full-width milestones panel               |
 * | populated| populated  | side-by-side grid (md+) / stacked (sm)    |
 */
export const NotableDatesSection: React.FC<NotableDatesSectionProps> = ({
  clubs,
  districtId,
  programYearStart,
  referenceDate,
}) => {
  const upcomingPresent = useMemo(
    () => hasUpcomingAnniversaries(clubs, referenceDate),
    [clubs, referenceDate]
  )
  const milestonesPresent = useMemo(
    () => hasProgramYearMilestones(clubs, programYearStart),
    [clubs, programYearStart]
  )

  if (!upcomingPresent && !milestonesPresent) {
    const pyLabel = formatProgramYearShort(
      programYearStart ?? getCurrentProgramYear().year
    )
    return (
      <section
        data-testid="notable-dates-empty-band"
        className="redesign-panel py-2"
        aria-label="No upcoming anniversaries or milestones"
      >
        <p className="text-xs text-gray-500 theme-dark:text-gray-400 font-tm-body">
          <span aria-hidden="true" className="mr-1">
            ○
          </span>
          No upcoming anniversaries or milestones for PY {pyLabel}.
        </p>
      </section>
    )
  }

  // Conditional spreads honor exactOptionalPropertyTypes — passing
  // `{ districtId: undefined }` explicitly violates the panels' optional
  // string props under the project's strict TS config.
  const passthrough = {
    ...(districtId !== undefined && { districtId }),
  }
  const upcomingProps = {
    ...passthrough,
    ...(referenceDate && { referenceDate }),
  }
  const milestoneProps = {
    ...passthrough,
    ...(programYearStart !== undefined && { programYearStart }),
  }

  const sideBySide = upcomingPresent && milestonesPresent

  // The Milestones list is a low "what do I do next" panel on a phone, so
  // it folds behind a disclosure below 768 px (audit §Epic B). The label
  // mirrors the panel's own "Milestones · PY …" header. On desktop
  // MobileDisclosure renders the panel directly, so the side-by-side grid
  // is unchanged. Upcoming anniversaries stays unfolded (#867).
  const milestonesPyLabel = formatProgramYearShort(
    programYearStart ?? getCurrentProgramYear().year
  )

  return (
    <div
      className={
        sideBySide ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6' : ''
      }
    >
      {upcomingPresent && (
        <UpcomingAnniversariesPanel clubs={clubs} {...upcomingProps} />
      )}
      {milestonesPresent && (
        <MobileDisclosure summaryLabel={`Milestones · PY ${milestonesPyLabel}`}>
          <MilestonesCallout clubs={clubs} {...milestoneProps} />
        </MobileDisclosure>
      )}
    </div>
  )
}

export default NotableDatesSection
