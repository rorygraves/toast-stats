# Founder Log — 24h Autonomous Mandate

Started: 2026-05-10 ~10:00 (post #383 push)
Mandate: complete Epic #352 (redesign) + Epic #370 (Awards page) + discovered tech debt.

## Operating principles

1. **Never bump test timeouts to silence slowness.** Lesson 51 / `feedback_no_timeout_bumps.md`. The right fix is always to tighten render scope.
2. **Every PR ships at quality** — TDD, /simplify pass, fresh-context review before push.
3. **No feature flags. No half-finished implementations.** Per global manifesto.
4. **Sequential merges to `main`.** No batch-merging at the end.
5. **Be honest about what doesn't fit.** If a sub-issue needs new data wiring or a major refactor, defer with a tracking issue.
6. **Use agents to parallelize independent work** — review, exploration, multi-file searches.
7. **Record decisions here** with timestamps so the audit trail survives the session.

## Realistic 24h outcome

There are ~14 remaining redesign issues + 3 Awards issues + ≥2 tech-debt items. At ~1-2h per issue (TDD + simplify + review + CI + merge), the upper bound is ~10-12 issues. Expected outcome:

- **Confident**: finish Sprint 3 (#358 ✓ #359), Sprint 4 (#360, #361), Sprint 5 (#362-#365), Sprint 6 (#366), tech-debt round 1.
- **Likely**: Sprint 7 (#367, #368, #369 partial).
- **Stretch**: Awards epic (#370/#371-#373).

If I'm running long, I'll defer the Awards epic — it's lower user-visibility and stands alone. The redesign is the main story.

## Strategic decision: bundle tech debt into #359

**Discovered tech debt (from #358 review):**

- `DistrictDetailPage.AnalyticsTab.test.tsx` mounts the entire 1084-line page just to assert "Analytics tab exists in nav."
- Same pattern in `mobile-ux.test.tsx` and other DistrictDetailPage.\*.test.tsx files.
- 12 `date-consistency.integration.test.tsx` assertions migrated to brittle `getAllByText[0]` instead of `getByRole('heading')`.

**Decision**: roll the AnalyticsTab refactor INTO #359 (tab bar primitive). #359's natural deliverable is to extract the tab bar as a component — exactly what the over-broad tests need. Two birds, one stone.

The 12 brittle assertions get a separate small cleanup PR after #359 lands.

## Plan

| Order | Issue                                              | Notes                                       |
| ----- | -------------------------------------------------- | ------------------------------------------- |
| 0     | merge #383                                         | already green; Sprint 3 first half          |
| 1     | tech-debt: revert any leftover timeout bumps       | `AreaRecognition` bump may still be in main |
| 2     | #359 tab bar primitive + AnalyticsTab refactor     | one PR; closes Sprint 3                     |
| 3     | tech-debt: migrate `getAllByText[0]` → `getByRole` | small cleanup PR                            |
| 4     | #360 Overview tab                                  | biggest visible change                      |
| 5     | #361 Clubs tab                                     | high-traffic surface                        |
| 6     | #362-#365 remaining tabs                           | one PR per tab                              |
| 7     | #366 Club detail page                              | full page rebuild                           |
| 8     | #367 History page                                  | net-new content                             |
| 9     | #368 Methodology page                              | content from analytics-core                 |
| 10    | #369 cleanup                                       | retire LandingPage + dead components        |
| 11    | Awards epic if time remains                        | #371, #372, #373                            |

## Decisions

_(timestamped entries below)_

---

### 14:11 UTC — #383 (Sprint 3 / #358 District header) merged

Squash to `9c5df236`. Coverage suite green. Sprint 3 first half done.

### 14:13 UTC — Audit: no leftover timeout bumps from my work

`grep`'d for `, 15000)` and `, 8000)` across all test directories. The 5 hits are in `__tests__/integration/journeys/0[1-5]-*.test.tsx` and predate my work (`git log --follow` shows they were added in commit `f5909dff`). Those journey tests legitimately need 15s — they walk multi-step user flows with router transitions + data loads.

`AreaRecognition.integration.test.tsx` is clean — my early bump there was reverted with the rest.

### 14:15 UTC — Strategy decision: bundle #359 with AnalyticsTab tech debt

#359 ships the tab bar primitive. The over-broad `AnalyticsTab.test.tsx` mounts the entire `DistrictDetailPage` to assert `<button>Analytics</button>` exists in the nav — exactly the pattern that bit #358. Extracting `DistrictDetailTabs.tsx` for #359 lets that test mount the small component instead. One PR, two wins.

### 14:36 UTC — #385 (#359) merged. Sprint 3 complete.

Tab bar primitive shipped + 6 brittle test files migrated from `.toHaveClass('text-tm-loyal-blue')` style assertions to `aria-selected`. Filed #384 as a deferred a11y follow-up (arrow-key nav + tabpanel linkage on the new tablist).

### 14:43 UTC — #386 brittle-assertion cleanup merged

12 `getAllByText('Test District 1')[0]` calls in `date-consistency.integration.test.tsx` migrated to `getByRole('heading', { level: 1, name: /test district 1/i })`. Lightweight DoD — single test file, no logic change.

### 14:50 UTC — Sprint 4 strategy: pragmatic token chrome refresh

Realistic scope check: doing each tab "1:1 match handoff" with chart visual restyling (thin strokes, dots, gridline polish, axis inversion etc.) is multi-day work. The 24h budget is finite. Pragmatic founder call:

**For #360-#365**: apply the redesign tokens + dark-mode-aware panels to the existing tab content. Each section gets `var(--surface)` + `var(--rds-radius-md)` + `var(--rds-shadow-sm)` instead of hardcoded `bg-white rounded-lg shadow-md`. Panel headers shift to Montserrat 14/700. Functional content unchanged. Pixel-perfect chart restyling and the genuinely-new Global Rankings sections (ranking progression with metric toggle, multi-year comparison table) get filed as follow-up sub-issues.

This trades "1:1 handoff fidelity" for "architectural redesign complete" — each tab is dark-mode-aware, uses redesign tokens, matches the design's typography rhythm. Pixel polish is real work that deserves its own focused PR.

**Tactic**: introduce a single `.redesign-panel` class in `app-shell.css` with the token-driven panel chrome. Apply it to existing components in a small touch (replace 3 hardcoded class strings per component). Heavy lift comes only when a section is genuinely new.
