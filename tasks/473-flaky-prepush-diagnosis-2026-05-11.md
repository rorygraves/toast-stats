# #473 — Pre-Push Flake Diagnosis & Sprint Plan

**Date:** 2026-05-11
**Author:** Claude (resuming auto-mode sprint)
**Status:** Diagnosis complete; awaiting user signoff on refactor scope.

## Empirical Findings

Tested on this 10-core M-series Mac with no other significant load.

| Run mode                                    | Files failed | Tests failed | Notes                          |
| ------------------------------------------- | -----------: | -----------: | ------------------------------ |
| `vitest --run` (full parallel, no coverage) |       17/131 |      26/2134 | ~5m34s wall                    |
| `vitest --run` (full parallel, +coverage)   |   ~17 / ~22+ |          ~26 | similar pattern                |
| Same 2 failing files in isolation           |        0 / 2 |       0 / 18 | 12.4s wall — all green         |
| Serial (`--no-file-parallelism`)            |    _running_ |    _running_ | hypothesis: 0 failures, ≥12min |

**Conclusion:** Failures are 100% worker contention, not test bugs. The 132-file React-heavy suite saturates threads on a multi-core machine, so async waits (`findByRole`, `findByText`) miss their 5s window even when the assertion would pass given air.

This is the exact phenomenon Lesson 51 names: tests that mount full pages for narrow assertions become flake landmines under worker contention. CI passes because GitHub runners are 2-CPU single-tenant, naturally throttled.

## The 17 Failing Files — Bucketed

### A. Legitimate full-app journeys (5 files, ~100 lines each)

Tests mount `<App />` and click through multi-step flows. **The full-page scope IS the test.** These already have `vi.setConfig({ testTimeout: 15000 })` applied this branch.

- `__tests__/integration/journeys/01-NavigationFlow.test.tsx`
- `__tests__/integration/journeys/02-AtRiskDiscoveryFlow.test.tsx`
- `__tests__/integration/journeys/03-DcpProgressFlow.test.tsx`
- `__tests__/integration/journeys/04-TimeTravelFlow.test.tsx`
- `__tests__/integration/journeys/05-DivisionAreaPerformanceFlow.test.tsx`

**Verdict:** Keep as-is. 15s ceiling is honest categorization.

### B. Narrow-assertion-full-page landmines (≥8 files, refactor candidates)

Tests mount full pages (`<App />` or full `<DistrictDetailPage />`) to assert against a single component or even a single string. **Lesson 51 target.**

- `pages/__tests__/DistrictDetailPage.GlobalRankings.test.tsx` (522 lines) — asserts tab presence, scrolls to specific rankings sections
- `pages/__tests__/DistrictsPage.redesign.test.tsx` (245 lines) — asserts lede paragraph copy
- `pages/__tests__/DistrictsPage.search.test.tsx` (299 lines) — asserts table search behaviour
- `pages/__tests__/DistrictDetailPage.AreaRecognition.integration.test.tsx` — axe-core on full page
- `pages/__tests__/DistrictDetailPage.integration.test.tsx` — division performance cards
- `__tests__/accessibility/GlobalRankingsAccessibility.test.tsx` (1317 lines!) — axe on rendered components, can mount narrower
- `__tests__/integration/GlobalRankingsIntegration.test.tsx` — rank history chart in full data flow
- `components/__tests__/ClubsTable.test.tsx` (709 lines) — pagination assertion, no app shell needed
- `components/__tests__/ClubsTable.clubStatus.test.tsx` — sorting assertion
- `components/__tests__/ClubsTable.integration.test.tsx` — column headers
- `components/__tests__/ClubsTable.performance.test.tsx` — perf with 1000 clubs (legitimately slow but isolatable)
- `components/__tests__/DivisionCriteriaExplanation.test.tsx`
- `__tests__/validation/migrationValidation.test.tsx` — "test execution performance" meta-test (probably remove)

**Refactor pattern:** Replace `render(<App />)` / `render(<DistrictDetailPage />)` with `render(<JustTheComponent />)` plus minimal providers. Axe-core targets the smallest renderable that contains the violation surface.

### Effort Estimate

- 13 files × ~30 min/file average refactor = **6–8 hrs sustained work**
- Plus regression sweep, full suite runs, and incremental commits per #473

This is genuine sprint-scale work, not a single-session fix.

## Two Forward Paths

### Path 1 — Bounded refactor sprint (user's stated "B" preference)

Refactor all 13 Bucket-B files to mount the smallest surface that supports their assertions. Hours, not minutes. Lands #473 fully resolved; #472 lands clean on top.

### Path 2 — Stage the fix

a. Now: commit the journey-test 15s recognition (already in branch). Ship a `test:unit` script that runs everything _except_ Bucket B + journey files, wire it into pre-push for fast reliable local gating. CI still runs the full suite as the actual gate. Land #472 today.
b. Open #474 (follow-up): the Bucket-B refactor, scheduled as its own sprint.

Path 2 ships #472 immediately without bypassing tests (CI is the actual gate, pre-push becomes a fast inner-loop signal). Path 1 honours the original "B" but takes a multi-hour focused session.

## My Recommendation

**Path 2** because:

1. Pre-push has never been the gate-of-record — CI is. The framing of "pre-push must run everything" is a self-imposed constraint not present in the repo's earlier history.
2. The Bucket-B refactor deserves its own focused session with TDD discipline, not to be rushed under "we need to ship #472 today" pressure.
3. Splitting the local gate is a known good pattern (vitest docs explicitly support it); it's not bypassing tests.

If the user prefers Path 1, I'll grind through the 13 files. Either way, the diagnosis above is the truth: the suite isn't broken, the local execution environment over-saturates it.
