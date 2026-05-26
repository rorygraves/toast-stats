#!/usr/bin/env bash
# Regression test for #771: the runner must NOT auto-complete an epic whose
# checklist has checkbox lines but ZERO parseable `**Sprint N** — #issue`
# sprints (malformed/ungroomed). A genuinely-complete epic (>=1 parseable
# sprint line, none unchecked) must still auto-tick.
#
# Hermetic: mocks `gh`+`screen`, runs --dry-run so nothing mutates. Asserts on
# the log decision.
#   Case A (malformed: prose checkbox, 0 sprint lines): "refusing to auto-complete"
#   Case B (complete:   - [x] **Sprint 1** — #902):     "would auto-tick"
#
# Run directly: scripts/tests/sprint-runner-malformed-epic.test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../sprint-runner.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BIN="$TMP/bin"; mkdir -p "$BIN"

# Mock gh: META_EPIC #900 → epic #901. #901's body depends on $MOCK_EPIC:
#   malformed → a prose checkbox (no Sprint-N format)
#   complete  → a checked, parseable sprint line
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
    901:body)
      if [[ "${MOCK_EPIC:-malformed}" == "complete" ]]; then
        printf '%s' '- [x] **Sprint 1** — #902'
      else
        printf '%s' '- [ ] **Build the thing** with no sprint number'
      fi ;;
  esac
  exit 0
fi
exit 0
EOF
chmod +x "$BIN/gh"

cat > "$BIN/screen" <<'EOF'
#!/usr/bin/env bash
echo "No Sockets found." >&2
exit 1
EOF
chmod +x "$BIN/screen"

export PATH="$BIN:$PATH"
export META_EPIC=900
export SPRINT_RUNNER_LOCK_DIR="$TMP/lock"
export WORKTREE_BASE="$TMP/worktrees"
unset EPIC || true

fail=0

# --- Case A: malformed epic must NOT auto-complete ---
MOCK_EPIC=malformed "$RUNNER" --dry-run >"$TMP/a.log" 2>&1 || true
if grep -q 'refusing to auto-complete' "$TMP/a.log" && ! grep -q 'would auto-tick' "$TMP/a.log"; then
  echo "PASS [A]: malformed epic refused (not auto-completed)"
else
  echo "FAIL [A]: expected refusal, got:"; sed 's/^/    /' "$TMP/a.log"; fail=1
fi

# --- Case B: genuinely-complete epic still auto-ticks ---
MOCK_EPIC=complete "$RUNNER" --dry-run >"$TMP/b.log" 2>&1 || true
if grep -q 'would auto-tick' "$TMP/b.log" && ! grep -q 'refusing to auto-complete' "$TMP/b.log"; then
  echo "PASS [B]: complete epic still auto-ticks"
else
  echo "FAIL [B]: expected auto-tick, got:"; sed 's/^/    /' "$TMP/b.log"; fail=1
fi

exit "$fail"
