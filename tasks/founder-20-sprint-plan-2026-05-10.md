# Founder's 20-Sprint Plan — 2026-05-10 (revised)

**Mission:** Maximise value to district leaders. Ship live feedback fixes first, then finish the redesign, then build the dashboard layer.

## Operating cadence (mandatory)

- **One sprint at a time.** Pause for sign-off only at sprint boundaries; per-issue work flows continuously under Auto mode.
- **Per-issue PRs**, conventional commits, `(#N)` references in every commit + PR title.
- **TDD per Full DoD:** Red → Green → Refactor → /simplify → fresh-context /review → push → **live verify on `https://ts.taverns.red`** before closing the issue.
- **Live verification between PRs is mandatory.** Curl the site, check the changed surface in a browser, confirm the deploy actually landed before moving on.
- **Lessons** added per file in `tasks/lessons/<NNN>-slug.md` for any non-obvious discovery.

---

## Strategic frame

The redesign (epic #352) shipped chrome + Districts landing, but **all 7 District-Detail-tab issues + Club-detail-page redesign are still open** (#360–#366). The user feedback received 2026-05-10 also flagged 5 concrete UX failures on the _current_ surface — so live feedback fixes (Sprints 1–6) jump the queue ahead of redesign completion (Sprints 7–13).

After the surface is clean and the redesign is finished, Sprints 14–17 add the persistence layer that turns the app from "lookup tool" into "my dashboard." Sprints 18–20 add IA depth (search, hierarchy, Find-A-Club).

---

## The 20 sprints

### Tier A — Live feedback (Sprints 1–6)

| #   | Issue | Title                                                         | Why first                                                |
| --- | ----- | ------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | #433  | Tighten Close-to-Distinguished to ≤4, unify across views      | Removes noise on a flagship indicator                    |
| 2   | #434  | Region filter — solo-select + 'All / Clear' pattern           | Highest-frequency filtering, currently 13-click cost     |
| 3   | #435  | District Search bar prominence                                | Primary entry point currently invisible                  |
| 4   | #436  | Swap Rank/District columns + standalone district click target | Click affordance broken on the rankings table            |
| 5   | #437  | Tab discoverability (Clubs / Divisions / Trends / Analytics)  | Most of District value hidden behind under-weighted tabs |
| 6   | #438  | District Membership Trend methodology + tooltips              | Trust gap on the central trends chart                    |

### Tier A2 — Methodology corrections (Sprint 7)

| #   | Issue       | Title                                                                                               |
| --- | ----------- | --------------------------------------------------------------------------------------------------- |
| 7   | #439 + #440 | Fix /methodology DCP tier definitions + Club health classifications (factual bugs on a public page) |

### Tier B — Complete the redesign (Sprints 8–14)

| #   | Issue | Title                          |
| --- | ----- | ------------------------------ |
| 8   | #360  | Overview tab redesign          |
| 9   | #361  | Clubs tab redesign             |
| 10  | #362  | Divisions & Areas tab redesign |
| 11  | #363  | Trends tab redesign            |
| 12  | #364  | Analytics tab redesign         |
| 13  | #365  | Global Rankings tab redesign   |
| 14  | #366  | Club detail page redesign      |

### Tier C — Comprehension polish (Sprints 15–16)

| #   | Issue                  | Title                                                                                     |
| --- | ---------------------- | ----------------------------------------------------------------------------------------- |
| 15  | #412, #410, #413, #414 | "How it works" rename + help icon + (i) tooltips on KPIs / Awards Race / Rankings columns |
| 16  | #420, #416, #417       | localStorage primitive + remember last district/filter/sort + sticky-pin "my district"    |

### Tier D — Repeat-visitor + IA (Sprints 17–19)

| #   | Issue            | Title                                                                     |
| --- | ---------------- | ------------------------------------------------------------------------- |
| 17  | #418, #415       | "What changed since last visit" diff strip + orientation strip below lede |
| 18  | #422             | Universal search bar (jump to club / district / area)                     |
| 19  | #423, #424, #425 | /region/:n + /district/:id/division/:divId + .../area/:areaId pages       |

### Tier E — District depth (Sprint 20)

| #   | Issue      | Title                                                           |
| --- | ---------- | --------------------------------------------------------------- |
| 20  | #428, #426 | Total Members KPI card + Pathway / Education Levels rollup card |

---

## Future backlog (after Sprint 20)

These are valid but lower priority than the 20 sprints above. Re-evaluate after Sprint 20.

| Issue(s)                               | Why deferred                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| #371, #372, #373                       | Awards page suite — net-new IA, less urgent than fixing the surfaces leaders already use                                             |
| #429 (#430 + #431 + #432, closes #407) | Find-A-Club enrichment — bumped from Sprint 20 by methodology corrections; net-new data, lower urgency than fixing existing surfaces |
| #427                                   | Print stylesheet — niche workflow                                                                                                    |
| #384                                   | Tablist arrow-key a11y — adjacent to #437 (Sprint 5); revisit if not naturally absorbed                                              |
| #340, #375                             | setState-in-effect fixes + dependabot bumps — unblock dev-deps after feature work stabilises                                         |
| #339                                   | Brand v1.0 naming — blocked on external rename coordination                                                                          |
| #306                                   | BordaCount refactor — pure tech debt, no user-visible change                                                                         |
| #294                                   | Disk space pre-flight — already deferred low priority                                                                                |
| #411, #419                             | Notifications stub + walkthrough — chrome ambiguity / self-deferred                                                                  |

---

## Risks and tripwires

- **Sprint 4 (#436)** rewires the rankings table. Existing tests that assume column order (`getByRole('columnheader', { name: /rank/i })` etc.) will break — that's correct, fix the test signal not the code (R1).
- **Sprint 5 (#437)** changes tab visual weight. Coordinate with Sprint 11 (#365 Global Rankings tab — also touches the tab bar) so we don't ship conflicting tab styles.
- **Sprints 7–12 (redesign tabs)** must keep old data flowing while replacing chrome (per #353 token strategy: add new tokens alongside `tm-*`, migrate page-by-page).
- **Sprint 15 (#420 localStorage)** is a shared primitive. Sprints 16–17 depend on its API. Get the schema right first time; version the storage key (`v1:`) so future migrations are safe.
- **Sprint 20 (#429 Find-A-Club)** depends on the Toastmasters Find-A-Club API being scrape-friendly. Spike inside #430 first; abandon if flaky and revert to backlog work.
- **R2** — Sprint 20 introduces a new GCS-backed data source. New sync points required in `data-pipeline.yml`. Audit ALL workflow paths before merge (per Lesson 45).
- **R3** — Sprints 17–18 (search + hierarchy pages) must thread program-year + filter state from URL/parent, not API response.

---

## Definition of "Sprint Done"

For each sprint:

1. All issues in scope have merged PRs referencing the issue number.
2. CI green on main; deploy succeeded.
3. **Live verified on `https://ts.taverns.red`** — the change is observable in the browser.
4. `docs/product-spec.md` updated for any user-visible feature.
5. Lessons file added per discovery (one per file in `tasks/lessons/`).
6. Founder closes issues with resolution comments referencing the merged commit.
