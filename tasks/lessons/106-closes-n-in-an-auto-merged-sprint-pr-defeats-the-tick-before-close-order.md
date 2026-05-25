---
id: '106'
category: lesson
tags: [automation, sprint-runner, prompts]
auto_load: true
date: 2026-05-25
issues: [689, 626, 683]
---

# Lesson 106 — `Closes #N` in an auto-merged sprint PR defeats the tick-before-close ordering

**Date:** 2026-05-25
**Issue:** #689 (epic #683 Sprint 6)

## What happened

The sprint-runner protocol (R15 / lesson 086, from the #626 duplicate-launch
incident) requires the strongest "sprint done" signal written **last**: tick the
epic checkbox first (weak, revertible string PATCH), close the sub-issue last
(strong, irreversible), and have the runner's reap require **both** before
acting. The bootstrap prompt spells the order out: merge → label →
tick epic → close sub-issue.

I followed that order manually — but the PR body contained `Closes #689`. GitHub
auto-closes a referenced issue **the instant the PR merges**, so the sub-issue
closed at merge time — _before_ I applied the label and ticked the epic. The
intended "close last" became "close first," reopening the exact gap lesson 086
exists to prevent: a window where the close signal is set but the epic tick is
not.

## Why it didn't bite this time

The end state still converged correctly: the runner's reap requires the epic
checkbox **and** the close, and both were true by the time I finished. The
window where only-close-was-set was short and no runner tick landed in it (no
duplicate PR/branch/session appeared). But "it converged because the gap was
short" is luck, not design — under a faster cron tick or a slower hand between
merge and tick, a duplicate launch could fire.

## How to apply

- **In a sprint PR that the session will auto-merge, do NOT write `Closes #N` /
  `Fixes #N` in the body.** That hands the close-timing to the merge event and
  defeats the tick-before-close ordering. Reference the issue without a closing
  keyword (`Part of #N`, `#N`), then close the sub-issue **manually** as the
  last step, after the epic checkbox is ticked.
- If you want the convenience of `Closes #N`, then **tick the epic _before_
  merging**, so the strong signal (auto-close at merge) still lands after the
  weak one. Pick one discipline; don't mix "Closes #N" with "close it last."
- The invariant is unchanged (R15): two distributed signals that gate
  automation must both be required, and the irreversible one must be written
  last. The merge keyword is just a sneaky third way to write the irreversible
  one early.

## Related

- [[086-close-then-tick-ordering-can-trigger-duplicate-sprint-launches]] — the parent
  principle; this is a concrete mechanism (`Closes #N` auto-close) that breaks
  its "close last" half.
- R15 in `tasks/rules.md` — write the strongest signal last; require both.
