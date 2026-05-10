import React, { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ProgramYearSelector } from './ProgramYearSelector'
import { DistrictExportButton } from './DistrictExportButton'
import type { ProgramYear } from '../utils/programYear'
import { formatDisplayDate } from '../utils/dateFormatting'

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
  onDateChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  availableDates: string[]
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
}) => {
  return (
    <>
      <nav aria-label="Breadcrumb" className="district-detail-breadcrumbs">
        <Link to="/" className="district-detail-breadcrumbs__link">
          Districts
        </Link>
        <span
          aria-hidden="true"
          className="district-detail-breadcrumbs__separator"
        >
          ›
        </span>
        <span
          aria-current="page"
          className="district-detail-breadcrumbs__current"
        >
          {districtName}
        </span>
      </nav>

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
          {availableProgramYears.length > 0 && (
            <ProgramYearSelector
              availableProgramYears={availableProgramYears}
              selectedProgramYear={selectedProgramYear}
              onProgramYearChange={setSelectedProgramYear}
              showProgress={false}
            />
          )}
          {availableDates.length > 0 && (
            <div className="flex flex-col gap-1">
              <label htmlFor="global-date-selector" className="sr-only">
                View Specific Date
              </label>
              <select
                id="global-date-selector"
                value={selectedDate || 'latest'}
                onChange={onDateChange}
                className="px-3 py-2 rounded-md text-sm font-tm-body"
                style={{
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                }}
              >
                <option value="latest">Latest in Program Year</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {formatDisplayDate(date)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <DistrictExportButton districtId={districtId} />
          <DistrictShareButton />
        </div>
      </div>
    </>
  )
}

const DistrictShareButton: React.FC = () => {
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API rejects on insecure contexts; swallow silently for v1.
    }
  }, [])

  return (
    <button
      type="button"
      onClick={handleClick}
      className="district-detail-share-button"
    >
      Share
      {copied && (
        <span className="district-detail-share-button__feedback" role="status">
          ✓ link copied
        </span>
      )}
    </button>
  )
}
