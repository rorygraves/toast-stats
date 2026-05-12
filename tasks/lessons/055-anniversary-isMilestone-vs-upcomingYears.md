# Lesson 55 — `isMilestone` fires on `years`, not `upcomingYears`

**Date:** 2026-05-12
**Sprint:** /sprint 443-448 (Club Anniversaries epic, Sprint C)
**PR:** #507

## What happened

The `UpcomingAnniversariesPanel.test.tsx` test "visually elevates milestone
anniversaries with `data-milestone='true'`" failed against the first GREEN
implementation. The test charter date `2001-05-25` against REF
`2026-05-15` produces:

- `years: 24` (anniversary hasn't happened yet this year)
- `upcomingYears: 25`
- `isMilestone: false` (because `MILESTONE_YEARS.has(24)` is false)

The panel was using `anniversary.isMilestone` directly, so a club ten days
away from its 25-year milestone was rendered as a non-milestone row. From
a recognition standpoint that is exactly backwards — the whole point of
the upcoming panel is to surface those clubs **before** the milestone
date.

## Root cause

`getClubAnniversary()` is the foundation utility (#444). It returns
`isMilestone` based on **current `years` count**, which is the right
default for "is the club CURRENTLY at a milestone year." But for "upcoming
panel" semantics — "is the next anniversary a milestone" — that flag is
wrong by one year for ~365 days a year.

## How to apply

Two consumers of the same utility, two different milestone questions:

- **ClubAnniversaryBadge** (hero / steady-state display): `isMilestone`
  correctly fires for the year the club is currently celebrating.
- **UpcomingAnniversariesPanel** (forward-looking recognition planner):
  derive the flag locally from `MILESTONE_YEARS.has(upcomingYears)`.

`MILESTONE_YEARS` is now exported from `clubAnniversary.ts` for exactly
this reason — consumers with different temporal framing recompute the
flag themselves rather than asking the utility to take a side.

**Why this is a lesson, not just a bug fix:** the temptation when adding
a new consumer is to extend the utility ("just add an `isUpcomingMilestone`
field"). That balloons the contract for every caller. Letting consumers
derive their own framing keeps the utility tight and forces the question
"which `years` count do I actually care about?" to surface at the call
site.

## Related

- `frontend/src/components/UpcomingAnniversariesPanel.tsx:130-136`
- `frontend/src/utils/clubAnniversary.ts:33` — `MILESTONE_YEARS` export
