---
name: Collapse adjacent empty-state panels into a single band
description: When two side-by-side panels both render "All quiet" /
  "None this PY", neither is communicating anything — collapse them
  into one compact band that says it once.
type: feedback
id: '064'
category: lesson
tags: [frontend, css]
auto_load: true
date: 2026-05-21
issues: [551]
---

# Lesson 64 — Collapse adjacent empty-state panels into a single band

**Date:** 2026-05-21
**Issue:** #551 (Distinguished District Status — empty-card collapse)

## What happened

The Overview tab rendered `UpcomingAnniversariesPanel` and
`MilestonesCallout` side-by-side on every page load, regardless of
whether either had any data. Mid-program-year (the common case for
most districts), both were empty:

- Upcoming: "All quiet — no charter dates available."
- Milestones: "None this PY."

Two ~150px panels of identical "nothing to show" copy. ~300px of
vertical real estate communicating the same thing — twice — with no
actionable content. The "All quiet" copy reads as friendly when it's
solo, but as filler when it's stacked.

The fix is **structural, not cosmetic**: a new `NotableDatesSection`
orchestrator decides what to render based on what the panels would
actually produce:

| upcoming  | milestones | render                                                                     |
| --------- | ---------- | -------------------------------------------------------------------------- |
| empty     | empty      | single ~32px "No upcoming anniversaries or milestones for PY YYYY-YY" band |
| populated | empty      | full-width upcoming panel                                                  |
| empty     | populated  | full-width milestones panel                                                |
| populated | populated  | side-by-side grid (as before)                                              |

A 90% reduction in vertical footprint for the common case, and the
remaining single panel can now use full width when one side is
populated — better legibility too.

## How to apply

**When you have a 2-up grid where both halves can be empty
simultaneously, ask: "Is the user better off seeing 'nothing × 2' or
'nothing × 1' or 'nothing × 0'?"** Almost always, the answer is fewer.

Telltale signs:

- Adjacent components render copy that means the same thing in the
  empty case ("All quiet" / "None this PY" / "Nothing to show").
- The parent layout is `grid-cols-2` (or similar) with no
  empty-state coordination.
- One panel's emptiness is independent of the other's, so they hit
  empty/empty/populated/populated × 2 = 4 states; only the
  fully-populated state benefits from side-by-side.

Implementation pattern:

1. Each panel exposes a **predicate helper** (`hasXxxData(input)`)
   that returns boolean using the same data-filtering rules the
   panel's render path uses. **Short-circuit** in the predicate — no
   need to build the full row array if you only need a yes/no.
2. A new orchestrator component runs both predicates, decides the
   render shape, and either renders 0 / 1 / 2 panels.
3. Each panel keeps its existing empty-state internally for callers
   that use it directly — the orchestrator just doesn't reach that
   branch.

Specifically for this codebase:

- The predicate duplicates a small amount of internal computation
  (`hasUpcomingAnniversaries` re-walks the clubs that
  `UpcomingAnniversariesPanel`'s `useMemo` will walk again). That's
  an acceptable tradeoff: the parent rendering an empty container
  with two child panels' empty states inside is worse than two
  passes of a short-circuiting predicate.

## Related

- `frontend/src/components/NotableDatesSection.tsx` — orchestrator
- `frontend/src/components/UpcomingAnniversariesPanel.tsx` —
  exports `hasUpcomingAnniversaries`
- `frontend/src/components/MilestonesCallout.tsx` —
  exports `hasProgramYearMilestones`
- Issue #551 — the design spec with the layout table
- Lesson 63 (#550) — same family of "what is the user actually
  asking?" question applied to chart choice (bullet bar vs four
  parallel progress bars)
