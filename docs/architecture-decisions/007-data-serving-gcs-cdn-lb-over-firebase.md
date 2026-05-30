# ADR-007: Serve Data via GCS + Cloud CDN + Load Balancer (not Firebase Hosting)

## Status

Accepted (May 2026). Documents a previously-implicit decision (partly retroactive — see Note).

## Context

[ADR-001](001-cdn-only-frontend.md) removed the Express proxy and established that pre-computed data is served as static JSON from Google Cloud Storage via Cloud CDN at `cdn.taverns.red`. Concretely that data path is: a **regional GCS bucket** (`toast-stats-data-ca`, `northamerica-northeast1` / Montréal) → a **Cloud CDN-enabled backend bucket** → a **global external HTTPS Load Balancer**. The React SPA itself is served separately from **Firebase Hosting** (`ts.taverns.red`).

Firebase Hosting has its own built-in CDN and carries **no Load Balancer forwarding-rule charge**. So a fair question — raised by the 2026-05-30 cost investigation ([`docs/investigations/gcp-network-spend-2026-05-30.md`](../investigations/gcp-network-spend-2026-05-30.md)) — is _why serve the data through a self-managed GCS + Cloud CDN + LB stack instead of Firebase Hosting?_ No prior ADR, issue, or lesson recorded that comparison. This ADR records the rationale.

## Decision

Keep data on a **regional GCS bucket fronted by Cloud CDN via a global external HTTPS Load Balancer**. Do **not** migrate data serving to Firebase Hosting. The frontend SPA stays on Firebase Hosting.

### Rationale

1. **Data residency.** The production data bucket is a regional bucket in `northamerica-northeast1` (Montréal). A regional GCS bucket + Cloud CDN keeps the bytes-at-rest in Canada; Firebase Hosting's origin is Google-managed (US multi-region), which forfeits residency control over Canadian Toastmasters data.
2. **Code/data pipeline decoupling.** The scheduled `data-pipeline` Action writes JSON to GCS independently of frontend deploys — "code and data are separate pipelines; neither triggers the other" (`docs/ci-cd-flow.md`). Serving data from Firebase Hosting would re-couple data publishing to a `firebase deploy`.
3. **API ingress lockdown.** The same LB fronts the `toast-stats-api` Cloud Run service, enabling ingress restricted to `internal-and-cloud-load-balancing` (#156). Firebase Hosting → Cloud Run rewrites cannot enforce that posture.
4. **Object volume.** Districts × daily snapshots × ~10 analytics file types × accumulating history is a large, ever-growing object set — a natural fit for GCS, not for a per-deploy hosting upload.
5. **Cache control + custom domain.** `cdn.taverns.red` with per-prefix `Cache-Control` (immutable snapshots, short-TTL manifests).

## Consequences

### Positive

- Data residency stays in Canada (regional bucket).
- Frontend and data pipelines remain fully decoupled.
- `toast-stats-api` can be locked to LB-only ingress.
- Reads scale globally at CDN edge for pennies of data transfer.

### Negative

- A **fixed Global LB forwarding-rule minimum charge (~$18–24/mo)**, flat for the first 5 forwarding rules regardless of traffic. This was masked by promotional credits through ~April 2026 and is now fully billed — it was the entire "rising network spend" in the 2026-05-30 investigation, not a usage spike. Accepted as the cost of the properties above.
- The project is **shared**: `speech-evaluator` contributes 2 of the 4 global forwarding rules. Splitting products into separate GCP projects would not remove Toast Stats's share of the flat fee while ≥1 global rule remains.

## Note (retroactive)

Reasons 1–5 justify _keeping_ the architecture; they were not all captured in writing when the stack was first built (the original recorded decision, ADR-001/#168/#173, was about deleting the Express proxy for latency). This ADR is therefore partly reconstructed. If Canadian data residency is **not** a hard requirement, a future ADR could supersede this one and move the data CDN to Firebase Hosting to drop the forwarding-rule fee — but that trade was judged not worth pursuing as of 2026-05-30.

## Related

- [ADR-001](001-cdn-only-frontend.md) — CDN-only frontend (Express proxy removal)
- Issue #156 — restrict `toast-stats-api` Cloud Run ingress to internal-and-cloud-load-balancing
- Issues #168 / #173 — serve analytics via GCS + Cloud CDN; delete Express backend
- [`docs/investigations/gcp-network-spend-2026-05-30.md`](../investigations/gcp-network-spend-2026-05-30.md) — the cost investigation that prompted this ADR
