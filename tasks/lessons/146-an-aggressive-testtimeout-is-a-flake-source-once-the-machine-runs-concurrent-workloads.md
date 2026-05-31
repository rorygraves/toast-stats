---
id: '146'
category: lesson
tags: [testing, vitest, flake, ci, performance, runner-fleet]
auto_load: true
date: 2026-05-31
issues: [1003]
---

# Lesson 146 — An "aggressively low" testTimeout is a latent flake source the moment the same machine runs concurrent workloads

**Date:** 2026-05-31
**Issue:** #1003
**PR:** #1004

## What happened

The pre-push gate started intermittently failing on `CollapsibleSection`'s
"renders a plain heading with no toggle button" — a **trivial render test** —
with "Test timed out in 5000ms". It actually ran **8340ms**. The config had
`testTimeout: 5000` deliberately set "aggressive ... for fast test execution",
and the test _is_ fast: un-contended it passes all 6 cases in a **1.78s**
tests-phase.

The variable was **machine saturation**. The red-barkeep sprint-runner fleet
runs several `npm`/`vitest`/build processes concurrently. A vitest test's
wall-clock isn't just the assertion body — it includes per-test transform,
module import, and (for jsdom) environment setup. Un-contended that overhead is
~ms; under fleet contention the jsdom environment + import alone ballooned the
_same trivial test_ past 5s. I even reproduced it live: pushing this fix while a
sibling repo's suite ran got the pre-push vitest **SIGTERM'd (exit 143)** from
contention — the exact failure mode, self-inflicted.

## The transferable principle

**A test timeout must budget for the worst-case _contended_ wall-clock, not the
un-contended tests-phase.** "This test is fast, so 5s is plenty" is true in
isolation and false on a machine that also runs N other test suites. The
timeout's job is to catch _hangs_, not to enforce a performance SLA on a
resource-starved host — those are different concerns, and conflating them turns
every fast test into a load-sensitive flake. The fleet you built to ship faster
is also the ambient load that breaks a tight timeout.

This is **not** assertion-pinning or masking a perf bug: the test is provably
fast un-contended (1.78s/6 tests). Raising the timeout absorbs load variance
without hiding anything. The repo already conceded this twice — the config's own
#473/L53 comment ("a busy dev machine ... blows the 5s timeout") and a heavy
journey test that already overrides to `vi.setConfig({ testTimeout: 15000 })`.

## How to apply

- **Diagnose before bumping:** time the test un-contended (vitest's
  _tests-phase_ line, not total). If tests-phase ≪ timeout but _total_ under
  load exceeds it, it's load-induced → a timeout bump is correct. If tests-phase
  itself is near the timeout, it's a real perf issue → fix the test/code.
- **Bump globally, not per-file,** when the cause is machine saturation: the
  flake is test-agnostic (any test can be the unlucky one in a given tick), so
  per-file overrides just whack-a-mole. Match an existing in-repo value (15s
  here) rather than inventing one.
- **Never run a second heavy vitest while a pre-push hook runs the full suite.**
  You'll SIGTERM your own push (143) and misread it as a test failure. Push on a
  quiet machine; serialize suite runs.

## Related

- `frontend/vitest.config.ts` (the 5s→15s bump, comment-flagged with the cause).
- [[145-an-incidental-extra-render-can-be-load-bearing-for-cls-removing-it-regresses-layout]]
  — sibling "CI environment exposes what the dev machine hides" lesson; here the
  exposing condition is _concurrent load_ rather than _CI fonts_.
- red-vote #747/#748 — same fix, same root cause, applied to its agenda-pdf
  integration flake (cross-repo confirmation it's the fleet, not the test).
