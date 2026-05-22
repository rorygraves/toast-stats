#!/usr/bin/env bash
# scripts/sprint-runner.sh — cron-driven sprint runner for epic #574 (#575).
#
# Reads the checklist in GitHub issue #574, finds the first unchecked
# Sprint N, and — if Sprint N-1's sub-issue is CLOSED (the manifesto's
# live-verification gate) — launches a fresh `claude --remote-control`
# session inside a detached `screen` to execute /sprint for that sprint.
#
# Usage:
#   scripts/sprint-runner.sh             # normal run
#   scripts/sprint-runner.sh --dry-run   # report what it would launch, no side effects
#
# Crontab line (paste into `crontab -e`, adjust path if your checkout differs):
#   17,47 9-21 * * *  /Users/rservant/code/toast-stats/scripts/sprint-runner.sh >> /Users/rservant/.toast-stats-sprint-runner.log 2>&1

set -euo pipefail

REPO_DIR="/Users/rservant/code/toast-stats"
EPIC=574
LOCK_DIR="/tmp/toast-stats-sprint.lock"
BOOTSTRAP_PROMPT="$REPO_DIR/scripts/sprint-bootstrap.prompt"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

DRY_RUN=0
case "${1:-}" in
  --dry-run) DRY_RUN=1 ;;
  "") ;;
  *) echo "Unknown arg: $1" >&2; exit 2 ;;
esac

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*"; }
die() { log "ERROR: $*"; exit 1; }

# --- Lock (atomic mkdir, no flock dependency) ---
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "Lock $LOCK_DIR held (pid $(cat "$LOCK_DIR/pid" 2>/dev/null || echo '?')); skipping tick."
  exit 0
fi
echo "$$" > "$LOCK_DIR/pid"
trap 'rm -rf "$LOCK_DIR"' EXIT

cd "$REPO_DIR"

# --- Skip if any sprint-runner screen session is already alive ---
# macOS `screen -ls` writes to stderr, so we redirect 2>&1 before piping.
SCREEN_LIST=$(screen -ls 2>&1 || true)
if printf '%s\n' "$SCREEN_LIST" | grep -qE '\.sprint-runner-[0-9]+[[:space:]]'; then
  ACTIVE=$(printf '%s\n' "$SCREEN_LIST" | grep -oE 'sprint-runner-[0-9]+' | head -1)
  log "Existing screen session active: $ACTIVE — skipping launch."
  exit 0
fi

# --- Read epic body ---
BODY=$(gh issue view "$EPIC" --json body --jq .body 2>/dev/null) || die "gh issue view #$EPIC failed"

# --- Find first unchecked sprint: `- [ ] **Sprint N** — #XXX` ---
TARGET_LINE=$(printf '%s\n' "$BODY" | grep -m1 -E '^- \[ \] \*\*Sprint [0-9]+\*\* — #[0-9]+' || true)
if [[ -z "$TARGET_LINE" ]]; then
  log "No unchecked sprints in epic #$EPIC. Roadmap complete."
  exit 0
fi

TARGET_N=$(printf '%s\n' "$TARGET_LINE" | sed -nE 's/.*Sprint ([0-9]+)\*\*.*/\1/p')
TARGET_ISSUE=$(printf '%s\n' "$TARGET_LINE" | sed -nE 's/.*Sprint [0-9]+\*\* — #([0-9]+).*/\1/p')
[[ -n "$TARGET_N" && -n "$TARGET_ISSUE" ]] || die "Failed to parse target from: $TARGET_LINE"

# --- Find predecessor's issue number anywhere in the epic body ---
PREV_N=$((TARGET_N - 1))
PREV_ISSUE=$(printf '%s\n' "$BODY" \
  | grep -oE "Sprint ${PREV_N}[^[:cntrl:]]{0,80}#[0-9]+" \
  | head -1 \
  | grep -oE '#[0-9]+' | head -1 | tr -d '#' || true)

if [[ -z "$PREV_ISSUE" ]]; then
  log "No Sprint $PREV_N reference in epic body — treating gate as pass (cold start)."
  PREV_STATE_DESC="n/a (cold start)"
else
  PREV_STATE=$(gh issue view "$PREV_ISSUE" --json state --jq .state 2>/dev/null) || die "gh issue view #$PREV_ISSUE failed"
  if [[ "$PREV_STATE" != "CLOSED" ]]; then
    log "Gate not satisfied: Sprint $PREV_N (#$PREV_ISSUE) is $PREV_STATE — waiting for live-verification close. Skipping tick."
    exit 0
  fi
  PREV_STATE_DESC="Sprint $PREV_N (#$PREV_ISSUE) CLOSED"
fi

log "Gate ok: $PREV_STATE_DESC. Target: Sprint $TARGET_N (#$TARGET_ISSUE)."

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "DRY RUN — would launch screen session 'sprint-runner-$TARGET_N' running:"
  log "  claude --remote-control sprint-$TARGET_N <bootstrap prompt for #$TARGET_ISSUE>"
  exit 0
fi

[[ -f "$BOOTSTRAP_PROMPT" ]] || die "Bootstrap prompt missing: $BOOTSTRAP_PROMPT"

# --- Substitute placeholders into the prompt ---
PROMPT=$(sed \
  -e "s|{{SPRINT_N}}|$TARGET_N|g" \
  -e "s|{{TARGET_ISSUE}}|$TARGET_ISSUE|g" \
  -e "s|{{PREV_ISSUE}}|${PREV_ISSUE:-none}|g" \
  "$BOOTSTRAP_PROMPT")

PROMPT_FILE=$(mktemp -t sprint-runner-prompt.XXXXXX)
printf '%s' "$PROMPT" > "$PROMPT_FILE"

SESSION_NAME="sprint-runner-$TARGET_N"
log "Launching detached screen session $SESSION_NAME"

# Note: claude --remote-control NAME "<prompt>" starts an interactive session
# with Remote Control enabled, sending <prompt> as the initial user message.
# `screen -dmS` allocates a PTY so claude's interactive UI works.
screen -dmS "$SESSION_NAME" bash -c "
  cd '$REPO_DIR' && \
  claude --remote-control 'sprint-$TARGET_N' \"\$(cat '$PROMPT_FILE')\";
  EXIT_CODE=\$?;
  rm -f '$PROMPT_FILE';
  echo \"[sprint-runner] claude exited with code \$EXIT_CODE — session ending.\"
"

log "Launched. Attach: screen -r $SESSION_NAME. Or pair via claude.ai Remote Control as 'sprint-$TARGET_N'."
