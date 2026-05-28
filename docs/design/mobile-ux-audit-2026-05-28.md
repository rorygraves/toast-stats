# Mobile UX Audit — 2026-05-28

**Sprint:** [#855](https://github.com/taverns-red/toast-stats/issues/855) ·
**Epic:** [#856](https://github.com/taverns-red/toast-stats/issues/856)

**Scope:** Full-site mobile-portrait audit at 375 px (iPhone SE 2 / iPhone 13
mini width), captured against production (`https://ts.taverns.red`) in both
Chromium and WebKit via Playwright. **No code change in this sprint** —
recommendations only.

**Operator brief:** _"Full-site mobile UX feels clumsy. Scope down to the
essentials on mobile, don't decorate."_

**Reading frame.** The primary user (per the cross-project UX principle) is "a
95-year-old on a phone or tablet, in low light, with reading glasses, on a
cellular connection." Every recommendation below is judged against that user,
not a developer scrolling a dev preview on a laptop.

**Capture method.** `frontend/e2e/mobile-audit-855.smoke.ts` drove 15 routes at
375×812 in both engines (`smoke` + `webkit`). Full-page screenshots written to
`/tmp/mobile-audit-855/` (30 PNGs, surfaced to the operator alongside this doc
via the PR comment). The smoke file is deleted from the branch after the audit
ships — it was a one-shot capture tool, not an ongoing test.

---

## TL;DR

Toast Stats is **a desktop dashboard rendered single-column on mobile**. Almost
every page is 15,000–25,000 px tall in portrait — the user scrolls forever, and
nothing fits the "95-year-old in low light on cellular" frame. The product
displays roughly the same density as desktop, with the columns linearised: every
KPI tile, every comparison panel, every analytic chart, every milestone, every
trophy section, all stacked. The dominant clumsiness is **breadth, not styling**
— the site shows everything to every user on every viewport.

The brief is **"scope down to the essential"**, so this audit applies a single
rule per page: _"if it isn't load-bearing for the typical mobile visit, hide it
behind a disclosure or drop it from mobile entirely."_ Keep is the smallest set
that earns viewport at 375 px; Simplify is what we keep but compress; Hide is
what we tuck behind "Show more" or drop from the mobile build path.

Eight proposed implementation epics close out the document.

---

## Cross-cutting findings

These show up on multiple routes and are best fixed once at the shared layer.

### CC-1 — "Single-column = desktop rendered tall" is the dominant failure mode

Page heights at 375 px (Chromium, full document):

| Route               | Height (px)   |
| ------------------- | ------------- |
| Landing `/`         | ~22,250       |
| District overview   | ~17,250       |
| District clubs      | ~24,620       |
| District divisions  | ~21,750       |
| Methodology         | ~16,000+      |
| District trends     | ~12,000+      |
| Rankings, Analytics | ~9,000–12,000 |

A 375 px viewport is 812 px tall. **The landing page is ~28 viewports tall.**
That is the headline number — no styling fix touches it; only deletion and
disclosure do.

### CC-2 — There is no "what's next for me" above the fold

UX principle: _critical paths visible without scrolling._ Open the live site on
a phone and the first screen of the landing page shows: brand bar, page title,
the program-year selector, a payments summary card. The most important "what's
my district doing right now" item — a single CTA toward _my_ district — is not
there. The user has to scroll past the global summary, find their district in
the table or rankings, and tap in. **The fold is real estate; the site spends
it on global decoration instead of a personal entry point.**

### CC-3 — Charts ship verbatim from desktop and lose meaning at 375 px

The Recharts blocks (membership trend, payments trend, ranking progression, all
multi-line / multi-series charts) render at the container width with desktop
tick spacing. At 375 px the x-axis labels overlap into a smear and the legend
truncates. Charts that compare _three program years_ overlay three line series
on a strip ~340 px wide — readable on a Mac, not legible at arm's length on a
phone. **A small-multiples or sparkline-with-tap-to-expand pattern is the
mobile shape; the full chart is the desktop shape.**

### CC-4 — Status / Outlook columns truncate on every comparison table

Division A, Area 01, every district subpage that shows a Status / Outlook
column at 375 px clips the cell to "vulne…" / "interv…" / "thriv…" — see
screenshots 08, 09. The information is _present in the page source_; it is
hidden by a fixed column width that wasn't sized for the phone viewport. This
is the same family as Lesson 105 (mobile-table pattern follows data purpose):
these tables are **browse-one-row** lists, so a card collapse is correct, but
that hasn't been applied here.

### CC-5 — DistrictSubnav scroll-row is the only nav primitive that's been mobile-shaped

The horizontally-scrollable `DistrictSubnav` (Overview · Clubs · Divisions ·
Trends · Analytics · Rankings) is the one shipped pattern that fits the phone:
it sits below the page header, scrolls thumbwise, and exposes every sibling
route at all widths. **It works. Don't break it.** It's the only nav row we
should hold up as a mobile pattern; the rest of the chrome was built for
desktop and shipped as-is.

### CC-6 — Touch-target compliance is uneven; native `<select>` traps remain

Lesson 111 codified the native `<select>` 20 px trap in WebKit (needs
`appearance: none` + `min-height`). Spot-checks of the program-year selector
on the landing page, the chart-tab switcher on the analytics page, and the
clubs sort control suggest the pattern is _not_ uniformly applied. A
44 px-floor sweep should run as a dedicated sprint, with the dual-engine smoke
locking it down (lesson 111's diagnostic family).

### CC-7 — `Path is not a link` discoverability gaps

`DistrictDivisionsPage` shows division _cards_ but does not link them to
`/district/:id/division/:divId`. `DistrictClubsPage` navigates to a club via
`useNavigate(...)`, not `<Link>`. That blocks long-press / open-in-new-tab on
mobile and breaks middle-click on desktop. Both routes _exist_ — they are
unreachable from the obvious surface.

### CC-8 — Methodology and other long-text pages have no in-page anchor TOC

The Methodology page renders as a ~16,000 px wall of prose. There are clear
H2-level sections in the source but no sticky TOC, no anchor links, no
collapse. On a phone the user has to scroll the whole page to find one
sentence. Same applies to any future doc-style route (History stub, anything
in `/docs/`).

### CC-9 — Two competing card stacks for the same data (Regions page)

`RegionsPage` shows _both_ a region table _and_ a region card list, top-to-
bottom, displaying the same data twice. Page is ~12 viewports tall to render
14 region rows. **Pick one shape; delete the other.** (Recommendation below:
keep the cards, kill the table.)

### CC-10 — Empty / error states default to bare prose, not a recovery affordance

`/region/1` renders the bare sentence _"No districts found for region 1. Back
to all districts."_ "Back to all districts" reads like prose; it should be a
button (or `<Link>` styled as a button). Empty states across the audit either
render only a sentence or render a half-page-empty card cluster — neither
guides the user to the next action.

### CC-11 — Footer + version chrome eats above-the-fold space on short pages

The fixed footer ("Toast Stats · ts.taverns.red · A Red Taverns production /
Data: dashboards.toastmasters.org · MIT License · v2.20.1") is the same height
on a sparse page (`/region/1`) as it is on a 22,000 px landing page. On the
sparse page it competes with the empty-state message for attention; on the
long pages it is invisible until the very end. Consider whether the version
string belongs in chrome at all (an About / Methodology link absorbs it).

---

## Per-page evaluation

Page-by-page at 375 px. **Keep / Hide / Simplify** is a verdict on each block
_on mobile_; desktop is unchanged unless called out. Width quoted is full-page
height at 375 px (Chromium).

### 1. `/` — Landing / `DistrictsPage` (~22,250 px)

**What's there:** brand bar; PY selector; global summary KPI; Awards Race
section (multiple award podiums); Districts table (filterable, sortable) +
Districts cards (the long thin stack visible in the screenshot); Last-updated
note; footer.

**What's clumsy on mobile:** the Awards Race section eats the entire first
screen — _global_ awards before the user has any way to find their _own_
district. The districts table linearises into a one-card-per-row stack that
runs the entire page length (138 districts × per-row chrome). The PY selector
and filter chip row push the actual rankings even further down.

**Recommendations:**

- **Keep on mobile:**
  - A single global headline KPI (worldwide clubs, worldwide growth) — _one_
    tile, not the strip.
  - A search-or-pick-district primary action above the fold (the "next thing"
    the user came for).
  - The districts list as cards.
- **Simplify:**
  - Districts list → top-N (e.g. top 10) by default, with a "Show all 138" tap
    to expand. The user came for their district, not the leaderboard.
  - Filter chips → fold behind one "Filters" disclosure (the desktop chip row
    is fine; the linear column wastes 5–6 viewports).
- **Hide:**
  - Awards Race / Awards podium section → move to the dedicated `/awards`
    page only (it _already exists_ at `/awards` and is well-shaped — see page
    15 below). On mobile landing, replace it with a single "See Awards →" tap.
  - The duplicate "regional listing" / per-region breakdown on the landing
    page — `/regions` already covers this; the landing should not.

### 2. `/district/:id` — `DistrictDetailPage` overview (~17,250 px)

**What's there:** district header (program year + status); 4 KPI tiles; an
overview block; payment composition donut; Distinguished status card; gap-to-
Distinguished table; upcoming renewals list; **milestones** for the PY (very
long); **longest-serving clubs** leaderboard; subnav (Clubs · Divisions ·
Trends · Analytics · Rankings).

**Recommendations:**

- **Keep:**
  - District header + 4 KPI tiles (this is the district-level "what's next").
  - DistrictSubnav (CC-5 — this works).
  - "Cap to Distinguished" — the closest thing to a personal CTA.
- **Simplify:**
  - KPI tiles → 2×2 grid on mobile, not 1×4 stack (you already have a 4-up
    grid that linearises; collapse it to 2×2 to halve vertical space).
  - Payment composition donut → small inline sparkbar / "$X of $Y" line; the
    donut + legend stack eats ~3 viewports for one ratio.
  - Upcoming renewals → "Next 3, see all →"; the full list runs ~6 viewports.
- **Hide on mobile (move behind disclosure):**
  - Milestones list — fold under "Milestones (PY 25–26) ▾"; very long, low
    "what do I do next" value on a phone.
  - Longest-serving clubs — fold under "Longest-serving clubs ▾"; secondary
    detail.
  - Distinguished status _explainer_ card (the prose about rules) — link to
    Methodology; the rules don't belong inline on every district page.

### 3. `/district/:id/clubs` — `DistrictClubsPage` (~24,620 px)

**What's there:** subpage breadcrumb; DistrictSubnav; filters/search toolbar;
sort/columns menus; clubs list rendered as ~162 cards top-to-bottom.

**Recommendations:**

- **Keep:**
  - Search input above the fold (the primary action).
  - The clubs-as-cards pattern (correct shape: browse-one-row, lesson 105).
  - DistrictSubnav.
- **Simplify:**
  - Each club card → name, status badge, _one_ headline metric (e.g. paid /
    base, or current vs. baseline). The current card shows ~5 metrics × 162
    clubs; the user can drill in for detail.
  - Sort + columns menus → collapse to a single "Sort" sheet (one chooser, not
    two adjacent buttons). The "columns" menu is desktop-only intent — on a
    card list there are no columns.
  - The filter toolbar collapses behind one "Filters (N)" disclosure on mobile
    (this is the same pattern as the divisions/areas tables but applied
    consistently).
- **Hide:**
  - Bulk-select / multi-action affordances (if present) — mobile users don't
    do bulk ops.

### 4. `/district/:id/divisions` — `DistrictDivisionsPage` (~21,750 px)

**What's there:** subpage breadcrumb; DistrictSubnav; division performance
cards (4–8 cards depending on district); Distinguished Area Program criteria
explainer; per-area recognition panel (very long — every division × every
area).

**Recommendations:**

- **Keep:**
  - Division cards (one row per division) → these earn their slot.
  - DistrictSubnav.
- **Simplify:**
  - Per-area recognition panel → group by division (the data does), default
    each division collapsed, expand on tap. Right now every area for every
    division is rendered open.
  - DAP criteria explainer → a single tappable "How are areas measured? →"
    link, not the inline three-paragraph card.
- **Hide:**
  - The DAP recognition checklist / per-criteria badges — fold them inside
    each area's expand state; show "X of N criteria met" on the collapsed row.
- **Discoverability fix (CC-7):** division cards must `<Link>` to
  `/district/:id/division/:divId`. Currently they don't.

### 5. `/district/:id/rankings` — `DistrictRankingsPage` (~9,000 px)

**What's there:** subpage breadcrumb; DistrictSubnav; "End-of-Year Rankings"
tier cards (Overall, Paid Clubs, Education, Distinguished); a Ranking
Progression chart (Year / Period / Last 3 / Payments tabs); "Multi-Year
Comparison" stack — one card per PY going back ~10 years.

**Recommendations:**

- **Keep:**
  - End-of-Year Rankings tier cards (top of page) — this is the page's
    primary value.
  - DistrictSubnav.
- **Simplify:**
  - Ranking Progression chart → small "this district vs world median"
    sparkline; the four-tab full chart is the desktop shape.
  - Multi-Year Comparison → 3 most recent years inline + "Show full archive →"
    tap. The 10-year stack is the desktop browser view.
- **Hide:**
  - "Period / Last 3 / Payments" chart tabs on mobile — a single canonical
    view; tabs on mobile are CC-2-style decoration.

### 6. `/district/:id/trends` — `DistrictTrendsPage` (~12,000 px)

**What's there:** District Membership Trend card (current / baseline / peak /
loss); insights block; trend chart; Membership Payments Trend card; payments
chart; Year-over-Year Comparison block; bar comparisons; key insights.

**Recommendations:**

- **Keep:**
  - The "Current / Baseline / Peak / Loss" tile (with the change number) —
    this is what people glance at.
  - YoY single-number comparisons (Total Membership / Distinguished / Thriving).
- **Simplify:**
  - Both trend charts → small sparkline + "Tap to expand" full chart in an
    overlay sheet. Multi-series at 340 px wide is unreadable (CC-3).
- **Hide:**
  - "Insights" prose block — fold under a "Why does this number matter? →"
    disclosure.
  - The YoY bar charts (the visual repeats the numbers above them). Keep the
    numbers, drop the bars on mobile.

### 7. `/district/:id/analytics` — `DistrictAnalyticsPage` (~12,000 px)

**What's there:** subpage breadcrumb; DistrictSubnav; Top Growth Clubs list
(top ~8 clubs by Δ); Top DCP Goal Achievement list; Achievement Highlights;
Education Levels distribution; bar charts and small inline visualisations.

**Recommendations:**

- **Keep:**
  - "Top Growth Clubs" (top 5, not top 8 on mobile).
  - "Top DCP Goal Achievement" (top 5).
- **Simplify:**
  - Education Levels distribution → progress bars + numbers, not the inline
    bar chart with axes.
  - Achievement Highlights → 2×2 stat grid, not a longer column.
- **Hide:**
  - "Average DCP Goals" sub-stats below the top growth list — duplicates info
    already in the per-club cards above.

### 8. `/district/:id/division/:divId` — `DivisionPage` (~3,800 px)

**Status:** **the closest thing to a mobile-shaped page in the audit.** Four
KPI cards (Clubs / Total Members / Thriving / Needs Attention), then four
per-area mini-tables (Area 01–04), each with 4–5 club rows. Information
density per viewport is right.

**Recommendations:**

- **Keep:** the four KPI cards (2×2 on mobile).
- **Simplify:** the per-area tables truncate "Status" to "vulne…"
  (CC-4). Replace each row with a single chip: `Limestone City Club —
Vulnerable`. Status is a short string; let it _be_ a chip, don't try to
  table it.
- **Hide:** nothing significant — this page already follows the brief.

### 9. `/district/:id/division/:divId/area/:areaId` — `AreaPage` (~2,900 px)

**Status:** clean. Header crumb, 4 KPIs (Clubs / Total Members / Thriving /
Distinguished+), one mini-table of clubs in the area.

**Recommendations:**

- **Keep:** everything.
- **Simplify:** same Status-chip move as the Division page (CC-4).
- **Hide:** nothing.

### 10. `/district/:id/club/:clubId` — `ClubDetailPage` (~9,500 px)

**What's there:** breadcrumb (`District 61 › Clubs › Limestone City Club`);
club header card with status badges; KPI tiles (Base / Current / Net Δ / DCP
Goals); membership trend chart; DCP Status block with "Gap to each tier"
table; Risk Factors callout; Close-to-Distinguished callout; DCP Goals
Progress block with a multi-checkpoint timeline; per-goal checklist (1–10).

**Recommendations:**

- **Keep:**
  - Club header card (name + status badges + base/current + DCP-goals tile)
    — this is the "scoreboard" people came for.
  - Risk Factors callout — high-signal, short, action-oriented.
  - Close-to-Distinguished callout — same.
- **Simplify:**
  - "Gap to each tier" table → a single "X to next tier (Y)" sentence with
    a stretch line for the second-nearest tier. The 4-row table is desktop
    framing.
  - Membership Trend chart → sparkline with the "Base / Current / Change"
    chip above it. Tap to expand into a full chart sheet.
  - DCP Goals Progress checkpoint table → one row, the **most recent**
    checkpoint, with a "history ▾" expand for older checkpoints.
- **Hide:**
  - "Per-goal" checklist of 10 goals → fold under "Goal detail ▾". Goals are
    independent (tripwire), so the count is what matters at-a-glance; the
    list is drill-in.
  - "DCP Status" duplicate per-tier explainer — link to Methodology.

### 11. `/regions` — `RegionsPage` (~12,000 px)

**Status:** **CC-9 lives here.** A complete region _table_ followed by a
complete region _card grid_, both at the same nesting level, with identical
data.

**Recommendations:**

- **Keep:**
  - Region cards (the second half of the current page) — cards are right for
    14 regions at 375 px.
  - The "find a region" chip row at the top (`All regions · 01 · 02 · …`).
- **Simplify:**
  - Card sort order — group by some signal (paid clubs descending? region
    number ascending?) and document the sort. Current order looks arbitrary.
- **Hide:**
  - The entire upper region table. Same data, less mobile-shaped, duplicates
    every metric.

### 12. `/region/:n` — `RegionPage` (sparse states only — ~870 px tall on the

empty case `/region/1`)

**Status:** CC-10 lives here. _"No districts found for region 1. Back to all
districts."_ is the entire body.

**Recommendations:**

- **Keep:** nothing of the current empty body.
- **Simplify:** Render an explicit empty card with:
  - Headline: _"Region 1 has no districts assigned this program year."_
  - A primary button: **"← All regions"** (proper button, not prose).
  - A secondary button: **"Pick another region ▾"** dropping the region chip
    row.
- **Hide:** the trailing footnote ("1 district not yet assigned…") on the
  Regions page → move it onto the empty Region page as the explanation. (It
  is more relevant where the user lands than on the index.)

### 13. `/history` — `HistoryPage` (~1,400 px)

**Status:** sparse "coming soon" stub. Year-tab row, then a `Per-year summary
cards coming soon.` paragraph linking out to Toastmasters International.

**Recommendations:**

- **Keep:** the year-tab row (it's already mobile-shaped).
- **Simplify:** the "coming soon" paragraph → a single inline empty-state
  card with a "Get notified when this ships" affordance _if_ the operator
  intends to build it; otherwise drop the stub and remove the route.
- **Hide:** the explanatory paragraph linking out to TI.org — most mobile
  users won't follow it; demote to a tiny "Pre-2019 data" footer link.

**Open question for the operator:** if this page is shelved, the better move
is to **delete the route** and the link from the top-bar nav. Half-shipped
pages teach users to mistrust the menu.

### 14. `/methodology` — `MethodologyPage` (~16,000 px)

**Status:** CC-8 lives here. Six dense H2 sections, no TOC, no anchor links,
no collapse. On a phone this is a ~20-viewport scroll to find any one rule.

**Recommendations:**

- **Keep:** the prose content — accurate, well-written, deserves to stay.
- **Simplify:**
  - Add an in-page sticky TOC with anchors (visible on mobile as a "Jump to
    ▾" chip pinned under the header).
  - Default every H2 section _collapsed_ on mobile; "Tap a section to expand."
  - Pull a one-sentence "what does this page answer?" lede above the section
    list so the user knows whether to dive in.
- **Hide:** any per-page deep-links sprinkled across the prose if they are
  also reachable from the TOC (duplication noise).

### 15. `/awards` — `AwardsPage` (~6,000 px)

**Status:** **already mobile-shaped.** Card per award, top-10 ranked list per
card, every district number is a tap target into the corresponding district
page. Clean.

**Recommendations:**

- **Keep:** the page as-is.
- **Simplify:** maybe a "Filter by region" chip if the list grows; not
  required now.
- **Hide:** nothing.

This is the **reference page** for the rest of the audit — when a page is
called "scoped down," this is the shape.

---

## Proposed implementation epics

Eight epics, sized so each one ships independently. Sequenced by what most
helps the 95-year-old on a phone _today_, not by code locality.

### Epic A — Landing-page mobile triage (highest ROI)

**Goal:** turn `/` from a 28-viewport scroll into a "find my district" page.

**Sprints:**

1. **Hoist** a "Find your district" search/picker above the fold; demote the
   global KPI strip to a single tile.
2. **Defer** the Awards Race section behind a "See Awards →" link (it already
   has a home at `/awards`).
3. **Cap** the districts list to top-N + "Show all 138" disclosure on mobile;
   keep the full list as desktop default.
4. **Verify** at 375 px / 414 px (Chromium + WebKit smoke); confirm scroll
   length drops by ≥60 %.

**Why first:** the landing page is the front door, and currently it does the
opposite of "scope down to the essential."

### Epic B — District overview compress (next highest ROI)

**Goal:** make `/district/:id` glanceable.

**Sprints:**

1. **2×2 KPI grid** on mobile (currently 1×4 stack).
2. **Fold** Milestones + Longest-Serving Clubs behind disclosures.
3. **Replace** the payment composition donut with an inline sparkbar at 375 px.
4. **Cap** Upcoming Renewals to Next 3 + "Show all →".

### Epic C — Mobile table treatments (cross-cutting)

**Goal:** kill CC-4 (Status truncation) and CC-7 (no-link cards) site-wide.

**Sprints:**

1. **Status chip** treatment for every "Status / Outlook" column at <768 px
   (Division, Area, mini-tables on district pages, club mini-tables).
2. **`<Link>` wrap** for division cards (CC-7); `<Link>` wrap for clubs cards
   (CC-7 — currently `useNavigate`); spot-check every "card that should be a
   link."

### Epic D — Mobile charts strategy

**Goal:** kill CC-3 (charts unreadable at 375 px).

**Sprints:**

1. **Sparkline-then-expand** pattern: at <768 px, multi-series Recharts
   blocks render as a sparkline with the relevant numbers above; tap opens a
   full-screen sheet with the desktop chart.
2. Apply to: District Trends (membership + payments), Club detail (membership
   trend), Rankings Progression, Awards visualisations.

### Epic E — Methodology + long-text pages

**Goal:** kill CC-8.

**Sprints:**

1. **In-page TOC** with anchor links; default H2 sections collapsed on mobile.
2. **Sticky "Jump to ▾"** chip under the page header.
3. **Lede** at top of each long-text page summarising what it answers.

### Epic F — Regions page de-duplication + sparse-region empty state

**Goal:** kill CC-9 and one instance of CC-10.

**Sprints:**

1. **Delete** the region table from `/regions`; keep the card grid.
2. **Card sort** by a documented metric (proposed: paid clubs descending).
3. **Empty-state** for `/region/:n` with no districts: proper card + buttons,
   not prose (Lesson on empty-state recovery applies generally).

### Epic G — Touch-target sweep (lesson 111 cousins)

**Goal:** every interactive element on every routed page hits 44 × 44 px in
both Chromium and WebKit.

**Sprints:**

1. **Audit** every `<select>`, `<button>`, chip, link-as-button at 375 px in
   both engines (lesson 111 family).
2. **Fix** the native `<select>` instances (program-year picker, chart-tab
   switcher, clubs sort) with the `appearance: none + min-height: 44px`
   pattern from lesson 111.
3. **Tripwire** a dual-engine smoke for the floor (extend the pattern from
   #710 / #732).

### Epic H — Chrome real-estate trim

**Goal:** kill CC-11; recover viewport at the top of every page.

**Sprints:**

1. **Footer** — move version + license behind a tappable "About ▾" in the
   hamburger menu; drop the full footer chrome on mobile.
2. **Page header** — collapse the "District 61 / Program Year May 27, 2026"
   sub-line into the title (`District 61 · PY 25–26`) on mobile; recover ~80
   px above the fold per page.

### Optional bonus — Epic I (defer to operator)

`/history` is a stub. Either build it (the "Per-year summary cards coming
soon." copy says it's planned) or **remove the route and the nav link**.
Half-built pages teach users not to trust the menu.

---

## What I did NOT recommend (and why)

- **A mobile-only design system.** Two design systems double maintenance; the
  failure here is breadth of content, not absence of mobile components.
- **A "mobile app" wrapper.** The site _is_ mobile-capable today; the issue
  is what's shown, not how.
- **Hiding the data tables on desktop.** Desktop earns the density; mobile
  doesn't. The recommendations are all `<768 px` conditional.
- **A "lite" route.** A separate `/m/` URL surface forks SEO and breaks
  shareable links between phone-and-laptop users.

---

## No code changes this sprint — awaiting operator decision

This document is the deliverable. The PR ships only this file. The operator
reviews, picks which proposed epics to queue (A through H, optional I), and
the implementation epics file as separate work items.

The screenshot evidence (30 PNGs, Chromium + WebKit, 15 routes each, 375 ×
812 viewport) was captured to `/tmp/mobile-audit-855/` and surfaced via the
PR comment for operator review. The Playwright capture script
(`frontend/e2e/mobile-audit-855.smoke.ts`) is deleted from the branch after
the audit ships — it was a one-shot tool, not an ongoing test (re-shooting is
cheap; running it on every CI invocation is not).
