---
name: A new district-scoped surface lives next to the data it consumes, not on the page its issue stub guessed
description: #449's stub said "Top-N on /awards page"; the parent epic
  guessed a non-existent "/district/:id/leaderboards" route. Both
  guesses date from before the anniversary surfaces actually shipped
  (#446 UpcomingAnniversariesPanel, #447 MilestonesCallout, #551
  NotableDatesSection). The right landing for a Top-N list keyed on
  ClubTrend.charterDate is the same DistrictDetailPage section that
  already renders those siblings — same data hook, same audience, same
  "recognition planner" purpose. When an issue stub names a location
  that no longer matches reality, trust the data shape over the stub.
type: feedback
---

# Lesson 80 — A new surface lives next to the data it reads

**Date:** 2026-05-22
**Issue:** #449 (Longest-serving clubs leaderboard, epic #443 stretch)

## What happened

#449 was filed during the original anniversary-epic planning (#443) as a
stretch sub-issue, with the placement note "Top-N list on /awards page,
scoped by district." The Sprint 17 plan in epic #574 contradicted that
note with "lands at new /district/:id/leaderboards route from Sprint 3."

Neither was accurate by the time the work landed:

- **No `/district/:id/leaderboards` route exists.** Sprint 3 (#571)
  created `/district/:id/divisions` and `/district/:id/rankings` and
  retired the tab strip — it never created a "leaderboards" route.
- **The /awards page is for competitive district-level standings**
  (Extension / 20+ / Retention awards across the world's 117 districts).
  Mixing a club-level longevity list into it would be a category error
  on the page's audience (district directors looking at peer-district
  comparisons) and on its data shape (district aggregates vs. clubs).

The actual right landing was already obvious once you looked at the
shipped UI: `DistrictDetailPage` has a "Notable Dates" cluster
(`UpcomingAnniversariesPanel` + `MilestonesCallout`, orchestrated by
`NotableDatesSection`) that reads `ClubTrend.charterDate` and is
district-scoped. Top-N longest-serving is the third member of that
cluster — same data, same audience, same recognition-planner intent.

## How to apply

**Rule:** When an issue's "where it goes" hint is stale, place the
surface next to the data it consumes, not where the stub guessed.

**Why:** Issue stubs in long-lived epics are written before the
surrounding UI ships. Six months later, the page named in the stub
may have been retired, renamed, or repurposed. The data is the
durable anchor — the file the new component imports tells you which
page already owns this data flow. Two grep queries (`grep -rn
"<dataField>" frontend/src/pages/`) usually find the right landing in
one shot.

**How to apply:**

1. Identify the new component's primary data source (here:
   `ClubTrend.charterDate`).
2. Grep for existing call sites of that field.
3. The page that already renders sibling surfaces from that field is
   the new component's home — unless the issue's audience is
   demonstrably different.
4. If you have to invent a new route or page, you're probably
   over-scoping the issue.

## Telltale signs the stub's landing is wrong

- The stub names a page that doesn't exist in the current router.
- The stub names a page whose audience differs from the new
  component's user (here: cross-district vs. single-district).
- The stub predates the shipping of sibling surfaces that already
  read the same data field. Check the parent epic's commit history.
- The "new" surface is structurally identical to an existing one (a
  Top-N list reading a single ClubTrend field) — that existing one
  has a home; copy it.

## What we explicitly did NOT do

- Did **not** create a `/district/:id/leaderboards` route. The epic
  body in #574 mentioned one but Sprint 3 never built it. Inventing
  a route just to honor a stub note from a sibling issue would have
  introduced routing surface (legacy redirects, link audits, mobile
  IA changes) for no gain — the DistrictDetailPage section that
  already owns recognition-planner content is the obvious home.
- Did **not** move it to /awards. Awards is competitive district
  standings (Extension / 20+ / Retention) — a different category.
- Did **not** add a "view all" link to a dedicated page. Top-10 is the
  whole feature per the stub; a "view all" page would be future work.

## Related

- `frontend/src/components/LongestServingClubsLeaderboard.tsx` — the
  new component.
- `frontend/src/components/NotableDatesSection.tsx` — sibling
  orchestrator for `UpcomingAnniversariesPanel` + `MilestonesCallout`.
- `frontend/src/utils/clubAnniversary.ts` — shared `getClubAnniversary`
  (`years` field) the leaderboard sorts by.
- Lesson 77 — "presentational extraction: override classes, don't
  invent variants." Same discipline applied at the placement level:
  prefer the obvious landing in existing IA over inventing a new
  route to honor a stale stub.
