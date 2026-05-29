#!/usr/bin/env bash
# scripts/sprint-runner.sh — autonomous sprint runner (#575, #603, #604, #605).
#
# Three-level hierarchy:
#   META_EPIC (roadmap of epics)  →  EPIC (sprint checklist)  →  Sprint sub-issue
#
# On each tick the runner:
#   1. Resolves the active EPIC from the META_EPIC's checklist (or honors a
#      pinned EPIC env var override).
#   2. Reads the active epic's sprint checklist, finds the first unchecked
#      Sprint N, and — if Sprint N-1's sub-issue is CLOSED — launches a
#      fresh `claude --remote-control` session inside detached `screen` to
#      execute /sprint for that sprint.
#   3. If the active epic has no unchecked sprints, the runner auto-ticks
#      that epic's line in the META_EPIC and notifies. The next tick picks
#      the next epic. Auto-tick only fires when EPIC was resolved from
#      META_EPIC (not when pinned via env).
#
# The CLOSED gate is the handshake between sessions: it means
# "the previous session self-verified on ts.taverns.red and closed its
# sub-issue" (per sprint-bootstrap.prompt step 5). Operator reopens if
# a close was premature. When STRICT_GATE=1, the gate additionally
# requires the predecessor issue to carry a `sprint-verified` label.
#
# Pause autonomy: apply `runner-paused` label to the META_EPIC. Remove to resume.
#
# Usage:
#   scripts/sprint-runner.sh             # normal run
#   scripts/sprint-runner.sh --dry-run   # report what it would launch, no side effects
#   scripts/sprint-runner.sh --status    # read-only state report (no lock)
#   scripts/sprint-runner.sh --reap      # kill stuck sprint-runner screen sessions
#
# Environment:
#   META_EPIC=<n>         GitHub issue # of the meta-epic (roadmap of epics).
#   EPIC=<n>              Pin a specific epic; bypasses META_EPIC resolution
#                         AND auto-advance. Use for testing or temporary overrides.
#                         At least one of META_EPIC or EPIC must be set.
#   STRICT_GATE=0|1       Require `sprint-verified` label on predecessor (default 0)
#   SPRINT_RUNNER_LOG     Path to append-log; used for size-based rotation
#   SPRINT_RUNNER_LOCK_DIR  Override the mkdir-lock path (default
#                         /tmp/toast-stats-sprint.lock). Used by the regression
#                         test so it can't collide with a live tick.
#   WORKTREE_BASE         Parent dir for per-sprint git worktrees
#                         (default: ~/sprint-worktrees). Each sprint gets
#                         <WORKTREE_BASE>/sprint-<N>. Isolates the spawned
#                         session's file edits, branches, and index from the
#                         operator's primary checkout. See #625.
#
# Scheduling: this script is invoked by a launchd LaunchAgent — NOT crontab —
# every 5 minutes (StartInterval 300). Plist lives at:
#   ~/Library/LaunchAgents/red.taverns.toast-stats.sprint-runner.plist
# Environment overrides (EPIC, STRICT_GATE, etc.) are set in that plist's
# <key>EnvironmentVariables</key> dict. To apply changes:
#   launchctl bootout gui/$(id -u)/red.taverns.toast-stats.sprint-runner
#   launchctl bootstrap gui/$(id -u) <plist>
#   launchctl print gui/$(id -u)/red.taverns.toast-stats.sprint-runner  # verify run interval

set -euo pipefail

# === Configuration ===
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
META_EPIC="${META_EPIC:-}"
EPIC="${EPIC:-}"
STRICT_GATE="${STRICT_GATE:-0}"
LOCK_DIR="${SPRINT_RUNNER_LOCK_DIR:-/tmp/toast-stats-sprint.lock}"
BOOTSTRAP_PROMPT="$REPO_DIR/scripts/sprint-bootstrap.prompt"
LOG_FILE="${SPRINT_RUNNER_LOG:-$HOME/.toast-stats-sprint-runner.log}"
LOG_ROTATE_BYTES=$((1024 * 1024))
WORKTREE_BASE="${WORKTREE_BASE:-$HOME/sprint-worktrees}"

# Populated by resolve_active_epic(); used by callers to decide whether
# auto-tick fires and to print the source in --status.
EPIC_SOURCE=""
META_PAUSED=0

# Append (not prepend) the standard dirs so launchd's minimal PATH can still
# find gh/screen/git, while leaving any caller-supplied PATH entries ahead of
# them. Prepending would shadow a test's mock bin dir and block operator
# overrides; appending keeps the fallback without clobbering. (#694)
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

# === Mode parsing ===
MODE=run
case "${1:-}" in
  --dry-run) MODE=dry-run ;;
  --status)  MODE=status ;;
  --reap)    MODE=reap ;;
  --gc)      MODE=gc ;;
  "") ;;
  *) echo "Unknown arg: $1" >&2
     echo "Usage: $0 [--dry-run|--status|--reap|--gc]" >&2
     exit 2 ;;
esac

# === Logging / notification ===
log() { printf '[%s] %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*"; }
die() { log "ERROR: $*"; exit 1; }

notify() {
  command -v osascript >/dev/null 2>&1 || return 0
  local title="$1" message="$2"
  osascript -e "display notification \"${message//\"/\\\"}\" with title \"${title//\"/\\\"}\"" 2>/dev/null || true
}

rotate_log_if_large() {
  [[ -n "$LOG_FILE" && -f "$LOG_FILE" ]] || return 0
  local size
  size=$(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)
  if (( size > LOG_ROTATE_BYTES )); then
    mv "$LOG_FILE" "$LOG_FILE.1" 2>/dev/null || true
    : > "$LOG_FILE" 2>/dev/null || true
  fi
}

# === Lock helpers (signal-safe, with stale-lock recovery) ===
cleanup() {
  rm -rf "$LOCK_DIR" 2>/dev/null
  [[ -n "${PROMPT_FILE:-}" ]] && rm -f "$PROMPT_FILE" 2>/dev/null
  return 0
}

acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "$$" > "$LOCK_DIR/pid"
    trap cleanup EXIT INT TERM HUP
    return 0
  fi
  # Lock exists — is the holder still alive?
  local pid
  pid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo "")
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    log "Lock $LOCK_DIR held by live pid $pid; skipping tick."
    return 1
  fi
  log "Stale lock at $LOCK_DIR (pid '${pid:-empty}' not alive) — reaping."
  rm -rf "$LOCK_DIR"
  mkdir "$LOCK_DIR" || die "Failed to acquire lock after reaping stale dir"
  echo "$$" > "$LOCK_DIR/pid"
  trap cleanup EXIT INT TERM HUP
  return 0
}

# === Epic / sprint parsing helpers ===
read_epic_body() {
  gh issue view "$EPIC" --json body --jq .body 2>/dev/null
}

# Match the markdown format `**Sprint N**` (with `**` immediately after the
# number) so `Sprint 1` doesn't accidentally match `Sprint 10`/`Sprint 11`.
find_sprint_issue() {
  local n="$1" body="$2"
  printf '%s\n' "$body" \
    | grep -oE "Sprint ${n}\*\*[^[:cntrl:]]{0,80}#[0-9]+" \
    | head -1 \
    | grep -oE '#[0-9]+' | head -1 | tr -d '#' || true
}

find_first_unchecked_sprint() {
  local body="$1" line
  line=$(printf '%s\n' "$body" | grep -m1 -E '^- \[ \] \*\*Sprint [0-9]+\*\* — #[0-9]+' || true)
  [[ -z "$line" ]] && return 0
  local n issue
  n=$(printf '%s\n' "$line" | sed -nE 's/.*Sprint ([0-9]+)\*\*.*/\1/p')
  issue=$(printf '%s\n' "$line" | sed -nE 's/.*Sprint [0-9]+\*\* — #([0-9]+).*/\1/p')
  printf '%s %s\n' "$n" "$issue"
}

# Count epic-body lines matching the runner's sprint format, ANY checkbox state.
# Lets mode_run tell a genuinely-complete epic (>=1 such line, none unchecked)
# from a malformed/ungroomed one (0 such lines) so it won't silently
# auto-complete an epic whose checklist the runner can't parse (#771).
count_sprint_lines() {
  printf '%s\n' "$1" | grep -cE '^- \[.\] \*\*Sprint [0-9]+\*\* — #[0-9]+' || true
}

# Find a sprint line in the epic body by its issue number (#630).
# Echoes the full line (incl. checkbox state) or empty if no match.
# Boundary (`#N([^0-9]|$)`) so #1 doesn't match #10/#100.
# Trailing `|| true` is critical (#637): grep returns 1 on no-match, and
# `local var=$(find_sprint_line_by_issue ...)` under set -e would silently
# exit the script. This is the same hazard the other find_* helpers
# already guard against.
find_sprint_line_by_issue() {
  local issue="$1" body="$2"
  printf '%s\n' "$body" | grep -E "^- \[.\] \*\*Sprint [0-9]+\*\* — #${issue}([^0-9]|\$)" | head -1 || true
}

# === META_EPIC helpers ===
# Format: `- [ ] **Epic <anything>** — #N`
find_first_unchecked_epic() {
  local body="$1" line
  line=$(printf '%s\n' "$body" | grep -m1 -E '^- \[ \] \*\*Epic[^*]*\*\* — #[0-9]+' || true)
  [[ -z "$line" ]] && return 0
  printf '%s\n' "$line" | grep -oE '#[0-9]+' | head -1 | tr -d '#'
}

# Resolve which epic the runner should work on this tick.
# Sets globals: EPIC, EPIC_SOURCE, META_PAUSED.
# Returns 0 if EPIC is set and runnable; 1 with explanation in EPIC_SOURCE otherwise.
resolve_active_epic() {
  EPIC_SOURCE=""
  META_PAUSED=0

  if [[ -n "$EPIC" ]]; then
    EPIC_SOURCE="pinned via EPIC env"
    return 0
  fi

  if [[ -z "$META_EPIC" ]]; then
    EPIC_SOURCE="ERROR: neither EPIC nor META_EPIC env set"
    return 1
  fi

  local labels
  labels=$(gh issue view "$META_EPIC" --json labels --jq '.labels[].name' 2>/dev/null || true)
  if printf '%s\n' "$labels" | grep -qx 'runner-paused'; then
    META_PAUSED=1
    EPIC_SOURCE="META_EPIC #$META_EPIC has runner-paused label"
    return 1
  fi

  local meta_body
  meta_body=$(gh issue view "$META_EPIC" --json body --jq .body 2>/dev/null) || {
    EPIC_SOURCE="ERROR: gh issue view #$META_EPIC failed"
    return 1
  }

  local found
  found=$(find_first_unchecked_epic "$meta_body")
  if [[ -z "$found" ]]; then
    EPIC_SOURCE="META_EPIC #$META_EPIC has no unchecked epic line — roadmap complete (or empty)"
    return 1
  fi

  EPIC="$found"
  EPIC_SOURCE="resolved via META_EPIC #$META_EPIC"
  return 0
}

# Tick the active epic's line in the META_EPIC body. Idempotent: if the line
# is already ticked or missing, returns non-zero without making a write.
# Uses a non-digit boundary (`#N([^0-9]|$)`) so #1 doesn't match #10/#100.
advance_meta_epic() {
  local epic="$1"
  [[ -n "$META_EPIC" ]] || { log "advance_meta_epic: META_EPIC unset"; return 1; }
  log "Auto-ticking Epic #$epic in META_EPIC #$META_EPIC"

  local body
  body=$(gh issue view "$META_EPIC" --json body --jq .body 2>/dev/null) || {
    log "ERROR: failed to fetch META_EPIC body"
    return 1
  }

  local new_body
  new_body=$(printf '%s' "$body" | sed -E '/^- \[ \] \*\*Epic[^*]*\*\* — #'"${epic}"'([^0-9]|$)/ s/^- \[ \]/- [x]/')

  if [[ "$body" == "$new_body" ]]; then
    log "WARNING: META_EPIC body unchanged — no matching unticked epic line for #$epic"
    return 1
  fi

  local tmp
  tmp=$(mktemp -t meta-epic-body.XXXXXX)
  printf '%s' "$new_body" > "$tmp"
  if gh issue edit "$META_EPIC" --body-file "$tmp" >/dev/null 2>&1; then
    log "Auto-ticked Epic #$epic in META_EPIC #$META_EPIC"
    notify "sprint-runner" "Advanced past Epic #$epic"
    rm -f "$tmp"
    return 0
  fi
  log "ERROR: gh issue edit #$META_EPIC failed"
  rm -f "$tmp"
  return 1
}

# === Screen session helpers ===
list_sprint_screens() {
  # macOS `screen -ls` writes to stderr → 2>&1.
  screen -ls 2>&1 | grep -oE 'sprint-runner-[0-9]+' || true
}

reap_screen_session() {
  local session="$1"
  local n="${session##sprint-runner-}"
  log "Reaping screen session $session"
  screen -X -S "$session" quit 2>/dev/null || true
  sleep 1
  local pids
  pids=$(pgrep -f "claude --remote-control sprint-$n" || true)
  if [[ -n "$pids" ]]; then
    log "Killing orphan claude pids: $pids"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 2
    local still
    still=$(pgrep -f "claude --remote-control sprint-$n" || true)
    if [[ -n "$still" ]]; then
      log "Force-killing surviving pids: $still"
      # shellcheck disable=SC2086
      kill -9 $still 2>/dev/null || true
    fi
  fi
  # Also remove the worktree (idempotent — no-op if it doesn't exist).
  remove_sprint_worktree "$n"
  notify "sprint-runner" "Reaped session $session"
}

# === Worktree helpers (#625) ===
# Each spawned sprint session runs inside its own git worktree at
# $WORKTREE_BASE/sprint-<N>. This isolates the session's file edits, branches,
# and index from the operator's primary checkout. The worktree's branch is
# whatever the spawned claude checks out — we don't enforce a naming pattern.
#
# Reconciliation is convergent: any worktree under $WORKTREE_BASE without a
# paired screen session is an orphan and gets GC'd. Source of truth is the
# filesystem + `screen -ls`; no bookkeeping files to corrupt.

create_sprint_worktree() {
  # Creates $WORKTREE_BASE/sprint-<N> off of main. Returns 0 + echoes path on
  # success; returns non-zero on failure. Idempotent: if a worktree at the
  # target path already exists (orphan from previous run), removes it first.
  local n="$1"
  local wt="$WORKTREE_BASE/sprint-$n"
  mkdir -p "$WORKTREE_BASE"
  if [[ -e "$wt" ]]; then
    log "Worktree $wt already exists — removing before re-create"
    git -C "$REPO_DIR" worktree remove --force "$wt" 2>/dev/null \
      || rm -rf "$wt"
  fi
  # Always check that git's metadata isn't holding a stale ref to this path.
  git -C "$REPO_DIR" worktree prune 2>/dev/null || true
  # --detach: start at main's HEAD without claiming the main branch (which is
  # checked out in the operator's primary checkout). Spawned claude will
  # `git checkout -b feat/...` for its actual work.
  # Suppress BOTH stdout and stderr (#631): git writes status to stdout
  # ("Preparing worktree...", "HEAD is now at..."); without redirecting it,
  # the caller's `$(create_sprint_worktree ...)` capture conflates the chatter
  # with the path and the resulting multi-line value poisons downstream `cd`.
  if ! git -C "$REPO_DIR" worktree add --detach "$wt" main >/dev/null 2>&1; then
    log "ERROR: failed to create worktree at $wt"
    return 1
  fi
  printf '%s\n' "$wt"
}

remove_sprint_worktree() {
  local n="$1"
  local wt="$WORKTREE_BASE/sprint-$n"
  [[ -e "$wt" ]] || return 0
  log "Removing worktree $wt"
  # --force handles dirty trees; rm -rf is last-resort for filesystem corner cases.
  git -C "$REPO_DIR" worktree remove --force "$wt" 2>/dev/null \
    || rm -rf "$wt"
  git -C "$REPO_DIR" worktree prune 2>/dev/null || true
}

# Returns a newline-separated list of orphan worktree paths
# (worktrees under $WORKTREE_BASE with no matching screen daemon process).
#
# Detection uses `pgrep -f "SCREEN -dmS ..."` rather than `screen -ls | grep`
# because (#634) macOS `screen -ls` exits 1 even when sessions exist; combined
# with the script's `set -o pipefail`, the pipeline always returns 1 and
# `! pipeline` is always true — producing false-orphans for every live
# session. The process table doesn't have this exit-code interaction.
find_orphan_worktrees() {
  [[ -d "$WORKTREE_BASE" ]] || return 0
  local wt n
  for wt in "$WORKTREE_BASE"/sprint-*; do
    [[ -d "$wt" ]] || continue
    n="${wt##*/sprint-}"
    if ! pgrep -f "SCREEN -dmS sprint-runner-$n" >/dev/null 2>&1; then
      printf '%s\n' "$wt"
    fi
  done
}

gc_worktrees() {
  # Reconcile worktrees with screen sessions. Removes any worktree under
  # $WORKTREE_BASE without a paired screen-runner-N session. Best-effort
  # branch cleanup (only deletes branches `git branch -d` accepts — i.e.,
  # merged into main). Idempotent. Safe to call every tick.
  [[ -d "$WORKTREE_BASE" ]] || return 0
  git -C "$REPO_DIR" worktree prune 2>/dev/null || true

  local orphans
  orphans=$(find_orphan_worktrees)
  [[ -z "$orphans" ]] && return 0

  local wt n branch
  while IFS= read -r wt; do
    n="${wt##*/sprint-}"
    # Capture the branch the worktree was on, so we can attempt to delete it.
    branch=$(git -C "$wt" branch --show-current 2>/dev/null || true)
    log "GC: orphan worktree $wt (no sprint-runner-$n screen) — removing"
    git -C "$REPO_DIR" worktree remove --force "$wt" 2>/dev/null \
      || rm -rf "$wt"
    # Best-effort branch cleanup. `git branch -d` refuses unmerged branches,
    # which is what we want — operator can inspect crashed-session branches.
    if [[ -n "$branch" && "$branch" != "main" ]]; then
      git -C "$REPO_DIR" branch -d "$branch" 2>/dev/null \
        && log "GC: deleted merged branch $branch" \
        || log "GC: branch $branch left alone (unmerged or already gone)"
    fi
  done <<< "$orphans"
  git -C "$REPO_DIR" worktree prune 2>/dev/null || true
}

# True (0) if the issue carries the `needs-product-review` label — the runner
# must not launch such a sprint autonomously (#767); the session can't make a
# product call. Fail-open: a gh error yields "not flagged" and lets the normal
# predecessor gate (which also queries gh) skip the tick instead.
issue_needs_review() {
  local issue="$1"
  gh issue view "$issue" --json labels --jq '.labels[].name' 2>/dev/null \
    | grep -qx 'needs-product-review'
}

# === Gate check ===
# Echoes "PASS <desc>" or "FAIL <desc>". Non-fatal — caller decides.
check_gate() {
  local prev_issue="$1"
  if [[ -z "$prev_issue" ]]; then
    printf 'PASS n/a (cold start)\n'
    return 0
  fi
  local state
  state=$(gh issue view "$prev_issue" --json state --jq .state 2>/dev/null) || {
    printf 'FAIL gh view #%s failed\n' "$prev_issue"
    return 0
  }
  if [[ "$state" != "CLOSED" ]]; then
    printf 'FAIL Sprint prev (#%s) is %s\n' "$prev_issue" "$state"
    return 0
  fi
  if [[ "$STRICT_GATE" == "1" ]]; then
    local labels
    labels=$(gh issue view "$prev_issue" --json labels --jq '.labels[].name' 2>/dev/null || true)
    if ! printf '%s\n' "$labels" | grep -qx 'sprint-verified'; then
      printf 'FAIL Sprint prev (#%s) CLOSED but missing sprint-verified label\n' "$prev_issue"
      return 0
    fi
    printf 'PASS Sprint prev (#%s) CLOSED + sprint-verified\n' "$prev_issue"
    return 0
  fi
  printf 'PASS Sprint prev (#%s) CLOSED\n' "$prev_issue"
}

# === Modes ===

mode_status() {
  log "MODE: status (read-only, no lock)"
  log "Repo: $REPO_DIR"
  log "META_EPIC: ${META_EPIC:-(unset)}   EPIC env: ${EPIC:-(unset)}   Strict gate: $STRICT_GATE"

  if [[ -d "$LOCK_DIR" ]]; then
    local lpid
    lpid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo "")
    if [[ -n "$lpid" ]] && kill -0 "$lpid" 2>/dev/null; then
      log "Lock: held by live pid $lpid"
    else
      log "Lock: STALE (pid '${lpid:-empty}' not alive) — next run will reap"
    fi
  else
    log "Lock: free"
  fi

  local sessions
  sessions=$(list_sprint_screens | sort -u)
  if [[ -z "$sessions" ]]; then
    log "Active screen sessions: (none)"
  else
    log "Active screen sessions:"
    printf '%s\n' "$sessions" | while read -r s; do log "  - $s"; done
  fi

  # Worktree state (read-only — never removes during --status).
  if [[ -d "$WORKTREE_BASE" ]]; then
    local wt_count=0
    local wt
    for wt in "$WORKTREE_BASE"/sprint-*; do
      [[ -d "$wt" ]] && wt_count=$((wt_count + 1))
    done
    if (( wt_count == 0 )); then
      log "Worktrees: (none under $WORKTREE_BASE)"
    else
      log "Worktrees under $WORKTREE_BASE:"
      local orphans
      orphans=$(find_orphan_worktrees)
      for wt in "$WORKTREE_BASE"/sprint-*; do
        [[ -d "$wt" ]] || continue
        local n="${wt##*/sprint-}"
        if printf '%s\n' "$orphans" | grep -qx "$wt"; then
          log "  - $wt  [ORPHAN — no sprint-runner-$n screen; next run will GC]"
        else
          log "  - $wt  [active — paired with sprint-runner-$n]"
        fi
      done
    fi
  else
    log "Worktrees: $WORKTREE_BASE does not exist yet (no sessions launched)"
  fi

  if ! resolve_active_epic; then
    log "Active epic: (none) — $EPIC_SOURCE"
    return 0
  fi
  log "Active epic: #$EPIC ($EPIC_SOURCE)"

  local body
  body=$(read_epic_body) || { log "Failed to read epic body"; return 1; }

  local pair
  pair=$(find_first_unchecked_sprint "$body")
  if [[ -z "$pair" ]]; then
    log "Target: (none — epic #$EPIC complete; next run will auto-advance if META_EPIC-resolved)"
    return 0
  fi
  local n issue
  read -r n issue <<<"$pair"
  log "Target: Sprint $n (#$issue)"

  local prev_n=$((n - 1))
  local prev_issue
  prev_issue=$(find_sprint_issue "$prev_n" "$body")
  log "Predecessor: Sprint $prev_n (#${prev_issue:-none})"

  local verdict
  verdict=$(check_gate "$prev_issue")
  log "Gate: $verdict"
}

mode_reap() {
  log "MODE: reap"
  local sessions
  sessions=$(list_sprint_screens | sort -u)
  if [[ -z "$sessions" ]]; then
    log "No sprint-runner screen sessions to reap."
    local orphans
    orphans=$(pgrep -f "claude --remote-control sprint-" || true)
    if [[ -n "$orphans" ]]; then
      log "Orphan claude pids (no screen): $orphans — killing."
      # shellcheck disable=SC2086
      kill $orphans 2>/dev/null || true
    fi
  else
    printf '%s\n' "$sessions" | while read -r s; do reap_screen_session "$s"; done
  fi
  # Also reap a stale lock if present.
  if [[ -d "$LOCK_DIR" ]]; then
    local lpid
    lpid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo "")
    if [[ -z "$lpid" ]] || ! kill -0 "$lpid" 2>/dev/null; then
      log "Reaping stale lock (pid '${lpid:-empty}')."
      rm -rf "$LOCK_DIR"
    fi
  fi
  # And any orphan worktrees.
  gc_worktrees
}

mode_gc() {
  log "MODE: gc"
  log "Worktree base: $WORKTREE_BASE"
  gc_worktrees
  log "GC complete."
}

mode_run() {
  rotate_log_if_large
  acquire_lock || exit 0
  cd "$REPO_DIR"

  # Reconcile worktrees first — any orphan from a previous tick gets cleaned
  # up before we potentially launch a new sprint. Cheap idempotent op.
  gc_worktrees

  # Cascade (#627): after an epic auto-ticks complete, re-resolve and try to
  # launch the next epic's first sprint in the same tick. Capped to prevent
  # runaway loops on a malformed META_EPIC.
  local max_cascades=8
  local cascade=0
  while (( cascade < max_cascades )); do
    cascade=$((cascade + 1))

    # Reset epic resolution between iterations so resolve_active_epic re-reads
    # META_EPIC. Only reset for META-resolved sources — a pinned EPIC env
    # never cascades (it bails on the no-auto-advance branch).
    if [[ "$EPIC_SOURCE" == "resolved via"* ]]; then
      EPIC=""
    fi
    EPIC_SOURCE=""
    META_PAUSED=0

  if ! resolve_active_epic; then
    if (( META_PAUSED == 1 )); then
      log "Paused: $EPIC_SOURCE — skipping tick."
      exit 0
    fi
    if [[ "$EPIC_SOURCE" == *"roadmap complete"* ]]; then
      log "$EPIC_SOURCE"
      exit 0
    fi
    die "$EPIC_SOURCE"
  fi
  log "Active epic: #$EPIC ($EPIC_SOURCE)"

  local body
  body=$(read_epic_body) || die "gh issue view #$EPIC failed"

  # --- Detect existing sprint-runner screen session; reap if stale ---
  # Screen names are sprint-runner-<target_issue> (#630), so the suffix is
  # the work item's issue number directly — no sprint-N parsing needed here.
  local active
  active=$(list_sprint_screens | head -1 || true)
  if [[ -n "$active" ]]; then
    local active_issue="${active##sprint-runner-}"
    local active_line
    active_line=$(find_sprint_line_by_issue "$active_issue" "$body")
    if [[ -n "$active_line" ]]; then
      local active_state
      active_state=$(gh issue view "$active_issue" --json state --jq .state 2>/dev/null || echo UNKNOWN)
      if [[ "$active_state" == "CLOSED" ]]; then
        # Stale only if the epic checkbox is ALSO ticked (#626).
        if [[ "$active_line" =~ ^-\ \[x\] ]]; then
          log "Stale session $active: #$active_issue is CLOSED + ticked — reaping."
          reap_screen_session "$active"
        else
          log "Session $active: #$active_issue is CLOSED but epic checkbox not yet ticked — letting session finish cleanup. Operator can --reap if genuinely stuck."
          exit 0
        fi
      else
        log "Existing session $active active (#$active_issue is $active_state) — skipping launch."
        exit 0
      fi
    else
      # Foreign session — sub-issue not in the *active* epic's body. Common
      # case: mid-epic reprioritization moved a different epic to the top of
      # META_EPIC while this session was still in flight (#804). CLOSED is an
      # epic-independent done-signal: reap and free the slot. OPEN means the
      # session is genuinely in-flight on its (now non-active) epic — leave
      # it, but log + notify clearly as the slot-holder so operators don't
      # misread the prior "not found … skipping" message and reach for --reap
      # on a live session.
      local active_state
      active_state=$(gh issue view "$active_issue" --json state --jq .state 2>/dev/null || echo UNKNOWN)
      if [[ "$active_state" == "CLOSED" ]]; then
        log "Foreign session $active: #$active_issue is CLOSED (work shipped) — auto-reaping to free slot."
        notify "sprint-runner" "Auto-reaped done foreign session $active"
        reap_screen_session "$active"
        # Fall through: continue this tick and launch the active epic's
        # next sprint (the cascade loop will re-resolve + re-evaluate).
      else
        log "Slot held by foreign session $active: #$active_issue belongs to a different epic and is $active_state — leaving alone. Operator can --reap to override."
        notify "sprint-runner" "Slot held by foreign session $active (#$active_issue, $active_state)"
        exit 0
      fi
    fi
  fi

  # --- Find first unchecked sprint ---
  local pair
  pair=$(find_first_unchecked_sprint "$body")
  if [[ -z "$pair" ]]; then
    # Malformed-epic guard (#771): "no unchecked sprint" is ambiguous — it also
    # happens when the checklist has checkbox lines that don't match the
    # `- [ ] **Sprint N** — #issue` format (prose bullets, missing #ref, etc.).
    # Auto-ticking that silently skips real work (observed on #659). Only treat
    # the epic as complete with positive evidence: >=1 parseable sprint line.
    if (( $(count_sprint_lines "$body") == 0 )); then
      local cbx
      cbx=$(printf '%s\n' "$body" | grep -cE '^- \[.\]' || true)
      log "Epic #$EPIC has $cbx checkbox line(s) but ZERO parseable '- [ ] **Sprint N** — #issue' sprints — refusing to auto-complete (malformed/ungroomed). Convert items to sprint sub-issues. NOT advancing."
      notify "sprint-runner" "Epic #$EPIC: 0 parseable sprints — not auto-completing (malformed)"
      exit 0
    fi
    log "Epic #$EPIC has no unchecked sprints — complete."
    # Auto-advance ONLY when EPIC was resolved from META_EPIC (not pinned).
    if [[ "$EPIC_SOURCE" == "resolved via"* ]]; then
      # --dry-run must not mutate the META_EPIC (#694): advance_meta_epic
      # auto-ticks the epic line. Report the would-be tick and stop — without
      # an actual tick the cascade would re-resolve the same epic and loop.
      if [[ "$MODE" == "dry-run" ]]; then
        log "DRY RUN — would auto-tick Epic #$EPIC in META_EPIC #$META_EPIC and advance to the next epic."
        exit 0
      fi
      if advance_meta_epic "$EPIC"; then
        continue  # cascade: re-resolve next epic in same tick (#627)
      fi
      log "Auto-tick failed; next tick will retry."
    else
      log "EPIC is $EPIC_SOURCE — skipping auto-advance (operator must tick META_EPIC manually if applicable)."
    fi
    exit 0
  fi
  local target_n target_issue
  read -r target_n target_issue <<<"$pair"

  # --- Operator review gate (#767) ---
  # A sprint flagged needs-product-review must NOT run autonomously — the
  # session can't honor a product decision. Skip and notify; the operator
  # removes the label (or hand-runs the sprint) to release it. Applies in
  # dry-run too: report the skip rather than a would-be launch.
  if issue_needs_review "$target_issue"; then
    log "Sprint $target_n (#$target_issue) has needs-product-review — NOT launching. Remove the label (or hand-run) to release it."
    notify "sprint-runner" "Sprint $target_n (#$target_issue) needs product review — skipped"
    exit 0
  fi

  # --- Gate check ---
  local prev_n=$((target_n - 1))
  local prev_issue
  prev_issue=$(find_sprint_issue "$prev_n" "$body")
  local verdict
  verdict=$(check_gate "$prev_issue")
  if [[ "$verdict" != PASS* ]]; then
    log "Gate not satisfied: $verdict — skipping tick."
    exit 0
  fi
  log "Gate ok: $verdict. Target: Sprint $target_n (#$target_issue)."

  if [[ "$MODE" == "dry-run" ]]; then
    log "DRY RUN — would launch screen session 'sprint-runner-$target_issue' (Sprint $target_n of epic #$EPIC, work #$target_issue)"
    exit 0
  fi

  [[ -f "$BOOTSTRAP_PROMPT" ]] || die "Bootstrap prompt missing: $BOOTSTRAP_PROMPT"

  local prompt
  prompt=$(sed \
    -e "s|{{SPRINT_N}}|$target_n|g" \
    -e "s|{{TARGET_ISSUE}}|$target_issue|g" \
    -e "s|{{PREV_ISSUE}}|${prev_issue:-none}|g" \
    -e "s|{{EPIC}}|$EPIC|g" \
    "$BOOTSTRAP_PROMPT")

  # PROMPT_FILE is exported into the trap via cleanup() so it's removed
  # even if `screen -dmS` fails before the inner subshell runs.
  PROMPT_FILE=$(mktemp -t sprint-runner-prompt.XXXXXX)
  printf '%s' "$prompt" > "$PROMPT_FILE"

  # Create a dedicated worktree for this sprint (#625) so the spawned
  # session's branches and edits stay isolated from the operator's primary
  # checkout. Identifiers are keyed by target issue # (#630) for global
  # uniqueness — sprint-N within an epic isn't unique across epics.
  local worktree
  worktree=$(create_sprint_worktree "$target_issue") || die "Failed to create worktree for sprint-$target_issue"
  log "Created worktree at $worktree"

  local session_name="sprint-runner-$target_issue"
  log "Launching detached screen session $session_name (Sprint $target_n of epic #$EPIC, work #$target_issue)"

  # Spawned sprint sessions run at ultracode (effortLevel "ultracode" = xhigh
  # reasoning + standing dynamic workflow orchestration). Passed per-launch via
  # --settings (an *additional* settings overlay) so it scopes to the runner's
  # sessions ONLY — the operator's own interactive `claude` keeps its configured
  # effortLevel. "ultracode" is not a valid --effort flag choice; it must come
  # through settings. Single-quoted so the inner bash passes the JSON literally.
  local ultracode_settings='{"effortLevel":"ultracode"}'

  # `screen -dmS` allocates a PTY so claude's interactive UI works.
  screen -dmS "$session_name" bash -c "
    cd '$worktree' && \
    claude --settings '$ultracode_settings' --remote-control 'sprint-$target_issue' \"\$(cat '$PROMPT_FILE')\";
    EXIT_CODE=\$?;
    rm -f '$PROMPT_FILE';
    echo \"[sprint-runner] claude exited with code \$EXIT_CODE — session ending.\"
  "

  # Verify the session actually came up. `screen -dmS` exits 0 even on PTY
  # allocation failure on some macOS configurations.
  #
  # Use `pgrep` against the screen daemon's command line (#633) instead of
  # `screen -ls`. Two reasons: (1) the screen socket file in
  # /var/folders/.../.screen.<host>/ can take >5s to register under launchd's
  # environment (filesystem-visibility lag), even though the daemon process
  # itself exists immediately on fork; (2) pgrep against the process table
  # has no filesystem-level lag.
  #
  # warn-and-exit-0 (not die) for the not-found case: the inner claude may
  # have argv captured from `$(cat $PROMPT_FILE)` already, and `die` doesn't
  # kill the screen — it just adds false-alarm noise to launchd's last-exit.
  local verified=0
  for _ in 1 2 3; do
    if pgrep -f "SCREEN -dmS $session_name" >/dev/null 2>&1; then
      verified=1
      break
    fi
    sleep 1
  done
  if (( verified == 0 )); then
    log "WARNING: $session_name daemon process not visible after 3s — leaving alone. Next tick will detect a live session or relaunch fresh."
    notify "sprint-runner" "Sprint $target_n launch unverifiable — check screen -ls"
    exit 0
  fi

  log "Launched. Attach: screen -r $session_name. Or pair via claude.ai Remote Control as 'sprint-$target_issue'."
  notify "sprint-runner" "Launched Sprint $target_n (#$target_issue)"
  break  # cascade: one launch per tick is the cap (#627)
  done

  if (( cascade >= max_cascades )); then
    log "WARNING: cascade limit ($max_cascades) reached without progress — possible runaway. Investigate META_EPIC #${META_EPIC:-?}."
  fi
}

# === Dispatch ===
case "$MODE" in
  status)      mode_status ;;
  reap)        mode_reap ;;
  gc)          mode_gc ;;
  run|dry-run) mode_run ;;
esac
