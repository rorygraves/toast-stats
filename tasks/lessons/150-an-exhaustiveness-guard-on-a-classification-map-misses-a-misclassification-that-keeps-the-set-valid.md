---
id: '150'
category: lesson
tags: [tests, vitest, privacy, data-pipeline, collector-cli, verification]
auto_load: true
date: 2026-06-01
issues: [1063, 1062]
---

# Lesson 150 — An exhaustiveness guard on a keep/EXCLUDE map misses a mis-classification that keeps the header set valid; pair it with a value-level denylist

**Date:** 2026-06-01
**Issue:** #1063 (epic #1062 Sprint 1 — Daily Reports ingest spike)
**PR:** (this sprint)

## What happened

The spike validated a per-report keep/EXCLUDE **column map** for 12 TM Daily
Reports whose hard rule is "no personal column is ever persisted". The first
test was an **exhaustiveness/disjointness** check: `keep ∪ exclude` must equal
the live header set, each header classified exactly once (R20 spirit).

The falsifiability check exposed a hole. Moving the personal `Member` column from
`exclude` into `keep` for Education Achievements did **not** turn the suite red —
it went from 19 passing to **18 passing**. The exhaustiveness test still passed
(the header set was unchanged; `Member` was simply now on the other side of the
partition), and the projection test that asserted the drop was filtered to
`exclude.length > 0`, so it silently **stopped covering** that report. A
mis-classification that leaks a personal name produced a quieter, still-green
suite — the exact privacy regression the test existed to catch sailed through.

## The transferable principle

**An exhaustiveness guard on a classification map proves every item is labelled,
not that it's labelled _correctly_. Moving an item between buckets keeps the set
exhaustive and disjoint, so the structural check stays green.** To catch a
mis-assignment whose only consequence is in the _output_, you need an assertion
sourced from the consequence, not the structure: a value-level backstop that is
**independent of the map**.

Here that's a `PERSONAL_DENYLIST` of known personal sample values, asserted
absent from **every** report's KEEP projection regardless of how the map labels
columns. Re-classifying `Member` as KEEP now lets "Ricardo J. Bocanegra, DTM"
survive the projection → the denylist test fails loudly. Same shape as
verifying the _rendered_ thing, not the proxy the structure exposes (cf. L134,
L149).

A second trap fed the false green: a parametrized test filtered by the very
field under test (`.filter(s => s.exclude.length > 0)`) **shrinks its own
coverage** when that field is edited wrong. A guard must not be gated on the
attribute it's guarding.

## How to apply

- Validating a keep/drop, allow/deny, or safe/unsafe **map**? Add two layers:
  (1) structural — exhaustive + disjoint vs the real input; (2) **consequential**
  — a fixed denylist/allowlist of values asserted against the map's _output_,
  independent of the map. Layer 2 is the one that catches a wrong label.
- Never filter a guard test by the field it guards. If "only reports with
  excludes" run the drop-check, mis-labelling a column to have no excludes
  removes it from the check. Run the value-level guard over **all** items.
- Re-run the falsifiability check after adding the backstop: a wrong label must
  produce a **failing** test, not merely fewer passing ones. "19 → 18 passing"
  is a smell that a guard is opting out instead of failing.

## Related

- [[090-splitting-one-test-suite-into-named-projects-needs-a-partition-guard]]
  — exhaustiveness from the tool's own resolution; this is the sibling caveat
  that exhaustiveness ≠ correctness of assignment.
- `packages/collector-cli/src/__tests__/dailyReportsColumnMap.test.ts`,
  `docs/investigations/1063-daily-reports-ingest-spike.md`.
