---
name: Tailwind opacity-variant utilities need explicit dark-mode overrides
description: bg-tm-*-N / text-tm-*-N / border-tm-*-N classes bake their rgba
  at compile time from the LIGHT-mode CSS variable. They never re-resolve
  under [data-theme='dark']. Every used opacity variant therefore needs an
  explicit selector override in dark-mode.css — there is no inheritance to
  fall back on, and overriding the underlying CSS var only fixes the base
  utility, not the opacity variants.
type: feedback
---

# Lesson 73 — Opacity-variant utilities need explicit dark-mode overrides

**Date:** 2026-05-22
**Issue:** #564 (contrast audit — Phase 2: opacity-variant sweep)

## What happened

Phase 1 of the contrast audit (shipped in earlier #564 commits) put
named, semantic overrides under `[data-theme='dark']` for the tier-
badge backgrounds and Additional Awards chips. That cleared the
visible bugs the user reported on the live site.

Phase 2 inventory found 23 additional opacity-variant utility classes
in use across the component tree (`bg-tm-loyal-blue-{10..90}`,
`bg-tm-cool-gray-{10..80}`, `bg-tm-happy-yellow-{20..80}`,
`bg-tm-true-maroon-{10..80}`, plus matching text and border variants).
10 of these already had overrides — accidentally; from earlier point
fixes — and 13 did not. The pre-existing overrides matched no obvious
ordering or rule.

The reason there is no inheritance to fall back on: Tailwind compiles
`bg-tm-loyal-blue-80` to a literal `background-color: rgba(93, 173,
226, 0.8)` at build time, sourced from the `--tm-loyal-blue` CSS var
**as it was defined when the utility was emitted** — i.e., the
light-mode value. The dark-mode override on `--tm-loyal-blue` (defined
elsewhere in `styles/dark-mode.css`) does NOT propagate to that
utility because the utility's `rgba()` call is gone; only the literal
remains.

So overriding the CSS variable fixes `.tm-bg-loyal-blue`, but does
**nothing** for `.bg-tm-loyal-blue-80`. The latter needs its own
selector.

## How to apply

**Rule (extends R10):** every `bg-tm-*-N` / `text-tm-*-N` /
`border-tm-*-N` utility used in a component must have a corresponding
`[data-theme='dark'] .<class>` rule in `frontend/src/styles/dark-
mode.css`. Override the variable in the `:root` block AND the
variant selector — both are necessary.

**Tooling:** the audit is automated by
`frontend/src/__tests__/css-migration/opacity-variants-dark.test.ts`.
When introducing a new opacity-variant utility, add the class name to
`TM_OPACITY_VARIANTS_IN_USE` AND add the override; the test will go
red otherwise.

**Why:** **Why:** CSS variables are computed where they appear in source. Tailwind's `rgba(var(--tm-X), N/100)` is computed once at build (or at the utility-emission site) and inlined as a literal `rgba(...)`. There is no live binding back to the variable. Re-binding only happens when the SELECTOR has the variable resolution INSIDE it — which is true for `.tm-bg-loyal-blue` (uses `var(--tm-loyal-blue)` directly) but FALSE for `.bg-tm-loyal-blue-80` (inlined `rgba()`).

**How to apply:** Before merging any PR that adds a `bg-tm-X-N` /
`text-tm-X-N` / `border-tm-X-N` class, grep the diff for that pattern
and confirm `opacity-variants-dark.test.ts` accepts the new class.

## Tailwind v3 `bg-X/N` opacity classes are a sibling problem

Same root cause, two flavours of expression:

- **Unconditional** usage (`bg-amber-50/50`) bakes a light rgba at
  build time. Needs a dark override; covered today by a wildcard
  attribute selector `[class*="bg-amber-50\\/"]` in `dark-mode.css`.
- **Variant-gated** usage (`dark:bg-yellow-900/40`) only emits CSS
  inside `@media (prefers-color-scheme: dark)` — by Tailwind 4's
  default `dark:` strategy. The project's manual `[data-theme='dark']`
  toggle does NOT activate this media query, so these utilities are
  inert under the manual toggle. They're not a contrast bug, they're a
  dead selector. **Tracked separately**; Phase 4 of #564 will decide
  whether to add `@custom-variant dark (&:where([data-theme='dark']
*))` and merge the two surfaces or audit and replace each call site.

## Telltale signs

- Component looks great in light mode, contrast bug in dark mode, and
  `grep` shows the offender is `bg-tm-X-N` or `bg-COLOR-N/M`.
- The brand color tokens (e.g. `--tm-loyal-blue`) ARE overridden in
  the `[data-theme='dark']` block — but the bug persists.
- DOM inspector shows `background-color: rgba(93, 173, 226, 0.2)` as
  a literal, not a computed value referencing a variable.

## Related

- Lesson R10 in `tasks/rules.md` — original "opacity variants don't
  inherit" rule. This lesson generalises it across all three sub-
  prefixes (bg / text / border) and adds the v3 `/N` slash sibling.
- `frontend/src/__tests__/css-migration/opacity-variants-dark.test.ts`
  — automated guard.
- `frontend/src/styles/dark-mode.css` — the override surface.
- #564 Phase 3 (light-mode small-text tightening) and Phase 4 (axe-
  core regression coverage) are separate sprints.
