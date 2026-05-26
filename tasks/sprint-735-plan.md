# Sprint 1 (#735) — Primary nav overflows horizontally at 375px

## Problem

At 375px the top bar (`.app-shell-nav` 6 links + brand + `.app-shell-tools`) does
not collapse → ~314px of document horizontal scroll on every page. App-shell
chrome bug, not page content.

## Root cause

`.app-shell-top-bar` is a fixed 3-column flex (brand | nav flex:1 | tools) with
no responsive collapse. Six text links cannot fit alongside brand + tools at
375px, so the row's intrinsic min-width exceeds the viewport.

## Fix — disclosure (hamburger) menu < 768px

- Add a hamburger toggle `<button class="app-shell-nav-toggle">` to
  `AppShellTopBar`: 44×44 touch target, `aria-label="Menu"`,
  `aria-expanded`, `aria-controls="app-shell-primary-nav"`. Hidden ≥768px (CSS).
- `<nav id="app-shell-primary-nav">` keeps all links in the DOM. Desktop: inline
  row (unchanged). Mobile: absolute dropdown panel below the 56px bar, shown only
  when `data-open="true"`; vertical list, ≥44px rows, ≥8px spacing.
- Behavior (React state `navOpen`): toggle flips it; clicking a link, pressing
  Escape, clicking outside, or a route change all close it.
- Tools cluster (help / theme toggle / avatar) stays visible — small enough.

## Why not card-collapse-style or horizontal-scroll nav

Primary site nav is "pick a destination", not a comparison table (lesson 105) —
the disclosure pattern is the convention and keeps every destination reachable
with one tap. A scrolling nav strip on a 56px bar is cramped and still competes
with brand+tools for width.

## Test strategy (lesson 066: jsdom can't see layout)

- jsdom unit tests: toggle present + `aria-expanded` toggles; Escape / outside /
  route-change close; links always queryable (existing role tests stay green).
- Real overflow proof on the PR preview channel via Playwright (Chromium + WebKit)
  asserting `documentElement.scrollWidth <= clientWidth` at 375px on `/`,
  `/regions`, `/district/:id/clubs` — the only way to catch the actual bug.

## Files

- `frontend/src/components/AppShell/AppShellTopBar.tsx`
- `frontend/src/styles/components/app-shell.css`
- `frontend/src/components/AppShell/__tests__/AppShellTopBar.mobile-nav.test.tsx` (new)

## DoD: Full. Lesson candidate likely (responsive chrome disclosure pattern).
