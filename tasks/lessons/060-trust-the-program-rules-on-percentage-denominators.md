---
name: Trust the program rules on percentage denominators
description: When a percentage is gating a recognition tier, use the denominator
  the program specifies — not the one that's most convenient to compute.
type: feedback
id: '060'
category: principle
tags: [dcp, analytics]
auto_load: true
date: 2026-05-15
issues: [538, 537]
---

# Lesson 60 — Trust the program rules on percentage denominators

**Date:** 2026-05-15
**PR:** #538 (Issue #537, founder-reported bug on /district/93)

## What happened

`BordaCountRankingCalculator.calculateDistinguishedPercent` divided
distinguished clubs by **`activeClubs`** (the current paid/active count)
instead of **`paidClubBase`** (the PY-start club count). Per TI's
**Distinguished District Program (Item 1490)**, the qualifying
percentage uses the year-start base. The bug under-reported the
percentage by ~3-5 percentage points for any district that had gained
clubs during the program year — exactly the districts that most deserve
to qualify at higher tiers.

District 93 showed the symptom cleanly: the KPI count targets (computed
correctly against `paidClubBase`) showed ✓ for President's at every
metric, but the Trophy Case used the bad percentage and called the
district "Select Distinguished" with a +3.6% gap. The founder reported
the visible contradiction; the math confirmed it.

## How to apply

**For any percentage that gates a recognition tier, check the program
rule before picking a denominator.** Convenient ≠ correct.

Telltale signs you have this kind of bug:

- Two surfaces showing different "states" for the same metric (count
  threshold says ✓, percentage says ✗).
- A "gap" number that exactly matches a known threshold delta, hinting
  the gap calc is right but the underlying percentage is wrong.
- The numerator changes through the year but the denominator drifts
  too — for year-cumulative metrics, the official denominator is
  usually fixed at PY start.

Pattern of correctness:

- **Year-cumulative metric** (distinguished clubs, payments) gated on a
  percentage → denominator is almost always the **fixed PY-start base**.
- **Activity-rate metric** (% members attending, % clubs reporting) →
  denominator is usually the **current count**.

When in doubt, read the program document. TI's "Item 1490" (and its
peers) define the exact formulas; don't rederive them from
intuition.

## How this connects to other lessons

- **Lesson 57** — "Year-cumulative metrics have base = 0 each PY." Same
  family of insight: the base is fixed at PY start.
- **Lesson 59** — "Pin related queries to the same snapshot date."
  Different problem, same theme: avoid silent drift between sibling
  surfaces.

The general principle: when you're showing the user a recognition or
achievement, the math must match the awarding body's published rules
to the last decimal. Visual surfaces that disagree about the same
fact erode trust faster than almost any other class of bug.

## Related

- `packages/analytics-core/src/rankings/BordaCountRankingCalculator.ts:822`
- TI Distinguished District Program (Item 1490, Rev. 04/2025)
- D93 screenshot in #537
