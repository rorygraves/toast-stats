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

# _state_read → the store as JSON on stdout, or `{}` if missing/corrupt.
# Corruption resolves to an empty store (fail-safe: at worst a few extra
# relaunch attempts), never to an abort.
_state_read() {
  local f
  f="$(_state_file)"
  if [[ -f "$f" ]] && jq -e . "$f" >/dev/null 2>&1; then
    cat "$f"
  else
    echo '{}'
  fi
}

# state_get_attempts <issue> → integer attempt count (0 if absent/corrupt).
state_get_attempts() {
  local issue="$1" v
  v="$(_state_read | jq -r --arg k "$issue" '.[$k].attempts // 0' 2>/dev/null)"
  if [[ "$v" =~ ^[0-9]+$ ]]; then
    printf '%s' "$v"
  else
    printf '0'
  fi
}

# state_get_field <issue> <field> → the field's value, or empty string.
state_get_field() {
  local issue="$1" field="$2" v
  v="$(_state_read | jq -r --arg k "$issue" --arg f "$field" \
        '.[$k][$f] // ""' 2>/dev/null)" || v=""
  printf '%s' "$v"
}

# state_record <issue> <verdict> <attempts> [last_relaunch_epoch]
#   Atomic upsert of one issue's entry. attempts/epoch are coerced to integers
#   so a stray value can't make jq --argjson fail mid-tick.
state_record() {
  local issue="$1" verdict="$2" attempts="$3" relaunch="${4:-0}"
  [[ "$attempts" =~ ^[0-9]+$ ]] || attempts=0
  [[ "$relaunch" =~ ^[0-9]+$ ]] || relaunch=0

  local f tmp cur
  f="$(_state_file)"
  mkdir -p "$(dirname "$f")"
  cur="$(_state_read)"
  tmp="$(mktemp "${f}.XXXXXX")"
  if printf '%s' "$cur" | jq \
        --arg k "$issue" --arg v "$verdict" \
        --argjson a "$attempts" --argjson r "$relaunch" \
        '.[$k] = {attempts: $a, last_verdict: $v, last_relaunch_epoch: $r}' \
        > "$tmp"; then
    mv -f "$tmp" "$f"
  else
    rm -f "$tmp" 2>/dev/null || true
    return 1
  fi
  return 0
}

# state_prune <keep_issue...>
#   Reconcile the store down to the listed (live) issue keys, dropping entries
#   for issues that are CLOSED or no longer in the active epic. No args → empty
#   the store to `{}`. Convergent, so the file can't accumulate stale keys.
state_prune() {
  local f tmp cur keep_json='[]'
  f="$(_state_file)"
  [[ -f "$f" ]] || return 0
  cur="$(_state_read)"
  if (( $# > 0 )); then
    keep_json="$(printf '%s\n' "$@" | jq -R . | jq -s .)"
  fi
  mkdir -p "$(dirname "$f")"
  tmp="$(mktemp "${f}.XXXXXX")"
  if printf '%s' "$cur" | jq --argjson keep "$keep_json" \
        'with_entries(select(.key as $k | $keep | index($k)))' > "$tmp"; then
    mv -f "$tmp" "$f"
  else
    rm -f "$tmp" 2>/dev/null || true
    return 1
  fi
  return 0
}
