# 🗓️ 2026-05-11 — Lesson 53: renderWithProviders Bloat as Contention Amplifier (#473)

**Discovery:** While fixing the chronically-flaky local pre-push gate, I traced the failures to worker contention rather than test bugs (Lesson 51 already established this category). But the deeper finding was _which_ tests amplify the contention: any test file that uses `renderWithProviders` from `componentTestUtils.tsx` for a component that doesn't actually need a router or React Query pays the cost of `new QueryClient()` + `createMemoryRouter([{path:'*',element:ui}])` + `RouterProvider` + `PerformanceWrapper` on every `render()` — multiplied by every test in the file. For `GlobalRankingsAccessibility.test.tsx` that's 36 wasted provider stacks per file run, all racing the rest of the suite for worker time under v8 coverage instrumentation.

**Proof:** Starting baseline was 17 file failures / 26 test failures on every parallel coverage run on a 10-core machine (Lesson 51 redux). After:

- Commit 1: strip providers from `DivisionCriteriaExplanation.test.tsx` (24 tests, useState-only component) — next parallel run dropped to 3 failures, but follow-up runs varied 0-18 (variance still huge, suite still borderline)
- Commit 2: same strip for `GlobalRankingsAccessibility.test.tsx` (53 axe tests, 4 of 5 components pure, 5th needs only `MemoryRouter` for `useSearchParams`)
- Commit 3: per-test 15s budget for two legitimately-slow full-page axe scans (`DistrictsPage.a11y`, `DistrictDetailPage.AreaRecognition` Divisions tab a11y) — honest categorization, not file-wide bumps
- Commit 4: batched the same provider-strip across 14 unit tests (Button, StatCard, RankingCard, TargetProgressCard, ErrorHandling, DivisionSummary, AreaProgressSummary, YearOverYearComparison, EndOfYearRankingsPanel, FullYearRankingChart, MultiYearComparisonTable, MembershipPaymentsChart, CriteriaExplanation, DivisionAreaRecognitionPanel) using a Python AST-aware refactor — none of those components use router/query/context
- Commit 5: `test-utils.tsx` switched from `createMemoryRouter`+`RouterProvider` to plain `<MemoryRouter>` for the 4 DistrictsPage tests (no data-router features used; ~4× faster wall time)

After all five: **3 consecutive clean parallel coverage runs, 131/131 files, 2134/2134 tests.**

**Fix:** Two related patterns:

1. **Default-light render helper.** Each file that doesn't need providers gets a local `const renderWithProviders = (ui) => render(ui); const cleanupAllResources = () => cleanup()` shim. Callsites stay unchanged, just the underlying machinery shed. Critical: this is _not_ a test-utility design problem — `componentTestUtils.tsx` correctly exposes `skipProviders`/`skipRouter` options; the rot was test authors paying for what they didn't use.
2. **Audit `from 'react-router-dom'` imports in test helpers.** `createMemoryRouter`+`RouterProvider` materially heavier than `<MemoryRouter>` because the former sets up data-router internals (loaders, actions, error boundaries, transitions). For tests that only need `useNavigate`/`useLocation`/`useSearchParams` context, `MemoryRouter` is strictly better. The `test-utils.tsx` change was 7 deletions, 15 insertions and shaved seconds off the 4 DistrictsPage tests.

**Rule:** When a test file's component-under-test doesn't import `useQuery` / `useNavigate` / `useParams` / `useLocation` / `useContext`, the test must NOT wrap it in those providers. Verify by `grep`ing the actual component (not its descendants — most chrome components are pure). Provider bloat compounds: 14 tests × 4 providers × 132 files = the entire parallel-coverage timing budget on a 10-core machine.

**Warning:** Variance is the diagnostic signal, not failure count. While iterating I saw runs swing from 3 failures to 18 failures on the same code — that variance itself proved contention was the cause. Failure counts decreasing on average is the right signal; expect 5–10 runs before the floor consistently hits zero. The first clean run is luck; the third consecutive clean run is signal.

**rules.md:** Consider adding "R12 — provider-bloat audit: when adding a test that uses `renderWithProviders`, check that the component-under-test (not its descendants) imports from `react-router-dom` / `@tanstack/react-query` / a Context. If not, use plain `render`."
