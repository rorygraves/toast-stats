---
name: Light-mode small-text contrast — where to tighten, where to stop
description: WCAG AA for normal text is 4.5:1. Tailwind's text-gray-400
  (#9ca3af) at any small size on white is 2.85:1 — flat AA failure.
  text-gray-500 (#6b7280) is 4.83:1 — passes AA but marginal, and at
  text-[11px] the audit's call is to tighten to gray-600 (7.59:1). The
  pair (text-xs, text-gray-500) is intentionally left alone — it passes
  AA at 12px and re-coloring it would balloon the diff into design
  territory.
type: feedback
---

# Lesson 74 — Light-mode small-text contrast: where to tighten, where to stop

**Date:** 2026-05-22
**Issue:** #564 (Phase 3 — light-mode small-text tightening)

## What happened

Phase 3 of the contrast audit had a deliberately narrow scope: bump
small-text foregrounds in light mode where they were either failing
or marginal under WCAG AA. The temptation in any contrast sweep is
to "darken everything one notch" — but that's a design change, not
a bug fix, and balloons the diff into territory that needs UX
re-review.

Two clear, mechanical rules sufficed:

| Rule                                   | Before     | After      | Contrast on white |
| -------------------------------------- | ---------- | ---------- | ----------------- |
| `text-gray-400` + `text-xs` (12px)     | `gray-400` | `gray-600` | 2.85:1 → 7.59:1   |
| `text-gray-500` + `text-[11px]` (11px) | `gray-500` | `gray-600` | 4.83:1 → 7.59:1   |

11 call sites across 8 files. The fix was a token swap.

Deliberately **out of scope**:

- **`text-gray-500` + `text-xs` (12px).** 4.83:1 passes AA. Sprint 6's
  audit didn't flag it. Touching it would have required a sweep of
  ~50+ sites and a UX call on whether to lift the entire small-grey
  band one step. Phase 4 (axe-core) is the place to mechanise that
  decision later.
- **Dark-mode foregrounds.** `dark:text-gray-400` is the companion at
  every fix site; under `[data-theme='dark']` the surface is dark
  enough that gray-400 over it lands above AA. Phase 2 (Lesson 73)
  handled the dark-mode opacity-variant bug separately.
- **Anything bigger than `text-xs`.** AA drops to 3:1 for large text
  (≥18.66px bold / ≥24px). `text-sm` (14px) is still "normal" by
  WCAG; gray-500 there is also 4.83:1 and untouched on purpose.

## How to apply

**When auditing contrast, fix the AA failures first; tighten the
marginals only where the audit calls for it.** The rule is:

1. If the combo fails AA on a representative bg (white for light
   mode, brand-darkest for dark), it's a bug → fix.
2. If the combo passes AA but the audit body specifically calls for
   tightening it (e.g. "11px is small enough that 4.83:1 is too
   tight"), it's in scope → fix.
3. Otherwise — even if it "looks low" — out of scope for the bug-fix
   PR. Tightening universally is a design change, not a fix.

The corollary: when a PR's scope is "tighten light-mode small text,"
do not also touch:

- the same fg at non-small sizes (`text-sm`, `text-base`)
- the same size at the next-darker fg (`text-gray-500` at `text-xs`
  passes AA — not yours to lift)
- dark-mode companions (different surface, different audit)

**Tooling:** Phase 3 added a greppy regression-guard test:

```
frontend/src/__tests__/css-migration/small-text-light-mode.test.ts
```

It scans every `.tsx`/`.jsx` under `src/` for forbidden combinations
within a single `className` attribute. When a new component
introduces a `text-gray-400 + text-xs` pair, this test fails at PR
time. No allowlist — only fix or refactor away from the pair.

## Telltale signs you are scoping too widely

- Contrast sweep PR diff is touching `text-sm` and `text-base` sites
  alongside `text-xs` / `text-[11px]`.
- You're "darkening text by one step" across the codebase without an
  audit row pointing at specifically that combo.
- Tests are failing because component snapshots changed, not because
  contrast assertions changed.

If any of these are true, narrow the scope back to "what specifically
fails or what specifically the audit named."

## The 7.59:1 destination

`text-gray-600` (#4b5563) on white is 7.59:1 — full WCAG AAA. That's
the right destination for `text-xs` and `text-[11px]` because:

- The smaller the text, the more legibility headroom you want over
  the bare AA floor.
- Going one further to `text-gray-700` would visually flatten small
  text against the dominant `text-gray-900` headings — distinction
  matters for hierarchy.

`gray-600` is the "safe small grey" in this codebase. New small-text
work should default there, not to `gray-500`.

## Related

- Lesson 73 — Phase 2 opacity-variant dark-mode sweep (the prior
  phase of this audit)
- Lesson 71 — when an audit's structural scope is right-sized, the
  diff should match. Same discipline.
- `frontend/src/__tests__/css-migration/small-text-light-mode.test.ts`
  — the regression guard
- `frontend/src/utils/contrastCalculator.ts` —
  ratio computation utility (already exists, used in the
  `accessibility/contrastRequirements.test.ts` property tests)
