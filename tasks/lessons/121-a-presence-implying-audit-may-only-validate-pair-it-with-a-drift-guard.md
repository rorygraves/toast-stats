---
id: '121'
category: lesson
tags: [ci, tests, seo, verification, frontend]
auto_load: true
date: 2026-05-27
issues: [782, 785]
---

# Lesson 121 — A "presence-implying" audit may only validate; pair it with a drift guard

**Date:** 2026-05-27
**Issue:** #782 (epic #785 Sprint 4 — robots.txt + sitemap.xml)
**PR:** [#791](https://github.com/taverns-red/toast-stats/pull/791)

## What happened

The acceptance criterion was a Lighthouse "robots.txt valid" assertion. The
obvious read is that `'robots-txt': ['error', { minScore: 1 }]` proves the file
ships. It does not. Lighthouse's `robots-txt` audit scores **1 when no
robots.txt is served at all** ("no rules → nothing to violate"). So the audit
greens whether the file exists or not — it checks _validity_, never _presence_.

This is Lesson 82 in a new costume: a check that reads like enforcement but is
inert against the failure mode you actually care about (there: a rule declared
but not implemented; here: an audit that passes on absence).

## The transferable lesson

**When a check's name implies it guarantees presence/enforcement, confirm what
it actually asserts before trusting it as the guard.** Many "SEO/health/lint"
audits validate the artifact _if it exists_ and pass vacuously when it doesn't.
Back the implied guarantee with a test that fails on the real failure mode.

Here the real guard is a **byte-exact drift test**: the committed
`frontend/public/{robots.txt,sitemap.xml}` are generated from one manifest
(`scripts/lib/seoAssets.ts`) and a scripts test asserts the committed files
equal the generator output. That test goes red if the file is deleted, edited
by hand, or left stale after a route is added — the cases the Lighthouse audit
sails through. The audit stays as the _validity_ layer; the drift test is the
_presence + correctness_ layer.

## How to apply

- For any "assert X is present/valid" criterion, ask: does this check fail when
  X is **absent**? Construct the absence case and confirm (the reviewer here
  corrupted robots.txt and watched the drift test go red — do that, don't assume).
- A generated static artifact rots silently. Generate it from a single
  source-of-truth manifest + a `--check` CLI + a CI test that byte-compares.
  Mirror the existing `lessonsIndex` regenerate-and-guard pattern.
- Prettier has no `.txt`/`.xml` parser and the format glob excludes them, so a
  byte-exact comparison between generator and committed file is stable — no
  formatter can desync one side. Verify your artifact's extension is likewise
  untouched before relying on byte equality.

## Related

- [[082-a-lint-rule-can-be-present-but-inert-assert-behavior-not-severity]] —
  the parent principle: assert behaviour, not the declared/named check.
- `scripts/lib/seoAssets.ts` + `scripts/generate-seo-assets.ts` — manifest +
  `--check` CLI. `scripts/lib/__tests__/seoAssets.test.ts` — the drift guard.
