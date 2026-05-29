# Test-Flakiness Deep-Dive & Test-Effectiveness Audit

**Epic:** #917 — Eradicate load-related test flakiness
**Sprint:** 1 (#912) — Deep-dive investigation & test-effectiveness audit (**doc-only**, no source/behaviour change)
**Date:** 2026-05-28
**Author:** sprint-912 autonomous session
**Scope:** `frontend/` test suite (236 test files / 3 051 tests; 173 unit / 63 integration). Analytics-core, collector-cli, shared-contracts projects are out of scope for this pass (no recorded load-flakiness there).

---

## 1. Executive summary

The frontend suite is **structurally sound but contention-fragile**. Under parallel-coverage execution (the CI invocation) the suite's _throughput_ collapses non-linearly and a small set of timing-sensitive tests flip from pass to fail — without any code regression. The diagnostic signal is **variance, not failure count** (L53), and the measurements below reproduce exactly that: a single contended file (`DateSelector.integration.test.tsx`) that passes **10/10 in isolation** flaked under heavy parallel-coverage load, with the **L120 "leaked deferred render" signature** (`Cannot read properties of undefined (reading 'dates')`).

Headline conclusions:

- **The dominant flake class is contention-induced timing slip (L53), with L120 (`await waitFor` on an already-flushed effect) as the latent trigger.** Neither is a code bug; both are test-structure issues.
- **The CI invocation is the amplifier**: `vitest run --coverage` with **unbounded workers** (`maxWorkers: process.env.CI ? undefined : 3`) + coverage instrumentation. On a small CI runner this is benign; the moment the runner is oversubscribed it is a flake generator. Local dev is protected by the `maxWorkers: 3` cap; **CI has no equivalent guard.**
- **Several "mitigated" vectors are mitigated by _code structure_, not by a _test_** — meaning a future refactor can silently re-open them (L70 setSearchParams, L72 IntersectionObserver `target`). These need tripwires.
- **Test-effectiveness debt is concentrated in the `DistrictsPage.*` / `District*Page` page-mount suites**: ~119 full-page mounts for ~115 narrow assertions (cost-to-assertion ratios up to **65:1**). This is both a contention amplifier (L53) and low marginal value.
- **A pocket of false-confidence tests exists** (`designCompliance.test.ts`, `touchTargets.test.ts`) that mock `getComputedStyle`/`getBoundingClientRect` and then assert on the mock — tautological in jsdom (L66). These pass forever and prove nothing.

No flake-masking was found in CI (no `retry`/`bail`) — flakes fail loudly, which is good (R1-compliant).

---

## 2. Method & environment

### 2.1 Baseline measurement

- **Parallel-coverage runs (CI-contended scenario):** `CI=true npx vitest run --coverage --reporter=dot`, repeated. `CI=true` removes the local 3-worker cap, mirroring the CI invocation. Captured exit code, wall-clock duration, and failed-test count per run.
- **Isolated suspect runs (L78 methodology):** the file that flaked under contention, run **10×** single-file/single-worker with no coverage, to separate an intra-file ordering leak from pure contention.

### 2.2 Environment caveat (important for interpreting the numbers)

The measurement machine was under **heavy external load throughout** (1-minute load average 128–170; this is a developer workstation also running the sprint runner and a parent agent session, not a clean CI runner). This **over-amplifies** the unbounded-worker scenario relative to a small dedicated CI runner. The numbers below should therefore be read as a **qualitative reproduction of the contention failure mode**, not a calibrated CI flake rate. Producing a calibrated baseline on a representative runner is **explicitly Sprint 2's job** (#913) — see §6.

### 2.3 Raw results

**Parallel-coverage (`CI=true`, unbounded workers + coverage):**

| Run | Exit |  Duration | Failed tests | Notes                                                                                |
| --: | :--: | --------: | -----------: | ------------------------------------------------------------------------------------ |
|   1 |  0   |      39 s |            0 | low-contention window                                                                |
|   2 |  0   |      38 s |            0 | low-contention window                                                                |
|   3 |  0   |      41 s |            0 | low-contention window                                                                |
|   4 |  0   | **210 s** |            0 | heavy contention — **5.4× duration, still green**                                    |
|   5 |  —   |  (killed) |           ≥1 | flaked: `DateSelector.integration.test.tsx` error-handling tests, **L120 signature** |

The **38 s → 210 s** swing on an unchanged suite is the L53 variance signal in its purest form: contention is first absorbed as _slowness_, and only past a threshold does it convert to _failure_. Run 5 crossed that threshold.

**Isolated suspect (`DateSelector.integration.test.tsx`, single worker, no coverage):**

```
pass=10 fail=0 / 10
```

**Interpretation:** the suspect is **0% flaky in isolation, intermittently flaky under contention.** This is the defining shape of a contention/timing flake (L53/L78), not a deterministic bug. The L120 mechanism (an `await waitFor` polling an already-resolved effect) is the latent fault line; load just widens the window in which the leaked render lands in the next test and consumes its `mockReturnValueOnce`, yielding the `undefined.dates` read.

---

## 3. Classified root-cause table

Verdict legend: **LIVE** = reproducible in current code; **MITIGATED** = fixed/guarded (location noted); **PARTIAL** = mitigated in one path, gap remains.

| #   | Vector                                                                | Verdict                                    | Affected files (evidence)                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Root-cause fix (→ sprint)                                                                                                                                  |
| --- | --------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | **L53/R12 — provider-bloat contention amplifier**                     | **PARTIAL**                                | Heavy shared helpers `src/__tests__/test-utils.tsx` & `src/__tests__/utils/componentTestUtils.tsx` mount `QueryClientProvider`+`ProgramYearProvider`+router. **Already mitigated for narrow component tests**: 20+ files (`StatCard`, `Button`, `MultiYearComparisonTable`, …) define a local provider-_free_ `renderWithProviders = (ui) => render(ui)` (#473). **Still LIVE for page/integration mounts** that use the heavy helpers + the `DistrictsPage.*` suite (§4). | Move narrow page assertions off full-page mounts; default the shared helper to the lightest stack and opt-in to router/query. (→ S3)                       |
| V2  | **L120 — `await waitFor` leaks a deferred render into the next test** | **LIVE**                                   | `DateSelector.integration.test.tsx:101-111` (`await waitFor` on a synchronously-resolved `fetchCdnDates` mock; polling outlives the assertion). `ClubDetailPage.test.tsx:154` documents the same hazard and avoids it. **105 `await waitFor` calls** suite-wide → ambient risk. **This is the vector that actually flaked in §2.3 run 5.**                                                                                                                                 | Replace `await waitFor` on already-flushed effects with `findBy*`/explicit `act`; audit all 105 call-sites for the "already-resolved" anti-pattern. (→ S3) |
| V3  | **L72 — IntersectionObserver mock-shape asymmetry**                   | **MITIGATED (by code), PARTIAL (by test)** | Global mock `setup.ts:26-37` includes `target`. Per-file mocks `DistrictDetailPage.axe.test.tsx:51`, `…AnalyticsTab.test.tsx:31`, `…leanHub.test.tsx:55` omit `target`. Harmless today (no prod IO consumer; ResizeObserver use at `useTouchTarget.ts:150` casts correctly), but the asymmetric mocks are a footgun if a guard is removed.                                                                                                                                 | Normalise per-file IO mocks to the `setup.ts` shape, or delete them in favour of the global. (→ S3)                                                        |
| V4  | **L70 — `setSearchParams(prev)` same-batch race**                     | **MITIGATED (by code), no test guard**     | `useUrlSort.ts:84-147` computes next state from _current_ `searchParams` (not the `prev` callback) and bails on no-ops; `useUrlState.ts`, `DistrictClubsPage.tsx:74-112` reconcile all keys at once. Mitigation is **structural** — no test exercises concurrent sort+filter to lock it in.                                                                                                                                                                                | Add a tripwire test for simultaneous sort+filter URL writes. (→ S5)                                                                                        |
| V5  | **Shared mutable state (localStorage / singletons / mocks)**          | **MITIGATED**                              | `setup.ts:68-92` provides a fresh `store` and `localStorage.clear()` in `beforeEach`. QueryClient is **never** the module singleton in tests (`config/queryClient.ts` has 0 test imports) — fresh per render. 50+ files call `vi.clearAllMocks()` in `beforeEach`. **Gap:** `setup.ts` has **no global `afterEach` mock reset** — relies on each file remembering.                                                                                                         | Add a single global `afterEach(() => vi.clearAllMocks())` to `setup.ts` as a safety net. (→ S3, cheap)                                                     |
| V6  | **Timer isolation (`vi.useFakeTimers`)**                              | **MITIGATED**                              | All 8 fake-timer blocks pair with `vi.useRealTimers()` (`csvExport.test.ts`, `ClubsTable.search.test.tsx`, `TextFilter.debouncing.test.tsx`). No unpaired calls.                                                                                                                                                                                                                                                                                                           | None.                                                                                                                                                      |
| V7  | **Timeout sensitivity / "no bumps" rule**                             | **LIVE (justified)**                       | Unit testTimeout = 5000 ms. 7 integration files bump to 15000 ms (`journeys/*`, `DistrictsPage.a11y`, `DistrictDetailPage.axe`) — **honest ceilings for full-page+lazy mounts, documented**, not contention-masking. The risk is the _uniform 5 s unit timeout under contended CI_, not the integration bumps.                                                                                                                                                             | Don't bump; reduce the contention that pushes tests toward 5 s (V1/V8). (→ S3)                                                                             |
| V8  | **CI worker config — the amplifier**                                  | **LIVE**                                   | `vitest.config.ts:38` `maxWorkers: process.env.CI ? undefined : 3`. CI runs **both** projects with `--coverage` and **unbounded workers** (`.github/workflows/ci.yml`). Local is capped at 3; CI is not. Benign on a small runner, a flake generator the moment the runner is oversubscribed (reproduced in §2.3).                                                                                                                                                         | Set an explicit CI `maxWorkers` (e.g. `50%` or a fixed small N) and/or shard. (→ S3)                                                                       |
| V9  | **L79/L107/L125 — Suspense / async-insert CLS**                       | **PARTIAL**                                | `App.tsx` Suspense fallbacks cover load only. `DistrictsPage.tsx:474-528` unifies geometry across loading/error/loaded; `DistrictsPage.test.tsx:249-275` tests error geometry — **but** `DistrictsPage.responsive.test.tsx:197-258` (the L125 site) only reserves the _loading_ skeleton slot. A CDN flake during the Lighthouse run renders the **error** state, whose CLS is unverified.                                                                                 | Add error/empty-state CLS coverage; see V10. (→ S4)                                                                                                        |
| V10 | **Lighthouse/CLS gate depends on CDN reachability**                   | **LIVE & FLAKY**                           | `.github/workflows/lighthouse-ci.yml` runs `npm run preview` (real server, no CDN mock) ×3 runs; `lighthouserc.js:31` asserts CLS ≤ 0.1. A CDN flake → error state → CLS ~0.2 → gate fails on luck (caught a real 0.206 once). The gate is _correct_; its **input is non-deterministic.**                                                                                                                                                                                  | Serve a CDN fixture for the Lighthouse run (decouple from network); add the error-state CLS test from V9. (→ S4)                                           |
| V11 | **L81 — perf-deferral `.not.toMatch` budget checks**                  | **LIVE & load-bearing (correctly)**        | JetBrains Mono deferral guarded at `rt-brand-v1.test.ts:65` & `redesign-tokens.test.ts:188` (cross-linked to the 0.012→0.199 CLS regression, PR #595). 115 `.not.toMatch`/`.not.toContain` across 40+ files; most are cheap CSS checks.                                                                                                                                                                                                                                    | Keep. These are budget gates, not flakes. Document the "re-measure before lifting" rule (already in L81).                                                  |
| V12 | **R20 — unit/integration partition exhaustiveness**                   | **MITIGATED**                              | `scripts/check-test-projects.mjs` derives truth from `vitest list --json`, asserts disjoint + exhaustive + non-empty; wired into CI (`ci.yml`). All 236 files accounted for. **Residual:** the guard proves _placement_, not that unit tests are actually contention-free (the L53 assumption is unvalidated).                                                                                                                                                             | Keep guard; consider a "unit test must not mount a full page" lint (→ S5).                                                                                 |

---

## 4. Test-effectiveness findings

### 4.1 Landmines — narrow assertions on wide mounts (L53 Bucket B)

The `DistrictsPage.*` and `District*Page` page-mount suites are the primary debt. ~119 full-page mounts produce ~115 narrow assertions. Worst cost-to-assertion ratios:

| File                                       | Mounts | Assertions | Cost/assert | Issue                                             |
| ------------------------------------------ | -----: | ---------: | ----------: | ------------------------------------------------- |
| `DistrictDetailPage.leanHub.test.tsx`      |      5 |          4 |       ~65:1 | smoke-level assertions, all could share one mount |
| `DistrictDetailPage.axe.test.tsx`          |      1 |          1 |      ~130:1 | full-page axe — honest ceiling (see 4.4)          |
| `DistrictDetailPage.AnalyticsTab.test.tsx` |      5 |          5 |       ~41:1 | tab presence / CTA links — one mount would do     |
| `DistrictsPage.comparison.test.tsx`        |     10 |          9 |       ~28:1 | one pin/panel microstate per re-mount             |
| `DistrictTrendsPage.test.tsx`              |     15 |         10 |       ~25:1 | one trend behaviour per re-mount                  |
| `DistrictsPage.sortable.test.tsx`          |      8 |          8 |       ~25:1 | one `getRowOrder()` per re-mount                  |

**Redundancy clusters:** `search` + `sortable` + `comparison` all re-mount the same `DistrictsPage` table for orthogonal single-microstate checks; `responsive` + `redesign` both re-render across the same breakpoints. Estimated ~32 of these mounts could collapse into ~4 with sequential interactions on a single mount.

**Why it matters for flakiness:** every extra full-page mount is provider + lazy-child + hook-mock work competing for the same worker pool. Mount count is directly proportional to the L53 contention surface.

### 4.2 False-confidence tests (L66 / L110) — **highest-value cleanup**

| File                                                | Problem                                                                                                                                                                      | Evidence                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `__tests__/responsive/designCompliance.test.ts`     | Mocks `window.getComputedStyle` and `getBoundingClientRect` to return hardcoded values, then asserts on those values. Tautological — passes in jsdom regardless of real CSS. | mock at L22-25/L80-91; assertions L117-120/L176 read the mock back |
| `__tests__/accessibility/touchTargets.test.ts`      | Same pattern: `getComputedStyle`/`getBoundingClientRect` mocked, assertions verify mock→mock round-trips (e.g. "width ≥ 44" where width is the test's own mock input).       | L49-75, L127-152                                                   |
| `__tests__/components/componentMigrations.test.tsx` | Hardcodes `getBoundingClientRect → 44×44`; className assertions are real but the geometry mock is a footgun.                                                                 | L15-25                                                             |
| `__tests__/components/routing.test.tsx`             | `textContent` contains `'LIVE'` — would miss a CSS `text-transform` (L110). Low impact (depends on DOM text).                                                                | L38                                                                |

> These should be **verified and then either made real (Playwright/innerText) or deleted** — they are pure cost with zero defect-detection. (Flagged for Sprint 5; line numbers from the audit pass, to be re-confirmed before action.)

### 4.3 Partition health (R20)

Sound. `check-test-projects.mjs` uses the tool's own resolution (no re-implemented glob), asserts disjoint + exhaustive + non-empty, runs in CI. `integrationGlobs` correctly routes the high-load `responsive/designCompliance.test.ts` (5 property tests × ~100 iterations) to the integration project. The only residual is philosophical (placement ≠ contention-freedom).

### 4.4 Honest ceilings (not landmines)

Full-page axe scans (`*.axe.test.tsx`) and the 5 journey tests (`<App/>` end-to-end) have inherently high mount-cost-per-assertion. This is the correct cost of an a11y/journey gate — **not** a candidate for consolidation. Flagged here so Sprint 3 doesn't mistakenly "optimise" them.

---

## 5. Config & CI audit (current state)

- **`frontend/vitest.config.ts`**: `testTimeout`/`hookTimeout` 5000 ms; `maxWorkers` 3 locally / **unbounded in CI**; coverage thresholds 55% uniform; jsdom; no `isolate`/`pool`/`retry`/`bail` overrides.
- **`frontend/vitest.shared.mjs`**: single-source unit/integration partition (8 globs); `baseExclude`.
- **`.github/workflows/ci.yml`**: `npm run test --workspace=frontend -- --coverage` (both projects, coverage, unbounded workers); runs `test:projects:check` first; **no retry/bail** (good — no flake masking).
- **`.github/workflows/lighthouse-ci.yml`**: real preview server, 3 runs, CLS ≤ 0.1 — network-dependent (V10).
- **`.husky/pre-push`**: unit project only (~18–20 s), path-aware docs skip; integration deferred to CI (intentional).
- **`.husky/pre-commit`**: lint-staged + typecheck/lint, **no tests** (intentional; CI is gate of record).

**Single highest-leverage config change:** give CI an explicit `maxWorkers` (V8). It is the amplifier that converts ambient timing-sensitivity (V2) into red builds.

---

## 6. Prioritized remediation backlog (re-scopes Sprints 2–5)

Ordered by impact. Each item names the vector(s) it closes.

### Sprint 2 — #913 · Flake-detection harness & objective baseline

1. **Define the metric** as the **parallel-coverage flake rate** measured on a **representative (small, dedicated) runner** — the workstation in §2.2 is too noisy to calibrate on. Report **both** pass/fail rate **and** duration p50/p95 (variance is the signal, L53).
2. Build a CI job that runs the suite N× under the real CI invocation and records the metric (seed the suspect set: `DateSelector.integration.test.tsx`, the 5 journeys, the `DistrictsPage.*` mounts).
3. Add a **quarantine annotation** mechanism (tag + tracked list) so a confirmed flake can be isolated without `--skip`/comment-out (R1).
4. **Carry forward §2.3 as the qualitative baseline** until a calibrated number exists.

### Sprint 3 — #914 · Eradicate contention & isolation root causes

1. **V2 (L120):** fix `DateSelector.integration.test.tsx` (`await waitFor` → `findBy`/`act`); sweep the 105 `await waitFor` call-sites for the already-flushed anti-pattern. **This is the confirmed flake — do it first.**
2. **V8:** set an explicit CI `maxWorkers` (e.g. 50% or fixed) ± sharding.
3. **V1 + §4.1:** consolidate the `DistrictsPage.*`/`District*Page` re-mounts; move narrow assertions off full-page mounts; light-by-default shared render helper.
4. **V3, V5:** normalise per-file IO mocks; add global `afterEach(vi.clearAllMocks)` safety net.

### Sprint 4 — #915 · Harden Lighthouse/CLS & external-dependency gates

1. **V10:** serve a CDN fixture for the Lighthouse run — decouple the CLS gate from network reachability.
2. **V9 (L125):** add error/empty-state CLS coverage at `DistrictsPage.responsive.test.tsx` (and siblings) so a CDN flake can't render an unverified terminal state.

### Sprint 5 — #916 · Lock-in

1. **§4.2:** verify & remediate the false-confidence tests (make real or delete).
2. **V4, V12:** add tripwire tests (concurrent sort+filter URL write; "unit test must not full-page-mount" lint).
3. Standing stress sentinel over the suspect set; regression guard on the §6/S2 metric; update `tasks/rules.md` + `tasks/lessons/`.
4. Prove ~zero flake over a statistically-significant run count on the S2 harness.

---

## 7. Acceptance-criteria check (this sprint)

| Criterion (#912)                                                     | Status                                                                                                    |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Baseline flake rate measured with reproducible method                | ✅ §2 — qualitative reproduction (machine-load caveat documented; calibrated number is S2's job per epic) |
| Every known vector confirmed live/mitigated with file-level evidence | ✅ §3 (V1–V12)                                                                                            |
| Remediation backlog prioritized; later sprints re-scoped             | ✅ §6                                                                                                     |
| No source/behaviour change                                           | ✅ doc-only                                                                                               |

**One-line takeaway:** the suite doesn't have a bug problem, it has a _contention-timing_ problem — fix the CI worker cap (V8) and the one confirmed `await waitFor` leak (V2) first, then pay down the page-mount landmine debt; the rest are guards against re-opening already-structural mitigations.
