# Handoff: Toast Stats

A district performance dashboard for Toastmasters. Five screens covering the worldwide district leaderboard, an individual district detail page, an individual club detail page, a multi-year history archive, and a methodology reference.

---

## About the Design Files

The HTML files in `designs/` are **design references**, not production code. They were authored as a high-fidelity prototype to lock down the visual system, layout, copy, and interactions. They use vanilla HTML, hand-rolled SVG charts, Google Fonts, and minimal inline JS — they are intentionally not architected for shipping.

**Your job is to recreate these designs in the target codebase's existing environment** (React, Vue, Svelte, etc.) using its established component library, routing, and data layer. If no environment exists yet, pick the most appropriate framework for the project. Do **not** ship the HTML directly.

---

## Fidelity

**High-fidelity.** Colors, typography, spacing, layout, copy, and chart styles are final. Implement pixel-perfect against the reference HTML — exact hex codes, font sizes, line-heights, paddings, border-radii, and shadow values are listed in `Design Tokens` below and visible inline in each design file.

The numerical data in the designs is sample/illustrative. Wire your implementation to real data from the Toastmasters dashboard (see `Toast Stats - Methodology.html` for the data source).

---

## Screens

There are **5 screens** in the design. All share the same top bar (brand mark + nav + notifications/help/avatar) and footer.

Reference screenshots are in `screenshots/`:

- `01-districts.png` — leaderboard
- `02-district-detail.png` — district detail (Overview tab)
- `03-club-detail.png` — club detail
- `04-history.png` — program-year archive
- `05-methodology.png` — methodology reference

These are full-page captures at 1280px max-width. They are illustrative — the source of truth for layout and styling is the HTML files in `designs/`.

### 1. Districts (leaderboard) — `designs/Toast Stats - Districts.html`

Worldwide leaderboard of all 117 districts.

- **Page header:** eyebrow `Program Year 2025–2026`, h1 `District Rankings`, lede paragraph.
- **Awards Race panel:** sortable / filterable table of top contender districts with columns for paid clubs, payments, distinguished, aggregate Borda score, projected award, region.
- **Methodology callout:** short prose explainer of the Borda count formula (links to full methodology page).
- **Footer.**

Each district row links to the District detail page.

### 2. District detail — `designs/Toast Stats - District.html`

Drill-down for one district (designed against D57). This is the most complex screen.

- **Breadcrumbs:** Districts › District 57.
- **Page header:** eyebrow `Region 1 · Program Year 2025–2026`, h1, lede, plus a right-side action cluster: freshness pill (green dot + "Data fresh · Apr 26, 2026"), program-year selector, as-of-date selector, Export, Share (primary).
- **Tabs:** Overview · Clubs (with count badge) · Divisions & Areas · Trends · Analytics · Global Rankings. Only Overview is filled in the prototype; the others are placeholders for the implementation.
- **Overview tab contents (in order):**
  1. **KPI strip** — 4 cards: Paid Clubs, Member Payments, Distinguished Clubs, Net Member Change. Each has a rank badge (`#1 of 117`), big numeric value, and a delta line (signed % + secondary fact).
  2. **Distinguished District Status** — a "trophy case" with 4 cells (Club Strength, Leadership, Education & Training, Club Growth Officer), each showing a met/miss state with metric and threshold. Header carries a yellow status pill ("On track — President's Distinguished").
  3. **Distinguished Clubs · Composition** + **Payment Composition** — two stacked-bar panels in a 2:1 grid. Color-coded segments (Smedley/President's/Select/Distinguished/Projected/Not yet). Includes a projection note.
  4. **Division Performance** — ranked list of divisions A–G with per-division metrics.
  5. **Three time-series charts** — Membership Trend (3 years), Member Payments (cumulative), Year-Over-Year Comparison. SVG line/area charts.
  6. **Top Growth Clubs** + **Top DCP Goal Achievers** — two ranked lists side by side.
  7. **District 57 vs all 117 districts** — global ranking comparison with sparkline-style indicators per metric.
  8. **Ranking progression · last 6 program years** — multi-series line chart with metric toggle (segmented control: Aggregate / Paid / Payments / Distinguished).
  9. **Multi-Year Comparison · all 4 metrics** — table with year-over-year Δ.

### 3. Club detail — `designs/Toast Stats - Club.html`

Drill-down for one club (designed against Walnut Creek Speakers).

- **Breadcrumbs:** Districts › District 57 › Walnut Creek Speakers.
- **Club header:** eyebrow with charter info, h1, sub-line (Area / Division / District), and two right-side pills: health classification (e.g. "Thriving") + DCP tier (e.g. "Distinguished").
- **Stats grid:** 8 small stats — Base, Current, Net Δ, DCP Goals, Oct Renewals, Apr Renewals, New Members, CSP.
- **2/3 + 1/3 grid:** Membership Trend chart (left, SVG line chart with dots and tooltips) + DCP Status panel (right).
- **Close-to-Distinguished call-out** — yellow-accent banner shown when the club is close to next tier.
- **DCP Goals Progress** — checklist of all 10 DCP goals with met/unmet state.

### 4. History — `designs/Toast Stats - History.html`

Multi-year archive.

- **Page header:** eyebrow `Archive · 7 program years on file`, h1 `Program Year History`, lede explaining frozen-on-July-1 semantics.
- **Year strip:** horizontal chip row showing all years (current=blue, archived=neutral, gap=muted).
- **Per-year blocks (×7):** each is a card with a header (year title + status tag + closed-date) and a 2-column body: Top 5 districts (left) and Headline metrics (right, 4 stats with Δ). Each ends with a one-line note ("Notable: …").
- The current year is visually distinguished and notes "Live snapshot · final standings move to the archive on July 1".
- A trailing callout points pre-2019 users to the official TI archive.

### 5. Methodology — `designs/Toast Stats - Methodology.html`

Reference doc.

- **Page header:** eyebrow `Reference · Updated Apr 26, 2026`, h1 `Methodology`, lede.
- **Anchor TOC** linking to each section.
- **8 numbered sections:** Data source & access, Refresh cadence, Borda count scoring, DCP tier definitions, Club health classifications, Glossary, Caveats & known issues, Changelog. Each `<h2>` has a numeric prefix (`<span class="num">01</span>`).

### Top bar & navigation (shared)

```
[TS] Toast Stats   Districts | Regions·soon | Awards·soon | History | Methodology         🔔 ❓ JS
```

- Brand mark: 24×24 rounded rect, `--loyal-500` fill, white "TS" in 800-weight Montserrat.
- Nav links: 13.5px, weight 500. Active = `--loyal-500` text on `--loyal-50` background. Disabled = grey + a tiny mono "soon" pill (`::after`), `pointer-events: none`.
- Right-side: notification icon button, help icon button, 32px circular avatar (maroon background, white initials).
- Sticky top, blurred background (`backdrop-filter: saturate(140%) blur(8px)`).

### Footer (shared)

```
Toast Stats · ts.taverns.red · A Red Taverns production    Data: dashboards.toastmasters.org · MIT License · v3.4.1
```

Two-column flex, 12px text, `--ink-3` color, top border.

---

## Interactions & Behavior

- **Tab bar (District page):** clicking a tab swaps the visible content section. Active tab gets the `--loyal-500` underline. Use the codebase's existing tab primitive if available.
- **Selectors (program year, as-of date):** standard `<select>` controls in the prototype. Replace with the codebase's dropdown component. Changing them refetches the dashboard data for the chosen window.
- **Metric toggle (Ranking progression chart):** segmented control. Clicking switches the line series shown.
- **Sortable table (Awards Race):** column headers are sort handles in the implementation. Default sort is aggregate Borda score descending.
- **Hover states:** all interactive surfaces (`.btn`, nav links, table rows, tab buttons, year chips) have a hover background swap to `--surface-3`. SVG chart dots show a `<title>` tooltip.
- **Links to district / club detail:** rows in the leaderboard, top-5 lists, and growth tables all link out.
- **Disabled nav (Regions, Awards):** rendered but non-interactive — `pointer-events: none`, muted color, "soon" tag.
- **Dark mode:** automatic via `prefers-color-scheme: dark`. All tokens have dark-mode equivalents in the `:root` block of each file. Match this in your implementation (CSS variables or theme provider).
- **Responsive:** grids collapse to single column under ~980px. Tables in District page collapse to card layout under ~640px (see `#clubs-table` rules). Tab bar scrolls horizontally on narrow viewports. Adapt to your breakpoint system.
- **Animations:** none beyond default browser transitions. Keep it static and snappy.

---

## State Management

Per page, the implementation needs:

- **Districts page:** sort column, sort direction, region filter (if added), search query.
- **District page:** active tab, selected program year, selected as-of date, active metric on the ranking progression chart.
- **Club page:** none of significance — pure read view.
- **History page:** none — static content layout.
- **Methodology page:** none — static content + anchor scroll.

All pages need a freshness/last-updated indicator sourced from the data fetch.

### Data fetching

All numbers come from the Toastmasters public dashboard (see methodology page for endpoints). Cache aggressively — data refreshes ~daily.

---

## Design Tokens

Lift these from the inline `<style>` block at the top of each design file. They are identical across all five files; centralize them in your token system.

### Colors

```
--loyal-50:  #e6eef3
--loyal-100: #cbdde7
--loyal-200: #9ebccb
--loyal-400: #2c6e90
--loyal-500: #004165   /* PRIMARY brand — Toastmasters Loyal */
--loyal-600: #003352
--loyal-700: #002438

--maroon-500: #7B1828   /* eyebrow + avatar accent */
--maroon-600: #5a1120

--yellow-300: #f9ecaa
--yellow-500: #F2DF74   /* status / projection accent */
--yellow-600: #c9b748

--green-500: #16a34a
--green-600: #15803d
--red-500:   #dc2626
--red-600:   #b91c1c

/* Surfaces / ink (light) */
--bg:        #f6f7f8
--surface:   #ffffff
--surface-2: #f9fafb
--surface-3: #f1f3f5
--line:      #e5e7eb
--line-2:    #eceef0
--ink:       #0f1720
--ink-2:     #344052
--ink-3:     #5b6675
--ink-4:     #8b94a3
--link:      var(--loyal-500)

/* Surfaces / ink (dark) */
--bg:        #0a0f15
--surface:   #111922
--surface-2: #161f2a
--surface-3: #1a2330
--line:      #1f2a38
--line-2:    #25313f
--ink:       #eef2f7
--ink-2:     #c8d1dd
--ink-3:     #8a96a6
--ink-4:     #5d6878
--link:      #60a5d8
--loyal-50:  #112432
--loyal-100: #16344a
--loyal-200: #1c4866
```

### Typography

```
--serif: 'Montserrat', system-ui, sans-serif    /* headings, brand, eyebrow */
--sans:  'Source Sans 3', system-ui, sans-serif /* body, UI */
--mono:  'JetBrains Mono', ui-monospace, monospace /* numerics, badges */

Body: 14px / 1.45, weight 400, --ink
H1:   28px / 1.15, weight 800, letter-spacing -0.015em, Montserrat
H2 (panel): 14px, weight 700, letter-spacing -0.005em, Montserrat
Eyebrow: 11px, weight 700, letter-spacing 0.14em, UPPERCASE, --maroon-500
KPI value: 30px, weight 800, letter-spacing -0.02em, line-height 1
Tab: 13px, weight 600, Montserrat
Nav link: 13.5px, weight 500
```

Google Fonts URL (already in each file):

```
https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap
```

### Spacing & layout

- Page max-width: **1280px**, padding **24px**.
- Top bar height: **56px**, sticky.
- Card/panel internal padding: **18px** (or 14–16 for tighter components like KPI cards).
- Standard gap between stacked panels: **16px**; between KPI cards: **12px**.
- Collapse breakpoint for 2-col grids: **980px**.

### Radii

```
--radius-sm: 6px   /* buttons, pills, tags, brand mark */
--radius:    8px   /* panels, KPI cards, inputs */
--radius-lg: 12px  /* hero cards if any */
```

### Shadows

```
--shadow-sm: 0 1px 2px rgba(15,23,32,.04)
--shadow:    0 1px 2px rgba(15,23,32,.04), 0 1px 3px rgba(15,23,32,.06)
--shadow-lg: 0 1px 2px rgba(15,23,32,.04), 0 8px 24px rgba(15,23,32,.08)
```

(Dark mode shadows use `rgba(0,0,0,.3–.5)`.)

### Status / domain colors

- **DCP tiers:** Smedley → `--maroon-500`; President's → `--loyal-500`; Select → `--loyal-400`; Distinguished → `--green-600`; Projected → striped yellow; Not yet → neutral surface-3.
- **Health classifications:** Thriving (green), Healthy (loyal), Watch (yellow), At-risk (red). See methodology §05 for full definitions.
- **Deltas:** positive = `--green-600`, negative = `--red-600`. Always show the sign.

---

## Assets

- **Fonts:** Montserrat, Source Sans 3, JetBrains Mono — all from Google Fonts. Self-host in production for performance and privacy.
- **Iconography:** all icons are inline SVG, drawn with `stroke="currentColor"`, `stroke-width: 1.5–1.6`, `viewBox="0 0 16 16"`. Lucide or Heroicons (outline, 16px) are reasonable substitutes. Replacements should preserve stroke-based linework — do not swap for filled glyphs.
- **Brand mark:** "TS" wordmark in a rounded square (`--loyal-500`). Reproduce in CSS, not as an image asset.
- **Charts:** all hand-rolled SVG. Use the codebase's preferred chart library (Recharts, Visx, Chart.js, ECharts). Keep visual treatment consistent — thin strokes, dots on data points, light gridlines, no chart-title chrome (the panel header is the title).

No raster assets, logos, or photography are required.

---

## Files in this handoff

```
design_handoff_toast_stats/
  README.md                                  ← this file
  designs/
    Toast Stats - Districts.html             ← Screen 1: leaderboard
    Toast Stats - District.html              ← Screen 2: district detail
    Toast Stats - Club.html                  ← Screen 3: club detail
    Toast Stats - History.html               ← Screen 4: program-year archive
    Toast Stats - Methodology.html           ← Screen 5: methodology reference
```

Open the HTML files directly in a browser (no build step). They are static and self-contained except for the Google Fonts CDN.

---

## Implementation suggestions

- Centralize the token block as CSS custom properties or a theme config; the dark-mode override is a single media query.
- Build a shared `<AppShell>` component (top bar + footer + page container) to wrap all routes.
- The District page is where most engineering effort lives — model its tabs as routed sub-paths (`/districts/57/overview`, `/districts/57/clubs`, etc.) so deep-links work.
- Tables and charts dominate; budget time for the chart library and table component before sweating layout details. The visual layout matches the prototype 1:1 once those primitives exist.
- Health classifications and DCP tier rules live in methodology §04–05; encode those thresholds as a single source of truth shared by every screen.
