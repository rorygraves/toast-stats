---
id: '093'
category: principle
tags: [dark-mode, css, accessibility]
auto_load: true
date: 2026-05-23
issues: [608, 574]
---

# Lesson 093 — A token that doesn't remap in dark is a trap for every consumer that isn't `--link`

**Date:** 2026-05-23
**Issue:** #608 (Awards page dark-mode sweep, epic #574 Track D)
**Tags:** dark-mode, tokens, contrast, R10, css, verification

## What happened

The Awards dark-mode sweep looked like it would be a big audit. It wasn't:
both the `/awards` page CSS and the Awards Race section CSS were already
fully token-driven (no hardcoded rgba), and almost every token they use
(`--surface`, `--ink*`, `--link`, `--green-600`) has a `[data-theme='dark']`
remap. The whole defect surface was **two** declarations:

- `.awards-race-card__leader-link { color: var(--loyal-500) }`
- `.awards-race-card__progress-fill { background-color: var(--loyal-500) }`

`--loyal-500` (#004165) is a brand navy with **no dark remap**. On the dark
`--surface` (#111922) the link rendered at ~1.6:1 — effectively invisible.

## The non-obvious bit

`--link` is _defined as_ `var(--loyal-500)` in `:root` but is independently
remapped to `#60a5d8` under `[data-theme='dark']`. So the moment a value is a
link, the codebase already has the dark-safe token — `--link`. The bug was a
component reaching past the semantic token (`--link`) to the raw brand token
(`--loyal-500`) it happens to equal _in light mode only_. The two are
identical in light, which is exactly why the regression is invisible until you
toggle the theme.

**Principle:** a raw palette token with no dark remap is safe only for things
that are theme-invariant (a fixed logo, a decorative tint that's light enough
either way). The instant it colours text or a meaningful graphic, use the
_semantic_ token that remaps (`--link`, `--ink`, `--green-600`), even if it
resolves to the same hex in light. The fix here was a pure R10 win: swap to the
remapping token, **zero** light-mode change (same `#004165`), dark fixed — no
component-level `[data-theme]` override needed at all.

## How I found it without a browser

jest-axe can't compute contrast in jsdom (no layout). Instead the test reads
the _real_ CSS, resolves each awards foreground token through the parsed
`[data-theme='dark']` map, and runs `calculateContrastRatio` against the dark
surface. Falsifiable (old `--loyal-500` computes 1.6:1 → fails) and fast (pure
computation). Two parser footguns worth remembering for any "read the CSS in a
test" approach:

1. **A comment that merely mentions the selector poisons `indexOf`.** The file
   header had `[data-theme='dark']` in prose; `indexOf` matched it and parsed
   the wrong block. Anchor the selector match to a real rule (`^\s*<sel>\s*{`).
2. **Prose braces close blocks.** A comment containing `--green-{500,600}` has
   a literal `}` that a naive `indexOf('}')` treats as the block end, silently
   truncating the token map. Strip `/* … */` before scanning.

## How to apply

- Grep new dark-mode work for raw palette tokens used as `color` /
  `background-color`: `grep -nE 'color: var\(--(loyal|maroon|gray)-[0-9]'`.
  Each is a candidate trap — confirm it either remaps in dark or is provably
  theme-invariant.
- Prefer the semantic remapping token over the raw one even when they're equal
  in light. "Equal in light" is the camouflage, not an excuse.
- When a test parses CSS/source, strip comments first and anchor block matches
  to rule starts — a tokenizer that trusts `indexOf` will lie to you.

## Related

- [[092-reskin-the-tool-already-in-the-file-not-the-one-the-ticket-named]] —
  R10: let theme-reactivity pick the primitive; CSS-addressable colours cost
  one block, not N branches.
- [[081-phase-gated-deferral-tests-move-with-the-spec]] — fidelity/spec work
  where the source of truth is the design, not the author's instinct.
