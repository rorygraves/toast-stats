# Sprint 1 (#667) — Remove pagination → single sticky-header clubs table

Epic #665. Headline: render all clubs in one scrollable table, drop `?page=`.

## Design (ron-ux lens + Lesson 105)

- Clubs table is **browsed one row at a time** → card-collapse on mobile stays correct (L105). Desktop keeps the table.
- Desktop: capped-height scroll container + sticky `<thead>`. Container is keyboard-operable (`role="region"` + `tabindex=0` + `aria-label`) per WCAG 2.1.1 / axe `scrollable-region-focusable`.
- Sticky thead needs an **opaque themed bg** (`var(--surface-2)`), never a literal (L092), or dark mode bleeds.
- Results counter already exists at the top ("Total: N clubs" / "Showing N of M") — keep it; it replaces the pagination summary.

## Changes

1. `ClubsTable.tsx` — drop `usePagination`/`Pagination`, `initialPage`/`onPageChange`, the page-sync + reset-to-1 effects; render all `sortedClubs` (desktop tbody + mobile cards); wrap desktop table in `.clubs-table-scroll`.
2. `DistrictClubsPage.tsx` — drop `?page=` read, `handlePageChange`, `next.delete('page')`, the props.
3. `legacyTabRedirect.ts` — stop carrying `page` through (strip legacy `?page=`).
4. `app-shell.css` — `.clubs-table-scroll` (max-height + overflow-y:auto) + sticky thead.
5. Delete orphaned `hooks/usePagination.ts` + `components/Pagination.tsx` (no other consumers — L056 dead-code removal, shrinks net surface per epic guardrail).

## Tests (spec change, comment #667, L092/L068 — budget for cascade)

- `ClubsTable.performance.test.tsx` — "renders all rows" + render-time budget over ~300 clubs; log 1000-club stress (don't gate).
- `ClubsTable.test.tsx` Pagination block, `ClubsTable.integration.test.tsx` → "renders all rows".
- `DistrictClubsPage.test.tsx` — drop `?page=2` test; legacy-redirect test asserts `page` stripped.
- `legacyTabRedirect.test.ts` — "strips legacy page, preserves sort/dir".

## Verify

Full suite green → PR (body uses `Part of #665`, NOT `Closes` — L106) → preview Playwright smoke (sticky header + all rows) → merge → label → tick epic → close.
