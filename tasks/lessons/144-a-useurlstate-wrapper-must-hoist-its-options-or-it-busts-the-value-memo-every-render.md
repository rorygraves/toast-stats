---
id: '144'
category: lesson
tags: [react, frontend, hooks, router, url-state, performance]
auto_load: true
date: 2026-05-30
issues: [980, 969]
---

# Lesson 144 — A `useUrlState` wrapper must hoist its parse/serialize options, or it silently busts the value-memo (and churns the setter) every render

**Date:** 2026-05-30
**Issue:** #980 (epic #969 Sprint 4 — deep-link disclosure/expand state)

## What happened

`useUrlState` memoizes the parsed value and `useCallback`s the setter, both keyed
on `[rawValue, defaultValue, options]` — so that a custom `parse` returning a
fresh array/object yields a **stable reference** across renders when the param is
unchanged (that stability guard was itself added to stop a 117-row re-sort on an
unrelated keystroke). The new boolean/set wrappers first did the natural thing:

```ts
export function useUrlStringSet(key) {
  const [value, setValue] = useUrlState(key, [], {
    // ❌ fresh [] AND fresh
    parse: raw => dedupe(raw.split(',')), //    options object
    serialize: vals => dedupe(vals).sort().join(','), //    EVERY render
  })
  // …then a SECOND useMemo to re-stabilize what the busted memo no longer did
}
```

Every render passed a **new `options` object and a new `[]` default**, so
`useUrlState`'s `useMemo`/`useCallback` deps changed every render: the value memo
recomputed (fresh array each time) and the setter identity churned. The wrapper
then bolted a second `useMemo` on top to re-stabilize the reference — papering
over the memo it had just defeated one layer down.

## The transferable principle

**When you wrap a hook that memoizes on an `options`/`config` argument, the
wrapper must pass a reference-stable argument — hoist it to module scope (or
`useMemo` it) — or every consumer of that hook's memoization silently gets the
unmemoized path.** A fresh object/array literal in a hook call is invisible at
the call site but is a dependency-array bust one level down. The fix is to move
the pure pieces out of render:

```ts
const EMPTY: string[] = []
const STRING_SET_OPTIONS = {
  parse: (raw: string) => dedupe(raw.split(',')),
  serialize: (vals: string[]) => dedupe(vals).sort().join(','),
}
export function useUrlStringSet(key: string) {
  return useUrlState<string[]>(key, EMPTY, STRING_SET_OPTIONS) // stable → memo holds
}
```

With stable options + default, the inner memo does its job and the extra wrapper
memo disappears entirely. Smell test: **if you add a `useMemo` to re-stabilize a
value a hook you're calling already promises to stabilize, the bug is an unstable
argument you're feeding that hook, not a missing memo in your wrapper.**

## Corollary — the router-free opt-in split

A second, separable decision in the same sprint: a leaf component (criteria
disclosure, `MobileDisclosure`, `ChartSparklineExpand`) that _optionally_
deep-links via a `urlParam?`/`urlId?` prop must **split its state source into two
sub-components** — a `UrlSynced*` that calls the URL hook and a `Local*` that
calls `useState` — and pick between them in the parent's `return`. You cannot
write `urlParam ? useUrlBoolean(...) : useState(...)` (conditional hook), and an
_unconditional_ `useUrlBoolean` would call `useSearchParams` and throw for every
consumer not under a router. The split keeps the no-prop path genuinely
router-free (the #473 provider-free-unit-test convention stays intact) while the
opt-in path syncs. This is leaf-level UI state with no API-data derivation, so it
does **not** owe R3 page-ownership the way program-year/filter state does — but
when several children must coordinate one param (a collapsed-category _set_, a
region set + its disclosure), own it at the page and pass it down.

## How to apply

- Wrapping `useUrlState` (or any hook with an `options` dep): module-scope the
  `parse`/`serialize`/`default`. Never pass an object/array literal inline.
- After a /simplify pass that "adds a memo to stabilize X," check whether X was
  already supposed to be stable — fix the upstream argument instead.
- Opt-in URL sync on a reusable leaf → split `UrlSynced*`/`Local*` sub-components;
  don't make the router a hard dependency of every consumer.

## Related

- [[070-setSearchParams-prev-races-in-batched-updates]] — the prev-callback write
  form these wrappers inherit; preserves unrelated params (tripwire-guarded).
- [[129-render-phase-prop-sync-must-compare-by-value-when-the-parent-rebuilds-the-prop]]
  — same family: a fresh reference each render silently breaks a downstream
  identity check / memo.
- `frontend/src/hooks/useUrlState.ts` (the memo keyed on `options`),
  `useUrlBoolean.ts` / `useUrlStringSet.ts` (the module-scoped options).
