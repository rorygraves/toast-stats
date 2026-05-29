---
id: '136'
category: principle
tags: [tests, flaky, vitest, ci, contention]
auto_load: true
date: 2026-05-29
issues: [914, 917]
---

# Lesson 136 — A flake detector must not inherit the stability cap it measures; cap the gate, pin the detector to max parallelism

**Date:** 2026-05-29
**Issue:** #914 (epic #917 Sprint 3 — eradicate contention & isolation root causes)
**PR:** _(record on merge)_

## What happened

The Sprint 1 deep-dive named the unbounded-worker CI config
(`maxWorkers: process.env.CI ? undefined : 3`) the single highest-leverage flake
amplifier: an oversubscribed runner spawns one fork per core and fast tests blow
the 5s timeout (contention, not a regression). Sprint 3's fix capped the
**blocking** CI test job at 50% of cores. But the repo also has a non-gating
**flake-detection harness** (Sprint 2, #913) that runs the suspect set N× under
`CI=true vitest run --coverage` and reports a pass/fail + variance metric — and
it picked up the CI worker policy from the same vitest config.

If the detector inherits the cap, it only ever runs the _safe_ configuration. A
detector that can't reproduce contention can never surface a contention
regression — it would report a reassuring 0% forever while the very failure mode
it exists to catch drifts back in. The cap that stabilizes the gate _blinds_ the
detector.

## The transferable principle

**An instrument that measures stability must not be subject to the same
stabilization it measures.** When you add a guard that suppresses a failure
class (a worker cap, a retry, a timeout, a serialization lock), check whether
your _detector_ for that class shares the config — and decouple it if so. Here:
the gate is capped (`resolveMaxWorkers` → 50% in CI, the durable stability
guard); the detector explicitly pins `--maxWorkers=100%` in `buildVitestArgs`
(one fork per core, the original amplifier) so it stays maximally sensitive.
Gate = capped/stable; detector = unbounded/sensitive. Same idea as keeping
coverage _instrumentation_ but zeroing the _threshold_ in the harness ([[135-a-coverage-gate-fails-a-filtered-subset-run-zero-thresholds-in-a-flake-harness]]):
preserve the contention load, neutralize only the gate that would mask the
signal.

## How to apply

- Sourcing a worker/retry/timeout policy from shared config? Ask "does my flake
  detector read this too?" If yes, give the detector an explicit override so a
  future tightening of the gate doesn't silently desensitize it.
- A detector reporting a _tight_ 0% (no duration spread) right after you added a
  stabilizer is suspect — confirm it's still running the _stressful_
  configuration, not the safe one. Variance is the signal (L53); its absence in
  a detector can mean the detector went blind, not that the flake is gone.

## Adjacent gotcha from the same sprint (V2)

A React Query hook that hardcodes `retry: N` at the **query** level overrides a
test wrapper's `retry: false` **default** — so rejection-path tests sit through
the full exponential backoff (~1s + 2s …) before settling, pushing them toward
the 5s timeout under load. Fix in the test wrapper with `retryDelay: 0`: it keeps
the retry _count_ (any "bounded retries" assertion still holds) but collapses the
multi-second window. In #914 this dropped one file's test time 27.4s → 0.18s.

## Related

- [[135-a-coverage-gate-fails-a-filtered-subset-run-zero-thresholds-in-a-flake-harness]]
  — sibling: neutralize the gate, keep the load.
- [[053-renderwithproviders-bloat-as-contention-amplifier]] — variance is the
  contention signal; this lesson is why a detector must stay able to produce it.
- `frontend/vitest.shared.mjs` (`resolveMaxWorkers`), `scripts/lib/flakeMetrics.ts`
  (`buildVitestArgs` `--maxWorkers=100%`).
