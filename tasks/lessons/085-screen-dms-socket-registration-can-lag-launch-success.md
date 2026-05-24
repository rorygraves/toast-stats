---
id: '085'
category: superseded
tags: [screen, bash, automation, flaky]
auto_load: false
superseded_by: '089'
date: 2026-05-23
issues: [623]
---

# Lesson 085 — `screen -dmS` returns 0 before the socket is visible to `screen -ls`

> ⚠️ **SUPERSEDED by [Lesson 089](089-pipefail-plus-screen-ls-exit-1-poisons-every-pipeline.md).**
> The `screen -ls` failure documented here was **misdiagnosed** as socket-registration
> lag. Lesson 089 root-caused it to `set -o pipefail` + `screen -ls` exiting 1 poisoning
> the pipeline — not a timing race. The general "eventual-visibility" intuition survives,
> but for the `screen -ls` case trust 089. Kept for history; `auto_load: false`.

**Date:** 2026-05-23
**Issue:** #623 (sprint-runner false-negative post-launch verify)
**Tags:** macOS, screen, automation, race-conditions

## What happened

The sprint-runner script (#603) verified that `screen -dmS` actually
launched its session by running `sleep 1; screen -ls | grep $name` immediately
after the launch command. On 2026-05-23 at 11:17, this check returned no
match — `die` fired, parent script exited 1, launchd logged it as a failure.

But `screen -ls` 13 minutes later showed the session alive and well, with
`claude --remote-control` processing the bootstrap prompt normally. The
launch had succeeded; the verification was a false negative.

## Root cause

`screen -dmS NAME bash -c '...'` returns immediately after forking. The
child process (the screen daemon) then needs to:

1. Allocate a PTY
2. Create its socket file in the per-host screen directory
   (`/var/folders/<...>/T/.screen.<host>/<pid>.<name>`)
3. Begin servicing requests

On macOS, step 2 reliably takes longer than 1 second, especially under
load or when the inner command involves heavy startup (Claude Code launching
its IDE/MCP stack). `screen -ls` reads that directory — if the socket
isn't there yet, it reports no session, even though the process is alive.

## Fix

Two changes:

```bash
# Retry up to 5 times at 1s intervals — gives the screen daemon time
# to register its socket file.
local verified=0
for _ in 1 2 3 4 5; do
  if screen -ls 2>&1 | grep -q "$session_name"; then
    verified=1
    break
  fi
  sleep 1
done
if (( verified == 0 )); then
  # Warn, don't die. `die` doesn't kill the (detached) screen, so reporting
  # a hard error to launchd is misleading. Next tick will detect a live
  # session or relaunch cleanly.
  log "WARNING: $session_name not visible in screen -ls after 5s — leaving alone."
  notify "sprint-runner" "Sprint $target_n launch unverifiable — check screen -ls"
  exit 0
fi
```

## How to apply

- When verifying that an OS-level resource was created (sockets, lock files,
  named pipes, PID files), assume **eventual visibility**, not immediate. Always
  loop with a sane timeout rather than checking once with a `sleep`.
- When a verification might false-negative AND the resource lives independently
  of the verifier, prefer **warn-and-continue** over **die**. Dying doesn't
  un-create the resource; it just adds false-alarm noise.
- The screen daemon's socket directory varies by OS (`$TMPDIR`, `/var/run/screen`,
  `/var/folders/.../.screen.<host>` on macOS). Don't try to check the socket
  file directly — `screen -ls` is the portable interface, even if it lags
  by a few seconds.

## Related

- [[083-exit-trap-return-value-is-the-scripts-exit-code]] — also a sprint-runner
  bug where the script's exit semantics were stricter than they needed to be.
- This race could in principle apply to the `$(cat $PROMPT_FILE)` evaluation
  inside the screen's inner shell. If parent cleanup runs before the inner
  shell evaluates `cat`, claude starts with an empty prompt. Currently the
  ordering is reliable in practice (bash evaluates `$(...)` synchronously
  early in the inner script), but a worst-case fix would have the inner shell
  read into a local var first, then signal the parent before cleanup.
