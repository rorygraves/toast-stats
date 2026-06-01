# Investigation + Runbook — Re-run pipeline 2017→now from raw-csv

**Epic:** [#1031](https://github.com/taverns-red/toast-stats/issues/1031) — Rerun data pipeline Jan 2017 → now, re-derive from raw-csv, validate-first
**Sprint:** 1 ([#1033](https://github.com/taverns-red/toast-stats/issues/1033)) — Investigate (doc-only)
**Date:** 2026-05-31
**Status:** Investigation complete. **Re-scopes Sprints 2–3** — see §5.

> This is a doc-only investigation. It enumerates raw-csv coverage in GCS, confirms how
> `rebuild` mode + the staging→diff→promote path actually behave for a full-range run, and
> hands Sprints 2–3 a concrete plan. **No code changed.** All numbers below are live reads of
> `gs://toast-stats-data-ca` (prod) and `gs://toast-stats-data-staging` (staging) on 2026-05-31.

---

## 1. TL;DR for the operator

- **raw-csv goes back to 2017-02-08, NOT January 2017.** First prefix is `raw-csv/2017-02-08/`.
- **There is a one-program-year hole in raw-csv: PY2021-22.** Collection jumps `2021-07-18 → 2022-08-08`. Months **2021-08 … 2022-06 (11 months) are missing from BOTH raw-csv and prod.** They can only be recovered via the `backfill` (HTTP dashboard) fallback — _if_ the dashboard still serves them.
- **A pure raw-csv re-derive produces FEWER snapshot dates than prod, so the automated promote gate will BLOCK it.** raw-csv = 99 distinct collection months; prod = 152 snapshot dates. Three prod months have **no** raw-csv source (`2017-01`, `2022-07`, `2026-05`) and would be lost.
- **The promote gate validates COUNTS, not VALUES.** For the epic's _"re-derive after logic changes"_ intent, the existing gate gives **zero protection** against a wrong re-derivation — same date/district counts ⇒ `promote=true` unconditionally. Validate-first needs a real **value diff** added in Sprint 2.

---

## 2. Buckets, prefixes, mechanics (confirmed)

| Thing           | Value                                                                                        | Source                                          |
| --------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Prod bucket     | `gs://toast-stats-data-ca`                                                                   | `data-pipeline.yml` env `GCS_BUCKET_PRODUCTION` |
| Staging bucket  | `gs://toast-stats-data-staging`                                                              | `data-pipeline.yml` env `GCS_BUCKET`            |
| raw-csv layout  | `raw-csv/{YYYY-MM-DD}/all-districts.csv` + `district-NN/…`                                   | `gsutil ls`                                     |
| Snapshot layout | `snapshots/{YYYY-MM-DD}/all-districts-rankings.json` + `district_NN.json`                    | `gsutil ls`                                     |
| Manifests       | `v1/dates.json` (`.count`, `.dates[]`), `v1/rankings.json` (`.rankings[]`), `v1/latest.json` | workflow diff step                              |

**`rebuild` mode** (`.github/workflows/data-pipeline.yml`, `workflow_dispatch` input `mode=rebuild`, **240-min** timeout):
discovers dates by listing `gs://${GCS_BUCKET}/raw-csv/` (or uses the `dates` input), then **streams one date at a time** — download raw-csv → `collector-cli transform` → closing-period remap of the snapshot date (CSV "As of" header) → `collector-cli compute-analytics` → upload snapshots+analytics to **staging** → delete the local snapshot dir to conserve disk (time-series / club-trends persist across dates). Implemented by `RebuildService` (`packages/collector-cli/src/services/RebuildService.ts`); it regenerates the `v1/*` manifests at the end. **It is full-range capable in one run** (no hard date limit; the per-date stream is the disk-conservation design).

**Staging→diff→promote** (`data-pipeline.yml:1232–1302`):

- **Diff** (`steps.diff`, lines 1239–1257) compares **whole-range aggregate counts only**: `v1/dates.json.count`, `v1/rankings.json | length`, snapshot-dir count, latest date.
- **Promote gate** (lines 1259–1271): `promote="true"` UNLESS `STAGING_RANKINGS < PROD_RANKINGS` **or** `STAGING_DATES < PROD_DATES` (additive-only / count-monotonic). **No value comparison.**
- **Promote** (lines 1273–1294) runs only if `promote=='true'`: `gsutil -m rsync -r` of `v1/`, `snapshots/`, `time-series/`, `club-trends/`, `config/` staging→prod. **Note: rsync is WITHOUT `-d`** → it is additive/overwrite, it does **not** delete prod objects absent from staging. But `v1/` _is_ overwritten, so a staging manifest with fewer dates would still regress the prod index (which is exactly the case the gate blocks).

**`backfill` fallback** (`BackfillOrchestrator`, `cli.ts` default `startYear=2017`): 3-phase **HTTP CSV download from the Toastmasters dashboard** (discovery → per-district collection → transform), writing into `raw-csv/{date}/`. This is the _only_ way to fill the PY2021-22 hole and the `2017-01` edge — it does **not** read existing raw-csv, it re-fetches from source.

---

## 3. Coverage / gap report (live, 2026-05-31)

- **raw-csv:** 117 collection-date prefixes, **99 distinct months**, span **2017-02-08 → 2026-04-10**. One collection per month except the recent daily run (2026-03 ×10, 2026-04 ×10).
- **prod snapshots (`v1/dates.json.count`):** **152 dates**, span **2017-01-31 → 2026-05-30**. Date count is inflated by daily snapshots: 2026-03 ×10, 2026-04 ×22, 2026-05 ×23 (= 55 of the 152).
- **staging `v1/dates.json.count`:** 152 (currently mirrors prod).

### 3a. The hole: missing from BOTH raw-csv and prod (11 months)

`2021-08, 2021-09, 2021-10, 2021-11, 2021-12, 2022-01, 2022-02, 2022-03, 2022-04, 2022-05, 2022-06`
→ the body of **Toastmasters program year 2021-22**. Recoverable only via `backfill` (HTTP dashboard), contingent on the dashboard serving these historical dates. **Sprint 2 must probe one such date before committing.**

### 3b. Prod-only months — would be LOST by a pure raw-csv re-derive (trips the gate)

`2017-01` (prod `2017-01-31`; raw-csv starts `2017-02-08`), `2022-07`, `2026-05` (23 daily snapshots from the live pipeline; raw-csv ends `2026-04-10`).

### 3c. raw-csv-only months — collection exists, no prod snapshot

`2021-07` (`2021-07-18`), `2026-01` (`2026-01-08`). Almost certainly the **closing-period remap** (Lesson 139): a July collection becomes the prior June-30 year-end snapshot; a Jan-08 collection maps to a Dec-31 freeze. **This means raw-csv calendar month ≠ rebuilt snapshot date** — the gap table is by _collection_ month; the exact rebuilt date set must be obtained from a dry-run transform pass (§5, Sprint 2).

---

## 4. The two findings that re-scope the epic

**F1 — A wholesale "rebuild from raw-csv → auto-promote" CANNOT promote today.**
Staging rebuilt from raw-csv yields ≈99–117 dates; prod has 152 (incl. 55 daily 2026 snapshots + 3 prod-only months with no raw-csv). `STAGING_DATES (≈99) < PROD_DATES (152)` ⇒ the gate sets `promote=false` (`data-pipeline.yml:1265`). The run would complete to staging and **block** at promotion. This is not a bug to "fix" by loosening the gate — it is the gate correctly refusing a subtractive change.

**F2 — The gate cannot validate a re-derivation.** It compares counts, never values (`data-pipeline.yml:1245–1268`). The epic's stated intent includes _"re-derive after logic changes"_ (same dates, corrected values). In that mode counts are identical ⇒ `promote=true` always, and prod is overwritten with **unvalidated** values. "Validate-first" is currently a count check, not a value check.

---

## 5. Re-scoped plan for Sprints 2–3

**Sprint 2 — Backfill probe + a real value-diff gate (code).**

1. **Dashboard reachability probe** for the PY2021-22 hole: run `backfill`/`HttpCsvDownloader` against ONE missing date (e.g. a late-2021 month-end) **dry-run**, confirm the dashboard returns district CSVs. Decide hole = _recoverable_ vs _permanently absent_ and record it on #1031. (If absent, the epic's "Jan 2017 → now" goal is bounded to "the dates the dashboard serves" — that is a product decision for the operator.)
2. **Add a value-aware diff** to the staging→promote path (new step beside `steps.diff`): for the overlap set of dates present in both staging and prod, compare a stable per-date digest (e.g. each district's key metrics in `all-districts-rankings.json`) and surface added / removed / **changed** dates. Promotion for a _re-derive_ must gate on a reviewed value-diff, not only `STAGING_DATES >= PROD_DATES`. TDD: unit-test the digest/diff over fixtures (a changed value must flip the gate); this is code-provable without a CDN write (R2 / preview reads staging).
3. **Decide the promote semantics for a partial-range re-derive**: rebuild writes only raw-csv-backed dates to staging; the prod-only dates (§3b) must be preserved. Options to evaluate and record as an ADR: (a) seed staging from prod then overlay the rebuild (so counts never regress, gate passes, value-diff does the real work), or (b) a scoped per-date promote that never rewrites `v1/dates.json` downward.

**Sprint 3 — Execute the validated full-range re-derive (operator-attended).**

1. Trigger `rebuild` (all raw-csv dates) → staging. Capture the **actual rebuilt date set** (post-remap) and reconcile against §3 expectations.
2. Run the Sprint-2 value-diff; operator reviews added/removed/changed dates.
3. Promote per the Sprint-2 semantics. Verify prod `v1/dates.json.count` did not regress and spot-check 2–3 re-derived dates on the live site.

---

## 6. Reproduce these numbers

```bash
# raw-csv coverage
gsutil ls gs://toast-stats-data-ca/raw-csv/ | sed 's#.*/raw-csv/##;s#/$##' \
  | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' | sort      # 117 dates, 2017-02-08 → 2026-04-10
# prod snapshot index
gsutil cat gs://toast-stats-data-ca/v1/dates.json | jq '.count, .dates[0], .dates[-1]'   # 152, 2017-01-31, 2026-05-30
gsutil cat gs://toast-stats-data-ca/v1/rankings.json | jq '.rankings | length'           # 128
```

## 7. Related

- Lesson 139 — year-end snapshot `sourceCsvDate` falls in July (the §3c remap). `tasks/lessons/139-a-year-end-snapshots-source-date-falls-in-july-so-a-program-year-equality-guard-drops-every-year.md`
- R2 — never assume data exists on the ephemeral runner; the rebuild syncs everything from GCS first.
- R6/R7 — `rebuild` mode + `BackfillOrchestrator` already exist; this epic wires/validates them, it does not rebuild them.
- `docs/runbooks/data-pipeline-recovery.md`, `docs/data-pipeline-flow.md` — adjacent operational docs.
  </content>
