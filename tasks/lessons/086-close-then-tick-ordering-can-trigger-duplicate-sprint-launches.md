# Lesson 086 — Close-then-tick ordering invites a duplicate-launch race

**Date:** 2026-05-23
**Issue:** #626 (sprint-runner reaps in-flight session)
**Tags:** automation, race-conditions, sprint-runner, distributed-state

## What happened

Sprint 1 (#577) shipped cleanly: PR #622 merged, `sprint-verified` label
applied, issue closed. But the operator observed a second `sprint-runner-1`
screen session launched 9 minutes after the first one closed the issue. The
duplicate session was re-running already-shipped work; caught and killed
manually before it touched anything.

## Root cause

Two pieces of state are required for "Sprint N is done":

1. The sprint sub-issue is **CLOSED** (plus `sprint-verified` label under strict gate).
2. The corresponding `- [ ]` line in the epic body is ticked to `- [x]`.

The runner's stale-session heuristic (#603) used only signal (1) — if the
issue was closed, the screen was assumed safe to reap. The bootstrap prompt
(#604) closed the issue **before** ticking the checkbox. Steps after the close
(`gh issue edit` to tick the epic body, evidence comments, screenshots) take
seconds-to-minutes. A 30-minute cron tick landing inside that gap would:

- Kill the in-flight session (sees CLOSED, assumes done)
- Find the unticked sprint line still in the epic
- Launch a new session for the same sprint

The new session re-ran work that was already merged.

## Fix (#626 Option C — both ends)

**Bootstrap prompt** — explicit ordering, tick BEFORE close:

```
1. Post evidence comment
2. Apply sprint-verified label + verify
3. Tick the epic checkbox        ← was step 4
4. Close the sub-issue           ← was step 3
5. Exit
```

**Runner heuristic** — require BOTH signals:

```bash
if [[ "$active_state" == "CLOSED" ]]; then
  if grep -qE "^- \[x\] \*\*Sprint $active_n\*\* — #$active_issue"; then
    reap_screen_session "$active"
  else
    log "CLOSED but epic checkbox not ticked — letting session finish cleanup"
    exit 0
  fi
fi
```

Belt-and-suspenders: even if a future bootstrap edit accidentally reverts
the order, the runner won't pre-empt.

## How to apply

- When two pieces of state must agree before downstream automation can act,
  **never use only one as the trigger** — the gap between them is a race.
- When ordering writes to distributed state (issue close, body edit, label),
  put the _strongest_ signal LAST. The strongest signal here was "issue
  closed" (irreversible-ish, visible to gh API immediately); the weakest was
  "epic body ticked" (a string PATCH that can fail). Tick first; close last.
- When in doubt, encode the agreement requirement in the consumer (the
  heuristic). Bootstrap prompts can drift; a sed-able pattern in a shell
  script is more durable.

## Related

- [[083-exit-trap-return-value-is-the-scripts-exit-code]] — another
  sprint-runner subtlety around state visibility.
- [[085-screen-dms-socket-registration-can-lag-launch-success]] — same
  family: race between an event firing and its visibility to observers.
