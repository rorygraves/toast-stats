---
id: '127'
category: lesson
tags: [frontend, react, performance, tests, playwright, verification]
auto_load: true
date: 2026-05-27
issues: [814, 818]
---

# Lesson 127 — A controlled input bound to an expensive derived filter drops fast keystrokes

**Date:** 2026-05-27
**Issue:** #814 (epic #818 Sprint 1 — visible club-table search box)
**PR:** [#828](https://github.com/taverns-red/toast-stats/pull/828)

## What happened

The visible club search box was first wired the obvious way: a single
controlled `<input value={getFilter('name')?.value} onChange={setFilter…}>`.
Every keystroke called `setFilter`, which re-filtered **and re-sorted ~162
club rows** synchronously, then re-rendered the whole table. Unit tests
(3 clubs, `fireEvent.change` with the full string in one event) passed. The
dual-engine preview smoke (`pressSequentially`, 20ms/char, against the real
162-club D61 preview) failed: typing `"zzqqxxnomatch"` left the URL stuck at
`?search=zzqq` — **only the first four characters landed.**

A controlled input's displayed value is gated on the render that consumes its
`onChange`. When that render is expensive (a 162-row re-sort), keystrokes
arrive faster than React commits; React resets the DOM input to the stale
controlled value mid-burst and the extra characters are silently dropped. The
URL was a faithful mirror of a genuinely broken input, not a separate bug.

Chromium flake-passed on retry (a fresh, faster load occasionally kept up);
WebKit failed outright. A Chromium-only or jsdom-only check would have shipped
this.

## The fix — local input state + debounced push (the pattern already in the repo)

Mirror the existing column `TextFilter`: keep a **local** input state so typing
is instant and cheap, and drive the expensive filter off a **300ms-debounced**
value.

```tsx
const [input, setInput] = useState(value)
const debounced = useDebounce(input, 300)
// pull external resets (Clear-all / dropdown / back-forward) in, render-phase
// (no setState-in-effect — the react-hooks lint rule blocks it; #340):
const [tracked, setTracked] = useState(value)
if (value !== tracked) {
  setTracked(value)
  setInput(value)
}
// push the settled value out (filter + URL) when it diverges:
useEffect(() => {
  if (debounced !== value) onSearchChange(debounced)
}, [debounced, value, onSearchChange])
```

`value={input}` (not the derived filter value) is the key line: the input is no
longer gated on the re-sort, so no characters drop. Debounce coalescing means
the box only emits the final value, and the render-phase tracked-value sync
pulls external changes back in without fighting the user mid-type.

## How to apply

- **A controlled text input whose `onChange` does non-trivial work (filter +
  sort a large list, a network call, a heavy recompute) needs a local value +
  debounce.** Binding `value=` straight to the expensive derived state drops
  fast keystrokes. This repo already has `useDebounce` and the `TextFilter`
  reference — reach for it, don't reinvent instant filtering.
- **Test typing the way a human types — character by character on real data
  volume.** A unit test that sets the whole string in one `fireEvent.change`
  with 3 rows cannot reproduce a dropped-keystroke race. The live
  `pressSequentially` smoke against the 162-row preview is what surfaced it
  (same "verify on the engine/volume that ships" family as lessons 108/110/111).
- To sync local state from a prop without `setState`-in-effect (the
  `react-hooks/set-state-in-effect` lint error), use the render-phase
  tracked-value compare, not a `useEffect`.

## Related

- `frontend/src/components/filters/TextFilter.tsx` — the local-value + 300ms
  `useDebounce` reference this should have followed from the start (#340).
- [[070-setSearchParams-prev-races-in-batched-updates]] — sibling URL-state
  footgun; there the URL was clobbered by a same-batch writer, here the input
  itself dropped input before the URL ever saw it.
- [[111-native-select-ignores-min-height-in-webkit-defeating-touch-targets]] —
  same sprint family: a defect invisible to Chromium/jsdom, caught only by the
  dual-engine live smoke.
