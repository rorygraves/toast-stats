# Plan — #577 Back-to-district breadcrumb on routed sub-pages

## Problem (regression from #570)

Routed district sub-pages (`/district/:id/clubs|divisions|rankings`) and
`/district/:id/club/:cid` lost a clear, clickable way back to the district
overview. Today each sub-page has an ad-hoc `← Back to {districtName}` button
(inconsistent, not a breadcrumb); ClubDetailPage has a visually weak
`text-gray-500` breadcrumb that skips the `Clubs` step, plus a redundant bottom
"Back to District" button.

## Design (UX persona)

One reusable accessible component, `SubpageBreadcrumb`:

- `<nav aria-label="Breadcrumb"><ol>` of crumbs.
- Each crumb: `{ label, to?, state? }`. A crumb with `to` renders a `<Link>`
  (styled `text-tm-loyal-blue hover:text-tm-loyal-blue-80`, strong affordance).
  The final crumb with no `to` renders `<span aria-current="page">`.
- `›` separators are `aria-hidden`.

Wiring:

| Page                                          | Crumbs                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/district/:id/clubs` (+ divisions, rankings) | `District 61` → `/district/:id`                                                                               |
| `/district/:id/club/:cid`                     | `District 61` → overview · `Clubs` → `/district/:id/clubs` (with filter round-trip) · `Ottawa Club` (current) |
| `/district/:id` (landing)                     | none (preserve #442)                                                                                          |

Replace the three sub-pages' `← Back to` button navs and ClubDetailPage's weak
breadcrumb + bottom button with `SubpageBreadcrumb`. One back affordance.

### Filter round-trip

`ClubsTable` row click → `DistrictClubsPage.handleClubClick` passes
`{ state: { fromClubsSearch: location.search } }` to `navigate`. ClubDetailPage's
`Clubs` crumb prefers `state.fromClubsSearch`, falls back to `/district/:id/clubs`.

## TDD steps

1. RED: `SubpageBreadcrumb.test.tsx` — renders crumbs, link hrefs, aria-current
   on last, nav aria-label, separators, axe pass. → component (GREEN).
2. RED: ClubDetailPage breadcrumb shows 3 crumbs incl. `Clubs` link; bottom
   button removed. → wire (GREEN).
3. RED: DistrictClubsPage shows single `District 61` crumb (replaces back btn).
   → wire (GREEN). Divisions/Rankings analogous.
4. RED: filter round-trip — Clubs crumb href carries search when state present.
   → wire ClubsTable + ClubDetailPage (GREEN).
5. Refactor / /simplify / review / push / CI / live verify.
6. Lesson in `tasks/lessons/` for Phase 3 (#571) reuse.

## Acceptance criteria → test mapping

- AC1 clubs crumb → DistrictClubsPage test
- AC2 club-detail trail + filter round-trip → ClubDetailPage test
- AC3 strong styling → component test (link class)
- AC4 bottom button removed → ClubDetailPage test (queryBy absent)
- AC5 no crumb on landing → DistrictDetailPage unaffected (no SubpageBreadcrumb)
- AC6 axe → component test
- AC7 pattern doc → lesson file
