---
id: '155'
category: principle
tags: [ci, automation, data-pipeline, monitoring, gcs]
auto_load: true
date: 2026-06-02
issues: [1073, 1072]
---

# Lesson 155 — A recency-based freshness monitor is blind to a held-promotion "content-stale" state; freshness has two orthogonal axes

**Date:** 2026-06-02
**Issue:** #1073 (epic #1072 — stale-prod observability)
**PR:** _(record on merge)_

## What happened

The pipeline writes staging first, then promotes staging → prod only when both
gates allow it: the additive-only **count gate** and the #1034 **value gate**.
When a gate refuses (e.g. a reviewed re-derive changed values), promotion is
**held** — but the daily run still reports `success`, and prod keeps serving the
last-promoted content. Observed live 2026-06-01: D61 showed **150** active clubs
on prod for 5 days while staging correctly held **151**, because the value gate
blocked promotion each day.

The existing freshness monitor (#753, [[107-monitor-the-output-freshness-not-the-best-effort-scheduler]])
could not see this. It checks the **age** of prod's `v1/latest.json`
`generatedAt` — a dead-man's-switch for "did the run happen at all." But a held
promotion leaves `latest.json` perfectly **current** (the run _did_ happen; it
just didn't promote). The date is fresh; only the _content_ is stale. The two
failure modes — _run never happened_ vs _run happened but its output never
reached prod_ — do not overlap, so a recency monitor is structurally blind to
the second.

## The transferable principle

**"Freshness" of a published artifact is two orthogonal axes, not one:
_recency_ (was a new version produced recently?) and _propagation_ (did the
newest produced version actually reach the surface users read?). A
timestamp/age check only covers recency. A gated, validate-first, or
promote-on-approval pipeline can produce a fresh artifact that is deliberately
withheld from prod — current date, stale content — and a recency monitor reports
green through the entire outage.** Whenever a "produce" step is decoupled from a
"publish/promote" step by a gate, add a second signal that compares
**produced-vs-published content** (here: the value-diff overlap changed-count >
0 between staging and prod), independent of any date. The held state must be
**loud** (an alert) and **self-clearing** (auto-resolve when a later run
promotes), because a deliberately-correct gate (the value gate stays
fail-closed) means the silence — not the block — is the bug.

## How to apply

- For any gated produce→promote pipeline, ask two questions, not one: "did it
  run recently?" **and** "did the freshest output reach the surface users
  read?" Monitor both; neither subsumes the other (same shape as #753's
  "reduce the miss rate" vs "detect the miss" pair).
- The content signal often already exists upstream — here the promote gate
  _already_ computed a staging-vs-prod value-diff; the sprint just surfaced
  `changed.length > 0` as an alert instead of letting it die in a step summary.
  Grep for an existing diff/compare before building a new comparator (R7).
- A self-clearing alert keyed on the _positive_ event (a promoting run closes
  the issue) beats a TTL or a human remembering to close it — and is safe to
  "close all open" only when runs are **serialized** (`concurrency` group), so
  a promoting run can't race a concurrent blocking one.
- Distinguish an operator-review-needed hold (value gate → clear with
  `allow_value_changes=true`) from a possible real regression (count gate →
  investigate the subtractive change first); same alert, different remediation.

## Related

- [[107-monitor-the-output-freshness-not-the-best-effort-scheduler]] — the
  recency axis this lesson is the propagation-axis complement of; a held
  promotion is exactly the gap that monitor can't see.
- `scripts/lib/promotionAlert.ts` (the pure decision),
  `scripts/promotion-alert.ts` (runner),
  `.github/workflows/data-pipeline.yml` (promotion-held alert steps).
