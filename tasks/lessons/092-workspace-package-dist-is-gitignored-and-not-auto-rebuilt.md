---
id: '092'
category: lesson
tags: [monorepo, build]
auto_load: true
date: 2026-05-23
issues: [645]
---

# Lesson 092 — Workspace-package `dist/` is gitignored; local pre-push does not auto-rebuild

> **Promoted to R16** (2026-05-24, #649). This file is preserved for historical context.

**Date:** 2026-05-23
**Issue:** #645 (bootstrap prompt — require workspace-package rebuild after source edits)
**Tags:** monorepo, npm-workspaces, build, pre-push, sprint-runner

## What happened

Sprint #621 (Goal Achievement Timeline, PR #643) shipped autonomously
via the sprint-runner. It added a new exported function to
`packages/analytics-core/src/`:

```ts
export function goalsMetAtDate(...) { ... }
```

and consumed it from the frontend:

```ts
import { goalsMetAtDate } from '@toastmasters/analytics-core'
```

CI passed; PR merged; the runner advanced. But the operator pulling
fresh from main hit:

```
TypeError: goalsMetAtDate is not a function
  in useClubGoalTimeline.ts:100
```

Pre-push hook (`npm run test:unit --workspace=frontend`) failed with
8 test errors, blocking any operator push until manual `npm run
build:analytics-core` rebuilt the package's `dist/`.

## Root cause

This repo's frontend imports workspace packages from their **built
artifacts** (`packages/analytics-core/dist/cjs/...` or `.../esm/...`)
per the package's `main` / `module` / `exports` fields. Those built
artifacts live in `dist/` which is **gitignored**.

| Environment                      | Rebuilds dist/?                                              | Result                                |
| -------------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| CI (GitHub Actions)              | Yes — `npm ci` + full build chain runs before tests          | ✅ Pass                               |
| Spawned sprint session's machine | Yes — the session ran `build:analytics-core` while iterating | ✅ Pass                               |
| Operator's machine on fresh pull | **No** — pre-push hook only runs vitest, not build           | ❌ `TypeError: ... is not a function` |

The spawned session's tests passed because **it had rebuilt as it
worked**. CI's tests passed because CI rebuilds in a clean checkout.
No one in the loop saw the failure mode that hits every other operator
pulling main afterward.

## Fix

Bootstrap prompt step 4 now includes an explicit constraint:

> If your changes touch any file under `packages/*/src/`, run the
> matching `npm run build:<package>` step BEFORE `npm run test` or
> any pre-push verification. The frontend imports built artifacts
> from `packages/*/dist/` (gitignored, not auto-rebuilt). CI rebuilds
> automatically; the local pre-push hook does not.

Future spawned sessions touching workspace source will run the build
before tests, ensuring the test environment matches what fresh
operators will see post-pull.

## How to apply

- **In monorepos with workspace packages that build to `dist/`,
  ignore-distribution is a foot-gun** unless every consumer/test
  environment rebuilds before reading. CI's reliability hides the
  problem until someone pulls fresh.
- **If your test passes "for you" but not in CI's clean fresh state,
  the asymmetry IS the bug.** Don't blame the test; blame the
  environment-mismatch.
- **Codebase-level alternative** (out of scope for this fix):
  switch frontend's resolution to read package source via tsconfig
  paths. Removes the build dependency entirely. Wider change; affects
  production bundling. Filed but not addressed.

## How to detect future regressions

If a sprint touches `packages/*/src/`, the bootstrap prompt now
mandates the build step. A second-line defense would be a pre-push
hook that detects "is there an uncommitted dist/ change?" or "is
the source file newer than the dist/ artifact?" — but those require
filesystem timestamp gymnastics that aren't worth it right now. The
bootstrap-prompt constraint is the simpler invariant.

## Related

- [[091-bootstrap-prompt-scope-must-be-explicit-or-runs-diverge]] — same
  family: when something needs to happen but isn't named in the prompt,
  it doesn't happen consistently. #645 is just the most recent example.
- [[089-pipefail-plus-screen-ls-exit-1-poisons-every-pipeline]] — same
  diagnostic mode: a manual reproduction in one environment passes; the
  scripted/CI/operator-fresh-pull environment fails. **Environment
  drift is the silent killer in autonomous workflows.**
