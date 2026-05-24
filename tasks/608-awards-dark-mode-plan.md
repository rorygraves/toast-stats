# Sprint 12 (#608) — Awards page dark-mode sweep

## Scope (ron-pm / ron-ux)

The "Awards section/route" = two surfaces:

- **`/awards` route** — `AwardsPage.tsx` (`.awards-page*` / `.awards-page-card*`).
- **Awards Race section** — `AwardsRaceSection.tsx` (`.awards-race*`), the 3-card
  contender summary on the Districts leaderboard that defers to `/awards`.

`EducationalAwardsChart` is a district-detail chart, not part of the Awards
section/route — out of scope.

## Audit result (evidence over intuition)

Both CSS blocks are already token-driven (R10) — no hardcoded rgba. Resolved
every text token against the dark surface (`--surface` = `#111922`) using
`contrastCalculator`. All pass AA **except**:

- `.awards-race-card__leader-link` — `color: var(--loyal-500)` = `#004165`.
  `--loyal-500` has **no `[data-theme='dark']` remap**, so a near-black navy
  link renders on the dark surface (~1.3:1). FAIL.
- `.awards-race-card__progress-fill` — `background-color: var(--loyal-500)`
  (same token), a near-invisible fill on the dark track. Graphical-object
  contrast (<3:1). FAIL.

`AwardsPage` (`/awards`) is already clean: it uses `--link` / `--green-600` /
`--ink*` which all remap in dark.

## Fix

Swap both `--loyal-500` usages → `--link`. In **light** mode
`--link: var(--loyal-500)` → identical `#004165` (zero regression). In **dark**
`--link: #60a5d8` (~6.6:1 text / ~6:1 graphic). Semantically correct: the leader
link _is_ a link. Pure R10 — use the token that already remaps.

## TDD

- **Red:** `src/__tests__/accessibility/AwardsDarkModeContrast.test.ts` — parses
  the real CSS, resolves each awards foreground token in dark mode, asserts AA
  (text) / 3:1 (progress fill). Fails on the two `--loyal-500` usages.
- **Green:** the two-token CSS swap.
- **Verify:** full suite + browser-based axe smoke on prod after deploy.
