# Lesson 092 — Re-skin with the tool already in the file, not the one the ticket named

**Date:** 2026-05-23
**Issue:** #619 (Club page — Membership Trend chart + DCP Status panel, epic #617)
**Tags:** frontend, charts, fidelity, architecture, blast-radius, dark-mode

## What happened

Sprint 2 of the Club redesign re-skinned two panels to pixel-match
`club-reference.html`. The issue text said the Membership Trend chart should be
built with "Recharts (existing chart lib)". But the existing ClubDetailPage
chart was already a **hand-rolled SVG**, and the reference design is itself
hand-rolled SVG with a _fixed program-year x-axis_ (Jul 1 = day 0, Oct 1 = 92,
Apr 1 = 275, Jun 30 = 365 on a 365-day domain). The existing code already
solved the genuinely hard part — mapping data points to absolute program-year
days via `calculateProgramYearDay` — which Recharts' default category/number
axes actively fight.

## The decision (ron-sa)

Re-skin the existing SVG; do **not** migrate to Recharts. The acceptance
criteria were all _visual fidelity_ assertions (stroke 2.5px, area 8%, dots,
key-date verticals at exact days, dark-mode stroke #8ec5e8), none of which say
"use Recharts." The ticket's library mention was a _means_, and it was wrong
about the means. Blast radius: re-skin = 2 files; migrate = 3+ files plus
re-deriving the fixed-domain axis and day-positioned ReferenceLines inside a
library that doesn't model them naturally.

The clincher was **R10 (CSS-level theming)**: the dark-mode requirement is "line
stroke → #8ec5e8." With a hand-rolled SVG whose stroke/area/dot are CSS classes,
that's a 3-line `[data-theme='dark']` block. Recharts takes `stroke` as a prop,
so the same swap would leak into a JS branch — exactly what R10 forbids.

## How to apply

- **When a ticket names a tool, treat it as a hypothesis, not a constraint.**
  Check what's already in the file. If the existing implementation already
  solves the hard part, the lowest-risk path to the acceptance criteria is
  usually to improve it in place — not to swap libraries because a ticket
  sentence said so. Re-derive the decision from the _acceptance criteria_.
- **Let R10 pick your rendering primitive.** If a visual needs theme-reactive
  colors, prefer a primitive whose colors are CSS-addressable (classed SVG
  elements) over one that takes colors as props. The dark-mode swap then costs
  one CSS block instead of N component branches.
- **±N padding beats a `|| 1` range fallback.** The y-axis-inversion tripwire
  comes from `range || 1` collapsing to a 1-unit window. Padding the domain by
  a fixed ±N (here ±4, per the reference) makes the range _provably_ never
  zero, so the fallback is dead code you can delete — a stronger guarantee than
  the guard it replaces.

## A process catch (same family as Lesson 090)

The spawned session's worktree was based on a stale `main` (the runner detached
at an older commit; `origin/main` had Sprint 1's #618 work three commits ahead).
Branching from the detached HEAD would have _reverted_ Sprint 1. Caught it by
diffing `git log origin/main..HEAD` at launch and branching from
`origin/main` instead. **Always branch a long-lived worktree from the fetched
remote tip, not the worktree's possibly-stale base.**
(See [[090-vitest-project-split-needs-a-partition-guard]],
[[087-spawned-sessions-need-their-own-worktree-not-shared-checkout]].)

## Related

- [[081-phase-gated-deferral-tests-move-with-the-spec]] — fidelity work where
  the spec, not the author's instinct, is the source of truth.
- [[090-vitest-project-split-needs-a-partition-guard]] — the stale-base footgun.
