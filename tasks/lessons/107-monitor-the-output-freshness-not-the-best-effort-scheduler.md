---
id: '107'
category: principle
tags: [ci, automation, data-pipeline, monitoring]
auto_load: true
date: 2026-05-26
issues: [753, 757]
---

# Lesson 107 — Monitor the output's freshness, not the best-effort scheduler

**Date:** 2026-05-26
**Issue:** #753 (epic #757 Sprint 2)
**Tags:** github-actions, schedule, monitoring, dead-mans-switch, data-pipeline

## What happened

The daily Data Pipeline runs on a GitHub Actions `schedule` cron. On
2026-05-26 the scheduled run simply **didn't happen** — no run record, no
failed job, nothing to alert on. The CDN kept serving the previous day's
`v1/latest.json` and the only reason anyone noticed was a human spotting
stale data by chance. GitHub `schedule` events are explicitly **best-effort**
and can be dropped under load with no trace.

## The trap

The instinct is to monitor the _workflow_: "alert me when the daily run
fails." But a dropped scheduled event produces **no run at all** — there is no
failure to catch. Every workflow-centric alarm (a failing job, a `needs:`
gate, an `if: failure()` notify step) is blind to the one failure mode that
actually bit us: the run that never started.

## The principle

For anything that _must_ run on a best-effort schedule, monitor the
**freshness of the output it produces**, not the success of the job that
produces it. The pipeline already stamps every successful run with
`generatedAt` in `v1/latest.json`; a tiny independent cron that fails loudly
when that timestamp is older than ~26h is a **dead-man's-switch** — it fires
precisely because nothing else did. The check reads a public artifact, so it
needs no shared-infra credentials (cf. [[093-gcs-cors-has-no-subdomain-wildcard-so-dynamic-preview-hosts-need-star]]
— the CDN is world-readable).

Two independent levers, not one:

- **Reduce the miss rate** — a backup cron a few hours after the primary
  absorbs a dropped event (safe only because the daily flow is idempotent and
  a concurrency group serializes overlaps).
- **Detect the miss that slips through** — the freshness monitor. The backup
  makes misses rarer; the monitor makes the remaining ones _loud_. Ship both;
  neither subsumes the other.

## How to apply

- When adding a `schedule`-triggered workflow whose output matters, ask "what
  proves it ran?" and monitor _that_ artifact's age — don't assume a missed
  run will show up as a red run, because it won't.
- Keep the freshness decision in a pure, unit-tested function (here
  `scripts/lib/pipelineFreshness.ts`) and make the workflow thin glue. The
  boundary cases — missing timestamp, unparseable timestamp, a non-numeric
  threshold input that would make `age > NaN` always false and silently
  disable the alarm — are exactly the ones a monitor must get right, and they
  are trivial to unit-test and easy to fumble in inline YAML bash.
- A monitor that can't read its own freshness signal (fetch failed, JSON
  garbage, crash) must **alert**, not pass. Treat "can't tell" as stale.

## Related

- [[093-gcs-cors-has-no-subdomain-wildcard-so-dynamic-preview-hosts-need-star]]
  — the artifact being monitored is public/world-readable, so the monitor
  needs no credentials.
- `docs/runbooks/data-pipeline-recovery.md` — the recovery runbook this lesson
  backs (detection → manual re-run → safe queue-test).
