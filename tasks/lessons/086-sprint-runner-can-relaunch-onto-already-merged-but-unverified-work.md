---
id: '086'
category: incident
tags: [automation, sprint-runner]
auto_load: false
date: 2026-05-23
issues: [577, 615, 606]
---

# Lesson 086 — A sprint-runner relaunch can land on already-merged-but-unverified work; verify the ship state before re-running /sprint

**Date:** 2026-05-23
**Issue:** #577 (back-to-district breadcrumb; epic #615 / META_EPIC #606)
**Tags:** automation, sprint-runner, idempotency, verification

## What happened

The sprint-runner relaunched to "execute Sprint 1 (#577)." But on inspection
the work was already done: PR #622 was **MERGED** (squash commit `f6dedb30`),
its Deploy job was green, the feature was live on prod, and #577 was already
**CLOSED COMPLETED**. The local `feat/577-subpage-breadcrumb` branch still held
the pre-squash commits, so a naive `git log origin/main..HEAD` made it _look_
unshipped — until `git ls-tree origin/main` showed the component already on main.

The only things genuinely outstanding were the runner's gate artifacts:
the `sprint-verified` label was **absent** and the epic's Sprint 1 checkbox was
still `- [ ]`. Re-running `/sprint` would have duplicated merged work.

## Root cause

A prior run implemented + PR'd + merged + closed the issue, but stopped before
the live-verify → label → tick-epic tail (or died mid-tail). The runner's gate
(`STRICT_GATE=1`) keys on CLOSED **and** the `sprint-verified` label, so a
CLOSED-but-unlabeled issue is exactly the "looks done, gate still red" state
that triggers a relaunch onto finished work.

## How to apply

- **Before running /sprint on a relaunch, establish the true ship state**, in
  this order: is the PR merged (`gh pr list --state all --search "<n> in:title"`)?
  Is the artifact on `origin/main` (`git ls-tree origin/main -- <path>`, not just
  `log origin/main..HEAD` — a diverged local branch lies)? Is the issue CLOSED?
  Did Deploy go green? If all yes, **skip implementation** and resume at
  live-verify → label → tick-epic.
- **A diverged local branch is not evidence of unshipped work.** Squash-merge
  leaves your local commits orphaned; check the tree/PR, not the branch tip.
- **The label is the gate, not the close.** Closing the issue without applying
  `sprint-verified` leaves the runner blocked and re-firing. Label first, then
  close, then tick — the order in the runner prompt exists for this reason.
- A verification-only run still satisfies DoD by producing live evidence; it
  does not need a new red→green (the implementation lesson, [[085-subpage-breadcrumb-the-collision-442-feared-doesnt-exist-on-sub-pages]],
  was already written by the run that merged the code).

## Related

- [[083-exit-trap-return-value-is-the-scripts-exit-code]] — sibling sprint-runner
  bug: a run can exit/stop before its tail completes, leaving partial state.
- [[085-screen-dms-socket-registration-can-lag-launch-success]] — also "the
  resource exists even though the verifier said otherwise"; here the work was
  shipped even though the gate said not-done.
