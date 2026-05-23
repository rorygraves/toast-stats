---
name: A "we're deferring this until X" test encodes a real CLS/cost tradeoff — when a new spec wants the deferral lifted, verify Lighthouse before updating the assertion, and re-defer if the budget catches a regression
description: #353's redesign-tokens.test.ts asserted JetBrains Mono was
  intentionally NOT preloaded yet ("defers JetBrains Mono font preload
  to #354"). #339 Phase 1's brand-font spec called for all three brand
  fonts to be preloaded. I updated the assertion to match the new
  contract — and Lighthouse on PR #595 immediately caught a CLS
  regression (0.012 → 0.199, threshold 0.1). Root cause: 8 live
  `var(--mono)` consumers in app-shell.css layout-shift when the
  preloaded JetBrains Mono swaps in from ui-monospace ~300ms in. The
  deferral wasn't a stale "we'll get to it" — it encoded a real
  CLS/cost optimization that the brand spec couldn't override without
  metric-matched fallbacks (size-adjust @font-face). Final shipment
  preloads 2 of 3 brand fonts; JetBrains Mono re-defers to Phase 2.
  Lesson: a deferral test is a *load-bearing budget check*, not a
  to-do note. When a new spec wants to lift it, prove the budget
  still holds before changing the assertion.
type: feedback
---

# Lesson 81 — A deferral test is a load-bearing budget check, not a to-do note

**Date:** 2026-05-23
**Issue:** #339 (adopt Red Taverns Brand v1.0 tokens — Phase 1)
**PR:** [#595](https://github.com/taverns-red/toast-stats/pull/595)

## What happened

Sprint 19 shipped Phase 1 of #339 — copy-on-release of the upstream
brand `tokens.css`, import from `index.css`, preload Space Grotesk +
Inter + JetBrains Mono. Local TDD passed (6/6 contract tests). The
fresh-context reviewer flagged an L3: "JetBrains Mono preload is
pure cost until a consumer ships … revisit if ops#37 slips." Noted
in PR body but not acted on, because the spec listed all three
brand fonts in the Phase 1 set.

### First CI cycle: 1 unrelated failure

CI's Test Suite failed on a single pre-existing assertion in
`frontend/src/__tests__/css-migration/redesign-tokens.test.ts:164`:

```ts
it('declares the --mono token but defers JetBrains Mono font preload to #354', () => {
  expect(html).not.toMatch(/family=JetBrains\+Mono/)
})
```

I updated the assertion to expect the preload (the contract
_genuinely_ changed under #339), committed it with a `test(...)`
prefix referencing the new spec, and re-ran CI.

### Second CI cycle: Lighthouse caught the real cost

Test Suite went green. **Lighthouse** failed:

| Metric                          | Threshold | Found     | Source            |
| ------------------------------- | --------- | --------- | ----------------- |
| `cumulative-layout-shift`       | ≤ 0.1     | **0.199** | `lighthouserc.js` |
| `categories.performance` (warn) | ≥ 0.9     | 0.88      | `lighthouserc.js` |

`grep -rn "var(--mono)" frontend/src/styles/components/app-shell.css`
returned 8 hits. Before this PR, JetBrains Mono wasn't preloaded
(the deferred state), so the browser couldn't find the font and
rendered the chrome immediately in `ui-monospace`. After this PR's
preload, the font installs ~300ms in, the browser swaps the
glyphs, and every `var(--mono)` element layout-shifts. CLS = 0.199.

**The L3 finding wasn't a low-priority nit. It was correct.** The
"defers JetBrains Mono" assertion wasn't lazy book-keeping — it
was encoding a CLS-budget constraint. Lifting it required _more_
than honoring a spec checkbox; it required either (a) eliminating
the consumers, (b) metric-matching the fallback via
`@font-face { size-adjust: ... }`, or (c) self-hosting the font.

### Resolution

Re-deferred the JetBrains Mono preload to Phase 2. Final Phase 1
shipment:

- Preloads: Space Grotesk + Inter (additive, no existing consumers)
- JetBrains Mono: declared in `rt-brand-v1.css` and reachable via
  `--rt-font-mono`, but **not preloaded** until Phase 2 lands with
  metric-matched fallbacks
- The "defers" assertion in `redesign-tokens.test.ts` was restored
  (with an updated comment naming both the original #354 cost
  reason AND the #339-cycle CLS evidence — so the next attempt
  doesn't have to rediscover the trap)
- The brand-v1 test was updated to assert `.not.toMatch` for
  JetBrains Mono with a cross-link to Lesson 81

## Why this is the right framing

The naive narrative — "I updated an assertion to match a new spec,
that's not pinning" — is correct as far as it goes. But it misses
the more important point: **a `.not.toMatch` test on production
infrastructure is almost always a budget check.** It was put there
because _enabling the thing has a measurable cost_. If you lift
the assertion without measuring the cost, you'll re-create the
regression the test was preventing.

The right mental model:

1. **`it.skip` / commented-out test** → assertion pinning (R1
   forbids it).
2. **Updating a positive assertion to match new behavior** → routine
   contract change.
3. **Updating a negative assertion** (`not.toMatch`, `not.toContain`)
   on perf/asset/loading state → **almost always a budget check**.
   Measure the budget _before_ flipping.

I did (2) when I should have done (3). The fix is small (~3 lines
of `index.html` reverted) because Lighthouse caught it before merge.
But on a project without a CLS budget in CI, this regression would
have shipped silently — 8 elements layout-shifting on every cold
load — and re-discovery would have cost a separate incident +
sprint to root-cause.

## How to apply

**Rule:** Before lifting a negative-assertion deferral on
performance/asset infrastructure, run the budget locally. Don't
flip the bit and rely on CI to catch you.

**Why:** The deferral comment may _understate_ the cost. The #354
deferral comment said "saves ~25KB + one stylesheet RTT" — the
25KB number is real but it omitted the bigger cost: **CLS on
existing consumers of the fallback chain.** A comment like that
captures what the author was thinking at the time, not necessarily
the full surface. Lighthouse is the authority.

**How to apply:**

1. Before flipping a `.not.toMatch` / `.not.toContain` assertion
   for an asset, font, or preload, run the same Lighthouse run CI
   would run: `cd frontend && npm run build && npm run preview &
npx lhci autorun` (or equivalent for the project). If the budget
   regresses, the deferral stands — find another way to honor the
   new spec.
2. The fresh-context reviewer's L3 deserves the same weight as a
   Medium when it predicts a specific failure mode. "Pure cost
   until a consumer ships" + "revisit if ops#37 slips" was a
   correct prediction. Don't accept "noted in PR body" as the
   resolution if the prediction has a verifiable cost — verify.
3. If the new spec wants the deferral lifted, the unblock is
   usually a **metric-match**: `@font-face { font-family: ...;
src: ...; size-adjust: 105%; ascent-override: ... }` so the
   fallback glyphs have the same metrics as the web font, and the
   swap doesn't shift layout. That work belongs in the Phase 2 PR,
   not Phase 1.
4. Update the deferral comment with the _evidence_ (Lighthouse run,
   PR number, exact metric). Future authors then know whether the
   deferral is "this MIGHT be costly" (cheap to lift, just measure)
   vs. "this IS costly, here's the trace" (don't lift without
   matching fix).

## Telltale signs you're about to fall in

- The test's name or comment contains "defers," "not yet," "until,"
  "intentionally," "blocked on," "deferred."
- The failing assertion is `.not.toMatch` / `.not.toContain`.
- The PR doing the flip is honoring a _checkbox_ in a higher-level
  spec ("add tokens.css ✅, preload fonts ✅") rather than measuring
  the impact.
- The fresh-context reviewer flagged the same line as a Low or
  Medium with words like "revisit if X slips" or "pure cost until
  Y ships."

If three of those four are true, you're at the trap. **Run the
budget locally before committing the assertion update.**

## What we explicitly did NOT do

- Did **not** lower the Lighthouse CLS threshold from 0.1. That's a
  load-bearing user-experience budget (see Lesson 79). Threshold
  drops to fit a regression are R1 territory.
- Did **not** add `size-adjust` `@font-face` overrides in this PR
  to keep the preload. That work needs the existing app-shell
  consumers to actually need brand mono — premature without the
  Phase 2 chrome migration.
- Did **not** drop the brand mono token from `rt-brand-v1.css`. The
  token stays declared so Phase 2 chrome can consume it; only the
  preload is deferred.
- Did **not** override the lighthouse check in CI to push through.

## What I'd do differently

- **Read the L3 finding as a prediction, not a nit.** "Pure cost
  until a consumer ships" + the explicit revisit condition was
  literally the bug I shipped 30 minutes later.
- **Run Lighthouse locally** before pushing the second commit. The
  project has a `lighthouserc.js` with a CLS threshold; running it
  pre-push would have caught this in 90 seconds.
- **When lifting a negative deferral, default to "prove the budget
  holds" rather than "honor the new spec."** The spec is the ceiling;
  the budget is the floor. Both have to be satisfied.

## Related

- `frontend/src/__tests__/css-migration/redesign-tokens.test.ts:164`
  — the restored deferral assertion, comment now names both #354
  (original cost reason) and #595 (the CLS evidence).
- `frontend/src/styles/__tests__/rt-brand-v1.test.ts` — Phase 1
  contract test, updated to `not.toMatch` for JetBrains Mono with
  a cross-link to this lesson.
- `frontend/index.html` — Space Grotesk + Inter preloaded; JetBrains
  Mono omitted with a multi-line rationale comment.
- `CLAUDE.md` § "Brand (Red Taverns v1.0)" — documents the 2-of-3
  preload state and the Phase 2 unblock criterion.
- Lesson 78 — sibling pattern about distinguishing a real
  regression from a stale-symptom test. Same discipline applied at
  the assertion level: read the comment AND run the budget before
  you flip the bit.
- Lesson 79 — the original 0.217 CLS regression that established
  the 0.1 threshold as load-bearing. This is the second time a
  font/Suspense-related change has tripped that exact threshold.
- `lighthouserc.js:26` — the 0.1 CLS budget that caught this.
