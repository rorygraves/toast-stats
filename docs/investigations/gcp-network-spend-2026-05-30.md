# GCP network spend investigation — 2026-05-30

Project: `toast-stats-prod-6d64a` · Billing: `01C674-6AA9C5-C9E306` · Source: BigQuery billing export `gcp_billing_export_v1_01C674_6AA9C5_C9E306`.

> Note: this project is **shared** across several Red Taverns products — toast-stats, speech-evaluator, red-vote, red-club, stratosphere-relay all bill here.

## TL;DR

The "network spend" is **one fixed cost**: the **Global External Load Balancer forwarding-rule minimum charge (~$24/month)**. It is flat — it does **not** scale with traffic.

It only _appears_ to have risen because **promotional credits that were fully offsetting it ran out**. Net cost by month:

| Month    | Gross  | Credits applied | **Net (what you pay)** |
| -------- | ------ | --------------- | ---------------------- |
| Feb 2026 | $0.74  | −$0.74          | **$0.00**              |
| Mar 2026 | $25.47 | −$25.47         | **$0.00**              |
| Apr 2026 | $24.95 | −$18.40         | **$6.55**              |
| May 2026 | $24.02 | $0.00           | **$24.02**             |

So this is a **credit cliff, not a usage spike.** Going forward expect ~$24/mo for this SKU at current architecture.

## Actual data-transfer egress is negligible

Every traffic-based network SKU is pennies — the Cloud CDN is doing its job:

| SKU                                                     | ~Monthly    | Volume   |
| ------------------------------------------------------- | ----------- | -------- |
| Cloud CDN cache data transfer (NA)                      | ~$0.35–0.65 | ~3–5 GiB |
| GCS "Download Worldwide" egress (`toast-stats-data-ca`) | ~$0.00      | ~22 GiB  |
| Network Internet egress (Americas)                      | <$0.10      | <0.5 GiB |
| CDN cache lookups                                       | ~$0.22      | ~220k    |

End-user delivery is cheap and efficient. No egress problem exists.

## What the forwarding-rule charge is

Four global external forwarding rules exist in the project (the "Minimum Global" SKU is a **flat ~$0.025/hr bundled charge for the first 5 rules** — i.e. ~$18–24/mo whether you have 1 or 5):

| Forwarding rule               | Scheme           | Serves                                                                                  |
| ----------------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| `toast-stats-cdn-fwd`         | EXTERNAL         | Cloud CDN → backend bucket `toast-stats-data-ca` (CDN enabled) — i.e. `cdn.taverns.red` |
| `toast-stats-api-fwd`         | EXTERNAL_MANAGED | `toast-stats-api` Cloud Run backend                                                     |
| `speech-evaluator-http-rule`  | EXTERNAL         | speech-evaluator (different product)                                                    |
| `speech-evaluator-https-rule` | EXTERNAL         | speech-evaluator (different product)                                                    |

(red-vote / red-club run on direct `*.run.app` URLs — no global LB rule, so they don't add to this SKU.)

## Options

1. **Do nothing / re-budget.** ~$24/mo is the floor for a self-managed global external HTTPS LB + Cloud CDN. The increase was credits expiring, not a leak. Simplest.
2. **Eliminate the SKU entirely** — only achievable by dropping to **zero** global external LBs (removing 2 of 4 rules won't lower the bundled flat fee). For toast-stats specifically: serve the data CDN (`cdn.taverns.red`) via **Firebase Hosting** (already used for the frontend; its CDN has no forwarding-rule charge) or Firebase rewrites to the bucket, and serve `toast-stats-api` via its direct Cloud Run URL. That would remove `toast-stats-cdn-fwd` + `toast-stats-api-fwd`. Speech-evaluator's 2 rules would still trigger the flat fee unless it also migrates — so the charge only truly disappears once **all** global LBs are gone.
3. **Set a budget alert** at ~$30–40/mo on this billing account so the next credit-cliff or genuine spike is caught early.

## Method note / correction

An earlier mid-investigation hypothesis (a "collector function" egressing ~712 GiB cross-region due to a us-east1 ↔ Canada bucket mismatch) was **incorrect** — there are **no Cloud Functions** in this project and the egress SKUs are all <$1/mo. The driver is the fixed LB forwarding-rule charge above, surfaced by credit expiry.
