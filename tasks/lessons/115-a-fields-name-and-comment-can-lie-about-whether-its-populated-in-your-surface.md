---
id: '115'
category: lesson
tags: [frontend, analytics, data-pipeline, dcp, verification]
auto_load: true
date: 2026-05-26
issues: [681, 674]
---

# Lesson 115 — A field's name (and comment) can lie about whether it's populated in _your_ surface

**Date:** 2026-05-26
**Issue:** #681 (epic #674 Sprint 7 — KPI strip: 4th card "Net Member Change")

## What happened

The 4th KPI card needed a "Net Member Change" value. Two same-shaped fields
exist on `DistrictAnalytics`:

- `memberCountChange` — comment in `AnalyticsComputer.ts` literally says _"actual
  member count change"_. Obvious match for the card.
- `membershipChange` — `currentPayments − paymentBase`, comment says
  _"payment-based"_.

I wired the card to `memberCountChange` on the strength of the name + comment,
unit-tested it (the test passes a prop, so it can't catch a bad source), and
shipped to the preview. **The card rendered `0` for district 93.** The live CDN
told the truth the type didn't: `district_<id>_analytics.json` is a
**single-snapshot** file (`dateRange` start == end, one trend point), and
`memberCountChange = last − first snapshot = 0` _for every district_ on the
frontend (#185). The field is real and correctly named — it's just structurally
**unpopulated in the surface that renders it.** The aggregated hook reads the
same file, so it's 0 there too.

The actually-populated signed delta was `membershipChange` (+292 for D93),
because it's derived from the dense rankings `paymentBase`, not from snapshots.
TI membership is payment-based, so payment-vs-base _is_ the net member change.

## The principle

A field's **name and comment describe its intent, not its value in your code
path.** Before wiring a number into a user-facing surface, **read the real
served value** for a representative entity — don't trust the type. The tell here
was free and decisive: one `curl` of the staging CDN object showed
`memberCountChange: 0`, `dateRange: {start: X, end: X}`. That single check would
have redirected the whole sprint before the first commit.

This is R7 ("inventory existing fields") extended one step: inventorying that a
field _exists and is typed_ is not the same as confirming it's _non-trivially
populated where you consume it_. Two fields with near-synonym names is the
amplifier — pick by the value, not the name.

## How to apply

- For any KPI/metric you surface, `curl` (or log) the real value from the actual
  data path for 1–2 representative entities **before** wiring it. A perpetual
  `0` / `null` / `—` is the symptom; catch it at the source, not in review.
- When two similarly-named fields exist (`memberCountChange` vs
  `membershipChange`, `count` vs `payments`), the names won't disambiguate —
  trace each to its computation _and_ its populated-ness in your endpoint.
- A component unit test that takes the value as a prop proves rendering, not
  sourcing. The sourcing bug only shows on real data — so a live/preview check
  with real data is load-bearing, not optional, for "is this the right field?"

## Related

- [[104-derive-from-raw-counts-not-a-vendor-pre-rounded-percentage]]
  — sibling: derive from the input that's actually correct, not the convenient
  pre-computed one.
- [[102-a-clamped-gap-is-not-a-signed-delta]]
  — same card family; render the metric by what it actually means.
- R7 in `tasks/rules.md` — inventory existing fields; this adds "and confirm
  they're populated in your path."
