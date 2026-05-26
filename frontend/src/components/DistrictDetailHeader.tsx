import React from 'react'
import { DataControlsBar } from './DataControlsBar'
import { HeaderActionsMenu } from './HeaderActionsMenu'
import type { ProgramYear } from '../utils/programYear'

/* District detail page header (#358). Extracted from DistrictDetailPage so
   redesign tests can mount this small component (~50 DOM nodes) instead
   of the entire 1084-line page (~1000+ nodes) — keeps the test suite
   under the 5s testTimeout cap when coverage is enabled.

   Per Epic #352 scope: dynamic Region/clubs/divisions/rank text in the
   lede is deferred to a follow-up sub-issue when the rank/region data
   flow is settled. */

interface DistrictDetailHeaderProps {
  districtId: string
  districtName: string
  selectedProgramYear: ProgramYear
  setSelectedProgramYear: (py: ProgramYear) => void
  availableProgramYears: ProgramYear[]
  selectedDate: string | undefined
  onDateChange: (date: string | undefined) => void
  availableDates: string[]
  latestSnapshotDate: string | undefined
}

export const DistrictDetailHeader: React.FC<DistrictDetailHeaderProps> = ({
  districtId,
  districtName,
  selectedProgramYear,
  setSelectedProgramYear,
  availableProgramYears,
  selectedDate,
  onDateChange,
  availableDates,
  latestSnapshotDate,
}) => {
  return (
    <>
      {/* Breadcrumb removed per #442 — duplicated the AppShell's active
          'Districts' nav tab and the H1 below. The active nav + H1 give
          the user their location without redundant chrome. The
          breadcrumb on Club Detail still provides 'back to district'
          navigation since AppShell has no Club tab. */}
      <div className="district-detail-page-header">
        <div className="district-detail-page-header__intro">
          <p className="district-detail-page-header__eyebrow">
            Program Year {selectedProgramYear.label.replace(/-/g, '–')}
          </p>
          <h1 className="district-detail-page-header__title">{districtName}</h1>
          <p
            className="district-detail-page-header__lede"
            data-testid="district-detail-lede"
          >
            Membership, payments, divisions, and ranking trend for the selected
            program year.
          </p>
        </div>

        <div className="district-detail-page-header__actions">
          <DataControlsBar
            latestSnapshotDate={latestSnapshotDate}
            availableProgramYears={availableProgramYears}
            selectedProgramYear={selectedProgramYear}
            onProgramYearChange={setSelectedProgramYear}
            availableDates={availableDates}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
          <HeaderActionsMenu districtId={districtId} />
        </div>
      </div>
    </>
  )
}
