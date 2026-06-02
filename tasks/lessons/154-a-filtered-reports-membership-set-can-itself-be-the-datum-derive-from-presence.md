---
id: '154'
category: lesson
tags: [data-pipeline, analytics, collector-cli, privacy, tdd]
auto_load: true
date: 2026-06-02
issues: [1065, 1062]
---

# Lesson 154 — A pre-filtered report's MEMBERSHIP SET can itself be the datum; derive from presence, not a column

**Date:** 2026-06-02
**Issue:** #1065 (epic #1062 Sprint 3 — ingest in-scope daily reports → dataset)
**PR:** (this sprint)

## What happened

Sprint 3 had to compute each club's `electionCadence` (semiannual vs annual)
for the officer-list dataset. The instinct is to read a column — and there IS
an "Election" column that literally says "Semiannual"/"Annual". But the
authoritative signal is structural: the **January** Club Officer List report is
_pre-filtered to the clubs that re-elect mid-year_ (semiannual), while **July**
lists every club. So a club's cadence is encoded by **which report it appears
in**, not by a field: present in January ⇒ semiannual; present only in July ⇒
annual. The derivation is a set join over the two reports' membership, with
January presence winning for a club in both.

Reading the "Election" column instead would have worked on this fixture but is
the wrong altitude: it trusts a per-row label that can be blank, stale, or
absent on the clubs that matter, when the report's own scoping already answers
the question deterministically. The same shape recurred for Triple Crown — once
the personal `Member` column is excluded the report has _no_ club column at all,
so the only de-identified datum that survives is the **cardinality** of the
member set (the district achiever count). The data was the set size, not any row.

## The transferable principle

**When a source emits multiple pre-filtered reports/views of the same entities,
a row's _membership_ in a particular report is often a first-class signal —
sometimes the only one left after de-identification. Derive from presence (a set
join / a count over the filtered set), not from a per-row column that merely
restates what the report's scope already encodes.** A column can be empty or
lie; the report's filter is the backend's own classification. This also de-risks
privacy: a count or a presence-flag carries no personal value even when every
row does.

## How to apply

- Before parsing a column to recover a fact, ask: does the report I'm reading
  _already_ select for that fact? If the January report only contains semiannual
  clubs, presence-in-January IS the cadence — join on it.
- For an entity-listing report whose only non-aggregate column is personal,
  the de-identified survivor is the **count** of the set (Triple Crown achiever
  count), not a projected row. Decide eligibility against the set, not the row
  (kin to [[153-aggregating-a-ledger-to-counts-must-drop-per-row-fields-even-non-personal-keep-ones]]).
- Pin the join with a both-present case (club in Jan ∩ Jul ⇒ Jan wins) and a
  presence-only case, so a later refactor can't silently flip the precedence.

## Related

- [[153-aggregating-a-ledger-to-counts-must-drop-per-row-fields-even-non-personal-keep-ones]]
  — sibling: de-identify by collapsing rows to counts; here the count/presence
  IS the signal, not just a privacy device.
- [[150-an-exhaustiveness-guard-on-a-classification-map-misses-a-misclassification-that-keeps-the-set-valid]]
  — same epic: structural guard + value-level denylist, reused end-to-end here.
- `packages/collector-cli/src/services/DistrictReportsBuilder.ts`
  (`joinOfficerLists`, the triple-crown `achieverCount`).
