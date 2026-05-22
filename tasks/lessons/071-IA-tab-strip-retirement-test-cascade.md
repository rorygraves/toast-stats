---
name: IA tab-strip retirement deletes more test code than the prod diff
description: When the LAST tab in a tabbed UI gets routed away (so the
  whole DistrictDetailTabs widget disappears), the right move is often
  to delete the integration-tab-flow test files entirely and rely on
  the new route's own page-level tests + the surviving component-level
  tests. Lesson 68 said budget 5–10×; Lesson 71 is the corollary —
  sometimes the "budget" is mostly a delete key.
type: feedback
---

# Lesson 71 — IA tab-strip retirement deletes more test code than the prod diff

**Date:** 2026-05-22
**Issue:** #571 (District IA Phase 3 — route Divisions + Rankings,
delete the tab strip)

## What happened

#571 finished the IA migration started in #569/#570: the district
narrative landing page (`/district/:id`) lost the entire
`DistrictDetailTabs` component. The two remaining destinations
(Divisions, Rankings) each moved to their own route, joining the
already-routed Clubs subview from #570.

The Phase-3 production diff was bounded:

- 2 new pages (`DistrictDivisionsPage`, `DistrictRankingsPage`)
- 2 new narrative components (`DivisionsSummaryNarrative`,
  `VsWorldNarrative`)
- 1 generalised redirect util (`legacyTabRedirect`)
- ~10-line surgery on `DistrictDetailPage` to drop the tab block,
  swap the redirect call, and drop the routed tabpanels
- ~10-line surgery on `DistrictClubsPage` to drop its in-route tab
  strip

So roughly **+300 / -50** net product lines.

The test surface, by contrast, **collapsed by ~2,200 lines** because
three "tab-flow integration" files became obsolete:

| File                                                       | Lines | Disposition                                                                                                               |
| ---------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| `DistrictDetailPage.GlobalRankings.test.tsx`               | 524   | DELETED — covered by `DistrictRankingsPage.test.tsx`                                                                      |
| `DistrictDetailPage.AreaRecognition.integration.test.tsx`  | 931   | DELETED — covered by `DistrictDivisionsPage.test.tsx` smoke + existing `DivisionAreaRecognitionPanel.test.tsx`            |
| `DistrictDetailPage.date-consistency.integration.test.tsx` | 750   | DELETED — date wiring covered by `useDistrictStatistics` hook tests + `DistrictClubsPage` / `DistrictDivisionsPage` smoke |
| `DistrictDetailTabs.test.tsx`                              | 232   | DELETED — component is gone                                                                                               |

The remaining cascades were small surgical patches:

- `AnalyticsTab.test.tsx`: swap "tablist + click Analytics tab" for
  "CTA links rendered with the right hrefs"
- `TrendsTab.test.tsx`: swap the `getByRole('tablist')` mount-marker
  for `getByRole('link', { name: /view all clubs/i })`
- 3 journey tests (`01-NavigationFlow`, `02-AtRiskDiscoveryFlow`,
  `05-DivisionAreaPerformanceFlow`): replace `findByRole('tab', ...)`
  - `click` with `findByRole('link', ...)` + `click` on the new CTAs

## How to apply

**When the LAST tab gets routed away, prefer deletion over rewrite for
"tab-flow integration" test files.** Their entire premise is "the
page composes [these widgets] under a tablist." That premise dies
with the tablist. The widgets themselves still need coverage — but
that's now (1) the destination route's own page test, and (2) the
component-level test that already exists.

The two prerequisites that justify the delete:

1. The destination route has a page-level test that smokes the
   widget's mount path (we added these in #570 and #571).
2. The widget's own component-level test still exists and tests the
   data-flow / a11y / loading states.

If either is missing, write it BEFORE deleting the old integration
file. (We added `DistrictDivisionsPage.test.tsx` and
`DistrictRankingsPage.test.tsx` in earlier commits of this sprint
exactly to satisfy condition 1 before deleting the old files.)

**Don't rewrite a 750-line tab-flow integration file into a 750-line
route-flow integration file.** That just moves the same coupling
problem from one URL to another. The route-page already has its own
test; pile-on of "but does the date selector still flow into the
division panel when the page is loaded via the deep route URL?"
belongs in _one_ hook test (the cache-key includes selectedDate),
not in an integration test that drives a Router and clicks a
selector.

## Telltale signs you are in this situation

- A PR closes the last tab in a tabbed UI.
- The component implementing the tab strip is now unused — `grep -r
ComponentName .` confirms zero callers.
- The integration test file's stated purpose (top of file comment)
  is literally "tests that the X tab integrates with the Y page."
- Each existing tab-integration test has a clear new home:
  - `<TabName>Tab integration` → `DistrictXxxPage.test.tsx` for the
    new route
  - `<Widget> data flow` → `<Widget>.test.tsx` (component-level)
  - Date wiring → `useDistrictXxx.test.tsx` (hook-level)

## Why this is the right move

Lesson 68 (#569) noted the cascade cost of removing tabs from a
tabbed UI: 5–10× the prod diff in test-rewrite churn. Lesson 71 is
the corollary: when the cascade is structural (whole component
goes), most of that 5–10× is **delete**, not rewrite. The remaining
rewrite is small and mechanical.

The product spec doesn't get worse because:

- The shipped widgets are still tested at the component level
- The shipped page flows are still tested via the route page tests
- The legacy URL contract is tested via the redirect util tests

What gets lost: the specific assertion "this widget renders **inside
the District page**." That assertion has decreasing value as the
page IA evolves — every IA move invalidates it. The component is
the unit; the page is the composer. Decouple.

## Related

- Lesson 68 — IA refactors cascade tests; **budget for it**. This
  lesson is the next move once the strip itself is gone.
- `frontend/src/pages/__tests__/DistrictClubsPage.test.tsx` — Phase
  2 reference for a "route-level page test" that covers what the
  old integration tests covered, more compactly.
- `frontend/src/utils/legacyTabRedirect.ts` — Phase 3's redirect
  generalisation. Keep route-rename URL contracts behind a single
  testable util so the redirect logic itself doesn't grow another
  integration test file.
