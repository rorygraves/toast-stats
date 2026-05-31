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
# "the previous session self-verified on the consumer's verification target
# and closed its sub-issue" (per sprint-bootstrap.prompt step 5). Operator reopens if
# a close was premature. When STRICT_GATE=1, the gate additionally
# requires the predecessor issue to carry a `sprint-verified` label.
#
# Pause autonomy: apply `runner-paused` label to the META_EPIC. Remove to resume.
#
# ── Stuck-session liveness contract (epic #933) ───────────────────────────────
# An OPEN in-epic session is no longer trusted indefinitely. Each tick samples
# three probes (scripts/lib/sprint-runner-probes.sh) and fuses one verdict
# (scripts/lib/sprint-runner-liveness.sh):
#   • commit  — no commit in the worktree for 45 min (9 ticks) → STALL
#   • process — `claude` child gone but screen daemon alive → HUSK (conclusive);
#               present but CPU < ~1% across two samples → STALL
#   • log     — the per-session screen logfile (RUNNER_LOG_DIR/session-<issue>.log,
#               written at launch via a screenrc) is 45-min stale OR its tail has
#               collapsed to a repeating loop (the #871 thinking-block signature)
#               → STALL; missing logfile → UNKNOWN (never STALL)
# Fusion:  HUSK (alone) → reap now · ≥2 STALL → STUCK (corroborated) · exactly 1
# STALL → SUSPECT (logged, NOT reaped — the false-positive guard) · else HEALTHY.
# UNKNOWN never counts as STALL, and any probe flipping to OK rescues the verdict,
# so a legitimately-slow 6–9h sprint survives. On STUCK/HUSK the runner reaps +
# relaunches fresh, capped at LIVENESS_MAX_ATTEMPTS (default 3); the ship-state
# check (L086) skips relaunch if the work already merged. At the cap it escalates:
# adds `runner-stuck`, comments, notifies, leaves the slot free, does NOT relaunch.
# To re-arm after a fix: remove the `runner-stuck` label. `--status` prints the
# per-session verdict + probe breakdown + attempts N/3. State (the relaunch
# counter — the one fact truth can't rebuild) lives at WORKTREE_BASE/.runner-state.json.
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
#   RUNNER_NAME           Per-consumer identity that namespaces the lock/log
#                         defaults (default: basename of the repo dir). Set this
#                         when two consumers might otherwise share a default path.
#   SPRINT_RUNNER_LOG     Path to append-log; used for size-based rotation
#                         (default: ~/.red-barkeep-<RUNNER_NAME>.log)
#   SPRINT_RUNNER_LOCK_DIR  Override the mkdir-lock path (default
#                         /tmp/red-barkeep-<RUNNER_NAME>.lock). Used by the
#                         regression test so it can't collide with a live tick.
#   WORKTREE_BASE         Parent dir for per-sprint git worktrees
#                         (default: ~/sprint-worktrees). Each sprint gets
#                         <WORKTREE_BASE>/sprint-<N>. Isolates the spawned
#                         session's file edits, branches, and index from the
#                         operator's primary checkout. See #625.
#   RUNNER_LOG_DIR        Dir for per-session screen logfiles the liveness log
#                         probe samples (default: <WORKTREE_BASE>/.runner-logs).
#                         Must match the liveness lib's fallback. See epic #933.
#
# Scheduling: this script is invoked by a launchd LaunchAgent — NOT crontab —
# every 5 minutes (StartInterval 300). Plist lives at:
#   ~/Library/LaunchAgents/red.taverns.<name>.sprint-runner.plist
# Environment overrides (EPIC, STRICT_GATE, etc.) are set in that plist's
# <key>EnvironmentVariables</key> dict. To apply changes:
#   launchctl bootout gui/$(id -u)/red.taverns.<name>.sprint-runner
#   launchctl bootstrap gui/$(id -u) <plist>
#   launchctl print gui/$(id -u)/red.taverns.<name>.sprint-runner  # verify run interval

set -euo pipefail

# === Configuration ===
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
META_EPIC="${META_EPIC:-}"
EPIC="${EPIC:-}"
STRICT_GATE="${STRICT_GATE:-0}"
# A per-consumer identity (default: the basename of the repo this script lives
# in). It namespaces the lock, log, AND worktree defaults so consumers in
# differently-named repo dirs don't collide on shared default paths. Two repos
# with the SAME basename would still collide — set RUNNER_NAME explicitly there.
RUNNER_NAME="${RUNNER_NAME:-${REPO_DIR##*/}}"
LOCK_DIR="${SPRINT_RUNNER_LOCK_DIR:-/tmp/red-barkeep-$RUNNER_NAME.lock}"
BOOTSTRAP_PROMPT="$REPO_DIR/scripts/sprint-bootstrap.prompt"
LOG_FILE="${SPRINT_RUNNER_LOG:-$HOME/.red-barkeep-$RUNNER_NAME.log}"
LOG_ROTATE_BYTES=$((1024 * 1024))
WORKTREE_BASE="${WORKTREE_BASE:-$HOME/code/.worktrees/$RUNNER_NAME}"
# Per-session screen logfiles live here — a sibling of the worktrees, NEVER
# inside one (so they don't pollute a git status or get swept by `git worktree
# remove`). The liveness log probe samples $RUNNER_LOG_DIR/session-<issue>.log
# (epic #933 §2.3); launch_sprint_session writes it, reap/GC delete it. The
# default MUST match the liveness lib's own fallback ($WORKTREE_BASE/.runner-logs).
RUNNER_LOG_DIR="${RUNNER_LOG_DIR:-$WORKTREE_BASE/.runner-logs}"

# Screen-session + remote-control identity are namespaced by RUNNER_NAME so
# multiple consumers on one host never adopt/reap each other's sessions when
# their repos share issue numbers (the pre-#clobber bug: a bare
# `sprint-runner-<issue>` name is ambiguous across repos). A session is THIS
# runner's iff it carries this prefix; a bare or other-runner name is invisible
# to list_sprint_screens, so cross-consumer clobber is impossible by construction.
#   screen session : sprint-runner-<RUNNER_NAME>-<issue>
#   remote-control : sprint-<RUNNER_NAME>-<issue>
SESSION_PREFIX="sprint-runner-${RUNNER_NAME}-"
RC_NAME_PREFIX="sprint-${RUNNER_NAME}-"

# Export the per-consumer footprint so any subshell — and the liveness lib's
# own `${WORKTREE_BASE:-…}`/`${RUNNER_LOG_DIR:-…}` fallbacks — see the SAME
# namespaced values rather than guessing the old un-namespaced defaults (which
# would silently re-introduce the cross-consumer collision this sprint kills).
export RUNNER_NAME WORKTREE_BASE RUNNER_LOG_DIR LOCK_DIR LOG_FILE SESSION_PREFIX RC_NAME_PREFIX

# Stuck-session liveness (epic #933). Sourcing only DEFINES functions.
#   probes      — pure classify functions over sampled inputs (Sprint 2 #929).
#   liveness    — fuse_verdict, the attempt-state store, and evaluate_liveness
#                 (the sampling edge), wired into the tick below (Sprint 3 #930).
# shellcheck source=lib/sprint-runner-probes.sh
source "$REPO_DIR/scripts/lib/sprint-runner-probes.sh"
# shellcheck source=lib/sprint-runner-liveness.sh
source "$REPO_DIR/scripts/lib/sprint-runner-liveness.sh"
# shellcheck source=lib/sprint-runner-process.sh
source "$REPO_DIR/scripts/lib/sprint-runner-process.sh"
# shellcheck source=lib/sprint-runner-worktree.sh
source "$REPO_DIR/scripts/lib/sprint-runner-worktree.sh"

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
  # macOS `screen -ls` writes to stderr → 2>&1. Match ONLY this runner's
  # namespaced sessions (sprint-runner-<RUNNER_NAME>-<issue>) so a co-resident
  # consumer's sessions (bare or other-named) are never adopted/reaped.
  screen -ls 2>&1 | grep -oE "${SESSION_PREFIX}[0-9]+" || true
}

reap_screen_session() {
  local session="$1"
  local n="${session##"$SESSION_PREFIX"}"
  log "Reaping screen session $session"
  # Kill the session's FULL process tree BEFORE quitting the screen. The PID set
  # is snapshotted up front, so children (npm -> vitest worker pool) can't
  # reparent to init and survive as bare `node`, pinning cores and flaking the
  # next sprint (toast-stats #973). pgrep-by-name only ever matched claude itself.
  local roots
  roots=$(pgrep -f "claude --remote-control ${RC_NAME_PREFIX}$n" || true)
  if [[ -n "$roots" ]]; then
    log "Reaping session process tree (roots: $roots)"
    # shellcheck disable=SC2086
    reap_tree $roots
  fi
  screen -X -S "$session" quit 2>/dev/null || true
  # Also remove the worktree (idempotent — no-op if it doesn't exist).
  remove_sprint_worktree "$n"
  # Delete the per-session screen logfile + screenrc (epic #933 §2.3): they are
  # truth-tied to session lifetime, so a fresh relaunch never reads a reaped
  # session's stale loop transcript as the new session's log signal.
  rm -f "$RUNNER_LOG_DIR/session-$n.log" "$RUNNER_LOG_DIR/session-$n.screenrc" "$RUNNER_LOG_DIR/provision-$n.log" 2>/dev/null || true
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
  # Keep Spotlight (mdworker) out of the worktrees — each one carries a fresh
  # node_modules (~100k files). A .metadata_never_index marker excludes the
  # whole subtree from indexing. Best-effort; never fail the run over it.
  [[ -e "$WORKTREE_BASE/.metadata_never_index" ]] || : > "$WORKTREE_BASE/.metadata_never_index" 2>/dev/null || true
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
    if ! pgrep -f "SCREEN -dmS ${SESSION_PREFIX}$n" >/dev/null 2>&1; then
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
    log "GC: orphan worktree $wt (no ${SESSION_PREFIX}$n screen) — removing"
    git -C "$REPO_DIR" worktree remove --force "$wt" 2>/dev/null \
      || rm -rf "$wt"
    # A worktree with no paired screen is a dead session — drop its logfile +
    # screenrc too (same truth-tied lifetime as in reap_screen_session).
    rm -f "$RUNNER_LOG_DIR/session-$n.log" "$RUNNER_LOG_DIR/session-$n.screenrc" "$RUNNER_LOG_DIR/provision-$n.log" 2>/dev/null || true
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

# issue_has_label <issue> <label> → 0 if the issue carries <label>, else 1.
# Fail-open: a gh error yields non-zero ("absent") so every label gate built on
# this degrades to "not flagged" and lets the predecessor gate govern the tick.
issue_has_label() {
  gh issue view "$1" --json labels --jq '.labels[].name' 2>/dev/null \
    | grep -qx "$2"
}

# True (0) if the issue carries `needs-product-review` — the runner must not
# launch such a sprint autonomously (#767); the session can't make a product
# call. The operator removes the label (or hand-runs) to release it.
issue_needs_review() { issue_has_label "$1" needs-product-review; }

# === Sprint launch (shared by first-launch and Sprint-4 auto-relaunch) ===
#
# launch_sprint_session <sprint_n> <issue> <prev_issue> <epic>
#   Build the bootstrap prompt, create the per-sprint worktree, and spawn the
#   detached `screen` session running `claude --remote-control`. Returns:
#     0 — launched and the screen daemon verified in the process table
#     1 — hard failure (missing bootstrap prompt / worktree create failed)
#     2 — launched but the daemon wasn't visible within the verify window
#   Used by BOTH the cold first-launch path and the auto-relaunch path so a
#   relaunch is byte-identical to a fresh launch (no drift between the two).
#   PROMPT_FILE stays a global (not local) so the EXIT trap's cleanup() still
#   removes it if `screen -dmS` fails before the inner subshell rm runs.
launch_sprint_session() {
  local target_n="$1" target_issue="$2" prev_issue="$3" epic="$4"

  [[ -f "$BOOTSTRAP_PROMPT" ]] || { log "ERROR: Bootstrap prompt missing: $BOOTSTRAP_PROMPT"; return 1; }

  local prompt
  prompt=$(sed \
    -e "s|{{SPRINT_N}}|$target_n|g" \
    -e "s|{{TARGET_ISSUE}}|$target_issue|g" \
    -e "s|{{PREV_ISSUE}}|${prev_issue:-none}|g" \
    -e "s|{{EPIC}}|$epic|g" \
    "$BOOTSTRAP_PROMPT")
  PROMPT_FILE=$(mktemp -t sprint-runner-prompt.XXXXXX)
  printf '%s' "$prompt" > "$PROMPT_FILE"

  # Dedicated worktree (#625) keyed by issue # (#630) — isolates the session's
  # edits/branches/index from the operator's primary checkout.
  local worktree
  worktree=$(create_sprint_worktree "$target_issue") || { log "ERROR: Failed to create worktree for sprint-$target_issue"; return 1; }
  log "Created worktree at $worktree"
  # Provision the worktree (install deps + build workspace dist/) BEFORE the
  # session so its first commit doesn't fail the pre-commit hook on an
  # unbuilt env (toast-stats #973 / Lesson 092). Fail-closed: don't launch
  # a sprint into a broken environment — drop the worktree and retry next tick.
  if ! provision_worktree "$worktree" "$target_issue"; then
    log "ERROR: provisioning failed for sprint-$target_issue — not launching; will retry next tick"
    remove_sprint_worktree "$target_issue"
    return 1
  fi

  local session_name="${SESSION_PREFIX}$target_issue"
  log "Launching detached screen session $session_name (Sprint $target_n of epic #$epic, work #$target_issue)"

  # Spawned sprint sessions run at ultracode (effortLevel "ultracode" = xhigh
  # reasoning + standing dynamic workflow orchestration). Passed per-launch via
  # --settings (an *additional* settings overlay) so it scopes to the runner's
  # sessions ONLY — the operator's own interactive `claude` keeps its configured
  # effortLevel. "ultracode" is not a valid --effort flag choice; it must come
  # through settings. Single-quoted so the inner bash passes the JSON literally.
  local ultracode_settings='{"effortLevel":"ultracode"}'

  # Per-session screen logfile (epic #933 §2.3) — the on-disk feed the liveness
  # log probe samples to catch a #871-shape loop (output repeating, no commits).
  # Without it the log probe is permanently UNKNOWN and the #871 shape collapses
  # to a single soft signal (SUSPECT → never reaped). Installed screen is
  # 4.00.03 (FAU), which has NO `-Logfile` flag (design open-Q #2) — only `-L`,
  # which alone writes `screenlog.0` into the window's cwd (collides across
  # concurrent sessions, pollutes the worktree). So we point logging at an
  # explicit path via a per-session screenrc and launch with `-c <screenrc> -L`.
  #   - `source <default>` first (when present) so `-c` ADDS logging rather than
  #     REPLACING the operator's screen config (term/scrollback the UI may want).
  #   - `logfile flush 1` so output reaches disk within ~1s (screen's default is
  #     10s of buffering — long enough to read an empty logfile and be misled);
  #     mtime then tracks real activity promptly.
  # Logging taps the window output; the window's PTY is untouched, so claude's
  # interactive UI still works.
  local logfile="$RUNNER_LOG_DIR/session-$target_issue.log"
  local screenrc="$RUNNER_LOG_DIR/session-$target_issue.screenrc"
  mkdir -p "$RUNNER_LOG_DIR"
  {
    [[ -f "$HOME/.screenrc" ]] && printf 'source %s\n' "$HOME/.screenrc"
    printf 'logfile %s\nlogfile flush 1\ndeflog on\n' "$logfile"
  } > "$screenrc"
  # Start every launch from a byte-fresh logfile: screen APPENDS to an existing
  # logfile, and a same-issue relaunch must never inherit a prior session's loop
  # transcript as its own log signal (reap/GC normally delete it, but truncating
  # here is the belt-and-suspenders guard against any residue).
  : > "$logfile"

  # `screen -dmS` allocates a PTY so claude's interactive UI works. `-dmS
  # <name>` stays FIRST so downstream `pgrep -f "SCREEN -dmS <name>"` and the
  # hermetic tests still match on that prefix; the logging flags follow.
  screen -dmS "$session_name" -c "$screenrc" -L bash -c "
    cd '$worktree' && \
    claude --settings '$ultracode_settings' --remote-control '${RC_NAME_PREFIX}$target_issue' \"\$(cat '$PROMPT_FILE')\";
    EXIT_CODE=\$?;
    rm -f '$PROMPT_FILE';
    echo \"[sprint-runner] claude exited with code \$EXIT_CODE — session ending.\"
  "

  # Verify the session came up. `screen -dmS` exits 0 even on PTY-alloc failure
  # on some macOS configs. Use `pgrep` against the daemon's command line (#633),
  # not `screen -ls`: the socket file can lag >5s under launchd while the daemon
  # process exists immediately on fork, and the process table has no such lag.
  local verified=0 _
  for _ in 1 2 3; do
    if pgrep -f "SCREEN -dmS $session_name" >/dev/null 2>&1; then
      verified=1
      break
    fi
    sleep 1
  done
  if (( verified == 0 )); then
    log "WARNING: $session_name daemon process not visible after 3s — leaving alone. Next tick will detect a live session or relaunch fresh."
    return 2
  fi

  log "Launched. Attach: screen -r $session_name. Or pair via claude.ai Remote Control as '${RC_NAME_PREFIX}$target_issue'."
  return 0
}

# === Stuck-session ship-check / escalation (Sprint 4, #931) ===
#
# sprint_already_shipped <issue> → 0 if the sprint's work has ALREADY landed,
# 1 otherwise. The L086/R15 guardrail: a STUCK session may have died only in its
# verify→label→tick→close tail, AFTER its PR merged. Relaunching `/sprint` would
# duplicate merged work. We check the SHARED truth — a merged PR referencing the
# issue, or a commit on the real `origin/main` history — never `origin/main..HEAD`
# of a diverged local branch (which lies about what shipped; design §5).
# Fail-safe direction: any uncertainty resolves to "not shipped" → relaunch (the
# diagram's default), because a missed relaunch starves work while a wrong "no"
# only costs one extra reap.
sprint_already_shipped() {
  local issue="$1" merged

  # Signal 1: a merged PR that references the issue in its title/body. Scoped to
  # `in:title,body` (not bare full-text) to avoid matching a PR that merely
  # mentions the number in a code block or comment thread.
  merged=$(gh pr list --state merged --search "$issue in:title,body" --json number 2>/dev/null \
            | jq 'length' 2>/dev/null || echo 0)
  [[ "$merged" =~ ^[0-9]+$ ]] || merged=0
  if (( merged > 0 )); then return 0; fi

  # Signal 2: a commit referencing the issue on origin/main's ACTUAL history
  # (best-effort fetch first; the grep is over origin/main, NEVER the diverged
  # local branch — a diverged `origin/main..HEAD` lies about what shipped, L086).
  # The `#<issue>([^0-9]|$)` boundary stops `#931` from matching `#9310` — a
  # spurious match would falsely report "shipped" and (since the shipped path
  # doesn't burn an attempt) could reap+relaunch forever without ever escalating.
  git -C "$REPO_DIR" fetch origin main --quiet 2>/dev/null || true
  if [[ -n "$(git -C "$REPO_DIR" log origin/main -E --grep="#${issue}([^0-9]|\$)" --format=%h -1 2>/dev/null || true)" ]]; then
    return 0
  fi
  return 1
}

# issue_is_stuck_escalated <issue> → 0 if the issue carries `runner-stuck` (the
# auto-relaunch cap was hit and the operator hasn't cleared it). The normal
# launch path skips such an issue so the freed slot isn't silently re-filled
# with a 4th relaunch before the operator investigates (design §5).
issue_is_stuck_escalated() { issue_has_label "$1" runner-stuck; }

# escalate_stuck <issue> <attempts> → flag the issue for the operator and free
# the slot WITHOUT relaunching (cap reached). Idempotent: the strong, visible
# signals (label + comment) are written once; if `runner-stuck` is already
# present a later tick only logs. R15 two-signal discipline: the label is the
# durable gate the normal path keys off, the comment is the human-readable why.
escalate_stuck() {
  local issue="$1" attempts="$2"
  if issue_is_stuck_escalated "$issue"; then
    log "Escalation: #$issue already flagged runner-stuck (attempts=$attempts/$LIVENESS_MAX_ATTEMPTS) — slot free, awaiting operator. No relaunch."
    return 0
  fi
  log "Escalation: #$issue exhausted $attempts/$LIVENESS_MAX_ATTEMPTS auto-relaunch attempts — flagging runner-stuck, freeing slot, notifying operator. No relaunch."
  # Ensure the label exists (idempotent); -f? gh has no create-or-update, so
  # tolerate the already-exists error.
  gh label create runner-stuck --color B60205 \
    --description "sprint-runner: auto-relaunch cap reached; needs operator" 2>/dev/null || true
  gh issue edit "$issue" --add-label runner-stuck 2>/dev/null \
    || log "WARNING: failed to add runner-stuck label to #$issue"
  gh issue comment "$issue" --body "🛑 **sprint-runner: auto-relaunch exhausted (${attempts}/${LIVENESS_MAX_ATTEMPTS}).** This sprint's session was detected STUCK and reaped, but every capped relaunch also stalled. The slot is now **free** and this issue is flagged \`runner-stuck\` so the runner will **not** auto-relaunch it again. Operator: investigate the stall (see the runner log), then remove the \`runner-stuck\` label to re-arm. The ship-state check ran before each relaunch, so this is not already-merged work." 2>/dev/null \
    || log "WARNING: failed to post escalation comment on #$issue"
  notify "sprint-runner" "Sprint #$issue STUCK — ${attempts}/${LIVENESS_MAX_ATTEMPTS} relaunches exhausted, needs operator"
  return 0
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
  log "Name: $RUNNER_NAME   Lock dir: $LOCK_DIR"
  log "Log file: $LOG_FILE   Worktrees: $WORKTREE_BASE"
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
    log "Active screen sessions (liveness — read-only, no reap):"
    # Per-session fused verdict + probe breakdown + relaunch attempt count
    # (#931 acceptance). evaluate_liveness only SAMPLES (git/pgrep/ps/stat) — it
    # never reaps — so it is safe in the read-only status mode. Globals it sets
    # are read in the same subshell iteration.
    printf '%s\n' "$sessions" | while read -r s; do
      local issue="${s##"$SESSION_PREFIX"}"
      evaluate_liveness "$issue"
      local att; att=$(state_get_attempts "$issue")
      log "  - $s  [verdict=$LIVENESS_VERDICT  commit=$LIVENESS_COMMIT process=$LIVENESS_PROCESS log=$LIVENESS_LOG  attempts=$att/$LIVENESS_MAX_ATTEMPTS]"
    done
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
          log "  - $wt  [ORPHAN — no ${SESSION_PREFIX}$n screen; next run will GC]"
        else
          log "  - $wt  [active — paired with ${SESSION_PREFIX}$n]"
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
    orphans=$(pgrep -f "claude --remote-control ${RC_NAME_PREFIX}" || true)
    if [[ -n "$orphans" ]]; then
      log "Orphan claude pids (no screen): $orphans — killing their process trees."
      # shellcheck disable=SC2086
      reap_tree $orphans
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
  # Screen names are <SESSION_PREFIX><target_issue> (#630), i.e.
  # sprint-runner-<RUNNER_NAME>-<issue>, so stripping the prefix yields the work
  # item's issue number directly — no sprint-N parsing needed here.
  local active
  active=$(list_sprint_screens | head -1 || true)
  if [[ -n "$active" ]]; then
    local active_issue="${active##"$SESSION_PREFIX"}"
    local active_line
    active_line=$(find_sprint_line_by_issue "$active_issue" "$body")
    if [[ -n "$active_line" ]]; then
      local active_state
      active_state=$(gh issue view "$active_issue" --json state --jq .state 2>/dev/null || echo UNKNOWN)
      if [[ "$active_state" == "CLOSED" ]]; then
        # Stale only if the epic checkbox is ALSO ticked (#626).
        if [[ "$active_line" =~ ^-\ \[x\] ]]; then
          log "Stale session $active: #$active_issue is CLOSED + ticked — reaping."
          # Genuine completion (CLOSED + ticked) — reset the relaunch attempt
          # counter so a future re-open of this issue starts fresh (design §4.2).
          state_record "$active_issue" DONE 0 || true
          reap_screen_session "$active"
        else
          log "Session $active: #$active_issue is CLOSED but epic checkbox not yet ticked — letting session finish cleanup. Operator can --reap if genuinely stuck."
          exit 0
        fi
      else
        # OPEN in-epic session — evaluate liveness, then ACT (Sprint 4, #931).
        # Sample the 3 probes → fuse → verdict; the pure layers keep every
        # decision unit-testable, evaluate_liveness is the only host-touching
        # part. Call as a plain statement (NOT $(...)): it returns its verdict +
        # breakdown via globals, which a subshell would discard.
        local verdict attempts
        evaluate_liveness "$active_issue"
        verdict="$LIVENESS_VERDICT"
        attempts=$(state_get_attempts "$active_issue")
        log "Existing session $active active (#$active_issue is $active_state) — liveness verdict=$verdict [commit=$LIVENESS_COMMIT process=$LIVENESS_PROCESS log=$LIVENESS_LOG attempts=$attempts/$LIVENESS_MAX_ATTEMPTS]."

        if [[ "$verdict" != STUCK && "$verdict" != HUSK ]]; then
          # HEALTHY (progress / insufficient evidence) or SUSPECT (one soft
          # signal — the false-positive guard). Record and leave the session
          # running; the next tick re-evaluates. No reap, no launch.
          state_record "$active_issue" "$verdict" "$attempts" \
            || log "WARNING: failed to persist liveness state for #$active_issue"
          log "Liveness: $verdict on #$active_issue — leaving session running; skipping launch."
          exit 0
        fi

        # STUCK (≥2 corroborating stalls) or HUSK (conclusive: screen alive,
        # claude gone). The session is not progressing — act per design §5.
        if (( attempts >= LIVENESS_MAX_ATTEMPTS )); then
          # Cap reached — reap to free the slot, escalate, do NOT relaunch.
          state_record "$active_issue" "$verdict" "$attempts" || true
          log "Liveness: $verdict on #$active_issue at attempt cap ($attempts/$LIVENESS_MAX_ATTEMPTS) — reaping + escalating, no relaunch."
          reap_screen_session "$active"
          escalate_stuck "$active_issue" "$attempts"
          exit 0
        fi

        log "Liveness: $verdict on #$active_issue (attempt $attempts/$LIVENESS_MAX_ATTEMPTS) — reaping stuck session."
        reap_screen_session "$active"

        # L086 / R15 ship-state check BEFORE relaunch: the zombie may have
        # already merged its PR and died only in its verify→label→tick→close
        # tail. Relaunching /sprint would duplicate merged work. Check the
        # SHARED truth (merged PR / origin/main), never a diverged local branch.
        if sprint_already_shipped "$active_issue"; then
          log "Liveness: #$active_issue already shipped (merged PR / commit on origin/main) — NOT relaunching implementation (L086). Slot freed; reconcile needed: live-verify → sprint-verified → tick epic → close. Notifying operator."
          notify "sprint-runner" "Sprint #$active_issue was STUCK but already shipped — needs gating, not relaunch"
          exit 0
        fi

        # Genuinely unshipped — relaunch fresh. Persist attempts+1 BEFORE the
        # launch so a launch that itself crashes still burns the attempt (no
        # infinite relaunch of a launch-failing config; design §5).
        local relaunch_n new_attempts relaunch_prev_n relaunch_prev_issue
        relaunch_n=$(printf '%s\n' "$active_line" | sed -nE 's/.*Sprint ([0-9]+)\*\*.*/\1/p')
        relaunch_prev_n=$(( ${relaunch_n:-1} - 1 ))
        relaunch_prev_issue=$(find_sprint_issue "$relaunch_prev_n" "$body")
        new_attempts=$(( attempts + 1 ))
        state_record "$active_issue" "$verdict" "$new_attempts" "$(date +%s)" \
          || log "WARNING: failed to persist incremented attempt for #$active_issue"
        log "Liveness: relaunching Sprint ${relaunch_n:-?} for #$active_issue (attempt $new_attempts/$LIVENESS_MAX_ATTEMPTS)."

        local relaunch_rc=0
        launch_sprint_session "${relaunch_n:-1}" "$active_issue" "${relaunch_prev_issue:-}" "$EPIC" || relaunch_rc=$?
        case "$relaunch_rc" in
          0) notify "sprint-runner" "Auto-relaunched STUCK Sprint #$active_issue (attempt $new_attempts/$LIVENESS_MAX_ATTEMPTS)" ;;
          2) notify "sprint-runner" "Relaunch of #$active_issue unverifiable — check screen -ls" ;;
          *) log "ERROR: relaunch of #$active_issue failed (rc=$relaunch_rc); attempt $new_attempts already burned. Next tick retries or escalates."
             notify "sprint-runner" "Relaunch of #$active_issue FAILED — see runner log" ;;
        esac
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

  # --- Auto-relaunch escalation gate (#931) ---
  # A sprint whose auto-relaunch cap was hit carries `runner-stuck`. With the
  # slot freed by the reap, the normal path would otherwise immediately re-fill
  # it with a 4th relaunch. Skip until the operator investigates and clears the
  # label (which re-arms the issue; design §5).
  if issue_is_stuck_escalated "$target_issue"; then
    log "Sprint $target_n (#$target_issue) is flagged runner-stuck (auto-relaunch cap reached) — NOT launching. Operator: investigate, then remove the label to re-arm."
    notify "sprint-runner" "Sprint $target_n (#$target_issue) runner-stuck — skipped (awaiting operator)"
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
    log "DRY RUN — would launch screen session '${SESSION_PREFIX}$target_issue' (Sprint $target_n of epic #$EPIC, work #$target_issue)"
    exit 0
  fi

  # First launch of this sprint from the top of the cascade. The normal path is
  # always attempt 0; the per-issue attempt counter is only incremented by the
  # Sprint-4 auto-relaunch path (relaunch_stuck_sprint). Resetting it here keeps
  # an operator-cleared `runner-stuck` re-launch from inheriting a stale count.
  local launch_rc=0
  launch_sprint_session "$target_n" "$target_issue" "${prev_issue:-}" "$EPIC" || launch_rc=$?
  case "$launch_rc" in
    0) state_record "$target_issue" LAUNCHED 0 || true
       notify "sprint-runner" "Launched Sprint $target_n (#$target_issue)" ;;
    2) notify "sprint-runner" "Sprint $target_n launch unverifiable — check screen -ls" ;;
    *) die "Failed to launch Sprint $target_n (#$target_issue) — see log above" ;;
  esac
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
