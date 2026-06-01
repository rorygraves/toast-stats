# Runbook — Full-range pipeline re-derive (Jan 2017 → now)

**Epic:** [#1031](https://github.com/taverns-red/toast-stats/issues/1031) — Rerun pipeline 2017→now
**Sprint that produced this doc:** 3 ([#1035](https://github.com/taverns-red/toast-stats/issues/1035)) — documentation only
**Builds on:** Sprint 1 gap report ([`docs/investigations/2017-rerun-raw-csv-coverage.md`](../investigations/2017-rerun-raw-csv-coverage.md)), Sprint 2 value-gate ([ADR-009](../architecture-decisions/009-full-range-rederive-promote-semantics.md))
**Promotion contract:** [ADR-002 data-promotion flow](../architecture-decisions/002-staging-environment.md) (still in force; frontend half superseded)

> **⚠️ This runbook is executed by the operator, by hand, when ready.** No sprint and
> not the autonomous runner pulls this trigger. Every step below is a deliberate
> operator action against **prod GCS** and **real CI compute**. Read the whole doc
> once before starting. The actual rebuild touches `gs://toast-stats-data-ca` (prod)
> only at the final promote — everything before that lands in
> `gs://toast-stats-data-staging` and is reversible.

---

## 0. What this operation does (one paragraph)

Re-derive every month-end snapshot + analytics from **Jan 2017 → now** out of the
raw-csv **already stored in GCS** (no re-scrape), into the **staging** bucket, then
diff staging vs prod with **two gates** (count + value), review the changed dates,
and promote staging → prod only on a clean go/no-go. Two intents are served by the
same path: **backfilling history** (new dates → additive, auto-promotes) and
**re-deriving after a logic change** (same dates, corrected values → blocked until
the operator reviews the value-diff and re-runs with `allow_value_changes=true`).

---

## 1. Buckets, workflow, primitives (confirmed in Sprint 1)

| Thing             | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| Prod bucket       | `gs://toast-stats-data-ca` (`GCS_BUCKET_PRODUCTION`)          |
| Staging bucket    | `gs://toast-stats-data-staging` (`GCS_BUCKET`)                |
| Workflow          | `.github/workflows/data-pipeline.yml` → `workflow_dispatch`   |
| Re-derive mode    | `mode=rebuild` (lists `raw-csv/`, streams one date at a time) |
| Implemented by    | `RebuildService` (`packages/collector-cli/src/services/`)     |
| Value gate        | `collector-cli value-diff` (ADR-009 D1)                       |
| Manifests touched | `v1/dates.json`, `v1/rankings.json`, `v1/latest.json`         |

**`rebuild` does the full range in one run.** It discovers dates by listing
`gs://${GCS_BUCKET}/raw-csv/` (or uses the `dates` input), and for each date:
download raw-csv → `transform` (with closing-period date remap — Lesson 139) →
`compute-analytics` → upload snapshots+analytics to **staging** → drop the local
snapshot dir (disk conservation; time-series / club-trends persist across dates) →
regenerate `v1/*` manifests at the end. No hard date cap.

---

## 2. Pre-flight checks (carried from Sprint 1 + Sprint 2)

Run these **before** dispatching. They take minutes and prevent a wasted 2–4h run.

### 2a. Coverage / known gaps (Sprint 1, live 2026-05-31 — re-confirm)

```bash
# raw-csv coverage: expect 2017-02-08 → most-recent, one collection/month
gsutil ls gs://toast-stats-data-ca/raw-csv/ | sed 's#.*/raw-csv/##;s#/$##' \
  | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' | sort
# prod snapshot index (the count the gate compares against)
gsutil cat gs://toast-stats-data-ca/v1/dates.json | jq '.count, .dates[0], .dates[-1]'
```

Known facts to expect (re-verify, don't assume):

- **raw-csv starts 2017-02-08, NOT January 2017.** prod has a `2017-01-31`
  snapshot with **no raw-csv source**.
- **PY2021-22 hole:** `2021-08 … 2022-06` (11 months) missing from **both**
  raw-csv and prod. A pure raw-csv re-derive does **not** recover these — only
  the `backfill` (HTTP dashboard) fallback can, and only if the dashboard still
  serves them. **Out of scope for a raw-csv re-derive.**
- **Prod-only months with no raw-csv:** `2017-01`, `2022-07`, `2026-05+` (daily
  live snapshots past the last raw-csv date). A pure rebuild would _not_
  regenerate these → without the §3 seed step the count gate **blocks** (correctly).
- **Collection month ≠ rebuilt snapshot date** for July/January collections (the
  closing-period remap). The exact rebuilt date-set is only known after the run.

### 2b. Gates are armed (Sprint 2 / ADR-009)

```bash
# value-diff command is present in the built CLI
npx collector-cli value-diff --help 2>&1 | head -5
# both gate steps exist in the workflow
grep -n "Diff staging vs production\|Value diff staging\|Promote staging to production" \
  .github/workflows/data-pipeline.yml
```

### 2c. Nothing else is mid-flight

```bash
# the workflow has a concurrency group 'data-pipeline' (no overlap) — confirm idle
gh run list --workflow=data-pipeline.yml --limit 5
```

Do **not** start while a daily run is active — it shares the staging bucket.

---

## 3. Seed staging from prod FIRST (ADR-009 D2 — mandatory for full-range)

A pure raw-csv rebuild writes ~99–117 dates; prod has more (~152, incl. the daily
2026 snapshots + the 3 prod-only months). Promoting that directly is **subtractive**
and the count gate blocks it. **Seed staging from prod, then rebuild over it**, so
staging becomes a _superset_ of prod: the prod-only dates survive (rebuild never
touches them), the count gate passes, and the **value gate does the real work**.

```bash
# One-time copy prod → staging BEFORE dispatching the rebuild.
# (additive rsync, no -d: brings staging up to prod's full date set + time-series base)
gsutil -m rsync -r gs://toast-stats-data-ca/v1/          gs://toast-stats-data-staging/v1/
gsutil -m rsync -r gs://toast-stats-data-ca/snapshots/   gs://toast-stats-data-staging/snapshots/
gsutil -m rsync -r gs://toast-stats-data-ca/time-series/ gs://toast-stats-data-staging/time-series/
gsutil -m rsync -r gs://toast-stats-data-ca/club-trends/ gs://toast-stats-data-staging/club-trends/
gsutil -m rsync -r gs://toast-stats-data-ca/config/      gs://toast-stats-data-staging/config/

# Confirm staging now mirrors prod's date count before rebuilding:
gsutil cat gs://toast-stats-data-staging/v1/dates.json | jq '.count'   # should == prod count
```

Seeding also gives the rebuild the correct cross-date `time-series`/`club-trends`
base (the rebuild syncs those from `GCS_BUCKET`=staging at start — `R9`/`R2`).

---

## 4. Dispatch the rebuild (copy-pasteable)

**Full range, all districts, re-derive from raw-csv:**

```bash
gh workflow run data-pipeline.yml \
  --repo taverns-red/toast-stats \
  -f mode=rebuild
  # (no `dates` → discovers ALL dates in raw-csv/; no `districts` → all districts)
  # (do NOT pass allow_value_changes yet — first run REVIEWS, see §6)
```

Watch it:

```bash
gh run watch "$(gh run list --workflow=data-pipeline.yml --limit 1 --json databaseId --jq '.[0].databaseId')" \
  --repo taverns-red/toast-stats
```

Inputs reference (`workflow_dispatch`):

| Input                 | For this run | Notes                                                       |
| --------------------- | ------------ | ----------------------------------------------------------- |
| `mode`                | `rebuild`    | the re-derive primitive                                     |
| `dates`               | _(empty)_    | empty = all raw-csv dates; or `2017-02-08,2017-03-…` subset |
| `districts`           | _(empty)_    | empty = all districts                                       |
| `force`               | `false`      | rebuild recomputes regardless                               |
| `allow_value_changes` | `false`      | **first run = review only.** Flip to `true` only after §6   |

---

## 5. Duration & cost (size it explicitly — the 240-min cap is NOT for this)

The workflow's `timeout-minutes` is **240** for `rebuild` (vs 30 for daily). That
cap was sized for a _normal_ date set, not a 9-year all-district reprocess — budget
against it explicitly.

| Driver                     | Estimate                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dates to rebuild           | ~99–117 (raw-csv months) + daily 2026 dates already in staging                                                                                   |
| Per-date stream            | ~1 min (transform + compute-analytics + upload), per workflow comment                                                                            |
| **Rebuild wall time**      | **~1.5–2.5 h** for ~100–150 dates — **inside the 240-min cap, but not by a wide margin.** If it trends past ~200 min, see §8 (split by `dates`). |
| Value-gate downloads       | 2 × overlap small JSON reads (`xargs -P 16`), ~100 dates → minutes                                                                               |
| Promote rsync              | additive (new/changed objects only) → minutes                                                                                                    |
| **GitHub Actions compute** | ~2–4 h of one `ubuntu-latest` runner. Negligible $ on this plan.                                                                                 |
| **GCS egress / ops**       | rebuild reads raw-csv once + writes staging; value-gate reads small JSON; promote rsync writes only deltas. Bounded, single-digit-GB class.      |

**If the rebuild risks exceeding 240 min:** split into ranges via the `dates`
input (e.g. 2017–2020, 2021–2023, 2024–now) across sequential dispatches. Each
writes to the same staging bucket additively; run the diff/promote only after the
final range lands.

---

## 6. Read the diff (the run's GitHub Step Summary)

Two gates run after the rebuild, both written to the run summary:

**Count gate** (`steps.diff`) — additive guard:

| Metric           | Read as                                                      |
| ---------------- | ------------------------------------------------------------ |
| Dates in index   | staging **≥** prod required, else `❌ Blocked (subtractive)` |
| Districts ranked | staging **≥** prod required                                  |
| Latest date      | `⚠ changed` is expected if the rebuilt latest differs        |

With the §3 seed, staging is a superset → count gate should read **✅ Safe (additive)**.
If it reads `❌ Blocked (subtractive)`, the seed step was skipped or incomplete —
**do not override**; re-seed (§3) and re-run. This block is the gate working.

**Value gate** (`steps.valuediff` / `collector-cli value-diff`, ADR-009 D1) —
compares a per-date value digest over the **overlap** set (dates in both buckets):

- **Added: N** — new dates (history backfill). Additive, fine.
- **Removed: N** — a date in prod absent from staging. **Always blocks**, even with
  the override. If non-zero, staging is missing a date prod has → re-seed (§3).
- **Changed: N** — overlap dates whose re-derived **values differ** from prod. This
  is the re-derive signal. The summary lists each changed date + how many districts
  moved. **This is what you review.**

Digest excludes volatile metadata (`calculatedAt`, `csvFetchedAt`, `fromCache`,
version stamps) and is order-independent — a non-zero `Changed` is a _real_ value
difference, not noise.

**Interpreting `Changed`:**

- **Expected** if this run follows an intentional analytics/logic change → spot-check
  a few listed dates against the change you made; if they match intent, proceed to §7.
- **Unexpected** (you didn't change logic) → a re-derive should be deterministic.
  Investigate before promoting; **do not** set `allow_value_changes`. Abort (§8).

---

## 7. Promote (go / no-go)

The **first** dispatch (§4) runs `allow_value_changes=false`. If there were any
changed overlap dates, the value gate **blocks** and prod is untouched — by design.
To promote a reviewed re-derive, re-dispatch with the override:

```bash
gh workflow run data-pipeline.yml \
  --repo taverns-red/toast-stats \
  -f mode=rebuild \
  -f allow_value_changes=true        # ONLY after the go/no-go below passes
```

Promotion fires only when **both** gates pass
(`steps.diff.outputs.promote == 'true' && steps.valuediff.outputs.value_promote == 'true'`)
and rsyncs `v1/`, `snapshots/`, `time-series/`, `club-trends/`, `config/`
staging → prod (additive, no `-d`).

### Go / No-Go checklist (tick every box before flipping the override)

- [ ] §3 seed completed — staging `dates.count` ≥ prod `dates.count`.
- [ ] Count gate read **✅ Safe (additive)** — `Dates`/`Districts` deltas ≥ 0.
- [ ] Value gate **Removed = 0** (no prod date dropped).
- [ ] Every **Changed** date is **explained** by an intended logic change (or
      `Changed = 0` for a pure history backfill).
- [ ] Spot-checked 2–3 changed dates' values against intent.
- [ ] No active daily pipeline run (concurrency idle).
- [ ] A prod restore point exists (§8 — note current `v1/latest.json` + a snapshot
      manifest copy).
- [ ] You (operator) have decided to promote, knowingly, by hand.

If any box is unchecked → **No-Go.** Abort (§8); do not pass `allow_value_changes`.

### Post-promote verification

```bash
# prod index did not regress
gsutil cat gs://toast-stats-data-ca/v1/dates.json | jq '.count'   # ≥ pre-run count
# latest manifest refreshed
curl -s https://storage.googleapis.com/toast-stats-data-ca/v1/latest.json | jq '.latestSnapshotDate, .generatedAt'
```

Then spot-check 2–3 re-derived dates on the live site (https://ts.taverns.red) —
pick dates the value-diff flagged as `Changed` and confirm the corrected values
render.

---

## 8. Abort / rollback

**Before promote (staging only):** nothing in prod changed. Just stop — leave
staging as-is or re-seed (§3) and retry. No rollback needed.

**Promote blocked by a gate:** intended. Prod is unchanged. The "Promotion blocked"
step prints which gate refused. Fix the cause (re-seed for a count/Removed block;
investigate values for an unexpected `Changed`), don't loosen the gate.

**After a bad promote (prod corrupted):** the promote rsync is additive (no `-d`),
so it **overwrote** changed objects but did not delete prod-only ones. To restore:

1. **Capture a restore point _before_ promoting** (part of the go/no-go) — the
   cheapest rollback is a known-good copy:
   ```bash
   # snapshot prod's manifests + a tag of the moment, BEFORE step 7
   gsutil cp gs://toast-stats-data-ca/v1/latest.json /tmp/prod-latest-pre-rerun.json
   gsutil cp gs://toast-stats-data-ca/v1/dates.json  /tmp/prod-dates-pre-rerun.json
   ```
2. If staging still holds the prior good prod state (it does, if you seeded from a
   good prod and the bad values came from the rebuild), the fastest recovery is to
   re-derive correctly into staging and re-promote — prod self-heals on the next
   good additive promote because the manifests get overwritten forward.
3. For object-level restore, GCS **object versioning** on the prod bucket (if
   enabled) lets you `gsutil cp` a prior generation back. Verify versioning state
   first: `gsutil versioning get gs://toast-stats-data-ca`. If it is off, the
   pre-promote manifest copies in step 1 are your only restore point — treat them
   as mandatory.
4. Worst case: re-run the daily pipeline (`mode=daily`) to regenerate the latest
   date and refresh `v1/latest.json`, then a corrective `rebuild` for the affected
   historical dates.

---

## 9. Related

- Sprint 1 gap report — [`docs/investigations/2017-rerun-raw-csv-coverage.md`](../investigations/2017-rerun-raw-csv-coverage.md)
- ADR-009 — value-aware gate + seed-from-prod — [`docs/architecture-decisions/009-full-range-rederive-promote-semantics.md`](../architecture-decisions/009-full-range-rederive-promote-semantics.md)
- ADR-002 — data-promotion flow (in force) — [`docs/architecture-decisions/002-staging-environment.md`](../architecture-decisions/002-staging-environment.md)
- Daily recovery runbook — [`docs/runbooks/data-pipeline-recovery.md`](data-pipeline-recovery.md)
- Pipeline mechanics — [`docs/data-pipeline-flow.md`](../data-pipeline-flow.md)
- Lesson 139 — closing-period remap (July collection → prior June-30 year-end)
- `R2` (sync from GCS first), `R9` (GCS-backed store pattern), `R11` (gates are ANDed, not replaced)
  </content>
  </invoke>
