---
id: '107'
category: lesson
tags: [css, responsive, frontend, mobile]
auto_load: true
date: 2026-05-26
issues: [735, 756]
---

# Lesson 107 — A horizontal-overflow fix has two layers: collapse the wide child AND shrink the container's own fixed gutters

**Date:** 2026-05-26
**Issue:** #735 (epic #756 Sprint 1 — app-shell nav overflows at 375px)

## What happened

The app-shell top bar forced ~314px of document horizontal scroll at 375px:
brand + a 5-link inline nav + a tools cluster on one fixed-width row. The
obvious fix — collapse the nav behind a hamburger disclosure below 768px —
took the overflow from ~314px to **2px**, not 0. The residual 2px came from the
bar's _own_ chrome: `padding: 0 24px` (48px of gutter) + `gap: 24px` between
flex children. With the nav gone, brand + toggle + tools still didn't quite fit
375px once you paid 48px of padding and the inter-item gaps. The avatar's right
edge landed at 377px.

The collapse was necessary but not sufficient. The second layer — tightening the
container's gutters/gap on mobile (`16px`/`12px`, restored to `24px`/`24px` at
the desktop breakpoint) — is what actually reached 0.

## The principle

When you kill horizontal overflow on a fixed-height chrome bar, there are two
independent contributors and you usually have to fix both:

1. **The dominant wide child** — collapse/scroll/reflow it (here: nav →
   disclosure menu).
2. **The container's own fixed paddings + gaps** — a row that was sized for a
   1280px desktop can have gutters that alone overshoot a 375px phone once the
   big child is gone. Re-check after the collapse; don't assume step 1 finished
   the job.

A near-miss (1–3px) residual after the "real" fix is the tell that layer 2 is
still unpaid.

## Debugging note: tables in `overflow-x:auto` wrappers are false offenders

While hunting the overflow, `getBoundingClientRect().right` reported the wide
data tables at ~900px (way past the 375px viewport) — but they were _not_ the
cause. They live inside `overflow-x:auto` scroll wrappers that clip them, so
they never push `document.documentElement.scrollWidth`. Measure the **document**
(`scrollWidth - clientWidth`), and when enumerating offending elements, skip any
node that is its own scroll container (`el.scrollWidth <= el.clientWidth`). The
real culprit was a 2px chrome element, drowned out by 900px red herrings.

## How to apply

- After collapsing the big child, re-measure `documentElement.scrollWidth -
clientWidth` at 375px. If it's a small positive number, audit the
  container's padding + gap, not the child you just fixed.
- Verify overflow in a real browser (jsdom has no layout — [[066-jsdom-style-assertions-dont-catch-positioning-bugs]]). Run the
  check in both engines; a sub-pixel rounding difference can flip Chromium vs
  WebKit.
- A full-page screenshot at 375px settles slowly — wait out the late
  table reflow before measuring, or you'll catch a transient mid-load overflow
  (this made the verification smoke flaky until a settle wait was added).

## Related

- [[066-jsdom-style-assertions-dont-catch-positioning-bugs]] — overflow/layout
  bugs need a real browser, not jsdom.
- [[105-match-the-mobile-table-pattern-to-the-datas-purpose-not-a-sibling-tables-precedent]]
  — why nav got a disclosure (pick-a-destination) and tables get a non-trap
  scroll (compare-across-rows); the mobile pattern follows the data's job.
- R12 (`tasks/rules.md`) — batch same-breakpoint CSS fixes; here the two layers
  are one logical 375px fix.
