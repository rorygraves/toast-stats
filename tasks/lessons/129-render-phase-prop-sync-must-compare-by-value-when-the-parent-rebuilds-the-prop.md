---
id: '129'
category: lesson
tags: [react, frontend, hooks, tests, verification]
auto_load: true
date: 2026-05-27
issues: [816, 818]
---

# Lesson 129 — A render-phase prop-sync that compares by REFERENCE clobbers local edits when the parent rebuilds the prop each render

**Date:** 2026-05-27
**Issue:** #816 (epic #818 Sprint 3 — dedicated Filters drawer) — surfaced in
fresh-context review of PR #830.

## What happened

`NumericFilter` mirrors a `[min, max]` prop into local input state and uses the
repo's render-phase sync to pull in **external** resets (e.g. "Clear all")
without `setState`-in-effect (#340):

```tsx
const [trackedValue, setTrackedValue] = useState(value)
if (value !== trackedValue) {
  // ❌ reference compare
  setTrackedValue(value)
  setLocalMin(value[0]?.toString() || '')
  setLocalMax(value[1]?.toString() || '')
}
```

That reference compare was safe under the **old** caller (`ColumnHeader`), which
held the filter in its own `useState` and passed a **stable** array reference
between renders. #816 moved the control into `FiltersPanel`, which rebuilds the
tuple **fresh on every render**:

```tsx
<NumericFilter value={[v[0] ?? null, v[1] ?? null]} … />
```

Now `value !== trackedValue` is true on _every_ parent re-render — including ones
triggered by an unrelated control in the same panel. So the sync re-fires and
overwrites the user's in-progress min/max with the last committed value. The
visible failure: type an invalid range (Min 9 > Max 5 — `NumericFilter`
correctly does **not** commit), then toggle any other field; the panel
re-renders, a new equal-valued array arrives, and the "9" you were typing
vanishes.

The unit tests passed because they only ever rendered the component **once** per
filter value; a single render never re-fires the sync. The bug needs a _second_
render with a _new-but-equal_ reference, which only the new multi-control
container produces.

## The principle

**A "sync local state from a prop" guard must compare the prop the way the prop
actually changes.** If the prop is an object/array the parent may rebuild each
render (a literal `[a, b]`, `{…}`, or `arr.map(…)`), a `prop !== tracked`
reference check fires on every render and stomps local edits. Compare
**element-wise / by value** (or memoize a stable reference at the parent). The
reference compare only happens to work when _every_ caller passes a referentially
stable prop — an invariant the component cannot enforce and a future caller will
break.

```tsx
if (value[0] !== trackedValue[0] || value[1] !== trackedValue[1]) { … }
```

Corollary: this is the same family as Lesson 127 (a controlled input must not be
gated on expensive/rebuilt parent state) — both are "the input's local state
fought a parent re-render." 127 was about _dropped keystrokes_ from binding
`value=` to derived state; 129 is about _wiped edits_ from a reference-compare
sync. And the test-shape lesson is identical to 127's: a component that mirrors a
prop into local state needs a **re-render-with-equal-value** test, not just a
single-render assertion.

## How to apply

- When a component mirrors an object/array prop into local state, compare by
  value in the render-phase sync (or have the parent `useMemo` a stable
  reference). Never assume callers pass a stable reference.
- Test it by **re-rendering with a new-but-equal prop** and asserting the local
  edit survives — and re-rendering with a genuinely different value and
  asserting it syncs. A single render can't catch the clobber.
- When you relocate a shared control into a new container, re-audit its
  prop-stability assumptions: the old caller's referential stability may have
  been silently load-bearing.

## Related

- [[127-a-controlled-input-bound-to-an-expensive-filter-drops-fast-keystrokes]]
  — same epic, same "local input vs parent re-render" family; 127 drops
  keystrokes, 129 wipes edits.
- `frontend/src/components/filters/NumericFilter.tsx` — the element-wise fix.
- #340 — the render-phase tracked-value pattern this corrects (vs
  `setState`-in-effect, which the react-hooks lint rule blocks).
