---
id: '103'
category: lesson
tags: [analytics, dcp, data-pipeline]
auto_load: true
date: 2026-05-24
issues: [686, 683]
---

# Lesson 103 — A "remaining-to-threshold" countdown must be derived from the same gate it counts down to

**Date:** 2026-05-24
**Issue:** #686 (epic #683 Sprint 3 — region pages)
**PR:** [#697](https://github.com/taverns-red/toast-stats/pull/697)

## What happened

Amy wanted the region table to show the **absolute count remaining** to the
minimum Distinguished tier (e.g. "14 distinguished clubs to go"), replacing a
percentage-point gap. Three new fields on `DistinguishedDistrictStatus`:
`paymentsRemaining`, `paidClubsRemaining`, `distinguishedClubsRemaining`.

The grooming doc's draft formula used `ceil(activeClubs × 0.45)` for the
distinguished count and `paidClubBase − paidClubs` (regain-base) for paid
clubs — copied from a stale spreadsheet mock. But the tier badge itself is
decided by `meetsThreshold`, which checks `distinguishedPercent ≥ 45` where
`distinguishedPercent` is computed against **`paidClubBase`** (lesson 60, fixed
in #538), and checks `clubGrowthPercent ≥ 1` (i.e. `paidClubs ≥ ceil(base×1.01)`).

If the countdown used a different denominator/threshold than the badge, a
district could read "0 remaining" while the badge still says NotDistinguished
(or vice versa) — the same disagree-with-itself class of bug as lessons 60 and
102, one surface down.

## The trap

A countdown ("N to go") and a gate ("met / not met") are the **same predicate
expressed two ways**. `remaining === 0` _is_ the claim "the gate passes." If you
source the countdown's target from anywhere other than the gate's own
threshold + denominator, you've forked one fact into two implementations that
will drift — exactly the lesson-61 two-copies failure, but within a single
file and disguised as "a different metric."

## How to apply

- **Derive the countdown target from the same constant the gate reads.** Here
  the targets come from `TIER_THRESHOLDS.find(t => t.tier === 'Distinguished')`
  — the literal `meetsThreshold` consumes — not from hand-typed `0.45` / `1.01`.
  If the threshold changes, both the badge and the countdown move together.
- **Use the same denominator the gate uses.** `distinguishedPercent` gates on
  `paidClubBase`; so `distinguishedClubsRemaining` inverts against `paidClubBase`
  (`ceil(paidClubBase × 0.45) − distinguishedClubs`), never `activeClubs`. A
  stale spreadsheet mock is not the spec — the gate is.
- **Test the equivalence, not just the values.** Beyond anchor values (D47=277,
  D37=170), add a case sitting exactly on each minimum and assert _both_
  `remaining === 0` _and_ the awarded tier is not NotDistinguished. That test
  is what catches a future denominator drift.
- **When two thresholds bind the same metric, the stricter one is the target.**
  Distinguished requires both +1% club growth _and_ net no-loss; `ceil(base×1.01) ≥ base`
  always, so the +1% target subsumes no-loss. Pick the binding constraint
  deliberately and note why.

## Related

- [[060-trust-the-program-rules-on-percentage-denominators]] — the denominator
  the gate uses (`paidClubBase`) is the one the countdown must use.
- [[102-a-clamped-gap-is-not-a-signed-delta]] — sibling: a clamped count is
  right for a countdown, wrong under a signed "growth" label.
- [[061-fix-the-formula-everywhere-not-just-the-one-in-the-bug-report]] /
  [[076-shared-formula-helper-eliminates-the-two-copies-trap]] — same
  one-fact-two-implementations drift, here avoided by sourcing from the shared
  threshold constant.
