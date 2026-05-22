---
name: Dark-mode overrides must keep up with component color utilities
description: Every Tailwind color utility a component adopts is a new
  potential dark-mode hole. The override file (`dark-mode.css`) needs
  parallel maintenance, or unreadable contrast accumulates silently —
  no test fails, no lint flags it, but production looks broken.
type: feedback
---

# Lesson 67 — Dark-mode overrides must keep up with component color utilities

**Date:** 2026-05-22
**Issue:** #564 (comprehensive light + dark contrast audit) — Phase 1

## What happened

The user audited the live site after a sprint of UI redesigns
(#550–#561) and reported readability issues in **both** light and
dark modes. A code-level sweep found:

- **53 Tailwind color utilities** were used in components with no
  corresponding `[data-theme='dark']` override in
  `frontend/src/styles/dark-mode.css`.
- Multiple **opacity-variant brand utilities** (`bg-tm-loyal-blue-80`,
  `bg-tm-cool-gray-20`, etc.) bake `rgba()` at Tailwind compile time
  and don't inherit CSS-variable overrides — R10 already documented
  this tripwire; the audit confirmed it had accumulated 20+ untreated
  cases.

No test caught it. JSDOM doesn't run a real layout engine, so even
`getComputedStyle` would have returned the inline color — the
contrast violation only surfaces on a real screen against the real
surface color.

## How to apply

**Treat the `dark-mode.css` override file as part of the contract for
any new color utility a component adopts.** When a PR adds a new
Tailwind color class to a component:

1. Search `dark-mode.css` for `\.${cls}\s*{` — if absent, the PR is
   incomplete.
2. For brand opacity-variant utilities (`bg-tm-*-N`), there is no good
   override — they bake the rgba at compile time. Prefer the solid
   utility + a separate `[data-theme='dark']` rule, or replace with a
   CSS-variable-driven class.
3. The /review pass should check this explicitly when the diff touches
   `className=`-bearing JSX.

**Telltale signs you have this kind of gap:**

- Component renders fine in light mode; user reports "unreadable in
  dark mode."
- The styled element has a hardcoded color literal (Tailwind palette
  name like `bg-purple-100`) instead of a token-driven utility.
- The class appears in JSX but `grep -c "\.${cls}\s*{" dark-mode.css`
  returns 0.
- The component was added/touched in a recent PR without a
  paired `dark-mode.css` change.

**How to apply when designing a new component:** prefer
token-driven utilities (`bg-tm-loyal-blue` + a clean
`[data-theme='dark']` override) over generic Tailwind palette
classes. When a generic class is the right choice (e.g. status
badges for the four DDP tiers), pair the component PR with a
matching dark-mode.css addition in the same PR.

**Test coverage** for this class of issue is hard in JSDOM. Options:

1. Lint-style script that asserts every color utility used in
   `src/components/**/*.tsx` has a matching `dark-mode.css` rule —
   simple grep, runs in CI.
2. Visual regression (Playwright + Percy or similar) — heavier, but
   catches real layout-rendered contrast.
3. Preview-channel-driven visual review (now in place via #554) —
   manual but fast.

Phase 4 of #564 will pick one of these. For Phase 1 (this lesson),
the focus is closing the immediate gaps and documenting the pattern.

## Phase 1 scope

Added overrides for the District Detail surface only —
KpiBulletCard, RegionRankChip, DistrictOverview,
DistinguishedDistrictTrophyCase (tier badges + Additional Awards
chips), NotableDatesSection, DistinguishedCompositionBar,
PaymentCompositionDonut, UpcomingAnniversariesPanel, MilestonesCallout.

Other surfaces (Awards page, Region pages, ClubDetail, etc.) remain
for follow-up phases of #564.

## Related

- `frontend/src/styles/dark-mode.css` — the override file
- `tasks/rules.md` R10 — opacity-variant tripwire
- Lesson 66 (#559 hotfix) — JSDOM style assertions don't catch
  positioning bugs; lesson 67 is the same family for color/contrast
- Issue #564 — multi-phase audit tracking the rest
