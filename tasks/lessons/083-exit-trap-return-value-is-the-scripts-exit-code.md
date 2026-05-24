---
id: '083'
category: principle
tags: [bash, automation]
auto_load: true
date: 2026-05-23
issues: [603]
---

# Lesson 083 — A bash EXIT trap's return value becomes the script's exit code

**Date:** 2026-05-23
**Issue:** #603 (sprint-runner hardening)
**Tags:** bash, traps, exit-codes

## What happened

While hardening `scripts/sprint-runner.sh` I extracted lock + temp-file cleanup
into a single `cleanup()` function and wired it to `trap cleanup EXIT INT TERM HUP`.
The script then started exiting with code 1 even on the "roadmap complete"
happy path, despite the explicit `exit 0` in that branch.

## Root cause

```bash
cleanup() {
  rm -rf "$LOCK_DIR"
  [[ -n "${PROMPT_FILE:-}" ]] && rm -f "$PROMPT_FILE"
}
```

When `PROMPT_FILE` is unset (the early-exit paths never assigned it),
`[[ -n "" ]]` returns 1, the `&&` short-circuits, and `cleanup` returns 1.
That return value **overrides the script's own `exit 0`** because bash uses
the EXIT trap's final return value as the script's exit code.

## Fix

Make the trap explicitly successful:

```bash
cleanup() {
  rm -rf "$LOCK_DIR" 2>/dev/null
  [[ -n "${PROMPT_FILE:-}" ]] && rm -f "$PROMPT_FILE" 2>/dev/null
  return 0
}
```

A trailing `:` no-op works too. The point: never let a conditional be the
last thing in an EXIT trap unless you mean to mask the script's own exit code.

## How to apply

- Any cleanup-style function wired to a trap must end with `return 0`
  (or `:`, or a guaranteed-zero command) — not a conditional test.
- When a script exits non-zero "for no reason" and `set -e` is on, suspect
  the trap before suspecting the script body.
