---
name: Tab merge cascades into the test surface — budget for it
description: Removing a tab from a tabbed UI doesn't just delete one
  panel — it invalidates every test that asserted "click tab → see
  content." Plan the test-rewrite cost up front; it's 5–10× the
  component edit.
type: feedback
id: '068'
category: lesson
tags: [vitest, tests, frontend]
auto_load: true
date: 2026-05-22
issues: [569]
---

# Lesson 68 — Tab merge cascades into the test surface — budget for it

**Date:** 2026-05-22
**Issue:** #569 (District IA Phase 1 — stack narrative)

## What happened

#569 collapsed three tabs (Overview / Trends / Analytics) into a
single scrollable narrative on `/district/:id`. The component-level
change was small:

- 3 entries removed from a `TABS` array
- 3 conditional guards updated (`activeTab !== 'trends'` → `!isNarrativeView`)
- A new `isNarrativeView` derivation

Maybe 15 lines net.

The test surface broke open immediately:

| File                                         | Old assertion shape                                              | Tests broken |
| -------------------------------------------- | ---------------------------------------------------------------- | ------------ |
| `DistrictDetailPage.AnalyticsTab.test.tsx`   | "click Analytics tab → see content"                              | 4            |
| `DistrictDetailPage.TrendsTab.test.tsx`      | "click Trends tab → see chart"                                   | 5            |
| `DistrictDetailPage.GlobalRankings.test.tsx` | "Global Rankings appears alongside 5 other tabs"                 | 4            |
| `01-NavigationFlow.test.tsx` (integration)   | "tab named `/^Clubs$/i`" — strict-equal, breaks with count badge | 1            |
| `DistrictDetailTabs.test.tsx` (unit)         | "renders 6 tabs in order"                                        | 6            |

20 tests across 5 files. ~1,400 lines of test code transitively
affected. The component change was bounded; the test cascade was not.

## How to apply

**When you propose collapsing a tabbed UI into a scrolled narrative,
estimate the work as `component_diff_size × 5–10` for the test
rewrite cost, not the diff itself.** A 15-line component change here
turned into ~150 lines of mechanical-but-careful test-assertion
updates.

The rewrites fall into predictable patterns. Sharing them so the next
similar refactor goes faster:

1. **"Click tab → assert content"** becomes **"render page → assert
   content"** because the content is now rendered by default. Drop
   the `user.click(tab)` line; the `await waitFor(...)` for content
   stays.
2. **"6 tabs in this exact order"** becomes **"N tabs in this exact
   order"** where N depends on which were removed. Update both the
   `toHaveLength` and the indexed `toHaveTextContent` assertions.
3. **"Strict-equal tab name with regex `/^Foo$/i`"** becomes
   **"prefix match `/^Foo/i`"** because the surviving tabs now carry
   count badges (the accessible name is "Foo 305", not "Foo").
4. **"Switch from Foo tab to Overview tab"** becomes **"switch to
   Clubs tab"** (or whichever tab still exists). The "default" tab
   concept is gone — the narrative is the default landing view.

**Test descriptions and `describe(...)` blocks lie now.** Update them
or the test file's stated purpose ages out of sync. Search for the
tab names being removed in `describe(...)` and `it(...)` strings,
not just `getByRole(...)`.

## Telltale signs

- A planning estimate that says "drop 3 tabs, ~2 days" — multiply by
  3–5 for the test rewrite cascade.
- A failing-test count that scales with the number of tabs touched.
- "Click tab → assert content" patterns in `*.tsx` test files. Each
  is one upcoming rewrite.

## Why

Tabs and tests are tightly coupled in this codebase: tests use
`getByRole('tab', ...)` + `user.click()` to navigate, then assert
content. That's a valid pattern, but it bakes the tab structure into
the test surface. When the structure changes, the tests do too. The
alternative pattern — testing components in isolation, with the page
just composing them — is lower coupling but doesn't exist for
DistrictDetailPage's sub-views today.

A future refactor could lower the coupling by extracting each
narrative section as its own component with its own test file
(`DistrictNarrativeOverview.test.tsx`, etc.). The page-level test
would then just assert "page renders the section components" and the
content tests would mount each section directly. Lots of churn —
worth doing when the next IA shift is on the horizon, not as a
standalone refactor.

## Related

- Issue #569 — Phase 1 of EPIC #568 (District IA migration)
- IA doc at `tasks/design/district-ia/project/Toast Stats - District IA.html` § 06 phases
- Lesson 51 — `testTimeout` cap and component-in-isolation testing trade-offs (related family of test-coupling lessons)
- Lesson 66 — JSDOM doesn't catch visual bugs; this lesson is the
  complementary insight: JSDOM tests CAN catch structural changes,
  but they catch them as a flood of breakage that needs budgeted
  cleanup
