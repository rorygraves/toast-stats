---
id: '113'
category: principle
tags: [frontend, react, charts, performance, cls]
auto_load: true
date: 2026-05-25
issues: [675, 674]
---

# Lesson 113 — An IntersectionObserver visibility gate on already-code-split content is invisible to every non-scroll context

**Date:** 2026-05-25
**Issue:** #675 (epic #674 Sprint 1 — P0: district trend charts stuck on "Loading chart…")

## What happened

The three district trend charts each rendered as
`<LazyChart><LazyMembershipTrendChart .../></LazyChart>`. Two independent
lazy layers were stacked:

- **`LazyChart`** — an `IntersectionObserver` wrapper that renders a
  `ChartSkeleton` until the element scrolls into the viewport, then mounts
  `children`.
- **`LazyMembershipTrendChart`** — a `React.lazy` + `Suspense` wrapper that
  code-splits the recharts chunk.

The inner `React.lazy` already keeps recharts off the initial bundle. The
outer `IntersectionObserver` added nothing but a **viewport dependency**: the
charts only mount once `isIntersecting` fires. In any context that doesn't
actually scroll the element through the viewport — a full-page screenshot, a
print/PDF, a screen-reader full-page traversal, the UX-audit capture that
filed this bug — the observer never fires, `children` never mount, and the
inner `React.lazy` import is never even triggered. The charts sit on the
skeleton forever (0 `<svg>`), and the unthemed skeleton showed as a bright
white block on the dark page.

Empirically (Playwright on prod, real scroll vs. no scroll): **3 stuck
skeletons before scroll → 17 `<svg>`, 0 skeletons after scroll.** Real users
scrolling were fine; the "stuck indefinitely" symptom was the gate failing in
non-scroll capture. The report came from a tool, and the gate made the charts
invisible to exactly that class of tool.

## Why the tests didn't catch it

The jsdom test setup mocks `IntersectionObserver` to fire `isIntersecting:
true` **synchronously on `observe()`** — its own comment said "so LazyChart
renders children immediately." Every test therefore saw the gate open. The
auto-firing mock papered over the one behaviour that mattered. (Same family as
lesson 066/092: jsdom can't see the real thing — here it actively simulates
the success path.)

## The principle

**Don't gate already-code-split content behind viewport visibility.**
`React.lazy` defers the _download_; it does not need a second
`IntersectionObserver` to defer the _render_. The extra gate buys a marginal
on-scroll-load optimisation at the cost of making the content invisible to
every non-scroll consumer. If you must reserve space, use a fixed-`minHeight`
container (CLS-safe) — not a visibility gate.

## How to apply

- Audit `IntersectionObserver` wrappers: `grep -rn "IntersectionObserver"
frontend/src`. If the gated child is itself `React.lazy`, the gate is
  redundant — delete it and render the lazy component directly inside a
  fixed-height div.
- A failing test for a viewport gate must use an observer that **never**
  fires (below-fold / non-scroll), not the global auto-firing mock — assert
  the content renders anyway.
- When a bug is "X is stuck/invisible" and the reporter is a capture tool,
  reproduce **both** with and without a real scroll before concluding it's a
  user-facing hang — it may be a non-scroll-context artifact that still wants
  fixing (tools, print, a11y), just not for the reason stated.

## Related

- [[079-suspense-fallback-for-null-component-is-pure-cls]] — sibling: the
  _other_ failure mode of an over-eager lazy wrapper (reserving space for a
  null render). Here the wrapper reserved a render that never came.
- [[092-fixed-background-elements-need-literal-colors-not-theme-tokens]] — the
  same PR's second defect: the skeleton's hardcoded `#f9fafb` white block.
  Here the skeleton _should_ adapt, so it moved to `--surface-secondary` /
  `--border-default` / `--text-muted` remapping tokens (R10).
- R10 in `tasks/rules.md`.
