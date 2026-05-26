# Sprint 4 (#678) — Secondary route-nav primitive

Epic #674. Implements ADR-005 decision 3. Branch: `feat/678-secondary-route-nav` (from origin/main, R19).

## Decision: ship 4 live routes now, not 6

ADR-005 §2 + AC1 ("every item navigates to a real route") forbid a destination-less
nav item — that is the exact "tab-like fiction" the no-tabs decision rejects. `/trends`
and `/analytics` routes are created in Sprint 6 (#680). So `DISTRICT_SECTIONS` lists the
4 routes that exist today (Overview · Clubs · Divisions · Rankings); #680 inserts Trends +
Analytics when it lands the routes. No `--soon` placeholder (also destination-less).

## Component

`frontend/src/components/DistrictSubnav.tsx` — NEW, distinct from `SubpageBreadcrumb`.

- `nav[aria-label="District sections"] > ul` of React-Router `<NavLink>`s (ADR §3 ARIA contract).
- `NavLink` auto-sets `aria-current="page"`; `end` on Overview so it's active only at exact hub.
- Module const `DISTRICT_SECTIONS` drives the list (one place for #680 to extend).
- CSS `frontend/src/styles/components/district-subnav.css` (redesign tokens, dark-aware like app-shell):
  active = `--loyal-500` text + 2px bottom-border (not colour alone, WCAG 1.4.1);
  `min-height:44px` touch target; horizontal scroll via `overflow-x:auto` + `min-width:max-content`;
  `:focus-visible` outline.

## Placement

- Hub `DistrictDetailPage`: after `<DistrictDetailHeader>`, before KPI strip.
- `DistrictClubsPage` / `DistrictDivisionsPage` / `DistrictRankingsPage`: after `<SubpageBreadcrumb>`.
- Leaf `ClubDetailPage`: NO subnav (ADR §3 — it is a leaf, keeps its full breadcrumb).

## TDD

1. Red — `DistrictSubnav.test.tsx`: nav label, 4 hrefs, active aria-current per route, Overview `end`, axe clean.
2. Green — component + CSS.
3. Wire into 4 pages; add one `nav[aria-label="District sections"]` smoke assertion per page test.
4. Verify — full suite; /simplify; review; Playwright on preview (chromium+webkit) at 375/768/1280 light+dark.

## Lessons in play

058 (focus visibility on nav), 085 (breadcrumb vs subnav distinct affordances), 105 (non-trap
scroll — links are focusable so no role=region needed), 106 (no `Closes #N`; close manually last).
</content>
