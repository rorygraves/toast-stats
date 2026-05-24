---
id: '087'
category: lesson
tags: [automation, sprint-runner, monorepo]
auto_load: true
date: 2026-05-23
issues: [625]
---

# Lesson 087 — Spawned automation sessions need their own git worktree

**Date:** 2026-05-23
**Issue:** #625 (sprint-runner worktree isolation)
**Tags:** automation, git-worktree, concurrency, sprint-runner

## What happened

The sprint-runner script spawned Claude sessions via `screen -dmS bash -c "cd $REPO_DIR && claude --remote-control ..."`. `$REPO_DIR` was the operator's primary checkout. Operator and session shared one working tree.

When the operator (debugging an unrelated bug) ran `git commit && git push`, the changes landed on whatever branch the spawned session had checked out (`feat/577-subpage-breadcrumb`) — NOT the operator's intended `main`. Recovery required a `git worktree add` to apply the commit cleanly to main without disturbing the in-flight session.

The shared tree also meant:

- Branch-switching by the operator changes the session's checkout mid-task.
- Concurrent index writes race silently.
- `npm install` artifacts collide.

## Fix

Each spawned sprint session gets its own `git worktree` at a stable path: `~/sprint-worktrees/sprint-<N>`. The inner shell `cd`s to the worktree instead of `$REPO_DIR`. Worktree is created with `--detach` to avoid claiming `main` (which the operator's primary tree holds).

```bash
git -C "$REPO_DIR" worktree add --detach "$WORKTREE_BASE/sprint-$n" main
```

## Convergent reconciliation (not best-effort cleanup)

Worktrees leak when sessions crash, get killed (`--reap`), or the host reboots. Best-effort "cleanup on success" misses every failure mode. Replaced with **convergent reconciliation** keyed off filesystem + `screen -ls`:

- Any worktree under `$WORKTREE_BASE` without a paired `sprint-runner-N` screen is an **orphan** → GC.
- Reconciliation runs at every `mode_run` entry, on every `mode_reap`, and on demand via the new `--gc` flag.
- `mode_status` reports orphans (read-only) so operators see leaks before they accumulate.

No bookkeeping files (no PID files, no `.list` manifests). Source of truth is the filesystem + `screen -ls`, both inspectable from the shell.

## How to apply

- When automation spawns peer sessions inside a repo, give each one its own `git worktree`. The operator's primary checkout is sacred; never share it with autonomous workers.
- For per-session resource cleanup, prefer **reconciliation against truth signals** (filesystem state, process tables) over **bookkeeping files** (PID files, manifests). Bookkeeping drifts; truth signals don't.
- Use `git worktree add --detach` when the target ref is already checked out elsewhere. The spawned session can `git checkout -b` for its actual work.
- Make the cleanup mode (`--gc`) a first-class operator command, not just an internal hook. After a reboot or a crash, the operator wants to run cleanup explicitly.

## Failure modes still possible (acceptable)

- **Unmerged auto-branch on a crashed session**: branch survives, worktree gets GC'd. `git branch -d` (not `-D`) refuses unmerged branches — preserves data > tidiness.
- **`git worktree remove --force` fails AND `rm -rf` fails**: extremely rare (permissions). Operator sees the orphan in `--status` and intervenes.
- **Race during reconciliation**: gc and a new launch happening at the same time → the new worktree might look "orphaned" for one tick. Mitigation: lock held during `mode_run`, so launches and GCs serialize.

## Related

- [[083-exit-trap-return-value-is-the-scripts-exit-code]]
- [[085-screen-dms-socket-registration-can-lag-launch-success]]
- [[086-close-then-tick-ordering-can-trigger-duplicate-sprint-launches]]

All four are sprint-runner subtleties around **shared state visible to multiple actors**. The general principle: when two parties need to agree on state, never trust a single signal; reconcile against the source of truth.
