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
#
# Scheduling: this script is invoked by a launchd LaunchAgent — NOT crontab —
# at minutes :17 and :47 of every hour. Plist lives at:
#   ~/Library/LaunchAgents/red.taverns.toast-stats.sprint-runner.plist
# Environment overrides (EPIC, STRICT_GATE, etc.) are set in that plist's
# <key>EnvironmentVariables</key> dict. To apply changes:
#   launchctl unload <plist> && launchctl load <plist>
#   launchctl list | grep sprint-runner    # verify registered (PID '-' = idle, OK)

set -euo pipefail

# === Configuration ===
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
META_EPIC="${META_EPIC:-}"
EPIC="${EPIC:-}"
STRICT_GATE="${STRICT_GATE:-0}"
LOCK_DIR="/tmp/toast-stats-sprint.lock"
BOOTSTRAP_PROMPT="$REPO_DIR/scripts/sprint-bootstrap.prompt"
LOG_FILE="${SPRINT_RUNNER_LOG:-$HOME/.toast-stats-sprint-runner.log}"
LOG_ROTATE_BYTES=$((1024 * 1024))

# Populated by resolve_active_epic(); used by callers to decide whether
# auto-tick fires and to print the source in --status.
EPIC_SOURCE=""
META_PAUSED=0

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# === Mode parsing ===
MODE=run
case "${1:-}" in
  --dry-run) MODE=dry-run ;;
  --status)  MODE=status ;;
  --reap)    MODE=reap ;;
  "") ;;
  *) echo "Unknown arg: $1" >&2
     echo "Usage: $0 [--dry-run|--status|--reap]" >&2
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
  notify "sprint-runner" "Reaped session $session"
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
}

mode_run() {
  rotate_log_if_large
  acquire_lock || exit 0
  cd "$REPO_DIR"

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
  local active
  active=$(list_sprint_screens | head -1 || true)
  if [[ -n "$active" ]]; then
    local active_n="${active##sprint-runner-}"
    local active_issue
    active_issue=$(find_sprint_issue "$active_n" "$body")
    if [[ -n "$active_issue" ]]; then
      local active_state
      active_state=$(gh issue view "$active_issue" --json state --jq .state 2>/dev/null || echo UNKNOWN)
      if [[ "$active_state" == "CLOSED" ]]; then
        # Stale only if the epic checkbox is ALSO ticked. Bootstrap prompt
        # (post #626 fix) ticks the box before closing the issue, but a
        # session that crashed mid-cleanup may have closed the issue and
        # then died before ticking. Treat closed-but-unticked as
        # "in cleanup" — let it finish, don't pre-empt it. See #626.
        if printf '%s\n' "$body" | grep -qE "^- \[x\] \*\*Sprint $active_n\*\* — #$active_issue"; then
          log "Stale session $active: Sprint $active_n (#$active_issue) is CLOSED + ticked — reaping."
          reap_screen_session "$active"
        else
          log "Session $active: Sprint $active_n (#$active_issue) is CLOSED but epic checkbox not yet ticked — letting session finish cleanup. Operator can --reap if genuinely stuck."
          exit 0
        fi
      else
        log "Existing session $active active (Sprint $active_n / #$active_issue is $active_state) — skipping launch."
        exit 0
      fi
    else
      log "Session $active has no matching sprint in epic body — leaving alone, skipping."
      exit 0
    fi
  fi

  # --- Find first unchecked sprint ---
  local pair
  pair=$(find_first_unchecked_sprint "$body")
  if [[ -z "$pair" ]]; then
    log "Epic #$EPIC has no unchecked sprints — complete."
    # Auto-advance ONLY when EPIC was resolved from META_EPIC (not pinned).
    if [[ "$EPIC_SOURCE" == "resolved via"* ]]; then
      advance_meta_epic "$EPIC" || log "Auto-tick failed; next tick will retry."
    else
      log "EPIC is $EPIC_SOURCE — skipping auto-advance (operator must tick META_EPIC manually if applicable)."
    fi
    exit 0
  fi
  local target_n target_issue
  read -r target_n target_issue <<<"$pair"

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
    log "DRY RUN — would launch screen session 'sprint-runner-$target_n' for #$target_issue"
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

  local session_name="sprint-runner-$target_n"
  log "Launching detached screen session $session_name"

  # `screen -dmS` allocates a PTY so claude's interactive UI works.
  screen -dmS "$session_name" bash -c "
    cd '$REPO_DIR' && \
    claude --remote-control 'sprint-$target_n' \"\$(cat '$PROMPT_FILE')\";
    EXIT_CODE=\$?;
    rm -f '$PROMPT_FILE';
    echo \"[sprint-runner] claude exited with code \$EXIT_CODE — session ending.\"
  "

  # Verify the session actually came up. `screen -dmS` exits 0 even on PTY
  # allocation failure on some macOS configurations. The screen daemon can
  # take up to ~5s to register its socket in the .screen directory after
  # forking, so retry rather than checking once. If still not visible,
  # warn-and-exit-0 rather than die — the inner `claude` may have argv
  # captured from `$(cat $PROMPT_FILE)` already; killing the parent script
  # via `die` doesn't kill the screen, so reporting a hard error is misleading
  # and clutters launchd's last-exit-code with false alarms.
  local verified=0
  for _ in 1 2 3 4 5; do
    if screen -ls 2>&1 | grep -q "$session_name"; then
      verified=1
      break
    fi
    sleep 1
  done
  if (( verified == 0 )); then
    log "WARNING: $session_name not visible in screen -ls after 5s — leaving alone. Next tick will detect a live session or relaunch fresh."
    notify "sprint-runner" "Sprint $target_n launch unverifiable — check screen -ls"
    exit 0
  fi

  log "Launched. Attach: screen -r $session_name. Or pair via claude.ai Remote Control as 'sprint-$target_n'."
  notify "sprint-runner" "Launched Sprint $target_n (#$target_issue)"
}

# === Dispatch ===
case "$MODE" in
  status)      mode_status ;;
  reap)        mode_reap ;;
  run|dry-run) mode_run ;;
esac
