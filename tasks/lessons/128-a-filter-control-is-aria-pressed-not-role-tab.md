---
id: '128'
category: lesson
tags: [accessibility, frontend, react, ux]
auto_load: true
date: 2026-05-27
issues: [815, 818]
---

# Lesson 128 — A filter control is `aria-pressed`, not `role="tab"` — tabs promise a panel switch

**Date:** 2026-05-27
**Issue:** #815 (epic #818 Sprint 2 — merge the two club-table quick-filter sets)
**PR:** [#829](https://github.com/taverns-red/toast-stats/pull/829)

## What happened

The club table had a status segmented control (All / Thriving / Vulnerable /
Intervention) built as `role="tablist"` with `role="tab"` + `aria-selected`
children (#361), sitting above a separate `aria-pressed` quick-filter chip strip.
Consolidating the two into one preset row (#815) forced the question of which
ARIA model the merged row should use — and surfaced that the tab semantics were
wrong from the start.

`role="tab"` is a promise: a tab controls a `tabpanel` and switching tabs swaps
which panel is shown (`aria-controls` → a region with `role="tabpanel"`). The
status control had **no tabpanels** — it filtered rows in a table that was
always present. A screen-reader user hears "tab, selected" and expects a view to
switch; nothing switches, only the row set narrows. That's a semantic lie.

A filter button toggles membership in a result set. The correct affordance is a
**toggle button**: a plain `<button>` with `aria-pressed={active}`. The intent
chips in the same component already used `aria-pressed` — so unifying the row on
`aria-pressed` both fixed the mis-coded ARIA and made the merged row coherent
(one interaction model, not two).

## The principle

**Before reaching for `role="tab"`/`tablist`, check whether activating the
control switches a _panel_ or merely _filters/transforms_ the content already on
screen.** Tabs are for mutually-exclusive views with their own panels. A control
that filters, sorts, or toggles a facet of one persistent view is a toggle
button — `aria-pressed`, not `aria-selected`. Single-select among several (a
radio-like band) is still a row of `aria-pressed` buttons where activating one
clears the others; you do not need `role="tab"` to express "one at a time."

## How to apply

- `role="tab"` requires a real `tabpanel` it controls. No panel swap ⇒ not a tab.
- Filter / facet / segment controls → `<button aria-pressed>`. It reads as
  "toggle button, pressed/not pressed," which is what a filter is.
- Dropping a `tablist` is usually an a11y _improvement_, not a regression — but
  update any test asserting `getByRole('tablist'|'tab')` to the button role
  (here: `DistrictClubsPage.test.tsx`, `ClubsTable.test.tsx`). The query change
  is the tell that the role was load-bearing in tests, not that you broke a11y.
- When you merge two controls, let the _correct_ model win, don't average them:
  a row mixing `role="tab"` and `aria-pressed` siblings is worse than either.

## Related

- [[052-close-to-distinguished-dual-metric]] — same component family; merging
  surfaces hidden inconsistencies (there: shared label / divergent metric).
- [[127-a-controlled-input-bound-to-an-expensive-filter-drops-fast-keystrokes]] —
  Sprint 1 of the same epic; the dual-engine live smoke against the 162-row
  preview is the verification pattern this sprint reused.
