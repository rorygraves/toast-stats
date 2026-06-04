# ADR-009: Full-range re-derive promote semantics (value-aware gate + seed-from-prod)

**Status**: Accepted — amended 2026-06-03 (D3, closing-period auto-allow, #1084)
**Date**: 2026-05-31
**Issue**: #1034 (epic #1031 — rerun pipeline 2017→now; Sprint 1 investigation #1033)

## Context

Epic #1031 wants to re-run the data pipeline for every month-end from Jan 2017
to now, **re-deriving** snapshots + analytics from the raw-csv already in GCS,
**validate-first** (rebuild to a staging bucket → diff vs prod → promote). Sprint 1
([`docs/investigations/2017-rerun-raw-csv-coverage.md`](../investigations/2017-rerun-raw-csv-coverage.md))
established the ground truth and surfaced two findings that the existing
staging→diff→promote path (`data-pipeline.yml`) cannot handle:

- **F1 — A wholesale rebuild-from-raw-csv CANNOT promote today.** raw-csv yields
  ~99 collection months; prod has **152** snapshot dates (55 are daily 2026
  snapshots; 3 prod-only months — `2017-01`, `2022-07`, `2026-05` — have no
  raw-csv source). The promote gate is count-monotonic
  (`STAGING_DATES >= PROD_DATES`), so a pure raw-csv rebuild trips it and blocks.
  This is the gate **correctly** refusing a subtractive change — not a bug.

- **F2 — The gate cannot validate a re-derivation.** It compares aggregate
  **counts**, never **values**. The epic's "re-derive after logic changes" intent
  produces identical dates/districts with corrected values ⇒ counts match ⇒
  `promote=true` unconditionally ⇒ prod overwritten with **unvalidated** values.
  "Validate-first" was a count check, not a value check.

Two questions follow, and this ADR records the decisions so Sprint 3 (the
operator-attended execution) builds on them rather than relitigating:

1. **How do we detect a wrong re-derive before it reaches prod?** (the F2 gap)
2. **How does a partial-range rebuild promote without destroying the prod-only
   dates it never regenerated?** (the F1 gap)

## Decision

### D1 — Add a value-aware diff gate (implemented this sprint)

A new `collector-cli value-diff` command computes a per-date **value digest** over
each district's data fields in `all-districts-rankings.json` for the set of dates
present in **both** staging and prod (the overlap), and classifies every overlap
date as `unchanged` or `changed` (plus `added` / `removed` by date-set). The digest:

- is **order-independent** (districts sorted before combining), so a reordering
  is not a false "changed";
- **excludes volatile metadata** (`calculatedAt`, `csvFetchedAt`, `fromCache`,
  version stamps) — those change every run without the data changing, which would
  make every date falsely "changed" and render the gate useless.

`evaluatePromote` then decides:

| Diff shape                                      | promote                                    | rationale                                           |
| ----------------------------------------------- | ------------------------------------------ | --------------------------------------------------- |
| additive-only (`added`/`unchanged`)             | ✅ true                                    | new dates, nothing regressed                        |
| any `removed` (date in prod, absent in staging) | ❌ false                                   | subtractive — always blocks, even with the override |
| any `changed` (overlap values differ)           | ❌ false → ✅ with `--allow-value-changes` | a re-derive must be **reviewed** before it promotes |

The gate is **fail-closed**: if the snapshots cannot be read or compared, the
verdict is "do not promote." It is **ANDed with** the existing count gate in
`data-pipeline.yml` (`steps.diff`) — it does not replace it (R11). A new
`allow_value_changes` workflow_dispatch input maps to `--allow-value-changes`,
so the operator promotes a re-derive only after reviewing the surfaced changed
dates in the run summary.

### D2 — Partial-range rebuild seeds staging from prod, then overlays the rebuild

For the full-range execution (Sprint 3), **seed the staging bucket from prod
first, then run the rebuild over it** (rebuild writes only raw-csv-backed dates).
The consequence:

- the 3 prod-only months (no raw-csv source) and the 55 daily 2026 snapshots
  **survive** in staging because they were copied from prod and the rebuild never
  touches them;
- staging's date **count never regresses** below prod, so the count gate (D1's
  AND-partner) passes and stops vetoing the whole run on F1;
- the **value gate does the real work** — it flags exactly the overlap dates
  whose re-derived values differ, which is precisely what the operator must review.

This is preferred over the alternative of a scoped per-date promote (see below)
because it requires **no new promote machinery** — the existing
`gsutil -m rsync` promote step (additive, no `-d`) already does the right thing
once staging is a superset of prod, and the safety logic lives entirely in the
two gates rather than in a bespoke per-date rsync loop.

### D3 — Closing-period auto-allow (amendment 2026-06-03, #1084 / epic #1083)

D1's "any `changed` overlap date requires operator review" turned out to be a
**daily blocker during month-end closing**: the #309 remap pins the snapshot
date to the month-end while TI reconciles values daily, so the same overlap
date legitimately changes every day, prod freezes, and the #1072 freshness
monitor fires (observed 2026-06-01→03, `pipeline-stale` #1082).

The gate gains one narrowly-scoped auto-allow path — **Closing-Pinned
Auto-Allow (CPAA)**: when **every** changed overlap date carries the closing
remap signature in staging's own metadata (date is a month-end AND
`sourceCsvDate > date` AND the gap ≤ 31 days), and per-district deltas satisfy
a field-class policy — raw **counters** non-decreasing and within
`max(50, 10% × prod)`; **bases/identity equal**; plan **booleans** one-way
`false→true`; **derived** ranks/percents/scores excluded (zero-sum) — the run
promotes with `autoAllowed: "closing-monotonic"` provenance and the full delta
table in the summary.

Everything else is unchanged and the invariants are explicit: any **decrease**,
**district/date removal**, base/identity drift, boolean revert, unclassified
field, cap breach, or a changed date **without** the closing signature still
blocks for manual review (`allow_value_changes`), exactly as D1 — outside
closing the gate behaves byte-for-byte as before. Decision detail, evidence
(including the genuine D114 charter-reversal decrease that strict monotonicity
correctly sends to review), and the Sprint 2 test plan:
[`docs/investigations/closing-period-promote-policy-2026-06-03.md`](../investigations/closing-period-promote-policy-2026-06-03.md).
Acceptance fixture:
`packages/collector-cli/src/services/__tests__/fixtures/closing-2026-05-31/`.

### D4 — CPAA is direction-agnostic (amendment 2026-06-04, #1092 / epic #1083)

D3's "counters non-decreasing" criterion blocked in production on its second
day: scheduled run 26947541298 (2026-06-04) refused 9 small counter decreases
across D14/D46/D94 (e.g. D14 `totalPayments` 3774→3764, `paidClubs` 98→97).
These are **legitimate closing reconciliation** — payments get reversed, a
club slips below paid status or under the 20-member threshold; numbers go
down. The operator decision (#1092): a per-unit decrease must NOT block
promotion. The "monotonic / non-decreasing" model is dropped.

The rule is now: **closing-pinned ⇒ direction-agnostic value auto-allow**
for counters — `|Δ| ≤ max(50, 10% × prodValue)` (the same magnitude cap D3
calibrated, applied symmetrically). The cap's job is unchanged: stop a
systematic re-derive inflation or a collapse-to-zero from riding the closing
window; ordinary per-unit downward reconciliation is routine. Provenance is
unchanged — every auto-promoted delta (now possibly negative) lands in the
run-summary table, tagged `autoAllowed: "closing-reconciliation"` (renamed
from `"closing-monotonic"`).

Still blocking, exactly as before (NOT direction-based): a **date or district
removed** from staging vs prod, base/identity drift, plan-boolean reverts,
optionality transitions, unclassified fields, cap breaches in either
direction, and any changed date without the closing signature. The
`closingDecreaseFloor` parameter (D3's relief valve) is removed — it was the
gating criterion, not a tolerance. The epic's original "never auto-promote a
decrease" hard constraint is superseded by this amendment for the
closing-pinned window only; outside closing the gate is unchanged.

End-to-end regression protection: the integrated `runValueDiff` verdict —
the path run 26947541298 actually took, which #1086's unit-level tests missed —
is now pinned by
`packages/collector-cli/src/services/__tests__/SnapshotValueDiffClosingIntegration.test.ts`
against the real captured pair in
`fixtures/closing-2026-05-31-decreases/`.

## Consequences

**Easier**

- A re-derive that silently corrupts values is now caught before prod: the value
  gate blocks by default and names the changed dates for review.
- The full-range rebuild can promote (F1 unblocked) without a gate loosening —
  staging becomes a superset of prod via the seed step, so "additive" stays true.
- The decision is reversible and observable: the gates emit to the run summary,
  and reverting the workflow step restores the prior count-only behavior.

**More difficult / cost**

- The value gate downloads each overlap date's `all-districts-rankings.json` from
  both buckets (≈2 × overlap small JSON reads). Acceptable inside the 240-min
  rebuild job; it would be too heavy for the 30-min daily job, but the gate runs
  for all non-prune modes and the daily overlap is tiny.
- The seed-from-prod step (Sprint 3) adds a one-time `gsutil -m rsync prod→staging`
  before the rebuild. Staging then diverges from "pure rebuild output"; that is
  intended — staging models _what prod would become after promotion_, which is the
  correct thing to diff.
- The digest covers `all-districts-rankings.json` only. Per-district snapshot
  files, time-series, and club-trends are **not** value-diffed yet (a follow-up if
  the rankings digest proves insufficient as a re-derive canary).

## Alternatives Considered

- **Loosen the count gate to allow `STAGING_DATES < PROD_DATES`.** Rejected — it
  removes the only protection against an accidental subtractive rebuild, the exact
  failure F1 describes the gate correctly catching.
- **Scoped per-date promote** (never rewrite `v1/dates.json` downward; rsync only
  the rebuilt dates). Viable and avoids the seed copy, but needs bespoke
  per-date promote logic and a careful manifest-merge (regenerate `dates.json`
  from the union, not staging alone). More moving parts and more ways to corrupt
  the prod index than D2's "make staging a superset, let the existing additive
  rsync run." Kept as a fallback if the seed copy proves too slow/expensive.
- **Value-diff every snapshot artifact** (per-district files + time-series +
  club-trends). Rejected for now as over-scoped — `all-districts-rankings.json` is
  the rolled-up output of the per-district compute, so a change upstream surfaces
  there. Revisit if a re-derive changes a per-district file without moving the
  rollup.
- **Gate on a tolerance** (promote if values changed by < ε). Rejected — a
  re-derive is deterministic; any value change is either intended (logic fix, then
  review + `--allow-value-changes`) or a bug. A tolerance would hide small bugs.
