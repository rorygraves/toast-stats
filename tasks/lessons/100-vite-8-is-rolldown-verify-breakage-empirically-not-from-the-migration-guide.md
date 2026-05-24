---
id: '100'
category: principle
tags: [deps, vite, rolldown, build, ci, verification]
auto_load: true
date: 2026-05-24
issues: [613, 597]
---

# Lesson 100 — Vite 8 is Rolldown; verify breakage empirically, not from the migration guide

**Date:** 2026-05-24
**Issue:** #613 (mini-epic #597 Sprint 2 — Vite 7→8 + @vitejs/plugin-react 5→6, coupled)
**Tags:** deps, vite, rolldown, build, lighthouse, ci, verification

## What happened

The coupled bump (plugin-react 6 peer-requires Vite ^8, so they move as a
pair) looked high-risk on paper. The Vite migration guide — read via WebFetch
and summarised by a small model — claimed Vite 8 **renames
`build.rollupOptions` → `build.rolldownOptions`** and **removes the object form
of `manualChunks` (deprecates the function form)**. Our `vite.config.ts` uses
both `build.rollupOptions` and a function-form `manualChunks`. Taken at face
value, that's a required config rewrite.

**It wasn't.** `npm run build:frontend` on Vite 8 succeeded with the config
untouched: the `rollupOptions` + `manualChunks` compat layer is intact. Build
time dropped 2.83s → 0.66s (Rolldown is the new default bundler — that part of
the summary was true). 2486 tests stayed green; dev server + HMR work.

## The two traps, and how empiricism beat both

1. **A migration-guide summary is a hypothesis, not the contract.** The
   small-model summary conflated "the API the guide tells new code to prefer"
   with "the only API that still works." The ground truth is what the build
   actually does. I bumped, ran the build, and read the output — it told me
   definitively that no config change was needed. (Same family as Lesson 092's
   "a ticket's signature is a sketch": the named breakage is a sketch; the
   compiler/bundler is the contract.)

2. **A scary-looking CI config can be a pre-existing no-op — check before
   "fixing" it.** `lighthouserc.js` sets `startServerReadyPattern: 'ready'`,
   but Vite 8's `vite preview` prints only `➜ Local: http://localhost:4173/`,
   no "ready". My first instinct: Vite 8 broke the Lighthouse gate, patch the
   pattern. Before touching it I probed **Vite 7** preview in a throwaway dir —
   it _also_ never printed "ready", yet Lighthouse CI had been passing in ~2 min
   on every Vite 7 PR. Conclusion: lhci waits out `startServerReadyTimeout` then
   proceeds on a successful connection; the `'ready'` pattern was never the real
   gate. Vite 8 preview output is shape-identical, so behaviour is unchanged.
   **Editing `lighthouserc.js` would have been scope creep dressed as a fix.**

## How to apply

- **For a dep bump, the existing suite + a clean build are the TDD gate.** There
  is no "write a failing test first" — there's no behaviour to add. The
  falsifiable claim is "zero regressions across the full suite + clean build +
  live verify." Run all of them; that's the proof.
- **Bump first, read the build output, then decide what (if anything) to
  change.** Don't pre-emptively rewrite config from a migration guide. Let the
  tool tell you what actually broke.
- **Before patching a config that _looks_ newly-broken, confirm it worked the
  way you think on the old version.** Reproduce the old behaviour in a scratch
  dir. A "regression" you can't show existed on the prior version may be a
  long-standing no-op.
- **Coupled peers: verify the runner's peer range explicitly.** `vitest@4.1.3`
  declares `vite: ^6 || ^7 || ^8`, so no test-runner bump was dragged in. Check
  the peer string with `npm view <pkg> peerDependencies` before assuming a
  cascade.

## Process note (carried from Lesson 092 family)

The spawned worktree's HEAD was **12 commits behind origin/main** (detached at
an older commit; #612's TS6 bump had since merged). Branching from that stale
HEAD would have silently reverted Sprint 1. Caught it with
`git rev-list --left-right --count origin/main...HEAD` at launch and branched
from `origin/main`. Same footgun as Lessons 087/090/092 — **always branch a
long-lived worktree from the fetched remote tip.**

## Related

- [[092-ticket-helper-signatures-bend-to-the-real-data-shape]] — the spec/guide
  is a sketch; the real artifact is the contract.
- [[092-reskin-the-tool-already-in-the-file-not-the-one-the-ticket-named]] —
  same stale-base catch at launch.
- [[081-phase-gated-deferral-tests-move-with-the-spec]] — CLS/Lighthouse
  threshold context for this app's font/preview tuning.
