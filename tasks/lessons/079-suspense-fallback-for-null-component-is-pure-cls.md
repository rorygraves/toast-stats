---
name: A Suspense fallback for a component that might render null is pure CLS — hoist the null-guard to the wrapper
description: LazyComparisonPanel wrapped ComparisonPanel in Suspense with
  a 400px chart-skeleton fallback. ComparisonPanel itself returns null
  when fewer than 2 districts are pinned — the default state for nearly
  every landing-page visit. So on every page load the wrapper reserved
  400px, then collapsed to 0 when the lazy chunk resolved and the
  component rendered nothing. That alone took CLS on `/` to 0.217 —
  more than 2× the 0.1 WCAG/Lighthouse threshold. The fix is one line
  in the wrapper, not in the component or its CSS.
type: feedback
---

# Lesson 79 — A Suspense fallback for a possibly-null component is pure CLS

**Date:** 2026-05-22
**Issue:** #488 (CLS = 0.217 on `/` fails Lighthouse threshold consistently)

## What happened

Two PRs (#483, #487) each failed the Lighthouse `cumulative-layout-shift`
assertion on `/` with the **identical** value 0.216968, then cleared
CI only on re-run. That's the signature of a real regression masked by
variance at the threshold boundary — not a flaky measurement.

The landing page (`DistrictsPage.tsx`) renders four async-ish surfaces
above the rankings table:

1. Loading skeleton → real page swap (when the rankings query resolves)
2. Last-visit diff strip (conditional on localStorage read)
3. AwardsRaceSection (conditional on a parallel competitive-awards query)
4. **`LazyComparisonPanel`** (always rendered, lazy-loaded chunk)

The dominant contributor turned out to be #4 — but not for the obvious
reason. Look at the wrapper before the fix:

```tsx
const LazyComponent = React.lazy(() => import('../ComparisonPanel'))

export function LazyComparisonPanel(props) {
  return (
    <Suspense fallback={<ChartSkeleton height={400} />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}
```

And `ComparisonPanel` itself starts with:

```tsx
if (pinnedDistricts.length < 2) return null
```

So on every landing-page mount with the default empty pin set:

1. Suspense fallback reserves **400px** for `ChartSkeleton`.
2. The dynamic import resolves a few hundred ms later.
3. `ComparisonPanel` mounts, finds `pinnedDistricts.length === 0`, and
   returns **null**.
4. The 400px placeholder collapses to 0. Every element below it (the
   entire rankings table and the methodology callout) jumps up 400px.

On a desktop viewport of 940px, that's roughly `0.85 × 0.42 ≈ 0.36` CLS
from this shift alone. The Lighthouse number we observed (0.217) was
closer because of viewport vs. impact-fraction nuances, but the wrapper
is unambiguously the dominant contributor.

**Local Lighthouse confirms causation:** 3 runs on the fix branch report
CLS 0.0124 / 0.0120 / 0.0000 (vs. 0.217 on main). Performance score
moved 0.86 → 0.97. One-line fix in the wrapper:

```tsx
export function LazyComparisonPanel(props) {
  if (props.pinnedDistricts.length < 2) return null // ← hoist the guard
  return (
    <Suspense fallback={<ChartSkeleton height={400} />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}
```

## How to apply

**Rule:** If a lazy-loaded component might render `null` for the
default-state props, hoist that null-guard into the lazy wrapper.

**Why:** A `Suspense` boundary commits its fallback synchronously. The
boundary doesn't know yet whether the eventual child will render zero
pixels or 400. If you let it wait to find out, you've already paid the
CLS for the wider of the two cases — and on the default code path the
component never paints anything at all. The fallback's height becomes
pure, unrecoverable layout shift.

**How to apply (the test):**

```ts
// fails on the buggy wrapper — passes after the guard is hoisted
it('renders nothing when the inner would render null', () => {
  const { container } = render(<LazyComparisonPanel pinnedDistricts={[]} ... />)
  expect(container.querySelector('.chart-skeleton')).toBeNull()
  expect(container.firstChild).toBeNull()
})
```

A unit test on the wrapper is enough — no need for integration coverage
or a CLS budget test in CI. Lighthouse already enforces the budget;
this unit test enforces the _cause_ a future refactor could re-break.

## Telltale signs you have this bug

- A lazy wrapper's Suspense fallback height is large (≥100px).
- The wrapped component has an early `if (x) return null` for the
  default state.
- Lighthouse CLS on the host page is over budget and the trace shows
  a "collapsed element" shift roughly equal to the fallback height,
  shortly after JS load.
- The fix involves chunk download timing — fast networks may see only
  a small shift; slow networks see it amplified.

## Why this isn't an isolated case

The same shape recurs anywhere a presentational component decides
"there's nothing meaningful to render right now":

- Banners that hide when no announcements
- Toast/alert containers
- Comparison/diff panels that need >=N inputs
- Filter side-rails that collapse on small screens
- Empty-state placeholders that the parent treats as "I'll just hide
  this"

Audit pattern: `grep -rn "React.lazy" frontend/src/` → for each lazy
wrapper, open the imported component and check whether its first
non-hook statement is `return null` (or an early `if (...) return null`).
If yes, hoist the guard.

## Reviewer's check that found the framing

The fresh-context review of PR #590 reframed the lesson from the
weaker generic "fallback dimensions must match" to the sharper
"don't render a fallback for a component that will render null."
Worth remembering — the inversion is the actual rule, the dimension
match is just the symptom.

## What we explicitly did NOT do

- Did not touch `AwardsRaceSection` (secondary CLS source on / —
  appears late when the competitive-awards query resolves separately
  from rankings). Lighthouse confirmed CLS was already at 0.012 after
  the wrapper fix; reserving more space would have been speculative
  and risked padding empty space on legacy snapshots that lack
  `competitive-awards.json`.
- Did not redesign the `isLoading` skeleton to geometrically match
  the loaded page. Same reasoning.

The discipline: ship the smallest fix that clears the threshold, let
Lighthouse CI confirm the others aren't needed.

## Related

- `frontend/src/components/lazy/LazyComparisonPanel.tsx` — the fix
  (1-line `if` + comment).
- `frontend/src/components/lazy/__tests__/LazyComparisonPanel.test.tsx`
  — the unit test that locks in the rule.
- `frontend/src/pages/__tests__/DistrictsPage.comparison.test.tsx` —
  `getByText` → `findByText` updates needed because the lazy chunk
  now actually loads only after a 2nd pin (legitimate async-aware
  update, not assertion pinning).
- Lesson 78 — same "manufactured fix for a non-reproducing symptom"
  trap avoided: this one IS reproducible (0.217 across 3 PRs to 6
  decimal places); the fix was legitimate.
- `lighthouserc.js:26` — the 0.1 CLS threshold this lesson defends.
