---
id: '135'
category: lesson
tags: [tests, flaky, vitest, ci, coverage, verification]
auto_load: true
date: 2026-05-29
issues: [913, 917]
---

# Lesson 135 — A global coverage threshold deterministically fails a filtered subset run; a flake harness must keep instrumentation but zero thresholds

**Date:** 2026-05-29
**Issue:** #913 (epic #917 Sprint 2 — flake-detection harness)
**PR:** [#919](https://github.com/taverns-red/toast-stats/pull/919)

## What happened

The flake-detection harness runs the §2.3 "suspect set" (a handful of files,
not the whole suite) N× under the real CI invocation — `vitest run <targets>
--coverage` — and reports a flake rate from each run's pass/fail. Locally it
looked plausible. The **first CI run reported 8/8 runs failed → 100% flake**.

That number was a lie. The job log showed **115/115 tests passed**; the run
exited non-zero only on:

```
ERROR: Coverage for lines (52.8%) does not meet global threshold (55%)
```

A **filtered subset** loads only some of the repo's files, so its coverage is
structurally below the whole-repo 55% threshold — **every time**, regardless of
test outcome. The harness was keying "did this run fail?" off the process exit
code, and the coverage gate was failing the exit code deterministically.

## The two transferable points

1. **A flake harness's run-result signal must measure the thing it claims to
   measure.** Keying off the raw exit code conflates _test_ failure with
   _coverage-gate_ failure (and lint, type, any other gate folded into the same
   command). When you run a **subset** under `--coverage`, zero every threshold
   (`--coverage.thresholds.lines=0` …). Keep `--coverage` itself — the
   _instrumentation_ is real contention load you want to reproduce — but the
   _threshold_ is a whole-suite gate that a subset can't and shouldn't satisfy.

2. **Near-zero variance in a "100% flake" is the tell that it's deterministic,
   not flaky.** The bad run's durations were 31.5–31.7 s across all 8 runs
   (p95/p50 ≈ 1.00). A genuine contention flake has a _spread_ (the same set on
   an oversubscribed box went 30.9 → 171.9 s). Variance is the diagnostic (L53):
   a tight, uniform "failure" is a fixed gate firing, not load. Always sanity-
   check a flake number against its duration spread before trusting it.

## How to apply

- Building any "run the suite/subset N× and count failures" harness: strip or
  neutralize every _whole-suite_ gate (coverage thresholds, and ideally use a
  reporter/exit that reflects only test status) so the count is test-only.
- Reviewing a flake/repeat metric: if the failure rate is high but the per-run
  duration variance is ~0, suspect a deterministic gate, not a flake.
- This is also a verification lesson: the bug was invisible locally (the loaded
  workstation failed on real timeouts _and_ would have failed on coverage —
  two failure modes conflated) and only the **clean CI runner** separated them.
  Trust the calibrated runner over the noisy dev box (deep-dive §2.2).

## Related

- [[053-renderwithproviders-bloat-as-contention-amplifier]] — variance is the
  signal; this lesson is the inverse tell (no variance ⇒ not a flake).
- [[082-lint-rule-at-error-can-be-inert-across-a-minor]] — verify a mechanism
  against known-good/known-bad input rather than trusting it wired correctly;
  here the first real CI run was that verification.
- `docs/investigations/flake-baseline-2026-05-28.md` — the calibrated baseline
  (0% on a clean runner) this fix unblocked.
