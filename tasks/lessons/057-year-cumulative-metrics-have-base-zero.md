---
name: Year-cumulative metrics have base = 0 each program year
description:
  Distinguished Clubs and similar year-cumulative counts reset to 0 on
  July 1, so PY-start base is always 0 — Δ equals current.
type: project
---

# Lesson 57 — Year-cumulative metrics have base = 0 each program year

**Date:** 2026-05-14
**PR:** #526 (Sprint A of Region rollup epic #513)

## What happened

Implementing the Region page KPI strip (#514), I needed PY-start base
values for three metrics: Paid Clubs, Payments, Distinguished Clubs.
Paid Clubs and Payments already have `paidClubBase` / `paymentBase`
fields on `DistrictRanking` (computed by the pipeline for growth-%
display). Distinguished Clubs had no such field — and I almost filed
a "needs new base field" follow-up.

## The reframe

Distinguished Clubs is a **year-cumulative** metric. On July 1, no club
in the district has earned Distinguished status yet for the new program
year. The number can only go up over the course of the PY (clubs can't
"un-distinguish" once they qualify). So the PY-start base is **always
zero by definition** — today's count IS the year-to-date delta.

This pattern applies to any metric that:

- Resets to 0 at PY start
- Monotonically increases through the year

Examples in this codebase: distinguished clubs count, officer-training
completions, club growth (chartered clubs this PY).

## How to apply

**When a metric looks like it's missing a base field**, ask:

- Is this an accumulator (year-to-date count of events)?
- Or a stock (current standing, like paid-clubs / membership)?

For accumulators, base is always 0 — no field needed. Render as
`+N` (signed) so the cumulative nature is visible.

For stocks (paid clubs, member payments, etc.), the pipeline needs an
explicit PY-start snapshot value — that's what `paidClubBase` and
`paymentBase` capture today.

**Why this matters going forward:** when #516 / #517 ship the
Distinguished prerequisite countdown columns, the same reframe applies
to Education-Training and Club Growth — both year-cumulative, both
base = 0. No new pipeline fields needed for those either.

## Related

- `frontend/src/pages/RegionPage.tsx` — `<KpiCard base={0} current={totals.distinguishedClubs} />`
- Issue #514 acceptance criteria
- BordaCount calculator: paidClubBase / paymentBase population
