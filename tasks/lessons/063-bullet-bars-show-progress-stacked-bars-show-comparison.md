---
name: Bullet bars show progress; stacked bars show comparison
description: When a KPI card shows "current vs. recognition thresholds",
  a single bullet bar (marker + tier ticks) beats four parallel progress
  bars. Same data, far less ink.
type: feedback
id: '063'
category: lesson
tags: [charts, frontend]
auto_load: true
date: 2026-05-21
issues: [550]
---

# Lesson 63 — Bullet bars show progress; stacked bars show comparison

**Date:** 2026-05-21
**Issue:** #550 (District Overview KPI redesign)

## What happened

The original Overview cards (TargetProgressCard, deleted in this PR)
rendered the Distinguished / Select / President's / Smedley
thresholds as **four parallel horizontal progress bars**, one per
tier. The bars were "filled" by `current / target_n × 100%` and
turned green when `current >= target_n`.

Visually, the four bars communicate roughly nothing. They are nearly
identical lengths (because the four tier thresholds are tightly
clustered — Paid Clubs spans 158 / 161 / 164 / 169), and the user
must mentally compare four near-identical bar lengths to extract a
single answer: _how close am I to the next tier?_

The redesign replaces them with a single **bullet bar**: one
horizontal track, a current-value marker (▼ + value label) above the
track, and four small vertical tick marks below the track labeled
D / S / P / Sm with their threshold values. Same data, one bar.

The bullet bar answers the actual question — "where am I in the tier
range?" — at a single glance. Bunching of the ticks at the right of
the bar (e.g. 93% / 95% / 97% / 100% for Paid Clubs) is itself
useful information: it telegraphs "you are close to the band where
tier achievement happens."

## How to apply

**Choose the chart type based on the question the user is asking,
not the data shape.**

- "Show me a current value's position within a known range" →
  **bullet bar** (or gauge). One marker, tier ticks for reference.
- "Show me the composition of a whole" → **stacked / segmented bar**
  (already used downstream in DistinguishedCompositionBar).
- "Show me trend over time" → **line chart**.
- "Show me four independent values that happen to share an axis" →
  **four parallel bars** — but this is rarely what users actually
  want; usually they want one of the above three.

The TargetProgressCard implementation answered question #4 when the
user was actually asking #1.

**Why:** Replacing N visualisations with 1 is a quality win even
before you measure ink-to-data ratio — the page reads faster, the
component is smaller, and the data semantic ("progress toward a
range of achievement levels") is rendered directly rather than
reconstructed by the user.

**How to apply:** When you see a card stacking 3+ progress bars,
ask whether the user wants composition, progress, or
trend. Composition → stacked bar. Progress → bullet bar with
reference ticks. Trend → line. If the answer is "all of the above,"
that's a deeper IA problem masquerading as a chart-choice problem;
split the card.

## Related

- `frontend/src/components/KpiBulletCard.tsx` — the bullet-bar component
- `frontend/src/components/DistinguishedCompositionBar.tsx` — reference
  segmented-bar implementation for the composition question
- Lesson 62 (#546) — distinct badge families deserve distinct row
  positions; same principle at a smaller scale: a tier marker is not
  a progress bar fill is not a composition swatch
- Issue #550 — the redesign issue, with the full design spec
- /simplify pass deleted 4 in-file copies of `ordinalSuffix` —
  extracted to `frontend/src/utils/ordinal.ts` as part of the same PR
