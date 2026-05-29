---
id: '140'
category: lesson
tags: [css, frontend, refactoring, simplify, process]
auto_load: true
date: 2026-05-29
issues: [879, 880]
---

# Lesson 140 — A deliberately-isolated surface namespace outranks a DRY "reuse" flag; a small typographic duplication is cheaper than cross-surface coupling

**Date:** 2026-05-29
**Issue:** #879 (epic #880 Sprint 3 — Epic E, "what does this page answer?" lede)
**PR:** #936

## What happened

Sprint 3 added a `.long-text-lede` class for the two doc-style routes
(`/methodology`, `/history`). The `/simplify` reuse agent correctly observed
that it is near-identical to the existing `.districts-page-header__lede` —
same `font-family`, `color: var(--ink-2)`, `max-width: 60ch`, differing only
in `font-size` (15px vs 14px) and `line-height` (1.5 vs 1.45). On the DRY
metric alone, that reads as duplication worth collapsing.

I declined the merge. `.districts-*` is a **deliberately isolated surface
namespace** (CLAUDE.md: "Districts is its own surface, distinct from app-shell
chrome and from the legacy tm-\* brand classes"). Reusing
`.districts-page-header__lede` on the methodology/history pages would couple
two unrelated surfaces through a shared class: a future restyle of the
Districts header lede would silently change the doc pages, and vice versa. The
"cost" the reuse agent priced ($190 of maintenance for one extra rule) is far
smaller than the cost of that coupling — an invisible cross-surface blast
radius that no test would catch until a Districts change broke a doc page.

## The transferable lesson

**A reuse/DRY finding measures token duplication; it does not measure
architectural boundaries. When collapsing the duplication would breach a
namespace that was isolated on purpose, the boundary wins.** Two classes that
_look_ alike are not duplication if they belong to surfaces that must be able
to diverge independently. The right response to the flag is not to merge it and
not to silently ignore it — it is to **document why the duplication is
deliberate at the point of duplication**, so the next reader (and the next
`/simplify` run) sees the boundary, not an oversight.

## How to apply

- Before collapsing two similar CSS classes, ask "do these belong to the same
  surface?" If one is in an intentionally-namespaced surface (`.districts-*`,
  legacy `tm-*`, brand `rt-*`), keep them separate.
- Leave a one-line comment at the duplicated rule naming the sibling it
  _looks_ like and why it stays distinct — converts "accidental duplication"
  into "documented intent" and pre-empts the same flag next sprint.
- A `/simplify` reuse finding is advice priced on one axis (duplication). You
  own the merge decision; weigh it against coupling/blast-radius, which the
  agent cannot see. Skipping a finding with a recorded reason is a valid,
  expected outcome — same spirit as [[137-an-audits-false-confidence-list-is-a-per-file-hypothesis-reconfirm-before-deleting]].

## Related

- `tasks/rules.md` R10 (CSS-level overrides for cross-cutting concerns) and the
  CLAUDE.md `.districts-*` namespace note — the boundary this lesson defends.
- [[081-phase-gated-deferral-tests-move-with-the-spec]] — sibling "the
  obvious-looking simplification is wrong once you know the intent" lesson.
