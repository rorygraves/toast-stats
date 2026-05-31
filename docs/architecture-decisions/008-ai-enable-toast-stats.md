# ADR-008: AI-enable Toast Stats — read-only MCP server over the public snapshot CDN

## Status

**Proposed** (2026-05-31). Research spike → recommendation. No build is committed by this
ADR; the operator reviews the recommendation before any build epic is filed.
Epic [#1009](https://github.com/taverns-red/toast-stats/issues/1009) (Sprint 1, #1018).

> **Filename note.** Epic #1009 templated the path as
> `docs/strategy/decisions/NNNN-…-2026-MM-DD.md` — that is the **ops** repo's ADR
> convention (`taverns-red/ops`). This repo's established convention is
> `docs/architecture-decisions/NNN-slug.md` (see ADR-001…007 + the directory
> [README](README.md)). To avoid fragmenting ADRs across two directories, this ADR
> follows the repo convention; the date lives in this header, not the filename.

## Context

Epic #1009 asks: what is the best way to make Toast Stats an **AI-native** environment
that can answer (or facilitate answering) open-ended questions about district data —
e.g. _"which clubs in Division B are at risk of losing charter?"_, _"who hasn't had a
round-2 visit?"_

The decision is shaped by four facts that are authoritative for this repo:

1. **The data is already an AI-ready corpus.** Toast Stats serves ~14 distinct,
   Zod-schematized JSON datasets as **public**, pre-computed, file-addressable snapshots
   on a CDN (`cdn.taverns.red`), written by a scheduled GCS→CDN pipeline at daily-ish
   cadence ([ADR-007](007-data-serving-gcs-cdn-lb-over-firebase.md),
   [ADR-001](001-cdn-only-frontend.md)). The data is pre-aggregated to exactly the
   club / area / division / district granularity the example questions need.
2. **The two motivating questions are answerable from existing computed fields** — no
   new pipeline computation is required. Charter risk → `club-health-status` +
   `charterPayments` / chartered counts; round-2 visits → `regionAdvisorVisitMet` and the
   visit-qualifying fields ([#974](https://github.com/taverns-red/toast-stats/issues/974)).
3. **There is no existing AI/MCP surface in the org** — verified empty in `taverns-red/ops`
   and `red-vote`, and no prior thoughts in Open Brain. This is greenfield, and whatever
   primitive we pick becomes the org's first AI pattern across the 5-product Red Taverns
   ecosystem (shared Clerk auth available).
4. **Two distinct user segments.** The **in-app district leader** (the product spec's named
   primary user) who uses the React SPA and never opens a Claude client; and the **Claude
   power-user** (the operator, plus any Claude-using leaders) who lives in MCP-capable clients.

The architecture's core virtue today is that the read path is **static**: GCS→CDN→SPA with
no live backend, which is why it is cheap and never pages anyone. Any recommendation must
weigh new standing surface against delivered user value — this is a one-operator, "no-build"
org by default.

## The queryable data surface (the AI's corpus)

This inventory IS the corpus any AI option would query. All datasets are JSON, keyed by
`districtId` (e.g. `"42"`, `"F"`) and optionally `date` (YYYY-MM-DD) or `programYear`,
validated by Zod schemas in `packages/shared-contracts/src/`.

**Discovery / routing**

| Dataset                   | CDN path                              | Purpose                          |
| ------------------------- | ------------------------------------- | -------------------------------- |
| Manifest                  | `v1/latest.json`                      | current `latestSnapshotDate`     |
| Dates index               | `v1/dates.json`                       | all available snapshot dates     |
| District snapshot index   | `config/district-snapshot-index.json` | per-district available dates     |
| Latest-successful pointer | `snapshots/latest-successful.json`    | fast constant-time latest lookup |
| Club→district index       | `config/club-index.json`              | resolve a club to its district   |

**Core analytics**

| Dataset                      | CDN path                                            | Key queryable fields                                                                                                                                                     | Schema                                          |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| District rankings (current)  | `v1/rankings.json`                                  | ranks, payments, distinguished tiers                                                                                                                                     | `all-districts-rankings`                        |
| District rankings (dated)    | `snapshots/{date}/all-districts-rankings.json`      | paidClubs, clubGrowth%, payments, distinguished D/S/P/Smedley, prerequisite flags (DSP, training, market-analysis, comms-plan, regionAdvisorVisitMet), payment breakdown | `all-districts-rankings`                        |
| District full snapshot       | `snapshots/{date}/district_{id}.json`               | per-club roster (clubId, division, area, membership, payments, dcpGoals, status), division/area aggregates, district totals, raw `clubPerformance`/`divisionPerformance` | `district-statistics-file`, `per-district-data` |
| Competitive awards           | `snapshots/{date}/competitive-awards.json`          | extension / 20+ / retention rankings, Distinguished-District tier + gaps, Club Strength, Leadership Excellence, officer awards                                           | `cdn.ts` (`CompetitiveAwardStandings`)          |
| Club health status           | (per club, in snapshot)                             | thriving / vulnerable / intervention-required classification                                                                                                             | `club-health-status`                            |
| Rank history (per district)  | `v1/rank-history/{districtId}.json`                 | date-series of ranks + aggregate score                                                                                                                                   | —                                               |
| Time-series metadata         | `time-series/district_{id}/index-metadata.json`     | available program years                                                                                                                                                  | `time-series`                                   |
| Time-series data             | `time-series/district_{id}/{programYear}.json`      | membership/payments/dcpGoals/distinguished over time, club-count buckets, summary                                                                                        | `time-series`                                   |
| Snapshot metadata / manifest | `snapshots/{date}/metadata.json`, `…/manifest.json` | run status, successful/failed districts                                                                                                                                  | `snapshot-metadata`, `snapshot-manifest`        |

**Implication for AI design:** the data is small, structured, schema-versioned, and already
aggregated to decision granularity. That fact drives the decision below — it rewards a
**typed, deterministic** access surface and penalizes anything that re-indexes or
embeds it.

## Options evaluated

Scored across: freshness vs cadence, auth/privacy (data is public → low), cost,
build+maintenance effort, primary user served, grounding/hallucination risk, GCS→CDN fit,
ecosystem reuse.

| #   | Option                                      | Cost                                                                      | Effort                                                       | Serves                                              | Grounding risk                                     | Ecosystem reuse                              | Verdict                                               |
| --- | ------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| 1   | **Read-only MCP server** over the snapshots | Very low (no model hosting — user's own Claude infers; CDN absorbs reads) | Low–moderate (Zod contracts map ~1:1 to MCP tools/resources) | Claude power-user (**not** the in-app leader alone) | **Lowest** — typed rows from schematized snapshots | **Highest** — first reusable org MCP pattern | **Recommend (as the AI-native primitive)**            |
| 2   | In-app NL chat panel                        | Highest recurring (per-query inference)                                   | Highest (full React feature + eval harness)                  | In-app leader                                       | Moderate — must build grounding yourself           | Low — bespoke per product                    | Secondary / phase-2                                   |
| 3   | Prompt / "ask" deep-link library            | ≈0 (static config)                                                        | Lowest (days)                                                | In-app leader                                       | **Zero** (no LLM in the numeric path)              | Low–moderate (UX pattern)                    | **Ship first as baseline** (not AI-native on its own) |
| 4   | Structured query + RAG API                  | High (vector store + re-embed per snapshot)                               | Highest infra                                                | Neither without a client on top                     | Moderate–high, self-inflicted                      | Over-engineered for tabular data             | **Reject**                                            |

**Why RAG is rejected outright:** embeddings/vector retrieval earn their keep on large
unstructured corpora. This data is small, structured, and query-ready as files; RAG would
manufacture a re-indexing staleness layer, recurring infra cost, and retrieval-hallucination
risk that a typed query eliminates. For _"clubs in Division B…"_ a deterministic typed query
beats semantic retrieval every time.

## Decision

**Recommend a read-only remote MCP server (option 1) as the AI-native primitive — but
sequence it behind a zero-cost ask/deep-link library (option 3) shipped first, and gate the
MCP build on two falsifiable demand signals.**

Rationale, in order of weight:

1. **Only option 1 is genuinely AI-native.** The brief is _open-ended_ questions. The ask
   library answers only pre-curated questions; MCP lets any Claude client compose arbitrary
   queries over the typed datasets. Options 2 and 4 are AI-native too but at far higher cost,
   effort, and grounding risk.
2. **The data's shape decides it.** Public, versioned, file-addressable, Zod-schematized,
   pre-aggregated. A read-only MCP server wraps the existing contracts almost 1:1
   (`list-districts`, `get-club-health`, `query-rankings`, `get-time-series`) and touches
   the pipeline **not at all** — the `v1/latest.json → dates → per-district JSON` layout is
   already a de-facto resource tree.
3. **Lowest grounding risk of the LLM options.** The model receives exact typed rows;
   tool-shaped responses keep it on rails. (See the honest caveat in _Falsification_ below.)
4. **It serves the operator's actual center of gravity** — a Claude/MCP-heavy workflow with
   zero existing AI surface — and seeds the reusable org-wide pattern (read-only remote MCP
   over public CDN data) that Red Vote / Red Club can clone.

**Sequencing (this is the falsification-driven part):**

- **Phase 0 — ship the ask/deep-link library first.** It is a static JSON/markdown artifact
  pointing at views that **already exist** (the app already ships `?regions=`, `?q=`,
  `?pinned=`, `?sort=&dir=`, the "Close to Distinguished" preset, and deep-linkable
  division/area/analytics/trends routes — #969, #974). It serves the **majority in-app
  leader** natively, costs ≈0, adds no hosting, and has structurally zero hallucination risk.
  It also doubles as the **demand probe** for the MCP layer.
- **Phase 1 — thin MCP POC** over 2–3 datasets, gated on the conditions below.

## POC plan (scoped — the recommended option, not a build commitment)

**Phase 0 — ask library (days).** Curate ~10 parameterized deep-link templates keyed to the
example questions ("clubs close to Distinguished in my division", "areas missing a round-2
visit", "fastest-declining clubs this program year"). Static artifact + a small launcher UI
reusing existing route/preset state. No backend. Validates whether leaders want guided
answers and surfaces which open-ended questions the templates _can't_ express — that gap is
the MCP demand signal.

**Phase 1 — read-only MCP POC (1–2 weeks, gated).** A stateless remote MCP server (HTTP/SSE
transport) on the existing Cloud Run footprint, exposing **read-only** tools over 2–3 datasets
to start (rankings, district snapshot, club-health), typed from `shared-contracts`. No
writes, no inference hosting, no new pipeline stage. Public data ⇒ no auth needed for
correctness; shared Clerk available later for optional rate-limiting. Success = the two
motivating questions answered end-to-end from a Claude client against staging CDN data, with
every answer carrying a deterministic deep link back to the source view for human verification.

**Build-gate conditions (must hold before Phase 1):**

1. Evidence that Claude-using district leaders exist in **non-trivial numbers** (not a
   population of ~1), OR a sibling product (Red Vote / Red Club) **commits** to consuming the
   same MCP pattern so the ecosystem-reuse value stops being speculative.
2. The operator can commit to maintaining a new always-on remote service alongside the
   existing pipeline/runner on-call.

If neither holds, **ship Phase 0 only** and revisit.

## Falsification (the MCP-leading hypothesis was attacked, not assumed)

Per the epic DoD, the MCP-leading hypothesis was adversarially tested. It **survives as the
AI-native primitive** but the attack changed the recommendation's _shape_ (hence Phase 0
first). The strongest counter-arguments, recorded honestly:

- **Primary-user inversion.** The product spec names "Toastmasters district leaders" as the
  primary user and has previously rejected complexity-without-user-value (the "real-time
  updates" decision). MCP serves the Claude power-user; the in-app leader who never opens a
  Claude client "is unaddressed by this option alone" (option-1's own admission). Optimizing
  purely on the scored columns risks favoring builder ergonomics + ecosystem speculation over
  delivered leader value. **Mitigation:** Phase 0 ships leader value first and gates MCP on
  real demand.
- **Standing-liability mismatch.** A one-operator no-build org's core virtue is a static read
  path. "Very low cost" prices the box, not the on-call — a server must never be down and is
  maintained by the same single operator. **Mitigation:** the build-gate's on-call condition.
- **Grounding risk is understated by framing.** Typed tools constrain _retrieval_, not the
  natural-language _claim_ built on top ("District X is at charter risk"). For decision-grade
  numbers, any LLM-mediated answer has a confidently-wrong tail a deterministic view does not.
  **Mitigation:** every MCP answer pairs with a deterministic deep link to the source view.

**Conditions to revisit this ADR:** flip toward "ask-library-only" if no measured Claude-using
leader cohort emerges and no sibling commits; flip fully toward MCP-first if usage telemetry /
leader interviews show a growing conversational-query cohort, a sibling product adopts the
pattern, or the ask library ships and leaders explicitly request free-form questions the
templates can't express.

## Consequences

### Positive

- AI-native open-ended querying with **no pipeline change** and no new computation.
- Leader value this sprint via Phase 0 at ≈0 cost.
- Seeds a reusable, public-data, read-only MCP pattern for the Red Taverns ecosystem.
- Grounding risk minimized by typed tools + mandatory deep-link-to-source.

### Negative

- Phase 1 adds the org's first always-on hosted read surface — a maintenance/on-call
  liability for a one-operator org (gated, not unconditional).
- MCP alone does not serve the in-app-only leader; that segment is served by Phase 0 (and a
  future in-app chat panel built _on_ the MCP layer, if ever justified).

## Alternatives Considered

- **In-app NL chat panel (option 2)** — the only option that natively serves the in-app
  leader, but highest cost (per-query inference, org-funded), highest effort (full React
  feature + eval harness), and couples the deliberately-static SPA to a live LLM backend.
  Deferred as a phase-2 secondary built _on top of_ the MCP data layer if leader demand proves out.
- **Prompt / ask library (option 3)** — adopted as **Phase 0**, but rejected as _the_
  AI-native answer because it only addresses pre-curated questions and fails the open-ended brief.
- **Structured query + RAG (option 4)** — rejected: embeddings/RAG are mismatched to small,
  schematized, aggregated tabular data; they add cost, staleness, and self-inflicted
  retrieval-hallucination risk that typed MCP queries eliminate.

## Related

- [ADR-001](001-cdn-only-frontend.md) — CDN-only frontend (the static read path this preserves)
- [ADR-007](007-data-serving-gcs-cdn-lb-over-firebase.md) — GCS + Cloud CDN data serving (the corpus host)
- Epic [#1009](https://github.com/taverns-red/toast-stats/issues/1009) — AI-native Toast Stats spike; Sprint 1 [#1018](https://github.com/taverns-red/toast-stats/issues/1018)
- `packages/shared-contracts/src/schemas/` — the Zod contracts that map ~1:1 onto MCP tools/resources
- `frontend/src/services/cdn.ts`, `frontend/src/services/cdnTimeSeries.ts` — the read surface inventoried above
