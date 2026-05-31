---
id: '147'
category: lesson
tags: [frontend, react, scope, refactor, verification]
auto_load: true
date: 2026-05-31
issues: [1015, 1008]
---

# Lesson 147 — A reused "parity" surface must render from its own data source, not sit behind a sibling source's emptiness check

**Date:** 2026-05-31
**Issue:** #1015 (epic #1008 Sprint 1 — DivisionPage data parity)
**PR:** #1026

## What happened

The standalone `DivisionPage` showed an ad-hoc KPI strip computed from
`useDistrictAnalytics().allClubs` — a _different_ computation than the Divisions
overview, which renders `extractDivisionPerformance(snapshot)` →
`DivisionPerformanceCard`. The sprint swapped in the shared util + component so
the scoped page matches the overview from one source of truth (R6/R8).

The trap fresh-context review caught: the recognition card is fed by the
**snapshot**, but the page still had an early `return` for
`clubs.length === 0` (from the _other_ source, `allClubs`). So a division with
real snapshot recognition data but zero analytics-club rows — suspended/migrated
clubs, or just a casing skew between the two id fields — rendered a bare "No
clubs found" placeholder and **silently hid the parity card**. The very drift
the sprint existed to kill, reintroduced one layer down: two independent data
sources, one gating the visibility of the other.

A second, smaller version of the same skew: the card matched the division id
case-insensitively while the club filter matched it case-sensitively — so the
two could disagree about which division "exists."

## The transferable principle

When you reuse a shared component to give a scoped page **parity** with a
broader view, the reused surface must render from **the same data source the
original reads**, and its visibility must not be coupled to a _different_
source's emptiness/loading/validity. Audit every early `return` that sits above
the reused surface: if the guard keys off source B but the surface is fed by
source A, the surface vanishes exactly on the rows where A and B disagree —
which is precisely the population a parity feature is supposed to rescue. Render
the reused surface in the main layout; let each _secondary_ section degrade on
its own (here: an inline "no clubs listed" note), not by short-circuiting the
whole page.

## How to apply

- Map each rendered block to the query that feeds it before adding/keeping any
  early return. A guard may only gate blocks fed by _its own_ query.
- When two id fields from two sources are compared, normalize both ends the same
  way (here: `.toUpperCase()` on both the card lookup and the club filter) — a
  lenient match on one path and a strict match on the other is a latent
  divergence.
- Sprints 2–3 of #1008 port the same parity to `AreaPage`; they inherit this —
  feed the area recognition surface from the snapshot and don't gate it behind
  the area's `allClubs` rows.

## Related

- [[117-a-delegate-to-x-ticket-is-a-trap-when-the-two-impls-have-diverged-in-output]]
  — reuse the proven shared core, but verify the two paths actually agree.
- [[052-close-to-distinguished-dual-metric]] — two surfaces sharing a label must
  share a definition; here two surfaces sharing a page must not cross-gate.
