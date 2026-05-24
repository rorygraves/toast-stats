---
id: '099'
category: principle
tags: [typescript, build, deps, monorepo, tsconfig]
auto_load: false
date: 2026-05-24
issues: [612, 597]
---

# Lesson 099 — `ignoreDeprecations` is the sanctioned staging path for a TS major bump, not a suppression

**Date:** 2026-05-24
**Issue:** #612 (TypeScript 5 → 6 major bump, mini-epic #597 Sprint 1)
**Tags:** typescript, build, deps, monorepo, tsconfig

## What happened

Bumping `typescript ^5.2.2 → ^6.0.3` across all four workspaces produced a
single, uniform compile error from every `tsc` invocation that resolved a
config with `moduleResolution: "node"`:

```
error TS5107: Option 'moduleResolution=node10' is deprecated and will stop
functioning in TypeScript 7.0. Specify compilerOption
'"ignoreDeprecations": "6.0"' to silence this error.
```

TS6 internally renamed the legacy `"node"` resolution to `"node10"` and
flagged it deprecated. Crucially, **removal is slated for TS _7.0_, not 6.0** —
under TS6 `node10` still resolves modules exactly as before. The two CJS build
configs already carried `ignoreDeprecations: "5.0"` (from the 5.0 bump); TS6
no longer accepts `"5.0"` as a silencer and demands `"6.0"`.

## The decision: stage, don't migrate (this sprint)

Two ways to clear the error:

1. **`ignoreDeprecations: "6.0"`** — the migration value TypeScript's own error
   message tells you to use. Acknowledges the deprecation and defers the real
   work to before TS7.
2. **Migrate the resolution mode** — `node` → `node16`/`nodenext`/`bundler`.
   This is the _eventual_ fix, but it changes module-resolution semantics
   (node16/nodenext require explicit `.js` extensions on relative imports,
   affect the dual CJS/ESM `exports` map, and can shift type inference). Real
   blast radius; its own falsifiable experiment.

Chose (1) for the version-bump sprint. The manifesto forbids "suppressing
compiler warnings via flags," but `ignoreDeprecations` here is **not hiding a
bug in our code** — it is the documented mechanism for staging a multi-version
migration, and the thing it silences (`node10`) is fully functional in TS6.
#597 explicitly warns against bundling unrelated changes into a major bump;
folding a resolution-mode migration into the TS6 PR would do exactly that.
Left a breadcrumb comment in each tsconfig and a `node→node16/bundler` TODO
tracked under #597 so the TS7-prep task is discoverable.

## How to apply

- **A TS major bump's first error is usually a deprecation, not a real type
  error.** Read whether removal is _this_ major or a _later_ one. If later,
  `ignoreDeprecations: "<this-major>"` is the intended staging move — clear it
  now, migrate the underlying option in a dedicated task before the removal
  major.
- **`ignoreDeprecations` values don't auto-carry across majors.** A `"5.0"`
  left from the last bump becomes invalid at 6.0; grep every tsconfig for it
  when bumping, not just the ones that error first.
- **In a monorepo, the same deprecation fires from every entry point that
  resolves the deprecated option.** Map _all_ `tsc` invocations (build:esm,
  build:cjs, each `typecheck` with no `-p` falling through to the base
  `tsconfig.json`) — fixing only the config that errored first leaves the
  others red. Here that was 3 base configs + 2 CJS overrides.
- **Suppression vs. staging is about whether the thing being silenced is a bug.
  ** A flag that hides a real failure in your code is forbidden; a flag the
  tool itself prescribes for an orderly version migration is the correct path.
  Document the distinction in the PR so a reviewer reads it as a deliberate
  trade.

## Related

- [[092-workspace-package-dist-is-gitignored-and-not-auto-rebuilt]] — same
  sprint family: after touching `packages/*/src` (or its build config),
  rebuild `dist/` before tests (R16). The TS6 build outputs are what the
  frontend imports.
- [[081-phase-gated-deferral-tests-move-with-the-spec]] — deferring part of a
  change to a later phase with a tracked breadcrumb, rather than doing it all
  at once.
