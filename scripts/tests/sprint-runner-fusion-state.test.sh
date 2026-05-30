#!/usr/bin/env bash
# Unit tests for the liveness FUSION verdict + attempt-tracking STATE store
# (epic #933 Sprint 3, #930).
#
# Both layers are exercised as pure-ish functions:
#   - fuse_verdict <commit> <process> <log>  → HEALTHY|SUSPECT|STUCK|HUSK (pure)
#   - state store over a JSON file ($RUNNER_STATE_FILE), jq-backed, atomic write,
#     fail-safe to "0 attempts / no entry" on missing/corrupt input.
#
# Hermetic: sources the lib directly, asserts on stdout / file contents. The
# state file is a per-test tempdir, so no real runner state is touched.
#
# Run directly: scripts/tests/sprint-runner-fusion-state.test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB="$SCRIPT_DIR/../lib/sprint-runner-liveness.sh"

# shellcheck source=../lib/sprint-runner-liveness.sh
source "$LIB"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
export RUNNER_STATE_FILE="$TMP/.runner-state.json"

fail=0
assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "PASS: $label"
  else
    echo "FAIL: $label — expected '$expected', got '$actual'"
    fail=1
  fi
}

# ===========================================================================
# fuse_verdict <commit> <process> <log>
# commit/log ∈ {OK,STALL,UNKNOWN}; process ∈ {OK,STALL,UNKNOWN,HUSK}
# ===========================================================================

# --- HUSK precedence: conclusive single signal wins over everything ---
assert_eq "fuse: process HUSK alone → HUSK" "HUSK" \
  "$(fuse_verdict UNKNOWN HUSK UNKNOWN)"
assert_eq "fuse: HUSK even with healthy commit+log → HUSK" "HUSK" \
  "$(fuse_verdict OK HUSK OK)"
assert_eq "fuse: HUSK even with other STALLs → HUSK" "HUSK" \
  "$(fuse_verdict STALL HUSK STALL)"

# --- Corroboration: >=2 STALL → STUCK ---
assert_eq "fuse: commit+process STALL → STUCK" "STUCK" \
  "$(fuse_verdict STALL STALL OK)"
assert_eq "fuse: commit+log STALL (the #871 shape) → STUCK" "STUCK" \
  "$(fuse_verdict STALL OK STALL)"
assert_eq "fuse: process+log STALL → STUCK" "STUCK" \
  "$(fuse_verdict OK STALL STALL)"
assert_eq "fuse: all three STALL → STUCK" "STUCK" \
  "$(fuse_verdict STALL STALL STALL)"
assert_eq "fuse: 2 STALL + 1 UNKNOWN → STUCK" "STUCK" \
  "$(fuse_verdict STALL UNKNOWN STALL)"

# --- One soft signal → SUSPECT (never reaps; the false-positive guard) ---
assert_eq "fuse: commit STALL alone → SUSPECT" "SUSPECT" \
  "$(fuse_verdict STALL OK OK)"
assert_eq "fuse: process STALL alone → SUSPECT" "SUSPECT" \
  "$(fuse_verdict OK STALL OK)"
assert_eq "fuse: log STALL alone → SUSPECT" "SUSPECT" \
  "$(fuse_verdict OK OK STALL)"
assert_eq "fuse: 1 STALL + 2 UNKNOWN → SUSPECT" "SUSPECT" \
  "$(fuse_verdict UNKNOWN STALL UNKNOWN)"

# --- Healthy / insufficient evidence ---
assert_eq "fuse: all OK → HEALTHY" "HEALTHY" \
  "$(fuse_verdict OK OK OK)"
assert_eq "fuse: all UNKNOWN → HEALTHY" "HEALTHY" \
  "$(fuse_verdict UNKNOWN UNKNOWN UNKNOWN)"
assert_eq "fuse: OK + UNKNOWN mix, no STALL → HEALTHY" "HEALTHY" \
  "$(fuse_verdict OK UNKNOWN OK)"

# ===========================================================================
# State store
# ===========================================================================

# --- Missing file → 0 attempts, fail-safe ---
assert_eq "state: missing file → 0 attempts" "0" \
  "$(state_get_attempts 930)"

# --- Record then read back ---
state_record 930 STUCK 1 1717000000
assert_eq "state: record attempts=1 → read back 1" "1" \
  "$(state_get_attempts 930)"
assert_eq "state: record stores last_verdict" "STUCK" \
  "$(state_get_field 930 last_verdict)"
assert_eq "state: record stores last_relaunch_epoch" "1717000000" \
  "$(state_get_field 930 last_relaunch_epoch)"

# --- Upsert: a second record overwrites the same key ---
state_record 930 HUSK 2 1717000999
assert_eq "state: upsert attempts → 2" "2" \
  "$(state_get_attempts 930)"
assert_eq "state: upsert last_verdict → HUSK" "HUSK" \
  "$(state_get_field 930 last_verdict)"

# --- A second issue coexists (per-issue keying) ---
state_record 931 SUSPECT 0 0
assert_eq "state: issue 931 coexists, attempts 0" "0" \
  "$(state_get_attempts 931)"
assert_eq "state: issue 930 untouched by 931 write" "2" \
  "$(state_get_attempts 930)"

# --- Unknown issue → 0 attempts, empty field ---
assert_eq "state: unknown issue → 0 attempts" "0" \
  "$(state_get_attempts 999)"
assert_eq "state: unknown field on known issue → empty" "" \
  "$(state_get_field 930 nope)"

# --- Atomic write leaves valid JSON (no tmp residue) ---
assert_eq "state: file is valid JSON after writes" "ok" \
  "$(jq -e . "$RUNNER_STATE_FILE" >/dev/null 2>&1 && echo ok || echo bad)"
assert_eq "state: no leftover tmp files beside state" "0" \
  "$(find "$TMP" -maxdepth 1 -name '.runner-state.json.*' | wc -l | tr -d ' ')"

# --- Prune to live keys: drops a CLOSED/absent issue, keeps the listed ones ---
state_prune 930          # keep only 930; 931 was a stale entry
assert_eq "state: prune kept 930" "2" \
  "$(state_get_attempts 930)"
assert_eq "state: prune dropped 931" "0" \
  "$(state_get_attempts 931)"

# --- Prune with no live keys empties the store to {} ---
state_prune
assert_eq "state: prune to nothing → 930 gone" "0" \
  "$(state_get_attempts 930)"
assert_eq "state: empty store is still valid JSON" "ok" \
  "$(jq -e . "$RUNNER_STATE_FILE" >/dev/null 2>&1 && echo ok || echo bad)"

# --- Corrupt JSON → fail-safe to 0, never aborts under set -u ---
printf '{ this is not json' > "$RUNNER_STATE_FILE"
assert_eq "state: corrupt file → 0 attempts (fail-safe)" "0" \
  "$(state_get_attempts 930)"
# ...and a record over a corrupt file repairs it to valid JSON.
state_record 930 STUCK 1 1717001000
assert_eq "state: record over corrupt repairs to valid JSON" "1" \
  "$(state_get_attempts 930)"

exit "$fail"
