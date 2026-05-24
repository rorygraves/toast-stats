---
id: '090'
category: principle
tags: [vitest, tests, ci]
auto_load: true
date: 2026-05-23
issues: [482, 616]
---

# Lesson 090 — Splitting one test suite into named projects needs a partition guard, or files silently fall out of both

**Date:** 2026-05-23
**Issue:** #482 (test-infra: first-class vitest unit/integration projects, epic #616)
**Tags:** testing, vitest, test-infra, ci, falsifiability

## What happened

#482 split the frontend vitest suite into two first-class projects: a fast
`unit` project (run by the restored pre-push hook) and a heavy `integration`
project (page mounts, journeys, axe scans) that only runs in CI. The old
full-suite pre-push hook had been removed (`exit 0`) in May because those
heavy tests saturated worker threads on multi-core dev machines and made the
gate chronically flaky (Lesson 53; `tasks/473-flaky-prepush-diagnosis`).

## The non-obvious risk of a project split

The headline goal was speed/reliability. But the most _dangerous_ failure
mode of splitting one config into N projects is silent and has nothing to do
with speed: **a test file that matches no project's include/exclude stops
running entirely, in every gate, with no error.** Coverage dips a little, a
regression sails through weeks later, and nothing ever pointed at the cause.

A unit project defined as "everything except these integration globs" and an
integration project defined as "exactly these globs" can drift apart the
moment someone adds a test that matches neither — e.g. a new top-level
`__tests__/foo/` directory not covered by either side.

## Fix — a falsifiable partition guard, sourced from vitest itself

`frontend/scripts/check-test-projects.mjs` asserts the partition is both
**disjoint** (no file in two projects → no double-run) and **exhaustive**
(every collected file in exactly one project → no orphan). The critical
design choice: it derives truth from **vitest's own resolution**
(`vitest list --json` with and without `--project`), not from a re-implemented
glob walk. A parallel reimplementation would itself drift from the real
config and give false confidence. Wired into CI as its own step.

The partition definition lives once in `vitest.shared.mjs`, imported by both
the config and the guard — single source of truth.

## Evidence over intuition (a worked example)

I assumed the slow tests in the `unit` project would be the large
component/page tests the diagnosis named (ClubsTable etc.). Measuring
per-file durations proved the opposite: ClubsTable was 0.5s; the 27s long
pole was `DateSelector.test.tsx` — 14 tests each driving the full TanStack
Query loading→error→retry lifecycle through a real `QueryClientProvider`.
That is an _integration_ test by the QE matrix (multiple layers wired
together), not a unit test. Renaming it to `*.integration.test.tsx`
auto-routed it via the convention glob and dropped the unit project from
~30–35s to **18–20s with zero variance across 10 runs** (1970/1970 every
run). I would have refactored the wrong files if I had trusted the
diagnosis's bucket names instead of measuring.

## How to apply

- **Any time you partition a test suite (projects, shards, tags), add a guard
  that the partition is exhaustive.** The orphan-file failure is silent and
  expensive; a 100-line script catches it in CI forever.
- **Source the guard from the tool's own resolution, not a parallel
  reimplementation.** `vitest list --json` is authoritative; a hand-rolled
  glob walk is a second source of truth that can disagree with the first.
- **Classify by behaviour, then encode it as a naming/dir convention** so new
  tests auto-route (`*.integration.test.tsx`, `pages/__tests__/`,
  `__tests__/accessibility/`). Convention + guard beats a hand-maintained
  exclude list that rots.
- **Measure per-file timings before deciding what to move.** The long pole is
  often not the file you'd guess (here: an async-lifecycle component test, not
  a big table render).

## A second, process-level catch (worktree was behind main)

This sprint ran in an isolated worktree based on `main` at launch
(`9c712cea`). While I worked, the operator advanced `main` three commits
(#633/#634 pgrep fix + Lesson 089). `git diff main..HEAD` then showed my
branch _reverting_ the pgrep fix and _deleting_ Lesson 089 — phantom changes
I never made, purely because my base was stale. A `git rebase origin/main`
(clean — no overlap with my files) stripped them. **Always diff against the
current remote tip, not your possibly-stale local base, before opening a PR
from a long-lived worktree.** (See [[087-spawned-sessions-need-their-own-worktree-not-shared-checkout]].)

## Related

- [[053-renderwithproviders-bloat-as-contention-amplifier]] — the first round
  of fighting this contention; the project split is the deeper fix it pointed at.
- [[081-phase-gated-deferral-tests-move-with-the-spec]] — tests move with the
  spec; here a test moved projects because its behaviour was integration-shaped.
- [[087-spawned-sessions-need-their-own-worktree-not-shared-checkout]] — the
  worktree isolation that also produced the stale-base footgun above.
