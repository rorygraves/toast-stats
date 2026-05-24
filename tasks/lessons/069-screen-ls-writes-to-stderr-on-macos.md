---
name: macOS `screen -ls` writes to stderr, not stdout
description: BSD `screen` on macOS sends its session list to stderr. Piping
  with `2>/dev/null | grep` silently swallows the very output you want to
  match, so any "is a session alive?" guard built that way is a no-op.
type: feedback
id: '069'
category: lesson
tags: [bash, screen, sprint-runner, automation]
auto_load: true
date: 2026-05-22
issues: [575]
---

# Lesson 69 — macOS `screen -ls` writes to stderr, not stdout

**Date:** 2026-05-22
**Issue:** #575 (cron-driven sprint runner)

## What happened

While building `scripts/sprint-runner.sh`, the "skip if a screen session
named `sprint-runner-*` is already alive" guard kept letting tasks through
even when a session was visibly running. Direct `grep` against `screen
-ls` from the interactive shell matched fine. Same pattern from inside
the script returned empty.

Root cause: macOS BSD `screen` writes its session listing to **stderr**,
not stdout. The script was piping with the conventional
`screen -ls 2>/dev/null | grep …`, which:

1. Redirected the only useful output to `/dev/null`
2. Left grep reading an empty pipe
3. Silently exited 1, so the guard never fired

The interactive test passed because `2>&1` (or no redirect at all) was
implicit in how I was eyeballing the output.

## How to apply

When grepping the output of a tool, **verify which stream it actually
writes to**. The reflexive `cmd 2>/dev/null | grep …` pattern is correct
for tools whose primary output is on stdout (most of them) — but it
silently inverts for tools that emit on stderr.

Two safe idioms:

```bash
# Combine streams before piping
cmd 2>&1 | grep -q PATTERN

# Or capture into a variable, then match (gives a second var for reuse)
OUT=$(cmd 2>&1 || true)
printf '%s\n' "$OUT" | grep -q PATTERN
```

Quick stream-check before relying on a pipe:

```bash
cmd 1>/dev/null   # if you see output → it's on stderr
cmd 2>/dev/null   # if you see output → it's on stdout
```

The runner now uses the capture-into-variable form, which also makes the
matched session name extractable in a second grep without re-invoking
`screen`.

## Telltale signs

- A guard that "obviously checks for X" but never fires.
- Same `grep` pattern matches when typed at the shell, fails inside a
  script.
- The pattern is conditionally testing tool output piped via
  `2>/dev/null`.

## Why

POSIX is silent about which stream interactive listings should use, and
many BSD tools (screen, sometimes `ls -l` on errors, `time`) lean on
stderr to keep stdout free for "real" data. GNU clones often differ.
Don't assume from training data — verify on the target platform.

## Related

- This was orchestration plumbing, not product code — but the cron job
  the script powers is itself the gate that lets the rest of epic #574
  ship. A silently-failing guard would have meant the runner double-
  launching sessions or never launching them.
