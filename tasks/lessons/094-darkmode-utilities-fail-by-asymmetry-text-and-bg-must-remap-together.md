---
id: '094'
category: principle
tags: [dark-mode, css, accessibility]
auto_load: true
date: 2026-05-24
issues: [609, 574]
---

# Lesson 094 — In a Tailwind-utility dark theme, text and background must remap _together_; the asymmetry is the bug

**Date:** 2026-05-24
**Issue:** #609 (Region pages dark-mode sweep, epic #574 Track D)
**Tags:** dark-mode, tokens, contrast, R10, tailwind, verification

## What happened

Unlike the Awards sweep (#608), whose CSS was semantic-token-driven, the Region
pages are styled with **Tailwind utility classes** (`text-gray-500`,
`bg-purple-200`, `bg-tm-happy-yellow text-gray-900`) that `dark-mode.css`
overrides at `[data-theme='dark']` scope. Three of the four defects were the
same shape: a foreground and its background remap **independently**, and one
half didn't move:

1. **President's chip** — `bg-tm-happy-yellow text-gray-900`. The bg has a
   dedicated dark override (stays light gold). But `.text-gray-900` is globally
   remapped _light_ in dark (`--text-heading` #F0ECF5). So light text landed on
   light gold → 1.70:1. The chip's own CSS comment said "dark text stays
   readable" — the author's intent was silently overridden by a _later, global_
   rule. Fix: a compound `[data-theme='dark'] .bg-tm-happy-yellow.text-gray-900`
   (more specific) restores dark text → 8.94:1.
2. **Smedley chip** — `bg-purple-200 text-purple-900`. The text remapped light
   (#E9D5FF) but `bg-purple-200` had **no** dark override (only `.bg-purple-100`
   did) → light-on-light, 1.00:1, invisible. Fix: add the `.bg-purple-200`
   override mirroring `.bg-purple-100`.
3. **Muted text** — `.text-gray-600` maps to `var(--text-muted)` (#9B95A5) but
   `.text-gray-500`/`.text-gray-400` were hardcoded `#6B6575` → 3.16:1 on the
   surface, **2.62:1** on the lighter `bg-gray-800` cards. The _inconsistency
   between sibling utilities_ was the tell. Fix: map 500/400 to `--text-muted`
   too.

(The fourth, the page eyebrow, was the #608-style trap: raw `--maroon-500` with
no dark remap → scoped override to the dark maroon #e8879a, _not_ a global remap
of a token with 10 consumers — R8.)

## The principles

- **A dark theme built on utility overrides fails by asymmetry.** When fg and bg
  are independent classes, audit them as a _pair_ — a remap on one side without
  the other is worse than no remap at all (it produces same-on-same, the
  invisible 1.00:1 case). Grep every `bg-*` chip class together with the text
  class it's actually paired with in the JSX.
- **A global utility override can silently defeat a component's local intent.**
  `.text-gray-900 → light` is correct for body text on dark surfaces but wrong
  for the one chip that wants dark text on a light pill. The cure is a
  _more-specific compound_ rule, not weakening the global one.
- **Sibling utilities that should track each other but don't are a smell.**
  `gray-600` → token, `gray-500/400` → hardcoded hex: that divergence _is_ the
  bug. Fix by making them consistent, not by inventing a new value.

## The binding constraint is the lightest dark background

`text-gray-500` had to clear AA on **both** the page surface (#111922) and the
lighter `bg-gray-800` region cards (#1f2937). A value tuned only to the surface
(#878291 → 4.75:1) still failed on the cards (3.94:1). Always solve muted-text
contrast against the _lightest_ dark background the class lands on, not the
darkest — `--text-muted` (#9B95A5) clears both (6.10 / 5.06:1).

## Verification: the unit audit proves the CSS; live data may not exercise it

The CSS-parsing audit (modelled on #608, extended to composite translucent tier
bgs over the surface) proved all four fixes. But on prod only **two** districts
had achieved a Distinguished District tier (one President's in region 09, one
Distinguished in region 10) — region 04's table rendered **zero** tier chips.
The President's chip live-verified at exactly the predicted 8.94:1 (dark text on
gold), but **Smedley has no live instance at all** right now. The unit audit is
the only proof for Smedley; the deployed `.bg-purple-200` rule is confirmed
present by the same deploy that fixed President's. Lesson: a data-conditional UI
element may be absent from live verification entirely — lean on the falsifiable
unit audit, and say so in the evidence rather than claiming a live check you
couldn't run.

## Blast radius was global, and that was correct

Fix #3 (muted grays) is an **app-wide** dark-mode change. Required for the
Region pages to pass axe (criterion 1) — there is no clean page-scoped way to
fix a global utility (R10). It's dark-only and monotonic (lighter muted text
strictly improves contrast against every dark background it sits on). A
fresh-context reviewer verified no `gray-500/400` text sits on a _light_
background in dark mode, so nothing regresses. Don't shrink a fix to match the
ticket's title when the cleanest level is global and provably safe.

## Related

- [[093-a-token-that-doesnt-remap-in-dark-is-a-trap-for-any-non-link-consumer]]
  — the eyebrow here is the same raw-palette-token trap; #609 adds the
  utility-pair-asymmetry and global-override-defeats-local-intent variants.
- [[092-reskin-the-tool-already-in-the-file-not-the-one-the-ticket-named]] — R10
  picks the primitive; CSS-addressable colours cost one block.
