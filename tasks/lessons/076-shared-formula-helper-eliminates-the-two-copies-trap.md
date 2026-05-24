---
name: A shared pure-function helper is the right shape for cross-package formulas
description: When the same formula lives in two packages (analytics-core
  + collector-cli) and a "fix" only lands in one, prod ships the bug
  for days despite green CI (lessons 60+61). The structural fix is to
  extract a pure function in the lower-level package and have both
  call sites inline-invoke it at the field assignment — not behind a
  private wrapper method. Wrappers re-introduce the drift surface.
type: feedback
id: '076'
category: principle
tags: [monorepo, analytics, tdd]
auto_load: true
date: 2026-05-22
issues: [547]
---

# Lesson 76 — Shared formula helper eliminates the two-copies trap

**Date:** 2026-05-22
**Issue:** #547 (Sprint 8 — dedupe `calculateDistinguishedPercent` between
TransformService + BordaCountRankingCalculator)

## What happened

Lesson 61 captured the failure mode: PR #538 fixed the % Distinguished
formula in analytics-core's `BordaCountRankingCalculator`, but the same
formula was independently re-implemented in collector-cli's
`TransformService`. The CI pipeline runs both, so the second copy
silently kept producing the buggy value. Prod data carried the bug for
~5 days despite a green main.

The follow-up issue (#547) proposed two options:

1. Have `TransformService.calculateDistinguishedPercent` **delegate** to
   the analytics-core implementation
2. Extract a **shared helper** in analytics-core that both files call

Option 2 won because it puts the formula in the analytics layer where
it belongs and makes the dependency direction obvious. But the choice
_inside_ Option 2 still matters: keep each call site's private wrapper
method (now thin), or inline the helper at the field-assignment site.

**The right move is inline.** A thin wrapper around the shared helper
re-creates exactly the kind of surface where drift can hide. Today
it's `return shared(this.parse(a), this.parse(b))`. Tomorrow someone
"fixes" something locally inside the wrapper before remembering it
delegates. The wrapper has a name (`calculateDistinguishedPercent`)
that suggests "this is where the formula lives" — and the next person
to look believes it. Two copies in one repo are two copies. Inline at
the call site removes the trap.

## How to apply

**Rule:** when deduping a cross-package formula, do all three:

1. **Extract** as a pure function in the lower-level package, exported
   from its public barrel.
2. **Inline** at the call site — `field: sharedHelper(parse(x),
parse(y))`. Do **not** keep a private wrapper method that calls the
   shared helper.
3. **Delete** the mirror-warning comments. They were a workaround for
   the duplication. With the duplication gone, the comments are a
   maintenance liability — future readers will edit them, future
   greps will return them, future PRs will treat them as load-bearing.

**Why:** the wrapper method is shaped like the old duplicated method
(same name, same signature, same parameter type). It invites the same
mistakes. Inline calls are syntactically obvious — the dependency on
the shared helper is visible on the assignment line, so any drift
attempt is also visible.

**How to apply:** at the end of the refactor, `grep` for the OLD
private method name (`calculateDistinguishedPercent`) across the
deduplicated packages. The only hits should be in the new helper's
file. If there are private methods still wearing that name, they're
still drift surfaces — inline them.

## What the integration tests already cover (don't add redundant ones)

Two adjacent test files already exercise the call-site path with the
right denominator:

- `BordaCountRankingCalculator.test.ts:606` — "computes
  distinguishedPercent against Paid Club Base, not Active Clubs"
- The transform tests that build a ranking output from a CSV record

A transposed-args regression (`calc(paidClubBase,
distinguishedClubs)`) would be caught there immediately. So the new
`distinguishedPercent.test.ts` only needs to assert the formula
itself, not the call-site wiring. Adding a "test that the call site
calls the helper" is double-entry bookkeeping; the integration tests
ARE that test.

## Telltale signs

- The same field name (e.g. `distinguishedPercent`) is assigned in two
  files in two packages, each computing the same thing from raw CSV
  fields. `grep -rn "fieldName:" packages/` is the audit.
- A bug fix lands in one package, CI is green, and a production smoke
  test surfaces the bug a few days later. The pipeline has a second
  copy of the rule the fix missed.
- A private method on a service has a comment that ends with "must
  stay in lockstep with [other class]." The lockstep comment is the
  smell — the lockstep itself is the bug.

## Related

- Lesson 60 — % Distinguished must use `Paid Club Base`, not
  `Active Clubs` (the formula spec)
- Lesson 61 — "fix the formula everywhere, not just the one in the bug
  report" (the two-copies failure mode that motivated #547)
- `packages/analytics-core/src/rankings/distinguishedPercent.ts` — the
  shared helper, exported from `@toastmasters/analytics-core`
- `packages/analytics-core/src/rankings/distinguishedPercent.test.ts`
  — formula unit tests (6 cases covering D93 + D110 shapes)
