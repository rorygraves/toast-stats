#!/usr/bin/env bash
# Dry-run the per-sprint relevant-lessons manifest of a sprint sub-issue (#650).
# Thin wrapper around scripts/relevant-lessons.ts.
#
#   scripts/relevant-lessons.sh 650        # fetch issue #650 body via gh
#   scripts/relevant-lessons.sh --stdin    # read an issue body from stdin
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx tsx scripts/relevant-lessons.ts "$@"
