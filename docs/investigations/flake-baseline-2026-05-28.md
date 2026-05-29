# Flake-Rate Baseline & Harness

**Epic:** #917 — Eradicate load-related test flakiness
**Sprint:** 2 (#913) — Flake-detection harness & objective baseline metric
**Date:** 2026-05-28
**Builds on:** [`test-flakiness-deep-dive-2026-05-28.md`](./test-flakiness-deep-dive-2026-05-28.md) §6 (S2 scope)

---

## 1. What this sprint shipped

An **objective, variance-aware flake-rate metric** and the harness that produces it:

| Piece                                                                            | Path                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Pure metric (`computeFlakeMetric`, `formatFlakeSummary`, `resolveHarnessConfig`) | `scripts/lib/flakeMetrics.ts` (+ `__tests__`)                |
| Harness orchestrator (`npm run test:flake`)                                      | `scripts/run-flake-detection.ts`                             |
| Quarantine list + justified-entry validation                                     | `scripts/lib/quarantine.ts`, `frontend/test-quarantine.json` |
| Quarantine gate (`npm run test:quarantine:check`)                                | `scripts/check-quarantine.ts`                                |
| CI: non-gating `flake-detection` job + gating quarantine step                    | `.github/workflows/ci.yml`                                   |

## 2. The metric (definition)

The harness runs a **target test set N× under the real CI invocation** —
`CI=true vitest run <targets> --coverage` (unbounded workers; the §2.3
amplifier) — and reports:

> **Coverage thresholds are zeroed for the harness run** (`buildVitestArgs`).
> Coverage _instrumentation_ is kept (it is part of the contention amplifier),
> but a filtered subset can never meet the whole-repo 55% threshold, so leaving
> the gate on makes every run exit non-zero on coverage — which would misreport
> a 100% flake rate even when all tests pass. The exit code therefore reflects
> **test pass/fail only**. (Caught on the first CI run, PR #919: 115/115 tests
> passed but the run "failed" at 52.8% lines.)

- **Flake rate** = `failedRuns / totalRuns` on otherwise-unchanged code. Any
  failure across an unchanged suite is, by definition, a flake.
- **Duration p50 / p95 / min / max.** Variance is the _leading_ signal (L53):
  contention is absorbed as slowness before it converts to failure, so a rising
  p95 under a still-green flake rate is an early warning. Reporting pass/fail
  alone would hide the run-up.

**Default target = the §2.3 "suspect set"** (`DEFAULT_SUSPECT_SET`):
`DateSelector.integration.test.tsx`, `src/__tests__/integration/journeys/`,
`src/pages/__tests__/DistrictsPage*`. Overridable via `FLAKE_TARGETS`;
repeats via `FLAKE_REPEATS` (default 10; CI job uses 8).

## 3. Recorded baseline (local, §2.2 machine-noise caveat carried forward)

Suspect set ×5 (a quick local probe; the code default is 10 and the CI job uses
8 to bound per-PR time — all three are the same metric at different sample
counts), `CI=true` + coverage + unbounded workers, on the **same
heavily-loaded developer workstation** the deep-dive flagged in §2.2 (sprint
runner + parent agent session resident; load average well above a clean CI
runner):

| Metric             | Value                        |
| ------------------ | ---------------------------- |
| **Flake rate**     | **100.0%** (5/5 runs failed) |
| Duration p50       | 39.9 s                       |
| Duration p95       | **171.9 s**                  |
| Duration min / max | 30.9 s / 171.9 s             |

The **30.9 s → 171.9 s** spread is the L53 variance signal reproduced in one
batch. Every failure was `Error: Test timed out in 5000ms` — the **V8
unbounded-worker amplifier** crossing the uniform 5 s unit timeout, **not a
logic regression**:

> **Control (proof it is contention, not a red codebase):** the same three
> files run **25/25 green** under the local 3-worker cap (no `CI=true`, no
> coverage). The bug is contention, exactly as the deep-dive concluded.

This number is therefore an **over-amplified ceiling**, not the calibrated CI
flake rate. Per the deep-dive (§2.2, §6 S2.1) the workstation is too noisy to
calibrate on. **The calibrated baseline is the CI `flake-detection` job's
first green-runner result** — read it from the job's step summary / the
`flake-metric.json` artifact on the first PR/branch run after this lands, and
record it under §4.

## 4. Calibrated CI baseline

The clean, calibrated number — `flake-detection` job, suspect set ×8 on a
dedicated `ubuntu-latest` runner:

| Date       | Commit     | Flake rate | p50    | p95    | Source                      |
| ---------- | ---------- | ---------- | ------ | ------ | --------------------------- |
| 2026-05-29 | `8a672b7b` | **0.0%**   | 31.4 s | 31.9 s | PR #919 flake-detection job |

**Reading:** on a clean, non-oversubscribed CI runner the suspect set is **not
flaky** (0/8) and its duration is tight (31.3–31.9 s, p95/p50 ≈ 1.02 — no
variance run-up). This confirms the deep-dive's core conclusion: the flake is
**contention-induced**, surfacing only when the runner is oversubscribed (the
§2.2/§3 workstation, where the same set hit 100% with a 30.9→171.9 s spread).
The clean-runner 0% is the **floor** to defend; the workstation result is the
**stress ceiling**. Sprint 3's explicit CI `maxWorkers` cap (V8) is what keeps a
busy/oversubscribed runner from drifting up toward that ceiling — and this
harness is how S3 proves it.

## 5. Comparison protocol for Sprints 3–4

1. Sprint 3 (#914) sets an explicit CI `maxWorkers` (V8) + fixes the confirmed
   L120 `await waitFor` leak (V2). **Re-run the harness on the same runner
   class and record the new row above.** Expect the flake rate → ~0 and the
   p95/p50 ratio to collapse.
2. Sprint 4 (#915) decouples the Lighthouse/CLS gate from CDN reachability
   (V10). Not measured by this harness (it targets the unit/integration
   suite); track separately.
3. Sprint 5 (#916) proves ~zero flake over a statistically-significant run
   count using this same harness at a higher `FLAKE_REPEATS`.

## 6. Quarantine

`frontend/test-quarantine.json` starts **empty** — no test is bypassing the
gate. The mechanism is two-sided, so a quarantined flake is neither a queue
blocker nor a silent skip (the issue's stated property, R1):

- **Never blocks the queue:** each entry's `file` is folded into the shared
  `baseExclude` (`frontend/vitest.shared.mjs`), so it leaves the BLOCKING run.
  Because `baseExclude` is the single source of truth the R20 partition guard
  also reads, the file leaves ALL / unit / integration at once — the partition
  stays exhaustive (no orphan). Empty list → no-op (verified: guard still
  reports 236 = 173 + 63).
- **Never silently ignored:** the non-gating flake-detection harness still
  exercises the file, and `npm run test:quarantine:check` fails CI if an entry
  lacks a reason or tracking issue.

Exclusion is **file-level** even when an entry's `test` field narrows to one
case (the rest of the file rides along into the non-gating harness). Confirmed
flakes should be **fixed at the source in Sprint 3**, not parked here; the list
is the escape valve for a flake that must be isolated _while_ its root-cause
sprint is in flight, never a permanent home.
