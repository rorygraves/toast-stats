import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  DISTRICT_SECTIONS,
  buildDistrictSectionUrl,
} from '../config/districtSections'

/* #678 (epic #674 Sprint 4) — District secondary route-nav primitive.

   ADR-005 decision 3: a NEW lateral section-nav, deliberately DISTINCT from
   `SubpageBreadcrumb` (#577 / Lesson 085). They are different affordances with
   different ARIA contracts and must not be conflated:
     - Breadcrumb = vertical hierarchy ("where am I": District 61 › Clubs),
       `nav[aria-label="Breadcrumb"]`, aria-current on the LAST crumb,
       landing-opt-OUT.
     - Subnav    = lateral view-switching ("jump to a sibling view"),
       `nav[aria-label="District sections"]`, aria-current on the ACTIVE route,
       landing-opt-IN (renders on the hub AND every flat sub-page).

   The leaf ClubDetailPage is NOT a sibling section view — it keeps its full
   breadcrumb trail and does NOT get the subnav.

   Mobile: a horizontally-scrollable link ROW at all widths (ADR §3 / handoff
   §126), NOT a <select> — keeping the sibling views visible preserves the
   "every item is a visible route" intent. The links are natively focusable, so
   keyboard users tab through them (the focused link scrolls into view); the
   scroll container needs no role="region" (cf. Lesson 105, which applies to
   non-focusable table scrolls). */

/* The canonical section list (`DISTRICT_SECTIONS`) and its URL builder now live
   in `config/districtSections` — the single source of truth shared with the
   route-aware error recovery (#1012), so a util no longer imports from this
   component. */

interface DistrictSubnavProps {
  districtId: string
}

export const DistrictSubnav: React.FC<DistrictSubnavProps> = ({
  districtId,
}) => {
  return (
    <nav
      aria-label="District sections"
      className="district-subnav"
      data-testid="district-subnav"
    >
      <ul className="district-subnav__list">
        {DISTRICT_SECTIONS.map(({ label, segment }) => {
          const to = buildDistrictSectionUrl(districtId, segment)
          return (
            <li key={label} className="district-subnav__item">
              <NavLink
                to={to}
                // `end` so Overview is active ONLY at the exact hub URL, not on
                // every /district/:id/* sub-route (NavLink prefix-matches).
                end={segment === ''}
                className="district-subnav__link"
              >
                {label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default DistrictSubnav
