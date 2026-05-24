# Lesson 092 — A ticket's helper signature is a sketch; bend it to the real data shape

**Date:** 2026-05-23
**Issue:** #621 (Goal Achievement Timeline, epic #617 Sprint 4)
**Tags:** analytics-core, data-flow, DRY, dead-code, frontend-hooks, verification

## What happened

#621 specified an analytics-core helper as `goalsMetAtDate(clubId, date)` that
"reads the snapshot for date, locates the club, counts goals achieved," with
three unit cases (known date / missing snapshot / club-not-in-snapshot → null).

Taken literally, that's a `goalsMetAtDate(snapshots: Snapshot[], clubId, date)`
signature. But tracing the actual data flow showed the frontend — the only
shipped consumer — never holds raw `Snapshot[]`. It receives a pre-computed,
**club-scoped** `dcpGoalsTrend: { date, goalsAchieved }[]` (the projection of
every snapshot onto one club's INDEPENDENT goals-met count, already parsed from
the raw `Goals Met` field upstream). A snapshot-level helper would have been a
tested-but-never-called export — dead surface area the DoD explicitly forbids.

## Decision

Implement `goalsMetAtDate(goalsHistory, date)` over the trend. It (a) is DRY —
the shipped `useClubGoalTimeline` hook actually calls it — and (b) still
satisfies all three required cases (known date → count; date absent from history
→ null; empty/absent history ≡ "club not in snapshot" → null). The deviation
from the literal signature was documented in the plan doc, the helper's own
doc-comment, and the PR body, so a reviewer sees it as a deliberate trade, not
an oversight.

**Principle:** a ticket's function signature is a _sketch of intent_, not a
contract. The contract is "a tested primitive that returns goals-met-at-a-date
or null." Choose the shape that the real consumer can use; a helper with no
runtime caller is a worse outcome than a signature that differs from the ticket.

## The verification caught what unit tests structurally couldn't

Two things only surfaced against live data / fresh-context review:

1. **De-dup must key on the RESOLVED date, not the target.** The "as-of" row
   uses a _district-level_ snapshot date that usually isn't an exact point in a
   given club's trend. Worse, real snapshots are ~weekly, so the canonical
   1st-of-month checkpoints (Sep 1 / Nov 1 / Jan 1 / Mar 1) **almost always**
   fall back to the nearest prior weekly snapshot. My first de-dup only collapsed
   identical _target_ dates, so gappy/realistic clubs would render duplicate
   _resolved_ dates. Fix: de-dup on `actualDate`, keeping the earliest checkpoint
   a snapshot satisfies (also kills a spurious "\*" marker on the current row).
   The fresh-context reviewer flagged this as the realistic production path, not
   an edge case — and it was: the live D61 club showed 4 of 5 rows as fallbacks.

2. **Live data is the only honest fixture for "looks right."** Computing the
   expected 5 rows from the actual prod CDN snapshot (`0/10 → 2/10 → 7/10 →
8/10 → 10/10`, gains `+2/+5/+1/+2`) and asserting the deployed page matches
   exactly is far stronger than hand-authored fixtures, which would have encoded
   my own assumption that checkpoints land on snapshots.

## How to apply

- Before writing a "new data" helper, grep the types the consumer already
  receives (R7). The data is often already computed and shaped — match it.
- When a ticket gives a signature, ask "can the shipped caller actually pass
  these args?" If not, the signature is wrong, not the caller.
- De-dup/aggregate on the _resolved_ key, not the _requested_ key, whenever a
  request can map many-to-one onto reality (dates, ids, buckets).
- Verify timelines/series against a real production record and assert the
  computed values, not just "renders without error."

## Related

- [[081-phase-gated-deferral-tests-move-with-the-spec]] — tests/spec coherence.
- [[090-vitest-project-split-needs-a-partition-guard]] — the axe scan here was
  split into a `*.accessibility.test.tsx` so it routes to the integration
  project; the unit tests stay fast and contention-free.
