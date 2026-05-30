#!/usr/bin/env bash
# Integration regression test for the liveness verdict wired into mode_run's
# active-session branch (epic #933 Sprint 3 #930, updated for Sprint 4 #931).
#
# The runner used to do an unconditional "OPEN session → skip launch" exit. Now
# an OPEN in-epic active session is first evaluated for liveness: the fused
# verdict is computed + logged. This test owns the HEALTHY (observe-only) edge
# and proves the verdict computation reaches the tick with its per-probe
# breakdown POPULATED (the globals-not-subshell bug guard). The full ACTING
# matrix a STUCK/HUSK verdict drives — reap → ship-check → relaunch → escalate,
# attempt persistence — lives in sprint-runner-reap-relaunch.test.sh (#931).
#
# Sprint 3 originally asserted "HUSK → handoff logged, NO reap (reap is Sprint
# 4)". Sprint 4 lands that reap, so that transitional contract is superseded:
# Case B now asserts HUSK reaches the live reap, not the deferred handoff.
#
# Hermetic: mocks gh/screen/pgrep/ps/git on PATH; LIVENESS_CPU_SAMPLE_GAP=0 so
# the CPU double-sample doesn't sleep. Asserts on the log decision.
#   Case A (claude alive + busy + recent commit): verdict=HEALTHY, populated
#                                                 breakdown, no launch, no reap.
#   Case B (screen alive + claude gone):          verdict=HUSK → live reap fired.
#
# Run directly: scripts/tests/sprint-runner-liveness-tick.test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../sprint-runner.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BIN="$TMP/bin"; mkdir -p "$BIN"

# Mock gh: META_EPIC #900 → epic #901 (one unchecked sprint, #930, OPEN).
cat > "$BIN/gh" <<'EOF'
#!/usr/bin/env bash
sub="$1"; verb="$2"; num="$3"
[[ "$sub" == "issue" && "$verb" == "edit" ]] && exit 0
if [[ "$sub" == "issue" && "$verb" == "view" ]]; then
  field=""; args=("$@")
  for ((i=0; i<${#args[@]}; i++)); do [[ "${args[i]}" == "--json" ]] && field="${args[i+1]}"; done
  case "$num:$field" in
    900:labels) ;;
    900:body)   printf '%s' '- [ ] **Epic Test** — #901' ;;
    901:body)   printf '%s' '- [ ] **Sprint 1** — #930' ;;
    930:state)  printf '%s' 'OPEN' ;;
    930:labels) ;;
  esac
  exit 0
fi
exit 0
EOF
chmod +x "$BIN/gh"

# Mock screen: `-ls` lists the in-epic active session sprint-runner-930 (and
# mirrors macOS screen exiting 1 even when sessions exist — R14/L089). Any
# mutating call (e.g. quit) is a silent no-op so a stray reap can't escape.
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

# Mock pgrep: the screen daemon is always alive (so gc_worktrees doesn't treat
# the worktree as an orphan). The claude child's presence is toggled by
# $CLAUDE_ALIVE (1 → pid 4242, 0 → none → husk).
cat > "$BIN/pgrep" <<'EOF'
#!/usr/bin/env bash
pat="${*: -1}"
case "$pat" in
  *"SCREEN -dmS sprint-runner-930"*) echo 12345 ;;
  *"remote-control sprint-930"*)     [[ "${CLAUDE_ALIVE:-1}" == 1 ]] && echo 4242 ;;
esac
exit 0
EOF
chmod +x "$BIN/pgrep"

# Mock ps: %cpu busy (50%), lstart a fixed parseable date for start derivation.
cat > "$BIN/ps" <<'EOF'
#!/usr/bin/env bash
case "$*" in
  *"-o %cpu="*)   echo "50.0" ;;
  *"-o lstart="*) echo "Fri May 30 09:00:00 2026" ;;
esac
exit 0
EOF
chmod +x "$BIN/ps"

# Mock git: worktree prune is a no-op; `log -1 --format=%ct` returns a recent
# commit epoch so the commit probe reads OK in the healthy case.
cat > "$BIN/git" <<EOF
#!/usr/bin/env bash
for a in "\$@"; do
  [[ "\$a" == "log" ]] && { date +%s; exit 0; }
done
exit 0
EOF
chmod +x "$BIN/git"

export PATH="$BIN:$PATH"
export META_EPIC=900
export SPRINT_RUNNER_LOCK_DIR="$TMP/lock"
export WORKTREE_BASE="$TMP/worktrees"
export LIVENESS_CPU_SAMPLE_GAP=0
export SCREEN_CALLS="$TMP/screen-calls.log"
: > "$SCREEN_CALLS"
unset EPIC || true

# The active session's worktree must exist for the commit probe to sample it.
mkdir -p "$WORKTREE_BASE/sprint-930"

fail=0

# --- Case A: claude alive + busy + recent commit → HEALTHY, plain skip ---
# The per-probe breakdown must be POPULATED, not blank: evaluate_liveness sets
# globals, so a command-substitution call would silently lose them (the bug a
# subshell call introduces). Assert the real probe tokens, not just the verdict.
CLAUDE_ALIVE=1 "$RUNNER" --dry-run >"$TMP/a.log" 2>&1 || true
if grep -q 'verdict=HEALTHY' "$TMP/a.log" \
   && grep -q 'commit=OK process=OK log=UNKNOWN' "$TMP/a.log" \
   && ! grep -q 'would launch screen session' "$TMP/a.log" \
   && ! grep -qi 'Sprint 4' "$TMP/a.log" \
   && ! grep -q 'SCREEN_CALL.*quit' "$SCREEN_CALLS"; then
  echo "PASS [A]: HEALTHY verdict + populated breakdown logged, no launch, no reap"
else
  echo "FAIL [A]: expected HEALTHY + breakdown + no launch + no reap, got:"; sed 's/^/    /' "$TMP/a.log"; fail=1
fi

# --- Case B: screen alive, claude gone → HUSK verdict reaches the LIVE reap ---
# (Sprint 4: HUSK now acts. The full reap→ship-check→relaunch→escalate matrix is
# asserted in sprint-runner-reap-relaunch.test.sh; here we only prove the HUSK
# verdict computed in the tick drives the reap action, not a deferred handoff.)
: > "$SCREEN_CALLS"
CLAUDE_ALIVE=0 "$RUNNER" >"$TMP/b.log" 2>&1 || true
if grep -q 'verdict=HUSK' "$TMP/b.log" \
   && grep -q 'process=HUSK' "$TMP/b.log" \
   && grep -q 'reaping stuck session' "$TMP/b.log" \
   && grep -q 'SCREEN_CALL .*-X -S sprint-runner-930 quit' "$SCREEN_CALLS"; then
  echo "PASS [B]: HUSK verdict + populated breakdown reaches the live reap"
else
  echo "FAIL [B]: expected HUSK + breakdown + live reap, got:"; sed 's/^/    /' "$TMP/b.log"; fail=1
fi

exit "$fail"
