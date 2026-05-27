---
id: '126'
category: lesson
tags: [css, frontend, responsive, tables, dark-mode]
auto_load: true
date: 2026-05-27
issues: [812, 813, 811]
---

# Lesson 126 — Porting a sticky-column treatment to a sibling table must re-derive the border restoration for THAT table's border-collapse model

**Date:** 2026-05-27
**Issue:** #812 (epic #813 Sprint 4 — club table priority-column responsive model), porting the pattern #811 established for the landing rankings table.

## What happened

#812 added a sticky key column (`position: sticky; left: 0`) to the club table,
mirroring the landing rankings table (#811). The obvious move is to copy #811's
sticky-cell CSS verbatim, including its row-rule restoration:

```css
/* districts (#811) */
.districts-rankings-table__sticky-col {
  box-shadow:
    inset -1px 0 0 var(--line),
    inset 0 -1px 0 var(--line-2);
}
.districts-rankings-table tbody tr:last-child .…__sticky-col {
  box-shadow: inset -1px 0 0 var(--line); /* zero the bottom on the last row */
}
```

That recipe is tuned for the **districts** table, which is
`border-collapse: collapse` (app-shell.css:1122). Under collapse, a positioned
(sticky) cell is taken out of the collapsed-border model and **drops the
collapsed borders entirely** — so #811 restores both the right seam AND the
bottom row rule with insets, and zeroes the bottom on the last row (the table
draws no rule under the final row).

The **club** table is `border-collapse: separate` (the default — its `<table>`
is just `table-auto`, with no collapse rule). Its row rule comes from
`#clubs-table tbody tr { border-bottom: 1px solid var(--line) }` on **every**
row including the last. The failure mode is different: the opaque sticky cell
**masks** the row border behind it (a gap in the hairline down the Club column),
not a dropped collapsed border. So the correct treatment for the club table is:

```css
.clubs-table__sticky-col {
  box-shadow:
    inset -1px 0 0 var(--line),
    inset 0 -1px 0 var(--line);
}
/* NO :last-child override — the club table keeps the bottom rule on every row */
```

Copying #811 verbatim would have zeroed the last row's rule (wrong here) and
used `--line-2` for the bottom (the club row rule is `--line`).

## The transferable lesson

**A sticky/positioned-cell border restoration is a function of the table's
`border-collapse` model and where its row rules are declared — not a reusable
snippet.** Before porting a sticky-column treatment to another table, check (1)
is it `collapse` or `separate`, (2) where does its row rule live (`tr`
border-bottom vs collapsed cell borders), (3) does the last row keep or drop its
rule. The visible-seam symptom looks identical across tables; the cause and the
fix differ. This matters now because ADR-006 §6 plans an
**evaluate-then-extract** shared `DataTable` primitive once both tables converge
— and the sticky-cell border logic is exactly the kind of detail that looks
shareable but carries per-table assumptions. The extraction must parameterize
the border model, not hardcode one table's recipe.

Corollary (verification): the dark-mode "is the sticky cell a dark surface?"
check failed on the live preview because the **first real club row was
vulnerable-status**, so its cell was a (correct) translucent amber tint, not the
untinted `--surface`. Target the specific state you mean to measure
(`[data-row-tint='none']`), never "the first row" — real data does not promise a
default-status first row (Lesson 108 family: measure the right node).

## How to apply

- Porting a positioned-cell treatment between tables: confirm the target's
  `border-collapse` value and row-rule source first; re-derive the box-shadow
  insets and any `:last-child` override for THAT model. Don't copy the sibling's.
- When asserting a themed background on a real-data row in a preview smoke,
  select by the state (`[data-row-tint='none']`), not by row position.

## Related

- [[105-match-the-mobile-table-pattern-to-the-datas-purpose-not-a-sibling-tables-precedent]]
  — same epic family: reuse shaped to the table's purpose, not blanket-copied
  from a sibling. This is the CSS-mechanism counterpart.
- [[116-bg-white-routes-to-a-lighter-dark-scale-than-redesign-panel-neighbours]]
  — the sticky cell's bg must converge on `--surface` (the shared scale), the
  reason the dark-surface check exists.
- [[108-verify-a-sticky-header-by-measuring-the-sticky-cell-not-the-thead-wrapper]]
  — measure the node that owns the property; the corollary above is the
  real-data-shape version of the same discipline.
