---
id: '108'
category: lesson
tags: [tests, playwright, css, frontend, accessibility]
auto_load: true
date: 2026-05-25
issues: [667, 665]
---

# Lesson 108 — Verify a sticky header by measuring the sticky cell, not the `<thead>` wrapper

**Date:** 2026-05-25
**Issue:** #667 (epic #665 Sprint 1 — clubs table: remove pagination, single sticky-header table)

## What happened

The clubs table dropped pagination for one capped-height scroll container
with a sticky header. The header CSS pins the **`<th>` cells**
(`.clubs-table-sticky-head th { position: sticky; top: 0 }`) — the standard
cross-browser pattern, because `position: sticky` on a bare `<thead>` is
unreliable under `border-collapse: collapse`.

The Playwright preview smoke asserted stickiness by scrolling the container
and checking that the header stayed at the container top. But it measured the
**`<thead>` element's** `getBoundingClientRect()`:

```js
const head = el.querySelector('thead')
const delta = Math.abs(head.getBoundingClientRect().top - containerTop)
expect(delta).toBeLessThan(4)
```

It failed on both Chromium and WebKit with `delta === scrollTop` (600) — i.e.
"the header scrolled away, sticky is broken." A real bug would block the
sprint here.

It was a **measurement** bug, not a product bug. Empirical check on the live
preview (toggling styles via `page.evaluate`, measuring the `th` directly)
showed the `<th>` cells were pinned perfectly (`delta === 0`) in every
combination of `border-collapse` and sticky-on-`th`-vs-`thead`. The computed
style was already `position: sticky; top: 0px` and correct.

## The trap

When sticky lives on the `<th>` cells, the **`<thead>` box itself stays in
normal flow and scrolls away** — especially in WebKit. Only the cells pin.
Measuring the wrapper reports the un-pinned flow position and falsely
concludes "not sticky." The thing that is sticky is the only thing you may
measure.

## How to apply

- To verify a sticky table header, query and measure the **element the
  `position: sticky` rule targets** (here `thead th`), not its ancestor:

  ```js
  const th = el.querySelector('thead th')
  const delta = Math.abs(th.getBoundingClientRect().top - containerTop)
  ```

- More generally: a layout assertion must measure the node that owns the
  layout property under test. `position`, `top`, `transform` apply to the
  element they're set on; a parent/child box can sit elsewhere.
- When a layout/visual assertion fails, **confirm the computed style and
  measure the right node on the live page before touching the CSS.** Here the
  CSS was correct from the first commit; "fixing" it would have chased a
  phantom. Driving the real change on the preview (per #444 / DoD) is what
  surfaced that the test, not the code, was wrong.

## Telltale signs

- A sticky-header test fails with `delta ≈ scrollTop` (the measured node moved
  by exactly the scroll amount → it isn't the pinned node).
- The failure reproduces in WebKit more readily than Chromium (engines differ
  on whether the `<thead>` box tracks its sticky `<th>` children).
- DevTools/`getComputedStyle` shows `position: sticky` is present and correct,
  yet the assertion insists it isn't sticking.

## Related

- [[105-match-the-mobile-table-pattern-to-the-datas-purpose-not-a-sibling-tables-precedent]]
  — same family: sticky cells need an opaque themed background; this is the
  verification-side companion (measure the cell that sticks).
- [[100-vite-8-is-rolldown-verify-breakage-empirically-not-from-the-migration-guide]]
  — "verify empirically on the real surface" applied to a different layer.
- `frontend/src/styles/components/app-shell.css` — `.clubs-table-sticky-head th`.
