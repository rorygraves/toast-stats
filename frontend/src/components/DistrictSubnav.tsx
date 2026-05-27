import React from 'react'
import { NavLink } from 'react-router-dom'

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

export interface DistrictSection {
  /** Visible label. */
  label: string
  /** Path segment appended after /district/:id. '' = the Overview hub. */
  segment: string
}

/* The canonical, ordered section list. ADR-005 §2 + the epic's AC1 require
   every item to be a REAL route — a destination-less nav item is the exact
   tab-like fiction the no-tabs decision rejects. `/trends` and `/analytics`
   joined in Sprint 6 (#680); order follows ADR-005 §3
   (Overview · Clubs · Divisions · Trends · Analytics · Rankings). This const
   is the single extension point. */
export const DISTRICT_SECTIONS: readonly DistrictSection[] = [
  { label: 'Overview', segment: '' },
  // 'What Changed' (#793, epic #797) — a real route, sits next to Overview as
  // the "since I last looked" companion to the current-state hub.
  { label: 'What Changed', segment: 'changes' },
  { label: 'Clubs', segment: 'clubs' },
  { label: 'Divisions', segment: 'divisions' },
  { label: 'Trends', segment: 'trends' },
  { label: 'Analytics', segment: 'analytics' },
  { label: 'Rankings', segment: 'rankings' },
]

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
          const to = segment
            ? `/district/${districtId}/${segment}`
            : `/district/${districtId}`
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
