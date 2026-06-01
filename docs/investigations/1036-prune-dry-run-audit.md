# Prune `--dry-run` audit + layer-coverage report (#1036)

**Epic:** [#1032](https://github.com/taverns-red/toast-stats/issues/1032) — Schedule data thinning
**Sprint:** 1 (Investigate, doc-only) — no code changes
**Date:** 2026-06-01
**Author:** sprint-runner session `sprint-1036`

---

## TL;DR — **Go/No-Go: 🔴 NO-GO** for putting the current `prune` on a cron against prod

The `prune` command's _classification_ is correct, but three structural gaps make
the existing `data-pipeline.yml mode=prune` path unsafe/ineffective to schedule
as the epic's "data thinning" mechanism:

1. **Wrong bucket.** The prune workflow operates on **staging**
   (`toast-stats-data-staging`), and the promote step copies staging→prod with
   `gsutil rsync` **without `-d`** — so deletions _never propagate to prod_
   (`toast-stats-data-ca`, the bucket `cdn.taverns.red` serves). A scheduled
   prune would thin staging while prod keeps growing.
2. **Two of four layers are never touched.** `prune` only deletes `raw-csv/` and
   `snapshots/` directories. **`time-series/` and `club-trends/` are neither
   synced nor pruned** — and structurally they _can't_ be pruned by directory
   deletion (see §3). This is the coverage gap the epic hypothesized — confirmed.
3. **Orphaned daily snapshots.** 44 prod snapshot dates (2026-04-11 … 2026-05-31)
   have no matching `raw-csv/` date. Because prune keys snapshot deletion off the
   surviving raw-csv→snapshot mapping, these daily snapshots are **never cleaned**.

Methodology note: dispatching `mode=prune, dry_run=true` would have run against
**staging**, not prod. To answer the "against prod" question faithfully, the
prune classifier (`PruneService.prune(dryRun=true)`) was run directly against the
real prod bucket's `raw-csv/` metadata (read-only). Raw artifacts:
`/tmp/prune-prod-result.json` (full classification), reproduced summary below.

---

## 1. What `prune` actually keeps vs. removes (prod, dry-run)

Source: `PruneService` (`packages/collector-cli/src/services/PruneService.ts`),
run against `gs://toast-stats-data-ca/raw-csv/` metadata on 2026-06-01.

| Metric                           | Value                   |
| -------------------------------- | ----------------------- |
| Total raw-csv dates classified   | **117**                 |
| Kept                             | **4**                   |
| Pruned                           | **113**                 |
| Raw-csv date range               | 2017-02-08 → 2026-04-10 |
| Pruned date range                | 2017-02-08 → 2026-04-10 |
| Approx. raw-csv storage in scope | ~850 MB (43.2k objects) |

### Kept dates (raw-csv → snapshot)

| raw-csv date | snapshot date | reason                           |
| ------------ | ------------- | -------------------------------- |
| 2026-03-30   | 2026-03-30    | Penultimate snapshot (#203)      |
| 2026-03-31   | 2026-03-31    | Month-end snapshot               |
| 2026-04-06   | 2026-03-31    | Month-end (closing-period remap) |
| 2026-04-07   | 2026-03-31    | Month-end (closing-period remap) |

**Classification correctness: ✅ correct.** Keep = `isMonthEnd || isPenultimate`
on the _snapshot_ date (the penultimate keeper was added in #203 to survive the
1-day lag before month-end reconciliation). The two closing-period dates
(2026-04-06/07) carry `metadata.json` with `isClosingPeriod`, and
`ClosingPeriodDetector` correctly remaps them to the 2026-03-31 month-end. Only
**5 of 117** raw-csv dates have a `metadata.json` at all; the other 112 fall
through to "non-closing-period → snapshot date = collection date", which is the
intended default.

> ⚠️ The 4-kept result is low **only because raw-csv currently holds mostly
> daily 2026 dates plus a long tail of historical non-month-end dates back to
> 2017**. The 96 historical month-end _snapshots_ (2017-01-31 … 2025-12-31) have
> no surviving raw-csv date, so they aren't in scope and are not at risk.

---

## 2. Layer coverage — the core question

| Layer               | Pruned by `prune`? | Storage shape                           | Notes                                                        |
| ------------------- | ------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `raw-csv/{date}/`   | ✅ yes             | per-date dir                            | deleted for non-keepers                                      |
| `snapshots/{date}/` | ⚠️ partial         | per-date dir                            | only when a kept/pruned **raw-csv** date maps to it (see §3) |
| `time-series/`      | ❌ **no**          | per-district, per-**program-year** file | never synced or touched                                      |
| `club-trends/`      | ❌ **no**          | per-program-year, per-district file     | never synced or touched                                      |

### Why time-series / club-trends can't be pruned the same way

They are **not** per-date directories. Layout:

```
time-series/district_NN/2025-2026.json     ← one file per district per program year
club-trends/2025-2026/district_NN.json     ← one file per program year per district
```

Each file holds the **full daily series inline**. Verified on
`district_01/2025-2026.json` (time-series) and `2025-2026/district_01.json`
(club-trends): both contain **64 distinct dates**, month-end-only for
2025-07 … 2026-02, then **daily** from ~March 2026 onward (last three:
2026-05-29, 2026-05-30, 2026-05-31). So the non-month-end daily granularity the
epic wants thinned **does live inside these files** — but thinning it means
**rewriting each program-year JSON to drop non-month-end array entries**, a
read-modify-write op, not a directory `rm`. The current `prune` does neither.

Prod inventory (both layers identical in staging and prod):
`time-series/` = 1221 objects, `club-trends/` = 1089 objects.

---

## 3. Latent correctness bugs in the GCS-deletion step

`data-pipeline.yml` Prune Step 3 (`[prune] Delete pruned dates from GCS`) deletes
by diffing GCS **snapshot** dates against surviving local **snapshot** dates,
then removes both `snapshots/${D}/` **and** `raw-csv/${D}/` for the same date
string `D`. Two problems:

- **Orphaned daily snapshots (live now).** 44 prod snapshot dates
  (2026-04-11 … 2026-05-31) have no matching `raw-csv/` date. They survive the
  local prune (nothing maps to them), stay in `LOCAL_DATES`, and are therefore
  **never deleted** — immortal daily snapshots accumulating in prod.
- **Closing-period raw-csv orphan (latent).** raw-csv dirs are keyed by
  _collection_ date; snapshot dirs by _snapshot_ date. For a closing-period
  **non-keeper** (snapshot ≠ collection), Step 3 would delete
  `raw-csv/${snapshotDate}/` (wrong / non-existent) and leave the real
  `raw-csv/${collectionDate}/` orphaned. No such case exists in current prod
  data, but the keying is incorrect and will bite once a non-month-end closing
  period appears.

---

## 4. Go/No-Go decision

**🔴 NO-GO** — do not schedule `mode=prune` on a cron as the epic's thinning
mechanism in its current form. It would (a) act on the wrong bucket, (b) leave
2 of 4 layers and 44 orphan snapshots un-thinned, and (c) carry a latent
mis-keyed deletion. The _classifier_ is sound and reusable; the _plumbing_ around
it is not ready to be unattended-destructive.

---

## 5. Recommended Sprint 2 scope

Sprint 2 (#1037) is **deferred out of autonomy** (operator-attended, per the epic
note) — destructive cron work. This audit feeds it:

1. **Target the prod bucket** (or fix promote to `rsync -d` / a delete-mirror) so
   thinning actually reaches `cdn.taverns.red`. Decide: prune-then-promote vs.
   prune-prod-directly. Whichever, keep `dry_run` the default and require an
   explicit opt-in to delete (R-rule spirit: destructive default = off).
2. **Extend coverage to `time-series/` and `club-trends/`** via a
   read-modify-write thinner that filters each program-year JSON's inline series
   down to month-end (+ penultimate) dates, then re-uploads. Reuse the
   `isLastDayOfMonth`/`isPenultimateDayOfMonth` predicates already in
   `PruneService`. Report these layers in the prune JSON
   (`deletedTimeSeriesPoints`, `deletedClubTrendsPoints`) — the epic flagged the
   reporting gap.
3. **Fix the snapshot/raw-csv keying** in Step 3: drive deletion off the
   classifier's `classifications[]` (it already emits both `rawCsvDate` and
   `snapshotDate`), not off a re-derived snapshot-date diff. This also closes the
   44 orphan daily snapshots.
4. **Guardrails before unattended runs:** a dry-run summary gate, a max-delete
   safety cap, and a post-prune freshness assertion (cf. Lesson 107 — monitor the
   output, not the scheduler).

---

## Appendix — reproduction

```bash
# read-only: classify prod raw-csv without deleting anything
gsutil -m rsync -r gs://toast-stats-data-ca/raw-csv/ /tmp/prune-prod-audit/raw-csv/
node -e "import('.../packages/collector-cli/dist/services/PruneService.js').then(async m => {
  const r = await new m.PruneService({cacheDir:'/tmp/prune-prod-audit'}).prune(true)
  console.log(r.totalDates, r.keptDates, r.prunedDates)
})"   # → 117 4 113
```

Layer inventory (`gsutil ls -r … | grep -c`): raw-csv 117 dates, snapshots 154
dates, time-series 1221 objs, club-trends 1089 objs (prod `toast-stats-data-ca`).
