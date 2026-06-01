# ADR-008: AI-enable Toast Stats — thin **local** MCP server over the public snapshot CDN

## Status

**Accepted** (revised 2026-05-31). Originally **Proposed** as a remote MCP server gated
behind a "Phase 0" deep-link library; **revised** after operator review to a **thin, local
(self-installed) MCP server that reads the CDN and performs no computation**, and a build
epic is filed. Epic [#1009](https://github.com/taverns-red/toast-stats/issues/1009)
(spike, #1018) → build epic (see _Decision_).

> **Revision note (2026-05-31).** The first cut of this ADR recommended a **remote** MCP
> server, sequenced behind a zero-cost **Phase 0** "ask/deep-link library." Operator review
> rejected both:
>
> - **Phase 0 is dropped entirely.** It was a curated link list wearing an "AI-native"
>   costume — it answers only pre-curated questions and does not advance the open-ended brief.
>   It is not in scope and will not be built.
> - **Remote → local.** The remote server's only material cost was an always-on hosted
>   surface a one-operator org must keep up (this ADR's original #1 objection). A **local,
>   self-installed** MCP server deletes that cost: it runs on the user's machine, so there is
>   **no hosting, no on-call, and CORS/auth are moot** (local process reading public data).
> - **Thin, no computation.** The server exposes the **pre-computed snapshot fields** the
>   pipeline already writes (e.g. `recognitionState`, `regionAdvisorVisitMet`); it does **not**
>   import `analytics-core` or re-derive any rule. This makes it strictly a
>   _retrieval-and-explain_ surface whose answers are the same bytes the website shows — the
>   strongest possible grounding claim, and it removes the recognition-rule single-sourcing
>   precondition (#799) a "fat"/compute design would have required.

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
   club / area / division / district granularity the example questions need. **Verified
   2026-05-31:** `GET https://cdn.taverns.red/v1/latest.json` → `200`,
   `application/json`, `cache-control: public,max-age=300`; the path is `v1/`-namespaced
   so a tool pinned to `v1` is contract-stable across pipeline changes.
2. **The two motivating questions are answerable from existing computed fields** — no
   new pipeline computation is required. Charter risk → `club-health-status` +
   `charterPayments` / chartered counts; round-2 visits → `regionAdvisorVisitMet` and the
   visit-qualifying fields ([#974](https://github.com/taverns-red/toast-stats/issues/974)).
   Because these are **pre-computed**, a thin reader can answer them without deriving anything.
3. **There is no existing AI/MCP surface in the org** — verified empty in `taverns-red/ops`
   and `red-vote`, and no prior thoughts in Open Brain. This is greenfield, and whatever
   primitive we pick becomes the org's first AI pattern across the 5-product Red Taverns
   ecosystem.
4. **Two distinct user segments.** The **in-app district leader** (the product spec's named
   primary user) who uses the React SPA and never opens a Claude client; and the **Claude /
   MCP power-user** (the operator, plus any MCP-using leaders) who lives in MCP-capable
   clients. The local MCP serves the second segment; the first is explicitly **out of scope
   for this ADR** and is addressed, if ever, by a future BYO-key in-app panel (see
   _Future consumers_).

The architecture's core virtue today is that the read path is **static**: GCS→CDN→SPA with
no live backend, which is why it is cheap and never pages anyone. A **local** MCP preserves
that virtue exactly — it adds **no standing server** to the org.

## The queryable data surface (the AI's corpus)

This inventory IS the corpus the MCP tools read. All datasets are JSON, keyed by
`districtId` (e.g. `"61"`, `"F"`) and optionally `date` (YYYY-MM-DD) or `programYear`,
validated by Zod schemas in `packages/shared-contracts/src/` — the MCP reuses these as
**read-schemas**, not as a computation dependency.

**Discovery / routing**

| Dataset                   | CDN path                              | Purpose                          |
| ------------------------- | ------------------------------------- | -------------------------------- |
| Manifest                  | `v1/latest.json`                      | current `latestSnapshotDate`     |
| Dates index               | `v1/dates.json`                       | all available snapshot dates     |
| District snapshot index   | `config/district-snapshot-index.json` | per-district available dates     |
| Latest-successful pointer | `snapshots/latest-successful.json`    | fast constant-time latest lookup |
| Club→district index       | `config/club-index.json`              | resolve a club to its district   |

**Core analytics (all pre-computed; the MCP reads these fields verbatim)**

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
aggregated to decision granularity. A **thin reader** that surfaces these fields — and refuses
to invent anything not present — captures the open-ended-query value at the lowest possible
liability.

## Options evaluated

Scored across: freshness vs cadence, auth/privacy (data is public → low), cost,
build+maintenance effort, primary user served, grounding/hallucination risk, GCS→CDN fit,
ecosystem reuse.

| #   | Option                                             | Cost                                                  | Effort                                             | Serves                   | Grounding risk                                                         | Standing liability     | Verdict                                     |
| --- | -------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------- | ---------------------- | ------------------------------------------- |
| 1   | **Thin _local_ MCP** (reads CDN, no compute)       | ~0 (user's own Claude infers; user's machine runs it) | Low (Zod read-schemas map ~1:1 to MCP tools)       | Claude/MCP power-user    | **Lowest** — returns the same pre-computed bytes the site shows        | **None** — no hosting  | **Recommend (build)**                       |
| 1b  | _Fat_ local MCP (imports analytics-core, computes) | ~0 hosting                                            | Higher — + recognition-rule single-sourcing (#799) | same                     | Higher — read-path vs compute-path can diverge (the #800 class of bug) | None                   | Deferred — revisit if what-ifs are demanded |
| 2   | Remote MCP server                                  | Low box cost, but **always-on**                       | Moderate                                           | same                     | Lowest                                                                 | **Yes — on-call**      | Rejected for now (hosting liability)        |
| 3   | In-app NL chat panel (org-funded model)            | Highest recurring (per-query inference)               | Highest (full React feature + eval harness)        | in-app leader            | Moderate                                                               | Yes (live LLM backend) | Deferred (see _Future consumers_)           |
| 4   | Structured query + RAG                             | High (vector store + re-embed per snapshot)           | Highest infra                                      | neither without a client | Moderate–high, self-inflicted                                          | Yes                    | **Reject**                                  |

**Why RAG is rejected outright:** embeddings/vector retrieval earn their keep on large
unstructured corpora. This data is small, structured, and query-ready as files; RAG would
manufacture a re-indexing staleness layer, recurring infra cost, and retrieval-hallucination
risk that a direct typed read eliminates.

**Why thin beats fat (for now):** a fat MCP that computes would need recognition logic
single-sourced in `analytics-core` first (#799 — still unconsolidated; frontend
`divisionStatus.ts` / `divisionGapAnalysis.ts` hold parallel copies, the #800 root cause), and
would introduce a read-path-vs-compute-path divergence risk — the exact failure class that has
recurred in this repo. A thin reader has **one** answer for each field: the pre-computed one.
The cost is that it can only answer what the pipeline already wrote (no what-ifs) — accepted,
because the motivating questions are pre-computed fields, and a wave of unanswerable what-ifs
would be the _evidence_ to justify the fat layer later.

## Decision

**Build a thin, local (self-installed) read-only MCP server over the public snapshot CDN. No
computation, no `analytics-core` dependency, no hosting. Drop the originally-proposed Phase 0
deep-link library entirely.**

Rationale, in order of weight:

1. **Local deletes the only real objection.** The original ADR gated the MCP build on an
   on-call/maintenance condition because it assumed a _remote_ server. A local server has no
   standing surface to maintain — it runs on the user's machine. The build gate is therefore
   removed; there is no always-on liability to gate against.
2. **Thin = strongest grounding + zero rule-drift.** The server returns the pre-computed field
   the pipeline already wrote (`recognitionState`, tier, visit-met). The agent's numeric
   answer is the same byte the website shows, so the MCP cannot contradict the site, and there
   is no second implementation of any rule to drift (no #799 precondition, no #800-class risk).
3. **The data's shape decides it.** Public, versioned, file-addressable, Zod-schematized,
   pre-aggregated. The read tools wrap the existing CDN layout (`v1/latest.json → dates →
per-district JSON`) and `shared-contracts` read-schemas almost 1:1, touching the pipeline
   **not at all**.
4. **It serves the operator's center of gravity** (a Claude/MCP-heavy workflow) and seeds the
   reusable org pattern (thin local MCP over public CDN data) that Red Vote / Red Club can
   clone — without committing any product to a hosted service.

**Non-negotiable design rules for the build:**

- **Read-only, no computation.** Tools fetch CDN JSON, validate with `shared-contracts`
  read-schemas, and return fields. They never derive a tier, threshold, or recognition state.
- **No `analytics-core` import.** If a question requires computation the snapshot doesn't
  already answer, the tool returns _"not available for this date/field"_ — it never guesses.
- **Pin to `v1/`** for contract stability; surface the snapshot `date` in every response.
- **Cite the source.** Every tool result includes the exact CDN URL it read, so a human can
  verify against the live site.

## Build plan (the filed epic)

A thin local MCP server, distributed as an installable package (e.g. `npx`-runnable / MCP
client config entry), exposing read-only tools over the corpus above, typed from
`shared-contracts`. Indicative tools: `list-districts`, `get-latest-date`,
`get-district-snapshot`, `query-rankings`, `get-club-health`, `get-time-series`,
`resolve-club`. Success = the two motivating questions answered end-to-end from a Claude
client against the live CDN, each answer carrying the source URL.

The epic and its sprints are tracked in GitHub and wired into META-EPIC #606.

## Future consumers (explicitly deferred, not part of this build)

The thin read layer is designed so these can be added later **without** re-litigating grounding:

- **BYO-key in-app chat panel.** A browser chat where the leader supplies their own model API
  key; the SPA feeds it CDN data it already fetches (CORS verified: `cdn.taverns.red` echoes
  `access-control-allow-origin: https://ts.taverns.red`). $0 inference for the org. Serves the
  in-app leader segment the local MCP does not. Power-user feature (requires a key); deferred
  until demand is shown.
- **Remote MCP.** Only if a sibling product commits to consuming it or a non-trivial cohort
  needs zero-install access — at which point the hosting/on-call cost becomes justified.
- **Fat / compute MCP.** Only if leaders demand what-if questions the pre-computed fields
  can't answer; requires the #799 recognition-logic consolidation first.

## Falsification

The thin-local recommendation was reached by attacking the prior remote/fat/Phase-0 design:

- **"Phase 0 advances the brief."** Rejected — it answers only pre-curated questions; the brief
  is open-ended. Dropped.
- **"Remote is needed for reach."** Rejected for now — local serves the power-user segment with
  zero hosting; reach (zero-install) is a future-remote trigger, not a launch requirement.
- **"Fat MCP gives better answers."** Rejected for now — compute introduces a second answer
  path (the #800/#799 risk) for marginal gain on questions nobody has yet asked. Thin first;
  fat on evidence.
- **Honest residual risk:** thin can only answer pre-computed fields. If real usage produces a
  steady stream of unanswerable what-ifs, that is the signal to build the fat/compute layer
  (after #799). Tracked, not pre-built.

**Conditions to revisit:** add the BYO-key in-app panel if the in-app leader segment asks for
conversational access; add remote MCP if a sibling commits or zero-install demand appears; add
the fat/compute layer if what-if demand is measured.

## Consequences

### Positive

- AI-native open-ended querying with **no pipeline change, no computation, and no hosting**.
- Strongest grounding of any LLM option — answers are the pipeline's own bytes; the MCP cannot
  disagree with the website.
- No recognition-rule single-sourcing precondition (#799) and no #800-class divergence risk.
- Seeds a reusable, public-data, thin local MCP pattern for the Red Taverns ecosystem.

### Negative

- Serves the Claude/MCP power-user, **not** the in-app-only leader (deferred to a future
  BYO-key panel).
- Cannot answer what-if / derived questions the snapshots don't pre-compute — by design.
- A published package to version (mitigated: `v1/` contract pinning; no server to operate).
- Local install = no central usage telemetry; demand signals come from direct operator/leader
  feedback rather than logs.

## Alternatives Considered

- **Phase 0 deep-link library** — **dropped.** Pre-curated only; fails the open-ended brief.
- **Remote MCP** — deferred; reintroduces the always-on hosting/on-call liability a local
  server avoids.
- **Fat / compute MCP** — deferred; needs #799 consolidation and adds read-vs-compute
  divergence risk.
- **In-app org-funded NL chat (option 2)** — deferred; per-query inference cost + live-LLM
  coupling to a deliberately static SPA. A BYO-key variant ($0 to the org) is the preferred
  future form.
- **Structured query + RAG (option 4)** — rejected; mismatched to small, schematized,
  aggregated tabular data.

## Related

- [ADR-001](001-cdn-only-frontend.md) — CDN-only frontend (the static read path this preserves)
- [ADR-007](007-data-serving-gcs-cdn-lb-over-firebase.md) — GCS + Cloud CDN data serving (the corpus host)
- Epic [#1009](https://github.com/taverns-red/toast-stats/issues/1009) — AI-native Toast Stats spike; Sprint 1 [#1018](https://github.com/taverns-red/toast-stats/issues/1018)
- #799 / #800 — recognition-logic single-sourcing (the precondition a _fat_ MCP would need; not required by this thin design)
- `packages/shared-contracts/src/schemas/` — the Zod read-schemas the MCP reuses
- `frontend/src/services/cdn.ts`, `frontend/src/services/cdnTimeSeries.ts` — the read surface inventoried above
