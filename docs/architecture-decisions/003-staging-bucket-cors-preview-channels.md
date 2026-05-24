# ADR-003: Staging Bucket CORS for Firebase Preview Channels

**Status**: Accepted
**Date**: 2026-05-24
**Issue**: #580 (epic #657)
**Context**: [ADR-002](002-staging-environment.md) introduced the staging GCS
bucket `gs://toast-stats-data-staging`, read directly by the staging frontend
via `https://storage.googleapis.com/toast-stats-data-staging`. Firebase Hosting
also mints **per-PR preview channels** (e.g.
`https://staging-toast-stats--pr-579-59y97tum.web.app`) that build with the
staging CDN config and therefore fetch from the same staging bucket.

The staging bucket's CORS config listed only fixed origins
(`staging-toast-stats.web.app`, `staging.ts.taverns.red`, `ts.taverns.red`,
`localhost:3000`). Preview-channel hostnames are **dynamic** —
`staging-toast-stats--pr-<N>-<hash>.web.app`, a fresh random hash per channel —
so they were never in the allowlist. Every data fetch from a preview channel
returned `200` with **no `Access-Control-Allow-Origin` header**, so the browser
blocked the read. Result: preview channels rendered chrome but no charts, KPIs,
or district analytics — making them **non-verifiable for any data-dependent PR**
(surfaced live-auditing PR #579, the #572 sticky-KPI work).

## Decision

Set the staging bucket's CORS `origin` to the wildcard `["*"]` (GET/HEAD only).

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Content-Encoding",
      "Content-Length",
      "Cache-Control",
      "ETag"
    ],
    "maxAgeSeconds": 3600
  }
]
```

Applied (config-as-code lives at `scripts/staging-cors.json`):

```bash
gsutil cors set scripts/staging-cors.json gs://toast-stats-data-staging
```

## Why `*` and not the ticket's `https://*.staging-toast-stats.web.app`

The issue suggested a subdomain-wildcard origin. **GCS CORS does not support
subdomain wildcards** — the `origin` field accepts only exact origins or the
single `*` ("any origin"). Verified against the official docs
(<https://cloud.google.com/storage/docs/cross-origin>): "You can supply a
wildcard value that grants access to all origins: `*`." There is no
`*.example.com` form. So `https://*.staging-toast-stats.web.app` would have
matched **nothing** and left previews just as broken. (Also note the preview
host `staging-toast-stats--pr-...web.app` is not even a DNS subdomain of
`staging-toast-stats.web.app` — the `--` is part of a single label under
`web.app`.) Since the set of preview hostnames is unbounded and unpredictable,
exact enumeration is impossible. `*` is the only mechanism that works.

## Why `*` is safe here

- **The bucket is already world-readable.** Anonymous `GET` with no `Origin`
  header returns the data today. CORS only governs **browser cross-origin JS
  reads**; it adds no access-control gate for non-browser clients. So `*` does
  not widen _who_ can read the data — it is already public.
- **The data is non-sensitive** — public Toastmasters district performance
  stats, the same data served on the public production site.
- **GET/HEAD only, anonymous (no credentials).** `Access-Control-Allow-Origin:
*` is only dangerous when combined with credentialed requests; these are not.
- **Production is untouched.** Production data is served from the _separate_
  bucket `gs://toast-stats-data-ca` via `cdn.taverns.red`, which keeps its
  narrow exact-origin allowlist (`ts.taverns.red`, `localhost:5173`). This ADR
  changes only `gs://toast-stats-data-staging`.

## Maintenance note

**Do not "tighten" the staging origin back to an exact/subdomain list** — that
re-breaks every preview channel and is the exact regression this ADR fixes. If
a future requirement demands narrowing staging CORS, the only correct lever is
a credentialed/signed-URL scheme, not an origin allowlist, because preview
hostnames cannot be enumerated.

## Consequences

- Preview channels now render full data; visual review on previews is
  trustworthy again.
- Any website can `fetch()` the staging JSON from a browser — acceptable, as the
  data is already public and read-only.
