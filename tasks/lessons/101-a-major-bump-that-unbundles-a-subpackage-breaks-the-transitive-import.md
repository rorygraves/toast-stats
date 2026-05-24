---
id: '101'
category: lesson
tags: [deps, eslint, build, ci, monorepo, verification]
auto_load: true
date: 2026-05-24
issues: [614, 597]
---

# Lesson 101 — A major bump that unbundles a sub-package breaks every import that relied on the transitive copy

**Date:** 2026-05-24
**Issue:** #614 (mini-epic #597 Sprint 3 — ESLint 9 → 10.4.0)
**PR:** [#690](https://github.com/taverns-red/toast-stats/pull/690)

## What happened

Bumping `eslint ^9.0.0 → ^10.4.0` across all four workspaces was peer-clean
on paper — `npm view <pkg> peerDependencies` showed typescript-eslint v8,
`eslint-plugin-react-hooks@7.1.1`, and `eslint-plugin-react-refresh@0.5.0` all
already accept `eslint ^10`. No plugin bump was dragged in.

The first hard failure came from somewhere the peer-dep audit doesn't look:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js'
  imported from .../frontend/eslint.config.js
```

All four `eslint.config.js` files `import js from '@eslint/js'`. Three of the
packages already declared `@eslint/js` explicitly in their devDependencies;
**`frontend` did not** — under ESLint 9 it resolved `@eslint/js` through
eslint's own dependency tree (eslint 9 depended on it). **ESLint 10 unbundled
`@eslint/js`** (the bump removed 51 transitive packages), so the only consumer
that never declared it could no longer resolve it. Fix: add
`@eslint/js ^10.0.1` to `frontend` devDependencies, matching its siblings.

## The transferable trap

A package you `import` directly can be satisfied invisibly by a _different_
dependency that happens to bundle it. The build is green only because of that
accident of resolution. When the provider unbundles it in a major, your import
turns into a hard `ERR_MODULE_NOT_FOUND` — and a peer-dependency audit will
**not** warn you, because nothing's peer range changed; a package simply
stopped being provided.

This is the same meta-lesson as [[100-vite-8-is-rolldown-verify-breakage-empirically-not-from-the-migration-guide]]:
the migration guide led with config-API renames (none of which bit us) and said
nothing about the unbundling that actually broke the build. **Bump, run, read
the failure** — the tool names the real break.

## How to apply

- **Declare every package you `import`, even if it currently resolves.** "It
  builds" can mean "a dependency happens to provide it." Run
  `npm ls <pkg>` to see _why_ it resolves — if the path runs through another
  package rather than your own `package.json`, you have a latent break waiting
  for that provider to drop it.
- **On any major bump, the peer-dep audit is necessary but not sufficient.**
  Peer ranges catch "this plugin won't run on the new major"; they're blind to
  "the new major stopped shipping a sub-package you import." Run the real
  command (here `npm run lint`) and read the first error.
- **In a monorepo, when one workspace declares a dep and a sibling doesn't,
  the gap is the bug.** Three packages declared `@eslint/js`; frontend's
  omission was the outlier that the transitive copy had been papering over.
  Grep all workspaces for the import vs. the declaration when one errors.

## What I explicitly did NOT do

- Did **not** edit `lighthouserc.js` when the Lighthouse CI gate failed on CLS
  `0.198 > 0.1`. The bump can't affect runtime CLS; the metric is the known
  JetBrains-Mono font-swap race (Lesson 081 / CLAUDE.md), flaky near 0.198.
  Lighthouse also fails intermittently on unrelated PRs. Re-ran the job → green.
  Tampering with the threshold would have been scope creep masking a flake
  (cf. Lesson 100's "confirm the config worked the way you think before
  patching it").
- Did **not** bump typescript-eslint, react-hooks, or react-refresh — their
  peer ranges already cover `^10`, so the bump stayed focused (per #597's "don't
  bundle unrelated changes into a major").
- Did **not** disable the one new diagnostic (`no-useless-assignment`, promoted
  into `@eslint/js` recommended). Fixed the dead `newDirection` initializer in
  `ClubsTable.tsx` instead (R1).

## Related

- [[100-vite-8-is-rolldown-verify-breakage-empirically-not-from-the-migration-guide]]
  — same family: the guide is a hypothesis, the build is the contract.
- [[092-workspace-package-dist-is-gitignored-and-not-auto-rebuilt]] — same
  diagnostic mode: a resolution that works "for you" by accident breaks
  elsewhere (R16).
- Lesson 082 — the lint sentinel (`set-state-in-effect.test.ts`) survived the
  ESLint 10 Node-API bump unchanged; behaviour-asserting tests are robust to
  major API churn.
