---
id: '116'
category: lesson
tags: [dark-mode, css, frontend, responsive]
auto_load: true
date: 2026-05-26
issues: [682, 674]
---

# Lesson 116 — `bg-white` themes to a LIGHTER dark scale than its `.redesign-panel` neighbours

**Date:** 2026-05-26
**Issue:** #682 (epic #674 Sprint 8 — district page breakpoints + dark panels)

## What happened

Two district analytics panels (Education Levels, Achievement Highlights) "read
lighter than their neighbours" in dark mode. Neither was _unthemed_ in the
usual sense — `dark-mode.css` does have a `[data-theme='dark'] .bg-white`
override. The bug was subtler: there are **two parallel dark-surface token
systems** in this app, and `bg-white` routes to the lighter one.

- `.redesign-panel` (the neighbour primitive) → `var(--surface)` = **#111922**.
- `bg-white` → (via the dark-mode.css override) `var(--surface-card)` =
  **#1A1722** — a visibly lighter surface from the older `--surface-primary/
secondary/card` scale.

So a panel built from `bg-white … border-gray-200` themes correctly but lands
on a different, lighter surface than every panel built from `.redesign-panel`.
Side by side, it looks like a half-fixed dark mode. (Compounding it: the
`dark:bg-gray-800` the author also wrote is **inert** under the manual
`[data-theme='dark']` toggle — Lessons 73/95 — so it contributes nothing.)

## The principle

When a codebase has more than one surface-token scale, "is it themed?" is the
wrong question — ask **"does it land on the SAME surface token as its
neighbours?"** Converge new panels on the shared primitive (`.redesign-panel`
→ `--surface`) rather than on whatever a legacy utility (`bg-white`) happens to
map to. A panel can be fully dark-mode-aware and still look broken because it
sits one scale lighter than everything around it.

For a nested card that must stay distinct from its panel surface, use an
**arbitrary-value var** (`bg-[var(--surface-2)]`, `border border-[var(--line)]`)
— it re-resolves live under the manual toggle (Lesson 093), so it adapts in
both themes with zero `dark-mode.css` entries. Add the border: in LIGHT mode
`--surface-2` (#f9fafb) on `--surface` (#fff) is near-imperceptible by fill
alone; the border is what carries the nesting cue there.

## How to apply

- Auditing a "reads lighter/darker than neighbours" dark-mode report: compare
  the offending element's resolved `background-color` against a neighbour's,
  not against "is it dark at all." A live equality assertion (`panel.bg ===
neighbour.bg`) in a Playwright smoke catches this where a jsdom or single-
  element axe check can't.
- Prefer the shared panel class over re-deriving chrome from raw utilities.
  `.redesign-panel` carries surface + line + radius + shadow + ink as one
  token bundle; reaching past it to `bg-white border-gray-200` re-opens this
  trap and the Lesson-73 inert-`dark:` trap at once.

## Related

- [[092-fixed-background-elements-need-literal-colors-not-theme-tokens]] — the
  inverse: a fixed bg with theme-token text. Here it's a theme-token bg on the
  wrong scale.
- [[093-a-token-that-doesnt-remap-in-dark-is-a-trap-for-any-non-link-consumer]]
  — use the semantic/re-resolving token; `bg-[var(--surface-2)]` is that move.
- [[073-opacity-variant-utilities-need-explicit-dark-mode-overrides]] /
  [[095-darkmode-token-bumps-must-be-sized-for-the-lightest-surface]] — why the
  `dark:` utilities on these panels were inert dead weight.
