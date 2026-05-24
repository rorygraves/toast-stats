---
name: Journey-test flake family (#525) is closed — verified by stress run, root-caused to Lesson 53's provider strip
description: #525 listed 5 tests as flaky under parallel-coverage CI load.
  Stress runs on current main show 20/20 + 10/10 + 10/10 passes on the
  three journey tests, plus 3 consecutive clean full-coverage runs
  (159 files, 2351 tests). Statistical confidence the original ~20%
  flake rate is gone: 98.8%. The remediation that actually closed the
  flake was #473 (Lesson 53 — provider-bloat strip); the visible
  symptom on #525 was a residual case that resolved as the rest of
  Lesson 53's work landed. The right response now is a regression
  sentinel (`npm run test:journey:stress`) + this closing record, not
  a "fix" PR for a symptom that no longer reproduces.
type: feedback
id: '078'
category: incident
tags: [tests, flaky, vitest]
auto_load: false
date: 2026-05-22
issues: [525]
---

# Lesson 78 — Journey-test flake family is closed; the cure is upstream

**Date:** 2026-05-22
**Issue:** #525 (test-infra: flaky integration journey tests — 01-NavigationFlow and family fail ~20% under CI parallel load)

## What happened

#525 was filed during PR #523 (merged 2026-05-14) after the CI Test
Suite went red on `01-NavigationFlow.test.tsx > navigates from
landing page to District 61 overview` with `Unable to find role=tab
and name /^Clubs$/i`. The same flake family was logged for
`02-AtRiskDiscoveryFlow`, `04-TimeTravelFlow`,
`DistrictDetailPage.GlobalRankings`, and `DistrictsPage.search`. The
local repro at the time of filing was 5 serial runs → 1 fail (~20%
rate). The PR merged anyway because Test Suite is not a required
check.

Between #523 merging and Sprint 10 starting (this work), four
substantive things shipped:

1. The `findByRole('tab', { name: /^Clubs$/i })` selector is **gone**
   — #571 (Phase 3 of the district IA migration) retired the tab
   strip entirely. The journey test now uses
   `findByRole('link', { name: /view all clubs/i })` instead of the
   tab role. So the _literal_ failure in #525 is impossible: there is
   no `role=tab` to race against anymore.
2. Two of the listed files no longer exist (`DistrictDetailPage.
GlobalRankings.test.tsx`, `DistrictsPage.search.test.tsx` — replaced
   by new tests of the same name under `pages/__tests__/`).
3. Lesson 53's provider-bloat strip (#473) eliminated the worker-
   contention amplifier that made these races visible in the first
   place. 14 test files were converted from `renderWithProviders` to
   plain `render`, freeing per-worker CPU budget.
4. `LazyChart` is now mocked to render children synchronously in the
   journey tests' top-level `vi.mock` (line 15 of 01-NavigationFlow).

## Evidence the flake is closed

Stress runs on current main (commit `b6322781`):

| Run                             | Iterations | Failures |
| ------------------------------- | ---------- | -------- |
| `01-NavigationFlow` isolated    | 20         | 0        |
| `01-NavigationFlow` isolated +5 | 5          | 0        |
| `02-AtRiskDiscoveryFlow`        | 10         | 0        |
| `04-TimeTravelFlow`             | 10         | 0        |
| Full parallel coverage suite    | 3          | 0        |

`P(0 failures | 20% rate, 20 trials) = 0.8^20 ≈ 1.15%`. The original
~20% flake rate is gone with >98% confidence. Last 20 GitHub Actions
runs across `main` and PR branches: zero journey-test failures.

## How to apply

**Rule:** When triaging a flake that doesn't reproduce, do not
manufacture a "fix" for a symptom that isn't there. The honest
shipment is:

1. **Document the closing evidence** (this lesson — stress-run
   counts, statistical confidence, commit that closed it).
2. **Ship a regression sentinel** so re-occurrence is caught locally
   without re-discovering the methodology. Here:
   `npm run test:journey:stress` in `frontend/` runs the journey
   suite 5× serially and fails on any iteration's failure.
3. **Recommend issue closure** to the operator with the evidence in
   the PR body — do not auto-close, because the operator's live-
   verification step is the gating signal (per sprint-runner
   protocol).

**Why:** Manufacturing a code change for a non-reproducing flake
risks two things: (a) creating churn that the future-author of a
true regression will have to diff against, and (b) entrenching the
belief that the "fix" was the code change — when the real cure
happened upstream (Lesson 53). Both make the next investigation
slower.

**How to apply:** Before opening a PR to "fix" a flake, run the
named tests with ≥10 isolated iterations AND ≥3 parallel-coverage
iterations. If P(0 failures | original rate) < 5%, there's no
reproducing bug — the right shipment is documentation + sentinel,
not patch.

## What the sentinel does

`frontend/package.json` gains:

```json
"test:journey:stress": "for i in 1 2 3 4 5; do echo \"=== journey stress run $i/5 ===\" && vitest run src/__tests__/integration/journeys/ --reporter=dot || exit 1; done"
```

5 serial iterations of the 5-test journey suite (~10s total on a
2026 M-series Mac, ~25s on `ubuntu-latest`). Not added to the CI
workflow in this PR — the existing `Test Suite` job already
exercises the journey tests under coverage on every run, and adding
a dedicated stress step would be feature creep beyond the issue's
actual need. The script exists so future flake investigations have a
named entry point instead of an ad-hoc `for` loop.

## Telltale signs you should NOT "fix" a flake

- The selector named in the original failure is gone from the
  source. The symptom can't be reproduced because the _code_ it
  asserted on doesn't exist anymore.
- A bracket of stress runs (≥10 isolated + ≥3 parallel coverage)
  comes back clean. With binomial confidence, the original rate is
  gone.
- The upstream commit log shows a remediation PR (here #473)
  targeted at the contention class your flake belonged to. The cure
  arrived between filing and triage.

## Related

- Lesson 51 — original worker-contention diagnosis (pre-#473 baseline
  of 17 file failures per parallel coverage run).
- Lesson 53 — `renderWithProviders` bloat strip in #473; the work
  that actually closed this flake family.
- #525 — this issue. Recommended action: operator closes after CI
  on the closing PR passes 5×.
- `frontend/src/__tests__/integration/journeys/` — the five journey
  files now covered by the sentinel.
