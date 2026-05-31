#!/usr/bin/env bash
# red-barkeep-setup.sh — per-worktree provisioning, run by the sprint runner
# right after creating a fresh worktree, BEFORE the session starts.
#
# A fresh worktree has no node_modules and no built workspace dist/. Without
# this, the session's first commit fails the pre-commit hook on a missing
# @toastmasters/* package import (Lesson 092), and the failed commit cancels
# its batched edits. So: install deps, then build the workspace packages whose
# built dist/ the hooks + frontend import (dependency order: shared-contracts →
# analytics-core → collector-cli).
set -euo pipefail
npm ci
npm run build:shared-contracts
npm run build:analytics-core
npm run build:collector-cli
