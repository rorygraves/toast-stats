---
id: '114'
category: lesson
tags: [dark-mode, css, accessibility, frontend]
auto_load: true
date: 2026-05-26
issues: [678, 674]
---

# Lesson 114 — A raw non-remapping token that "passes" in a sibling component may be leaning on that sibling's background fill

**Date:** 2026-05-26
**Issue:** #678 (epic #674 Sprint 4 — DistrictSubnav route-nav primitive)
**Tags:** dark-mode, css, accessibility, react-router, brand-tokens

## What happened

The new `DistrictSubnav` copied its active-state styling from the app-shell
primary nav, which uses `--loyal-500` for the active link's text and a `--loyal-50`
**background fill** (`app-shell.css` `.app-shell-nav__link[aria-current='page']`).
The subnav kept the `--loyal-500` text/border but dropped the background fill (it
sits on a transparent strip over `.app-shell__main`'s `--surface`).

`--loyal-500` (#004165) has **no dark remap** (lessons 093/096). On the app-shell
nav that is invisible because the active link is painted on the light-in-both-themes
`--loyal-50` pill — the contrast lived in the fill, not the token. Strip the fill
and the same `--loyal-500` lands directly on the dark `--surface` (#111922) at
**~1.6:1** — failing AA for the active text, the active bottom-border, and the
focus ring. Fresh-context review caught it before push; the light-only axe tests
would have shipped it green (jest-axe can't compute contrast — lesson 075).

## The principle

**"This token passes in component X" is not evidence it is safe to reuse — X's
contrast may be coming from a background it pairs the token with, not from the
token itself.** A raw non-remapping brand token is only as safe as the surface
it's painted on. When you lift an active/hover pattern off a sibling, you inherit
the token but _not necessarily the background that made it legible_. Re-derive
the foreground/background pair for your actual surface, in both themes.

The fix is the standard one (R10, lesson 093): use the semantic `--link` token —
it equals `--loyal-500` in light (zero light-mode change) and remaps to a
dark-safe `#60a5d8`. Use it for any accent foreground that sits on a themed
surface without its own opaque fill.

## How to apply

- Copying an `[aria-current]` / `:hover` / active style from another component?
  List its declarations and ask which ones are load-bearing for contrast. A
  `background-color` on the active rule is a tell: the text token is probably not
  dark-safe on its own.
- Foreground accent on a transparent / `--surface`-backed element → reach for
  `--link` (or a `[data-theme='dark']` override, lesson 096), never raw
  `--loyal-500` / `--maroon-500`.
- Guard it with a contrast test that resolves the **real CSS token** through the
  `[data-theme='dark']` cascade against the **actual** background (see
  `DistrictSubnavDarkModeContrast.test.ts`) — not a light-only axe scan.

## Related

- [[093-a-token-that-doesnt-remap-in-dark-is-a-trap-for-every-consumer-that-isnt-link]]
  — the parent rule; this lesson is the "but it works over there" corollary.
- [[096-the-catch-all-dark-mode-sweep-is-where-the-brand-token-traps-hide]]
- [[075-axe-core-in-jsdom-doesnt-catch-contrast-pair-it-with-a-static-allowlist]]
  — why the light-only axe test missed it.
- `frontend/src/styles/components/district-subnav.css` — the fix in situ.
