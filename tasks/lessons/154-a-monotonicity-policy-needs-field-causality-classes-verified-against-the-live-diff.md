---
id: '154'
category: lesson
tags: [data-pipeline, analytics, verification, process, monitoring]
auto_load: true
date: 2026-06-03
issues: [1084, 1083]
---

# Lesson 154 — A "values only move up" policy needs field-causality classes, verified against the live diff — not the narrative

**Date:** 2026-06-03
**Issue:** #1084 (epic #1083 Sprint 1 — closing-period promote policy, doc-only)
**PR:** (this sprint)

## What happened

The epic's leading candidate for unfreezing the closing-period promote gate was
"auto-promote when every value delta is non-decreasing — reconciliation is
monotonic by nature." Before writing the decision doc, I diffed the actual
staging-vs-prod payload for the pinned date (the #1034 gate's own inputs)
instead of trusting the narrative. Two findings reshaped the policy:

- **78 of 102 changed districts had no counter change at all** — only ranks,
  percents, and aggregateScore moved. Those are zero-sum _consequences_ of
  other districts' gains: when D124 gains 3 paid clubs, every neighbour's
  `clubsRank` legitimately worsens. A naive all-fields monotonicity rule
  blocks on districts that did nothing.
- **5 districts had genuine counter decreases** — a charter reversal
  (D114: paidClubs −1, charterPayments −21), a DCP tier corrected downward
  (D88: presidentsDistinguished 7→6), single-payment corrections. Upstream
  reconciliation is _mostly_, not purely, monotonic.

The shipped policy therefore classifies every schema field by causal role —
raw **counters** (monotone + capped), **bases/identity** (must be equal),
one-way **booleans**, and **derived** zero-sum fields (excluded) — with an
exhaustiveness guard so an unclassified new field fails closed. And because
the evidence lives in a staging bucket that is overwritten daily, the diff
pair was captured as a committed fixture the same day it was observed.

## The transferable principle

**A directional policy ("this data only goes up") is a claim about _raw input
fields_, never about a whole record — and it must be validated against the
real payload diff before it becomes a gate.** Derived fields (ranks, shares,
percentages, scores) are relational: one entity's legitimate gain moves them
on entities that changed nothing, in the "forbidden" direction. And the raw
fields themselves usually have a small genuine-reversal tail the narrative
omits. Design the rule per field-class (raw monotone / fixed / one-way /
derived-excluded), fail closed on unclassified fields, and capture the
evidence diff as a fixture immediately if its source is ephemeral.

## How to apply

- Before encoding any direction/threshold invariant into a gate, diff the live
  before/after payload and bucket every changed field: raw cause, or derived
  consequence? Apply the invariant only to causes.
- Ask "what does a _legitimate_ violation look like?" (here: charter
  reversals) and decide its handling explicitly — a configurable strictness
  parameter defaulting to the hard-constraint value beats hard-coding either
  answer.
- If the evidence is in an overwritten-daily surface (staging buckets, caches,
  rolling windows), commit the fixture the day you observe it — the
  interesting case (the reversal) may not recur for months.

## Related

- [[150-an-adr-claim-that-a-derived-field-is-in-the-snapshot-can-be-false-verify-the-live-payload]]
  — same reflex (verify the bytes, not the doc), one layer down.
- [[153-aggregating-a-ledger-to-counts-must-drop-per-row-fields-even-non-personal-keep-ones]]
  — sibling: field eligibility decided against the _operation's shape_, not a
  validated list.
- `docs/investigations/closing-period-promote-policy-2026-06-03.md` §3 (the
  evidence), `packages/collector-cli/src/services/__tests__/fixtures/closing-2026-05-31/`.
