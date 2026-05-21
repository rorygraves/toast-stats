---
name: When fixing a formula, audit every implementation of it
description: A bug report that names one file may hide parallel implementations
  of the same formula in other packages. Grep the codebase before declaring
  a fix complete.
type: feedback
---

# Lesson 61 — Fix the formula everywhere, not just the one in the bug report

**Date:** 2026-05-20
**PR:** Issue #545 (founder-reported D93 + D110 tier mis-display)

## What happened

PR #538 (lesson 60) "fixed" `% Distinguished` to divide by Paid Club
Base instead of Active Clubs, per TI DDP rule (Item 1490). The fix was
applied to `analytics-core/src/rankings/BordaCountRankingCalculator.ts`
— the file named in the bug report and the file where `meetsThreshold`
consumes the value.

Five days later the founder reported the same symptom on D93 and D110:
tier chip showing "Select" / "Not Yet Distinguished" when the prereqs +
counts pointed to higher tiers. The live snapshot still had the buggy
percentage (D93: 39/75=52% instead of 39/69=56.52%).

Root cause: **`collector-cli/src/services/TransformService.ts:785`
had a parallel implementation of the exact same formula** — using
`activeClubs` as the denominator — and that's the method that actually
writes `distinguishedPercent` into `all-districts-rankings.json`, the
snapshot the CDN serves. The analytics-core fix never reached the
data the frontend reads.

The collector-cli copy and the analytics-core copy diverged at the
exact line that mattered. Two implementations of the same TI rule;
only one was named in the bug, only one was fixed.

## How to apply

**When fixing a formula, grep the entire codebase for the input field
names before declaring the fix complete:**

```
rg -n "distinguishedClubs.*activeClubs|distinguishedClubs.*paidClubBase"
rg -n "calculateDistinguishedPercent"
```

Treat a hit in a different package as a co-equal fix site, not as
"someone else's problem." Specifically for this codebase:

- `collector-cli` writes snapshot JSON. **It is the source of truth
  for what the frontend reads.**
- `analytics-core` is a library used by collector-cli AND used at
  read-time in places. Fixing the library does not retroactively fix
  data already written by collector-cli.

Telltale signs you have this kind of bug:

- Production data still shows the old behaviour after a fix landed.
- Pipeline ran successfully post-fix but produced the wrong values.
- The reported file diverges in implementation from another file with
  the same method name. (`calculateDistinguishedPercent` lives in
  both `BordaCountRankingCalculator` and `TransformService`.)

## Follow-up

Tracked: **#547** — dedupe `calculateDistinguishedPercent` so both
sites call a single helper in `analytics-core`. Until that lands, R8
(audit write AND read paths) applies in reverse to fixes too — audit
every implementation, not just the one you found first.

## Related

- Lesson 60 — the formula spec (paidClubBase, not activeClubs)
- `packages/collector-cli/src/services/TransformService.ts:782-808` (the fix)
- `packages/analytics-core/src/rankings/BordaCountRankingCalculator.ts:822-843` (PR #538's site)
- Rule R6 — "Trace the actual call graph before refactoring" applies symmetrically to fixes
