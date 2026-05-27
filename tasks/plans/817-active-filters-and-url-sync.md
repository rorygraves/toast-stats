# Sprint 4 (#817) — active-filters summary bar + zero-results state + URL-sync all filters

Epic #818 / Epic B / B4. Closes the club-table filtering overhaul:
make every active filter **visible**, **removable**, and **shareable**.

## Acceptance criteria (from epic)

1. **Active-filters summary bar** — a visible chip per active filter (field +
   value), each individually removable; reflects ALL filters (drawer + presets +
   search), not just the preset chips.
2. **Zero-results state** — when filters exclude every club, name the active
   filters and offer a one-click clear.
3. **URL-sync all filters** — every filterable column round-trips through the
   URL, not just `status` + `search` (name). Shareable/bookmarkable.

## Architecture (R11: pipeline untouched — presentation + URL only)

Three new pure/presentational units + two wiring edits. No change to
`original → filtered → searchFiltered → sorted`.

### `utils/clubFilterUrl.ts` (pure, replaces inline DistrictClubsPage funcs)

- `paramsToFilterState(params): FilterState`
- `filterStateToParams(state): Array<[key,value]>` + `FILTER_PARAM_KEYS`
- Encodings (param key = bare field name, except the two legacy-stable ones):
  - `name` ⇄ `search` (raw text) — unchanged contract
  - `status` ⇄ `status` (single categorical, thriving/vulnerable/intervention map) — unchanged contract
  - text (division/area) ⇄ raw string
  - numeric ⇄ `min..max`, omit absent side (`2..`, `..20`, `0..0`)
  - categorical (distinguished/clubStatus) ⇄ comma-joined values
- Reserved (never touched): `py`, `date`, `sort`, `dir`.

### `utils/clubFilterDescribe.ts` (pure, shared by bar + zero-results)

- `describeFilter(filter): { field, label, value }` — label from COLUMN_CONFIGS;
  status/tier/clubStatus → display names; numeric range → `5–20`/`≥2`/`≤20`/`0`.
- `describeActiveFilters(state): Descriptor[]`

### `components/ActiveFiltersBar.tsx` (presentational)

- Renders one removable chip per descriptor + a "Clear all" affordance.
- `role` region, each remove button `aria-label="Remove <label> filter"`, ≥44px
  touch target, token-driven dark mode (R10). Returns null when no active filters.

### Wiring

- `DistrictClubsPage`: swap inline build/patch for the module; `handleFilterChange`
  reconciles ALL filter params (delete every `FILTER_PARAM_KEYS`, set present) so
  drawer filters survive reload. Lesson 070: wholesale reconcile = no prev-race.
- `ClubsTable`: render `<ActiveFiltersBar>` after toolbar; enhance the
  filter-empty state to list descriptors + "Clear all filters".

## TDD order

1. Red+Green `clubFilterUrl` round-trip (all types, clean-URL defaults).
2. Red+Green `clubFilterDescribe`.
3. Red+Green `ActiveFiltersBar` (render, remove one, clear all, empty → null).
4. Red+Green ClubsTable zero-results names filters.
5. Red+Green DistrictClubsPage URL round-trip for a non-status/non-name filter.
6. /simplify + review + dual-engine Playwright on PR preview.
