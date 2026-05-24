---
id: '095'
category: lesson
tags: [dark-mode, css, accessibility]
auto_load: true
date: 2026-05-24
issues: [610, 574]
---

# Lesson 095 — A global dark-token bump must be sized for the LIGHTEST surface it lands on

**Date:** 2026-05-24
**Issue:** #610 (ClubDetailPage dark-mode sweep, epic #574 Track D)
**Tags:** dark-mode, tokens, contrast, R10, tailwind, verification, review

## What happened

The ClubDetailPage sweep had two defect families, both already catalogued by
the Track-D predecessors:

1. **The anniversary badge's `dark:` variants are inert.** The badge wears
   `bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100`.
   Under the project's **manual** `[data-theme='dark']` toggle the `dark:`
   utilities never fire (they only emit under `prefers-color-scheme`, Lesson
   73). So the base classes apply — and `bg-yellow-100` HAS a dark remap (it
   darkens) while `.text-yellow-900` does NOT (only 700/800 were in the dark
   text group). Dark Tailwind brown #713f12 on the darkened amber pill → ~1.2:1.
   The exact **Lesson 94 asymmetry**: bg remapped, text didn't. Fix: add
   `.text-yellow-900` / `.text-blue-900` to the existing 700/800 dark groups.
   Confirmed only the badge consumes those two utilities, so zero light-mode
   blast radius.

2. **A muted token mis-valued for dark.** The CSP "—" pip and the membership-
   chart axis labels colour via `var(--ink-4)`, which in dark was #5d6878 —
   3.13:1 on `--surface`, below AA for small informational text. Same root cause
   and same fix shape as the #609 muted-gray bump: lighten the token (dark-only,
   fg/stroke-only consumers → monotonic-safe).

## The bit worth keeping: size the bump for the lightest surface, not the one in front of you

My first `--ink-4` value (#7e8896) was tuned to clear AA on `--surface`
(#111922, 4.93:1) — the background of _the club page's_ `--ink-4` consumers.
The fresh-context reviewer caught that `--ink-4` is a **global** token, and one
off-page consumer (the nav "soon" badge) sits on the lighter `--surface-3`
(#1a2330), where #7e8896 is only **4.41:1 — still sub-AA**. Improving a global
token to "passes where I happened to look" leaves every consumer on a lighter
dark surface quietly failing.

The binding constraint for any global muted-token bump is the **lightest** dark
background it can ever land on (here `--surface-3`), not the page's own surface.
#828c9c clears AA on all three dark surfaces (5.18 / 4.89 / 4.67:1) while staying
perceptibly dimmer than `--ink-3`. I locked it with an audit assertion against
`--surface-3` so a future under-sized bump can't silently regress off-page
consumers. (This mirrors Lesson 94's "solve muted contrast against the lightest
dark background, not the darkest" — but at the **token** scope, where the set of
backgrounds is the whole app, not one page.)

## A second review catch: audit the rule the CASCADE renders, not the first match

`.bg-blue-50` is declared **twice** in `dark-mode.css` with different alphas.
The CSS-parsing audit's `darkRuleValue` returned the _first_ match; the browser
renders the _last_. Both happened to pass AA, so the verdict was right by luck —
but the test was asserting a background the page never shows. Fixed the helper to
return the cascade-winning (last) rule. **When a test re-implements CSS
resolution, it must model the cascade's last-wins rule, or it audits a fiction.**

## How to apply

- A `dark:` Tailwind class in this repo is a dead selector under the manual
  toggle (Lesson 73). The real lever is the base class + its `[data-theme=dark]`
  override. Audit the base/override pair, not the `dark:` the author wrote.
- Before lightening a **global** muted token, enumerate every dark surface it
  lands on and size the value to the **lightest** one. Add a test asserting that
  bound so the guarantee is falsifiable.
- A CSS-reading test must resolve the way the browser does: last-declared rule
  wins. First-match parsing silently audits the wrong declaration.

## Related

- [[094-darkmode-utilities-fail-by-asymmetry-text-and-bg-must-remap-together]] —
  the badge fix is a textbook instance; this lesson adds the token-scope
  "lightest surface" corollary and the cascade-last-wins audit fix.
- [[093-a-token-that-doesnt-remap-in-dark-is-a-trap-for-any-non-link-consumer]]
- [[073-opacity-variant-utilities-need-explicit-dark-mode-overrides]] — why
  `dark:` and opacity variants are inert under the manual toggle.
