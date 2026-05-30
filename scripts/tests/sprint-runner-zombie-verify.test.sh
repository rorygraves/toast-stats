#!/usr/bin/env bash
# Simulated-zombie END-TO-END verification for the stuck-session liveness
# detector (epic #933 Sprint 5, #932). The Sprint 2–4 tests proved the probes,
# fusion, and reap/relaunch/escalate state machine in isolation; this test drives
# the THREE real failure modes the epic enumerated, through a full `mode_run`
# tick, against the SAME host surface evaluate_liveness samples — including the
# on-disk session logfile the log probe reads:
#
#   (a) #871 API-error loop — screen alive, claude alive + NON-ZERO CPU (a
#       thinking-block loop spins CPU, so the process probe reads OK, NOT husk),
#       no commits in 45 min, output looping. Detection MUST come from commit +
#       log corroborating (2 STALL → STUCK), never from CPU alone (design §2.2).
#       This is the mode that was UNDETECTABLE until Sprint 5 wired the session
#       logfile: with no logfile the log probe is UNKNOWN and the shape collapses
#       to a single soft signal (SUSPECT → never reaped). The relaunch path also
#       proves the logfile is WIRED at launch (the production gap this sprint
#       closes).
#   (b) crashed-but-screen-alive — the `claude` child is gone but the screen
#       daemon lingers (HUSK). Conclusive single signal → reap. Also proves the
#       logfile is REMOVED on reap (truth-tied to session lifetime).
#   (c) slow-but-healthy — busy CPU, a recent commit, a growing/varied log.
#       The false-positive guard: across repeated ticks it must NEVER reach
#       STUCK. Plus a slow-but-progressing variant (last commit at minute 44)
#       that stays under the 45-min window and survives.
#
# Hermetic: mocks gh/screen/pgrep/ps/git on PATH; LIVENESS_CPU_SAMPLE_GAP=0 so
# the CPU double-sample doesn't sleep. The session logfile is REAL (under
# $RUNNER_LOG_DIR) because evaluate_liveness samples it with `stat`/`tail`, not a
# mock. macOS-local by design (ps -o lstart / stat -f / date -v) — the runner is
# a macOS launchd job; this is not an ubuntu-CI test.
#
# Run directly: scripts/tests/sprint-runner-zombie-verify.test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../sprint-runner.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BIN="$TMP/bin"; mkdir -p "$BIN"

# Mock gh: META_EPIC #900 → epic #901 (one unchecked sprint, #930, OPEN). #930
# carries no labels (escalation not pre-suppressed). pr list → unshipped so the
# L086 ship-check lets a relaunch through.
cat > "$BIN/gh" <<'EOF'
#!/usr/bin/env bash
echo "GH $*" >> "$GH_CALLS"
sub="$1"; verb="$2"; num="$3"
if [[ "$sub" == "pr" && "$verb" == "list" ]]; then echo '[]'; exit 0; fi
if [[ "$sub" == "label" ]]; then exit 0; fi
if [[ "$sub" == "issue" && "$verb" == "edit" ]]; then exit 0; fi
if [[ "$sub" == "issue" && "$verb" == "comment" ]]; then exit 0; fi
if [[ "$sub" == "issue" && "$verb" == "view" ]]; then
  field=""; args=("$@")
  for ((i=0; i<${#args[@]}; i++)); do [[ "${args[i]}" == "--json" ]] && field="${args[i+1]}"; done
  case "$num:$field" in
    900:body)   printf '%s' '- [ ] **Epic Test** — #901' ;;
    901:body)   printf '%s' '- [ ] **Sprint 1** — #930' ;;
    930:state)  printf '%s' 'OPEN' ;;
  esac
  exit 0
fi
exit 0
EOF
chmod +x "$BIN/gh"

# Mock screen: `-ls` lists the in-epic active session sprint-runner-930 (and
# mirrors macOS screen exiting 1 even when sessions exist — R14/L089). Every
# other call (quit on reap, the -dmS relaunch) is appended to $SCREEN_CALLS so we
# can assert the relaunch invocation carries the logfile wiring.
cat > "$BIN/screen" <<'EOF'
#!/usr/bin/env bash
if [[ "${1:-}" == "-ls" ]]; then
  echo "There is a screen on:" >&2
  echo "    12345.sprint-runner-930    (Detached)" >&2
  exit 1
fi
echo "SCREEN_CALL $*" >> "$SCREEN_CALLS"
exit 0
EOF
chmod +x "$BIN/screen"

# Mock pgrep: the screen daemon is always alive. The claude child presence is
# toggled by $CLAUDE_ALIVE (1 → pid 4242 → process probe reads CPU; 0 → none →
# HUSK).
cat > "$BIN/pgrep" <<'EOF'
#!/usr/bin/env bash
pat="${*: -1}"
case "$pat" in
  *"SCREEN -dmS sprint-runner-930"*) echo 12345 ;;
  *"remote-control sprint-930"*)     [[ "${CLAUDE_ALIVE:-0}" == 1 ]] && echo 4242 ;;
esac
exit 0
EOF
chmod +x "$BIN/pgrep"

# Mock ps: %cpu controlled by $CPU (default 50 = busy → process probe OK). lstart
# is a REAL timestamp 60 min in the past, so the session-start floor is always
# older than the 45-min window — commit-age is then governed entirely by the
# mocked last-commit epoch (below), making the stall boundary deterministic.
cat > "$BIN/ps" <<'EOF'
#!/usr/bin/env bash
case "$*" in
  *"-o %cpu="*)   echo "${CPU:-50.0}" ;;
  *"-o lstart="*) date -v-60M '+%a %b %e %T %Y' ;;
esac
exit 0
EOF
chmod +x "$BIN/ps"

# Mock git: last-commit epoch is `now - $COMMIT_AGE` (default 3000s ≈ 50 min →
# commit probe STALL). `--grep` (origin/main ship-check) → empty (unshipped).
# Worktree/fetch subcommands → no-op success.
cat > "$BIN/git" <<'EOF'
#!/usr/bin/env bash
args="$*"
case "$args" in
  *"--format=%ct"*) echo $(( $(date +%s) - ${COMMIT_AGE:-3000} )); exit 0 ;;
  *"--grep"*)       exit 0 ;;
esac
exit 0
EOF
chmod +x "$BIN/git"

export PATH="$BIN:$PATH"
export META_EPIC=900
export SPRINT_RUNNER_LOCK_DIR="$TMP/lock"
export WORKTREE_BASE="$TMP/worktrees"
export RUNNER_LOG_DIR="$TMP/runner-logs"
export LIVENESS_CPU_SAMPLE_GAP=0
export SCREEN_CALLS="$TMP/screen-calls.log"
export GH_CALLS="$TMP/gh-calls.log"
unset EPIC || true

STATE="$WORKTREE_BASE/.runner-state.json"
LOGFILE="$RUNNER_LOG_DIR/session-930.log"
fail=0

attempts_of() { jq -r '."930".attempts // 0' "$STATE" 2>/dev/null || echo 0; }

# write_loop_log → a #871-shape transcript: the trailing window collapses to a
# single distinct line (a thinking-block loop), mtime fresh (so it is the LOOP
# signature, not a stale hard-stall).
write_loop_log() {
  mkdir -p "$RUNNER_LOG_DIR"
  : > "$LOGFILE"
  local i
  for i in $(seq 1 15); do
    echo "esc=tool_use_id thinking block missing; retrying request…" >> "$LOGFILE"
  done
}

# write_healthy_log → a varied, growing transcript (>= MIN distinct lines), mtime
# fresh → log probe OK.
write_healthy_log() {
  mkdir -p "$RUNNER_LOG_DIR"
  : > "$LOGFILE"
  local i
  for i in $(seq 1 15); do echo "step $i: edited file_$i.ts, ran tests, committed" >> "$LOGFILE"; done
}

reset_world() {
  rm -rf "$WORKTREE_BASE" "$RUNNER_LOG_DIR"
  mkdir -p "$WORKTREE_BASE/sprint-930" "$RUNNER_LOG_DIR"
  : > "$SCREEN_CALLS"
  : > "$GH_CALLS"
}

# === Mode A: #871 alive-loop → STUCK via commit+log → reap + relaunch ========
# claude ALIVE + busy CPU (process OK, the thinking-loop spins CPU), no commit in
# ~50 min (commit STALL), output looping (log STALL) → 2 corroborating stalls →
# STUCK → reap + relaunch + attempts 0→1. The relaunch invocation must carry the
# per-session logfile wiring (-c <screenrc> -L), and that screenrc must point the
# logfile at session-930.log — proving the production feed the log probe needs is
# actually written at launch.
reset_world
write_loop_log
CLAUDE_ALIVE=1 CPU=55.0 COMMIT_AGE=3000 "$RUNNER" >"$TMP/a.log" 2>&1 || true

rc_arg="$(sed -nE 's/.*-dmS sprint-runner-930 -c ([^ ]+) -L.*/\1/p' "$SCREEN_CALLS" | head -1)"
wiring_ok=0
if [[ -n "$rc_arg" && -f "$rc_arg" ]] && grep -q "session-930.log" "$rc_arg"; then wiring_ok=1; fi

if grep -q 'verdict=STUCK' "$TMP/a.log" \
   && grep -q 'process=OK' "$TMP/a.log" \
   && grep -q 'commit=STALL' "$TMP/a.log" \
   && grep -q 'log=STALL' "$TMP/a.log" \
   && grep -q 'SCREEN_CALL .*-X -S sprint-runner-930 quit' "$SCREEN_CALLS" \
   && grep -q 'SCREEN_CALL -dmS sprint-runner-930' "$SCREEN_CALLS" \
   && [[ "$(attempts_of)" == 1 ]] \
   && (( wiring_ok == 1 )); then
  echo "PASS [A]: #871 alive-loop → STUCK (commit+log, not cpu) → reap+relaunch, logfile wired at launch"
else
  echo "FAIL [A]: expected STUCK via commit+log, reap+relaunch, attempts=1, logfile-wired relaunch."
  echo "  wiring_ok=$wiring_ok rc_arg=$rc_arg attempts=$(attempts_of)"
  echo "  log:"; sed 's/^/    /' "$TMP/a.log"
  echo "  screen:"; sed 's/^/    /' "$SCREEN_CALLS"; fail=1
fi

# === Mode B: crashed-but-screen-alive (HUSK) → reap + logfile removed =========
reset_world
write_loop_log   # a logfile exists; reap must delete it
[[ -f "$LOGFILE" ]] || { echo "FAIL [B-setup]: logfile not created"; fail=1; }
CLAUDE_ALIVE=0 "$RUNNER" >"$TMP/b.log" 2>&1 || true
if grep -q 'verdict=HUSK' "$TMP/b.log" \
   && grep -q 'SCREEN_CALL .*-X -S sprint-runner-930 quit' "$SCREEN_CALLS" \
   && [[ ! -f "$LOGFILE" ]]; then
  echo "PASS [B]: crashed (HUSK) → reaped, session logfile removed"
else
  echo "FAIL [B]: expected HUSK reap + logfile removed. logfile_present=$([[ -f "$LOGFILE" ]] && echo yes || echo no)"
  echo "  log:"; sed 's/^/    /' "$TMP/b.log"
  echo "  screen:"; sed 's/^/    /' "$SCREEN_CALLS"; fail=1
fi

# === Mode C: slow-but-healthy → never STUCK across repeated ticks =============
# busy CPU + recent commit (5 min) + varied growing log → HEALTHY. Run TWO ticks
# (the false-positive guard: a healthy long session must survive every tick).
reset_world
healthy_ok=1
for tick in 1 2; do
  write_healthy_log
  CLAUDE_ALIVE=1 CPU=70.0 COMMIT_AGE=300 "$RUNNER" >"$TMP/c$tick.log" 2>&1 || true
  if ! grep -q 'verdict=HEALTHY' "$TMP/c$tick.log" \
     || grep -q 'SCREEN_CALL .*quit' "$SCREEN_CALLS" \
     || grep -q 'SCREEN_CALL -dmS sprint-runner-930' "$SCREEN_CALLS"; then
    healthy_ok=0
  fi
done
if (( healthy_ok == 1 )); then
  echo "PASS [C]: slow-but-healthy → HEALTHY every tick, never reaped (false-positive guard)"
else
  echo "FAIL [C]: a healthy session was reaped or non-HEALTHY:"
  echo "  c1:"; sed 's/^/    /' "$TMP/c1.log"; echo "  c2:"; sed 's/^/    /' "$TMP/c2.log"
  echo "  screen:"; sed 's/^/    /' "$SCREEN_CALLS"; fail=1
fi

# === Mode D: slow-but-progressing (commit at minute 44) → survives ===========
# Last commit 44 min ago (under the 45-min window) with a quiet (non-looping) log
# → at most ONE soft signal → never STUCK. Proves the window boundary protects a
# genuinely-slow sprint that just committed.
reset_world
write_healthy_log
CLAUDE_ALIVE=1 CPU=8.0 COMMIT_AGE=2640 "$RUNNER" >"$TMP/d.log" 2>&1 || true
if ! grep -q 'verdict=STUCK' "$TMP/d.log" \
   && grep -q 'commit=OK' "$TMP/d.log" \
   && ! grep -q 'SCREEN_CALL .*quit' "$SCREEN_CALLS" \
   && ! grep -q 'SCREEN_CALL -dmS sprint-runner-930' "$SCREEN_CALLS"; then
  echo "PASS [D]: slow-but-progressing (commit @ 44 min) → not STUCK, survives"
else
  echo "FAIL [D]: a just-committed slow session was reaped or read STUCK:"
  echo "  log:"; sed 's/^/    /' "$TMP/d.log"
  echo "  screen:"; sed 's/^/    /' "$SCREEN_CALLS"; fail=1
fi

exit "$fail"
