# ADR-006: Data-table page layout & column-model standard

**Status**: Accepted
**Date**: 2026-05-27
**Issue**: #809 (epic #813 — table UX program, Epic A foundational sprint)
**Source review**: [`docs/design/table-ux-review-2026-05-27.md`](../design/table-ux-review-2026-05-27.md) §3 (architect), §4 (proposed epics)

## Context

The district landing table and the club table independently reinvent the same
mechanism — `table-auto` + `whitespace-nowrap`, an `overflow-x-auto` wrapper,
hand-tuned CSS widths, and hardcoded sticky pixels — with ad-hoc or absent
responsive behaviour. The review doc grounds the specifics in code:

- **Width.** `.districts-page { max-width: 1280px }` (`app-shell.css:389`) is a
  prose-readability cap misapplied to a data grid; on a 2560px display ~half the
  width is empty. The 13-column club table inside the same 1280 page (~1196px
  usable) **cannot fit below ~1600px** → an obligatory horizontal-scroll trap on
  nearly every desktop.
- **Responsive.** The landing table has **zero `@media` rules** and no card view;
  below ~1300px it forces horizontal scroll, and at 375px its two hardcoded sticky
  columns (~380px) alone overflow the viewport. The club table has a single 640px
  cliff that swaps the whole table for a card list — no tablet tier.
- **No column model, no shared primitive.** Every new column is hand-wired CSS,
  which is exactly why width keeps breaking. Recent column-adding branches (#688
  distinguished-remaining, #687 base/current/Δ) and the in-flight #795 delta
  columns keep widening a layer that has no abstraction to absorb them.

This ADR locks the table-page standard up front so Epics A (full-width +
responsive), B (filtering overhaul), and C (scalable column model + #795 delta
columns) all build against one set of answers, and so future column additions
don't re-break width. It is doc-only; the implementing sprints (#810–#812 and
the B/C epics) apply it.

## Decision

### 1. Full-width policy — a dedicated `--page-max-wide` token

Data-table pages use a wider cap; prose pages stay narrow.

- **`--page-max-wide: 1600px`** — the new token. Applied to the data-table page
  containers (`.districts-page`, `.district-detail-page`, and the club table
  page) in Sprint 2 (#810).
- **Prose / narrative pages keep `max-width: 1280px`** (the existing default).
  The 1280 cap is a readability rule for text columns and stays there; it is not
  the right cap for a data grid.

A wider **capped** width was chosen over fluid/edge-to-edge (see Alternatives):
1600px holds the club table's full column set without horizontal scroll on a
standard desktop while still bounding line length on ultra-wide displays. Width
is a CSS-token change (**R10** — override at the CSS level, reversible).

### 2. Responsive breakpoint tiers

Four tiers, matching the QE verification breakpoints (375 / 768 / 1280 / 1600):

| Tier        | Range         | Layout                                                                                |
| ----------- | ------------- | ------------------------------------------------------------------------------------- |
| **Mobile**  | `< 768px`     | Card view only (true mobile). **No horizontal scroll at 375px.** ≥44px touch targets. |
| **Tablet**  | `768–1279px`  | Table with **low-priority columns hidden**; sticky key column + visible scroll-cue.   |
| **Desktop** | `1280–1599px` | Full table; sticky key column + scroll-cue as needed.                                 |
| **Wide**    | `≥ 1600px`    | Full table, container capped at `--page-max-wide` (1600px).                           |

The card view appears **only at true mobile**, not as a desktop→mobile cliff; the
tablet tier degrades by hiding columns, not by swapping representations.

### 3. Per-column priority responsive model

Each table declares a **priority** per column. Degradation rules:

- Columns hide in ascending priority order as the viewport narrows (tablet tier
  hides the lowest-priority columns first).
- The **key column** (district name / club name) is **sticky** and never hidden,
  with a visible **scroll-cue** affordance when content is clipped.
- Replace the **hardcoded sticky pixel offsets** with a robust sticky mechanism
  (no `left: 120px` magic numbers).
- No horizontal scroll at 375px; the card view carries the full record there.

### 4. Per-table column descriptor (the column model)

Each table defines its columns as descriptors — the basis for Epics A/B/C:

```
ColumnDescriptor {
  id          // stable key
  header      // display label
  priority    // responsive hide order (lower hides first)
  group       // for column-group show/hide (Identity / Membership /
              //   Renewals / Recognition / Changes)
  align       // 'left' | 'right' | 'center'
  width/min   // explicit width or min-width (replaces table-auto guesswork)
  sticky      // is this the sticky key column
  visibility  // current shown/hidden state (drives tier hiding + group toggle)
  formatter   // cell-render function
}
```

This is introduced **per table first**. The existing filter pipeline
`original → filtered → searchFiltered → sorted` stays intact (**R11**) — the
column model and the UI overhaul are presentation over that pipeline, not a
rewrite of it.

### 5. Filter model — a dedicated Filters panel/drawer

Decided 2026-05-27 (review §5 Q3). The club table consolidates its three current
filtering mechanisms (status segmented control, quick-filter chips, hidden
per-column header dropdowns) into:

- **One visible search box** (club/name) at the top, URL-synced.
- A **dedicated Filters panel/drawer** replacing the undiscoverable ~2.5px header
  dropdowns; instant-apply (drop the mandatory "Apply" button).
- **One intent-based preset row** (merge the two overlapping quick-filter sets;
  remove the hidden auto-sort side effect on "Close to Distinguished").
- An **active-filters summary bar** ("3 filters · Clear all") and a zero-results
  empty state that names the offending filter. URL-sync all filters.

This is the Epic B target; the column model (this ADR) is the substrate it sits on.

### 6. Evaluate-then-extract for a shared `DataTable` primitive (R6)

Introduce the **per-table column model now**; converge both tables onto it;
**then** extract a shared headless `DataTable` primitive **only if the overlap
proves real** once both tables have converged. We do not build a shared primitive
up front — that is premature abstraction (**R6** — verify actual code overlap,
don't assume from similar names). If the overlap turns out thin, Epic C's extract
step closes won't-do.

### 7. #795 delta columns land as an opt-in group, not always-on

The in-flight delta columns (#795) land via the column model as an opt-in
**"Changes"** group (Epic C), **not** as five always-on columns added to a table
that already overflows. (Recorded here because it is the column-model decision
that motivated the group dimension; the disposition itself is owned by Epic C / #797.)

## Consequences

**Easier:**

- Data tables get the width they need; one token (`--page-max-wide`) controls it
  and is trivially reversible.
- A new column is a descriptor entry with a priority and group, not a round of
  hand-tuned CSS — column growth stops re-breaking width.
- Graceful responsive degradation (hide-by-priority at tablet, card view at true
  mobile) replaces the current scroll-trap / hard cliff.
- One legible filter model replaces three overlapping mechanisms.

**Harder / costs:**

- Both tables must be migrated onto the column model (Sprints #811, #812) before
  the shared-primitive question can even be evaluated.
- A robust sticky mechanism must replace the hardcoded pixel offsets.
- Column-hiding and width/container changes can shift layout — every implementing
  sprint must **guard CLS** (Lighthouse ≤0.1; lessons 107/113) and verify at
  375 / 768 / 1280 / 1600 + dark mode on the PR preview channel.

## Alternatives Considered

- **Fluid / edge-to-edge width** (no cap). Rejected: ultra-wide displays would
  stretch rows to unreadable line lengths; a 1600px cap holds the full club-table
  column set without scroll while bounding the extreme. (Review §5 Q1.)
- **Extract a shared `DataTable` primitive first.** Rejected per **R6**: the two
  tables share a _smell_, not yet a verified abstraction. Build the column model
  per table, prove the overlap, then extract — or don't.
- **Ship #795's delta columns as always-on columns.** Rejected: adding five
  columns to a 13-column table that already overflows makes the disliked
  experience worse; they belong to a comparison context (opt-in "Changes" group,
  Epic C). (Review §2.)
- **Keep the 1280 cap and rely on horizontal scroll.** Rejected: the obligatory
  scroll trap on nearly every desktop is the originating complaint.
