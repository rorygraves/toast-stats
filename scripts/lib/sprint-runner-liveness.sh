#!/usr/bin/env bash
# Stuck-session liveness FUSION + attempt-tracking STATE for sprint-runner.sh
# (epic #933, Sprint 3 #930).
#
# Design: docs/design/sprint-runner-liveness-detector-2026-05-30.md §3–§5.
#
# Layers (sourced AFTER scripts/lib/sprint-runner-probes.sh, which this file
# depends on for probe_commit_age / probe_process / probe_log):
#
#   fuse_verdict <commit> <process> <log>
#       Pure: combine the three probe verdicts into one of
#       HEALTHY | SUSPECT | STUCK | HUSK. HUSK (conclusive single signal) wins;
#       >=2 STALL corroborate to STUCK; exactly 1 STALL is a SUSPECT (never
#       reaps — the false-positive guard); else HEALTHY. UNKNOWN is never STALL.
#
#   state_* — a tiny jq-backed JSON store at $RUNNER_STATE_FILE (default
#       $WORKTREE_BASE/.runner-state.json). Holds the one fact runner truth
#       cannot reconstruct after a reap: the per-issue relaunch attempt count.
#       Writes are atomic (mktemp + mv) and fail-safe: a missing or corrupt
#       file reads as "0 attempts", never aborting the runner under set -u.
#
#   evaluate_liveness <issue>
#       The sampling EDGE: runs the live commands (git / pgrep / ps / stat /
#       tail), feeds them through the three probes, and echoes the fused
#       verdict. The pure layers above keep every decision unit-testable; this
#       is the only part that touches the host, so it is exercised via the
#       hermetic tick integration test with mocked git/pgrep/ps.
#
# Sourcing this file only DEFINES functions — no side effects.

# === Fusion =================================================================

# fuse_verdict <commit> <process> <log> → HEALTHY|SUSPECT|STUCK|HUSK
#   commit, log ∈ {OK, STALL, UNKNOWN}
#   process     ∈ {OK, STALL, UNKNOWN, HUSK}
fuse_verdict() {
  local commit="$1" process="$2" log="$3"

  # Conclusive single signal: a husk (screen alive, claude gone) is provably
  # not working — act without waiting for corroboration.
  if [[ "$process" == HUSK ]]; then
    echo HUSK
    return 0
  fi

  local stalls=0
  [[ "$commit" == STALL ]] && stalls=$((stalls + 1))
  [[ "$process" == STALL ]] && stalls=$((stalls + 1))
  [[ "$log" == STALL ]] && stalls=$((stalls + 1))

  if (( stalls >= 2 )); then
    echo STUCK          # corroborated — two independent stall signals agree
  elif (( stalls == 1 )); then
    echo SUSPECT        # one soft signal — log + re-evaluate next tick, no reap
  else
    echo HEALTHY        # progress, or only UNKNOWN (insufficient evidence)
  fi
  return 0
}

# === Attempt-tracking state store ==========================================
#
# The attempt counter must survive the reap that destroys the worktree, the
# screen, and the logfile — so it cannot be derived from any of them. It is the
# single piece of genuinely durable runner-internal state (design §4.2).

# _state_file → path of the JSON store (lazy so set -u can't trip on an unset
# WORKTREE_BASE at source time).
_state_file() {
  if [[ -n "${RUNNER_STATE_FILE:-}" ]]; then
    printf '%s' "$RUNNER_STATE_FILE"
  else
    printf '%s' "${WORKTREE_BASE:-$HOME/sprint-worktrees}/.runner-state.json"
  fi
}

# _int_or <value> <default> → echo value if it's a non-negative integer, else
# the default. Guards every jq --argjson site so a stray value can't abort the
# tick under set -u.
_int_or() {
  if [[ "$1" =~ ^[0-9]+$ ]]; then printf '%s' "$1"; else printf '%s' "$2"; fi
}

# _state_read → the store as JSON on stdout, or `{}` if missing/corrupt.
# Corruption resolves to an empty store (fail-safe: at worst a few extra
# relaunch attempts), never to an abort. One jq does validate-and-emit.
_state_read() {
  jq -e . "$(_state_file)" 2>/dev/null || echo '{}'
}

# _state_write_atomic  (new JSON content as $1) → replace the store atomically
# (mktemp + mv rename). The caller computes the content and checks jq's exit
# BEFORE calling here, so a failed transform never reaches the file.
_state_write_atomic() {
  local content="$1" f tmp
  f="$(_state_file)"
  mkdir -p "$(dirname "$f")"
  tmp="$(mktemp "${f}.XXXXXX")"
  if printf '%s' "$content" > "$tmp"; then
    mv -f "$tmp" "$f"
  else
    rm -f "$tmp" 2>/dev/null || true
    return 1
  fi
  return 0
}

# state_get_field <issue> <field> → the field's value, or empty string.
state_get_field() {
  local issue="$1" field="$2" v
  v="$(_state_read | jq -r --arg k "$issue" --arg f "$field" \
        '.[$k][$f] // ""' 2>/dev/null)" || v=""
  printf '%s' "$v"
}

# state_get_attempts <issue> → integer attempt count (0 if absent/corrupt).
state_get_attempts() {
  _int_or "$(state_get_field "$1" attempts)" 0
}

# state_record <issue> <verdict> <attempts> [last_relaunch_epoch]
#   Atomic upsert of one issue's entry.
state_record() {
  local issue="$1" verdict="$2" attempts new
  attempts="$(_int_or "$3" 0)"
  local relaunch; relaunch="$(_int_or "${4:-0}" 0)"

  new="$(_state_read | jq \
        --arg k "$issue" --arg v "$verdict" \
        --argjson a "$attempts" --argjson r "$relaunch" \
        '.[$k] = {attempts: $a, last_verdict: $v, last_relaunch_epoch: $r}')" \
    || return 1
  _state_write_atomic "$new"
}

# state_prune <keep_issue...>
#   Reconcile the store down to the listed (live) issue keys, dropping entries
#   for issues that are CLOSED or no longer in the active epic. No args → empty
#   the store to `{}`. Convergent, so the file can't accumulate stale keys.
state_prune() {
  [[ -f "$(_state_file)" ]] || return 0
  local keep_json='[]' new
  if (( $# > 0 )); then
    keep_json="$(printf '%s\n' "$@" | jq -Rn '[inputs]')"
  fi
  new="$(_state_read | jq --argjson keep "$keep_json" \
        'with_entries(select(.key as $k | $keep | index($k)))')" \
    || return 1
  _state_write_atomic "$new"
}

# === Sampling edge =========================================================
#
# evaluate_liveness is the ONLY part that touches the host. It samples the live
# commands, feeds them through the pure probes, and echoes the fused verdict.
# After it returns, the caller can read the per-probe breakdown from the
# LIVENESS_COMMIT / LIVENESS_PROCESS / LIVENESS_LOG globals (for logging and a
# future --status line). pgrep/ps are used over `screen -ls` deliberately —
# macOS `screen -ls` exits 1 even when sessions exist and silently inverts a
# pipefail predicate (R14/L089).

LIVENESS_COMMIT=""
LIVENESS_PROCESS=""
LIVENESS_LOG=""

# _wt_base → the worktree parent (set -u-safe default).
_wt_base() { printf '%s' "${WORKTREE_BASE:-$HOME/sprint-worktrees}"; }

# _session_start_epoch <issue> <screen_pid> → epoch the session started.
# DERIVED, not stored (design §4.1): the screen daemon's start time IS the
# session start. Falls back to the worktree's birth time, then to now (a fresh
# session reads as progress-zero, never STALL).
_session_start_epoch() {
  local issue="$1" screen_pid="$2" epoch="" lstart
  if [[ -n "$screen_pid" ]]; then
    lstart="$(ps -o lstart= -p "$screen_pid" 2>/dev/null || true)"
    if [[ -n "$lstart" ]]; then
      epoch="$(date -j -f '%a %b %e %T %Y' "$lstart" +%s 2>/dev/null || true)"
    fi
  fi
  if ! [[ "$epoch" =~ ^[0-9]+$ ]]; then
    epoch="$(stat -f %B "$(_wt_base)/sprint-$issue" 2>/dev/null || true)"
  fi
  [[ "$epoch" =~ ^[0-9]+$ ]] || epoch="$(date +%s)"
  printf '%s' "$epoch"
}

# evaluate_liveness <issue> → echoes HEALTHY|SUSPECT|STUCK|HUSK; sets the
# LIVENESS_* globals as a side effect. Never aborts under set -u.
evaluate_liveness() {
  local issue="$1" now wt wt_present last_commit start_epoch
  local screen_pid claude_pid screen_alive
  now="$(date +%s)"

  wt="$(_wt_base)/sprint-$issue"
  if [[ -d "$wt" ]]; then
    wt_present=1
    last_commit="$(git -C "$wt" log -1 --format=%ct 2>/dev/null || true)"
  else
    wt_present=0
    last_commit=""
  fi

  screen_pid="$(pgrep -f "SCREEN -dmS sprint-runner-$issue" 2>/dev/null | head -1 || true)"
  [[ -n "$screen_pid" ]] && screen_alive=1 || screen_alive=0
  claude_pid="$(pgrep -f "remote-control sprint-$issue" 2>/dev/null | head -1 || true)"

  start_epoch="$(_session_start_epoch "$issue" "$screen_pid")"

  # CPU: two samples, max() dodges a between-bursts trough. Only when a claude
  # pid exists (no pid → the process probe takes the husk/unknown path).
  local cpu1="" cpu2=""
  if [[ -n "$claude_pid" ]]; then
    cpu1="$(ps -o %cpu= -p "$claude_pid" 2>/dev/null | tr -d ' ' || true)"
    sleep "${LIVENESS_CPU_SAMPLE_GAP:-3}"
    cpu2="$(ps -o %cpu= -p "$claude_pid" 2>/dev/null | tr -d ' ' || true)"
  fi

  # Log signal: sample the per-session screen logfile IF present. Production
  # screen-logfile wiring is deferred (macOS screen 4.00.03 has no -Logfile;
  # see tasks/sprint-930-plan.md), so this is UNKNOWN until a later sprint —
  # the safe direction (UNKNOWN never counts as STALL).
  local logfile log_present=0 mtime_age=0 mtime
  logfile="${RUNNER_LOG_DIR:-$(_wt_base)/.runner-logs}/session-$issue.log"
  if [[ -f "$logfile" ]]; then
    log_present=1
    mtime="$(_int_or "$(stat -f %m "$logfile" 2>/dev/null)" "$now")"
    mtime_age=$(( now - mtime ))
  fi

  LIVENESS_COMMIT="$(probe_commit_age "$now" "$start_epoch" "$last_commit" "$wt_present")"
  LIVENESS_PROCESS="$(probe_process "$screen_alive" "$claude_pid" "$cpu1" "$cpu2")"
  if (( log_present == 1 )); then
    LIVENESS_LOG="$(tail -n 40 "$logfile" 2>/dev/null | probe_log 1 "$mtime_age")"
  else
    LIVENESS_LOG="$(printf '' | probe_log 0 "$mtime_age")"
  fi

  fuse_verdict "$LIVENESS_COMMIT" "$LIVENESS_PROCESS" "$LIVENESS_LOG"
  return 0
}
