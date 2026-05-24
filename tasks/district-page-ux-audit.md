# District page — UX audit & way forward

**Date:** 2026-05-24
**Author:** Claude (ron-ux persona)
**Method:** Live Playwright screenshots of `/district/93` (top-ranked, fully populated) at 1440 / 768 / 375px in light + dark, against `docs/design/club-redesign-2026-05/HANDOFF.md`. Screenshots in `.routine-tmp/ux-audit/`.
**Scope:** `DistrictDetailPage.tsx` (the Overview/narrative page), not the routed sub-pages.

> Dev caveat: localhost can't read the prod CDN (CORS) — screenshots were taken with web-security disabled so real data loads. Two findings below (charts stuck "Loading chart…", white-block dark mode) reproduce with data present and should be re-verified on prod, but the dark-mode theming defect is real regardless of data.

---

## Root-cause framing — why it "feels off"

The handoff specified a **tabbed** district page: `Overview · Clubs · Divisions & Areas · Trends · Analytics · Global Rankings`, tabs swapping one viewport of content. Epic #571 (IA Phase 3) **retired the tab strip** and turned the page into a **single scrolling narrative** (Overview → Trends → Top clubs → Analytics → Divisions → Vs world) plus three routed sub-pages (clubs/divisions/rankings) reached by CTAs at the very bottom, plus an "On this page" anchor rail on the right (≥1024px only).

That one decision is the source of every complaint:

- The page now tries to be **both a narrative and a hub**, so it's enormous.
- The right rail is a **band-aid** for the resulting length — and it's the thing you hate.
- On mobile the rail is hidden, so the length has **zero wayfinding** → "terrible."

**The fix is an IA decision, not a styling pass.** Re-skinning won't help a 19,000px page.

---

## Findings by severity

### P0 — Mobile is an endless scroll with no wayfinding

- The mobile page is **~18,900px tall** (≈50 phone screens) — every section expanded, nothing collapsed. Evidence: `district-mobile-light.png` (1504×18936).
- The only section navigation (the "On this page" rail) is `display:none` below 1024px (`district-narrative.css:147`). So on the device class that needs jump-nav most, there is none.
- Header control cluster (Data-fresh pill + PY dropdown + as-of-date dropdown + Export + Share) crowds and wraps at 375px.

### P0 — Trend charts stuck on "Loading chart…" (white blocks)

- All three Trends charts render the loading placeholder indefinitely (0 `<svg>`) even though time-series JSON returns 200. Evidence: `charts.mjs` output, the gray/white mid-page mass in every full-page shot.
- In **dark mode these placeholders are bright white** — large glaring rectangles on a dark page (`district-desktop-dark.png`). The chart/plot container background is hardcoded, not `[data-theme]`-aware → **R10 violation**.

### P1 — The "On this page" right rail (the one you hate)

- It's a 200px column in a `minmax(0,1fr) 200px` grid (`district-narrative.css:153`), sticky at `top:80px`, but it starts level with the _Overview_ heading — leaving a **large empty void** in the top-right above it and an asymmetric layout. Evidence: `district-desktop-fold.png`.
- It duplicates wayfinding already provided by (a) scrolling and (b) the bottom CTAs, and it only exists on wide screens. Low value for the visual cost. **Recommend deleting it** as part of the IA fix below.

### P1 — KPI strip diverges from spec and is dense

- Shows **3 cards** (Paid Clubs, Membership Payments, Distinguished Clubs); handoff specs **4** (add **Net Member Change**).
- Each card stacks a rank badge ("09: #1"), "#1 of 128 · 1st percentile", and a cryptic horizontal gauge with `D S P 5m` tick marks at raw numbers. Too many encodings per card; the gauge needs a legend or removal.

### P2 — Header action cluster overloaded

- Five controls top-right (freshness pill, PY select, as-of-date select, Export CSV, Share). On desktop it's busy; on mobile it wraps. Consolidate Export/Share into an overflow "⋯" menu; consider merging PY + as-of date into one "time window" control.

### P2 — Breakpoint reconciliation

- Handoff: 2-col grids collapse at **980px**, tables→cards at **640px**. Current code uses 1024px for the rail and 640/768 for KPI. Align to the handoff system so the whole redesign is consistent.

### P2 — Dark-mode panel inconsistencies

- Besides the white charts, "Achievement Highlights" / "Education Levels" panels read lighter than surrounding surfaces in dark mode — audit all panels for token-driven backgrounds (R10).

---

## Way forward — full subpage IA (decided: no tabs)

**Decision (Ron, 2026-05-24): no client-side tabs.** Tabs collapse multiple views onto one URL, which breaks the back button, deep links, and per-view filter/sort state. Real routes ("subpages") preserve all three. #571 started this but only half-committed — it added subpages _and_ kept an everything-scroll at `/district/:id`. The fix is to **commit fully to subpages** and make the landing route a lean hub.

### Target route map

| Route                     | Content                                                                                                                                                              | Status                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `/district/:id`           | **Overview hub** — KPI strip, Distinguished District status, composition cards, anniversaries/milestones, and _top-5 preview_ lists that link out. Short, scannable. | reshape (trim)                                                          |
| `/district/:id/clubs`     | Clubs table                                                                                                                                                          | exists (epic #665 reskin)                                               |
| `/district/:id/divisions` | Divisions & areas                                                                                                                                                    | exists — **remove the duplicate inline Divisions section from the hub** |
| `/district/:id/rankings`  | Global rankings + "vs world"                                                                                                                                         | exists — **move inline "Vs world" here**                                |
| `/district/:id/trends`    | Membership + payment trend charts (3yr)                                                                                                                              | **NEW** — lift the heavy Trends section off the hub                     |
| `/district/:id/analytics` | Top growth clubs + Top DCP achievers (full)                                                                                                                          | **NEW or fold previews into hub** — settle in the IA issue              |

### Navigation between subpages — real links, not tab state

A persistent **secondary nav** under the district header: `Overview · Clubs · Divisions · Trends · Analytics · Rankings`. It may _look_ like a tab strip, but every item is an `<a href>`/`<Link>` to a real route — so browsing, back button, deep links, and each page's URL-encoded filters all keep working. The active route is highlighted. On mobile it's a horizontally-scrolling link row (handoff §126) or a `<select>` that navigates on change.

### What this fixes

- **Mobile:** each route is one short page → drops from ~50 screens to a few; the secondary nav gives wayfinding at every width (the old rail was hidden < 1024px).
- **The right rail you hate:** **deleted** — the secondary route-nav replaces it.
- **Desktop "off" feeling:** the hub becomes a lean, symmetric landing instead of a 19k-px dumping ground; no more empty 200px gutter.
- **Browsing/filtering:** preserved and _improved_ — Trends/Analytics get their own shareable URLs and filter state, same as Clubs already has.

### Open sub-decisions (settle in the IA issue)

- Analytics: own route vs. top-5 previews on the hub linking to Rankings/Clubs.
- Where the secondary nav lives: its own primitive, or reuse the breadcrumb component's row (#615).
- Whether the hub keeps a compact trends sparkline as a teaser that links to `/trends`.

### Cross-cutting fixes (apply under either decision)

1. Fix the charts stuck on "Loading chart…" (root-cause the lazy chart chunk); make the loading/empty placeholder **theme-aware** (R10).
2. Add the 4th KPI card (Net Member Change) or formally drop it from the spec; add a legend to (or remove) the KPI gauge.
3. Consolidate the header cluster (overflow menu for Export/Share; unify time-window controls).
4. Reconcile breakpoints to the handoff (980 / 640).
5. Full dark-mode panel audit (token-driven backgrounds only).

---

## Proposed epic — "District page UX: commit to subpage IA + mobile + chart/theme fixes"

Sequenced so the highest-pain, lowest-risk fixes ship first, then the IA map, then the migration.

1. **fix(district): trend charts stuck on "Loading chart…" + theme-aware placeholder** _(P0, bug)_ — root-cause the never-resolving chart load; loading/empty state uses `[data-theme]` tokens, no white-on-dark.
2. **fix(district): consolidate header action cluster + mobile overflow** _(P1)_ — overflow menu for Export/Share, unify time-window controls, no wrap at 375px.
3. **design: district subpage IA map + secondary route-nav (ADR)** _(P1)_ — lock the route map above; decide Analytics placement and the nav primitive; **delete the "On this page" rail** from the plan. Real `<Link>`s, no client tab-state. **Blocks 4–6.**
4. **feat(district): secondary route-nav primitive** _(P0)_ — persistent links `Overview · Clubs · Divisions · Trends · Analytics · Rankings`, active-route highlight, mobile horizontal-scroll/select; replaces the deleted rail. Works at all widths.
5. **feat(district): lean Overview hub** _(P0 for mobile)_ — trim `/district/:id` to KPIs + Distinguished status + composition + anniversaries + top-5 previews-with-links; **remove inline Divisions/Vs-world duplication**; delete `DistrictAnchorToc`.
6. **feat(district): promote Trends (+ Analytics) to own routes** _(P1)_ — new `/district/:id/trends` (and `/analytics` per the ADR); move the heavy charts/lists off the hub; each gets URL-encoded state like Clubs has.
7. **feat(district): KPI strip to spec** _(P1)_ — 4th card (Net Member Change) or documented drop; simplify/legend the D/S/P gauge.
8. **chore(district): breakpoint reconciliation + dark-mode panel audit + verification** _(P2)_ — align to 980/640; all panels token-driven; Playwright prod-vs-handoff at 375/640/980/1280 + dark.

---

## Evidence index (`.routine-tmp/ux-audit/`)

- `district-desktop-fold.png` — right-rail void, KPI density, header cluster.
- `district-desktop-dark.png` — white chart blocks on dark.
- `district-mobile-light.png` — the ~18,900px scroll.
- `district-tablet-light.png` — rail hidden, empty charts.
- `shoot.mjs`, `charts.mjs` — repeatable capture scripts (run with web-security disabled for local CDN).
