---
id: '107'
category: principle
tags: [dark-mode, css, accessibility, frontend, tailwind]
auto_load: true
date: 2026-05-25
issues: [710, 683]
---

# Lesson 107 — Tailwind's `dark:` is OS-keyed; under a manual theme toggle it MISFIRES in the OS-dark + app-light quadrant

**Date:** 2026-05-25
**Issue:** #710 (epic #683 Sprint 8 — Amy: /regions leaderboard near-invisible in Safari)

## What happened

The `/regions` leaderboard rows were near-invisible — light-grey text on a
white table — but only for some users, and #685's Chromium-at-rest axe scan
had passed it clean. Not a Safari render bug, not state-based dimming, not a
regression. The cause was a **theme-mechanism mismatch**:

- Tailwind's `dark:` variant (with no config) compiles to
  `@media (prefers-color-scheme: dark)` — keyed off the **OS**.
- This app's dark mode is a **manual `[data-theme='dark']` toggle**
  (DarkModeContext), and `getInitialTheme()` honors a stored `theme='light'`
  even when the OS prefers dark.

So in the quadrant **{app shows light, OS prefers dark}**, the white surface
renders (data-theme=light) while every `dark:` utility fires anyway
(prefers-color-scheme matches the OS) → `dark:text-gray-200` (#e5e7eb),
`dark:text-gray-50` (#f9fafb), `dark:text-blue-200` chips, all painted on
white. The hovered row got `dark:hover:bg-gray-800` (a dark bg) so its light
text was legible — "only the emphasized row is readable," exactly the report.

Lesson 073 noted `dark:` is **inert** under the manual toggle (won't fire when
you _want_ it in app-dark). This is the **dual**: it _fires when you don't want
it_. Both halves are the same root mismatch.

## The principle

**Dark mode has TWO independent inputs — the app's theme and the OS preference
— so it has FOUR quadrants. A `dark:`-keyed style and a `[data-theme]`-keyed
surface can disagree.** When the dark-mode mechanism is a manual `[data-theme]`
toggle:

- A raw Tailwind `dark:` utility is OS-keyed and will misfire in
  {app-light, OS-dark} (light text on light) and {app-dark, OS-light} (the
  inverse, where it's just inert and the surface stays light if no override).
- **Verify every dark-mode surface in all four {app theme} × {OS preference}
  quadrants**, not just app-dark with a matching OS. An at-rest scan run only
  with `prefers-color-scheme: light` (the default) structurally cannot see the
  {app-light, OS-dark} bug — that's the #685 blind spot.

## The fix shape

Scope dark styling to the toggle, not the OS. A Tailwind v4 custom variant
does it without touching the global `dark:`:

```css
@custom-variant theme-dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

Then `theme-dark:bg-gray-800` keys off `[data-theme='dark']`. `:where()` keeps
specificity at one class so it composes like a normal utility. (Placing
`@custom-variant` AFTER all `@import`s matters — imports must come first.) The
existing `[data-theme='dark'] !important` text overrides still win for text;
the variant's real work is on bg/border classes that had no override. The
ideal root-cause fix is redefining the GLOBAL `dark` variant the same way, but
that's app-wide blast radius against the Track-D override layer (#715) — an
ADR-scoped follow-up, not a bug-fix sprint.

## How to verify (falsifiable, both engines)

A Playwright smoke that emulates `colorScheme` × seeds `localStorage.theme`
across all four quadrants and asserts each cell clears WCAG AA against its
rendered background — run in a **`webkit` project too**, since #685 proved
Chromium-at-rest misses Safari-visible contrast. A static vitest guard (no raw
`dark:` in the converted components) is the cheap CI recurrence guard;
contrast itself can't be computed in JSDOM (lesson 075).

## Related

- [[073-opacity-variant-utilities-need-explicit-dark-mode-overrides]] — `dark:`
  is inert under the manual toggle (the "won't fire" half); this is the
  "fires when unwanted" dual.
- [[075-axe-core-jsdom-no-contrast-pair-with-static-guard]] — why the guard is
  static + a real-browser smoke, not JSDOM axe.
- [[094-darkmode-utilities-fail-by-asymmetry-text-and-bg-must-remap-together]]
  — surface and text must move together; here they're keyed off different
  signals entirely.
