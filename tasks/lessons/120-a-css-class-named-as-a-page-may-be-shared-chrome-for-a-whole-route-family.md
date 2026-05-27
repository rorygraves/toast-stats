---
id: '120'
category: lesson
tags: [css, frontend, scope, router, architecture]
auto_load: true
date: 2026-05-27
issues: [810, 813]
---

# Lesson 120 — A CSS class named like "a page" may be shared chrome for a whole route family

**Date:** 2026-05-27
**Issue:** #810 (epic #813 Sprint 2 — full-width container policy)
**PR:** [#824](https://github.com/taverns-red/toast-stats/pull/824)

## What happened

ADR-006 §1 said to widen the "data-table page containers" and named two classes:
`.districts-page` and `.district-detail-page`. The obvious reading — and the one
the ADR author wrote — is that `.district-detail-page` _is_ the clubs table page.
A fresh-context review found it isn't: `.district-detail-page` is the shared
wrapper rendered by **seven** distinct district sub-routes
(`DistrictDetailPage`, `DistrictClubsPage`, `DistrictRankingsPage`,
`DistrictDivisionsPage`, `DistrictTrendsPage`, `DistrictChangesPage`,
`DistrictAnalyticsPage`) — clubs/rankings/divisions tables _and_ chart/narrative
pages, all emitting identical `<div className="district-detail-page-root"><div
className="district-detail-page">`. Widening the class to 1600px widens the chart
pages too, which the ADR's own prose carve-out ("narrative pages keep 1280")
argues against.

There was **no CSS-level discriminator** to widen only the clubs table — the
markup is byte-identical across all seven. Scoping to clubs alone would have
required a per-page modifier class, which the AC explicitly forbade ("CSS-level
change via token, no per-component width hacks"). The two spec constraints
collided. The operator resolved it (widen the whole family — most sub-pages are
data-dense, and it's a reversible token, R10), but the collision was invisible
until someone counted the consumers of the class.

## The transferable lesson

**When a ticket or ADR scopes a change by a CSS class and talks about it as "the
X page," verify the class→page cardinality before treating a class-level edit as
page-scoped.** A `.foo-page` class is often shared chrome for an entire route
family, not one screen. `grep -rl 'className="foo-page"' src/pages` answers it in
one command. If the class is shared, a "widen/restyle this page" instruction
silently applies to every sibling route — which may contradict the same spec's
carve-out for the narrative siblings. Surface the cardinality and the resulting
scope decision to the operator rather than guessing; it's cheap to check and
expensive to ship wrong on a foundational sprint others build on.

## How to apply

- Before a class-scoped CSS change described as page-specific, count the
  consumers: `grep -rl 'className="<class>"' src/pages src/components`. >1 hit =
  it's shared; the change is route-family-wide, not page-scoped.
- If the spec names a single page but the class is shared, you usually can't
  honor "no per-component hacks" _and_ "this page only" at once — there's no CSS
  selector for "this route" without a per-page marker. Name the tension; let the
  operator pick (see [[098-curated-lesson-manifest-beats-tag-inference-when-the-operator-knows]] — operator curation wins on scope).
- A fresh-context review is what caught this; the author's mental model had the
  class fused to one page. This is exactly the "obvious to the author" blind spot
  the mandatory review step exists for — don't skip it because the diff is three
  lines.

## Related

- `docs/architecture-decisions/006-data-table-page-layout-and-column-model.md` §1
  — the ADR whose class naming conflated `.district-detail-page` with the clubs
  page; this lesson is the gloss the implementing sprint added.
- [[080-a-district-scoped-surface-lives-next-to-the-data-it-consumes]] — the
  inverse: a surface's _route_ home vs where its issue stub guessed; both are
  "the IA isn't what the ticket's noun implies."
