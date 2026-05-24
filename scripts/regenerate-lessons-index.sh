#!/usr/bin/env bash
# Regenerate tasks/lessons/INDEX.md from per-file lesson frontmatter (#648).
# Thin wrapper around scripts/regenerate-lessons-index.ts.
#
#   scripts/regenerate-lessons-index.sh           # write INDEX.md
#   scripts/regenerate-lessons-index.sh --check    # exit 1 if INDEX.md is stale
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx tsx scripts/regenerate-lessons-index.ts "$@"
