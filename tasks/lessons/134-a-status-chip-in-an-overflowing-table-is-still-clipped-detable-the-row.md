---
id: '134'
category: lesson
tags: [css, frontend, responsive, mobile, tables, verification, playwright]
auto_load: true
date: 2026-05-28
issues: [871, 873]
---

# Lesson 134 — Chipping a status cell doesn't fix mobile truncation while the table still overflows; de-table the row, and verify "unclipped" by bounding box, not `toBeVisible`

**Date:** 2026-05-28
**Issue:** #871 (epic #873 Sprint 1 — CC-4, mobile status columns)
**PR:** [#908](https://github.com/taverns-red/toast-stats/pull/908)

## What happened

CC-4 was "Status / Outlook columns truncate at 375px" — the cell clipped to
"vulne…" / "interv…". The obvious fix is to wrap the status value in a colored
chip (`.clubs-status-pill` + icon + label). I did that for the Division and
Area club mini-tables and the unit/integration tests went green.

But the chip was **still clipped on the live preview** — "✗ Intervention R…".
The mini-table is a 4-column grid (Club | Status | Members | Distinguished) with
`whitespace-nowrap` club names, so at 375px the **table itself overflows** its
`.overflow-x-auto` wrapper and scrolls the Status column off the right edge.
Chipping the cell value changed _what_ renders in the column, not _whether the
column fits_. The truncation lived one level up, in the table's intrinsic width.

The real fix was the one the audit already named ("let it be a chip, **don't try
to table it**") and Lesson 105 already generalized: a browse-one-row list
card-collapses on mobile. I replaced the table at `<768px` with a stacked
`ClubMiniList` — one card per club, name + a fully-visible chip + a
Members/Distinguished meta line. Desktop keeps the table unchanged.

## Two transferable points

1. **A cell-level treatment can't fix a table-level overflow.** Before
   "rendering the column differently" on mobile, ask whether the _table_ fits
   the viewport at all. If long cells (`whitespace-nowrap` names) make the table
   wider than the phone, every column past the fold clips regardless of its
   content. The fix is the row layout (de-table / card-collapse per Lesson 105),
   not the cell.

2. **`toBeVisible()` does not catch viewport clipping.** Playwright's
   `toBeVisible` is true for an element scrolled off-screen inside an
   `overflow-x:auto` container — so my first smoke passed against a clipped
   chip. To verify "fully on screen," measure `boundingBox()` and assert
   `box.x + box.width <= viewportWidth` (and `box.x >= 0`). Same jsdom-can't-see-
   layout family as Lessons 66 / 110: the unit test proves the chip _class_
   ships; only a live geometry assertion proves it isn't clipped.

## Verification-harness footguns also hit here

- Measuring during an SPA route transition is racy: `locator.all()` captured a
  stale page's chips mid-navigation (waited for `.nth(6)` on a 5-chip page).
  Drive each surface with a **direct `page.goto()`**, not an in-app click, so no
  prior page's nodes linger.
- Measure **after `document.fonts.ready`** — Space Grotesk / Inter reflow text
  width on load and transiently mis-position a right-aligned chip, which made
  the bounding-box assertion flaky until fonts settled.

## How to apply

- Mobile table sprint: decide row layout first (does it fit? if not,
  card-collapse), then style the cell. Don't chip a cell inside a table that
  overflows.
- Any "is it on screen at width W" check: assert the bounding box is within the
  viewport; `toBeVisible` is necessary, not sufficient.

## Related

- [[105-match-the-mobile-table-pattern-to-the-datas-purpose-not-a-sibling-tables-precedent]]
  — these mini-tables are browse-one-row lists, so card-collapse is the right
  pattern; this lesson is the "I tried to chip-in-place first" cautionary tail.
- [[110-jsdom-textcontent-ignores-css-text-transform-live-innertext-does-not]]
  and [[066-jsdom-style-assertions-dont-catch-positioning-bugs]] — jsdom proves
  what ships; the browser proves what renders. Clipping is the geometry instance.
- [[077-presentational-extraction-override-classes-not-variants]] — `StatusChip`
  and `ClubMiniList` reuse the shared label/modifier/pill SoT, className-override
  style, no variant taxonomy.
