---
id: '141'
category: lesson
tags: [tests, playwright, e2e, verification, frontend, accessibility]
auto_load: true
date: 2026-05-29
issues: [887, 888]
---

# Lesson 141 — A page-sweep tripwire passes vacuously on nav chrome; gate each route on a content sentinel, not a bare element count

**Date:** 2026-05-29
**Issue:** #887 (epic #888 Sprint 3 — touch-target tripwire)
**PR:** [#944](https://github.com/taverns-red/toast-stats/pull/944)

## What happened

The Sprint-3 deliverable is a permanent dual-engine smoke that sweeps every
routed page, queries every interactive element, and asserts each clears the
44px touch-target floor (the #886 fix it locks in). My first cut guarded against
a blank page with `expect(found.length).toBeGreaterThan(0)` — "if we measured at
least one control, the page rendered."

Fresh-context review caught the hole: the app shell (header, theme toggle,
hamburger) renders on **every** route, _including_ when a route's real content
fails to load. So a route whose family-A chip-select toolbar never mounted —
the exact control the tripwire exists to guard — would still satisfy
`found.length > 0` from nav chrome alone and pass **green having measured
nothing relevant**. The sweep's breadth was an illusion: it counted chrome and
called it coverage.

## The transferable lesson

**A page-sweep guard (touch-targets, a11y axe, contrast, coverage-by-route)
that asserts "I found ≥1 thing" is vacuous, because shared chrome guarantees ≥1
thing on a route that otherwise failed to render.** Breadth of the _selector_
does not prove breadth of the _content_. Gate each route on a **content
sentinel** — a locator for a control the page is _required_ to mount — and
`waitFor` it before measuring. The sentinel does double duty: it's the
content-ready wait (don't measure a half-painted page, cf.
[[133-proxy-the-prod-cdn-and-give-each-git-state-its-own-served-dir]] /
regions-legibility.smoke) **and** the anti-vacuous-green guard ("the toolbar
didn't render" becomes a loud red instead of a silent pass).

Here: the family-bearing routes pin `[data-testid$="-chip-select"]` (family A)
or `.region-finder__chip` (family C); routes the #885 audit found clean keep
only the ≥1 floor. The empirical proof the guard is non-vacuous is still the
red run — a pre-#886 build must red the routes that carry the defect — but the
sentinel is what stops a _future_ "controls stopped rendering" change from
sailing through green.

## How to apply

- Writing a sweep that loops over pages/routes and asserts a property of "all
  matched elements"? Ask: _what renders even when this page is broken?_ If the
  answer is "nav/layout chrome," your non-vacuity floor must be a per-page
  content sentinel, not a global count.
- Make the sentinel the same selector family as the thing under test (the
  control #886 fixed), so "didn't render" and "rendered wrong" both red.
- This is the breadth-cousin of [[107-a-deferred-async-insert-cls-source-reactivates-the-moment-its-data-gets-populated]]:
  a guard keyed off "data is usually present" silently expires the day it isn't.

## Related

- [[138-an-inset-0-overlay-is-sized-to-the-padding-box-a-border-steals-from-the-touch-target]]
  and [[111-native-select-ignores-min-height-in-webkit-defeating-touch-targets]]
  — the box-model / WebKit-native-control defects this tripwire guards; both are
  caught only by a live `boundingBox()` in BOTH engines, never a className.
- [[135-a-coverage-gate-fails-a-filtered-subset-run-zero-thresholds-in-a-flake-harness]],
  [[136-a-flake-detector-must-not-inherit-the-stability-cap-it-measures]] — same
  family: a detector that can't reproduce the failure reports a reassuring green.
- `tasks/rules.md` R20 — the smoke imports `INTERACTIVE_SELECTORS` /
  `MIN_TOUCH_TARGET_PX` from the product so the guard can't drift from the app.
