#!/usr/bin/env bash
# Regression test for #804: the runner must auto-reap a `sprint-runner-<N>`
# screen session whose sub-issue is CLOSED, regardless of whether `#N` appears
# in the *active* epic's body. A foreign session with an OPEN sub-issue must
# be left running but logged clearly as the slot-holder (no misleading
# "not found in epic … skipping" message).
#
# Hermetic: mocks `gh`+`screen`, runs --dry-run so nothing mutates. Asserts on
# the log decision.
#   Case A (foreign + CLOSED): "auto-reaping" AND falls through to "would launch"
#   Case B (foreign + OPEN):   "Slot held by foreign session" AND does NOT launch
#
# Run directly: scripts/tests/sprint-runner-foreign-session-reap.test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../sprint-runner.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BIN="$TMP/bin"; mkdir -p "$BIN"

# Mock gh:
#   META_EPIC #900 → epic #901 (one unchecked sprint, #902).
#   Foreign session's issue #999 state comes from $MOCK_STATE (CLOSED|OPEN).
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
    901:body)   printf '%s' '- [ ] **Sprint 1** — #902' ;;
    902:labels) ;;  # no needs-product-review
    999:state)  printf '%s' "${MOCK_STATE:-CLOSED}" ;;
    999:labels) ;;
  esac
  exit 0
fi
exit 0
EOF
chmod +x "$BIN/gh"

# Mock screen:
#   `screen -ls` → emit one fake foreign session `sprint-runner-999`.
#   macOS screen -ls exits 1 even when sessions exist (lesson 089 / R14),
#   so we mirror that here to keep the runner honest about its pipefail use.
#   Any other invocation (e.g. `-X -S … quit`) → no-op success.
cat > "$BIN/screen" <<'EOF'
#!/usr/bin/env bash
if [[ "${1:-}" == "-ls" ]]; then
  echo "There is a screen on:" >&2
  echo "    12345.sprint-runner-999    (Detached)" >&2
  exit 1
fi
exit 0
EOF
chmod +x "$BIN/screen"

export PATH="$BIN:$PATH"
export META_EPIC=900
export SPRINT_RUNNER_LOCK_DIR="$TMP/lock"
export WORKTREE_BASE="$TMP/worktrees"
unset EPIC || true

fail=0

# --- Case A: foreign + CLOSED → auto-reap + proceed to launch ---
MOCK_STATE=CLOSED "$RUNNER" --dry-run >"$TMP/a.log" 2>&1 || true
if grep -q 'Foreign session sprint-runner-999.*CLOSED.*auto-reaping' "$TMP/a.log" \
   && grep -q "would launch screen session 'sprint-runner-902'" "$TMP/a.log"; then
  echo "PASS [A]: foreign+CLOSED auto-reaped and tick proceeded to launch"
else
  echo "FAIL [A]: expected auto-reap + would-launch, got:"; sed 's/^/    /' "$TMP/a.log"; fail=1
fi

# --- Case B: foreign + OPEN → slot held, no launch ---
MOCK_STATE=OPEN "$RUNNER" --dry-run >"$TMP/b.log" 2>&1 || true
if grep -q 'Slot held by foreign session sprint-runner-999' "$TMP/b.log" \
   && ! grep -q 'would launch screen session' "$TMP/b.log"; then
  echo "PASS [B]: foreign+OPEN left running, slot-held logged, no launch"
else
  echo "FAIL [B]: expected slot-held + no launch, got:"; sed 's/^/    /' "$TMP/b.log"; fail=1
fi

# --- Negative regression: the misleading old message must be gone for both cases ---
if grep -q 'not found in epic.*leaving alone, skipping' "$TMP/a.log" "$TMP/b.log"; then
  echo "FAIL [C]: pre-#804 'not found in epic … skipping' message still present"
  fail=1
else
  echo "PASS [C]: pre-#804 misleading log message replaced"
fi

exit "$fail"
