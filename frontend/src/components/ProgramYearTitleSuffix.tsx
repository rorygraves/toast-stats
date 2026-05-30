import React from 'react'
import { formatProgramYearShort } from '../utils/programYear'
import type { ProgramYear } from '../utils/programYear'

/* #890 — mobile-only compact program-year suffix for page-header titles.
   Rendered inside the <h1>; CSS hides it on desktop (where the full
   "Program Year …" eyebrow shows above the title) and reveals it <768px, where
   the eyebrow is hidden — so the title line carries the year and recovers ~80px
   above the fold. Shared by the district-detail and landing headers via the
   single `.page-header__title-py` rule.

   aria-hidden: the heading's accessible name stays the plain title (e.g.
   "District 61" / "District Rankings"); the program year stays available to
   assistive tech via the program-year picker (py-chip) and, on desktop, the
   eyebrow. */
export const ProgramYearTitleSuffix: React.FC<{ programYear: ProgramYear }> = ({
  programYear,
}) => (
  <span
    className="page-header__title-py"
    data-testid="page-header-title-py"
    aria-hidden="true"
  >
    {' · PY '}
    {formatProgramYearShort(programYear.year)}
  </span>
)
