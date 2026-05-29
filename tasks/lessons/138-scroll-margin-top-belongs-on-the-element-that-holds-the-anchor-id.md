---
id: '138'
category: lesson
tags: [css, frontend, accessibility, verification, playwright, mobile]
auto_load: true
date: 2026-05-29
issues: [877, 880]
---

# Lesson 138 — `scroll-margin-top` belongs on the element that holds the anchor id, not a styled child

**Date:** 2026-05-29
**Issue:** #877 (epic #880 Sprint 1 — in-page TOC + mobile-collapsed H2s on /methodology)
**PR:** [#934](https://github.com/taverns-red/toast-stats/pull/934)

## What happened

The Methodology page anchored each section as `<section id="borda-count">`
with a child `<h2 class="methodology-section__title">`. The TOC-jump offset
(`scroll-margin-top: 80px`, to clear the fixed top bar) had been placed on the
**title**, not the section. The browser applies `scroll-margin` to the
_fragment target_ — the element whose `id` matches the hash — which is the
`<section>`. So the offset on the child was silently inert: every `#section`
jump landed the heading **under** the fixed header. It went unnoticed because
the desktop TOC was rarely used; Sprint 1 promoted the TOC to the primary
mobile nav, which is what surfaced it. Fresh-context review caught it; the fix
was one line — move `scroll-margin-top` to `.methodology-section`.

## The principle

**`scroll-margin-*` only does anything on the element the URL fragment
actually targets.** When an `id` lives on a wrapper but the visible heading is
a child, the offset must be on the wrapper. A "we already set scroll-margin"
is not the same as "the jump lands right" — verify which element carries the
`id`.

## How to verify (don't trust `boundingBox().y`)

Driving the anchor jump on the live preview at 375px caught a second trap:

- **Playwright `locator.boundingBox().y` is document-relative**, not
  viewport-relative. To assert "the heading landed inside the viewport, below
  the header," read `getBoundingClientRect().top` via `page.evaluate` — that's
  the viewport-relative number (here it settled at exactly `80`, the offset).
- **The hash-scroll settles a tick after the click**, especially when the
  click also fires a React state update (expanding the collapsed section). A
  synchronous `scrollY` read returns `0` and flakes. Use
  `await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)`
  before measuring — never an arbitrary `waitForTimeout`.

## Related

- [[134-a-status-chip-in-an-overflowing-table-is-still-clipped-detable-the-row]]
  — same "verify mobile geometry by bounding box, not `toBeVisible`" family;
  this one adds _which_ box API is viewport-relative.
- [[128-a-filter-control-is-aria-pressed-not-role-tab]] — the disclosure
  pattern used for the collapsed sections (aria-expanded, not a tab).
