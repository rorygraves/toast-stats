---
id: '109'
category: lesson
tags: [frontend, css, tests, scope, dark-mode]
auto_load: true
date: 2026-05-25
issues: [668, 665]
---

# Lesson 109 — A render-time class guard scopes to the resting state; let that be the deferral boundary, but don't mistake it for a contrast audit

**Date:** 2026-05-25
**Issue:** #668 (epic #665 Sprint 2 — clubs-table chrome re-skin to redesign tokens)

## What happened

The acceptance criterion was "zero legacy `*-gray-*` classes left on the
table." I encoded it as a falsifiable DOM guard: render the real `ClubsTable`
(desktop + mobile), walk every rendered element, fail if any `class` matches
`/(?:^|[\s:])(text|bg|border|…)-gray-\d/`. RED before, GREEN after.

The table's column header (`ColumnHeader`) has a **filter popover** that is
still full of gray Tailwind — but it's `{isDropdownOpen && (…)}`, so at rest
it isn't in the DOM. The guard never sees it. That turned out to be exactly
the right scope line: the popover is a _filter control_ (Sprint 4 #670), the
resting header chrome is _this_ sprint (#668). I didn't have to write an
exclusion list or fight the guard — **the render boundary already drew the
scope boundary for me.** Same trick handled the mobile `ClubCard` list
(Sprint 5): one `.closest('.space-y-3')` skip, because the cards _do_ render.

## The two halves

1. **Use the render boundary as the scope boundary.** In a phased re-skin, a
   render-time "no legacy class" guard automatically covers only what ships in
   the state you render. Conditionally-rendered surfaces (closed popovers,
   modals, un-mounted tabs) fall outside it for free — so deferring them to a
   later sprint doesn't weaken the guard. When a deferred surface _does_ render
   (mobile cards), one `closest()` exclusion keyed to its container is cleaner
   than enumerating classes.

2. **Don't mistake that guard for a contrast audit.** A render-time class
   guard answers "did I remove the classes I shipped _in this state_?" — it
   does **not** answer "is every state contrast-safe?" The latter is precisely
   where conditional UI hides regressions (lesson 096: "conditional UI is where
   dark-mode regressions survive"), and it needs the CSS-rule-parsing audit
   that reads the rule, not the render. The two tools are complementary, not
   substitutes: class-guard for "what shipped here," rule-parser for "every
   state, including the popover I just deferred."

## How to apply

- Phased re-skin with a "no legacy utility" criterion? Write the guard as a
  render-time DOM scan and let conditionally-rendered, out-of-scope surfaces
  sit outside the render — that _is_ your scope boundary. Leave a code comment
  on the deferred surface naming the sprint that owns it, so a later reader
  doesn't think the sweep missed it.
- If the criterion is instead "X is contrast-safe / token-correct in every
  state," a render-time guard is the wrong instrument — reach for the
  CSS-parsing audit (lesson 093/096) which proves data-gated and closed
  surfaces too.
- Dark mode came for free here because the swap targeted semantic tokens that
  remap under `[data-theme='dark']` (`--ink`, `--surface*`, `--line`) and
  introduced no OS-keyed `dark:` utilities (R10, lesson 107). The class guard
  confirmed "no gray shipped"; the live Playwright AA smoke across all four
  {app}×{OS} quadrants confirmed "tokens are legible" — again, two tools.

## Related

- [[096-the-catch-all-darkmode-sweep-is-where-the-loyal-token-traps-hide]] —
  audit the rule, not the render, because conditional UI hides bugs; this is
  the dual (the render guard is _correct_ for "what shipped," wrong for "every
  state").
- [[092-redesign-sprints-replace-not-augment-the-thing-being-reskinned]] —
  re-skin = replace + shrink; this adds "let the render boundary scope it."
- [[107-tailwind-dark-variant-is-os-keyed-and-misfires-under-a-manual-theme-toggle]]
  — why the swap used `[data-theme]` tokens, not `dark:` utilities.
