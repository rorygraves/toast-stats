---
id: '054'
category: lesson
tags: [tdd, ci, automation]
auto_load: true
issues: [483, 491]
---

# 🗓️ 2026-05-12 — Lesson 54: TDD discipline slipped the moment the pre-push gate went away

**Discovery:** During the Find-A-Club epic and its bug-audit follow-ups (PRs #483–#491), I shipped a steady stream of well-tested code — but the tests were never red. I wrote `FindAClubMerger.ts` first, then 11 tests after. Same pattern for `FindAClubService.ts`, `EducationLevelsCard.tsx`, the 6 bug fixes in #487. Tests existed, suites were green, CI passed. Looked like TDD. Wasn't TDD. The user called it out: "Feels like we're letting TDD slip now that pre-push is disabled."

**Proof:** The session before pre-push was disabled (#483) shows commit pairs like `test(division-criteria): strip provider wrappers from unit-test (#473)` followed by behaviour-preserving code edits — red-test-first cadence was visible in the commit log. The session after pre-push was disabled shows single combined commits like `feat(collector): FindAClubMerger + pipeline wiring (#429)` with both implementation and tests in one shot. The commit boundary stopped reflecting the work order.

**Root cause:** Pre-push acted as an implicit forcing function. Every push had to pass coverage; if I shipped code without tests, the gate noticed. Once it was disabled (#482), the visible feedback loop went away — CI takes 5–10 minutes and runs in the background. The mental cost of "did I actually fail this test first?" went up; the visible cost of skipping the discipline went down. Both signals point one direction: cheat.

**Rule:** When a forcing function gets disabled, treat that as an _active risk_, not a neutral configuration change. Either (a) replace the forcing function with an explicit habit + commit-log audit, or (b) measure the discipline going forward via something else (e.g. a lint that flags PRs where every commit touches both `src/` and `__tests__/`). Don't assume "I'll remember." I didn't.

**Fix:** Going forward, every new code change ships as at least two commits: `test(...): <failing test for behaviour X>` then `feat/fix(...): implement X to pass the test`. Commit boundaries become the discipline's audit trail. If the test isn't actually red at the first commit, that's a smell — either the test is wrong or the behaviour already exists.

**Warning:** Tests-after still produce green suites and pass CI. They don't catch the cases where the test was over-fitted to the implementation already in front of me. The whole point of red-first is to write the test from the user-perceivable behaviour, BEFORE the implementation pollutes my view of "what's reasonable to assert." That's the part that quietly degrades when TDD slips into test-after.

**rules.md candidate:** "R-N: every behaviour change ships as ≥2 commits — a failing test first, then the implementation. Verify red status before the implementation commit lands."
