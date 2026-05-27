# Sprint 3 (#816, epic #818 / Epic-B-B3) — Dedicated Filters panel with instant-apply

**Date:** 2026-05-27 · **Branch:** `sprint-816-filters-panel` (from origin/main 806f3388)

## Goal (from epic #818 + `table-ux-review-2026-05-27.md` §B3)

Replace the hidden per-column header filter dropdowns (each gated behind a ~2.5px
arrow + a mandatory **Apply** button) with **one discoverable Filters panel/drawer
that applies instantly**. Decision Q3 in the review resolved to the **panel/drawer**
direction.

## Scope

**IN:**

- New `FiltersPanel` right-side slide-over drawer (`role="dialog"`, `aria-modal`,
  Escape + backdrop close, focus management, Clear-all).
- Toolbar **Filters (N)** trigger button with active-filter count badge.
- Instant-apply: wire the existing `TextFilter`/`NumericFilter`/`CategoricalFilter`
  `onChange` straight to `setFilter` — **no Apply button**. (Text is already
  debounced 300ms per Lesson 127; numeric/categorical apply on change.)
- `ColumnHeader` → **sort-only** (remove the filter section). The header stops
  being a filter surface so there is exactly one filter mechanism (+ the chips/
  search as shortcuts over the same `filterState`).

**OUT (Sprint 4 / #817):** active-filters summary bar, zero-results-names-the-filter,
URL-syncing the non-status/non-name filters. Existing `status`+`name` URL-sync stays.

## Columns surfaced in the panel

All `filterable: true` columns **except** `name` (owned by the #814 search box).
`yearsChartered` is `filterable:false`. → division, area, status, membership,
membersNeeded, newMembers, octoberRenewals, aprilRenewals, dcpGoals, distinguished,
clubStatus. Flat list in `COLUMN_CONFIGS` order (column **groups** are Epic C, not now).

## Why reuse the existing filter components (architect)

They already implement local-state + debounce (Lesson 127), render-phase prop-sync
(#340), a11y (`aria-pressed`/`role=checkbox`) and token-driven dark mode. The
**Apply button in `ColumnHeader` was the only gate** — the components fire `onChange`
on their own. Reusing them keeps the filter pipeline intact (R11) and avoids a
variant taxonomy (Lesson 077): neutralize the floating-popover chrome via a
panel-scoped CSS override (R10), don't fork the components. Division/Area text
filters get a descriptive `placeholder` (they have no internal label).

## Blast radius (5 cohesive modules, no new deps, reversible)

`filters/FiltersPanel.tsx` (new) · `ClubsTable.tsx` · `ColumnHeader.tsx` ·
`filters/types.ts` (trim `ColumnHeaderProps`) · CSS. Tests: new `FiltersPanel.test`,
update `ColumnHeader.test`, migrate `ColumnHeader.reskin.test` legacy-gray guard onto
the panel, touch `ClubsTable.test`.

## Lessons applied

- **127** controlled-input keystroke drop → reuse the debounced components; verify
  with a live `pressSequentially` dual-engine smoke on the 162-row preview.
- **128** filter control is `aria-pressed`, not `role=tab` — chips already comply;
  drawer toggle is a plain button.
- **126/116/092** dark surfaces use `--surface`-family tokens, not `bg-white`.
- **111** native `<select>` 44px in WebKit — N/A (no native selects added); keep
  trigger/close ≥44px.
- **073/reskin #670** no legacy `*-gray-*` / baked opacity-variant classes in the
  filter chrome — port that guard to the panel.

## Verification

Full FE suite + typecheck/lint, `/simplify`, fresh-context `review`, then dual-engine
(chromium+webkit) Playwright smoke on the PR preview: open drawer → type/select →
assert table re-filters live with no Apply click; screenshot per engine.
