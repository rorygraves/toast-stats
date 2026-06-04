---
id: '154'
category: lesson
tags: [data-pipeline, ci, automation, tdd, verification, fixtures]
auto_load: true
date: 2026-06-04
issues: [1092, 1086, 1083]
---

# Lesson 154 — Synthetic fixtures validate the code; only a captured real pair validates the policy

**Date:** 2026-06-04
**Issue:** #1092 (epic #1083 Sprint 3 — corrective)
**PR:** #1093

## What happened

Sprint 2 (#1086) shipped the Closing-Pinned Auto-Allow gate with thorough
unit coverage: synthetic single-district fixtures exercised every class rule
(decrease blocks, cap blocks, base drift blocks, …) and a real captured pair
tested `evaluateClosingAutoAllow`. Everything was green. The gate survived
**one day** of production: the next scheduled run (26947541298) blocked on 9
small counter decreases (D14 totalPayments 3774→3764, paidClubs 98→97, …) —
decreases the policy said must block, but which are in fact the daily texture
of closing reconciliation (payments reversed, clubs slipping under
thresholds).

Two distinct gaps, easily conflated:

1. **Layer gap:** no test drove `runValueDiff` — the fs → schema → digest →
   diff → `evaluatePromote` path the workflow actually calls. Units passed
   while the _integrated verdict_ was never pinned on real data.
2. **Policy gap (the deeper one):** the synthetic fixtures could only confirm
   the code implements the spec'd policy. They could not falsify the policy
   itself, because the author invents their distribution. The captured real
   pair contains the distribution the spec didn't anticipate — 9 legitimate
   decreases — and falsified the "non-decreasing" axis within a day. The fix
   wasn't a threshold tweak (the spec'd `closingDecreaseFloor` relief valve);
   it was dropping direction as a criterion entirely.

## The transferable principle

**When you ship a policy gate, its acceptance test must be (a) at the verdict
layer the pipeline calls and (b) on a captured REAL input pair — synthetic
fixtures verify the code matches the spec, but only real data can falsify the
spec.** And when production falsifies a guard daily, suspect the _axis_ (here:
direction), not the _threshold_ (the floor). A spec that anticipates needing a
tolerance knob on an axis is often a sign the axis itself is wrong: the floor
parameterized "how much decrease to tolerate" when the right question was
"is direction a regression signal at all?" (It wasn't — magnitude is.)

## How to apply

- For any promote/safety gate: add one integration test that calls the same
  entrypoint the workflow/CLI calls, on a fixture laid out exactly as the
  pipeline builds it (here `{root}/{date}/all-districts-rankings.json`,
  mirroring `/tmp/vd`).
- When a live run is blocked/broken by the gate, capture BOTH sides
  immediately (staging is overwritten daily — the evidence is otherwise
  unreproducible) and commit them as the acceptance fixture for the
  corrective change.
- In the corrective sprint, assert the _verdict_ (`decision.promote === true`)
  on the real pair, plus the inverse guards (removed date/district still
  block) so the loosening can't overshoot.

## Related

- [[143-a-probe-whose-production-feed-was-deferred-reports-unknown-forever-verify-end-to-end]]
  — sibling: the verification layer that was deferred is exactly where it
  fails.
- [[139-a-year-end-snapshots-source-date-falls-in-july-so-a-program-year-equality-guard-drops-every-year]]
  — sibling: a guard encodes an assumption about data shape; only live data
  falsifies it.
- `packages/collector-cli/src/services/__tests__/SnapshotValueDiffClosingIntegration.test.ts`,
  `fixtures/closing-2026-05-31-decreases/` (the captured pair),
  ADR-009 D4.
