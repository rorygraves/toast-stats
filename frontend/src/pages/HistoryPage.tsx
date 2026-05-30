import React from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProgramYearSummaries } from '../hooks/useProgramYearSummaries'
import { ProgramYearSummaryCards } from '../components/ProgramYearSummaryCards'
import {
  getCurrentProgramYear,
  formatProgramYearShort,
} from '../utils/programYear'

/* History page (#367, #892). Per-year summary cards — top-5 districts +
   headline metrics for each COMPLETED program year — assembled from existing
   CDN endpoints (dates index → year-end all-districts rankings), newest first.
   Each card links into the landing page filtered to that program year.

   The year strip and card list are data-driven, so years with no snapshot data
   (e.g. the 2021-22 COVID gap) are correctly absent rather than hardcoded. */

const HistoryPage: React.FC = () => {
  useDocumentTitle('Program Year History')
  const { summaries, isLoading, isError } = useProgramYearSummaries()
  const currentPY = getCurrentProgramYear()

  return (
    <div className="placeholder-page">
      <p className="placeholder-page__eyebrow">Program year archive</p>
      <h1 className="placeholder-page__title">Program Year History</h1>
      {/* "What does this page answer?" lede (#879, epic #880 Sprint 3). The
          other doc-style route; one scannable sentence above the year strip. */}
      <p className="long-text-lede" data-testid="history-lede">
        How each completed Toastmasters program year finished — final standings
        frozen at June 30, no retroactive corrections — and which years are on
        file here versus the TI archive.
      </p>

      <div
        className="history-page-year-strip"
        role="list"
        data-testid="history-year-strip"
      >
        <span
          role="listitem"
          className="history-page-year-chip history-page-year-chip--current"
          aria-current="page"
        >
          {formatProgramYearShort(currentPY.year)}
          <span className="history-page-year-chip__live">· LIVE</span>
        </span>
        {summaries.map(s => (
          <span
            key={s.startYear}
            role="listitem"
            className="history-page-year-chip"
          >
            {s.label}
          </span>
        ))}
        <span
          className="history-page-year-chip history-page-year-chip--gap"
          role="listitem"
        >
          earlier · TI archive only
        </span>
      </div>

      <ProgramYearSummaryCards
        summaries={summaries}
        isLoading={isLoading}
        isError={isError}
      />

      <div className="districts-methodology-callout" style={{ marginTop: 32 }}>
        <strong>Pre-2019 data.</strong> Years before 2019 aren’t on file here.
        For those, see the official{' '}
        <a
          href="https://dashboards.toastmasters.org"
          target="_blank"
          rel="noopener noreferrer"
          className="districts-methodology-callout__link"
        >
          Toastmasters International archive
        </a>
        .
      </div>
    </div>
  )
}

export default HistoryPage
