---
id: '120'
category: lesson
tags: [frontend, react, refactor, tests, tanstack]
auto_load: true
date: 2026-05-27
issues: [835, 821]
---

# Lesson 120 — Reproduce a hand-rolled comparator's tiebreak + undefined rules with a headless table's native options, not a negation-fighting comparator

**Date:** 2026-05-27
**Issue:** #835 (epic #821 Sprint 1 — adopt TanStack Table for the club table)
**PR:** [#836](https://github.com/taverns-red/toast-stats/pull/836)

## What happened

The club table's sort was a 90-line `switch` comparator with two semantics that
do **not** survive a naive port to a headless table library (TanStack Table v8):

1. **"Undefined sorts to the end regardless of direction."** A comparator that
   returns `±1` for undefined gets **negated** by the library for `desc` — so
   undefined flips to the _top_ in one direction.
2. **"Secondary tiebreak by club name, ALWAYS ascending"** — even when the
   primary sort is `desc`. A tiebreak baked into the comparator's return value
   is also negated by `desc`, so equal-primary rows would tiebreak _descending_.

You cannot encode either rule into a single comparator and hand it to a library
that negates the result for `desc` — the negation is applied to the whole
return value, including the parts you wanted direction-independent.

## The technique (faithful migration — Lesson 117)

Lean on the library's own machinery instead of fighting its negation:

- **undefined-to-end** → the column's `sortUndefined: 'last'` option. TanStack
  (and most headless tables) apply undefined placement **outside** the desc
  negation, so it holds in both directions. Set it on exactly the columns whose
  accessor can be `undefined`/`null` (map `null → undefined` in the accessor).
- **always-ascending secondary tiebreak** → **pre-sort the input data** on the
  tiebreak key, then rely on the library's **stable** sort. A stable sort never
  reorders equal-primary rows, so they keep the pre-sort order in _both_
  directions — `desc` negates the primary comparison but `0` (equal) negates to
  `0`, leaving the stable order intact. (`getSortedRowModel` is stable.)
- **primary compare** → `sortingFn: 'basic'` (`a < b ? -1 : a > b ? 1 : 0`) on an
  accessor that returns the exact value the old `switch` compared on (lowercased
  strings; a precomputed rank like `distinguishedOrder`; a status-rank map). This
  reproduces the old `<`/`>` comparison; reserve `localeCompare` for the
  pre-sort base order only (it was only the old tiebreak).

## How to apply

- Before adopting a headless table/grid: list every sort rule that is
  **direction-independent** (undefined placement, a fixed secondary key). Those
  are the ones a single negated comparator can't express — map each to a native
  option (`sortUndefined`) or to **input pre-ordering + stable sort**, not to
  comparator return values.
- Prove equivalence with a test that pins the rule in **both** directions
  (`desc: true` _and_ `desc: false`) and a ties-only fixture — a single-direction
  test passes for the wrong reason. (`clubsColumns.test.tsx`.)
- Keep the migration's blast radius bounded: the filter subsystem's metadata
  (`COLUMN_CONFIGS`) is a separate concern from the table's sort/render column
  model — don't merge them just because the library _could_ (Lesson 077 sibling).

## Related

- [[117-a-delegate-to-x-ticket-is-a-trap-when-the-two-impls-have-diverged-in-output]]
  — same family: a migration must not silently change output; prove equivalence
  field-by-field before trusting the new path.
- [[070-setSearchParams-prev-races-in-batched-updates]] — the URL-sync sort
  boundary this migration kept controlled, untouched.
- `frontend/src/components/clubsColumns.tsx` — the column model; the header
  comment documents the three sort-fidelity moves.
