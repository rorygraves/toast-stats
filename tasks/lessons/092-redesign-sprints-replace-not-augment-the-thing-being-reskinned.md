---
id: '092'
category: lesson
tags: [frontend, scope, dcp]
auto_load: true
date: 2026-05-23
issues: [620]
---

# Lesson 092 — In a re-skin sprint, find what already ships the feature and replace it; don't bolt a second one on

**Date:** 2026-05-23
**Issue:** #620 (Club redesign Sprint 3 — Close-to-Distinguished callout + DCP Goals Progress panel)
**Tags:** frontend, redesign, scope, blast-radius, dcp

## What happened

The ticket read as "build the Close-to-Distinguished callout" and "build the DCP
Goals Progress panel." Taken literally, that's two new components. But the page
already had **both** capabilities from earlier work:

- The callout shipped in #366/#433 and was re-skinned in #618 — it was just in
  the wrong place (above the stats grid, not below the trend row).
- "DCP Goals Progress" existed twice: a crude inline `redesign-panel` block
  (progress bar + a hand-rolled Goal Achievement Timeline) **and** a separate
  `ClubDCPGoalsCard` (category-grouped per-goal detail). Both rendered an `<h2>`
  with the literal text "DCP Goals Progress."

Had I "built a new panel" without inventory, the page would have had two or three
DCP-goals sections and two callout code paths. The page test `getByText('DCP
Goals Progress')` would have thrown on the duplicate heading — a fast failure,
but the deeper cost is a confusing UI and dead-but-rendered code.

## What the right move was

Treat a re-skin sprint as **replace, not augment**:

1. Grep the page for the feature's text/util before writing anything
   (`grep -n "DCP Goals Progress\|close-to-distinguished"`). R7 ("inventory
   existing fields") applies to UI sections too, not just data.
2. The new design _unifies_ three things into one panel. So the work is: delete
   the two legacy renderings, build the one designed panel, and reposition the
   callout. Net surface went **down** (231-line `ClubDCPGoalsCard` deleted) even
   though the ticket sounded additive.
3. The reposition is a genuine spec change → the position test gets **rewritten**
   to the new order (trend row → callout → panel). That is not assertion pinning
   (R1): the old assertion encoded the old spec, the new one encodes the new
   spec. The distinction: I changed the expectation because the _design_ moved
   the element, not because a bug made the old expectation fail.

## Two more specifics worth keeping

- **The reference HTML's data is illustrative.** It listed DCP goals as "CC
  awards / AC awards / leadership awards" (the pre-Pathways names). The real
  pipeline uses `GOAL_DEFINITIONS` ("Level 1 awards", "New members", …). HANDOFF
  says wire to real data — so the canonical util (`extractDcpGoalProgress`) is the
  source, not the mockup's copy. This also keeps the DCP-independence tripwire
  honoured (per-goal raw `clubPerformance` fields, never Goals-1-N inference).
- **"Reuse existing X logic" can mean swap the engine.** The ticket said reuse
  `membersToDistinguished.ts`. The live callout used the narrower
  `closeToDistinguished.ts`. Switching to `computeMembersToDistinguished` bounded
  by the same `CLOSE_TO_DISTINGUISHED_MAX_MEMBERS=4` is a strict superset (also
  fires when member-earned Goals 7/8 are the only gap) that provably preserves
  the #433 calibration — verified by tracing all five #433 boundary tests before
  touching code, not after.

## A test-isolation footgun (don't mis-diagnose)

Running a single unit-project test with bare `npx vitest --run <file>` throws
`ReferenceError: expect is not defined` — the file relies on the `unit`
project's setup, which only loads under `--project unit` (or `npm run
test:unit -- <file>`). Don't read that as a real failure. Likewise, running
three vitest invocations at once (guard + full suite + a focused run) produced
"Failed to start forks worker / Timeout waiting for worker" and a spurious
"Axe is already running" — pure core contention (cf. [[090-vitest-project-split-needs-a-partition-guard]],
Lesson 53). A 5s testTimeout flake on an _unrelated_ heavy page test
(`DivisionAreaRecognitionPanel`) under 1100s of environment contention is not a
regression and is **not** a reason to bump the timeout. Verify the suspect test
alone, warm, under the right project before concluding anything.

## How to apply

- Re-skin/redesign ticket? Inventory the page first; the feature usually already
  exists. Plan to **replace and reposition**, and expect net surface to shrink.
- A rewritten test is assertion pinning only if it bends to a _bug_. If it bends
  to a deliberate _spec_ change, it's correct — say so in the test comment with
  the issue number.
- Re-skins ship in slices: deleting the crude interim version (here, the inline
  timeline) and re-adding the designed one next sprint (#621) is the plan, not a
  regression. Leave a breadcrumb comment naming the follow-up sprint.

## Related

- [[081-phase-gated-deferral-tests-move-with-the-spec]] — tests move with the spec.
- [[090-vitest-project-split-needs-a-partition-guard]] — project setup + contention.
- [[091-bootstrap-prompt-scope-must-be-explicit-or-runs-diverge]] — same week's
  "literal reading vs intent" theme, from the runner side.
