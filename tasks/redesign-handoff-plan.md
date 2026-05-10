# Toast Stats Redesign — Issue Plan

Source: `/Users/rservant/Downloads/design_handoff_toast_stats/` (README + 5 designs + 5 page screenshots + 5 District tab screenshots).

## Decisions captured

- Districts page **replaces** the current `LandingPage`.
- Full migration to Toastmasters palette (`--loyal-*`, `--maroon-*`, `--yellow-*`).
- Keep the existing **manual** dark-mode toggle; re-skin only.
- Top-bar notifications/help/avatar: **skip**.
- "Soon" nav items (Regions, Awards): **omit** entirely (no placeholders).
- Epic + child issues; conventional commits with `(#N)`.
- Awards Race panel on Districts page = the design's 3-contender summary; the richer top-10 model defers to a **future Awards page** (separate epic).
- Methodology copy: write fresh from the code as source of truth.
- Cutover: replace pages incrementally on `main` (no flag).
- District tabs: all 5 sample tabs supplied — Overview / Clubs / Divisions & Areas / Trends / Analytics / Global Rankings.

## Issue tree

### Epic A — Redesign (active work)

1. **Foundation: design tokens + typography**
   - Add the loyal/maroon/yellow CSS custom properties (light + dark).
   - Wire Montserrat + Source Sans 3 + JetBrains Mono via Google Fonts (or self-host).
   - Add radii/shadows tokens. Keep the manual `[data-theme='dark']` toggle.
   - Migrate existing `tm-*` token usages incrementally; do not break current pages.

2. **Foundation: AppShell (top bar + footer + page container)**
   - Sticky top bar (56px), brand mark, nav (Districts / History / Methodology only), blurred bg.
   - Footer two-column 12px text per spec.
   - Page container max-width 1280, padding 24.
   - No notifications/help/avatar.

3. **Foundation: routing + navigation**
   - Replace `LandingPage` route with new Districts page.
   - Add `/history` and `/methodology` routes.
   - Convert District detail tabs to routed sub-paths (`/districts/:id/overview`, `/clubs`, `/divisions-areas`, `/trends`, `/analytics`, `/global-rankings`).

4. **Districts (leaderboard) page**
   - Page header (eyebrow PY, h1, lede, action cluster: freshness pill + Export + Share).
   - 4-card global KPI strip (Paid Clubs, Total Payments, Distinguished, Districts Tracked).
   - Awards Race summary panel (3 contender cards: Extension / 20-Plus / Retention) — wire to existing analytics.
   - Methodology callout linking to `/methodology`.

5. **District detail: page header + action cluster**
   - Breadcrumbs (Districts › District N).
   - Eyebrow `Region X · Program Year YYYY–YYYY`, h1, lede with active clubs / divisions / overall rank summary.
   - Right-side action cluster: freshness pill, PY selector, as-of-date selector, Export, Share (primary).

6. **District detail: tab bar primitive**
   - Tab bar with active underline (`--loyal-500`), count badges (Clubs `305`, Divisions & Areas `7`).
   - Routed sub-paths; horizontal scroll on narrow.

7. **District detail · Overview tab**
   - 4-card KPI strip with rank badges (`#1 of 117`).
   - Distinguished District Status trophy case (4 cells + status pill).
   - Distinguished Composition + Payment Composition stacked-bar panels (2:1 grid).
   - Division Performance ranked list (A–G).
   - Three time-series charts (Membership Trend 3yr, Member Payments cumulative, YoY Comparison).
   - Top Growth Clubs + Top DCP Goal Achievers (2-col).
   - Vs all 117 districts panel (sparkline indicators).
   - Ranking progression (6 PY) with metric toggle.
   - Multi-Year Comparison (4 metrics) table.

8. **District detail · Clubs tab**
   - Search input.
   - Status segmented filter (All / Thriving / Vulnerable / Intervention) with counts.
   - Quick-filter chips (Close to Distinguished / Needs members / Missing renewals / President's tier only).
   - Sortable table: Club, Div, Area, Status, Members (cur/base), Needed, New, Oct Renew, Apr Renew, DCP (bar), Tier.

9. **District detail · Divisions & Areas tab**
   - Division Performance summary header (date stamp).
   - Collapsible "Distinguished Program criteria" explainer.
   - Per-division card: rank, recognition pill, Paid/Distinguished/Net Growth summary stats.
   - Per-division Areas table (Area, Paid, Distinguished, Round 1/2 Visits, Recognition, Gap to D/S/P).

10. **District detail · Trends tab**
    - Membership Trend · 3 years (current + 2 prior, dashed/dotted prior years).
    - Member Payments · cumulative (3-year overlay).
    - Year-Over-Year Comparison strip (Total Membership, Distinguished, Thriving Clubs, Total Clubs, deltas).

11. **District detail · Analytics tab**
    - Top Growth Clubs (top-N by net member change, with rank chips).
    - Top DCP Goal Achievers (top-N by goals achieved, with tier sub-line).
    - Reuse the existing top-10 model.

12. **District detail · Global Rankings tab**
    - 4 KPI cards (Paid Clubs / Member Payments / Distinguished Clubs / Aggregate Score), each with rank-of-117 + delta.
    - Ranking progression chart (6 PY) with segmented metric toggle (Aggregate / Paid / Payments / Distinguished). Y-axis inverted, lower=better.
    - Multi-Year Comparison table (PY × 4 metrics + Net Δ).

13. **Club detail page**
    - Breadcrumbs (Districts › District N › Club).
    - Loyal-500 hero header: club number + charter eyebrow, h1, Area/Division/District sub-line, right-side health pill + DCP tier pill.
    - 8-stat grid (Base / Current / Net Δ / DCP Goals / Oct Renewals / Apr Renewals / New Members / CSP).
    - 2/3 + 1/3 grid: Membership Trend chart + DCP Status panel.
    - Close-to-Distinguished call-out (yellow accent, conditional).
    - DCP Goals Progress (10-goal checklist).

14. **History page (NEW)**
    - Page header (`Archive · N program years on file`).
    - Year strip (current=loyal, archived=neutral, gap=muted).
    - Per-year card: header (year + status tag + closed date), 2-col body (Top 5 districts + Headline metrics), trailing "Notable: …" line.
    - Current year flagged "Live snapshot · final standings move to the archive on July 1".
    - Trailing TI archive callout for pre-2019.

15. **Methodology page (NEW)**
    - Eyebrow `Reference · Updated <date>`, h1, lede.
    - Anchor TOC (8 sections, numeric prefixes).
    - 8 numbered sections (Data source & access, Refresh cadence, Borda count scoring, DCP tier definitions, Club health classifications, Glossary, Caveats & known issues, Changelog).
    - Content sourced from `analytics-core` and existing thresholds.

16. **Cleanup: retire `LandingPage` + dead components**
    - Delete `LandingPage.tsx` once Districts page ships.
    - Audit `frontend/src/components/` for unreferenced legacy components and remove.
    - Update README/product-spec if affected.

### Epic B — Future Awards page (deferred)

17. **Awards page route + shell** — `/awards`, AppShell wired, "soon" pill removed once shipped.
18. **Awards page: full top-10 leaderboards** — Extension, 20-Plus, Retention, plus any other district-level award races. Reuse existing computation in `analytics-core`.
19. **Awards page: methodology cross-links** — short prose intro + per-award explainer linking to methodology section.
