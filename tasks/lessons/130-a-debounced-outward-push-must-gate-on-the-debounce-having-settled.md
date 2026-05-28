---
id: '130'
category: lesson
tags: [react, frontend, hooks, debounce, router]
auto_load: true
date: 2026-05-27
issues: [817, 818]
---

# Lesson 130 — A debounced outward-push must gate on the debounce having SETTLED, or an external clear races the stale value back out

**Date:** 2026-05-27
**Issue:** #817 (epic #818 Sprint 4 — active-filters bar + URL-sync) — surfaced
by the new "Clear all from the zero-results state" test.

## What happened

`ClubSearchBox` mirrors a `value` prop into local `input` state, debounces it,
and pushes the settled text back out to the filter (and the URL):

```tsx
const [input, setInput] = useState(value)
const debounced = useDebounce(input, 300)
// inward sync (lesson 129): pull external resets into local input
if (value !== trackedValue) {
  setTrackedValue(value)
  setInput(value)
}
// outward push:
useEffect(() => {
  if (debounced !== value) onSearchChange(debounced) // ❌
}, [debounced, value, onSearchChange])
```

The inward sync (lesson 129's territory) was correct. The **outward** push was
the bug. When "Clear all" fires, the parent sets `value`→`''`; the inward sync
sets `input`→`''` immediately — but `debounced` still lags at the old text
(`'ZZZ'`) for up to 300ms. In that window the push effect runs: `debounced`
(`'ZZZ'`) `!== value` (`''`) → it calls `onSearchChange('ZZZ')`, **re-applying
the filter that was just cleared.** The chip and the URL param came back; the
zero-results "Clear all filters" button looked dead.

The unit tests missed it because they never cleared a search with real timers
mid-debounce; the new clear-from-empty-state test (real timers, userEvent) is
the first to exercise the race.

## The principle

**A debounced value pushed _outward_ must fire only once the debounce has
SETTLED to the current input — `debounced === input` — not merely when it
differs from the target.** Otherwise an external reset that updates `input` (and
the target) instantly leaves `debounced` transiently holding the _old_ input,
and the push re-emits that stale value over the reset:

```tsx
useEffect(() => {
  if (debounced === input && debounced !== value) onSearchChange(debounced)
}, [debounced, input, value, onSearchChange])
```

The `debounced === input` guard means "the user has stopped typing and the
debounce caught up" — the only state in which the debounced value is a
legitimate thing to push. During an external sync `input` is already the new
value while `debounced` is the old one, so they differ and the push is skipped;
when the debounce later catches up, it equals the (already-applied) target and
the push is a correct no-op.

## How to apply

- Any `useDebounce(input)` whose result is pushed back to a parent/URL: gate the
  push on `debounced === input`, not just `debounced !== target`. The lag window
  is exactly where an external reset collides with the stale debounced value.
- This is the **outward** twin of lessons 127/129 (the **inward** prop→local
  sync). The same component can need both fixes: 129 stops a parent re-render
  from wiping local edits; 130 stops a lagging debounce from re-emitting a
  cleared value.
- Test with **real timers + an external clear during the debounce window**
  (userEvent, no fake-timer advance). A fake-timer test that flushes the
  debounce before asserting hides the race.

## Related

- [[129-render-phase-prop-sync-must-compare-by-value-when-the-parent-rebuilds-the-prop]]
  — inward sync; this is the outward push, same "local input vs external reset"
  family.
- [[127-a-controlled-input-bound-to-an-expensive-filter-drops-fast-keystrokes]]
  — the debounce that exists to avoid the keystroke drop is the same one whose
  lag window this lesson guards.
- [[070-setSearchParams-prev-races-in-batched-updates]] — a different
  filter↔URL race (same-batch `prev` snapshot); both are "two writers, one
  piece of state, ordering matters."
- `frontend/src/components/ClubsTable.tsx` — `ClubSearchBox` outward-push guard.
