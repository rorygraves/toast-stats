---
name: axe-core in JSDOM doesn't catch contrast — pair it with a static allowlist
description: jest-axe's color-contrast rule is auto-disabled in JSDOM
  (no canvas → no computed color), so a Phase 4-style "axe scan on a
  rendered page" catches structural a11y (ARIA, headings, labels) but
  NOT contrast. Pair it with a static greppy guard that asserts
  presence of a dark-mode override for every watchlist color utility,
  and ship the static guard with an allowlist (`EXPECTED_FAILURES`)
  that future PRs can only SHRINK.
type: feedback
---

# Lesson 75 — axe-core in JSDOM + the allowlist-as-tracked-debt pattern

**Date:** 2026-05-22
**Issue:** #583 (#564 Phase 4 — axe-core regression coverage + lint
guard for unmitigated utilities)

## What happened

Phase 4 of the contrast audit (parent #564) closes the loop with
automated regression coverage so future PRs cannot re-introduce the
classes of contrast bug Phases 1–3 hunted by hand. The temptation
was to write "one big axe-core test on every page" and call it done.
Two things made that wrong:

**1. JSDOM can't compute color contrast.** axe-core's
`color-contrast` rule needs a real layout engine to compute background

- foreground RGB. JSDOM has no canvas, so axe **auto-disables** the
  rule. A passing `expect(results).toHaveNoViolations()` in vitest is
  NOT evidence that the page passes WCAG AA contrast — it's evidence
  that the page passes WCAG AA _except_ contrast. Easy to miss because
  axe's output doesn't say "skipping color-contrast"; it just omits it
  from the violations array.

**2. The 53 unmitigated utilities catalogued in #564 are heterogeneous
debt.** Some are scoped to pages the contrast audit hasn't reached yet
(Awards, Region pages, ClubDetail, Methodology — Track D of epic #574).
Phase 4 was explicitly **guard-rail work, not fix work**. Adding
overrides for all 53 would have ballooned the diff into Tracks D
12–15, defeating the "one focused sprint per session" rule.

The answer to both: pair an axe scan (catches structural a11y) with a
static greppy scan (catches the contrast gaps axe can't), and let the
static scan ship with an `EXPECTED_FAILURES` allowlist that encodes
current tracked debt. Future PRs may shrink the allowlist as they add
overrides. PRs may not add to it without explicit acknowledgement —
the test errors with the list of class names so the author has to
choose: add the override (preferred) or document why the gap is
intentional debt.

## How to apply

**Rule:** When testing accessibility under jsdom-based vitest, treat
axe + static-grep as complementary, not alternatives:

- **axe-core** (jest-axe) — owns the structural rules: ARIA role
  permissions (`<aside role="navigation">` is a violation),
  heading-order, labels, landmark uniqueness, focusable controls.
- **Static greppy test** — owns the rules JSDOM can't compute:
  presence of a `[data-theme='dark']` override for every color
  utility that needs one, presence of any opacity-variant override
  (cf. opacity-variants-dark.test.ts), etc.

Pattern for the static test (`unmitigated-color-utilities.test.ts`):

```ts
const WATCHLIST = [
  /* color utilities known to need dark overrides */
]
const EXPECTED_FAILURES = new Set<string>([
  // Each entry is tracked debt with a clear owner sprint.
  // PRs may shrink. PRs may not grow without removing the test guard.
])

// Walk .tsx/.jsx, collect usedClasses, find missingOverrides,
// fail if (missing - allowlist) is non-empty,
// also fail if allowlist contains entries that are no longer missing
// (= stale, should be removed).
```

The two failure modes — "new gap appeared" and "allowlist is stale"
— together keep the allowlist accurate without manual audits.

**Watch out for:** the static test's regex needs to bound the class
name on both sides with `(?<![\\w-])` / `(?![\\w-])` to avoid matching
`text-red-700` inside a hypothetical `border-text-red-700`. Mirror
the regex shape that opacity-variants-dark.test.ts uses; it's been
debugged twice already.

## What axe DID catch in JSDOM that the static test couldn't

The new DistrictDetailPage axe scan caught two real structural bugs
on first run:

- `<aside class="district-anchor-toc" role="navigation">` — `aside`'s
  implicit role is `complementary`; you can't override to
  `navigation`. Fix: switch to `<nav>` (which is what the element
  was _intended_ to be).
- `<h3>` KPI card titles rendered directly under the page `<h1>` with
  no intervening `<h2>`. Fix: visually-hidden `<h2>` inside the KPI
  strip section, plus `aria-labelledby` pointing at it.

Both bugs predate Phase 4 — they were quietly broken since #572
shipped (sticky KPI bar). The lesson: **axe catches structural drift
that goes undetected when per-component tests stay focused on
unit-level rendering.** Page-level axe is worth running even when
per-component axe coverage is already in place.

## Theme toggle in tests

To run axe in dark mode under vitest, set
`document.documentElement.setAttribute('data-theme', 'dark')` BEFORE
the render call, then remove it in `afterEach`. The
DarkModeContext-driven attribute is the single source of truth for
the app's dark-mode CSS scope; setting it directly bypasses the
context plumbing without changing the render output.

```ts
beforeEach(() => document.documentElement.removeAttribute('data-theme'))
afterEach(() => document.documentElement.removeAttribute('data-theme'))

it('dark mode', async () => {
  document.documentElement.setAttribute('data-theme', 'dark')
  const { container } = renderPage()
  expect(await axe(container)).toHaveNoViolations()
})
```

Per-test attribute hygiene matters: forget the `afterEach` cleanup
and the next test in the file inherits dark mode silently.

## Telltale signs

- A page renders crisp green axe results under vitest, then ships with
  visible contrast bugs in production. axe didn't lie — JSDOM just
  doesn't have what axe needs to compute the contrast check.
- A PR adds a new `text-red-700` (or any saturated foreground) and CI
  is silent. Means the static guard's watchlist doesn't cover that
  utility yet, OR the class already had a dark override and you
  missed the regression elsewhere.
- A test claims "tests WCAG 2.1 AA compliance" but contains only
  jest-axe calls. Without an explicit color-contrast pairing, the
  claim overstates by ~30% (axe runs ~90 rules; ~30 of them are
  contrast-related and disabled in JSDOM).

## Related

- Lesson 73 — opacity-variant utilities need explicit dark overrides
  (sibling pattern; this lesson generalises it to ALL color
  utilities, not just opacity variants).
- `frontend/src/__tests__/css-migration/unmitigated-color-utilities.test.ts`
  — the static greppy guard with allowlist.
- `frontend/src/__tests__/accessibility/DistrictDetailPage.axe.test.tsx`
  — page-level axe scan in both themes.
- `frontend/src/__tests__/css-migration/opacity-variants-dark.test.ts`
  — the regex pattern this guard mirrors.
- jest-axe README's "Considerations" section — documents the JSDOM
  color-contrast limitation officially.
