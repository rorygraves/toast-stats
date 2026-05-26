#!/usr/bin/env bash
# Regression test for #694: `sprint-runner.sh --dry-run` must NOT mutate the
# META_EPIC.
#
# Background: the auto-advance/auto-tick branch in mode_run sat *before* the
# dry-run guard, so `--dry-run` called advance_meta_epic() and checked off live
# epics on roadmap #606 (it corrupted the real roadmap twice).
#
# Hermetic: mocks `gh` and `screen` on PATH, uses a temp lock dir + worktree
# base, and asserts on whether `gh issue edit` (the only mutation) is invoked.
#
#   Case A: `--dry-run`  → MUST NOT call `gh issue edit`        (the bug)
#   Case B: normal `run` → MUST     call `gh issue edit`        (advancement still works)
#
# Run directly: scripts/tests/sprint-runner-dry-run.test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../sprint-runner.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BIN="$TMP/bin"; mkdir -p "$BIN"
EDIT_LOG="$TMP/gh-edit.log"

# Mock gh: serve META_EPIC #900 with one unchecked epic (#901) whose body is a
# genuinely-complete sprint list (one ticked sprint, none unchecked) → drives
# mode_run into the auto-advance branch. (A zero-sprint body would now hit the
# #771 malformed-epic guard instead of auto-advancing.)
# Record any `gh issue edit` invocation (the mutation) to $EDIT_LOG.
cat > "$BIN/gh" <<EOF
#!/usr/bin/env bash
sub="\$1"; verb="\$2"; num="\$3"
if [[ "\$sub" == "issue" && "\$verb" == "edit" ]]; then
  echo "EDIT \$*" >> "$EDIT_LOG"
  exit 0
fi
if [[ "\$sub" == "issue" && "\$verb" == "view" ]]; then
  field=""
  args=("\$@")
  for ((i=0; i<\${#args[@]}; i++)); do
    [[ "\${args[i]}" == "--json" ]] && field="\${args[i+1]}"
  done
  case "\$num:\$field" in
    900:labels) ;;                                       # no labels → not paused
    900:body)   printf '%s' '- [ ] **Epic Test** — #901' ;;
    901:body)   printf '%s' '- [x] **Sprint 1** — #902' ;;  # complete: 1 sprint, all ticked (#771 guard needs >=1 parseable sprint to auto-advance)
    *) ;;
  esac
  exit 0
fi
exit 0
EOF
chmod +x "$BIN/gh"

# Mock screen: report no active sessions (matches list_sprint_screens' grep).
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

# --- Case A: --dry-run must not mutate ---
: > "$EDIT_LOG"
"$RUNNER" --dry-run >"$TMP/dry.log" 2>&1 || true
if [[ -s "$EDIT_LOG" ]]; then
  echo "FAIL [A]: --dry-run mutated META_EPIC (gh issue edit called):"
  sed 's/^/    /' "$EDIT_LOG"
  fail=1
else
  echo "PASS [A]: --dry-run made no gh issue edit call"
fi

# --- Case B: normal run still advances (sanity: fix didn't disable auto-tick) ---
: > "$EDIT_LOG"
"$RUNNER" >"$TMP/run.log" 2>&1 || true
if [[ -s "$EDIT_LOG" ]]; then
  echo "PASS [B]: normal run auto-ticked (gh issue edit called)"
else
  echo "FAIL [B]: normal run did NOT auto-tick — advancement broke"
  fail=1
fi

exit "$fail"
