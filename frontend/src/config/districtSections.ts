/* The canonical, ordered list of district section routes, plus the single
   builder for their URLs. Lives in config (not a component) so both the UI
   that renders the nav (DistrictSubnav) and non-UI consumers (errorRecovery's
   route-aware smart recovery, #1012) share one source of truth without a util
   importing from a component. */

export interface DistrictSection {
  /** Visible label. */
  label: string
  /** Path segment appended after /district/:id. '' = the Overview hub. */
  segment: string
}

/* ADR-005 §2 + epic #674 AC1 require every item to be a REAL route — a
   destination-less nav item is the exact tab-like fiction the no-tabs decision
   rejects. `/trends` and `/analytics` joined in Sprint 6 (#680); order follows
   ADR-005 §3 (Overview · Clubs · Divisions · Trends · Analytics · Rankings).
   This const is the single extension point. */
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

/** Build the URL for a district section. Empty segment = the Overview hub. */
export function buildDistrictSectionUrl(
  districtId: string,
  segment: string
): string {
  return segment
    ? `/district/${districtId}/${segment}`
    : `/district/${districtId}`
}
