# #835 — Adopt TanStack Table for the club table (Epic C / #821 Sprint 1)

**Date:** 2026-05-27 · **Issue:** #835 · **Branch:** `sprint-835-tanstack-club-table`

## Goal

Migrate the **club table** (`ClubsTable.tsx`) onto **TanStack Table v8**
(`@tanstack/react-table`), replacing the hand-rolled column iteration, the
switch-statement sort comparator, and the sticky/sizing plumbing — so Sprint 2
(column groups via `columnVisibility`) and Sprint 3 (delta columns) fall out of
the library's native APIs. **Club table only**; the landing rankings table is
left bespoke (deliberate split — ADR-006).

## Architectural split (what moves, what stays)

| Concern            | Before                                                                 | After                                                                    |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Filter pipeline    | `useColumnFilters` → `filteredClubs`                                   | **unchanged** (R11)                                                      |
| Filter metadata    | `COLUMN_CONFIGS` (drives FiltersPanel, clubFilterUrl, codec, describe) | **unchanged** — still the filter subsystem's source of truth             |
| Table column model | `COLUMN_CONFIGS.map(...)` header + hand-ordered `<td>`                 | **`clubsColumns.tsx`** — `createColumnHelper<ProcessedClubTrend>()` defs |
| Sort               | local `sortField/sortDirection` + 90-line `switch` comparator          | TanStack `SortingState` + per-column `sortingFn`                         |
| Sizing / pinning   | CSS-only sticky (`clubs-table__sticky-col`)                            | TanStack `columnPinning: { left: ['name'] }` drives it; CSS renders it   |
| Visibility         | CSS `@media` (`clubs-table__col--desktop`)                             | CSS stays; `columnVisibility` state wired for Sprint 2                   |
| URL-sync           | `onSortChange(field, dir)` callback to parent                          | **unchanged** — mapped at the TanStack↔props boundary                    |

**Why COLUMN_CONFIGS stays:** it is consumed by `clubFilterUrl`,
`filterUrlCodec`, `clubFilterDescribe`, and `FiltersPanel` — the filter
subsystem the ticket says to **preserve**. The column-model migration is the
_table presentation/sort/size/pin_ layer; conflating the filter metadata into
TanStack defs would balloon blast radius into the preserved filter UI. The two
column descriptions are different concerns and stay separate (recorded in ADR-006).

## Behaviour-parity contract (Lesson 117 — migration, not rewrite)

The migration must keep the rendered DOM and behaviour byte-identical. The
existing ~3,500 lines of `ClubsTable.*.test.tsx` are the equivalence proof; they
stay green **without assertion-pinning**. Preserved DOM invariants:

- `#clubs-table thead th .clubs-col-header span.flex-1` header order = the 13-col
  HANDOFF set (columnModel test).
- Cell markup/classes: `.clubs-tier-pill[--modifier]`, `.clubs-status-pill`,
  `.clubs-members-cell`, `.clubs-dcp-cell` + `role=progressbar`, `data-row-tint`,
  `.clubs-table__sticky-col`, `.clubs-table__col--desktop`, row tints.
- Sort semantics: name-asc default; custom Tier order; undefined→end; secondary
  sort by club name; URL-sync (`?sort=&dir=`) via the parent callback.
- Card view (<768), CSV export, search box, filter drawer, quick-filter row,
  active-filters bar, row click-through — all unchanged.

## TDD increments (each a commit referencing #835)

1. **Add `@tanstack/react-table`** + record resolved bundle delta.
2. **Red→Green: column model** `clubsColumns.tsx` — 13 defs, order, `meta.priority`
   (sticky/desktop/core), `sortingFn`s (Tier custom, undefined-to-end, secondary
   name). Unit test asserts order + meta + a representative sort.
3. **Green: migrate `ClubsTable` rendering** to `useReactTable` — header via
   `getHeaderGroups()` (reuse `ColumnHeader`), body via `getRowModel()` +
   `flexRender`. Sorting state ⇄ props boundary; `columnPinning` left=name;
   `columnVisibility` wired. Existing suites prove parity.
4. **Refactor / /simplify** pass; drop the dead switch + `colPriorityClass` if
   subsumed.
5. **ADR-006 update** — record club=TanStack / rankings=bespoke split.

## Risks

- DOM drift breaking parity tests → mitigate by reusing `ColumnHeader` and
  moving cell JSX verbatim into `cell` renderers.
- `setSearchParams` same-batch race on sort URL-sync (Lesson 070) — the parent's
  `handleSortChange` already guards by reconciling; keep that boundary intact.
- Sticky-cell verify must measure the cell, not `<thead>` (Lesson 108); WebKit
  dual-engine preview smoke (Lessons 110/111).
