# Review & recommendations: district + club tables

**Date:** 2026-05-27 · **Status:** recommendations for operator to turn into epics
**Skills applied:** ron-pm, ron-ux, ron-sa, ron-qe (frameworks read & applied)
**Operator complaints:** column layout, non-full-width, responsive behaviour (both
tables); plus the club table's filter pickers and a confusing _double_ set of quick
filters. **Constraint:** #795 (What Changed Phase 3) is in flight to add **more**
columns to the club table.

---

## 1. What's actually wrong (grounded in code)

### District landing table (`DistrictsPage.tsx`, `app-shell.css`)

- **Width:** `.districts-page { max-width: 1280px }` (app-shell.css:389) caps the page; on
  a 2560px display ~half the width is empty. Tables benefit from width — the 1280 cap is a
  prose-readability rule misapplied to a data grid.
- **Responsive:** the 7-col table is `table-auto`, wrapped in `overflow-x-auto`, with
  **zero `@media` rules** and **no card view**. Two sticky columns are hardcoded
  (`--rank-col-w: 120px`, district pinned at `left:120px`, app-shell.css:916/944). Below
  ~1300px it just forces horizontal scroll; at 375px the sticky pair (~380px) alone
  overflows the viewport. No scroll-cue affordance.

### Club table (`ClubsTable.tsx`, `ColumnHeader.tsx`, `filters/`, `useColumnFilters.ts`)

- **Width/columns:** 13 columns, `table-auto` + `whitespace-nowrap`, no explicit widths,
  inside a 1280px page (~1196px usable). It **cannot fit** below ~1600px → obligatory
  horizontal-scroll trap on nearly every desktop.
- **Responsive cliff:** a single 640px breakpoint swaps the whole table for a card list
  (`useIsMobile(640)`). No tablet tier; the desktop→mobile transition is a cliff.
- **Filter pickers (poor UX):** per-column filters hide behind a ~2.5px dropdown arrow in
  each header (undiscoverable; fails 44px touch target). Each filter is a multi-step chore:
  click header → pick operator → type/select → **mandatory "Apply"** → 300ms debounce →
  close. Text filters debounce _and_ show Apply/Clear — ambiguous whether typing applies.
  **There is no visible search box** — name search is buried in the "Club" column header.
  Column filters are session-only (lost on reload; only `status` + `search` are URL-synced).
- **The double quick-filters (the specific complaint):**
  - **Set #1 — Status segmented** (All / Thriving / Vulnerable / Intervention), living
    _inside_ the results-count row (ClubsTable.tsx:379–493). Filters `status`. URL-synced.
  - **Set #2 — Quick-filter chips** (Close to Distinguished / Needs members / Missing
    renewals / President's tier only), a separate row (ClubsTable.tsx:495–646). Session-only.
    "Close to Distinguished" has a **hidden side effect**: it silently re-sorts the table
    (lines 511–513).
  - They **overlap** (`membersNeeded`, `distinguished` are reachable from chips _and_ from
    per-column pickers; they silently AND together → confusing empty results) and read as
    two unrelated systems. Three filtering mechanisms total, none showing a unified summary.

### Cross-cutting (architect's view)

Both tables independently reinvent: `table-auto` + nowrap, an `overflow-x-auto` wrapper,
hand-tuned CSS widths, hardcoded sticky pixels, ad-hoc responsive (or none). Same smell,
duplicated twice — and growing (recent column-adding branches: #688 distinguished-remaining,
#687 base/current/Δ, and now #795). There is **no column model and no shared table
primitive**; every new column is hand-wired CSS, which is exactly why width keeps breaking.

---

## 2. The #795 collision (decide this first)

#795 adds delta columns (Δ members, Δ payments, DCP-tier transition, health transition,
distinguished flip) to the club table. Adding 5 always-on columns to a 13-col table that
already overflows makes the disliked experience worse and fails the PM cohesion test
("simpler to explain"). The delta columns belong to a **comparison context**, not the
default view. Recommendation: **#795 should land its columns as an opt-in "Changes" column
group via the new column model (Epic C), not as always-on columns.** Until that's decided,
#795 (epic #797 Sprint 3) should be paused/re-scoped so it doesn't ship into a table we're
about to restructure.

---

## 3. Recommendations by hat

**PM (ron-pm).** Two distinct jobs: _scan/compare districts_ (landing) and _find/triage
clubs_ (club table). The table is the product here. Cut scope to: (1) give tables the width
they need, (2) make responsive degradation graceful, (3) collapse three filter mechanisms
into one legible model, (4) make a growing column set sustainable (groups + opt-in). Ship
simplest-first; don't build a full column-customisation suite before fixing width + filters.

**UX (ron-ux).** Full-width for data pages; tiered responsive (priority columns hide at
tablet, sticky key column + scroll-cue, card view only at true mobile); no h-scroll at
375px; 44px touch targets. One visible search box. Replace hidden header dropdowns with a
discoverable, instant-apply filter model + an **active-filters summary bar**
("3 filters · Clear all"). One intent-based preset row (merge the two quick-filter sets);
kill the hidden auto-sort surprise. Zero-results empty state names the offending filter.

**Architect (ron-sa).** Introduce a **column model** (id, header, priority, group, align,
width/min, sticky, visibility, formatter) per table first; converge both tables onto it;
**then** extract a shared headless `DataTable` primitive _only if_ the overlap is real
(R6 — verify, don't assume; avoid premature abstraction). Keep the existing filter pipeline
`original → filtered → searchFiltered → sorted` (R11) — the UI overhaul is presentation over
that pipeline, not a rewrite. Replace hardcoded sticky px with a robust sticky mechanism.
Width is a CSS-level token change (R10), reversible. **Write an ADR** for the table-page
standard (full-width policy + column-model). Each step ships in ≤3 commits, stays green.

**QE (ron-qe).** Unit-test the column-visibility resolution and the consolidated filter
logic; keep existing `useColumnFilters` tests green; don't drop the 55% threshold. Add
**Playwright at 375 / 768 / 1280 / 1600 + dark mode** asserting: no horizontal overflow at
375, correct column set per breakpoint, filter round-trips. **Guard CLS** (Lighthouse ≤0.1;
lessons 107/113) — width/container and column-hiding changes can shift layout. Verify on the
PR preview channel per the Full DoD.

---

## 4. Proposed epics & sub-issues

### Epic A — Full-width & responsive table system (both tables) · _foundational_

- **A0** ADR: table-page layout standard (full-width policy, responsive priority-column
  model, sticky strategy). Decision up front.
- **A1** Full-width container policy — new `--page-max-wide` token applied to
  `.districts-page` + `.district-detail-page`; prose pages stay narrow. CSS-level (R10).
- **A2** Landing table: priority-column model + explicit widths; sticky key column +
  scroll-cue; replace hardcoded sticky px.
- **A3** Club table: same priority-column model; tablet tier (hide low-priority cols);
  card view only at true mobile.
- **A4** Mobile/touch polish — ≥44px targets, spacing, no h-scroll at 375px; dark mode.
- _Verify:_ Playwright 375/768/1280/1600 + dark mode + CLS guard.

### Epic B — Club table filtering & toolbar overhaul · _club-specific_

- **B1** Visible search box (club/name) at the top; URL-synced.
- **B2** Merge the two quick-filter sets into **one** intent-based preset row + health
  segmentation; remove the hidden auto-sort side effect.
- **B3** Replace hidden per-column header dropdowns with the chosen model (Filters panel
  _or_ discoverable inline + instant-apply; drop the mandatory Apply button). _(direction =
  open decision Q3)_
- **B4** Active-filters summary bar + zero-results empty state; URL-sync all filters.
- _Keep the filter pipeline intact (R11). Unit tests + Playwright interaction tests._

### Epic C — Scalable column model & the delta columns (#795) · _depends on A_

- **C1** Column groups + show/hide (Identity / Membership / Renewals / Recognition /
  Changes); persist selection.
- **C2** Land #795's delta columns as the opt-in **Changes** group (coordinate with epic
  #797 Sprint 3 — re-scope #795 onto this).
- **C3** _Evaluate-then-extract_ a shared headless `DataTable` primitive — only if A proved
  real overlap (R6); else close won't-do.

**Sequencing:** A → (B ∥ C1) → C2. A is the unblocker; B and the column model can proceed in
parallel once A lands; #795's columns land last via C2. Suggested #606 order: **A first**
(foundational, user-visible), then B, then C — and **#795 paused** pending C2.

---

## 5. Decisions to validate (see chat)

1. Full-width target: fluid/edge-to-edge vs a wider cap (~1600).
2. #795 disposition: pause & re-scope into Epic C (recommended) vs ship-then-refactor.
3. Filter model direction: dedicated Filters panel/drawer vs discoverable inline + instant-apply.
4. Create these epics + sub-issues now and queue in #606?
