#!/usr/bin/env bash
# Stuck-session liveness PROBES for sprint-runner.sh (epic #933, Sprint 2 #929).
#
# Design: docs/design/sprint-runner-liveness-detector-2026-05-30.md
#
# Three signal probes, each a PURE classify function over injected inputs
# (already-sampled command outputs, a clock, flags). The "sample" side — the
# code that actually runs `git log` / `pgrep` / `ps` / `stat` and tails the
# session logfile — lives at the runner's edge and is wired into the tick in
# Sprint 3 (#930). Keeping classification pure makes every verdict unit-testable
# with fixtures (scripts/tests/sprint-runner-probes.test.sh) — no live screen,
# git, or process needed.
#
# Each probe echoes exactly one verdict token to stdout and returns 0:
#   OK       — evidence of forward progress
#   STALL    — evidence of NO progress (one soft stall signal)
#   UNKNOWN  — cannot tell (missing worktree / logfile / PID); per the design,
#              UNKNOWN is NEVER treated as evidence of stall — it resolves toward
#              HEALTHY, the conservative direction (a missed reap costs one tick;
#              a false reap kills live work).
#   HUSK     — (process probe only) the screen daemon is alive but its `claude`
#              child is gone: provably no working process. Conclusive single
#              signal — the fusion layer (Sprint 3) acts on it without waiting.
#
# This file only DEFINES functions; sourcing it has no side effects, so the
# runner can source it to make the probes available without invoking them.
#
# Tunables (env-overridable so the test harness and a future operator can adjust
# without editing logic):
LIVENESS_STALL_WINDOW="${LIVENESS_STALL_WINDOW:-2700}"            # 45 min, in seconds
LIVENESS_CPU_IDLE_PCT="${LIVENESS_CPU_IDLE_PCT:-1.0}"            # CPU% below this = idle
LIVENESS_LOG_REPEAT_TAIL="${LIVENESS_LOG_REPEAT_TAIL:-20}"       # window of trailing non-blank lines
LIVENESS_LOG_REPEAT_MIN_LINES="${LIVENESS_LOG_REPEAT_MIN_LINES:-12}" # need this many before judging a loop
LIVENESS_LOG_REPEAT_MIN_DISTINCT="${LIVENESS_LOG_REPEAT_MIN_DISTINCT:-3}" # < this many distinct = collapsed

# probe_commit_age <now> <start_epoch> <last_commit_epoch|''> <worktree_present:0|1>
#
# Time since the worktree's last forward progress, floored at session start so a
# just-launched session (no commits yet) does not read as 45-min-stalled on tick
# one. A commit newer than start resets the window.
probe_commit_age() {
  local now="$1" start_epoch="$2" last_commit="$3" worktree_present="$4"

  # Missing worktree → not our signal (the GC orphan sweep owns that failure).
  if [[ "$worktree_present" != 1 ]]; then
    echo UNKNOWN
    return 0
  fi

  # Guard the arithmetic against a non-numeric last_commit (e.g. garbage from a
  # misbehaving git): a bare `(( not-a-number ))` aborts the whole runner under
  # `set -u`. A non-numeric value means "no usable commit" → stay on the floor.
  local progress_epoch="$start_epoch"
  if [[ "$last_commit" =~ ^[0-9]+$ ]] && (( last_commit > progress_epoch )); then
    progress_epoch="$last_commit"
  fi

  local age=$(( now - progress_epoch ))
  if (( age >= LIVENESS_STALL_WINDOW )); then
    echo STALL
  else
    echo OK
  fi
  return 0
}

# probe_process <screen_alive:0|1> <pid|''> <cpu1> <cpu2>
#
# Classifies the spawned `claude` process. Two CPU samples are passed so the
# max() can dodge a between-bursts trough (a momentary 0% is not idleness).
# NOTE: CPU-idle alone is intentionally only a SOFT (STALL) signal — a #871
# thinking-block loop spins CPU non-zero, so it is caught by the commit + log
# probes corroborating, never by this probe alone (see design §2.2).
probe_process() {
  local screen_alive="$1" pid="$2" cpu1="$3" cpu2="$4"

  if [[ -z "$pid" ]]; then
    # No claude process. Screen daemon still alive → husk (conclusive dead).
    # Neither alive → nothing to judge.
    if [[ "$screen_alive" == 1 ]]; then
      echo HUSK
    else
      echo UNKNOWN
    fi
    return 0
  fi

  # pid present → classify on the max of the two CPU samples (float-safe via awk).
  local idle
  # `+0` coerces each sample to a number so a stray non-float (not just empty)
  # can't slip through as a string compare and misread idle as working.
  idle="$(awk -v a="${cpu1:-0}" -v b="${cpu2:-0}" -v t="$LIVENESS_CPU_IDLE_PCT" \
    'BEGIN { a += 0; b += 0; m = (a > b) ? a : b; print (m < t) ? "1" : "0" }')"
  if [[ "$idle" == 1 ]]; then
    echo STALL
  else
    echo OK
  fi
  return 0
}

# probe_log <logfile_present:0|1> <mtime_age_seconds>   (session tail on stdin)
#
# Two stall flavours: a hard stall (no new output within the window) and a loop
# (the #871 thinking-block signature — the trailing window collapses to too few
# distinct lines). The repeat check needs enough lines to establish a loop, so a
# short fresh log is OK (insufficient evidence), never a false STALL.
probe_log() {
  local present="$1" mtime_age="$2"

  if [[ "$present" != 1 ]]; then
    echo UNKNOWN
    return 0
  fi

  # A non-numeric mtime_age is a sampling failure, not evidence — and a bare
  # `(( not-a-number ))` would abort the runner under `set -u`. Treat as UNKNOWN.
  if ! [[ "$mtime_age" =~ ^[0-9]+$ ]]; then
    echo UNKNOWN
    return 0
  fi

  if (( mtime_age >= LIVENESS_STALL_WINDOW )); then
    echo STALL
    return 0
  fi

  if _log_repeat_collapsed; then
    echo STALL
  else
    echo OK
  fi
  return 0
}

# _log_repeat_collapsed   (tail on stdin) → exit 0 if the trailing window has
# collapsed to a loop (< MIN_DISTINCT distinct lines over the last TAIL
# non-blank lines), exit 1 otherwise. Requires >= MIN_LINES non-blank lines to
# judge — too few is "not enough evidence", not a loop.
_log_repeat_collapsed() {
  awk \
    -v tail_n="$LIVENESS_LOG_REPEAT_TAIL" \
    -v min_lines="$LIVENESS_LOG_REPEAT_MIN_LINES" \
    -v min_distinct="$LIVENESS_LOG_REPEAT_MIN_DISTINCT" '
    /[^[:space:]]/ { buf[++n] = $0 }
    END {
      start = (n > tail_n) ? n - tail_n + 1 : 1
      considered = 0
      for (i = start; i <= n; i++) { considered++; seen[buf[i]] = 1 }
      if (considered < min_lines) { exit 1 }   # insufficient evidence → not collapsed
      d = 0
      for (k in seen) d++
      exit (d < min_distinct) ? 0 : 1
    }
  '
}
