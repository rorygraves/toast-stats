#!/usr/bin/env bash
# Regression test for #767: the runner must NOT launch a sprint whose target
# issue carries the `needs-product-review` label — it skips and notifies so the
# operator decides. A normal target still launches.
#
# Hermetic: mocks `gh` and `screen` on PATH, runs in --dry-run so no worktree or
# screen session is ever created, and asserts on the launch decision in the log.
#   Case A: target HAS needs-product-review → "NOT launching", no "would launch"
#   Case B: target WITHOUT the label        → "would launch"
#
# Run directly: scripts/tests/sprint-runner-review-gate.test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../sprint-runner.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BIN="$TMP/bin"; mkdir -p "$BIN"

# Mock gh: META_EPIC #900 → epic #901 → one unchecked Sprint 1 (#902).
# #902's labels depend on $MOCK_REVIEW so one mock serves both cases.
cat > "$BIN/gh" <<'EOF'
#!/usr/bin/env bash
sub="$1"; verb="$2"; num="$3"
[[ "$sub" == "issue" && "$verb" == "edit" ]] && exit 0
if [[ "$sub" == "issue" && "$verb" == "view" ]]; then
  field=""; args=("$@")
  for ((i=0; i<${#args[@]}; i++)); do [[ "${args[i]}" == "--json" ]] && field="${args[i+1]}"; done
  case "$num:$field" in
    900:labels) ;;                                  # meta not paused
    900:body)   printf '%s' '- [ ] **Epic Test** — #901' ;;
    901:body)   printf '%s' '- [ ] **Sprint 1** — #902' ;;
    902:labels) [[ "${MOCK_REVIEW:-0}" == "1" ]] && printf '%s\n' 'needs-product-review' ;;
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

# --- Case A: needs-product-review target must be skipped ---
MOCK_REVIEW=1 "$RUNNER" --dry-run >"$TMP/a.log" 2>&1 || true
if grep -q 'needs-product-review — NOT launching' "$TMP/a.log" && ! grep -q 'would launch' "$TMP/a.log"; then
  echo "PASS [A]: needs-product-review target was skipped, not launched"
else
  echo "FAIL [A]: expected skip, got:"; sed 's/^/    /' "$TMP/a.log"; fail=1
fi

# --- Case B: normal target still launches ---
MOCK_REVIEW=0 "$RUNNER" --dry-run >"$TMP/b.log" 2>&1 || true
if grep -q 'would launch' "$TMP/b.log" && ! grep -q 'NOT launching' "$TMP/b.log"; then
  echo "PASS [B]: normal target reached the launch decision"
else
  echo "FAIL [B]: expected launch, got:"; sed 's/^/    /' "$TMP/b.log"; fail=1
fi

exit "$fail"
