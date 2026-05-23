# Sprint 1 (#618) — Club page: Hero + 8-stat grid + back-link

Epic #617. Pixel-perfect against `docs/design/club-redesign-2026-05/club-reference.html`.

## Gap analysis (current → reference)

| Item           | Current                               | Reference                                                   | Action                                |
| -------------- | ------------------------------------- | ----------------------------------------------------------- | ------------------------------------- |
| Hero bg        | solid `var(--loyal-500)`              | `linear-gradient(135deg, --loyal-500 0%, --loyal-600 100%)` | add gradient                          |
| Hero radius    | `--rds-radius-lg` (12px)              | `--radius` (8px) → `--rds-radius-md`                        | 12→8px                                |
| Hero h1        | 30px                                  | 28px                                                        | 30→28px                               |
| Eyebrow alpha  | .78                                   | .70                                                         | adjust                                |
| Sub alpha      | .85                                   | .78                                                         | adjust                                |
| Stats grid     | Tailwind `grid-cols-2 sm:grid-cols-4` | 8-col → 4-col ≤640 → 2-col ≤420, `.stat` cards              | new `club-stats-grid`/`club-stat` CSS |
| Net Δ label    | "Net Change"                          | "Net Δ"                                                     | rename                                |
| Stat val color | Tailwind text-green/red               | `.stat-val.pos/.neg/.tick/.cross`                           | new classes                           |
| Page width     | `container mx-auto` (≤1536 at 2xl)    | max-width 1280, padding 24                                  | fixed 1280 wrapper                    |
| Back-link      | removed (#577)                        | `.back-link` anchor at bottom                               | re-add as `<Link>`                    |

## Deliberate deviations from reference (documented in PR)

- **Breadcrumb trail kept as `District N › Clubs › Club`** (the #615 `SubpageBreadcrumb`, already wired).
  Reference shows `Districts › District 57 › Club`. We keep the existing trail because #442 removed
  the leading Districts/Home crumb (AppShell active-nav is the top-level signal) and #577 added the
  Clubs crumb for filter round-trip. These are deliberate, later product decisions; pixel-fidelity on
  the hero/stats does not justify regressing them. Build item "wire breadcrumb from #615" is satisfied.
- **Back-link re-added** despite #577 removing it ("one back affordance"). #618 explicitly lists it as
  build item #4 and the operator confirmed pixel-perfect against the reference (which has it). The
  redesign reintroduces it as an anchor link at the page bottom. Spec evolution (Lesson 081), not
  assertion pinning — the #577 test is updated to assert the link, not its absence.

## TDD (jsdom-testable structure; CSS verified live)

- **Red**: in `ClubDetailPage.test.tsx`
  - "Net Change" → "Net Δ" assertion
  - stats container has `club-stats-grid` class
  - bottom back-link: `<Link>` role=link name=/Back to District 61/ href=/district/61
  - update #577 test: assert the back-link link exists (reference uses anchor, not button)
- **Green**: update `ClubDetailPage.tsx` JSX (stat classes, Net Δ, val pos/neg/tick/cross, back-link,
  1280 page wrapper) + add CSS in `app-shell.css` (gradient, radius, typography, `club-stats-grid`,
  `club-stat*`, `club-back-link`).
- **Refactor**: /simplify + review.
- **Verify**: full `npm run test:frontend`, build, then live Playwright smoke + screenshots at
  375/768/1280 × light/dark + axe.

## UX gates (ron-ux)

- No horizontal scroll at 375px; 8/4/2-col confirmed.
- Net Δ keeps +/- sign; CSP keeps ✓/✗ glyph (don't-rely-on-color-alone).
- White-on-loyal-gradient, green/red-on-surface all ≥4.5:1; axe pass light+dark.
- Hero gradient stays loyal-blue in dark (tokens --loyal-500/600 not dark-overridden).
