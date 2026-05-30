#!/usr/bin/env bash
# Unit tests for the stuck-session liveness PROBES (epic #933 Sprint 2, #929).
#
# The three probes are PURE classify functions over injected inputs (sampled
# command outputs, a clock, flags) — no live screen / git / ps needed. The
# "sample" side lives at the runner's edge (wired in Sprint 3, #930); these
# functions only classify, so they are unit-testable with fixtures.
#
# Verdict vocabulary (per docs/design/sprint-runner-liveness-detector-2026-05-30.md):
#   OK       — evidence of progress
#   STALL    — evidence of no progress
#   UNKNOWN  — cannot tell (missing worktree/logfile/PID); never treated as stall
#   HUSK     — screen daemon alive but its `claude` child is gone (conclusive)
#
# Hermetic: sources the lib directly, asserts on stdout. No PATH mocks needed
# because the functions take their inputs as arguments / stdin.
#
# Run directly: scripts/tests/sprint-runner-probes.test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB="$SCRIPT_DIR/../lib/sprint-runner-probes.sh"

# shellcheck source=../lib/sprint-runner-probes.sh
source "$LIB"

fail=0
WINDOW=2700 # 45 min — matches LIVENESS_STALL_WINDOW default

# assert_eq <label> <expected> <actual>
assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "PASS: $label"
  else
    echo "FAIL: $label — expected '$expected', got '$actual'"
    fail=1
  fi
}

now=1000000000
start=$now

# ---------------------------------------------------------------------------
# probe_commit_age <now> <start_epoch> <last_commit_epoch|''> <worktree_present:0|1>
# ---------------------------------------------------------------------------
# Fresh session, no commits yet → floored at start_epoch → OK (not STALL on tick 1).
assert_eq "commit: fresh session (no commits, floored)" "OK" \
  "$(probe_commit_age "$((start + 600))" "$start" "" 1)"

# 44 min since start, still no commits → under window → OK.
assert_eq "commit: 44m no commits → OK" "OK" \
  "$(probe_commit_age "$((start + 2640))" "$start" "" 1)"

# 46 min since last forward progress → over window → STALL.
assert_eq "commit: 46m no commits → STALL" "STALL" \
  "$(probe_commit_age "$((start + 2760))" "$start" "" 1)"

# A recent commit (newer than start) resets the window even on an old session.
assert_eq "commit: recent commit resets old session → OK" "OK" \
  "$(probe_commit_age "$now" "$((now - 100000))" "$((now - 100))" 1)"

# An OLD last-commit on an old session, both past window → STALL.
assert_eq "commit: old commit on old session → STALL" "STALL" \
  "$(probe_commit_age "$now" "$((now - 100000))" "$((now - 5000))" 1)"

# Missing worktree → UNKNOWN (don't infer stall from absence; GC owns that).
assert_eq "commit: missing worktree → UNKNOWN" "UNKNOWN" \
  "$(probe_commit_age "$now" "$start" "" 0)"

# ---------------------------------------------------------------------------
# probe_process <screen_alive:0|1> <pid|''> <cpu1> <cpu2>
# ---------------------------------------------------------------------------
# Husk: screen daemon alive, claude child gone → conclusive HUSK.
assert_eq "process: screen alive + pid gone → HUSK" "HUSK" \
  "$(probe_process 1 "" "" "")"

# Idle: pid present, both CPU samples ~0 → STALL.
assert_eq "process: pid + 0%/0% → STALL" "STALL" \
  "$(probe_process 1 4242 0.0 0.0)"

# Between-bursts trough: first sample 0, second spikes → max() rescues → OK.
assert_eq "process: pid + trough then spike (max) → OK" "OK" \
  "$(probe_process 1 4242 0.0 12.5)"

# Clearly working: both samples high → OK.
assert_eq "process: pid + 40%/35% → OK" "OK" \
  "$(probe_process 1 4242 40 35)"

# No session at all (no screen, no pid) → UNKNOWN (nothing to judge).
assert_eq "process: no screen + no pid → UNKNOWN" "UNKNOWN" \
  "$(probe_process 0 "" "" "")"

# ---------------------------------------------------------------------------
# probe_log <logfile_present:0|1> <mtime_age_seconds>   (tail text on stdin)
# ---------------------------------------------------------------------------
# Hard stall: no new output in 46 min → STALL regardless of tail content.
assert_eq "log: 46m stale mtime → STALL" "STALL" \
  "$(printf 'whatever\n' | probe_log 1 2760)"

# #871 thinking-block shape: tail collapses to 1 distinct line → loop → STALL.
repeat_fixture() {
  for _ in $(seq 1 20); do
    echo "✻ Thinking… (esc to interrupt)"
  done
}
assert_eq "log: #871 repeat-collapse → STALL" "STALL" \
  "$(repeat_fixture | probe_log 1 100)"

# Two alternating lines (still < 3 distinct over the window) → STALL.
alt_fixture() {
  for _ in $(seq 1 10); do
    echo "line A"
    echo "line B"
  done
}
assert_eq "log: 2-line oscillation (<3 distinct) → STALL" "STALL" \
  "$(alt_fixture | probe_log 1 100)"

# Healthy: many distinct lines, fresh mtime → OK.
healthy_fixture() {
  for i in $(seq 1 20); do
    echo "step $i: doing distinct work item $i"
  done
}
assert_eq "log: healthy varied tail → OK" "OK" \
  "$(healthy_fixture | probe_log 1 100)"

# Missing logfile (pre-rollout session) → UNKNOWN.
assert_eq "log: missing logfile → UNKNOWN" "UNKNOWN" \
  "$(printf '' | probe_log 0 100)"

# Too few lines to establish a loop → OK (insufficient evidence, no false STALL).
assert_eq "log: short fresh log (insufficient evidence) → OK" "OK" \
  "$(printf 'just started\nok\n' | probe_log 1 100)"

exit "$fail"
