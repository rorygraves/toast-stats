---
id: '153'
category: lesson
tags: [data-pipeline, analytics, collector-cli, privacy, tdd]
auto_load: true
date: 2026-06-02
issues: [1064, 1062]
---

# Lesson 153 — De-identifying a member ledger by aggregation must drop per-row fields, even non-personal ones in the validated KEEP map

**Date:** 2026-06-02
**Issue:** #1064 (epic #1062 Sprint 2 — Daily Reports parser + personal-name EXCLUDE filter)
**PR:** (this sprint)

## What happened

The spike (#1063) validated a per-report keep/EXCLUDE column map and the Sprint 2
charter was to "promote the validated map into the parser." For Education
Achievements the de-identification strategy is **aggregate the member-level
ledger to per-(club, award) counts** — drop the personal `Member` column and
collapse rows. The spike's KEEP list for that report included a non-personal
`Date` column (the per-achievement award date).

Promoting the map literally — keeping `Date` in the projection — would have been
wrong. The aggregation groups by `(club, division, area, name, location,
award)`; if `Date` rode along, every achievement has its own date, so each
"group" would be a single row and the count would always be 1. The
de-identification (many members → one count) silently collapses to a
member-cardinality ledger again. The fix was to drop `Date` **before**
aggregation even though it is non-personal and "in the map," and document why at
the registry site so the next reader doesn't read it as a transcription error.

## The transferable principle

**When you de-identify by aggregating a per-row ledger into counts, the group
key defines what survives — and any field that varies per row (a date, a
sequence number, a member ID) must be dropped from the projection, even if it is
non-personal and listed in the upstream KEEP/validated map.** A "keep map" tells
you which columns are _safe to persist_; it does not tell you which columns are
_compatible with the aggregation_. Keeping a per-row field re-shatters the groups
and quietly defeats the count — the output still type-checks and contains no
personal value, so nothing fails loudly. Decide field eligibility against the
_aggregation shape_, not just the privacy map, and leave a comment saying so.

## How to apply

- Before aggregating to counts, ask of every KEEP column: is this constant
  within a group, or does it vary per row? Per-row fields go in neither the key
  nor the output (or the count is meaningless). Constant-per-group fields
  (club/area/award) are the key.
- A deliberate deviation from a "promote the spec verbatim" charter needs a
  one-line _why_ at the code site — otherwise it reads as a copy error and a
  later "fix" re-introduces the bug (kin to [[150-an-adr-claim-that-a-derived-field-is-in-the-snapshot-can-be-false-verify-the-live-payload]]:
  the spec/map describes the corpus, not the exact bytes your transform should emit).
- Pin the collapse with a test that asserts the row count _drops_ (40 raw → 33
  groups) and the counts _sum back_ to the raw total — that catches both a
  failed collapse (count stuck at 1) and silent row loss.

## Related

- [[150-an-adr-claim-that-a-derived-field-is-in-the-snapshot-can-be-false-verify-the-live-payload]]
  — a doc/map is a claim about intent, not a spec for the bytes you emit; verify
  against the real shape.
- `packages/collector-cli/src/services/DailyReportParser.ts`
  (`aggregateEducation`, the education registry entry's `Date`-drop comment).
