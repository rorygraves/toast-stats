import React from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/* History page (#367). The 2026 design specifies year-end snapshot
   cards (top 5 districts + headline metrics + notable note) for each
   archived program year. That data is NOT currently fetched on the
   client — it lives in archived snapshots that would need a new GCS
   index endpoint to surface. Filing as a follow-up.

   This v1 ships the page header + year-strip chip row pointing to the
   archive years on file, plus the TI archive callout for pre-2019. */

const PROGRAM_YEARS_ON_FILE = [
  { label: '2025–26', current: true },
  { label: '2024–25' },
  { label: '2023–24' },
  { label: '2022–23' },
  { label: '2021–22' },
  { label: '2020–21' },
  { label: '2019–20' },
]

const HistoryPage: React.FC = () => {
  useDocumentTitle('Program Year History')
  return (
    <div className="placeholder-page">
      <p className="placeholder-page__eyebrow">
        Archive · {PROGRAM_YEARS_ON_FILE.length} program years on file
      </p>
      <h1 className="placeholder-page__title">Program Year History</h1>
      <p className="placeholder-page__body">
        Final standings and headline metrics for each completed Toastmasters
        program year. Data is frozen at June 30; each year is preserved as it
        stood when the year closed — no retroactive corrections.
      </p>

      <div className="history-page-year-strip" role="list">
        {PROGRAM_YEARS_ON_FILE.map(year => (
          <span
            key={year.label}
            role="listitem"
            className={
              'history-page-year-chip' +
              (year.current ? ' history-page-year-chip--current' : '')
            }
            aria-current={year.current ? 'page' : undefined}
          >
            {year.label}
            {year.current && (
              <span className="history-page-year-chip__live">· LIVE</span>
            )}
          </span>
        ))}
        <span
          className="history-page-year-chip history-page-year-chip--gap"
          role="listitem"
        >
          earlier · TI archive only
        </span>
      </div>

      <div className="districts-methodology-callout" style={{ marginTop: 32 }}>
        <strong>Per-year summary cards coming soon.</strong> The full archive UI
        (top 5 districts + headline metrics per year) needs a new year-end
        snapshot endpoint — tracked as a follow-up. For pre-2019 data, see the
        official{' '}
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
