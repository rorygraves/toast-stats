---
id: '122'
category: lesson
tags: [ci, lighthouse, security, csp, verification, frontend]
auto_load: true
date: 2026-05-27
issues: [783, 785]
---

# Lesson 122 — A CSP in hosting config is invisible to the localhost Lighthouse gate; verify headers on the deployed surface

**Date:** 2026-05-27
**Issue:** #783 (epic #785 Sprint 5 — Firebase Hosting security headers + CSP)

## What happened

#783 had two acceptance criteria that _sound_ related but live on two
completely separate verification surfaces:

1. Add a Content-Security-Policy + hardening headers via `firebase.json`.
2. "Extend Lighthouse to a best-practices gate."

The tempting mental model is "add the CSP → Lighthouse's best-practices score
goes up → the gate proves the CSP." All three links are wrong:

- **Lighthouse CI runs against `http://localhost:4173/`** (the Vite preview
  server, per `lighthouserc.js` `startServerCommand`). That server serves the
  static `dist/` — it does **not** serve the `firebase.json` `headers` block.
  Those headers only exist once Firebase Hosting serves the files. So the CSP
  is simply **absent** during every Lighthouse run.
- Even on a real host, Lighthouse's `csp-xss` audit is **informational** — it
  contributes 0 to the best-practices _score_. A perfect CSP doesn't raise the
  number; a missing one doesn't lower it.
- Therefore the best-practices gate and the CSP are **independent**. The gate
  measures console errors / deprecated APIs / insecure subresources; the CSP is
  an HTTP-response-header contract.

## The transferable lesson

**A response header set by the hosting layer is invisible to any tool that
hits a different server.** Lighthouse-against-localhost, jsdom, and unit tests
all run below the CDN/hosting edge, so none of them can see (or verify) headers
that only the edge emits. Split the verification accordingly:

- **The header contract** → a config-contract test (`firebase.json` is strict
  JSON; assert the directives) **plus** a live `curl -I` / Playwright
  `response.headers()` check **on the deployed preview channel** — that is the
  only surface that actually emits the headers.
- **The Lighthouse gate** → a separate quality floor, set at a level the build
  provably clears (measured 0.96 → gate at `error`/0.9), pinned by a guard test
  that asserts it's _enforcing_, not merely declared (Lesson 082).

Don't let the two criteria contaminate each other: a green Lighthouse run is
**not** evidence the CSP works, and a correct CSP will **not** move the
Lighthouse score.

## How to apply

- Before claiming a header/CSP "verified," ask _which server answered the
  request the tool measured_. If it's localhost/jsdom, the hosting headers
  weren't there. Drive the actual preview/prod URL.
- A CSP's `connect-src` must list every origin the app fetches. For this repo
  that's BOTH CDN origins (`storage.googleapis.com` for preview/staging,
  `cdn.taverns.red` for prod) — the preview channel reads the staging bucket
  (see [[093-gcs-cors-has-no-subdomain-wildcard-so-dynamic-preview-hosts-need-star]]),
  so a policy missing it makes previews go data-blank exactly where you verify.
- The decisive preview-channel signal that the CDN read succeeded under CSP is
  data-derived UI, not chrome: "Data fresh · <date>" and a populated snapshot
  dropdown only render after the GCS fetch resolves. Chrome rendering alone
  only proves `script-src 'self'` let the bundle run.
- `script-src 'unsafe-inline'` is defensible on a public, read-only,
  no-auth/no-PII surface whose `index.html` has inline `onload=` handlers
  (nonces/hashes can't cover inline event handlers). Document the threat model;
  don't pretend a nonce CSP is free when the markup forecloses it.

## Related

- `scripts/lib/__tests__/firebaseHeaders.test.ts` — the JSON contract test
  (pins both targets + a cross-target equality assertion against drift).
- `scripts/lib/__tests__/lighthouseGate.test.ts` — the enforcing-gate guard.
- `lighthouserc.js` — the comment at `categories:best-practices` records the
  header-independence so the next author doesn't re-conflate them.
- [[082-a-lint-rule-can-be-present-but-inert-assert-behavior-not-severity]] —
  same discipline applied to the Lighthouse gate: assert it enforces, not that
  it's merely present.
- [[081-phase-gated-deferral-tests-move-with-the-spec]] — why self-hosting the
  fonts (the optional 3rd criterion) was deferred: lifting the font deferral
  risks the CLS regression PR #595 caught.
