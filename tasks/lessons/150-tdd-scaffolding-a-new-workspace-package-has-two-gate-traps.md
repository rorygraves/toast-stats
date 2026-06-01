---
id: '150'
category: lesson
tags: [monorepo, tdd, build, ci, automation]
auto_load: true
date: 2026-06-01
issues: [1043, 1042]
---

# Lesson 150 — TDD-scaffolding a new workspace package has two silent gate traps: the typecheck "no inputs" abort and the explicitly-enumerated CI job

**Date:** 2026-06-01
**Issue:** #1043 (epic #1042 Sprint 1 — new `packages/mcp-server` CDN read client)
**PR:** (this sprint)

## What happened

Standing up a brand-new ESM workspace package the TDD way (write the failing
test first, commit Red, then implement) hit two infrastructure traps that have
nothing to do with the feature.

### Trap 1 — the Red commit can't pass `typecheck` (TS18003)

The package's `tsconfig.json` (copied from the sibling packages) excludes test
files: `"exclude": ["…", "src/**/__tests__/**/*"]`. At the Red step the package
contains **only** tests + fixtures, so `tsc --noEmit` finds zero compile inputs
and aborts:

```
error TS18003: No inputs were found in config file '.../tsconfig.json'.
```

The root pre-commit hook runs `typecheck --workspaces`, so this fails the Red
commit — and you can't `--no-verify` past it (R1). The fix that keeps TDD honest
is a **placeholder barrel**: land `src/index.ts` with `export {}` (or the type
exports only) so the package type-checks while the test still fails for the
right reason (it imports a symbol the barrel doesn't export yet). Replace the
placeholder with the real implementation at Green.

### Trap 2 — CI's `test`/`quality-gates` jobs enumerate workspaces ONE BY ONE

`npm run test` (root) uses `--workspaces`, so it picks up the new package for
free locally. But `.github/workflows/ci.yml` does **not** — its gating jobs list
each workspace explicitly:

```yaml
- run: npm run test --workspace=@toastmasters/shared-contracts -- --coverage
- run: npm run test --workspace=@toastmasters/analytics-core -- --coverage
- run: npm run test --workspace=@toastmasters/collector-cli -- --coverage
```

A new package that isn't added here **silently never runs in CI** — green main,
zero coverage of the package, exactly the R20 orphan-file failure one level up
(at the workspace granularity instead of the test-file granularity). You must
add it to _every_ gate it needs: the `build:<pkg>` line in both the
`quality-gates` and `test` build steps, **and** a dedicated test step.

## The transferable principle

**Adding a new workspace package is not done when its own tests pass locally —
the local `--workspaces` runner hides two gaps that bite elsewhere.** A
tests-only package fails the typecheck hook until a production source input
exists (land a placeholder barrel for the Red commit); and a CI config that
names workspaces explicitly drops the package from the gate until you wire it in
by hand. Both failures are silent (one blocks _your_ commit loudly, the other
ships a permanently-untested package quietly).

## How to apply

- New TS package, TDD: create `src/index.ts` (placeholder `export {}`) in the
  same commit as the failing tests, so `typecheck` has an input and Red is about
  the missing export, not TS18003.
- Grep `ci.yml` for the sibling package (`shared-contracts`) and mirror **every**
  occurrence for the new one — build steps in all jobs that build, plus a test
  step. Don't assume a `--workspaces` invocation; this repo enumerates.
- Run `npm ci` semantics check: the new workspace must be in root `workspaces`
  AND `package-lock.json` regenerated, or CI's `npm ci` fails.

## Related

- [[090-vitest-project-split-needs-a-partition-guard]] — R20: a unit that matches
  no gate stops running silently. Same failure, finer granularity (test file vs.
  whole package).
- [[092-workspace-package-dist-is-gitignored-and-not-auto-rebuilt]] — R16: the
  other new-package footgun — built `dist/` must exist before consumers/tests run.
