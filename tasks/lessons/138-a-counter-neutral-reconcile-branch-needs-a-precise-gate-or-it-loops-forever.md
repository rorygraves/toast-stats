---
id: '138'
category: principle
tags: [automation, sprint-runner, bash, process]
auto_load: true
date: 2026-05-30
issues: [931, 933]
---

# Lesson 138 — In a retry-then-escalate machine, a counter-neutral "reconcile" branch needs a PRECISE gate, or it loops forever without escalating

**Date:** 2026-05-30
**Issue:** #931 (epic #933 Sprint 4 — reap → ship-check → relaunch → escalate)
**PR:** _(record on merge)_

## What happened

Sprint 4 wired the stuck-session state machine: a STUCK verdict reaps the
session, then either relaunches (`attempts += 1`, capped at 3 → escalate) or, if
an L086 ship-state check finds the work already merged, takes a **reconcile**
branch — reap, notify, do NOT relaunch, and **do not burn an attempt** (a
misdiagnosed "shipped" shouldn't consume the operator's retry budget).

The first cut of the ship-check used `gh pr list --search "$issue"` (full-text)
and an unbounded `git log --grep "#$issue"`. Fresh-context review flagged the
loose match: `#931` matches `#9310`, and any PR that merely _mentions_ the
number reads as "shipped." On its own that looks benign — but trace it through
the machine: a session that is genuinely STUCK but _persistently_ misread as
shipped gets reaped every tick, relaunched by the **normal** path next tick
(the issue is still OPEN and ungated), goes STUCK again, is reaped again… and
because the reconcile branch never increments the counter, **the attempt cap is
never reached and escalation never fires.** A silent infinite reap/relaunch loop
that never surfaces to the operator — the exact failure the escalation path
exists to prevent.

## The transferable principle

**A branch that intentionally does not advance the failure counter is only safe
if its entrance condition is precise.** The counter is what guarantees forward
progress toward escalation; any branch that bypasses the counter removes that
guarantee and leans entirely on its own gate being right. So the gate on a
counter-neutral branch carries the escalation invariant — it must be at least as
trustworthy as the counter it skips. Imprecise gate + counter-neutral branch =
a livelock with no operator signal.

Corollary for "is it already done?" checks that gate automation: match the
**shared, durable truth** with a **boundary-anchored** pattern, not a loose
substring. Here: scope the PR search to `in:title,body` and anchor the
origin/main grep with `#<issue>([^0-9]|$)` (verified on macOS `git log -E`),
and grep `origin/main`'s real history — never `origin/main..HEAD` of a diverged
local branch, which lies about what shipped (L086/R15).

## How to apply

- Drawing a state machine with a "skip the retry counter" branch (reconcile,
  already-done, not-applicable)? Ask: "if this branch's condition is _wrong and
  sticky_, does the machine still reach a terminal/escalation state?" If no,
  the branch's gate is load-bearing for liveness — make it precise and test the
  near-miss (`#931` must not match `#9310`).
- A number embedded in text is a substring, not a token. Anchor it
  (`([^0-9]|$)`, `(#N)`, `in:title,body`) before trusting it to gate an action.
- Prefer the irreversible/shared signal (commit on `origin/main`, merged PR) over
  a local or derivable one (R15). A diverged local branch is not evidence of a
  ship.

## Related

- [[106-closes-n-in-an-auto-merged-sprint-pr-defeats-the-tick-before-close-order]]
  and R15 — same family: which distributed signal proves "done," and how a
  sloppy one breaks an automation gate.
- [[091-bootstrap-prompt-scope-must-be-explicit-or-runs-diverge]] / R17 — every
  conditional needs an explicit, _correct_ case for every value; here the
  "shipped" case's correctness is what keeps the loop terminating.
- `scripts/sprint-runner.sh` (`sprint_already_shipped`, the active-session state
  machine), `scripts/tests/sprint-runner-reap-relaunch.test.sh`.
