# Epic recommendation — Clubs page: adopt redesign look-and-feel + single-table (remove pagination)

**Date:** 2026-05-24
**Author:** Claude (ron-ux + ron-pm personas)
**Status:** Filed — epic #665; sub-issues #667–#672.
**Parent context:** Club redesign meta-epic #606; clubs moved to own page in epic #568 / #570; redesign handoff in `docs/design/club-redesign-2026-05/HANDOFF.md`.

---

## Why this epic

The clubs table is now a standalone page (`/district/:districtId/clubs`) but is the **last major district surface still on the legacy gray Tailwind chrome** while the rest of the club/district redesign has migrated to the `--loyal` / `--ink` / `--surface` token system (sprints #618–#621). It also still paginates at 25/page — a control that fragments scanning when a district has ~300 clubs and the user's mental model is "show me all my clubs, let me sort/filter."

Two goals, one epic:

1. **Adopt the redesign look-and-feel** specified in the handoff (tokens, sticky chrome, segmented filter, chips, DCP bar, tier pills, 640px card collapse, `[data-theme]` dark mode).
2. **Eliminate pagination** — render all clubs (district max ~300) in a single sticky-header table; sort/filter/search operate over the full set.

### PM cohesion test

- **Simpler to explain?** Yes — "every club, sortable, in one view" beats "25 per page, click next."
- **Easier to use?** Yes — `Cmd-F`, sort, and filter all work over the whole dataset; no losing your place across pages.
- **Reinforces core value?** Yes — the product's promise is district-wide visibility; pagination undercut it.

### Scope guardrail (Lesson 092 — replace, don't augment)

This is a **re-skin + structural simplification**, so net surface should **shrink**: `usePagination` and `Pagination.tsx` usage drop out of this page, legacy gray classes get replaced (not layered). Inventory before adding. Do not build a parallel table.

---

## Open product decisions (recommended answers baked in)

| Decision                                                              | Options                                                                   | Recommendation                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scroll model**                                                      | (a) whole-page scroll; (b) fixed-height scroll container inside the panel | **(b)** capped-height scroll region (e.g. `max-height: calc(100vh - controls)`) with a **sticky `<thead>`**, so headers and the status/search controls stay visible while scanning 300 rows. Whole-page scroll loses the column headers. |
| **Virtualization**                                                    | now / defer                                                               | **Defer.** User is fine with 300 rows in the DOM; 300×~12 cells renders well under budget. Keep a perf-budget test as the tripwire; add `@tanstack/virtual` only if a real district exceeds budget. Document as a deferred safety valve. |
| **"Extra" columns not in handoff** (`Club Status`, `Years Chartered`) | trim to handoff / keep                                                    | **Keep**, but treat the handoff column set + order as the spine and append the two extras at the end. They shipped deliberately (#448, club-status work) and removing them is a separate product call. Note the divergence in the spec.  |
| **`?page=` URL param**                                                | silently ignore / redirect                                                | **Strip + redirect.** Drop `page` from the param contract; add a one-line cleanup so legacy `…?page=3` links land on the live single table without a dead param.                                                                         |

---

## Sub-issues (TDD slices, each leaves green)

Ordered structural-first (functional change), then visual, so each slice is independently shippable.

### Sub-issue 1 — Remove pagination: single sticky-header table

**Type:** feat · **Labels:** ui/ux, frontend, redesign

- Remove `usePagination` from `ClubsTable.tsx`; render **all** sorted+filtered rows.
- Replace the `Pagination` component render with a results counter: "Showing N of M clubs" (reuse the existing count line at ClubsTable.tsx:397).
- Sticky `<thead>` (`position: sticky; top: 0`) inside a capped-height scroll container; header stays put while scrolling.
- Drop `?page=` from the param contract in `DistrictClubsPage.tsx`; add legacy-param cleanup in `legacyTabRedirect.ts`.
- **Tests (the spec change):** rewrite `ClubsTable.performance.test.tsx` — assertions move from `tableRows.length === 26` to "renders all rows" with a render-time budget over a realistic 300-club set (and a 1000-club stress measurement, logged not gated). This is a deliberate spec change, comment it with the issue # (Lesson 092 — not assertion pinning). Update `ClubsTable.test.tsx` / `.integration.test.tsx` pagination cases.
- **AC:** no pagination controls; all clubs visible by scroll; sort/filter/search span the full set; sticky header verified; `?page=` no longer written; legacy `?page=` link resolves cleanly; full suite green.

### Sub-issue 2 — Re-skin table chrome to redesign tokens

**Type:** feat · **Labels:** ui/ux, frontend, redesign

- Replace legacy gray Tailwind (`text-gray-900`, `bg-gray-50`, `border-gray-200`, `divide-gray-200`, `font-tm-headline`) on the panel, header, and rows with redesign tokens: panel `--surface` / `--line`, header `--surface-2`, row hover `--surface-3`, text `--ink` / `--ink-3`, headings Montserrat per handoff §215.
- Dark mode via `[data-theme='dark']` at the **CSS level** (R10), not component branches — follow project convention over the handoff's `prefers-color-scheme` wording.
- Move row/header styling into a dedicated CSS block (e.g. `app-shell.css` `#clubs-table` rules already referenced by the handoff) rather than inline utilities.
- **AC:** zero legacy `*-gray-*` classes left on the table; light + dark both match tokens; Playwright screenshots at 1280/768/375 + dark compared to handoff (visual-audit-2026-05-10 rule).

### Sub-issue 3 — Column model to match handoff (DCP bar, cur/base, status & tier pills)

**Type:** feat · **Labels:** ui/ux, frontend, redesign

- Reconcile column set/order to handoff §8: **Club, Div, Area, Status, Members (cur/base), Needed, New, Oct Renew, Apr Renew, DCP (bar), Tier**, then append kept extras (Club Status, Years).
- Render **Status** and **Tier (Distinguished)** as pills (DCP tier color map: Smedley `--maroon-500`, President's `--loyal-500`, Select `--loyal-400`, Distinguished `--green-600`, projected striped yellow, not-yet neutral — HANDOFF §259).
- Render **DCP** as an inline progress bar; **Members** as current/base. Wire to real pipeline fields (`extractDcpGoalProgress`, `clubPerformance`), never the mockup's illustrative copy (Lesson 092); honour the DCP-independence tripwire.
- **AC:** columns match spec order; pills/bar render with correct token colors; sort still works on every column; no Goals-1-N inference.

### Sub-issue 4 — Re-skin the controls row (search, segmented status filter, quick chips)

**Type:** feat · **Labels:** ui/ux, frontend, redesign

- Re-skin `clubs-status-segmented` and `clubs-quick-filter-chip*` to redesign tokens (active = `--loyal-500` text on `--loyal-50`, hover `--surface-3`).
- Search input adopts redesign input styling; keep counts on the segmented control.
- Controls row sticks with the header in the scroll model from sub-issue 1.
- **AC:** segmented + chips + search match handoff styling in light/dark; keyboard + ARIA tablist semantics preserved (already present at ClubsTable.tsx:444+).

### Sub-issue 5 — Responsive: 640px card collapse + re-skinned cards

**Type:** feat · **Labels:** ui/ux, frontend, redesign

- Align table→card collapse to **640px** (handoff §126); current code collapses at 768px — reconcile.
- Re-skin the mobile card view (ClubsTable.tsx:721-787) to redesign tokens; ensure no horizontal scroll at 375px and ≥44px touch targets on chips/sort controls.
- With pagination gone, mobile is one long card list — verify status filter + search adequately narrow it; sticky controls help.
- **AC:** verified at 375 / 640 / 768 / 1280 in light + dark; no overflow; touch targets pass.

### Sub-issue 6 — A11y + verification pass

**Type:** chore/test · **Labels:** ui/ux, frontend, a11y

- Contrast audit to WCAG AA on new token combos (pills, chips, ink-3 on surface).
- Keyboard: sort via header still reachable; sticky header doesn't trap focus; scroll region is keyboard-scrollable.
- Empty/loading states re-skinned (the existing empty state at ClubsTable.tsx:697 uses gray classes).
- Final Playwright prod-vs-handoff screenshot comparison (visual-audit lesson — don't declare done without it).
- **AC:** axe clean; manual keyboard pass; screenshots archived; lessons entry added.

---

## Risks & mitigations

- **Perf regression at scale** — mitigate with the render-budget test (sub-issue 1) as a tripwire; virtualization is the documented fallback if a district ever exceeds budget.
- **Assertion-pinning false alarm** — the perf-test rewrite is a spec change; comment it with the issue # so review doesn't read it as pinning (Lesson 092).
- **Token-migration coexistence** — `--loyal`/redesign.css coexists with legacy `--color-tm-*`; migrate the table fully so it doesn't end up half-and-half (Lesson 092 "replace, don't augment").
- **Two-code-path tripwires** — none of the SnapshotBuilder/DCP-independence tripwires are touched by chrome, but sub-issue 3 reads DCP fields: use the canonical util.

## What we're NOT doing

- Not migrating to the `--rt-*` Red Taverns brand chrome (blocked on rename, ops#37) — this rides the `--loyal` redesign tokens that are actively shipping.
- Not adding virtualization (deferred).
- Not removing the Club Status / Years columns (separate product call).
- Not touching the data pipeline or other district tabs.

## Sequencing

1 → 2 → 3 → 4 → 5 → 6. Slice 1 is the user's headline ask (kill pagination) and ships value immediately; 2–6 land the look-and-feel incrementally, each green.
