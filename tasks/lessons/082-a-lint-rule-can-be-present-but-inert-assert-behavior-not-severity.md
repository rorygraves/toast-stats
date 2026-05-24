---
name: A lint rule can be declared-at-error yet inert across a minor version — a sentinel must lint a known-bad snippet, not assert config severity
description: #375 wanted to "unblock dependabot" by fixing setState-in-effect
  violations so eslint-plugin-react-hooks could bump. But the violations were
  already fixed (#340), and the installed 7.0.1 already listed
  react-hooks/set-state-in-effect at "error" in its recommended config — so a
  naive config-severity contract test (calculateConfigForFile → severity === 2)
  PASSED while the rule produced ZERO diagnostics on a textbook violation. The
  rule was declared-but-inert at 7.0.1; 7.1.1 is the version that actually
  detects the pattern. The only test that distinguishes the two states lints a
  known-bad snippet through the real config (ESLint.lintText) and asserts the
  rule fires. Assert behavior, not declared severity, when the whole point is
  enforcement.
type: feedback
id: '082'
category: principle
tags: [ci, tests, tdd]
auto_load: true
date: 2026-05-23
issues: [375, 345, 348]
---

# Lesson 82 — A lint rule can be present-but-inert; assert behavior, not severity

**Date:** 2026-05-23
**Issue:** #375 (Sprint 20 — unblock dependabot #345/#348: setState-in-effect)
**PR:** [#596](https://github.com/taverns-red/toast-stats/pull/596)

## What happened

#375 read as "fix 6 `react-hooks/set-state-in-effect` violations so the
`eslint-plugin-react-hooks` 7.0.1 → 7.1.1 bump (bundled in dependabot
#348) merges clean." Two facts on the ground had already moved:

1. **The 6 violations were already fixed under #340** (closed). Every site
   — `DateRangeSelector` + the three column filters + the migration test —
   now uses the render-phase setState pattern
   (`if (prop !== tracked) { setTracked(prop); ... }`).
2. **#348 was closed**, superseded by fresh group PRs #589 (patch-and-minor,
   contains the react-hooks bump) and #588 (dev-deps, contains the TS6/Vite8
   majors).

So the _code_ work was done. The remaining deliverable was to actually
land the dependency that makes the rule **enforce**, and to lock that
enforcement against future regression.

### The trap: the rule was already "error" — but inert

The installed `eslint-plugin-react-hooks@7.0.1` already lists
`react-hooks/set-state-in-effect: "error"` in `configs.recommended.rules`,
and the project spreads that config. So:

```js
// calculateConfigForFile('src/whatever.tsx').rules['react-hooks/set-state-in-effect']
// => [2]   ← "error", at 7.0.1
```

A contract test asserting the resolved severity is `2` would have passed.
**But linting a textbook violation produced zero diagnostics:**

```ts
// 7.0.1: ESLint.lintText(<mirror prop into state via useEffect>) → 0 hits
// 7.1.1: same snippet → 1 hit, severity 2, at the setState line
```

At 7.0.1 the rule is _declared but inert_ — registered in the config,
counted as "on," yet detecting nothing. The detection logic ships in
7.1.1. A severity-only assertion is blind to this entire failure mode:
it would have reported the rule "enforced" while real violations sailed
through.

## How to apply

**Rule:** When a test exists to prove a lint rule is _enforcing_, lint a
known-bad snippet through the real config and assert the rule fires. Do
not assert the rule's declared severity — a rule can be present at
`"error"` and still detect nothing.

**Why:** "Is the rule configured?" and "does the rule catch the bug?" are
different questions. Plugins gate detection behind versions, feature
flags, parser options, or `languageOptions`; the recommended config can
list a rule before its implementation lands (exactly what happened across
react-hooks 7.0.1 → 7.1.1). The severity field tells you the _intent_;
only a lint-against-a-fixture tells you the _behavior_. When the sprint's
entire purpose is enforcement, test the behavior.

**How to apply:**

1. Use the project's real config: `new ESLint({ cwd: <workspace root> })`
   so plugin/parser resolution matches CI — don't hand-build a config.
2. Resolve the workspace root from `import.meta.url`, not `process.cwd()`,
   so the test passes whether the runner launches from the repo root
   (`npm run test`) or the workspace (`npm run test:frontend`).
3. `lintText` a minimal snippet that _is_ the anti-pattern, with a
   `filePath` under a path the config's `files` globs match (and that no
   `ignores` pattern excludes). `lintText` never touches disk, so the
   path can be virtual (`src/__sentinel__/Foo.tsx`).
4. Assert `messages.filter(m => m.ruleId === RULE && m.severity === 2)`
   is non-empty. This goes **red** on a downgrade, a removal, _or_ an
   inert rule — all three are the regression you care about.

## TDD note — this gave a genuine red→green tied to the bump

Because 7.0.1 is inert, the sentinel committed **red** (`expected 0 to be
greater than 0`) before any fix, and the 7.1.1 bump turned it **green**.
No manufactured failure (cf. Lesson 78) — the dependency upgrade is the
production change, and the sentinel is its falsifiable test.

## What I explicitly did NOT do

- Did **not** re-fix the 5 component sites — #340 already did, and full
  lint at 7.1.1 is clean (0 errors), so the fixes hold under the now-live
  rule. Re-touching them would be churn against work already shipped.
- Did **not** bump `eslint` to 10 to take the bump. react-hooks 7.1.1
  peer-deps include `^9.0.0`, so it works with the installed 9.39.4. The
  eslint-10 / TS-6 / Vite-8 majors are coupled, higher-blast-radius, and
  deferred to their own scoping issue (#597) per #375's plan.
- Did **not** write a `calculateConfigForFile` severity assertion — it
  would have false-passed against the inert 7.0.1 rule (the whole point
  of this lesson).
- Did **not** merge the 24-package #589 group as "the fix." The single
  package that was the named blocker is bumped here in a focused PR;
  #589's remaining 23 are dependabot's to land.

## Telltale signs you're at this trap

- The sprint goal is "turn on / enforce a lint rule," and the rule's name
  already appears in a spread `configs.recommended.rules`.
- A bump's changelog says it _introduces_ a rule, but the rule string is
  already resolvable in the older version's config (declared early,
  implemented later).
- Your guard test is green before you've made any change — check whether
  it's actually exercising detection or just reading config metadata.

## Related

- `frontend/src/__tests__/lint/set-state-in-effect.test.ts` — the sentinel.
- `frontend/package.json` — `eslint-plugin-react-hooks` `^7.1.1`.
- #340 — fixed the 6 violations (render-phase setState pattern).
- #588 / #597 — the deferred dev-deps majors (TS6, Vite8, plugin-react6,
  ESLint10).
- Lesson 78 — the inverse discipline: _don't_ manufacture a fix for a
  non-reproducing symptom. Here the symptom (inert rule) reproduces 100%,
  so a real red→green is honest.
- Lesson 81 — sibling "a test encodes a real constraint" lesson; both are
  about reading what a test _actually_ asserts vs. what its name implies.
