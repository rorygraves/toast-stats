# Lesson 085 — A breadcrumb removed to fix a collision on ONE page should not stay removed on pages where the collision can't occur

**Date:** 2026-05-23
**Issue:** #577 (back-to-district breadcrumb on routed sub-pages, epic #568 / #615)
**Tags:** ux, navigation, accessibility, react-router, district-ia

## What happened

#442 removed the breadcrumb from `DistrictDetailHeader` because, on the
district **landing** page (`/district/:id`), the crumb read
`Districts › District 61` and visually collided with the AppShell's active
`Districts` nav tab — redundant chrome saying the same thing twice.

The District IA migration (epic #568) then converted in-tab views into routed
sub-pages (`/clubs`, `/divisions`, `/rankings`, `/club/:cid`). Every sub-page
reuses `DistrictDetailHeader`, so every sub-page **inherited the absence** and
lost any clickable way back to the overview. The stopgap was an ad-hoc
`← Back to {districtName}` button hand-rolled into three pages, plus a weak
`text-gray-500` breadcrumb on ClubDetailPage that skipped the `Clubs` step.

## Root cause / the reframe

The #442 removal was correct **for the page it was reasoning about**, but its
justification didn't generalise. On a sub-page the equivalent crumb is
`District 61 › Clubs` — different words, no duplicate-of-the-nav collision.
A fix scoped to one page's chrome was silently applied to a whole family of
pages that don't share the constraint.

## Fix

One reusable `SubpageBreadcrumb` component (`nav[aria-label=Breadcrumb] > ol`):

- Linked crumbs use the strong `text-tm-loyal-blue` affordance (not the weak
  `text-gray-500` the old crumb used); the final crumb is `aria-current="page"`.
- Sub-pages opt in (`[{ label: districtName, to: /district/:id }]`); the bare
  landing page stays crumbless, preserving #442.
- ClubDetailPage gets the full `District › Clubs › <club>` trail, and the
  `Clubs` crumb round-trips the user's prior filtered list via React Router
  navigation `state` (`fromClubsSearch`), falling back to the unfiltered route
  on deep links.

## How to apply

- **When you remove UI to fix a problem, write down the precondition for the
  problem.** "#442 removed the crumb because it duplicated the nav" is missing
  the load-bearing qualifier: "..._on the landing page, where the nav already
  names this location._" Without the qualifier, the next person reuses the
  component on a page where the precondition is false and inherits a regression.
- **A single-item breadcrumb that is a link (no `aria-current`) is fine** — the
  current page simply isn't represented as a crumb. axe passes. AC's
  "aria-current on the last crumb" applies only when there _is_ a current-page
  crumb (the multi-crumb club-detail trail).
- **Filter round-trip belongs in navigation `state`, not the URL** — it's
  ephemeral context for one back-hop, not a shareable address. Guard the read
  with `typeof === 'string'` so deep links without state degrade gracefully.
- Phase 3 / future routed pages: drop `<SubpageBreadcrumb crumbs={[{ label:
districtName, to: '/district/' + districtId }]} />` under the header. One line.

## Related

- `frontend/src/components/SubpageBreadcrumb.tsx` — the component.
- #442 — original removal (the scoped-but-overgeneralised fix).
- [[080-longest-serving-leaderboard-lives-with-its-data]] — sibling: a surface's
  right home/behaviour comes from current reality, not a stale prior decision.
- Lesson 81 — a removed thing can encode a real constraint; here the constraint
  was real but page-specific, so the removal should have been page-specific too.
