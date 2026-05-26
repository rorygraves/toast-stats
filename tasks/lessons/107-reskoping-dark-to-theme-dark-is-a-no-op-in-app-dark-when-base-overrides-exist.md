---
id: '107'
category: lesson
tags: [dark-mode, css, tailwind, accessibility, verification, frontend]
auto_load: true
date: 2026-05-26
issues: [715, 710, 564]
---

# Lesson 107 — Re-scoping `dark:` → `theme-dark:` is a no-op in app-dark when the base class already has a `dark-mode.css` override

**Date:** 2026-05-26
**Issue:** #715 (migrate remaining components off raw `dark:` — epic #756 Sprint 3)

## What happened

#710 introduced a `theme-dark:` custom variant (keyed off the manual
`[data-theme='dark']` toggle, not `@media(prefers-color-scheme:dark)`) and
converted the two region components. #715 swept the remaining 10 components +
RegionsPage with a mechanical `dark:` → `theme-dark:` substitution.

The reflex worry was Track D all over again (lessons 094/095/096): would
flipping the variant flip app-DARK rendering and reopen a contrast audit? It did
**not** — and the reason is worth keeping.

## Why the sweep was safe by construction

Every converted pair's **light-side base class** (`text-gray-500`, `bg-white`,
`bg-yellow-100`, `text-yellow-900`, …) already carries a `[data-theme='dark']`
override in `dark-mode.css` (most are `!important`; even without, `[attr]
.class` = (0,2,0) beats the `theme-dark:` utility's `&:where(...)` = (0,1,0)).
So in **app-dark mode the base override still wins the cascade** — the
`theme-dark:` utility is dominated and inert. App-dark rendering is therefore
**byte-identical** before and after the migration.

The raw `dark:` utility was only ever _visibly_ active in one quadrant:
**app-light + OS-dark**, where it fired off the OS media query and painted light
text on the light surface (#710, Amy's Safari bug). Converting it to
`theme-dark:` makes that quadrant go inert → clean light base. So the migration's
_only_ behavioural change is removing the misfire.

**The takeaway:** a raw-`dark:`→`theme-dark:` re-scope is fundamentally different
from a Track-D dark-mode _fix_. Track D edited `dark-mode.css` to change what
app-dark renders; #715 changed nothing app-dark renders. Verify it as **"no
app-dark regression + bug-quadrant now legible,"** not as a contrast redesign.
If a converted element has _no_ base override, that's the exception to check —
there the `theme-dark:` utility becomes the only app-dark styling and you must
confirm it's AA. (#715 had none; all base classes were already covered.)

## The verification selector that maps exactly to the diff

`document.querySelectorAll('[class*="theme-dark"]')` selects **precisely** the
elements this migration touched, on whatever page is loaded — the class
attribute literally contains the `theme-dark:` token. A Playwright smoke that
sweeps those elements for own-text contrast across all four {app theme} × {OS
pref} quadrants, in **both** engines (Chromium `smoke` + WebKit, per #710), is a
faithful, low-maintenance guard: it follows the diff instead of hard-coding
per-component selectors. Run it before the unit guard goes in so RED is real.

## How to apply

- Before treating a `dark:`→`theme-dark:` sweep as risky, check whether the
  paired base class has a `dark-mode.css` override. If it does, app-dark is
  unchanged and the only thing to verify is the OS-misfire quadrant
  (app-light/OS-dark) — in WebKit especially (#710).
- Use `[class*="theme-dark"]` as the live-verification selector; it tracks the
  migration set automatically.
- The repo-wide reintroduction guard must flag every prefers-scheme form, not
  just bare `dark:` — `group-dark:` / `peer-dark:` compile the same way. Match
  `(?<!theme-)\bdark:`, not `(?<![\w-])dark:`.

## Related

- [[094-darkmode-utilities-fail-by-asymmetry-text-and-bg-must-remap-together]] —
  Track D _changed_ app-dark rendering; #715 deliberately does not. Same file,
  opposite blast radius.
- [[095-darkmode-token-bumps-must-be-sized-for-the-lightest-surface]] — the
  ClubAnniversaryBadge base overrides this lesson relies on were added by #610.
- [[073-opacity-variant-utilities-need-explicit-dark-mode-overrides]] — why raw
  `dark:` is inert under the manual toggle in the first place.
