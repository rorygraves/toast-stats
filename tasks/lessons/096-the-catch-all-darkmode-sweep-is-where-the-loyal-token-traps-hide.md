# Lesson 096 — The catch-all dark-mode sweep is where the brand-token traps hide

**Date:** 2026-05-24
**Issue:** #611 (Methodology / History / Landing dark-mode sweep — epic #574 Track D, final sprint)
**Tags:** dark-mode, tokens, contrast, R10, R8, css, verification

## What happened

Track D swept dark mode page-by-page: Awards (#608), Regions (#609), Club
(#610), and finally the catch-all — Methodology, History, and the Landing page
(#611). By the last sprint the pattern was fully known, and #611 confirmed it
one more time: **every** real defect was the same shape as #608/#609 — a raw
palette token used as foreground that has no `[data-theme='dark']` remap.

Three traps, all `--loyal-*` / `--maroon-*` numerics, all invisible until you
toggle the theme:

1. `.placeholder-page__eyebrow` → `--maroon-500` (#7b1828), 1.69:1 on the dark
   surface. Shared by the Methodology AND History headers — one fix, two pages.
2. `.history-page-year-chip--current` text → `--loyal-500` (#004165) on the
   dark `--loyal-50` pill (#112432): navy-on-navy, 1.47:1.
3. `.districts-page-header__diff-strip` text/strong/time → `--loyal-600/-700/
-500` (none remap) on the same dark pill: 1.01–1.47:1.

## Why the Landing page still had a trap after a year of dark mode

The diff-strip ("what changed since last visit") only renders for a returning
visitor whose snapshot date changed — a data-conditional element. Nobody had
toggled dark mode while it was showing. **Conditional UI is exactly where
dark-mode regressions survive** (cf. Lesson 094's Smedley chip, absent from live
data entirely). The CSS-parsing audit catches these regardless of whether the
element is on screen, because it reads the rule, not the render.

## The fix is the same primitive every time

For text, prefer `var(--link)` (#60a5d8 in dark) — the dark-safe blue the theme
already remaps — over the raw `--loyal-N` it happens to equal in light. Scoped
to `[data-theme='dark']`, so light mode is byte-identical (Lesson 093). For the
maroon eyebrow, a scoped lightened `#e8879a` (the value the dark theme already
uses for `--tm-true-maroon`), NOT a global `--maroon-500` remap — that token has
10+ consumers (R8). All three fixes are `[data-theme='dark']`-scoped overrides:
zero light-mode change by construction, so "no light regression" is free.

## How to apply

- **The grep that ends a dark-mode sweep:** `grep -nE 'color: var\(--(loyal|
maroon|gray)-[0-9]'` in the page's CSS. Each hit is a candidate trap — confirm
  it remaps in dark or is provably theme-invariant. If it's a foreground color,
  it almost certainly needs the semantic token or a scoped override.
- **Audit the rule, not the render.** A CSS-parsing contrast test (the
  #608→#611 harness: resolve each token through the dark map, composite
  translucency, assert ≥4.5:1) proves conditional/data-gated elements that a
  live click-through would never surface. It's also falsifiable and fast.
- **A shared class is a two-for-one.** `.placeholder-page__eyebrow` fixed both
  static pages at once — inventory which pages share a class before assuming
  per-page work (R7 for CSS).

## Track D is closed

Four sweeps, one recurring root cause (raw brand tokens with no dark remap), one
recurring fix (scoped override / semantic-token swap). The CSS-parsing audit is
now the standing regression guard for all of them.

## Related

- [[093-a-token-that-doesnt-remap-in-dark-is-a-trap-for-any-non-link-consumer]]
  — the original `--loyal-500`/`--link` trap; #611 is its fourth instance.
- [[094-darkmode-utilities-fail-by-asymmetry-text-and-bg-must-remap-together]]
  — utility-pair asymmetry + the conditional-UI-hides-the-bug observation.
- [[090-vitest-project-split-needs-a-partition-guard]] — why the audit lives in
  `__tests__/accessibility/` (integration project).
