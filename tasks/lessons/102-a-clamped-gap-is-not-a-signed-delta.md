---
id: '102'
category: lesson
tags: [analytics, frontend, dcp, data-pipeline]
auto_load: true
date: 2026-05-24
issues: [684, 683]
---

# Lesson 102 — A clamped tier-gap is not a signed delta; don't render `max(0, …)` under a "growth/change" label

**Date:** 2026-05-24
**Issue:** #684 (epic #683 Sprint 1 — region pages)
**PR:** [#695](https://github.com/taverns-red/toast-stats/pull/695)

## What happened

The `/region/:n` table's "Net Club Growth" column was wired to
`DistinguishedDistrictGap.netClubGrowthGap`, which is
`Math.max(0, requiredNetChange − netChange)` — the clamped distance to
the next Distinguished tier's net-growth rule. District 48 lost 8 clubs
(paidClubs 79 → 71, net change **−8**) and the column rendered **+8**. A
shrinking district looked like it was growing, on a P0 surface a district
director uses to judge health.

The giveaway: the displayed number was the exact magnitude of the loss,
but positive. `max(0, 0 − (−8)) = 8`. The clamp turned a regression into
a goal-distance and the sign flipped as a side effect.

## The trap

A **gap** and a **signed delta** are different quantities that happen to
share units and, for a shrinking district, share magnitude:

- **Signed delta** (`current − base`): the actual change. Can be
  negative. This is what a column named _growth / change / net_ must show.
- **Clamped gap** (`max(0, required − current)`): "how far to a target."
  **Can never be negative** — that's the whole point of the clamp. Useful
  for a countdown column, useless (worse: misleading) as a "growth" value.

When a clamped gap is displayed under a signed-quantity label, every
regression is silently rendered as a non-negative number. The clamp
**is** the bug surface: `max(0, …)` guarantees you can never see a loss.

## How to apply

- **A column whose name implies a sign (growth, change, net, Δ, +/−) must
  render the signed actual** (`current − base`), not a gap. If you see
  `max(0, …)` feeding a "growth" cell, that's the bug.
- **Keep the gap and the actual as separate named fields.** Here the fix
  added a distinct `netClubGrowth` (signed) to `DistinguishedDistrictStatus`
  alongside the existing `netClubGrowthGap` (clamped). One field, one
  meaning — don't overload a gap to also serve as the actual.
- **Source the signed value from authoritative stock fields, not by
  un-clamping the gap.** `−netClubGrowthGap` is wrong in general (the clamp
  is lossy). The actual is `paidClubs − paidClubBase`; those fields already
  ride the rankings snapshot, so the frontend can render the correct value
  on the **current live snapshot** without waiting for a pipeline re-run,
  while the new analytics field becomes the canonical source going forward.
- **Test the shrinking case explicitly.** A growing-district test passes
  for both the right formula and the clamped-gap bug (both positive). Only
  a loss (D48: −8, not +8) distinguishes them. The falsifying test is the
  negative case.

## Related

- [[057-year-cumulative-metrics-have-base-zero]] — base semantics: a
  _stock_ (paid clubs) has a real PY-start base; the signed delta is
  `current − base`.
- [[060-trust-the-program-rules-on-percentage-denominators]] — adjacent
  family: the displayed number must mean exactly what its label claims.
- `packages/analytics-core/src/rankings/DistinguishedDistrictCalculator.ts`
  — `netClubGrowth` (signed) vs `nextTierGap.netClubGrowthGap` (clamped).
