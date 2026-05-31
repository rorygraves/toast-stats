---
id: '146'
category: lesson
tags: [router, react, frontend, architecture, error-handling]
auto_load: true
date: 2026-05-31
issues: [1011, 1010]
---

# Lesson 146 — A router `errorElement` renders OUTSIDE the app's context providers; it can only use router hooks + CSS tokens

**Date:** 2026-05-31
**Issue:** #1011 (epic #1010 Sprint 1 — branded root error boundary)
**PR:** [#1019](https://github.com/taverns-red/toast-stats/pull/1019)

## What happened

The app nests providers OUTSIDE the router:

```
QueryClientProvider → ProgramYearProvider → DarkModeProvider → RouterProvider
```

An `errorElement` on the root route renders **inside `RouterProvider` but
inside no other provider** — and, critically, it **replaces** the route's own
`element` (here `<AppShell />`) rather than rendering within it. So when the
boundary fires:

- ✅ Router hooks work: `useRouteError`, `isRouteErrorResponse`, `useNavigate`,
  `<Link>`.
- ❌ App-context hooks do **not**: `useQuery`/`useQueryClient`, `useProgramYear`,
  the dark-mode hook — they'd throw "no provider" _inside the error boundary_,
  turning a handled error into a blank crash.
- ❌ The chrome (`AppShell` top bar / footer) is gone, because the errorElement
  took its slot — which is actually the **right** behaviour: AppShell may be the
  thing that threw, so re-mounting it would re-throw.

The branded error page therefore has to be **self-sufficient**: it reads
`import.meta.env.DEV` directly (not a context flag), themes via CSS custom
properties (`--bg`/`--ink`/`--surface`/`--rt-stats`) that resolve from the
`[data-theme]` attribute already on `<html>` — not via the dark-mode _hook_ —
and ships its own Home/Back recovery instead of leaning on nav chrome.

## The transferable principle

**An error/fallback component that sits at a different point in the provider
tree than the normal app cannot assume the app's contexts exist.** Before a
boundary component calls any hook, ask "is its provider an ancestor of _this_
render position, or only of the normal tree it's replacing?" For a root
`errorElement` the answer for every non-router provider is **no**. Make the
boundary depend only on what is guaranteed at its position: router hooks, the
build-time env, and CSS variables (which cascade from `<html>` regardless of
React context). If a future feature genuinely needs a context (e.g. "retry with
the current program year"), the fix is to move the boundary _inside_ that
provider — or lift the provider above the router — not to call the hook and hope.

## How to apply

- Putting a boundary at the router root? Restrict it to `react-router` hooks +
  `import.meta.env` + CSS tokens. No `useQuery`, no app contexts.
- Theme a replaced-chrome surface with CSS custom properties keyed off the
  `[data-theme]` attribute, not the dark-mode hook — the attribute is on
  `<html>` and survives the missing provider; the hook does not.
- Want the boundary _inside_ chrome/contexts instead of replacing them? Put the
  `errorElement` on the **child** routes (renders in `AppShell`'s `<Outlet/>`),
  and accept that a throw in `AppShell` itself then has no handler. Root-level =
  standalone + provider-free; child-level = in-chrome + context-available. Pick
  per what can throw.

## Related

- [[124-validate-url-synced-range-state-at-the-page-not-the-picker]] — the page
  owns router-derived state; the boundary likewise owns only what its position
  guarantees.
- `frontend/src/components/ErrorPage.tsx`, `frontend/src/App.tsx`
  (`errorElement` on the root route). Sprint 2 (#1012) adds route-aware recovery
  — if it needs app data it must reckon with this provider boundary.
