---
id: '119'
category: lesson
tags: [frontend, scope, refactor, dcp]
auto_load: true
date: 2026-05-28
issues: [832, 833]
---

# Lesson 119 — When removing a UI bandaid, grep for its _shape_, not just its named site

**Date:** 2026-05-28
**Issue:** #832 (epic #833)

## What happened

#832's body named one bug site: `AreaPerformanceRow.tsx:172` —

```ts
const visitsComplete =
  area.firstRoundVisits.completed >= area.firstRoundVisits.required &&
  area.secondRoundVisits.completed >= area.secondRoundVisits.required
const isDistinguishedLevel = gapAnalysis.currentLevel !== 'none'
const isProvisional = isDistinguishedLevel && !visitsComplete
```

The fix was to delete that deadline-blind gate and route the badge through a
snapshot-date-aware source-of-truth state instead. Easy enough — except a quick
`grep "isProvisional\|visitsComplete"` across the frontend turned up the same
five-line shape, character-for-character, in `AreaPerformanceTable.tsx` and
`DivisionAreaProgressSummary.tsx`. Same comment (`// Check if visits gate the
recognition (#325)`), same variable names, same `&& !visitsComplete` semantics.
Fixing only the named site would have shipped two un-gated surfaces under a PR
titled "fix area recognition" — and three months later someone else would be
filing #832 again from a screenshot of either of them.

## The principle

When the ticket names a bug site, the named site is a sample, not the
population. A copy-pasted UI bandaid lives in every surface that needs the
same lie — because the author who copy-pasted it had the same blind spot in
every surface, in the same week. Before declaring the source-gate refactor
complete, grep the codebase for the _shape_ of the deleted logic:

```
rg -F "isDistinguishedLevel && !visitsComplete"
rg -nF "firstRoundVisits.completed >= area.firstRoundVisits.required"
```

The hits are the rest of the population. Either fix them all in the same PR
(they share one cause), or open follow-up issues with the same root cause
linked — never silently leave them.

## How to apply

- After deleting a UI-level bandaid the ticket named, grep for its
  literal expression (5–10 chars of the conditional) across the
  same layer (components/, pages/). Hits in sibling files are co-equal
  sites of the same bug.
- Same prompt for the inverse: when adding a source-of-truth value the
  presenters should consume, grep for every presenter that currently
  re-derives it locally — convert all of them in one PR (they're already
  out-of-sync risks; converting just one creates a new asymmetry).
- The presenter / source-of-truth split has the same drift surface as
  the cross-package formula trap ([[076-shared-formula-helper-eliminates-the-two-copies-trap]]),
  one layer up: two views that re-derive the same gate are two copies of
  the rule. Replace all, not the named one.

## Related

- [[076-shared-formula-helper-eliminates-the-two-copies-trap]] — the same
  "duplicated-formula drift surface" pattern at the analytics layer; this
  is the UI variant.
- [[061-fix-the-formula-everywhere-not-just-the-one-in-the-bug-report]] —
  the predecessor lesson at the data-pipeline layer (PR #538 fixed only
  one of two `% Distinguished` implementations).
- [[117-a-delegate-to-x-ticket-is-a-trap-when-the-two-impls-have-diverged-in-output]]
  — adjacent: when the ticket names a refactor, prove output equivalence
  before delegating.
- `tasks/rules.md` R6 ("Trace the actual call graph before refactoring")
  applies symmetrically to bandaid removal — _audit the actual presenter
  population before declaring the gate centralised._
