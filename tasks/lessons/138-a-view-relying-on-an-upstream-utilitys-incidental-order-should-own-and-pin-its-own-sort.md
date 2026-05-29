---
id: '138'
category: lesson
tags: [frontend, react, scope, refactor, tests]
auto_load: true
date: 2026-05-29
issues: [882, 884]
---

# Lesson 138 — A view that renders correctly only because an upstream utility incidentally sorts that way should own and pin its own order

**Date:** 2026-05-29
**Issue:** #882 (epic #884 Sprint 2 — documented region-card sort)
**PR:** [#938](https://github.com/taverns-red/toast-stats/pull/938)

## What happened

The task was "give the region cards a documented default sort (region number
ascending)." On opening the code, the cards _already_ rendered region-ascending
— but only because `aggregateRegions()` happens to end with
`rollups.sort((a, b) => Number(a.region) - Number(b.region))` as the last line
of its own (separately-motivated) contract. `RegionGrid` itself just did
`rollups.map(...)` in arrival order. The correct on-screen order was a
**side effect of an upstream utility**, owned and tested nowhere near the view
that depends on it.

That is a silent-break trap: the day someone changes `aggregateRegions` to emit
leaderboard order (by `aggregateScore`) — a plausible future need — the cards
silently re-sequence, no test goes red, and the regression ships. "It already
works" hid the fact that nothing _guaranteed_ it.

## The transferable lesson

**When a view's correctness depends on the order data arrives in, the view must
own and pin that order — never lean on an upstream producer's incidental
sort.** The fix here was small: an explicit `[...rollups].sort(...)` in
`RegionGrid` with a comment naming the choice, plus a unit test that feeds
**deliberately out-of-order** input (`[14, 02, 07]`) and asserts the rendered
order. A test that passes the data already-sorted proves nothing — it's green
whether or not the component sorts. The out-of-order fixture is what makes the
test actually exercise the guarantee.

This is the R3 spirit ("don't re-derive context a parent has") inverted: when
the ordering _is_ the view's own presentational concern, the view should assert
it locally rather than trusting an upstream side effect to keep holding.

## How to apply

- Implementing a "documented sort/order" ticket? Check whether the order
  _already_ appears correct. If so, find _why_ — and if the answer is "an
  upstream utility happens to sort it," that's the bug to fix (un-owned
  guarantee), not a reason to skip the work.
- Pin order-dependent rendering with a fixture whose input order **differs**
  from the expected output order. Same-order input is a tautology (cf.
  [[137-an-audits-false-confidence-list-is-a-per-file-hypothesis-reconfirm-before-deleting]]
  — a test that only asserts back what it fed in proves nothing).
- A redundant sort (view + upstream both sort the same way) is cheap insurance
  for small N and decouples the surfaces; don't "DRY it away" by deleting the
  view's sort and re-coupling to the utility's incidental order.

## Related

- [[120-reproduce-a-hand-rolled-comparators-tiebreak-and-undefined-rules-with-a-headless-tables-native-options]]
  — sibling sort-fidelity lesson; there the hazard was a negated comparator,
  here it's an un-owned order.
- `tasks/rules.md` R20 (partition exhaustiveness guard) — same family: a
  guarantee nothing explicitly asserts drifts silently and surfaces weeks later.
- `frontend/src/components/RegionGrid.tsx` (the owned sort + comment),
  `frontend/src/components/__tests__/RegionGrid.test.tsx` (#882 out-of-order pin).
