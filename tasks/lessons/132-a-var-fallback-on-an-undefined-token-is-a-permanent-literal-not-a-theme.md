---
id: '132'
category: lesson
tags: [css, dark-mode, frontend, tailwind]
auto_load: true
date: 2026-05-28
issues: [863, 865]
---

# Lesson 132 — A `var(--undefined-token, #hex)` fallback is a permanent literal, not a theme

**Date:** 2026-05-28
**Issue:** #863 (epic #865 Sprint 3 — mobile districts cap + disclosure)

## What happened

The new mobile "Show all" disclosure button was styled with what looked like
themed tokens:

```css
border: 1px solid var(--border, #d1d5db);
background: var(--surface, #ffffff);
```

`--surface` is a real token in this codebase (`styles/tokens/redesign.css`,
remaps light→dark), so it themed correctly. But **`--border` is not a defined
token** — the codebase uses `--line`. CSS resolves `var(--border, #d1d5db)` to
the fallback `#d1d5db` _every time_, in both themes. The button looked fine in
light mode (the fallback happens to match the light value) and silently kept a
light-grey border in dark mode — the exact dark-mode trap Lessons 092/116 warn
about, but arriving through a different door: not a hardcoded literal, a
fallback on a token that doesn't exist.

A fresh-context review caught it; a glance at the diff did not, because
`var(--border, …)` _reads_ as themed.

## The principle

A `var()` fallback only fires when the custom property is **undefined**. So
`var(--typo, #hex)` and `var(--realtoken, #hex)` are visually indistinguishable
in the source but behave oppositely: the first is a hardcoded literal wearing a
token's clothes; the second is genuinely themed with a defensive fallback. The
fallback _masks_ the missing token — there's no console warning, no build
error, nothing red. The light-mode render looks correct, so it passes the eye
test and ships.

## How to apply

- Before trusting any `var(--x, fallback)`, confirm `--x` actually exists —
  `grep -rn '\-\-x:' frontend/src/styles`. If it's not defined, you wrote a
  literal, not a token.
- Know the real names here: surfaces `--surface` / `--surface-2` / `--surface-3`,
  borders `--line` / `--line-2`, text `--ink` / `--ink-2` / `--ink-3` / `--ink-4`
  (`styles/tokens/redesign.css`). `--border` and `--text` are NOT tokens.
- Treat fallbacks as belt-and-suspenders for a token you've verified exists, not
  as the value itself. A fallback that is doing the actual work is a smell.
- Dark mode is where this bites — verify any new themed surface in dark, since a
  bad fallback renders fine in light and only the dark theme exposes it
  ([[116-bg-white-routes-to-a-lighter-dark-scale-than-redesign-panel-neighbours]]).

## Related

- [[116-bg-white-routes-to-a-lighter-dark-scale-than-redesign-panel-neighbours]] — sibling
  trap: a literal (`bg-white`) that routes to the wrong dark scale. This one is
  a literal hiding _inside_ a `var()` fallback.
- [[092-fixed-background-elements-need-literal-colors-not-theme-tokens]] — the
  inverse: where a literal is correct. Knowing which is which requires knowing
  the token actually resolves.
- [[112-the-verification-sprint-contrast-guard-earns-its-keep-on-the-marginals]] —
  the same review pass also caught the amber-on-white label contrast on this
  button; fresh-context review earns its keep on exactly these eye-test misses.
