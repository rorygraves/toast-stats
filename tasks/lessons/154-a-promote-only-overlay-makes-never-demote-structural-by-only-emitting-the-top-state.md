---
id: '154'
category: lesson
tags: [frontend, architecture, data-pipeline, scope, verification]
auto_load: true
date: 2026-06-02
issues: [1069, 1062]
---

# Lesson 154 — A "never demote" overlay invariant is structural when it can only ever emit the top state — not a rank comparison

**Date:** 2026-06-02
**Issue:** #1069 (epic #1062 Sprint 4 — club-status augmentation from Dues Renewal)
**PR:** (this sprint)

## What happened

The sprint layers a read-time overlay on a value users already see: during the
month-end closing freeze, the daily Dues Renewal report may promote a club to
`Active`, but the rule is **promote-only — never demote below the frozen base**.
The obvious implementation is a guard: rank the operational statuses
(Active > Low > Suspended …), compute the overlay's candidate status, and only
apply it if `rank(candidate) > rank(base)`. That needs a status-rank table, and
the "never demote" guarantee then lives in a runtime comparison that a later
edit (a new status, a flipped comparator) can silently break.

Instead the resolver only ever emits **one** status: `Active`, the single top
operational state, and only when the renewal is `Verified complete`. There is no
rank table and no comparison. "Never demote" holds because the function is
_incapable_ of producing anything lower than the top — non-demotion is a
property of the type (`status: 'Active'`), not of a branch. The clean un-freeze
hand-off falls out of the same shape: when the base is already `Active` the
resolver short-circuits to `null` (a no-op), so there is no backward jump to
guard against either.

## The transferable principle

**When an overlay/augmentation must only ever move a value in one direction,
constrain it to emit only the extreme value of that direction — then the
monotonicity is structural (guaranteed by the return type), not a runtime
rank-comparison you have to keep correct.** A "compare base vs candidate and pick
the better" guard is fragile: it needs an ordering, and the invariant breaks
quietly when the ordering or the comparator drifts. If the only state the
augmentation can emit is the top (or bottom) one, the dangerous direction is
unreachable by construction, and the "already-at-extreme ⇒ no-op" case doubles
as the clean hand-off back to the authoritative source.

## How to apply

- Before writing a `rank(a) vs rank(b)` guard for a one-directional override,
  ask: can this override only ever emit the single extreme value? If so, drop the
  ranking — emit that value or `null`, and let the type carry the invariant.
- Pair it with explicit provenance (`source` + as-of date) so the augmented value
  is never silently blended with the base cadence (the #800 / D61 150→151 hazard,
  epic #1062) — promote-only does not excuse you from attribution.
- The load-bearing risk for any overlay is still the **join key**: verify the two
  sides actually match on real served data, not fixtures
  ([[115-a-fields-name-and-comment-can-lie-about-whether-its-populated-in-your-surface]]).
  Here `DuesRenewalRecord.club` and `ClubTrend.clubId` are both the raw, un-padded
  TI club number — confirmed against captured fixtures before trusting the join.

## Related

- [[115-a-fields-name-and-comment-can-lie-about-whether-its-populated-in-your-surface]]
  — verify the join key / served value, or the overlay silently no-ops.
- [[147-a-reused-parity-surface-must-render-from-its-own-data-source-not-be-gated-by-a-siblings-emptiness]]
  — sibling: the augmented surface reads from its own source; don't cross-gate it.
- `frontend/src/utils/clubStatusOverlay.ts` (`resolveClubStatusOverlay`),
  `docs/design/1069-club-status-overlay.md`.
