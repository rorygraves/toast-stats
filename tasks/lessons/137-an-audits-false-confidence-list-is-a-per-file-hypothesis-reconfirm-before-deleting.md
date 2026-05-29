---
id: '137'
category: lesson
tags: [tests, flaky, vitest, process, verification, tdd]
auto_load: true
date: 2026-05-29
issues: [916, 917]
---

# Lesson 137 — An audit's "false-confidence" list is a per-file hypothesis; re-confirm before deleting, because the first-pass classification over-flags

**Date:** 2026-05-29
**Issue:** #916 (epic #917 Sprint 5 — flakiness lock-in)
**PR:** _(record on merge)_

## What happened

The Sprint 1 deep-dive flagged four tests as "false-confidence — verify and then
make real or delete" (§4.2), explicitly noting "to be re-confirmed before
action." Acting on the list this sprint, I re-read each file — and the
first-pass label held for only **one of the four**:

| File                                      | First-pass flag                                    | Re-confirmed reality                                                                                                                                                                                                               | Action                             |
| ----------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `responsive/designCompliance.test.ts`     | tautological                                       | TRUE — 5/6 tests mock `getComputedStyle`/`getBoundingClientRect` then assert the mock back; the 6th (contrast) is fully duplicated by `accessibility/contrastRequirements.test.ts`                                                 | **delete**                         |
| `accessibility/touchTargets.test.ts`      | "mock→mock round-trips"                            | FALSE — the mocked geometry is the _controlled input_ to `useTouchTarget`; assertions verify the hook's classification logic (44px threshold, recommendation text, margin math) + `isInteractiveElement` (no geometry mock at all) | **keep**                           |
| `components/componentMigrations.test.tsx` | "geometry mock is a footgun"                       | PARTIAL — the tests are real (className/click/a11y); the `getBoundingClientRect→44×44` `beforeEach` was simply **never read** by any assertion                                                                                     | **drop the dead mock, keep tests** |
| `components/routing.test.tsx`             | "`textContent` would miss `text-transform` (L110)" | FALSE — "LIVE" is _literal_ JSX (`· LIVE`) in HistoryPage, not a CSS-uppercased "live", so the assertion is real                                                                                                                   | **keep** (relocated for V12)       |

## The transferable lesson

**A deep-dive's defect/false-confidence list is a set of hypotheses, one per
file, not a delete queue.** The audit pass reads fast and broad; it correctly
flags the _shape_ worth investigating (a geometry mock, a `textContent`
assertion) but can't tell — without re-reading each file — whether that shape
is:

- **truly tautological** (mock fed in, mock asserted back; zero defect-detection
  → delete),
- a **controlled-input logic test** (the mock is the input; a real function's
  output is asserted → keep; this _looks_ like a tautology and is the easiest to
  wrongly delete),
- a **real test with a vestigial mock** (assertions are real; the mock is dead
  weight → drop the mock, keep the test), or
- a **false alarm** (the flagged hazard doesn't actually apply → keep as-is).

Deleting on the label alone would have removed three genuine tests. The audit
even said "re-confirm before action" — honor that; the re-confirmation is the
real work, and "the audit was wrong about this one" is a valid, common outcome.

## How to apply

- Treat every entry on an audit/triage list as `assert(hypothesis)`, not
  `rm file`. Re-read the file and the code under test before acting.
- The tell for a _controlled-input_ test (keep) vs a _tautology_ (delete): does
  any assertion check the output of a **real function/component**, or only the
  value the test itself fed into a mock? `touchTargets` asserts
  `useTouchTarget(...).passes`; `designCompliance` asserts the `mockReturnValue`
  back.
- When the audit is right, delete wholesale (don't preserve a "real" test that a
  dedicated suite already covers — `contrastRequirements` already owned the
  contrast property). When it's half-right, make the surgical fix (drop the dead
  mock), not the wholesale one.

## Related

- [[082-a-lint-rule-can-be-present-but-inert-assert-behavior-not-severity]] and
  [[081-phase-gated-deferral-tests-move-with-the-spec]] — sibling "read what the
  test actually asserts vs. what its name/label implies" lessons.
- [[066-jsdom-style-assertions-dont-catch-positioning-bugs]],
  [[110-jsdom-textcontent-ignores-css-text-transform-live-innertext-does-not]],
  [[134-a-status-chip-in-an-overflowing-table-is-still-clipped-detable-the-row]]
  — jsdom proves what _ships_ (class/handler/role); a _live geometry_ assertion
  proves what _renders_. The vestigial `getBoundingClientRect` mocks were the
  jsdom-can't-see-layout footgun in dormant form.
- `tasks/rules.md` R21/R22 (detector-vs-gate; unit-must-not-page-mount), the
  durable invariants this sprint promoted.
