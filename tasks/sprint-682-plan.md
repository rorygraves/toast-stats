# Sprint 8 (#682) — breakpoint reconciliation + dark-mode panel audit

Epic #674, final sprint. Branch `sprint-682-breakpoints-darkmode` off `origin/main`.

## Handoff spec (source of truth)

`docs/design/club-redesign-2026-05/HANDOFF.md` §126/§234:

- **2-col grids collapse at 980px**
- **Tables → cards at 640px** (already done: ClubsTable `useIsMobile(640)`)

## A. Breakpoint reconciliation (criterion 1)

Genuine 2-col content grids on the district surface not yet on 980:

| #   | File:line                                                  | Now                     | →                         |
| --- | ---------------------------------------------------------- | ----------------------- | ------------------------- |
| 1   | `DistrictOverview.tsx:100` composition bar + payment donut | `lg:grid-cols-2` (1024) | `min-[980px]:grid-cols-2` |
| 2   | `TopGrowthClubs.tsx:301` Achievement Highlights inner grid | `md:grid-cols-2` (768)  | `min-[980px]:grid-cols-2` |
| 3   | `district-narrative.css:67` KPI strip 4-col                | `1024px`                | `980px`                   |
| 4   | `district-narrative.css:141` KPI toggle hide               | `768px`                 | `980px`                   |

Rationale #3/#4: reconcile the KPI strip's desktop threshold to the single 980 system (audit line 55 flagged "640/768 for KPI"). Keep #681's 640 → 2-col intermediate (avoids 4 tall stacked cards on tablet).

Tailwind v4 supports `min-[980px]:` arbitrary variants; verify build emits it (fall back to a CSS media-query class if not).

## B. Dark-mode panel audit (criterion 2)

Root cause: two dark-surface token systems. Neighbor panels use `.redesign-panel` → `--surface` (#111922 dark). The two flagged panels route through the legacy `bg-white` → `--surface-card` (#1A1722, **lighter**) or a light-baked gradient tint. Their `dark:` utilities are **inert** under the manual `[data-theme='dark']` toggle (Lessons 73/95; `@custom-variant theme-dark`, no `dark` variant).

| Panel                                          | Now                                                                       | Fix                                                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EducationLevelsCard` outer (loading + normal) | `bg-white … border-gray-200 dark:bg-gray-800 dark:border-gray-700`        | `redesign-panel`; drop dead `dark:` utils (base `text-gray-*` already remap in dark-mode.css)                                                                 |
| Achievement Highlights container               | `bg-gradient-to-r from-tm-loyal-blue-10 to-tm-cool-gray-20 shadow-md p-6` | `redesign-panel`                                                                                                                                              |
| Achievement Highlights inner stat cards (×2)   | `bg-white rounded-lg p-4`                                                 | `bg-[var(--surface-2)] border border-[var(--line)] rounded-lg p-4` — arbitrary-value vars re-resolve live in dark (Lesson 093), no dark-mode.css entry needed |

`--surface-2` (#161f2a dark / #f9fafb light) keeps the nested stat cards distinct from the panel `--surface` in BOTH modes.

## TDD

- **Red:** `__tests__/css-migration/district-breakpoints.test.ts` — parse `district-narrative.css` asserting 980 (not 1024/768) for the two rules; grep `DistrictOverview.tsx` / `TopGrowthClubs.tsx` for `min-[980px]:grid-cols-2` and absence of `lg:grid-cols-2`/`md:grid-cols-2` on those grids.
- **Red:** `__tests__/css-migration/district-panel-surfaces.test.ts` — assert `EducationLevelsCard.tsx` + Achievement Highlights container use `redesign-panel` and contain no `bg-white`/gradient/`dark:bg-gray-800`; inner stat cards use `bg-[var(--surface-2)]`.
- **Green:** apply edits. **Verify:** full suite, no regressions.

## Verification (criterion 3)

PR preview channel. Playwright smoke in chromium + webkit at 375/640/980/1280 + dark on `/district/61/analytics` and `/district/61` (Overview). Screenshots → /tmp, surfaced to operator. Lessons entry filed.

## Notes

- No `Closes #682` in PR body (Lesson 106). Close manually, last, after epic tick.
- This is the LAST sprint of #674 → close epic after (step 5 of runner protocol).
