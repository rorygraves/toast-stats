---
id: '088'
category: incident
tags: [automation, sprint-runner]
auto_load: false
date: 2026-05-23
issues: [627]
---

# Lesson 088 — "Single action per tick" was a false virtue in the autonomous runner

**Date:** 2026-05-23
**Issue:** #627 (sprint-runner cascade)
**Tags:** automation, sprint-runner, design-philosophy

## What happened

In #605 I deliberately designed the sprint-runner to do **exactly one visible
action per cron tick**. After auto-advancing the META_EPIC checkbox to mark
an epic complete, the runner exited 0 — even though the next epic's first
sprint was sitting there waiting, and the launch logic would have run
cleanly in the same tick.

At the 12:17 tick today, the runner did exactly 2 seconds of bookkeeping
(tick #615 in #606) then idled 30 minutes until 12:47. The operator
flagged it: "everything was complete and closed — why didn't we start
another epic?"

## The reasoning I used (and why it didn't hold up)

| Original rationale                                         | Why it didn't hold up                                                                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Simpler reasoning, one log entry per major decision        | Adding ~10 lines for a bounded `while` loop is not measurably harder to reason about                                              |
| 30-min gap = natural human-review checkpoint between epics | Operator can intervene any time via `runner-paused` label, `--reap`, or `gh issue edit`. Doesn't need the runner to enforce a gap |
| Lock holding time stays bounded                            | Cascade still launches at most ONE sprint. Bookkeeping ops between are bounded                                                    |

The flaw: I was optimising for **observability** (one log per tick) at the
cost of **forward progress** (idle ticks when work was queued). In a fully-
autonomous loop, idle ticks are the more expensive failure mode.

## Fix

Wrapped the resolve→find→launch section in a bounded `while` loop:

```bash
local max_cascades=8
local cascade=0
while (( cascade < max_cascades )); do
  cascade=$((cascade + 1))
  # Reset META-resolved EPIC so resolve_active_epic re-reads next iter.
  if [[ "$EPIC_SOURCE" == "resolved via"* ]]; then EPIC=""; fi
  EPIC_SOURCE=""; META_PAUSED=0

  resolve_active_epic || handle_terminal_case
  # ... existing screen check, find first unchecked sprint
  if [[ -z "$pair" ]]; then
    if [[ "$EPIC_SOURCE" == "resolved via"* ]]; then
      if advance_meta_epic "$EPIC"; then
        continue   # ← cascade to next epic
      fi
      log "Auto-tick failed; next tick will retry."
    fi
    exit 0
  fi
  # ... gate + launch
  break  # one sprint launch per tick is still the cap
done
```

Cap at 8 cascades guards against runaway loops on a malformed META_EPIC.
A real META_EPIC has 5-10 epics; the cap is comfortably above realistic
load while still bounded.

## How to apply

- When designing an automation loop, separate **what to do** from **how
  often the loop runs**. The cron interval sets the cadence of _attempts_,
  not the cadence of _progress_.
- "Single action per tick" sounds like a clean invariant but is actually
  a coupling between scheduling cadence and forward progress. Decouple
  them: each tick does as much **valid forward progress** as it can,
  bounded by a sane cap.
- Observability concerns are real but solvable other ways: structured
  logs, per-iteration headers, notification on each visible action.
  Don't sacrifice progress for log readability.

## Related

- [[083-exit-trap-return-value-is-the-scripts-exit-code]]
- [[085-screen-dms-socket-registration-can-lag-launch-success]]
- [[086-close-then-tick-ordering-can-trigger-duplicate-sprint-launches]]
- [[087-spawned-sessions-need-their-own-worktree-not-shared-checkout]]

All five lessons are runner subtleties discovered after the runner shipped
and started operating live. The pattern: **the original design's
assumptions about operator behavior and failure modes were optimistic.**
Live operation reveals what the design forgot.
