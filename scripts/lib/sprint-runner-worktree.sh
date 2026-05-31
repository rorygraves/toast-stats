#!/usr/bin/env bash
# sprint-runner-worktree.sh — per-worktree provisioning.
#
# A fresh `git worktree` is an empty environment: no node_modules, no built
# workspace `dist/`. The session's first commit then fails the pre-commit hook
# on missing built packages (toast-stats #973 / Lesson 092) — and the failed
# commit cancels the session's batched edits, forcing a redo. So the runner
# provisions each worktree right after creating it, by running a consumer-
# supplied setup script (install deps + build) BEFORE the session starts.
#
# Fail-closed: if the setup script exists and fails, a sprint must NOT launch
# into a broken environment. Absent setup script → no-op (backward compatible).
#
# The script lives in the consumer repo at $WORKTREE_SETUP (default
# scripts/red-barkeep-setup.sh, relative to the worktree). Sourcing only
# defines the function; it calls log()/RUNNER_LOG_DIR from the runner at runtime.

# provision_worktree <worktree-dir> <sprint-n>
#   0  — provisioned, or no setup script present (no-op)
#   1  — the setup script exists and failed
provision_worktree() {
  local wt="$1" n="$2"
  local setup="${WORKTREE_SETUP:-scripts/red-barkeep-setup.sh}"
  [[ -f "$wt/$setup" ]] || return 0
  local plog="${RUNNER_LOG_DIR:-/tmp}/provision-$n.log"
  mkdir -p "$(dirname "$plog")" 2>/dev/null || true
  log "Provisioning worktree sprint-$n via $setup (log: $plog)"
  if ( cd "$wt" && bash "$setup" ) >"$plog" 2>&1; then
    log "Worktree sprint-$n provisioned"
    return 0
  fi
  log "ERROR: worktree provisioning failed for sprint-$n — last lines:"
  tail -n 5 "$plog" 2>/dev/null | while IFS= read -r line; do log "  | $line"; done
  return 1
}
