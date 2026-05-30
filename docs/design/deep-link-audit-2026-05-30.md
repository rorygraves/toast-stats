# Site-wide deep-link audit — every control alters the URL

**Date:** 2026-05-30
**Epic:** [#969](https://github.com/taverns-red/toast-stats/issues/969) — Site-wide deep-link audit
**Sprint:** 1 ([#963](https://github.com/taverns-red/toast-stats/issues/963)) — doc-only audit + spawn remediation sprints
**Status:** Audit complete. Remediation tracked as child sprints appended to the epic (see [Remediation plan](#remediation-plan)).

---

## 1. Principle under audit

> **If a control changes what's on screen, its state must be encoded in the URL** — so the **back button, reload, and shared links** all preserve the selection.

A control is **compliant** only if its state round-trips through the URL (a `useUrl*` hook, `useSearchParams`/`setSearchParams`, or a route param). `localStorage`/`sessionStorage` persistence is **not** compliant — it survives reload on the same device but is neither shareable nor back-button-safe — so it is scored `partial`.

## 2. Method

- 16 read-only audit agents, one per route, swept every page component and the controls it renders, citing `file:line` for each verdict (code-proof, not inferred). Raw machine output retained in the sprint task log.
- Existing URL-sync infrastructure used as the compliance bar: `useUrlState`, `useUrlSort`, `useUrlProgramYear`, `useUrlDatePair`, `useColumnFilters`, and the `clubFilterUrl` / `filterUrlCodec` codecs.
- Reference implementations of "good": **DistrictClubsPage** (full filter/sort/search/column codec), **DistrictAnalyticsPage** and **RegionPage** (zero gaps).

## 3. Authoritative route table (from `frontend/src/App.tsx`)

The issue body's route list was approximate. The real router (single `createBrowserRouter` tree under `AppShell`) is:

| Route                                                | Page component                               |
| ---------------------------------------------------- | -------------------------------------------- |
| `/` (index)                                          | `DistrictsPage` — landing rankings/discovery |
| `/district/:districtId`                              | `DistrictDetailPage`                         |
| `/district/:districtId/changes`                      | `DistrictChangesPage`                        |
| `/district/:districtId/clubs`                        | `DistrictClubsPage`                          |
| `/district/:districtId/divisions`                    | `DistrictDivisionsPage`                      |
| `/district/:districtId/rankings`                     | `DistrictRankingsPage`                       |
| `/district/:districtId/trends`                       | `DistrictTrendsPage`                         |
| `/district/:districtId/analytics`                    | `DistrictAnalyticsPage`                      |
| `/district/:districtId/club/:clubId`                 | `ClubDetailPage`                             |
| `/district/:districtId/division/:divId`              | `DivisionPage`                               |
| `/district/:districtId/division/:divId/area/:areaId` | `AreaPage`                                   |
| `/club/:clubId`                                      | `ClubRedirectPage` (redirect only)           |
| `/region/:n`                                         | `RegionPage`                                 |
| `/regions`                                           | `RegionsPage`                                |
| `/awards`                                            | `AwardsPage`                                 |
| `/history`                                           | `HistoryPage`                                |
| `/methodology`                                       | `MethodologyPage`                            |

> Corrections vs the issue body: the **districts list is the index `/`** (there is no `/districts`); "how-it-works" is **`/methodology`**; division/area are **nested under district**, not top-level; club detail is `/district/:id/club/:clubId`.

**Legend:** `yes` = URL-encoded (compliant) · `partial` = persisted to local/session storage only (not shareable) · `no` = ephemeral, lost on reload.

---

## 4. Per-route control inventory

### `/` — DistrictsPage (landing / discovery) — **6 gaps + 2 partial**

| Control                          | URL?    | Mechanism                              | Gap                              | Proposed param           |
| -------------------------------- | ------- | -------------------------------------- | -------------------------------- | ------------------------ |
| Sort headers                     | yes     | `useUrlSort` (DistrictsPage.tsx:58)    | —                                | `sort` + `dir`           |
| Program-year selector            | yes     | `useUrlProgramYear` (:102)             | —                                | `py`                     |
| Date/snapshot selector           | yes     | `useUrlProgramYear` (:102)             | —                                | `date`                   |
| **Region filter pills**          | partial | `usePersistedState` localStorage (:96) | Not shareable / back-button-safe | `regions`                |
| **Search box**                   | no      | `useState` (:65)                       | Lost on reload; not shareable    | `q`                      |
| **Pinned comparison districts**  | no      | `useState` (:66)                       | Comparison set lost on reload    | `pinned`                 |
| **Historical-rank disclosure**   | no      | `useState` (:114)                      | Expand state lost on reload      | `historyExpanded`        |
| **Historical region selector**   | no      | `useState` (:110)                      | Chart region set lost on reload  | `historyRegions`         |
| **Mobile "show all" disclosure** | no      | `useState` (:367)                      | Resets to top-20 cap on reload   | `showAll`                |
| My-district star                 | partial | `useMyDistrict` localStorage (:71)     | Preference; not shareable        | `myDistrict` (see §6 P3) |
| Theme toggle                     | partial | `DarkModeContext` localStorage         | User preference (intentional)    | — (keep)                 |
| Mobile nav toggle                | no      | `useState` (AppShellTopBar:21)         | Transient chrome                 | — (keep)                 |
| Command palette                  | no      | `useState` (AppShell:25)               | Transient modal                  | — (keep)                 |

### `/district/:id` — DistrictDetailPage — **1 gap + 2 partial/low**

| Control                                   | URL?    | Mechanism                                         | Gap              | Proposed param       |
| ----------------------------------------- | ------- | ------------------------------------------------- | ---------------- | -------------------- |
| Program-year / date                       | yes     | `useUrlProgramYear`                               | —                | `py` / `date`        |
| Subnav section links                      | yes     | `DistrictSubnav` NavLink                          | — (routed)       | —                    |
| KPI-strip collapse                        | partial | `useState` + sessionStorage (DistrictKpiStrip:39) | Not shareable    | `kpiCollapsed` (P3)  |
| Longest-serving clubs disclosure (mobile) | no      | native `<details>` (MobileDisclosure:24)          | Lost on reload   | `clubsExpanded` (P2) |
| More-actions menu                         | no      | `useState` (HeaderActionsMenu:33)                 | Transient chrome | — (keep)             |

### `/district/:id/clubs` — DistrictClubsPage (reference impl) — **1 gap + 1 partial**

| Control                                    | URL?    | Mechanism                                         | Gap                            | Proposed param                                |
| ------------------------------------------ | ------- | ------------------------------------------------- | ------------------------------ | --------------------------------------------- |
| PY / date / search / sort / column filters | yes     | `useUrlProgramYear` + `clubFilterUrl` codec       | —                              | `py` `date` `search` `sort` `dir` + per-field |
| Column-group visibility                    | partial | `usePersistedState` localStorage (ClubsTable:393) | View preference; not shareable | `hiddenGroups` (P3)                           |
| **"Close to Distinguished" preset chip**   | no      | `useState` (ClubsTable:348)                       | Filter preset lost on reload   | `preset`                                      |

### `/district/:id/divisions` — DistrictDivisionsPage — **2 gaps (low)**

| Control                            | URL? | Mechanism                                   | Gap                   | Proposed param           |
| ---------------------------------- | ---- | ------------------------------------------- | --------------------- | ------------------------ |
| PY / date                          | yes  | `useUrlProgramYear`                         | —                     | `py` / `date`            |
| Division-criteria explainer toggle | no   | `useState` (DivisionCriteriaExplanation:60) | Expand lost on reload | `expandDivisionCriteria` |
| Area-criteria explainer toggle     | no   | `useState` (CriteriaExplanation:57)         | Expand lost on reload | `expandAreaCriteria`     |

### `/district/:id/analytics` — DistrictAnalyticsPage — **✅ 0 gaps**

PY + date URL-synced; all other content is computed display. Fully compliant.

### `/district/:id/trends` — DistrictTrendsPage — **1 gap (low, mobile)**

| Control                  | URL? | Mechanism                            | Gap                          | Proposed param  |
| ------------------------ | ---- | ------------------------------------ | ---------------------------- | --------------- |
| PY / date                | yes  | `useUrlProgramYear`                  | —                            | `py` / `date`   |
| Mobile chart expand (×3) | no   | `useState` (ChartSparklineExpand:48) | Expanded chart not shareable | `chartExpanded` |

### `/district/:id/rankings` — DistrictRankingsPage — **✅ 0 gaps**

PY + date + **metric toggle** (`useUrlState<RankMetric>` in GlobalRankingsTab:237) all URL-synced. Fully compliant.

### `/district/:id/changes` — DistrictChangesPage — **1 gap (low)**

| Control                      | URL? | Mechanism                        | Gap                       | Proposed param  |
| ---------------------------- | ---- | -------------------------------- | ------------------------- | --------------- |
| From / to date pickers       | yes  | `useUrlDatePair` (`from` / `to`) | —                         | `from` / `to`   |
| Change-group expand/collapse | no   | native `<details open>` (:52)    | Expand set lost on reload | `expandChanges` |

### `/district/:id/club/:clubId` — ClubDetailPage — **1 gap (low, mobile)**

| Control                       | URL? | Mechanism                                                | Gap                          | Proposed param  |
| ----------------------------- | ---- | -------------------------------------------------------- | ---------------------------- | --------------- |
| PY (consumed)                 | yes  | `useUrlProgramYear` (:193) — selector rendered by parent | —                            | `py`            |
| Membership-trend chart expand | no   | `useState` (ChartSparklineExpand:48)                     | Expanded chart not shareable | `chartExpanded` |

### `/regions` — RegionsPage — **1 gap**

| Control                          | URL? | Mechanism        | Gap                                       | Proposed param |
| -------------------------------- | ---- | ---------------- | ----------------------------------------- | -------------- |
| **Region filter (RegionFinder)** | no   | `useState` (:31) | Primary control; selection lost on reload | `region`       |

### `/region/:n` — RegionPage — **✅ 0 gaps**

All five sortable columns URL-synced via `useUrlSort`; region is a route param. Fully compliant.

### `/methodology` — MethodologyPage — **1 gap + 1 partial (a11y)**

| Control                                       | URL?    | Mechanism                                        | Gap                                                  | Proposed param                       |
| --------------------------------------------- | ------- | ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------ |
| Section expand/collapse (10 sections, mobile) | no      | `useState openIds` (:44)                         | Collapsed on reload                                  | `openSections`                       |
| TOC anchor links                              | partial | sets `#fragment`, no mount-sync (JumpToChip:120) | `#section` does not auto-expand that section on load | fragment-as-source-of-truth on mount |
| JumpToChip modal                              | no      | `useState` (JumpToChip:40)                       | Transient modal                                      | — (keep)                             |

### `/awards`, `/history`, `/district/:id/division/:divId`, `…/area/:areaId` — **✅ 0 controls**

Display-only; all interactivity is route-driven navigation links. Compliant by construction.

---

## 5. Summary

| Verdict                                 | Count                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Routes fully compliant                  | 7 (`/analytics`, `/rankings`, `/region/:n`, `/awards`, `/history`, `/division`, `/area`) |
| Routes with ≥1 gap                      | 9                                                                                        |
| `no` (ephemeral) control gaps           | 13                                                                                       |
| `partial` (storage-only) control gaps   | 5                                                                                        |
| Transient controls (correctly excluded) | nav toggle, command palette, more-actions menu, JumpToChip modal                         |

The platform already has **all the infrastructure it needs** (`useUrlState`, `useUrlSort`, `useUrlProgramYear`, `useUrlDatePair`, `clubFilterUrl`). Every gap is an _unwired_ control, not a missing capability. The single biggest gap is the **landing page (`/`)** — the primary discovery surface, where region filter, search, and comparison pins are all non-shareable.

---

## 6. Remediation plan

Prioritised by user-facing value (sharing a filtered/searched view is the core promise). Each cluster becomes one implementation sub-issue appended to epic #969.

| Priority | Cluster                            | Controls                                                                                                                                                                                  | Proposed params                                                                                                                        |
| -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **P1**   | Landing `/` discovery state        | region filter, search box, pinned comparison districts                                                                                                                                    | `regions`, `q`, `pinned`                                                                                                               |
| **P1**   | Filter presets                     | Clubs "Close to Distinguished" preset; Regions RegionFinder                                                                                                                               | `preset`, `region`                                                                                                                     |
| **P2**   | Disclosure / expand-collapse state | DistrictChanges groups; Divisions criteria (×2); DistrictDetail mobile clubs disclosure; Landing historical disclosure + historical regions; mobile chart-expand (Trends ×3 + ClubDetail) | `expandChanges`, `expandDivisionCriteria`, `expandAreaCriteria`, `clubsExpanded`, `historyExpanded`, `historyRegions`, `chartExpanded` |
| **P2**   | Methodology deep-linkable sections | section expand state + fragment-on-mount auto-expand + TOC sync                                                                                                                           | `openSections` / `#fragment`                                                                                                           |
| **P3**   | Storage-only → URL (product call)  | my-district pin, KPI-strip collapse, Clubs column-group visibility                                                                                                                        | `myDistrict`, `kpiCollapsed`, `hiddenGroups`                                                                                           |

> **P3 caveat (product decision required during that sprint):** my-district, theme, and column-visibility are genuine _per-user preferences_. Encoding them in the URL means a shared link imposes the sender's preference on the recipient. The implementing sprint should decide per-control whether URL-sync or keeping `localStorage` is the right UX — this audit flags them for the principle's sake but does not mandate the change.
>
> **✅ Resolved (#982, 2026-05-30):** **none promoted.** All three stay storage-backed — they describe the viewer's _personal environment_, not the shareable data/view, so URL-syncing would impose rather than inform (same category as the already-excluded theme toggle). Decision + per-control rationale: [`storage-only-prefs-decision-2026-05-30.md`](./storage-only-prefs-decision-2026-05-30.md); locked by `frontend/src/components/__tests__/storageOnlyPrefsNotUrlSynced.tripwire.test.tsx`.

### Guardrails for implementers

- **Reuse existing infra** — do not hand-roll `useSearchParams`. Extend `useUrlState` / `useUrlSort` / `useUrlDatePair`; for the clubs surface reuse the `clubFilterUrl` codec.
- **R3** — pass URL/derived state down as props from the page that owns it; never re-derive from API response data ([Lesson 124](../../tasks/lessons/124-validate-url-synced-range-state-at-the-page-not-the-picker.md)).
- **[Lesson 070](../../tasks/lessons/070-setSearchParams-prev-races-in-batched-updates.md)** — `setSearchParams(prev => …)` races same-batch updaters; batch multi-param writes.
- **[Lesson 130](../../tasks/lessons/130-a-debounced-outward-push-must-gate-on-the-debounce-having-settled.md)** — a debounced outward push (e.g. search box) must gate on the debounce having settled, or an external clear races the stale value back out.
- **[Lesson 128](../../tasks/lessons/128-a-filter-control-is-aria-pressed-not-role-tab.md)** — filter presets are `aria-pressed`, not `role="tab"`.
- **[Lesson 107 (#680)](../../tasks/lessons/107-reserve-a-future-seam-with-a-tripwire-test-not-just-a-comment.md)** — each remediation sprint should land a tripwire/round-trip test (back-button + reload + shared-link), not just a comment. This audit is doc-only by design; the tests live with the code that needs them.
