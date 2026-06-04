# Closing-period promote policy — decision doc

**Date:** 2026-06-03
**Issue:** #1084 (epic #1083 Sprint 1, doc-only)
**Amends:** [ADR-009](../architecture-decisions/009-full-range-rederive-promote-semantics.md) (#1034)
**Status:** Decided — policy chosen for Sprint 2 implementation.
**Amended 2026-06-04 (#1092, ADR-009 D4):** the §4 counter rule is now
**direction-agnostic** — see [Amendment](#amendment-2026-06-04-1092--decreases-are-normal-the-counter-rule-is-direction-agnostic)
at the end of this doc. §3(b)'s "decreases must still block" reading and §4's
decrease floor are superseded.

## 1. Problem (verified)

During month-end / program-year closing, the #1034 value gate flips from an
occasional guard into a **daily blocker**:

- The #309 closing remap pins the snapshot DATE to the month-end (`2026-05-31`)
  while TI reconciles dues daily, so the staging snapshot for that **same date**
  carries **new values every day**.
- The value gate blocks any promotion whose overlap dates have changed values.
  Same date + changed values every day ⇒ blocked every day ⇒ prod freezes ⇒ the
  #1072 freshness monitor correctly fires (`pipeline-stale` #1082).

### Evidence (re-verified live, 2026-06-03T22:39Z)

| Fact                                                         | Observation                                                                                                                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prod `snapshots/2026-05-31/all-districts-rankings.json`      | `sourceCsvDate 2026-05-31`, `calculatedAt 2026-06-01T18:39Z` (last promote)                                                                                           |
| Staging same path, two days later                            | `sourceCsvDate 2026-06-02` — the date-pinned remap signature (As-of advanced past the pinned date)                                                                    |
| Scheduled run 26894802577 (2026-06-03, conclusion `success`) | `::error::Promotion BLOCKED — count gate or value gate refused`; overlap = 153 dates                                                                                  |
| Changed districts on the overlap date                        | **102** of the 128 districts — **24** moved counter fields; **78** moved only derived fields (ranks/percents/aggregateScore — zero-sum consequences of others' moves) |
| Direction of counter moves                                   | Mostly small upward (D92 totalPayments +158 = 1.8%; D124 paidClubs +3) — **but 5 districts show genuine decreases** (see §3)                                          |
| Freshness                                                    | `pipeline-stale` #1082 fired at 47.6h manifest age (threshold 26h)                                                                                                    |

The staging/prod pair is preserved as
`packages/collector-cli/src/services/__tests__/fixtures/closing-2026-05-31/`
(staging is overwritten daily; the evidence is otherwise unreproducible).

## 2. Options evaluated

| #   | Option                                                              | Verdict                                                                                                                                     |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Monotonic auto-allow + magnitude cap** (epic's leading candidate) | **Chosen**, scoped to date-pinned closing dates (option 3's detection), with a per-field classification — see §4                            |
| 2   | Closing-period gate mode via ClosingDateRegistry                    | Folded in: the _detection_ question is real, but the registry is the wrong live detector (§5); the "relaxed-but-bounded policy" is option 1 |
| 3   | Magnitude-bounded auto-allow on date-pinned overlap only            | Folded in: date-pinning is the right _scope_; magnitude alone (allowing decreases) violates the hard constraint                             |
| 4   | Status quo + scheduled auto-override                                | Rejected — auto-dispatching `allow_value_changes=true` daily is the gate with extra steps and no review; punts the design                   |

## 3. The finding that shapes the policy: reconciliation is _mostly_ — not purely — monotonic

A naive "every value non-decreasing" rule over all fields would **still block
routine days**, for two distinct reasons found in the live diff:

**(a) Derived fields are zero-sum.** When D124 gains 3 paid clubs, other
districts' `clubsRank` / `aggregateScore` / `distinguishedPercent` legitimately
_worsen_ with no counter change of their own (78 of 102 changed districts were
this). Monotonicity must apply to **raw counters only**, never to
ranks/percents/scores.

**(b) Genuine small reversals occur.** 5 of 24 counter movers decreased:

| District | Decrease                                                                                                  | Reading                                                                |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| D114     | paidClubs 90→89, activeClubs −1, charterPayments 214→193, newCharteredClubs 10→9, totalPayments 4158→4137 | A charter reversal — a chartered club backed out during reconciliation |
| D88      | presidentsDistinguished 7→6                                                                               | DCP status corrected downward                                          |
| D128     | paidClubs 123→122 (payments still rose)                                                                   | Club paid-status correction                                            |
| D44, D50 | totalPayments −1                                                                                          | Single-payment corrections                                             |

These are legitimate upstream truth, **but the epic's hard constraint says
decreases must still block** — they are exactly the class an operator should
eyeball (a charter reversal is also what a data regression looks like). The
policy therefore keeps decreases blocking, and the consequence is stated
honestly in §7: a reversal day requires one manual review, and the block
persists (the staging-vs-prod delta is cumulative) until that review happens.

## 4. The chosen policy — Closing-Pinned Auto-Allow (CPAA)

`evaluatePromote` gains one new path. Everything below applies **only** when
the existing verdict would be "blocked because `changed` is non-empty"; all
other behavior (additive promotes, `removed` always blocks, fail-closed on
read errors) is unchanged.

**Auto-allow a changed overlap set iff ALL of the following hold:**

1. **Every changed date is closing-pinned** (detection in §5). Any changed
   date that is _not_ closing-pinned ⇒ block (that is a re-derive of history,
   the #1034 review case, regardless of the season).
2. **`removed` is empty** (already absolute) and, per changed date, the
   **district set is identical** in staging and prod — a district appearing or
   disappearing on an overlap date blocks (the #1034 D61 protection).
3. Per district, per field, by class:

| Field class       | Fields                                                                                                                                                                                                                                                                           | Rule                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Counters**      | `paidClubs`, `activeClubs`, `totalPayments`, `newPayments`, `aprilPayments`, `octoberPayments`, `latePayments`, `charterPayments`, `distinguishedClubs`, `selectDistinguished`, `presidentsDistinguished`, `smedleyDistinguished`, `clubsWith20PlusMembers`, `newCharteredClubs` | `0 ≤ Δ ≤ max(50, 10% × prodValue)` — non-decreasing, magnitude-capped   |
| **Bases**         | `paidClubBase`, `paymentBase`                                                                                                                                                                                                                                                    | Must be **equal** (fixed at program-year start; any move is an anomaly) |
| **Identity**      | `districtId`, `districtName`, `region`                                                                                                                                                                                                                                           | Must be **equal**                                                       |
| **Plan booleans** | `dspSubmitted`, `trainingMet`, `marketAnalysisSubmitted`, `communicationPlanSubmitted`, `regionAdvisorVisitMet`                                                                                                                                                                  | `false→true` allowed; `true→false` blocks                               |
| **Derived**       | `clubGrowthPercent`, `paymentGrowthPercent`, `distinguishedPercent`, `clubsRank`, `paymentsRank`, `distinguishedRank`, `overallRank`, `aggregateScore`                                                                                                                           | **Excluded** from the check (re-derived, zero-sum across districts)     |

4. **Optionality transitions block:** a field `undefined` in one side and
   present in the other (in any class except Derived) ⇒ block. During closing
   TI does not add columns; a field appearing means the pipeline code changed —
   that is a re-derive review, not reconciliation.
5. **Unknown fields block (exhaustiveness guard):** the classification above
   must be a registry checked by a unit test against
   `DistrictRankingSchema.shape` — a new schema field that is not classified
   fails that test, and at runtime an unclassified changed field
   ⇒ block (fail-closed, R20/L150 spirit).

**If all pass:** `promote=true`, `requiresReview=false`, and the decision JSON
carries `autoAllowed: "closing-monotonic"` plus a per-district delta table for
the run summary (provenance — every auto-promoted change remains visible in
the value-diff summary, per the epic's hard constraints).

**If any check fails:** verdict and messaging exactly as today (blocked,
`allow_value_changes` is the operator override), with reasons naming the
violating date/district/field.

### Magnitude cap rationale — `max(50, 10% × prodValue)` per counter, per district

- Largest observed legitimate move (a **two-day cumulative** delta, because
  prod had frozen): D92 `totalPayments` +158 on 8,995 (1.8%). 10% absorbs
  several frozen days of peak reconciliation.
- Small-base spikes are real: D85 `charterPayments` 160→186 (+26, 16%) — one
  charter lands ~20+ payments at once. The absolute floor of 50 covers these
  without loosening the relative cap on large bases.
- The cap's job is not precision — it is to stop a _systematic_ re-derive
  inflation (every district +30%) or a unit-scale bug (×10) from riding the
  closing window. Anything the cap trips goes to manual review, which is never
  worse than today's behavior.

### Decrease floor — configurable, default 0 (strict)

The counter lower bound is a parameter (`closingDecreaseFloor`, default `0`).
The epic's hard constraint ("never auto-promote a decrease") stays intact at
the default. §3(b) shows small genuine reversals exist; **if** reversal-blocks
prove frequent enough to defeat the freshness goal, relaxing the floor (e.g.
`−max(5, 1%)`) is a one-parameter operator decision with its own ADR note —
not a redesign. This sprint does not relax it.

## 5. Closing detection — the remap signature in bytes the gate already reads

**Decision: detect from the snapshot's own metadata, not the
ClosingDateRegistry.** A changed overlap date `D` is **closing-pinned** iff,
in **staging's** `all-districts-rankings.json` for `D`:

1. `D` is the **last day of its calendar month** (every #309 remap pins to
   month-end), and
2. `metadata.sourceCsvDate > D` (the As-of date advanced past the pinned date —
   TI publishes prior-month data with a current-month As-of _only_ during
   closing), and
3. `sourceCsvDate − D ≤ 31 days` (belt-and-braces window bound; the longest
   closing in `docs/month-end-closing-dates.json` since 2017 is 25 days —
   June 2022 closed 2022-07-25).

Verified live: staging's pinned `2026-05-31` file carries
`sourceCsvDate 2026-06-02` (signature present); prod's last-promoted copy
carries `2026-05-31` (signature absent). ISO date strings compare correctly
across year boundaries (the December→January remap, #309 req 2.3).
Implementation note: compute the month-end and date comparisons on the ISO
strings directly — do not reuse `ClosingPeriodDetector`, whose
`new Date(requestedDate)` parsing introduces a TZ edge the string approach
avoids.

**Why not ClosingDateRegistry:** the registry is a _historical record_
appended by the pipeline run itself — using it as the live detector makes the
gate depend on repo state written by the thing it gates (and it is keyed by
data month, not by "are we still inside the window today"). The signature is
self-contained in the exact file the gate already downloads and parses —
no new I/O, no new dependency. The registry remains the historical record and
the source for the 31-day bound calibration.

**Why not "promote when the snapshot date is unchanged" (bare option 3):**
date-pinned-ness alone also matches a same-day re-run after a code deploy
outside closing (same latest date, re-derived values). The month-end +
As-of-advanced signature is specific to the closing remap.

## 6. Where the rule runs, exactly

- **`SnapshotValueDiff.ts` (pure):** extend `DateDigest` to optionally carry
  the parsed per-district rankings + `sourceCsvDate` for changed-date
  evaluation; add `evaluateClosingAutoAllow(stagingDate, prodDate)` and the
  field-classification registry; `evaluatePromote` consults it when `changed`
  is non-empty. All unit-testable without fs (existing pattern).
- **`SnapshotValueDiffLoader.ts`:** already parses every
  `all-districts-rankings.json`; passes the raw rankings through for overlap
  dates. No new reads.
- **`data-pipeline.yml`:** no logic change. The gate step already consumes
  `.promote` from the JSON; the summary rendering adds the `autoAllowed` line
  and delta table. `allow_value_changes` keeps exactly its current meaning
  (manual override for everything CPAA does not cover).
- **Outside closing:** no changed date carries the signature ⇒ CPAA never
  engages ⇒ the gate behaves byte-for-byte as today.

## 7. Residual risks, stated honestly

- **A monotone, capped, systematic error during closing auto-promotes.** A
  re-derive deployed mid-closing that inflates every district ≤10% (and
  doesn't touch bases/identity/history) would ride the window. Mitigations:
  full delta provenance in the run summary; promotion is recoverable
  (deterministic re-derive from raw-csv + re-promote); historical-date changes
  still block.
- **A genuine reversal freezes prod again until one manual review.** The
  staging-vs-prod diff is cumulative, so D114's charter reversal blocks today
  and every following day until an operator reviews once with
  `allow_value_changes=true` — after which subsequent monotone days
  auto-promote against the new prod baseline. This window: 1 review instead
  of ~daily. If experience shows reversals are frequent, §4's decrease floor
  is the designed relief valve (operator decision).
- **"Routine day" is now defined**, satisfying the epic's acceptance wording:
  a closing day whose counter deltas are all `0 ≤ Δ ≤ cap` with no
  set/base/identity/boolean violations. 2026-06-02 was routine (24 movers,
  all upward); 2026-06-03's cumulative diff was **not** (5 reversal
  districts) — and the policy blocking it is correct behavior, not a failure.

## 8. Sprint 2 scope (re-scoped from this decision)

1. Field-classification registry + exhaustiveness unit test vs
   `DistrictRankingSchema.shape` (RED first against the fixture pair).
2. `evaluateClosingAutoAllow` + `evaluatePromote` wiring + signature detection
   (pure functions; fixture-driven tests: the 2026-05-31 pair must **block**
   as-is (D114/D88/D128/D44/D50 named in reasons), and must **auto-allow**
   with the 5 reversal districts' prod rows substituted into staging — both
   directions from one fixture).
3. Edge tests: non-pinned changed date blocks; pinned + non-month-end blocks;
   signature absent blocks; cap-exceeded blocks; base/identity/boolean-revert
   block; optionality transition blocks; unknown-field blocks; December
   cross-year signature.
4. Loader pass-through + decision JSON `autoAllowed` + summary delta table.
5. Workflow summary rendering (display only).
6. Live verification: next closing-window day with monotone deltas promotes
   with zero manual input; #1072 monitor stays quiet; evidence on the epic.

## Amendment 2026-06-04 (#1092) — decreases are normal; the counter rule is direction-agnostic

The §4 policy survived one day of production. The 2026-06-03 manual review
(`allow_value_changes=true`, prod promoted 22:32Z) reset the baseline; the
next scheduled run
([26947541298](https://github.com/taverns-red/toast-stats/actions/runs/26947541298),
2026-06-04) blocked again — on **9 decreases across D14/D46/D94** (D14
`totalPayments` 3774→3764 and `paidClubs` 98→97, D46
`clubsWith20PlusMembers` 28→27, …). §7's "a reversal day requires one manual
review" prediction was wrong in frequency: reversals are not occasional, they
are part of the **daily texture of reconciliation** (payments reversed, clubs
slipping under thresholds). A policy that needs a manual override most closing
days defeats the epic's freshness goal.

**Operator decision (2026-06-04, #1092):** a per-unit decrease must NOT block
promotion. The "monotonic / non-decreasing" model is dropped entirely:

- **Counter rule (replaces §4 row 1):** `|Δ| ≤ max(50, 10% × prodValue)` —
  the same calibrated magnitude cap, applied **symmetrically**. Direction is
  no longer a criterion; only an implausible magnitude (systematic inflation,
  collapse-to-zero on a real base) blocks.
- **`closingDecreaseFloor` is removed**, not relaxed — §4's "configurable
  floor" framing treated direction as the gate with a tolerance knob; the
  amendment removes direction from the gate entirely.
- **Everything else in §4–§5 stands:** subtractive date/district removals,
  base/identity drift, plan-boolean reverts, optionality transitions,
  unclassified fields, and non-closing-pinned changed dates still block.
  Provenance tag renamed `closing-monotonic` → `closing-reconciliation`.
- **The missed test layer:** #1086 verified the pure functions; the blocked
  run proved the integrated verdict (`runValueDiff` → `evaluatePromote` →
  CPAA) was the surface that mattered. The real 2026-06-04 staging/prod pair
  (53 counter moves, 9 decreases) is preserved as
  `fixtures/closing-2026-05-31-decreases/` in the `runValueDiff` directory
  layout, and an integration test pins `decision.promote === true` on it
  end-to-end (`SnapshotValueDiffClosingIntegration.test.ts`).

Residual risk (replaces §7 bullet 2): a genuine systematic error that moves
every district **downward** ≤ cap during closing would now auto-promote, the
mirror of §7 bullet 1's upward case — same mitigations (full delta
provenance, deterministic re-derive recovery, historical dates still block).
