---
id: '107'
category: lesson
tags: [frontend, react, cls, performance]
auto_load: true
date: 2026-05-26
issues: [750, 488, 683]
---

# Lesson 107 — A deferred async-insert CLS source reactivates the moment its data gets populated

**Date:** 2026-05-26
**Issue:** #750 (epic #683 Sprint 2)

## What happened

Lighthouse on `/` failed `cumulative-layout-shift` at **0.198** (threshold 0.1),
intermittently — fails, then passes on re-run. That fail/pass flutter is the
Lesson 079 tell: a real shift sitting right at the threshold, surfaced or hidden
by run-to-run timing, **not** a flaky metric.

Root cause was a component Lesson 079 explicitly named and **chose to leave
unfixed**: `AwardsRaceSection`, rendered above the toolbar on `DistrictsPage`,
fed by `useCompetitiveAwards` — a _separate_ React Query from the rankings query
that paints the page. On a cold load the rankings resolve first → page paints →
`competitiveAwards` is still `undefined` → the section returns `null` (0px).
A few hundred ms later the awards query resolves → the section expands to a
~286px 3-card block → the toolbar + hero search + rankings table all shift down
~286px. CLS.

Lesson 079 measured this same section at CLS 0.012 and wrote: "Did not touch
AwardsRaceSection … appears late … reserving more space would have been
speculative and risked padding empty space on legacy snapshots that lack
`competitive-awards.json`." That call was correct **at the time** — the file
was absent, so the section stayed `null` and never expanded. The regression is
not a code change at all: the data pipeline started populating
`competitive-awards.json`, and a dormant async-insert woke up.

## The transferable point

A "we deferred reserving space because the data isn't there yet" decision has a
**hidden expiry**: it silently becomes wrong the day the data starts arriving.
Nothing in the code changes; no PR touches the component; the bisect points at
"~32 commits of unrelated work" because the trigger was a _data_ state flip, not
a _code_ diff. When you defer a CLS reservation conditioned on "this data is
usually absent," you are betting the data stays absent. Write that bet down as a
tripwire, because the pipeline will eventually win it.

This is the dual of Lesson 079's own rule. 079: _a component that renders null
then expands is pure CLS — hoist the null-guard so it renders null
consistently._ But hoisting only works when the **default state is empty**
(`LazyComparisonPanel` with <2 pins). When the default state will be **full once
data loads** (an awards race that's populated every snapshot now), you cannot
hoist to null — you must **reserve the slot** so the fill lands in place.

## How to apply

- For an above-the-fold section fed by a **secondary query that resolves
  separately from** the query that paints the page: reserve its slot with a
  height-matched, `aria-hidden` skeleton keyed off that query's `isLoading`.
  Don't render `null`-until-data for anything above the fold.
- Match the reserved height by **reusing the real chrome + the static
  (non-data) rows** (titles, thresholds, fixed-height value/progress rows), not
  a guessed `min-height`. Static rows reused verbatim track the loaded height
  across breakpoints and dark mode for free; only the data rows become bars.
- **Don't** gate the whole page's loading state on the secondary query to dodge
  the shift — that couples primary content (the leaderboard) to a secondary
  feature; a slow/failed secondary fetch then delays the primary render. Reserve
  the slot instead; the primary content paints immediately.
- When you _deliberately defer_ a CLS reservation because "the data is usually
  absent," record it as an Active Tripwire in `tasks/rules.md`, not just a code
  comment. The trigger to revisit is a **data** event (pipeline populates the
  file), which no code reviewer will catch.
- Reproduction needs real data: an empty/error preview shows ~0.05 and hides the
  bug. Point the local preview at the staging CDN bucket
  (`VITE_CDN_BASE_URL=…toast-stats-data-staging`, CORS `*`) and drive a
  Playwright `layout-shift` PerformanceObserver capture under desktop throttling
  to see the shifting nodes (`entry.sources[].node`). lhci confirms the budget.

## Related

- [[079-suspense-fallback-for-null-component-is-pure-cls]] — the parent lesson;
  this is the case it deferred, now live. Hoist-to-null (079) and reserve-the-slot
  (107) are the two halves: hoist when the default is empty, reserve when the
  default fills.
- [[081-phase-gated-deferral-tests-move-with-the-spec]] — the Google-Fonts swap
  is the _other_, smaller `/` CLS source; out of scope without metric-matched
  fallbacks.
- `lighthouserc.js:26` — the 0.1 CLS budget that caught both regressions.
