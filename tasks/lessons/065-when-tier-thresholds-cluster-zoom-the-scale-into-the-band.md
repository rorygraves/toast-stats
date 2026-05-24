---
name: When tier thresholds cluster, zoom the scale into the band
description: A linear [0, max] bar crushes tightly-clustered tier
  thresholds into a single illegible cluster at the right edge. Zoom the
  scale around the tier band so each threshold has room to breathe.
type: feedback
id: '065'
category: lesson
tags: [charts, frontend]
auto_load: true
date: 2026-05-21
issues: [558]
---

# Lesson 65 — When tier thresholds cluster, zoom the scale into the band

**Date:** 2026-05-21
**Issue:** #558 (KpiBulletCard tier ticks collide on D61 data)

## What happened

The bullet bar in #550 used a `[0, Smedley]` linear scale to show
"how close are you to each Distinguished tier?" For Paid Clubs on
District 61 the four thresholds are D=158, S=161, P=164, Sm=169 —
a ~7% spread at the top of the bar. The four tier ticks collapsed
into positions 93%, 95%, 97%, 100% with their labels (D, S, P, Sm)
and threshold values (158, 161, 164, 169) **visually overlapping each
other**. The bar was illegible.

The redesign assumed "0 is a meaningful anchor" (you can see how far
from the start you are). In practice, districts always have a
meaningful baseline well above 0 — paid clubs grow from a paid-club
base, payments grow from a payment base, etc. The 0 anchor was
informational nothing.

## How to apply

**When tier thresholds for a metric are clustered in the top decile
of the metric range, drop the 0 anchor and zoom the scale around the
tier band.**

A self-expanding zoom scale is simpler than fixed paddings:

```ts
const minScale = Math.max(0, Math.min(current, 0.9 * lowestTier))
const maxScale = allTopTierAchieved ? current : 1.05 * topTier
const positionAt = (v: number) => ((v - minScale) / (maxScale - minScale)) * 100
```

The auto-expansion handles three edge cases without explicit clamping:

- **current far below the band** → `minScale = current` → marker pins
  to the left edge; tiers spread across the rest of the bar.
- **current at/above the top tier** → `maxScale = current` → marker
  pins to the right edge; the "5% headroom" disappears so the bar
  reads as full ("you've made it").
- **current well above** → `maxScale = current` → marker at 100%;
  tier ticks slide left as the bar zooms out.

Telltale signs you have this problem brewing:

- Three or more tier ticks fall within 10% of the bar's right edge.
- Labels need staggering (alternate above/below the bar) to be
  readable — that's the visual asking for a scale change.
- The first time you see real data, you think "wait, the bar is
  broken" — but the math is right; the scale is wrong.

**Why:** the user's question is "where am I within the tier range?"
not "where am I within the full metric range starting at 0?" Bars
should answer the actual question.

**How to apply:** measure the tier span (`topTier - lowestTier`). If
it's < 10% of `topTier`, your scale must zoom; if it's > 30%, a
`[0, topTier]` linear scale is probably fine.

## Trade-offs

- Lose the 0 anchor. A user can no longer eyeball "I'm at 88% of
  Smedley" from the marker position. But that information wasn't
  legible on the cluttered bar either.
- At-Smedley behavior is non-continuous (marker jumps from ~76% to
  100% as current crosses Smedley). Defensible: hitting Smedley IS a
  discrete milestone; the visual saying "you did it" with a full bar
  is the right semantic.

## Related

- `frontend/src/components/KpiBulletCard.tsx` — the zoom-scale algorithm
- Issue #558 — the bug report with screenshots
- Lesson 63 (#550) — the parent decision to use a bullet bar for the
  progress question in the first place. Picking the right chart type
  is necessary but not sufficient; the scale choice is the rest of
  "answer the question well."
