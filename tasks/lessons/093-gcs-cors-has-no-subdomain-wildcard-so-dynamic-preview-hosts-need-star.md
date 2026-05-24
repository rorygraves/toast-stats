# Lesson 093 — GCS CORS has no subdomain wildcard; dynamic preview hosts force `*`

**Date:** 2026-05-24
**Issue:** #580 (epic #657 — PR preview channels can't load staging data)
**Tags:** infra, gcs, cors, firebase-preview-channels, staging, ticket-vs-reality

## What happened

Firebase per-PR preview channels build with the staging CDN config and fetch
from `gs://toast-stats-data-staging`. The bucket's CORS allowlist held only
fixed origins (`staging-toast-stats.web.app`, `ts.taverns.red`, …). Preview
hostnames are **dynamic** — `staging-toast-stats--pr-<N>-<hash>.web.app`, fresh
random hash per channel — so they were never allowed. Every fetch returned
`200` with **no `Access-Control-Allow-Origin` header**; the browser blocked the
read. Previews showed chrome but no data → non-verifiable for any data PR.

## The ticket's suggested fix was unimplementable

#580 suggested `origin: ["https://*.staging-toast-stats.web.app"]`. Two ways
that's wrong, both caught by checking the real constraint instead of trusting
the sketch (cf. Lesson 092's "a ticket is a sketch, bend it to reality"):

1. **GCS CORS does not support subdomain wildcards.** The `origin` field takes
   only exact origins or the single `*`. Verified against the official docs
   (cloud.google.com/storage/docs/cross-origin): "You can supply a wildcard
   value that grants access to all origins: `*`." No `*.example.com` form
   exists. So the suggested origin would have matched **nothing**.
2. **The preview host isn't even a DNS subdomain.** `staging-toast-stats--pr-…`
   is a single label under `web.app` (the `--` is literal), not a child of
   `staging-toast-stats.web.app`. So even a hypothetical subdomain wildcard
   wouldn't match it.

Preview hostnames are unbounded/unpredictable → exact enumeration impossible →
`*` is the **only** mechanism that works.

## Why `*` was safe (and how to argue it)

CORS only governs **browser cross-origin JS reads**; it is not an access gate
for non-browser clients. The bucket was **already world-readable** (anonymous
`curl` with no Origin returns the data), so `*` widened _nothing_ — it just lets
the browser surface data that was always publicly fetchable. Data is public
Toastmasters stats; GET/HEAD-only; anonymous (no credentials, so the
credentialed-`*` footgun doesn't apply). Production is a **separate bucket**
(`toast-stats-data-ca` via `cdn.taverns.red`) and kept its narrow exact-origin
list — proven by capturing its CORS before/after (identical) and confirming the
prod CDN still echoes `ts.taverns.red`, not `*`.

**Key distinction for any "is `*` CORS dangerous?" decision:** the risk is about
_credentials + write methods + private data_, not the wildcard itself. Public,
read-only, anonymous data → `*` is the correct, safe answer.

## Process notes

- **The apply step (`gsutil cors set`) hit the auto-mode permission classifier**
  and was denied as "unauthorized modification of shared infra." Correct
  behaviour — a `*` CORS change on a shared bucket is exactly the
  outward-facing, hard-to-self-authorize action that needs a human. Surfaced via
  AskUserQuestion → operator authorized → applied. Don't work around an infra
  permission gate; escalate it.
- **TDD for infra = before/after live capture.** No unit test exists for a
  bucket's CORS. The "Red" was a curl from a preview-style Origin returning no
  ACAO; the "Green" was the same curl returning `Access-Control-Allow-Origin:
*`. Config-as-code (`scripts/staging-cors.json`) + ADR-003 make it reproducible
  and document the non-obvious `*` rationale so nobody "tightens" it back and
  re-breaks previews.

## How to apply

- Before trusting a ticket's CORS/origin snippet, confirm the platform actually
  supports that origin syntax. GCS: exact or `*` only.
- For dynamic/ephemeral hostnames (preview channels, per-PR deploys), an origin
  allowlist is structurally the wrong tool — use `*` if the data is public, or a
  signed-URL/credential scheme if it isn't.
- Prove "production unchanged" with a literal before/after capture, not an
  assertion. Separate buckets make this clean.

## Related

- [[092-ticket-helper-signatures-bend-to-the-real-data-shape]] — same family:
  the ticket specifies a _means_; verify it against reality and implement the
  _contract_.
- ADR-003 (`docs/architecture-decisions/003-staging-bucket-cors-preview-channels.md`)
  — the decision record this lesson backs.
