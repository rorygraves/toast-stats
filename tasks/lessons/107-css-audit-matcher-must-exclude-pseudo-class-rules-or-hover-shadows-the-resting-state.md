---
id: '107'
category: lesson
tags: [dark-mode, css, accessibility, tests, vitest]
auto_load: true
date: 2026-05-25
issues: [700, 701]
---

# Lesson 107 — A CSS-parsing audit's selector matcher must exclude pseudo-class rules, or `:hover`/`:focus` shadows the resting state

**Date:** 2026-05-25
**Issue:** #700 (epic #701 Sprint 1 — header theme-toggle invisible in light mode)

## What happened

The fix was textbook: the toggle icon hardcoded `color: rgba(255,255,255,0.8)`
inline (invisible on the light `--surface`); the cure was to drive it from the
theme-aware `--ink-3` token via `.app-shell-theme-toggle`, exactly the R10 /
lesson-093 pattern but mirrored into **light** mode (a near-white literal is the
light-mode twin of the dark-mode "raw token with no remap" trap).

The bug was in the _audit_, not the fix. I reused the `declFor` helper from the
`AwardsDarkModeContrast` harness, which finds the cascade-last-winning rule whose
selector matches `.app-shell-theme-toggle(?![\w-])`. That lookahead excludes
`\w` and `-` so `__status` doesn't match `__status--won` — but it does **not**
exclude `:`. So the matcher also matched `.app-shell-theme-toggle:hover { color:
var(--ink) }`, and "last wins" returned the _hover_ colour (`--ink`, ~18:1), not
the resting `--ink-3` the bug was about. The fresh-context reviewer reverted the
base rule to `#ffffff` (re-introducing the exact bug) and **all four contrast
assertions still passed**. The audit was hollow: it could never fail for the
defect it claimed to guard.

## The principle

When a test parses CSS to audit a _resting-state_ property, the selector matcher
must match the **base rule only** — exclude pseudo-classes (`:hover`, `:focus`,
`:focus-visible`, `:active`) and pseudo-elements. A `:hover` rule that sets the
same property will shadow the base under any "last-declared wins" resolution
(lesson 095) and silently lift the audited value to the interaction colour. The
one-character fix here was widening the negative lookahead to `(?![\w-:])`.

This is the same family as lesson 095 ("audit the rule the cascade renders, not
the first match") — but the failure mode is the inverse: cascade-correct
resolution across _too broad_ a selector set, where a pseudo-state rule is a
member it shouldn't be.

## How to apply

- A CSS-parsing audit of a resting property must scope its selector match to the
  base rule. Add `:` to the boundary lookahead (`(?![\w-:])`) so pseudo-class /
  pseudo-element rules can't be picked up.
- **Always prove a new contrast/colour audit is falsifiable**: temporarily set
  the audited declaration to the known-bad value (white here) and confirm the
  test goes red, _then_ restore. A green audit that stays green when you
  re-introduce the bug is worse than no audit — it's a false guarantee. (The
  component-level test in `ThemeToggle.test.tsx` _was_ falsifiable, which is why
  the TDD red was real; the CSS audit was the hollow one.)
- Light-mode invisibility is a real bug class, not just dark-mode's. A hardcoded
  near-white (or near-black) literal is invisible in exactly one theme — audit
  resting colour against the surface in **both** `:root` and `[data-theme=dark]`.

## Related

- [[095-darkmode-token-bumps-must-be-sized-for-the-lightest-surface]] — the
  cascade-last-wins audit fidelity rule; this is its over-broad-selector twin.
- [[093-a-token-that-doesnt-remap-in-dark-is-a-trap-for-any-non-link-consumer]] —
  the dark-mode token trap this bug mirrors into light mode.
- `frontend/src/__tests__/accessibility/AwardsDarkModeContrast.test.ts` — the
  `declFor` harness reused (and the matcher pattern that needed the `:` guard).
