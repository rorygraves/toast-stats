# ADR-004: Release-gated production deploys

**Status**: Accepted
**Date**: 2026-05-25
**Issue**: #707 (epic #709, meta-epic #606)

## Context

Today `deploy.yml` triggers on **every** `push` to `main` (with a `paths-ignore`
for docs/lessons/markdown). On each qualifying merge it:

1. Re-runs the full `ci.yml` suite as a gate (`jobs.ci: uses: ./.github/workflows/ci.yml`), then
2. Deploys the frontend to Firebase Hosting **production**.

Two problems follow from this:

- **Redundant CI.** `ci.yml` already ran on the PR before merge. Re-running the
  full suite on every push to main duplicates that work for no new signal in the
  common case (no other PR merged in between).
- **Unintentional production churn.** The autonomous sprint runner merges sprint
  PRs to `main` rapidly. Each merge ships straight to prod. Production deploys are
  therefore incidental side-effects of merging, not intentional, versioned,
  batched events. There is no changelog boundary, no human "ship it" gate, and
  DORA "deploy" signals are noisy (every merge is a "deploy").

The prerequisites for fixing this are now in place:

- **`release-please.yml` already exists** and maintains a release PR on every push
  to main (`googleapis/release-please-action@v5`, `release-please-config.json`).
  The versioning/changelog machinery is live but its release event is not yet
  wired to a deploy.
- **#706 moved per-sprint verification to the PR preview channel** (ADR-supersedes
  the "verify on prod" assumption). Verification no longer depends on prod, so
  prod can be release-gated **without stalling the autonomy loop**.

## Decision

Gate production deploys on **release-please releases**, not on merges to main.

### Target event → workflow mapping

| Event                                           | Runs                                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| PR → main                                       | `ci.yml` (per-change validation) + PR Preview + Lighthouse                                                         |
| Merge → main                                    | `release-please` only — updates the release PR. **No deploy, no full re-run.**                                     |
| Release-please **release PR** (a PR to main)    | `ci.yml` runs automatically → full suite on the **integrated/batched** main state. This _is_ the integration gate. |
| Release PR **merged** (release published / tag) | **Deploy** → build + `firebase deploy ... hosting:production`                                                      |

The release PR getting full CI for free is the linchpin: integration testing
moves to the release boundary, so dropping the per-merge re-run loses nothing.

### Concrete workflow changes

1. **Trigger on the aggregate `releases_created` output — not `release: published`.**
   `deploy.yml` becomes `on: [workflow_call, workflow_dispatch]` (no `push`).
   `release-please.yml` exposes the action's `releases_created` output and adds a
   `deploy` job gated `if: needs.release-please.outputs.releases_created == 'true'`
   that calls `deploy.yml` via `uses:` with `secrets: inherit`.

   **Why not `release: published`?** This is a _grouped multi-component_ monorepo
   (`include-component-in-tag: true`, `separate-pull-requests: false`, 5 packages).
   One release-PR merge publishes _several_ GitHub Releases/tags (`frontend-v…`,
   `analytics-core-v…`, `toast-stats-v…`). `release: published` would fire **once
   per component** → 2–5 concurrent prod deploys.

   **Why not the per-component `frontend--release_created` output?** The deployed
   artifact bundles `analytics-core` + `shared-contracts`. A sprint touching only
   `packages/analytics-core/` releases that package but **not** `frontend`, so a
   frontend-only gate would never deploy a real bundle change. The **aggregate**
   `releases_created` fires exactly once per release-PR merge regardless of which
   components released — collapsing the fan-out _and_ closing the package-only gap.
   A docs/CLI-only release redeploys a byte-identical bundle (cheap no-op).

2. **Drop the redundant gate.** Remove the `ci` job inside `deploy.yml` that
   re-ran `ci.yml` on every push to main. CI now runs on the PR and on the
   release PR.
3. **Keep `workflow_dispatch`.** Manual deploy from any state stays — the hotfix /
   emergency path.
4. **Caller permissions.** Because a called workflow's `GITHUB_TOKEN` permissions
   are capped by the caller, `release-please.yml` must grant the superset deploy
   needs (notably `id-token: write` for WIF). `deploy.yml` is trimmed to least
   privilege (`contents` + `id-token`).
5. **Release-please already owns the frontend version.** `.release-please-manifest.json`
   tracks all five components incl. `frontend: 2.13.0`, and `release-please-config.json`
   lists the `frontend` package — no config change required.

### Relationship to ADR-002

ADR-002 governs the **staging → production data** promotion (GCS buckets, diff-based
gate) — it is about _data_ reaching prod. This ADR governs the **frontend code**
deploy _cadence/trigger_. They are orthogonal: ADR-002's staging gate still
protects data; ADR-004 only changes _when_ frontend code deploys (release vs every
merge). Note any overlap where `deploy.yml` currently couples both.

## Consequences

### Easier

- Production deploys are intentional, versioned, and batched — tied to a release
  with a changelog and a tag.
- CI cycles saved: no full-suite re-run on every merge to main.
- A natural human/approval gate (merging the release PR) sits in front of prod.
- DORA "deploy frequency" / "lead time" key off real releases — more accurate.
- Hotfix path preserved via `workflow_dispatch`.

### Harder / risks

- **Prod lags main** between releases. The autonomous runner merges sprints to
  main continuously; users see them only when the release PR is merged. This is
  the desired human gate but must be documented so it is not mistaken for a
  stalled deploy.
- **Direct pushes to main would skip CI** under the new model. Mitigation:
  the repo is PR-only today (branch protection). Confirm and keep it that way;
  a direct push to main would otherwise reach the release PR un-validated.
- **Release-please config must be correct** — a misconfigured manifest could
  produce empty/no releases and silently stop all prod deploys. Add a smoke check
  / alert that a release was produced when expected.
- **Verification caveat (operator-attended):** a PR preview channel cannot
  exercise a deploy-_trigger_ change. The runner's preview-based verification does
  **not** fully cover this ADR's impl — an operator must confirm actual deploy
  behavior after merge (watch the first post-release deploy fire, and confirm a
  plain merge no longer deploys).

## Alternatives Considered

1. **Status quo — deploy on every merge to main.** Rejected: redundant CI and
   unintentional, unversioned prod churn (the motivating problem).
2. **Manual promotion gate on every merge** (e.g. environment approval).
   Rejected: adds friction to every change; the release PR already provides the
   batched gate.
3. **Tag-push trigger without release-please** (`on: push: tags`). Workable but
   discards the changelog/version automation release-please already provides.
   Rejected in favor of the existing tooling.
4. **Keep the per-merge `ci.yml` re-run "just in case."** Rejected: the release
   PR is itself a PR to main and runs full CI on the integrated state, so the
   per-merge re-run is pure duplication.

## Acceptance (mirrors #707)

- [x] This ADR accepted (status Accepted; operator-approved 2026-05-25), `needs-product-review` cleared on merge.
- [ ] Prod deploys only on a release-please release.
- [ ] Full CI runs on PRs and on the release PR; no redundant per-merge re-run.
- [ ] `workflow_dispatch` manual deploy retained.
- [ ] README ADR index updated to list 002, 003, 004.
