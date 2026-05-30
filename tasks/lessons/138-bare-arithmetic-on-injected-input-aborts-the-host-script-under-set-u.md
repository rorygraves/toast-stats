---
id: '138'
category: lesson
tags: [bash, automation, sprint-runner]
auto_load: true
date: 2026-05-30
issues: [929, 933]
---

# Lesson 138 — A bare `(( … ))` on injected input aborts the host script under `set -u`

**Date:** 2026-05-30
**Issue:** #929 (epic #933 Sprint 2 — stuck-session liveness probes)
**PR:** _(record on merge)_

## What happened

The liveness probes are pure classify functions sourced into
`sprint-runner.sh`, which runs under `set -euo pipefail`. A probe did
`(( last_commit > start_epoch ))` and `(( mtime_age >= WINDOW ))` straight on
its arguments. The unit tests (run under `set -e` but invoking the functions in
`$( … )` subshells) were all green, so the gap was invisible — empty-string
inputs were handled, and the tests only fed numbers or "".

A fresh-context review caught it: when one of those arguments is **non-numeric**
(e.g. garbage from a misbehaving `git log` once the Sprint-3 sample side wires
in), bash arithmetic tries to resolve `not` / `a/b` as a _variable name_, and
under `set -u` that's an unbound-variable error — which aborts not just the
function but **the entire sourcing runner mid-tick**. A pure helper meant to be
robust would instead take the whole automation down.

## How to apply

When a function will be **sourced into a `set -u` script** and classifies
**externally-sampled** values, validate at the contract boundary before any
arithmetic:

```bash
# guard, don't assume numeric — empty-string checks are not enough
if [[ "$n" =~ ^[0-9]+$ ]] && (( n > floor )); then …; fi   # else: safe default
if ! [[ "$age" =~ ^[0-9]+$ ]]; then echo UNKNOWN; return 0; fi
m="$(awk -v a="${x:-0}" 'BEGIN { a += 0; … }')"            # +0 coerces in awk
```

Two corollaries:

- **`[[ -n "$x" ]]` is not a numeric guard.** It rejects empty but passes
  "garbage" straight into the `(( … ))` trap.
- **A green test suite that only feeds well-formed inputs proves nothing about
  the failure mode.** The whole point of a "pure function over injected inputs"
  is robustness at the boundary — so the boundary is exactly where the test
  fixtures (and a non-numeric case) must live. Pairs with [[083-a-bash-exit-traps-return-value-becomes-the-scripts-exit-code]] and R14 (`screen -ls` under pipefail) — the same family: a bash construct's edge-case semantics silently inverting or aborting an automation.
