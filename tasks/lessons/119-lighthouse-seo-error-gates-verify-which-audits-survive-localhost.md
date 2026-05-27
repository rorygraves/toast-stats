---
id: '119'
category: lesson
tags: [ci, tests, seo, frontend, verification, performance]
auto_load: true
date: 2026-05-26
issues: [778, 785]
---

# Lesson 119 — Before gating a Lighthouse SEO audit at `error`, verify which audits survive the localhost/preview host

**Date:** 2026-05-26
**Issue:** #778 (epic #785 Sprint 1 — static share/SEO metadata)
**PR:** [#788](https://github.com/taverns-red/toast-stats/pull/788)

## What happened

Adding the `seo` category to `lighthouserc.js` and gating `document-title`,
`meta-description`, and `canonical` at `['error', { minScore: 1 }]`. The CI
Lighthouse job serves the built site at `http://localhost:4173/`, but the
page's `canonical`/`og:url` point at the production host
`https://ts.taverns.red/`. The intuitive worry — "Lighthouse will fail the
`canonical` audit because the canonical points to a different domain than the
page being audited, so this gate will red the build for an environmental
reason" — is **wrong**, but only checking proved it.

Ran Lighthouse locally against the preview build first (Lesson 81 discipline:
prove the budget before committing the assertion). Result:

- `document-title` → **1** (pass)
- `meta-description` → **1** (pass)
- `canonical` → **1** (pass) — Lighthouse v12's `canonical` audit does **not**
  fail a cross-origin canonical; its "points to domain root" failure only
  fires when `canonicalURL.origin === baseURL.origin && baseURL.pathname !==
'/'`, which can't happen with differing origins.
- `categories:seo` → **0.92**, dragged down by exactly one sub-1 audit:
  `robots-txt` (score 0) — which is deferred to Sprint 3 (#782).

So the three presence/validity audits are safe to gate at `error`; the category
itself must stay a `warn` at 0.9 until robots.txt ships, or it would red the
build for work that isn't in this sprint.

## The transferable lesson

**A Lighthouse audit's pass/fail depends on what's served at the audited
origin, not on what the metadata points at.** Before promoting any SEO audit to
an `error` gate in a config that runs on localhost/a preview channel, run it
once and read the per-audit scores — don't reason from the audit's name.
Presence/validity audits (`document-title`, `meta-description`, `canonical`,
`is-crawlable`, `http-status-code`) pass on localhost even when canonical/og
URLs are absolute prod URLs. Audits that need a served file
(`robots-txt`, and by extension a sitemap reference) fail until that file
exists — gate those only in the sprint that ships the file, and keep the
category an aspirational `warn` meanwhile.

## How to apply

- Build + `npm run preview --prefix frontend`, then
  `npx lighthouse@12 http://localhost:4173/ --only-categories=seo
--output=json --output-path=/tmp/lh.json` (point `CHROME_PATH` at Playwright's
  chromium if no Chrome is installed). Read `r.categories.seo.score` and walk
  `auditRefs` for any `score < 1` before choosing error-vs-warn per audit.
- Gate at `error` only the audits you observed at score 1. Leave the category
  at `warn` if a known-deferred audit (robots.txt, structured data) keeps it
  below 1, and say so in a comment so the next sprint knows it's intentional.
- This is the runtime complement to the unit test: the test asserts the
  metadata is present in the shipped `index.html` (behaviour, not config —
  [[082-a-lint-rule-can-be-present-but-inert-assert-behavior-not-severity]]);
  Lighthouse proves the audits actually pass on the served page.

## Related

- [[081-phase-gated-deferral-tests-move-with-the-spec]] — prove the
  perf/asset budget locally before committing an assertion; the same "run it,
  don't assume" discipline applied here to an SEO error gate.
- [[082-a-lint-rule-can-be-present-but-inert-assert-behavior-not-severity]] —
  assert behaviour against the real artifact, not config severity.
- `lighthouserc.js` — the `seo` block with the cross-domain-canonical and
  robots.txt-deferral rationale recorded at the call site.
