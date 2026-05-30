#!/usr/bin/env bash
# sprint-runner-process.sh — process-tree reaping.
#
# When a sprint session is reaped, killing only the named root (the `claude`
# process) leaves its descendants behind: npm -> vitest spawns a worker pool
# that reparents to init the instant its parent dies, surviving as bare `node`,
# pinning cores and flaking the NEXT sprint (toast-stats #973). So we kill the
# whole tree — and capture the PID set UP FRONT, so a child that has already
# reparented is still killed by PID.
#
# Sourcing only defines functions.

# collect_descendants <pid...> — print each pid and all its descendants, with
# every node listed BEFORE its parent (leaves first → a kill in this order is
# bottom-up, so a child dies while its parent is still alive and can't escape).
collect_descendants() {
  local pid child
  for pid in "$@"; do
    for child in $(pgrep -P "$pid" 2>/dev/null || true); do
      collect_descendants "$child"
    done
    printf '%s\n' "$pid"
  done
}

# reap_tree <pid...> — TERM the full process tree(s) bottom-up, then SIGKILL any
# survivor. The PID set is snapshotted before signalling, so reparented children
# are still reaped. A dead/absent pid is a clean no-op.
reap_tree() {
  local pids p
  pids="$(collect_descendants "$@")"
  [[ -n "$pids" ]] || return 0
  for p in $pids; do kill "$p" 2>/dev/null || true; done
  # ~1s TERM-drain before SIGKILL. There's a small PID-reuse window here (a
  # captured PID could die and be recycled), but macOS recycles PIDs slowly and
  # the window is ~1s — accepted over leaving CPU-pinning orphans alive.
  sleep 1
  for p in $pids; do kill -0 "$p" 2>/dev/null && kill -9 "$p" 2>/dev/null || true; done
  return 0
}
