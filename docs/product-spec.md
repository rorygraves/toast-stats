# Product Spec — Toast Stats

**Live site:** [ts.taverns.red](https://ts.taverns.red)
**Last updated:** April 16, 2026

---

## What is this?

A data visualization platform for **Toastmasters district leaders** to track club performance, identify at-risk clubs, and make data-driven decisions. It scrapes public Toastmasters dashboard data, computes analytics, and presents them through a CDN-served React SPA.

### Core value proposition

> "See your district's health at a glance, catch struggling clubs early, and track progress toward Distinguished."

### Who uses this?

| Persona           | Primary need                                                |
| ----------------- | ----------------------------------------------------------- |
| District Director | District-level membership trends, Distinguished projections |
| Division Director | Division/Area performance comparison, recognition tracking  |
| Area Director     | Club health status, at-risk club identification             |
| Club President    | Per-club membership trend, DCP goal progress                |

---

## Shipped Features

### Landing Page

| Feature                     | Description                                                                                     | Status     |
| --------------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| Global district rankings    | Borda-count rankings across membership, payments, DCP                                           | ✅ Shipped |
| Multi-year comparison table | YoY district metrics comparison                                                                 | ✅ Shipped |
| Historical rank charts      | Track rank progression over program years                                                       | ✅ Shipped |
| Program year selector       | Switch between program years (July-June)                                                        | ✅ Shipped |
| Dark mode                   | Full theme toggle — WCAG AA contrast verified on every route (Track D sweep #608–#611 complete) | ✅ Shipped |
| Region filter pill bar      | Always-visible toggle pills for region filtering                                                | ✅ Shipped |
| Awards Race section         | Top-3 leaderboards for Extension, 20-Plus, Retention awards (collapsed)                         | ✅ Shipped |
| Inline award badges         | Trophy pills next to district names for competitive award winners                               | ✅ Shipped |

### District Detail Page

| Feature                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Status     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Overview hub** (`/district/:id`)        | Lean Overview: KPI strip, Distinguished status, composition, anniversaries, longest-serving leaderboard + CTAs that link out. Routed subpages replace the old tab strip (epic #674); a persistent `DistrictSubnav` (Overview·Clubs·Divisions·Trends·Analytics·Rankings) is the lateral nav at every width                                                                                                                                                   | ✅ Shipped |
| **Clubs** (`/district/:id/clubs`)         | Sortable table of all clubs with health status, filters                                                                                                                                                                                                                                                                                                                                                                                                     | ✅ Shipped |
| **Divisions** (`/district/:id/divisions`) | Division/Area performance cards, recognition tracking                                                                                                                                                                                                                                                                                                                                                                                                       | ✅ Shipped |
| **Analytics** (`/district/:id/analytics`) | Own deep-linkable route (#680, ADR-005): Top-Growth clubs + Top-DCP achievers + education-levels rollup. Promoted off the hub so the subnav item is a real destination; PY/date URL-synced. Legacy `?tab=analytics` redirects here                                                                                                                                                                                                                          | ✅ Shipped |
| **Trends** (`/district/:id/trends`)       | Own deep-linkable route (#680, ADR-005): membership trend chart, payments chart, YoY comparison. Promoted off the hub; PY/date URL-synced. Legacy `?tab=trends` redirects here                                                                                                                                                                                                                                                                              | ✅ Shipped |
| Club detail page                          | Per-club membership chart, DCP timeline, base/current/change stats                                                                                                                                                                                                                                                                                                                                                                                          | ✅ Shipped |
| Club page redesign (v3.4)                 | Pixel-perfect re-skin to `club-reference.html` (epic #617): gradient hero + 8-stat strip (#618), Membership Trend chart with key-date verticals (Jul 1/Oct 1/Apr 1/Jun 30) + DCP Status panel with per-tier gaps (#619), Close-to-Distinguished callout (repositioned below the trend row) + DCP Goals Progress panel — progress bar + per-goal status grid (#620) + Goal Achievement Timeline (#621). Loyal-blue palette, `[data-theme='dark']` dark mode. | ✅ Shipped |
| Goal Achievement Timeline                 | Historical DCP-goals-met progression at 5 dates per PY (Sep 1/Nov 1/Jan 1/Mar 1/current), nearest-prior-snapshot fallback (#621)                                                                                                                                                                                                                                                                                                                            | ✅ Shipped |
| Provisional Distinguished                 | Pre-April indicator with confirmed fallback level per tier                                                                                                                                                                                                                                                                                                                                                                                                  | ✅ Shipped |
| CSP status on club page                   | Club Success Plan submission status (✓/✗/—) on club detail page                                                                                                                                                                                                                                                                                                                                                                                             | ✅ Shipped |
| District Recognition trophy               | Distinguished District tier badge + 5-prerequisite checklist + gap analysis on Overview                                                                                                                                                                                                                                                                                                                                                                     | ✅ Shipped |
| Club health classification                | Thriving / Vulnerable / Intervention Required                                                                                                                                                                                                                                                                                                                                                                                                               | ✅ Shipped |
| Distinguished projections                 | Project year-end Distinguished club count                                                                                                                                                                                                                                                                                                                                                                                                                   | ✅ Shipped |
| Division/Area recognition                 | DAP/DDP status tracking per rules reference                                                                                                                                                                                                                                                                                                                                                                                                                 | ✅ Shipped |
| Performance targets                       | World rank, percentile, target thresholds from CDN                                                                                                                                                                                                                                                                                                                                                                                                          | ✅ Shipped |
| Date selector                             | Browse historical snapshots within a program year                                                                                                                                                                                                                                                                                                                                                                                                           | ✅ Shipped |
| Deep links (URL state)                    | Program year, date, tab, sort, filters, pagination synced to URL                                                                                                                                                                                                                                                                                                                                                                                            | ✅ Shipped |
| Upcoming Anniversaries                    | Overview panel listing clubs whose next charter anniversary is within 60 days (#446)                                                                                                                                                                                                                                                                                                                                                                        | ✅ Shipped |
| Milestone clubs of the PY                 | Overview callout grouping 5/10/.../100-year milestone clubs by milestone, this PY (#447)                                                                                                                                                                                                                                                                                                                                                                    | ✅ Shipped |
| Club anniversary badge                    | Club hero pill: quiet / milestone-gold / upcoming countdown for charter anniversaries (#445)                                                                                                                                                                                                                                                                                                                                                                | ✅ Shipped |
| Years Chartered column                    | Sortable "Years" column in the Clubs table — years since charter, em-dash when unknown (#448)                                                                                                                                                                                                                                                                                                                                                               | ✅ Shipped |

### Regions Overview (`/regions`)

| Feature            | Description                                                                                                                                                                      | Status     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Region leaderboard | Sortable 14-region table (districts, paid clubs, payments, distinguished, score); aggregate of the per-district feed (#494, #496)                                                | ✅ Shipped |
| Region cards grid  | 14 KPI cards with leading-district + requirements ribbon, each linking to `/region/:n` (#495)                                                                                    | ✅ Shipped |
| Region finder bar  | Jump-to-region filter: numbered chips + "All regions" reset isolate one region across both leaderboard and grid — a region is one click away, not a scroll-and-hover hunt (#685) | ✅ Shipped |

### Region Page (`/region/:n`)

| Feature                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Status     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| KPI strip                   | Base → current → Δ → ±% for Paid Clubs, Payments; year-cumulative for Distinguished (#514)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ✅ Shipped |
| Rank-within-region col      | District table leads with region-internal rank by aggregateScore desc, ties marked (#515)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | ✅ Shipped |
| Region-chip link            | District page region rank chip links to `/region/:n` when region is numeric (#518)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ✅ Shipped |
| Distinguished countdown     | Per-district countdown columns to the minimum DD tier. The percentage-point prerequisite columns (Payment Growth, Distinguished %, Club Growth %) were replaced by the absolute Remaining-to-Distinguished group (#688); Net Club Growth became the Paid Clubs Δ sub-column (#687); Education/Training + CGD officer awards remain (#516, #534)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ✅ Shipped |
| Tier column                 | Per-district trailing tier chip — brand-colored when achieved, em-dash for NotDistinguished (#517)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ✅ Shipped |
| Remaining-to-minimum counts | Three "Remaining to Distinguished" columns (paid clubs / payments / distinguished clubs) on the region table show the absolute count still needed to reach the minimum Distinguished tier — ✓ when met, the count when not, em-dash when data missing. Replaces the percentage-point gap columns (Amy wants the count, not the %). Analytics (#686): `paymentsRemaining`=`max(0, ceil(paymentBase×1.01)−totalPayments)`, `paidClubsRemaining`=`max(0, ceil(paidClubBase×1.01)−paidClubs)`, `distinguishedClubsRemaining`=`max(0, ceil(paidClubBase×0.45)−distinguishedClubs)`; targets from the Distinguished `TIER_THRESHOLDS` so a 0 matches `meetsThreshold`; distinguished% denominator is `paidClubBase`, not activeClubs (lesson 60). The frontend prefers these fields and, on a pre-pipeline snapshot, derives the identical count from the rankings row's raw base+current counts — NOT TI's pre-rounded growth %, which drifts ±1 (#688). (#686, #688) | ✅ Shipped |
| Mobile / responsive table   | The 19-column ranking table uses an **intentional, documented horizontal scroll**, not a card collapse — a regional leaderboard exists to compare districts across rows, which a stacked card would destroy (the clubs table cards each club independently; this table does not). The scroll is made non-trap three ways: the scroller is a keyboard-operable region (`role=region` + `tabindex=0` + aria-label, WCAG 2.1.1); the Region Rank + District identity columns are **sticky-left** so each row stays labelled while the metric columns scroll; a right-edge fade cue signals more columns. Same focusable-region + cue treatment on the regions-index leaderboard. Verified at 375/640/768/1280 + dark mode. (#689)                                                                                                                                                                                                                                   | ✅ Shipped |
| Dark mode                   | Both region surfaces pass the WCAG-AA dark-mode contrast audit (`RegionDarkModeContrast.test.ts`, swept in #609); the Sprint 4–6 columns reuse already-remapped utilities. The sticky-column and scroll-cue backgrounds are theme tokens (`--surface`/`--surface-2`), guarded against the hardcoded-literal trap (lesson 092) by audit assertions. (#609, #689)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ✅ Shipped |

### Cross-page chrome

| Feature           | Description                                                                                                                                                            | Status     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| DataControlsBar   | Tight 3-chip cluster (data-fresh pill, PY chip, date chip) on /districts and /district/:id (#528)                                                                      | ✅ Shipped |
| SubpageBreadcrumb | Back-to-district breadcrumb on routed sub-pages — `District N` on /clubs,/divisions,/rankings; `District N › Clubs › <club>` on club detail (filter round-trip) (#577) | ✅ Shipped |

### Observability

| Feature              | Description                                                      | Status     |
| -------------------- | ---------------------------------------------------------------- | ---------- |
| CDN cache monitoring | HIT/MISS ratio tracking with dev-mode warnings at >50% miss rate | ✅ Shipped |

### Data Pipeline

| Feature                 | Description                                              | Status     |
| ----------------------- | -------------------------------------------------------- | ---------- |
| Daily scraping          | Automated daily CSV scraping from Toastmasters dashboard | ✅ Shipped |
| Transform + analytics   | Raw CSV → district snapshots → computed analytics        | ✅ Shipped |
| CDN-served data         | All data served via Cloud CDN with immutable cache       | ✅ Shipped |
| Time-series generation  | Monthly membership/payment data points per district      | ✅ Shipped |
| Time-series CDN serving | Time-series files served with 1-hour cache               | ✅ Shipped |
| Club trends index       | Per-district club trend data for club detail page lookup | ✅ Shipped |
| Rebuild mode            | Re-process all historical dates from raw CSV             | ✅ Shipped |
| Rescrape mode           | Re-collect CSVs from dashboard for specific dates/year   | ✅ Shipped |
| Prune mode              | Reduce to one snapshot per month per program year        | ✅ Shipped |

---

## Business Rules

All Toastmasters-specific rules are documented in [toastmasters-rules-reference.md](file:///Users/rservant/code/toast-stats/docs/toastmasters-rules-reference.md). Key rules that drive product behavior:

| Rule                                        | Where implemented                                        | Notes                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Program year = Jul 1 – Jun 30               | `programYear.ts`, pipeline                               | All data scoped by program year                                                                                                                                                                                                                                                                                                                                       |
| Club health = Thriving/Vulnerable/IR        | `ClubHealthAnalyticsModule.ts`                           | Based on membership, DCP checkpoints, CSP                                                                                                                                                                                                                                                                                                                             |
| Net growth = Active Members − Mem. Base     | `ClubEligibilityUtils.ts`                                | Used for Distinguished eligibility                                                                                                                                                                                                                                                                                                                                    |
| Payments ≠ Members                          | `toastmasters-rules-reference.md` §4.1                   | Members pay twice/year; payment count ≤ 2× membership                                                                                                                                                                                                                                                                                                                 |
| Base membership = end of prior year         | `useTimeSeries.ts`                                       | Fallback: first point of current year                                                                                                                                                                                                                                                                                                                                 |
| CSP required for Distinguished (2025-2026+) | `ClubEligibilityUtils.ts`                                | Historical data assumes CSP submitted                                                                                                                                                                                                                                                                                                                                 |
| Provisional Distinguished (pre-April)       | `ClubEligibilityUtils.ts`, `provisionalDistinguished.ts` | Level-specific thresholds: Smedley=25, President=20 (no growth alt), Select=20/5, Distinguished=20/3. Shows aspirational level + confirmed fallback.                                                                                                                                                                                                                  |
| District Recognition Program (§13)          | `toastmasters-rules-reference.md` §13                    | 11 award types: 4 Distinguished tiers (with 5 prerequisites), 3 competitive, 2 threshold, 2 officer. Source: Item 1490, Rev. 04/2025.                                                                                                                                                                                                                                 |
| Close to Distinguished (≤ 4 members)        | `closeToDistinguished.ts`, `membersToDistinguished.ts`   | Shared threshold `CLOSE_TO_DISTINGUISHED_MAX_MEMBERS = 4`; beyond 4 the indicator hides — multi-month drives are not "close" (#433). The clubs-table chip uses `isCloseToDistinguished`; the club-page banner uses the `computeMembersToDistinguished` engine bounded by the same constant, so it also fires when the only barrier is member-earned Goals 7/8 (#620). |

---

## Decided — Not Yet Shipped

### District Awards Suite (#328)

| Feature                      | Description                                                                | Phase | Issue | Status     |
| ---------------------------- | -------------------------------------------------------------------------- | ----- | ----- | ---------- |
| Parse new CSV columns        | Extract prerequisites (Y/N), Smedley counts, totals from All Districts CSV | 1     | #329  | ✅ Shipped |
| Competitive award standings  | Compute Extension, 20-Plus, Retention award rankings                       | 1     | #330  | ✅ Shipped |
| Landing page Awards Race     | Inline award badges + collapsed leaderboard section                        | 1     | #331  | ✅ Shipped |
| Distinguished District tiers | 4 tiers with prerequisite gates + gap analysis (trophy case on Overview)   | 2     | #332  | ✅ Shipped |
| Threshold + officer awards   | Club Strength, Leadership Excellence, PQD/CGD awards                       | 3     | #333  | ✅ Shipped |

### Other

| Feature                   | Description                                           | Issue |
| ------------------------- | ----------------------------------------------------- | ----- |
| Payment breakdown columns | Surface New/April/October/Late/Charter payment detail | #327  |

---

## Known Issues

| Issue | Description                                           | Status                  |
| ----- | ----------------------------------------------------- | ----------------------- |
| #294  | Pre-flight disk space check for pipeline rebuild mode | Deferred (low priority) |

---

## Architecture Decisions

| Decision                            | Rationale                                                                | Date     |
| ----------------------------------- | ------------------------------------------------------------------------ | -------- |
| CDN-only frontend (no API server)   | Data is pre-computed and immutable; CDN scales infinitely                | Jan 2026 |
| One snapshot per month (pruned)     | Daily snapshots were wasteful; monthly is sufficient for trends          | Feb 2026 |
| Time-series separate from analytics | Analytics JSON has 1-2 trend points; time-series has monthly granularity | Mar 2026 |
| Borda-count for global rankings     | Fair multi-metric ranking without over-weighting any single metric       | Jan 2026 |
| Toastmasters brand colors           | Professional appearance aligned with TI brand guidelines                 | Jan 2026 |

---

## What We're NOT Building

| Item                      | Reason                                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| User authentication       | All data is public; no user-specific features needed                       |
| Real-time updates         | Daily pipeline is sufficient; real-time adds complexity with no user value |
| Mobile app                | Responsive web app covers mobile use cases                                 |
| Club-level editing        | Read-only analytics; data comes from Toastmasters dashboard                |
| Multi-district comparison | Focus on single-district depth; global rankings serve comparison           |
