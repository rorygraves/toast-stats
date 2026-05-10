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
