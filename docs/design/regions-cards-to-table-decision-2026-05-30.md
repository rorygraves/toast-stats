# Decision: `/regions` reverts to the leaderboard table; the card grid is removed (epic #970 / #964, #965)

**Date:** 2026-05-30
**Source:** Operator decision 2026-05-30 (epic #970 body).
**Status:** Decided and shipped. The sortable leaderboard table is the **primary and sole** `/regions` view; the 14-KPI-card grid is deleted.

This note records the reversal of an earlier decision so a future sprint does not
relitigate it from the now-stale cards-only state.

## What changed, and what it reverses

The `/regions` overview briefly shipped a **cards-only** layout: the 14 KPI cards
(`RegionGrid`, #495) were the primary view and `RegionLeaderboardTable.tsx` was
deleted under the "CC-9" cleanup (#881 / #937). Epic #970 reverses that:

- **Sprint 1 (#964)** restored the leaderboard as the primary view —
  `RegionsLeaderboard.tsx`, sortable with URL-synced sort state (`?sort=&dir=`)
  on the shared `useUrlSort` + `SortableHeader` infra (#851/#857) — and removed
  the card grid.
- **Sprint 2 (#965)** added the responsive + dark-mode polish: a sticky-left
  Region identity column for the narrow-viewport horizontal scroll, the
  WCAG-AA dark-mode contrast audit extension, and these docs.

## Why a table, not cards

A regional overview's job is **cross-row comparison** — "which region is ahead,
which is behind" — and that comparison lives in columnar alignment across all 14
rows. Collapsing each region into a KPI card destroys the one thing the surface
is for and produces 14 tall blocks you cannot scan against each other
(Lesson 105). The clubs grid cards correctly because each club is browsed
independently; a ranking is not. The earlier cards-only call optimised for an
at-a-glance "dashboard" feel at the cost of the leaderboard's actual purpose.

The mobile-duplication worry that motivated CC-9 / #884 (a table **and** a card
grid both rendering on small screens) is moot here: there is now only one view,
so there is nothing to duplicate. The single table card-collapses into nothing —
it stays a table and scrolls horizontally, non-trap (keyboard-operable scroll
region, sticky Region column, fade cue).

## Consequences

- `RegionGrid.tsx` / the cards path is removed from `/regions`; `RegionsPage`
  renders `RegionFinder` + `RegionsLeaderboard` only.
- The region finder isolates a region **in the leaderboard** (no longer "across
  leaderboard and grid"); selection is URL state (`?region=NN`, #979).
- Product spec updated: Regions Overview now lists the leaderboard as primary and
  marks the card grid removed.

## Related

- Lesson 105 — match the mobile-table pattern to the data's purpose, not a
  sibling's precedent.
- Lesson 126 — the overview table's sticky column re-derives its border
  restoration for the `border-collapse: separate` model.
- ADR 006 (`docs/architecture-decisions/006-data-table-page-layout-and-column-model.md`)
  — the shared data-table direction these region tables feed into.
