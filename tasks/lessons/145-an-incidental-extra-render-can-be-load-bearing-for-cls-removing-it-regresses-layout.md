---
id: '145'
category: lesson
tags: [cls, performance, frontend, react, verification, ci]
auto_load: true
date: 2026-05-30
issues: [978, 969]
---

# Lesson 145 — An incidental post-data re-render can be load-bearing for CLS; a "cleanup" that removes it regresses layout only on the CI font environment

**Date:** 2026-05-30
**Issue:** #978 (epic #969 Sprint 2 — deep-link the landing controls)
**PRs:** #984 (fix), #985/#986/#987 (throwaway CLS bisect)

## What happened

Moving the landing region filter from `usePersistedState` to `useUrlState`, I
also "simplified" the semantics: dropped the `inflate-to-all` effect (which set
`selectedRegions = allRegions` once data loaded) in favour of `empty = all`.
Logically identical — the table renders the same rows either way — and every
unit test plus a dual-engine Playwright run on the PR preview stayed green.

CI Lighthouse then failed `/` on CLS: **0.248 vs a 0.1 budget**. Locally (macOS)
the exact same `lhci` config measured **0.000** — unreproducible, because
Lighthouse uses _simulated_ throttling (host-CPU-independent) and the real
variable was **fonts**: macOS had the brand fonts cached/installed so there was
no fallback→web-font swap; the Linux CI runner swapped, reflowing text.

Bisecting on CI with throwaway PRs (revert region only → green; URL-regions +
inflate re-added → green) proved the cause was **the inflate effect's extra
post-data re-render**, not the storage backend. That second commit lands just
after the rankings table's first paint and settles its layout _after_ the web
fonts swap, so the reflow is folded into the single skeleton→table shift
(0.081, already near budget on `main`). Without it, the font-swap reflow
registers as a **separate second shift** of `.districts-rankings-table-wrap`
(+0.167), blowing the budget. Nobody designed that effect as a CLS guard — it
was incidental, and load-bearing.

## The transferable principle

**Before deleting a render-affecting effect/state as "cleanup," treat it as
potentially load-bearing for layout stability, not just logic.** A change that
is provably render-output-identical can still shift _when_ paints happen
relative to async work (fonts, images, lazy chunks) — and CLS is a function of
_timing_, not just final layout. The regression is invisible locally when your
machine lacks the triggering condition (here: uncached web fonts); only the CI
environment exposes it. Corollary to the brand-font CLS notes already in
CLAUDE.md: text-bearing containers above the fold are one accidental re-render
away from a second layout shift.

## How to apply

- A CLS budget that passes locally but fails CI is almost always **fonts or
  image dimensions**, not CPU. Reproduce by delaying/blocking web-font requests
  — but know that if your OS has the same font installed, even that won't
  reproduce it; trust the CI number and bisect _on CI_.
- To bisect a CI-only metric regression, push throwaway one-change-each branches
  as draft PRs and read the uploaded Lighthouse report's `layout-shifts` items
  (`window.__LIGHTHOUSE_JSON__` in the report HTML) — compare shift _count_ and
  the culprit `node` snippet against a `main`-baseline PR. Close them after.
- When the real root cause (font-metric matching / `size-adjust`) is out of
  scope (here fonts are Phase-2/deferred), keeping the incidental stabilizer is
  the conservative fix — but **document that it is one**, so the next person
  doesn't re-delete it. Name it in the code comment and link the evidence.

## Related

- [[081-phase-gated-deferral-tests-move-with-the-spec]] — the brand-font
  preload deferral, also a CLS-vs-fonts tradeoff held by a comment+test.
- [[138-a-verify-on-the-pr-preview-sprint-needs-a-diff-that-actually-triggers-the-preview]]
  / `tasks/rules.md` — preview verification proved the _behaviour_; the CLS gate
  is the part the preview drive can't see.
- `frontend/src/pages/DistrictsPage.tsx` (the inflate-to-all effect, now
  comment-flagged as load-bearing for CLS).
