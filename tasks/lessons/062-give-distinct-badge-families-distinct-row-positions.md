---
name: Give distinct badge families distinct row positions
description: When a row already has inline badges, a new badge class with
  different semantics deserves its own column — not another inline pill.
  Same shape ≠ same meaning, and the position telegraphs the distinction.
type: feedback
id: '062'
category: lesson
tags: [frontend, css]
auto_load: true
date: 2026-05-20
issues: [546]
---

# Lesson 62 — Give distinct badge families distinct row positions

**Date:** 2026-05-20
**Issue:** #546 (DDP tier chip + density on Districts ranking page)

## What happened

The Districts ranking row already carries three inline competitive-award
badges in the District cell (Extension, 20-Plus, Retention trophies).
They are pill-shaped, yellow-on-light-border, all share the 🏆 prefix.

#546 added a fourth badge class — the DDP tier chip — for the year-end
outcome (Distinguished / Select / President's / Smedley). At first
glance, "small pill near the district number" was the obvious place
to put it. Same shape, same neighbourhood, minimal layout impact.

But the tier chip's _meaning_ is structurally different:

- Trophies = won a single award (one row per award type)
- Tier chip = overall year-end DDP outcome (one chip, weighted by tier)

Mashing both into the District cell would have made the row read as
"this district has 4 stickers" — visually flat, semantically incoherent.
The user has no way to tell that the tier chip is the headline outcome
and the trophies are subordinate.

The fix: give the tier its own column between Rank and Paid Clubs. Same
chip shape, but the column header ("Tier") plus the dedicated x-position
do the disambiguation work that the chip shape alone couldn't.

## How to apply

**When you add a new badge to a row that already has badges, ask: do
they belong to the same family?**

- Same family (e.g. several award trophies of the same type) → cluster
  inline; the visual repetition reinforces the family.
- Different family (e.g. award trophy vs. tier outcome vs. health
  status) → give each family its own structural position (column,
  cell, region). The position is the disambiguator.

Telltale signs you have this issue brewing:

- A row description starts to need scare quotes: "this is the _tier_
  chip, not a trophy."
- Hover tooltips do the disambiguation work that layout should do.
- Acceptance copy says "give it stronger visual weight" — you're
  asking the chip's appearance to compensate for muddled placement.

Specifically for this codebase: the rankings table is now structurally
divided into "identity (District / Region)", "outcome (Rank / Tier)",
"metrics (Paid / Payments / Distinguished)", and "score." Each badge
class lands in the segment that matches its meaning.

## Related

- `frontend/src/components/DistrictTierChip.tsx` — the new component
- `frontend/src/pages/DistrictsPage.tsx` — Tier column header + cell
- Lesson 58 — when an interactive element is invisible to keyboard
  users, you have a focus-visibility bug (caught mid-#546 when the
  methodology InfoTooltip ended up inside sr-only chrome)
- Lessons 60 + 61 + #545 — note that tier chips depend on
  `competitiveAwards.distinguishedDistrict[id].currentTier` which is
  computed from snapshot percentages. Until #545 lands and the next
  pipeline run completes, the chip will reflect the OLD denominator
  for some districts (e.g. D93 shows Select instead of President's
  on the first deploy of this PR). Both must ship as a pair.
- Issue #546 — the design exploration in the PM/UX framing of the
  issue was right to flag "make the page feel like a sticker
  collection" as a failure mode
