---
id: '151'
category: lesson
tags: [monorepo, automation, sprint-runner, build, ci]
auto_load: true
date: 2026-06-01
issues: [1056, 1055]
---

# Lesson 151 — A long-lived worktree has stale `node_modules` after a new workspace package merges; `npm install`, never `--no-verify`

**Date:** 2026-06-01
**Issue:** #1056 (epic #1055 Sprint 1 — unified search index + matcher)
**PR:** (this sprint)

## What happened

The first commit of a frontend-only sprint failed the pre-commit hook with
`Cannot find module '@modelcontextprotocol/sdk/...'` in `packages/mcp-server` —
a package this sprint never touched. The hook runs `npm run typecheck
--workspaces`, which typechecks **every** workspace, while the blocking CI
`test`/typecheck job only runs `typecheck:frontend` (`.github/workflows/ci.yml`).

Root cause: `mcp-server` (ADR-008) had merged to `origin/main` _after_ this
long-lived sprint-runner worktree last ran `npm install`. Its declared dep
`@modelcontextprotocol/sdk` was in `package-lock.json` but absent from
`node_modules` — the worktree's install was stale, not the lockfile. `npm
install` populated it (lockfile unchanged), the hook passed, baseline restored.

## The transferable principle

**A long-lived worktree's `node_modules` drifts from `package-lock.json` the
moment a new workspace package merges to main. The local `--workspaces`
pre-commit gate surfaces it; frontend-scoped CI does not — so it's invisible
until you commit.** The signal is a typecheck/module-resolution failure in a
package your diff never touched. The fix is `npm install` (restore the
baseline), **never** `--no-verify` (R1) — bypassing only defers the failure and
hides whether your own change is clean.

## How to apply

- Commit hook fails on a package outside your diff with "Cannot find module" /
  missing types? Check `ls node_modules/<thatdep>` before suspecting your code.
  Empty → run `npm install`, then retry the commit.
- A worktree branched from a fresh `origin/main` (R19) carries main's
  `package.json`/lockfile but **not** a fresh `node_modules` — branching is not
  installing. Treat `npm install` as part of the baseline-establishment step
  when the runner hands you a worktree.
- If `npm install` changes `package-lock.json`, that's a real dependency drift —
  surface it; if it doesn't, it was purely a stale local install.

## Related

- [[092-workspace-package-dist-is-gitignored-and-not-auto-rebuilt]] — sibling
  trap: built `dist/` is stale even when `node_modules` is fresh (R16).
- [[087-spawned-sessions-need-their-own-worktree-not-shared-checkout]] /
  [[150-tdd-scaffolding-a-new-workspace-package-has-two-gate-traps]] — worktree
  provisioning and the gate asymmetry between local hooks and CI.
