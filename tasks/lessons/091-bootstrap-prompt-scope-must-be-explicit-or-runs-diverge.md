---
id: '091'
category: lesson
tags: [prompts, automation, sprint-runner]
auto_load: true
date: 2026-05-23
issues: [636]
---

# Lesson 091 — Bootstrap prompt scope must be explicit, or runs diverge

> **Promoted to R17** (2026-05-24, #649). This file is preserved for historical context.

**Date:** 2026-05-23
**Issue:** #636 (epic auto-closure gap)
**Tags:** automation, prompts, sprint-runner, underspecification

## What happened

Sprint 1 of #482 (vitest test-infra) shipped cleanly via the autonomous
sprint-runner. PR #635 merged, sub-issue #482 closed with `sprint-verified`
label, epic #616's Sprint 1 checkbox ticked. The session then exited
according to the bootstrap prompt's step 5.

**But epic #616 was left open with no completion comment.** Operator had
to manually prompt the still-attached session ("Why is 616 still open?
Why does it have no comment?") to close the epic.

Inspecting the previous epic (#615, breadcrumbs) revealed it _had_ been
closed by its session. Same bootstrap prompt, two consecutive epics, two
different end-states. Inconsistent autonomous behavior — exactly the
problem.

## Root cause

The bootstrap prompt's step 5 scoped closing actions to the sub-issue:

```
3. Tick the Sprint N checkbox in the epic body
4. Close the sub-issue
5. Stop the session
```

No instruction for the case where this was the _last_ sprint of the epic.
Session A (sprint #577) voluntarily extrapolated "epic is complete → close
the epic." Session B (sprint #482) read the literal scope and stopped.
Both interpretations are defensible given the prompt.

When automation has a scope boundary, **implicit scope invites divergence.**

## Fix

Add an explicit step 5 to the bootstrap prompt:

```
5. If this was the last sprint of the epic, close the epic too.
   Check: gh issue view {{EPIC}} --json body --jq .body | grep -c '^- \[ \] \*\*Sprint'
   If 0: post completion-summary comment, close the epic.
   If non-zero: skip; let the next session handle the eventual close.
```

The check is deterministic. The session has rich context for the summary
(it just shipped the work). The runner's `advance_meta_epic` stays
focused on META_EPIC checkbox bookkeeping; it doesn't author the
session's completion comment because that requires knowledge only the
session has.

## How to apply

- **Every conditional in an automated workflow needs an explicit case
  for every condition value.** If your prompt says "close X if Y," it
  must also say what to do when Y is false. Implicit "do nothing" is
  fine — but it must be stated.
- **When two consecutive runs produce different end-states from the same
  prompt, the prompt is underspecified.** That's the diagnostic signal.
  Don't blame the model for "interpretation drift" — fix the spec.
- **Authorship boundaries matter.** A summary comment requires context;
  put it where the context lives (the session that did the work). A
  structural bookkeeping action like ticking a META_EPIC checkbox needs
  no context; put it in the orchestrator (`advance_meta_epic`). Mixing
  these creates races.

## Related

- [[083-exit-trap-return-value-is-the-scripts-exit-code]]
- [[085-screen-dms-socket-registration-can-lag-launch-success]]
- [[086-close-then-tick-ordering-can-trigger-duplicate-sprint-launches]]
  — same family: who closes/ticks what, in what order.
- [[087-spawned-sessions-need-their-own-worktree-not-shared-checkout]]
- [[088-single-action-per-tick-was-a-false-virtue]] — the orchestrator
  analogue: don't stop at the first natural boundary if there's more
  valid work to do.
- [[089-pipefail-plus-screen-ls-exit-1-poisons-every-pipeline]]

Eight sprint-runner lessons in two days. The runner has reached its
"every-surface-has-a-gotcha" maturity. The lessons themselves are
becoming the most valuable artifact — they capture the design rationale
that any future maintainer (or Red Barkeep adopter) needs.
