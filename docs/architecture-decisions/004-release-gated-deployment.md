# ADR-004: Release-Gated Production Deployment

**Status**: Proposed
**Date**: 2026-05-24
**Tracking**: #707 (epic #709). Supersedes the deployment-flow portion of [ADR-002](002-staging-environment.md).

## Context

ADR-002 (2026-04-10) defined a two-environment flow: a persistent `staging.ts.taverns.red` auto-deployed from `main`, Playwright smoke tests against staging, then auto-promotion to production. That model was only partially implemented and the **persistent staging environment has since been retired**. What actually runs today:

- `deploy.yml` triggers on **every push to `main`** and unconditionally builds + deploys **both** `hosting:staging` (an unused site) and `hosting:production`, then runs a CDN health check. It also **re-runs the full `ci.yml` suite** (via `workflow_call`) on every merge — so the ~2,500-test suite runs twice per change (once on the PR, once on the merge).
- Per-PR verification is now served by **ephemeral Firebase preview channels** ([ADR-003](003-staging-bucket-cors-preview-channels.md), `pr-preview.yml`), which deploy under the Firebase `staging` _site_ and read the `toast-stats-data-staging` CDN bucket. Each PR gets a sticky comment with a live URL.
- Per #705/#706, the sprint Definition of Done now verifies on that **PR preview channel (pre-merge)**, not prod.

Consequences of the current model:

- Every merge — including docs/lessons-only merges — triggers a full CI re-run + a staging+prod redeploy that often ships a byte-identical site (the `paths-ignore` work in #703/#704 mitigates the docs-only case but not the general per-merge redundancy).
- Production deploys are continuous and unversioned with respect to releases; there is no intentional release boundary.
- The unused `hosting:staging` deploy step runs on every merge for no consumer (#708).

Since per-sprint verification no longer depends on prod, production deployment can be decoupled from individual merges.

## Decision

Gate **production** deployment on **release-please releases** instead of every push to `main`.

1. **`deploy.yml` triggers on the release event** (`release: published` / the release-please `release_created` output / the version tag) instead of `push: [main]`. `workflow_dispatch` is retained for manual/hotfix deploys.
2. **Full CI runs on (a) every PR and (b) the release-please release PR.** The release PR is itself a PR to `main`, so `ci.yml` runs on it automatically — exercising the full suite against the _integrated, batched_ `main` state right before release. This is the integration gate. The redundant per-merge `ci` re-run inside `deploy.yml` is removed.
3. **Remove the unused `hosting:staging` deploy step** (#708). PR preview channels are created by separate `hosting:channel:deploy` commands and do not depend on it.
4. **Per-sprint verification stays on the PR preview channel** (#706) — unchanged here, but it is the prerequisite that makes (1) safe for the autonomous runner.

### Resulting flow

| Event                                 | Runs                                                                |
| ------------------------------------- | ------------------------------------------------------------------- |
| PR → main                             | `ci.yml` + PR preview + Lighthouse                                  |
| Merge → main                          | `release-please` updates the release PR (no deploy, no full re-run) |
| Release PR (a PR to main)             | `ci.yml` — full suite on the integrated state                       |
| Release PR merged (release published) | `deploy.yml` → build + `hosting:production`                         |

## Consequences

**Positive**

- Production deploys become intentional, versioned, and batched at release boundaries; lower churn and blast radius.
- The full suite no longer runs twice per change; CI cost drops.
- A merged release PR is a natural human/approval gate before prod.
- DORA "deploy" metrics key off real releases.

**Negative / risks**

- Changes sit on `main` between merge and release; prod is not continuously current. Acceptable for this product, and `workflow_dispatch` covers hotfixes.
- Direct pushes to `main` (non-PR) would bypass PR-level CI — relies on the PR-only flow holding (it does today).
- The autonomous sprint runner merges sprint PRs rapidly; prod then updates only when the release PR is merged. This is a desirable control point but must be documented so operators know when changes go live.
- **CD-config changes can't be verified on a PR preview** (a preview can't exercise a deploy-trigger change), so implementing this ADR requires operator verification of the actual release→deploy path, not the runner's preview-based DoD.

## Alternatives considered

- **Keep continuous deploy-on-merge.** Rejected: wasteful (per-merge full-CI + deploy) and no release boundary; the original driver (catch bad data before users) is better served by PR previews + the data pipeline's own checks.
- **Continuous staging on main + release-gated prod.** Rejected: the persistent staging environment is retired and PR previews already cover pre-merge verification; reviving staging adds cost for no consumer.

## Follow-up

- Implement under #707; remove staging step under #708; both tracked in epic #709.
- Update `docs/ci-cd-flow.md` and mark ADR-002 **Superseded** once this is Accepted and shipped.
