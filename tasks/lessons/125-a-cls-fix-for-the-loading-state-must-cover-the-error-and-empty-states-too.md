---
id: '125'
category: lesson
tags: [cls, performance, frontend, verification, ci]
auto_load: true
date: 2026-05-27
issues: [811, 488, 750]
---

# Lesson 125 — A CLS fix for the loading state must cover the error/empty states too

**Date:** 2026-05-27
**Issue:** #811 (epic #813 Sprint 3 — landing rankings table) — surfaced during PR
#825 verification.

## What happened

The Lighthouse CI gate on `/` failed with CLS **0.206** (budget ≤0.1) on a PR
whose entire diff lived inside the loaded `.districts-page` table. The reflex
read is "the table change shifted layout." The trace said otherwise: the single
shifting node was `div.districts-page-root > div.container`
(`<div class="container mx-auto px-4 py-8">`) — a wrapper that exists **only in
DistrictsPage's `isError` branches**, which the diff never touched. The LCP
element was the header orientation text (the skeleton), and no loaded-state
markup (`District Rankings`, `districts-rankings-table`) was present in the LHR
at all. So the run had gone **skeleton → error**, not skeleton → table: the CDN
rankings fetch flaked on the localhost LHCI runner, and the page rendered the
error state. Re-running the job (CDN reachable) passed at <0.1, 3/3.

The root cause is a half-finished fix. #488 proved that swapping the
`.container mx-auto px-4 py-8` wrapper for the real `.districts-page` wrapper on
data-load was "the dominant remaining CLS source — CI attributed 0.1998 to that
container alone," and fixed the **loading skeleton** to use `.districts-page`.
But the two `isError` branches still render `.container mx-auto px-4 py-8`. So
the exact 0.2 shift #488 killed for the happy path is alive on the error path,
and it fires whenever the data source flakes — an **intermittent gate failure
that has nothing to do with the PR under test.**

## The transferable lesson

**A layout-stability fix made for one async outcome (loading) must be applied to
every sibling terminal state (error, empty, no-data) — they share the same
geometry-swap surface.** A component with `loading | error | empty | loaded`
states shifts CLS on _every_ transition between wrappers of different geometry,
not just `loading → loaded`. Fixing one transition and leaving the others is a
latent, data-dependent gate failure: green most days, red the day the upstream
flakes, and the red lands on whatever innocent PR happens to be building then.

Corollary for debugging a CLS failure: **read the `layout-shifts` audit's node
selector before blaming the diff.** If the shifting element isn't in your diff's
code path — here, an `isError`-only wrapper on a PR that only touched the loaded
table — the failure is pre-existing and (often) environmental, not yours. Don't
"fix" your code to chase a phantom (cf. Lesson 108).

## How to apply

- When you stabilise a component's loading→loaded swap, give the error/empty
  states the **same outer wrapper geometry** (here: wrap them in
  `.districts-page-root > .districts-page`, not `.container mx-auto px-4 py-8`).
- A flaky CLS/Lighthouse gate on `/` that names an error-state node is the tell
  that an external dependency (CDN) failed on the runner — re-run to confirm,
  then fix the error-state geometry so the gate stops depending on CDN luck.
- Filed follow-up to align the two `DistrictsPage` `isError` wrappers; out of
  #811's single-responsibility scope (its diff was all loaded-state).

## Related

- [[079-suspense-fallback-for-maybe-null-is-pure-cls-hoist-the-guard]] — the
  same family: a state that renders different geometry than its sibling is a CLS
  source; reserve the slot.
- [[107-a-deferred-async-insert-cls-source-reactivates-when-its-data-lands]] —
  CLS sources that hide until a data condition flips; here the condition is
  "the fetch errored," which the gate hits intermittently.
- [[108-verify-a-sticky-header-by-measuring-the-sticky-cell-not-the-thead-wrapper]]
  — verify the real node before touching code; the failing node, not the diff,
  tells you where the bug is.
