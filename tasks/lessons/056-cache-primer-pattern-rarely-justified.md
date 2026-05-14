---
name: Cache-primer hook calls rarely earn their keep
description:
  Keeping a hook call "for cache warming" usually doesn't pay back the
  cost of the re-render + mapping pass; delete when the only consumer is gone.
type: feedback
---

# Lesson 56 — Cache-primer hook calls rarely earn their keep

**Date:** 2026-05-14
**PR:** #523 (Sprint /sprint addressing #519 #520 #521)

## What happened

While removing the "Analytics" chip on `DistrictsPage.tsx`, the chip's only
consumer was a `useMemo` deriving `trackedDistrictIds` from `useDistricts()`.
Initial GREEN commit kept the bare `useDistricts()` call "as a cache primer
for the rest of the app." Three reviewer agents independently flagged it
as dead weight.

## Why it was dead weight

`useDistricts` has its own queryKey (`['districts']`) distinct from the
rankings query that `DistrictsPage` actually consumes. The hook's downstream
consumers — `DistrictDetailPage`, `ClubDetailPage` — live on different
routes; TanStack Query fetches on mount when they get there regardless.
Priming from the listing page saves at most one network request on the
next navigation (after the 15-min stale window expires), while costing:

- One extra mapping pass over ~117 rankings on this page mount
- A Query subscription that re-renders when the data settles
- Cognitive load for the next reader who wonders why this is here

The math doesn't pay.

## How to apply

**Rule:** When the only consumer of a `useQuery` / `useStore` call is
removed, default to deleting the call. Don't justify keeping it with
"cache priming" or "future-proofing" unless one of these is true:

- A measured hot-path navigation depends on warmed data being available within ~1 frame.
- Multiple pages share the exact same queryKey AND a measurable percentage of users hit them in sequence within the stale window.
- A test or invariant elsewhere depends on the side effect.

**Why:** Cache-primer calls accumulate. Each one keeps a hook alive past
its last real consumer, hiding from greps for "who uses X" and forcing
future refactors to re-derive the justification. The default should be:
delete the call, restore it only if a real consumer reappears and
measurement justifies the cost.

## Related

- PR #523 / commit `65f2be23`
- `frontend/src/pages/DistrictsPage.tsx` — `useDistricts()` removed entirely.
- TanStack Query stale-time / cache-time semantics: a fresh fetch on a
  new mount is the expected behaviour; warming is the exception.
