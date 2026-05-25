---
id: '105'
category: lesson
tags: [frontend, css, responsive, accessibility, ux]
auto_load: true
date: 2026-05-25
issues: [689, 683]
---

# Lesson 105 — Match the mobile-table pattern to the data's purpose, not a sibling table's precedent

**Date:** 2026-05-25
**Issue:** #689 (epic #683 Sprint 6 — region pages)

## What happened

The region detail table had grown to 19 columns (base/current/Δ × 3 metrics +
three remaining-to-Distinguished counts + officer awards + tier) and was
scroll-only on mobile. The sprint stub offered two responsive strategies:
card-collapse "like the clubs table" or a documented horizontal scroll.

The reflex is to copy the clubs table's `useIsMobile(768)` card-collapse,
because it's the in-repo precedent. That reflex is wrong here. **A regional
ranking table exists to compare districts _across rows_** — "who's ahead, who's
behind." That comparison lives in the columnar alignment. Collapsing each
district into a stacked card destroys the one thing the table is for, and
produces ~10 tall cards you can't scan against each other. The clubs table
card-collapses correctly because each club is _browsed independently_ — there's
no cross-row comparison to preserve.

## The principle

The mobile pattern follows the data's **job**, not a sibling component's choice:

- **Comparison across rows** (leaderboards, rankings, scorecards) → keep the
  table; make horizontal scroll non-trap. Cards break the comparison.
- **Browsing one entity at a time** (a list of clubs, a feed) → card-collapse is
  right; the per-row detail is what matters, not row-vs-row alignment.

"Be consistent with the other table" is the trap — consistency means matching
the _pattern to the purpose_, not blindly reusing a neighbour's breakpoint hook.

## Making a horizontal scroll non-trap (the three moves)

An "intentional documented scroll" only escapes the scroll-trap criticism if it
is:

1. **Keyboard-operable** — the scroll container needs `role="region"` +
   `tabindex="0"` + an `aria-label`, or keyboard-only users can't scroll it
   (WCAG 2.1.1; axe `scrollable-region-focusable`). A bare `overflow-x:auto` div
   is a mouse-only trap.
2. **Orientation-preserving** — pin the identity column(s) with `position:
sticky; left:…` so the row stays labelled while metrics scroll off. Two
   sticky columns: the first at `left:0` with a fixed width, the second at
   `left:<that width>`. Under `border-collapse: collapse`, a positioned cell
   **drops its borders** — restore the row rule with `box-shadow: inset 0 -1px 0
<line>` on every sticky cell, symmetrically.
3. **Discoverable** — a right-edge fade cue (or scroll shadow) so "there's more
   →" is visible, not guessed.

A sticky cell needs an **opaque, themed** background (`var(--surface)`) so the
scrolling columns don't bleed through — never a hardcoded literal (lesson 092),
or dark mode shows a light cell. Verify the sticky bg is a token in the
contrast audit.

## How to apply

- Before picking card-collapse, ask: does this table's value come from
  comparing rows, or from reading one row? Only the second wants cards.
- If you keep the scroll, ship all three non-trap moves together — a sticky
  column without keyboard access, or keyboard access without a cue, is half a
  fix.
- Document the choice (product-spec + a code comment) so the next person
  doesn't "fix" the intentional scroll into a card collapse.

## Related

- [[092-fixed-background-elements-need-literal-colors-not-theme-tokens]] — the
  sticky-cell background is a new themed surface; same trap if hardcoded.
- [[095-darkmode-token-bumps-must-be-sized-for-the-lightest-surface]] — sticky
  bg is `--surface` at rest, `--surface-2` on hover/header; text must clear AA
  on the lighter one.
- [[077-presentational-extraction-override-classes-not-variants]] —
  sibling family: reuse shaped to the surface, not a blanket copy.
