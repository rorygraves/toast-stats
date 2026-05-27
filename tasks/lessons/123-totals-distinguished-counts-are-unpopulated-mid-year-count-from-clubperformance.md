---
id: '123'
category: lesson
tags: [analytics, data-pipeline, dcp, frontend, verification]
auto_load: true
date: 2026-05-27
issues: [793, 797]
---

# Lesson 123 — `totals.distinguished*` is unpopulated mid-year; count distinguished from `clubPerformance`

**Date:** 2026-05-27
**Issue:** #793 (epic #797 Sprint 1 — "What Changed" diff engine)

## What happened

The snapshot diff needed a district-level "distinguished clubs" count for one
of its four KPI cards. `DistrictTotalsFile` has the obvious fields —
`distinguishedClubs`, `selectDistinguishedClubs`, `presidentDistinguishedClubs`
— so the first instinct was to diff those.

A live-CDN check (Lesson 115 reflex) for District 61, 2026-05-25 → 2026-05-26,
showed all three reading **`0` on both dates** — while the raw `clubPerformance`
array carried **49 → 50 distinguished clubs** (18 D, 12 S, 12 P, 8 M) with one
`'' → D` flip. The `totals.distinguished*` fields are not populated until TI
finalises recognition at program-year end; mid-year they are a flat `0` for
every district. Diffing them would have shipped a KPI that permanently reads
"no change", and a per-club distinguished-flip feature that never fires.

The authoritative per-club tier is the raw `clubPerformance`
**"Club Distinguished Status"** field (`'' | D | S | P | M`). Counting
non-empty values there gives the real total (49 → 50) and the real flips. The
diff engine now derives both the aggregate and the per-club
`became/lost distinguished` event from that column, never from `totals.*`.

## The transferable lesson

This is Lesson 115 ("a field's name can lie about whether it's populated") with
a second cause: not _single-snapshot_ this time, but a **seasonal
computation gap** — a field that is correctly named and correctly typed yet
only filled in at a particular point in the program year. The same free check
catches both: read the served value for a representative entity at a
representative _date_ before wiring it.

The fix also restates a standing tripwire: distinguished/DCP signals come from
raw `clubPerformance` fields, never from a derived/aggregated summary — and now
also "never from `totals.distinguished*`".

## How to apply

- For any seasonal or end-of-period metric (recognition tiers, year-end
  rollups), check the served value **mid-period**, not just on a date where it
  happens to be populated. A `0` that is correct in July is a bug in May.
- Distinguished counts and per-club tier come from `clubPerformance`
  "Club Distinguished Status" (non-empty = distinguished). Treat `M` and any
  unknown code as distinguished for a boolean became/lost (v1 leans boolean).
- Sprints 2–4 of epic #797 consume the same diff engine — they inherit this;
  don't reintroduce a `totals.distinguished*` read in the date-pair picker or
  the per-club table.

## Related

- [[115-a-fields-name-and-comment-can-lie-about-whether-its-populated-in-your-surface]]
  — same reflex (verify the served value), different cause (single-snapshot vs
  seasonal gap).
- Active tripwire in `tasks/rules.md`: DCP goals are independent — use
  `clubPerformance` raw fields, never infer Goals 1–N order.
- `docs/design/what-changed-feature.md` §3 documents this at the engine's call
  site.
