# ADR-002: Staging Environment and Deployment Flow

**Status**: Partially superseded (2026-05)
**Date**: 2026-04-10

> **⚠️ Partially superseded — read this first.** This ADR bundled two flows that have since diverged:
>
> - **Data-promotion flow (§"How each change type flows" b, §"Data Promotion", §"Rollback" data) — STILL IN FORCE.** The daily `data-pipeline.yml` writes to the staging bucket `gs://toast-stats-data-staging` (`GCS_BUCKET`), diffs staging vs production (additive→promote / subtractive→block), and `rsync`s staging→production on an additive-only diff (#316). This is the current production data architecture and the authoritative reference for any pipeline rerun/backfill (see #1031).
> - **Frontend deployment flow (§a/c/d — deploy to `staging.ts.taverns.red` → Playwright smoke → auto-promote to prod) — SUPERSEDED.** Replaced by:
>   - **[ADR-003](003-staging-bucket-cors-preview-channels.md)** — per-PR **Firebase preview channels** (`pr-preview.yml`) replaced the persistent staging _site_ for verification. The `staging-toast-stats` Firebase target now only hosts ephemeral preview channels, not a smoke-test-and-promote pipeline.
>   - **[ADR-004](004-release-gated-production-deploy.md)** — frontend prod deploys are now **release-gated** (fire on a release-please release via `deploy.yml`), not auto-promoted after a staging smoke test. There is no workflow performing the §a/c/d staging-site→smoke→auto-promote flow.
>
> Net: the **data half is live**, the **frontend half is dead**. The original text below is preserved for historical record.

**Context**: The site is in production, shared with all Toastmasters district directors worldwide. Every commit to main deploys directly to production via Firebase Hosting. Multiple incidents have reached users before detection: closing period data corruption (#309), Distinguished count discrepancy (#311), lighthouse CI failures, stale dates in dropdown. Most incidents were **pipeline data bugs**, not frontend bugs — CI catches code issues but can't catch bad data.

## Decision

Implement a two-environment deployment flow with **separate GCS buckets** for staging and production.

### Environments

| Component        | Production                   | Staging                         |
| ---------------- | ---------------------------- | ------------------------------- |
| **Frontend**     | `ts.taverns.red`             | `staging.ts.taverns.red`        |
| **GCS Bucket**   | `gs://toast-stats-data-ca`   | `gs://toast-stats-data-staging` |
| **CDN**          | `cdn.taverns.red`            | Direct GCS public URL (no CDN)  |
| **GA4**          | `G-CDWQYHC2Z3`               | Disabled                        |
| **Deploys from** | Promotion after staging gate | `main` (automatic)              |

### How each change type flows

#### a) Frontend change only

```
PR merged → CI passes → Deploy frontend to staging site
  → Playwright smoke tests against staging (reads staging GCS bucket)
  → Pass: auto-promote frontend to production
  → Fail: block, alert
```

Staging bucket has the same data as production (synced by last daily pipeline run). Frontend changes are verified against real data before users see them.

#### b) Pipeline change only

```
PR merged → next daily pipeline run:
  1. Scrape → transform → compute-analytics
  2. Write to STAGING bucket (not production)
  3. Diff staging bucket vs production bucket
  4. Auto-promote if diff is "additive only"
  5. Block if diff is "subtractive" (files missing, district count dropped)
  6. rsync staging → production bucket on promotion
```

Pipeline code changes are exercised against real Toastmasters data and validated before reaching production.

#### c) Pipeline change requiring frontend change (coordinated)

```
Both changes merge to main →
  1. Deploy frontend to staging (new code, reads staging bucket)
  2. Trigger staging pipeline rebuild (1 date) → staging bucket gets new data
  3. Smoke tests verify frontend + new data together
  4. Promote both: frontend to production + rsync staging → production bucket
```

#### d) Frontend change requiring pipeline change

Same as (c) — the pipeline must run first to produce the data the frontend expects.

### Data Promotion: Diff-Based, Not Rule-Based

**Key principle:** Don't encode brittle heuristics about what "correct" data looks like. Instead, diff staging output against current production and categorize changes.

```
After pipeline writes to staging bucket:

1. Diff staging vs production:
   - Files added? (expected — new date's data)
   - Files removed? (unexpected — flag)
   - latest.json changed? (expected on daily runs)
   - District count in rankings changed? (show delta)
   - Any production file missing from staging? (flag)

2. Categorize the diff:
   ADDITIVE: new files, updated manifests → auto-promote
   SUBTRACTIVE: missing files, fewer districts → BLOCK + alert
   NEUTRAL: identical → auto-promote (no-op)

3. Generate human-readable diff summary in workflow log
```

This catches regressions (data disappearing, districts dropping) without encoding business rules about closing periods, date ranges, or field values that change every month.

| Past Incident                | Diff would show                                        | Action                                                              |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| #295 wrong latest.json       | latest.json: `2026-03-31` → `2025-04-04`               | SUBTRACTIVE (date went backwards) → block                           |
| #300 Zod strips cspSubmitted | Snapshot file sizes significantly smaller              | Visible in diff summary                                             |
| #309 stray April date        | New snapshot dir `2026-04-05/` added                   | ADDITIVE — logged but not blocked (expected daily)                  |
| #309 stray date in index     | `district-snapshot-index.json` changed, new date added | ADDITIVE — logged. Smoke test on staging would catch dropdown issue |
| #311 CSP count mismatch      | analytics file content changed                         | Visible in diff. Smoke test catches display bug                     |

### Smoke Tests

Playwright-based suite runs against the **staging frontend + staging data**:

1. Landing page loads, rankings table renders with >0 districts
2. District detail page loads with data (clubs table, overview stats)
3. Date selector shows dates — no obvious gaps or stray entries
4. Club detail page loads with membership chart
5. Program year selector switches data (historical year shows different rankings)
6. Dark mode toggle works
7. No console errors
8. Rankings table shows non-zero aggregate scores

### Rollback

- **Frontend**: redeploy previous Firebase Hosting release (Firebase keeps release history)
- **Data**: production bucket is untouched until promotion — if staging is bad, production stays on yesterday's data
- **Manual override**: `workflow_dispatch` to force-promote or force-rollback

### Implementation Steps

**Phase 1 — Infrastructure:**

1. Create `gs://toast-stats-data-staging` GCS bucket
2. Seed it with a copy of production data: `gsutil rsync gs://toast-stats-data-ca gs://toast-stats-data-staging`
3. Make staging bucket publicly readable (no CDN needed — direct GCS URL)
4. Add Firebase Hosting target `staging` in `firebase.json`
5. DNS: add `staging.ts.taverns.red` CNAME to Firebase

**Phase 2 — Pipeline changes:** 6. Add `GCS_BUCKET` input to data-pipeline workflow (default: staging bucket) 7. Daily pipeline writes to staging bucket 8. Add diff step: compare staging vs production bucket manifests 9. Add promotion step: `gsutil rsync staging → production` on additive-only diff 10. Add alert step: notify on subtractive diff (GitHub Actions annotation + issue comment)

**Phase 3 — Frontend changes:** 11. Split Deploy workflow: staging deploy → smoke tests → promote to production 12. Environment-aware CDN URL: staging reads from staging bucket URL 13. Disable GA on staging (conditional on hostname, already implemented) 14. Create Playwright smoke test suite

**Phase 4 — Validation:** 15. Run parallel for 1 week: both staging and production get data, verify consistency 16. Switch daily pipeline to staging-first mode 17. Remove direct-to-production pipeline path

## Consequences

### Easier

- Pipeline bugs never reach production — staging absorbs the blast
- Coordinated frontend + pipeline changes are testable end-to-end
- Rollback is instant — production data is untouched until promotion
- Diff-based validation adapts to any Toastmasters schedule change

### Harder

- Two GCS buckets to manage (~$0.03/GB/month, negligible cost)
- Daily promotion step adds ~1-2 min to pipeline
- Staging bucket needs periodic cleanup (old data accumulates)
- Coordinated changes (case c/d) require manual staging rebuild trigger

## Alternatives Considered

1. **Shared GCS bucket** — simpler but doesn't protect against pipeline data bugs, which are our #1 incident source. Rejected.

2. **Rule-based validators** (e.g., "latest date within 7 days") — brittle, encodes assumptions about Toastmasters timing that change monthly. Replaced with diff-based approach.

3. **Firebase preview channels** — ephemeral per-PR deployments. Good for visual review but don't persist, can't run scheduled smoke tests, and don't address pipeline data. Use in addition to staging, not instead of.

4. **Manual promotion gate for all changes** — safer but adds friction to every deploy. Auto-promote for additive diffs, block only for subtractive — balances safety and speed.

5. **No staging, just better CI** — CI catches code bugs. Our incidents were data bugs that require a deployed environment + real pipeline output to detect. Rejected.
