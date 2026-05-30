#!/usr/bin/env bash
# Integration regression test for the Sprint-4 reap → ship-check → relaunch →
# escalate state machine wired into mode_run's active-session branch
# (epic #933 Sprint 4, #931).
#
# Sprint 3 (#930) only OBSERVED: an OPEN in-epic session got a liveness verdict
# logged + recorded, but every path still skipped the launch. Sprint 4 ACTS on a
# STUCK/HUSK verdict:
#   - attempts < cap, unshipped  → reap + relaunch (attempts += 1, persisted).
#   - attempts < cap, ALREADY SHIPPED (L086) → reap, NO relaunch (don't
#     duplicate merged work); reconcile/notify instead.
#   - attempts >= cap            → escalate: reap, add `runner-stuck` label,
#     comment, notify, leave slot free, NO relaunch.
# A HEALTHY verdict must still leave the session running untouched.
#
# Hermetic: mocks gh/screen/pgrep/ps/git on PATH; LIVENESS_CPU_SAMPLE_GAP=0 so
# the CPU double-sample doesn't sleep. Asserts on the screen/gh call logs + the
# persisted attempt counter. A husk (screen alive, claude gone → CLAUDE_ALIVE=0)
# is the conclusive-single STUCK trigger used to drive every acting case.
#
# Run directly: scripts/tests/sprint-runner-reap-relaunch.test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../sprint-runner.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BIN="$TMP/bin"; mkdir -p "$BIN"

# Mock gh: META_EPIC #900 → epic #901 (one unchecked sprint, #930, OPEN). Every
# invocation is appended to $GH_CALLS so escalation (issue edit/comment) is
# assertable. `pr list` toggles ship state via $SHIPPED. `label create` is a
# no-op success. #930 carries no labels (so escalation isn't pre-suppressed).
cat > "$BIN/gh" <<'EOF'
#!/usr/bin/env bash
echo "GH $*" >> "$GH_CALLS"
sub="$1"; verb="$2"; num="$3"
if [[ "$sub" == "pr" && "$verb" == "list" ]]; then
  if [[ "${SHIPPED:-0}" == 1 ]]; then echo '[{"number":1}]'; else echo '[]'; fi
  exit 0
fi
if [[ "$sub" == "label" ]]; then exit 0; fi
if [[ "$sub" == "issue" && "$verb" == "edit" ]]; then exit 0; fi
if [[ "$sub" == "issue" && "$verb" == "comment" ]]; then exit 0; fi
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
# mirrors macOS screen exiting 1 even when sessions exist — R14/L089). Every
# other call (quit on reap, -dmS on relaunch) is appended to $SCREEN_CALLS.
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

# Mock pgrep: screen daemon always alive (so gc_worktrees / launch-verify see
# it). The claude child presence is toggled by $CLAUDE_ALIVE (0 → husk → STUCK).
cat > "$BIN/pgrep" <<'EOF'
#!/usr/bin/env bash
pat="${*: -1}"
case "$pat" in
  *"SCREEN -dmS sprint-runner-930"*) echo 12345 ;;
  *"remote-control sprint-930"*)     [[ "${CLAUDE_ALIVE:-0}" == 1 ]] && echo 4242 ;;
  *"claude --remote-control sprint-930"*) ;;  # reap orphan-kill check: none
esac
exit 0
EOF
chmod +x "$BIN/pgrep"

# Mock ps: %cpu busy, lstart a fixed parseable date for start derivation.
cat > "$BIN/ps" <<'EOF'
#!/usr/bin/env bash
case "$*" in
  *"-o %cpu="*)   echo "50.0" ;;
  *"-o lstart="*) echo "Fri May 30 09:00:00 2026" ;;
esac
exit 0
EOF
chmod +x "$BIN/ps"

# Mock git: `log ... --format=%ct` → recent commit epoch (commit probe OK);
# `log origin/main --grep` → empty (no shipped commit on main); worktree/fetch
# subcommands → no-op success.
cat > "$BIN/git" <<EOF
#!/usr/bin/env bash
args="\$*"
case "\$args" in
  *"--format=%ct"*) date +%s; exit 0 ;;
  *"--grep"*)       exit 0 ;;        # no commit on origin/main → unshipped
esac
exit 0
EOF
chmod +x "$BIN/git"

export PATH="$BIN:$PATH"
export META_EPIC=900
export SPRINT_RUNNER_LOCK_DIR="$TMP/lock"
export WORKTREE_BASE="$TMP/worktrees"
export LIVENESS_CPU_SAMPLE_GAP=0
export SCREEN_CALLS="$TMP/screen-calls.log"
export GH_CALLS="$TMP/gh-calls.log"
unset EPIC || true

STATE="$WORKTREE_BASE/.runner-state.json"
fail=0

# reset_world: fresh worktree + empty call logs; optional pre-seeded attempts.
reset_world() {
  rm -rf "$WORKTREE_BASE"
  mkdir -p "$WORKTREE_BASE/sprint-930"
  : > "$SCREEN_CALLS"
  : > "$GH_CALLS"
  if [[ -n "${1:-}" ]]; then
    printf '{"930":{"attempts":%s,"last_verdict":"HUSK","last_relaunch_epoch":0}}' "$1" > "$STATE"
  fi
}

attempts_of() { jq -r '."930".attempts // 0' "$STATE" 2>/dev/null || echo 0; }

# --- Case A: STUCK (husk) + attempts 0 + unshipped → reap + relaunch + bump ---
reset_world
CLAUDE_ALIVE=0 SHIPPED=0 "$RUNNER" >"$TMP/a.log" 2>&1 || true
if grep -q 'SCREEN_CALL .*-X -S sprint-runner-930 quit' "$SCREEN_CALLS" \
   && grep -q 'SCREEN_CALL -dmS sprint-runner-930' "$SCREEN_CALLS" \
   && [[ "$(attempts_of)" == 1 ]] \
   && ! grep -q 'add-label runner-stuck' "$GH_CALLS"; then
  echo "PASS [A]: STUCK+unshipped → reaped, relaunched, attempts persisted 0→1, no escalation"
else
  echo "FAIL [A]: expected reap+relaunch+attempts=1, no label. attempts=$(attempts_of)"
  echo "  screen:"; sed 's/^/    /' "$SCREEN_CALLS"; echo "  log:"; sed 's/^/    /' "$TMP/a.log"; fail=1
fi

# --- Case B: STUCK + attempts already at cap (3) → escalate, NO relaunch ---
reset_world 3
CLAUDE_ALIVE=0 SHIPPED=0 "$RUNNER" >"$TMP/b.log" 2>&1 || true
if grep -q 'SCREEN_CALL .*-X -S sprint-runner-930 quit' "$SCREEN_CALLS" \
   && ! grep -q 'SCREEN_CALL -dmS sprint-runner-930' "$SCREEN_CALLS" \
   && grep -q 'issue edit 930 --add-label runner-stuck' "$GH_CALLS" \
   && grep -q 'issue comment 930' "$GH_CALLS"; then
  echo "PASS [B]: STUCK at cap → reaped, escalated (label+comment), NO relaunch"
else
  echo "FAIL [B]: expected reap + runner-stuck label + comment + NO relaunch"
  echo "  screen:"; sed 's/^/    /' "$SCREEN_CALLS"; echo "  gh:"; sed 's/^/    /' "$GH_CALLS"; fail=1
fi

# --- Case C: STUCK + attempts 0 but ALREADY SHIPPED (L086) → reap, NO relaunch ---
reset_world
CLAUDE_ALIVE=0 SHIPPED=1 "$RUNNER" >"$TMP/c.log" 2>&1 || true
if grep -q 'SCREEN_CALL .*-X -S sprint-runner-930 quit' "$SCREEN_CALLS" \
   && ! grep -q 'SCREEN_CALL -dmS sprint-runner-930' "$SCREEN_CALLS" \
   && ! grep -q 'add-label runner-stuck' "$GH_CALLS" \
   && [[ "$(attempts_of)" == 0 ]]; then
  echo "PASS [C]: STUCK but shipped → reaped, NO relaunch (L086), attempts not burned"
else
  echo "FAIL [C]: expected reap + NO relaunch + no label + attempts=0. attempts=$(attempts_of)"
  echo "  screen:"; sed 's/^/    /' "$SCREEN_CALLS"; echo "  log:"; sed 's/^/    /' "$TMP/c.log"; fail=1
fi

# --- Case D: HEALTHY (claude alive+busy+recent commit) → no reap, no relaunch ---
reset_world
CLAUDE_ALIVE=1 SHIPPED=0 "$RUNNER" >"$TMP/d.log" 2>&1 || true
if grep -q 'verdict=HEALTHY' "$TMP/d.log" \
   && ! grep -q 'SCREEN_CALL .*quit' "$SCREEN_CALLS" \
   && ! grep -q 'SCREEN_CALL -dmS sprint-runner-930' "$SCREEN_CALLS" \
   && ! grep -q 'add-label runner-stuck' "$GH_CALLS"; then
  echo "PASS [D]: HEALTHY → session left running, no reap, no relaunch, no escalation"
else
  echo "FAIL [D]: expected HEALTHY left-running, got:"; sed 's/^/    /' "$TMP/d.log"; fail=1
fi

exit "$fail"
