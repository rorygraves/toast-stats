# Lesson Corpus Audit — 2026-05-23

**Issue:** #651 (Sprint 0 of epic #647 — Lesson curation: relevance-driven loading)
**Author:** autonomous sprint-runner session `sprint-651`
**Scope:** Inventory and categorize the **entire** lesson corpus before any
restructure ships (Sprint 1 #648 applies these recommendations mechanically).
**Constraint honoured:** No lesson file was moved or edited. Audit only.

---

## 1. Corpus at a glance

The corpus lives in two homes and totals **154 lessons**:

| Source    | Where                                                                | Count   |
| --------- | -------------------------------------------------------------------- | ------- |
| Per-file  | `tasks/lessons/*.md` (052–096, incl. duplicate-numbered 085/086/092) | 50      |
| Bulk      | `tasks/lessons.md` (~1,013 lines, pre-migration historical log)      | 104     |
| **Total** |                                                                      | **154** |

> The sub-issue estimated "~150 lessons … 46 per-file (083 onwards)". The real
> per-file floor is **052**, not 083 — there are 50 per-file lessons. The bulk
> file holds 104. The estimate was close; the exact figure is 154.

### Category distribution

| Category       | Definition                                    | Count   | %    | Disposition                                                 |
| -------------- | --------------------------------------------- | ------- | ---- | ----------------------------------------------------------- |
| **principle**  | Transferable rule beyond its sprint's context | 49      | 32%  | Candidate to graduate to `tasks/rules.md` (Sprint 2 #649)   |
| **lesson**     | Situational warning, true in some contexts    | 75      | 49%  | Tag + keep; loaded via tag matching (Sprint 1 #648)         |
| **incident**   | Historical "we hit X, fixed Y" narrative      | 21      | 14%  | Reference only; mark `auto_load: false`, never auto-loaded  |
| **superseded** | A later lesson corrected/replaced this one    | 6       | 4%   | Annotate prominently with pointer to the superseding lesson |
| **noise**      | Restated commit message / trivially obvious   | 3       | 2%   | Annotate; do not auto-load                                  |
| **Total**      |                                               | **154** | 100% |                                                             |

By source: the per-file dir skews **principle/lesson** (40 of 50 are
principle or lesson, 0 noise) — recent authoring discipline is high. The bulk
file carries nearly all the **incident** (17/21), **superseded** (5/6) and
**noise** (3/3) — as expected for an append-only historical log.

---

## 2. Superseded and wrong lessons (explicit call-out)

Acceptance requires naming every superseded/wrong lesson. There are **6**:

| id                                                                               | title                      | superseded by                              | why                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **085-A** (per-file `085-screen-dms-socket-registration-can-lag-launch-success`) | "screen DM socket lag"     | **089** (`pipefail-plus-screen-ls-exit-1`) | **CONFIRMED.** 089 root-caused the `screen -ls` failure to `pipefail` + exit-1, not socket-registration lag. 089's own text states 085 "has been superseded … for the screen-ls case." The generic "eventual-visibility" idea survives, but the screen-ls **diagnosis is wrong**. Annotate 085-A with a banner pointing to 089. |
| **B-010**                                                                        | Express→CDN migration step | B-007 / B-009 cluster                      | Near-restatement of the same #173 migration insight.                                                                                                                                                                                                                                                                            |
| **B-011**                                                                        | Express→CDN migration step | B-007 / B-009 cluster                      | Same.                                                                                                                                                                                                                                                                                                                           |
| **B-012**                                                                        | Express→CDN migration step | B-007 / B-009 cluster                      | Same.                                                                                                                                                                                                                                                                                                                           |
| **B-013**                                                                        | Express→CDN migration step | B-007 / B-009 cluster                      | Same.                                                                                                                                                                                                                                                                                                                           |
| **B-053**                                                                        | react-refresh export rule  | B-041                                      | Direct duplicate of B-041's react-refresh-only-export rule.                                                                                                                                                                                                                                                                     |

**Noise (3, bulk):** B-034 (penultimate-retention — restated feature desc),
B-037 (club-detail subpage — commit restatement), B-038 (DCP projections move —
commit restatement). Thin transferable signal; annotate, do not auto-load.

**Near-overlaps deliberately KEPT (not flagged):** 067 ⊂ 073 (073 generalizes
067/R10 rather than replacing it); 068 + 071 (deliberate budget/corollary pair).
These are complementary, not redundant.

---

## 3. Principle-promotion shortlist (input to Sprint 2 #649)

49 lessons are tagged `principle`. The epic's acceptance asks for **≥5 R-rules
promoted**. The highest-value, most-recurring candidates (de-duplicated against
existing R1–R12):

| Source id          | Candidate rule                                                                                               | Why it earns permanence                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 092-D / B-043      | **After editing `packages/*/src/`, rebuild `dist/` before tests.**                                           | Recurred twice (#645, #621); CI hides it; bites every fresh-pull operator. Already in bootstrap prompt — graduate to an R-rule. |
| 083                | **An EXIT trap's return value becomes the script's exit code.**                                              | Pure, durable shell semantics; critical for all sprint-runner shell work; currently ages out of the "newest 5" window.          |
| 089                | **`set -o pipefail` + a command that exits 1 in a pipeline poisons the whole pipeline** (e.g. `screen -ls`). | Root-cause of a multi-incident family; supersedes 085.                                                                          |
| 51 (bulk) / memory | **Never raise `testTimeout` to mask slowness — tighten render scope.**                                       | Matches Ron's standing "no-timeout-bumps" guidance; recurs across flaky-test lessons (053, 078, 090).                           |
| 39 (bulk)          | **Module-level singletons leak across vitest files; export `reset()`, call in `beforeEach`.**                | Durable testing rule; cause of several historical flakes.                                                                       |
| B-021 (bulk)       | **Never use payment fields as member counts** (payments ≈ 2× members).                                       | Durable domain rule specific to this product's data.                                                                            |
| 086-A/B family     | **Close-then-tick ordering: advance the epic checkbox BEFORE closing the sub-issue.**                        | Runner correctness invariant (#626); already encoded in bootstrap prompt step 5.                                                |

Sprint 2 should also **annotate** the many bulk principles that already map to
existing rules (L02→R2, L09→R12, L10→R4, L14→R11, L15→R1, L20→R10, L22→R3,
L31→R6, L35/L45→R9) as "source of R{N}" rather than re-promoting them.

---

## 4. Proposed DoD softening (diff for global `~/.claude/CLAUDE.md`)

The current Full-DoD mandate — _"At least one insight added as a new file in
`tasks/lessons/`"_ — is the engine that produced 3 noise lessons and several
commit-message restatements. Not every sprint yields a transferable learning;
mandating one manufactures low-signal entries. Proposed softening:

```diff
 ##### 4. Persistence (Learning)

-- [ ] **Lessons Updated**: At least one insight added as a new file in
-      `tasks/lessons/` (per-file convention) — or appended to `tasks/lessons.md`
-      for projects that haven't migrated.
+- [ ] **Learning captured (only if there was one).** Not every sprint produces
+      a transferable insight — that is fine, and a "no new lesson" sprint is a
+      valid outcome. When the sprint DID surface something durable, file it by
+      kind:
+      - **Principle** (transferable rule) → add to `tasks/rules.md` as an
+        R-rule, or `tasks/lessons/` tagged `category: principle` pending
+        promotion.
+      - **Lesson** (situational warning) → `tasks/lessons/` with
+        `category: lesson` + `tags:` for relevance matching.
+      - **Incident** (one-off "we hit X, fixed Y") → `tasks/lessons/` with
+        `category: incident` + `auto_load: false`; reference-only, never loaded
+        into a session's context.
+      - A restated commit message is **not** a lesson. If you cannot name the
+        transferable takeaway in one sentence, do not file one.
```

The mirror change applies to this repo's `CLAUDE.md` ("Definition of Done →
Full DoD") and the `~/.claude/skills/sprint/SKILL.md` Phase-4 checklist. Sprint 1
applies all three in one commit.

---

## 5. Directory-structure recommendation — **Option X (flat + frontmatter)**

**Decision: adopt Option X** (keep a flat `tasks/lessons/`; category and load
behaviour become frontmatter fields). Reject Option Y (split into
`tasks/principles/` + `tasks/lessons/` + `tasks/incidents/`) **for this epic**.

Rationale:

1. **Epic scope already says so.** Epic #647's "Out of scope" explicitly defers
   the _"Three-tier taxonomy (`rules/` / `lessons/` / `incidents/` as separate
   dirs) — bigger structural change; revisit at Red Barkeep extraction."_
   Option Y would contradict the epic's own boundary.
2. **Sprint 1 already builds the machinery.** #648 adds tag frontmatter +
   `INDEX.md` + a loader change. Adding `category:` and `auto_load:` to that
   same frontmatter is near-zero marginal cost and gives Option Y's _real_
   benefit — _"never auto-load incidents"_ — via `auto_load: false`, with **no
   file moves**.
3. **File moves break cross-links and globs.** 154 files cross-reference each
   other with `[[name]]` links; tooling globs `tasks/lessons/*.md`. Moving 21
   incident + 6 superseded files breaks both for marginal organizational gain.
4. **The promotion path is `rules.md`, not a `principles/` dir.** Principles
   graduate to numbered R-rules (Sprint 2). A separate `principles/` dir would
   create a _second_ home for the same concept and blur the rules/lessons line
   the epic is trying to sharpen.

**Concretely, Option X means each lesson gains frontmatter:**

```yaml
---
id: 089
category: principle | lesson | incident | noise | superseded
tags: [bash, screen, sprint-runner]
auto_load: true # false for incident / noise / superseded
superseded_by: null # e.g. 089 on lesson 085-A
---
```

The loader (Sprint 1) reads `rules.md` + `INDEX.md` + tag-matched bodies where
`auto_load: true` + the 2 newest + the per-sprint manifest (Sprint 3). Incidents
and superseded lessons stay searchable but never pollute a session's context.

---

## 6. Acceptance check (this sprint)

- [x] Audit lists every lesson (154 rows) with category + recommended action — §7 below.
- [x] All superseded/wrong lessons identified (085-A + 5 bulk) — §2.
- [x] Proposed DoD diff included — §4.
- [x] Dir-structure recommendation (Option X) with rationale — §5.
- [x] No lesson files moved or edited — only this audit doc was added.

---

## 7. Full inventory

Three sub-tables, one per source range. `id` matches the lesson's leading
number; duplicate-numbered per-file lessons are disambiguated `-A`/`-B`; bulk
lessons without a number use a `B-NNN` file-order index.

### 7a. Per-file lessons 052–075

| id  | source   | title                                         | category  | tags                                  | action          | notes                                                                                       |
| --- | -------- | --------------------------------------------- | --------- | ------------------------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| 052 | per-file | Shared labels must share definition           | principle | frontend,scope,dcp                    | promote to rule | Transferable: audit shared labels for shared semantics; author flags it as R-rule candidate |
| 053 | per-file | Strip unused providers from tests             | principle | vitest,testing,flaky,frontend,react   | promote to rule | Explicit R12 candidate in text; provider-bloat audit transferable                           |
| 054 | per-file | Disabling forcing function risks discipline   | lesson    | tdd,ci,automation                     | tag + keep      | Process/discipline lesson tied to pre-push removal; ship-as-2-commits habit                 |
| 055 | per-file | isMilestone fires on current years            | lesson    | frontend,dcp                          | tag + keep      | Component-specific anniversary framing; consumers derive own temporal flag                  |
| 056 | per-file | Cache-primer hook calls rarely justified      | lesson    | react,hooks,performance,frontend      | tag + keep      | TanStack Query specific; delete-call-when-consumer-gone default                             |
| 057 | per-file | Year-cumulative metrics have base zero        | principle | dcp,analytics,data-pipeline           | promote to rule | Transferable accumulator-vs-stock reframe; recurs across metrics                            |
| 058 | per-file | Invisible select needs focus-within ring      | lesson    | accessibility,css,frontend            | tag + keep      | WCAG 2.4.7 pattern for invisible-overlay primitives                                         |
| 059 | per-file | Pin related queries to one snapshot           | principle | data-pipeline,react,hooks,frontend    | promote to rule | Transferable: thread resolved date through sibling date-versioned queries                   |
| 060 | per-file | Use program-specified percentage denominators | principle | dcp,analytics                         | promote to rule | Match awarding-body rules to the decimal; year-cumulative denominator = PY base             |
| 061 | per-file | Fix the formula everywhere                    | principle | monorepo,analytics,data-pipeline,dcp  | promote to rule | Grep all impls before declaring fix done; collector-cli vs analytics-core divergence        |
| 062 | per-file | Distinct badge families, distinct positions   | lesson    | frontend,css                          | tag + keep      | UX placement-as-disambiguator; row-badge specific                                           |
| 063 | per-file | Bullet bars vs stacked bars                   | lesson    | charts,frontend                       | tag + keep      | Chart-type-by-question guidance; somewhat transferable but UX-situational                   |
| 064 | per-file | Collapse adjacent empty states                | lesson    | frontend,css                          | tag + keep      | 2-up empty-state collapse pattern; UX-situational                                           |
| 065 | per-file | Zoom scale into clustered tier band           | lesson    | charts,frontend                       | tag + keep      | Bullet-bar scale-zoom algorithm; component-specific                                         |
| 066 | per-file | JSDOM style assertions miss positioning       | principle | vitest,testing,frontend,css           | promote to rule | Transferable: assert structural ancestor for absolute-positioned elements                   |
| 067 | per-file | Dark-mode overrides track color utilities     | lesson    | dark-mode,css,frontend                | tag + keep      | Maintenance discipline; overlaps R10 and lesson 73                                          |
| 068 | per-file | Tab merge cascades into tests                 | lesson    | vitest,testing,frontend               | tag + keep      | Estimate test-rewrite at 5-10x component diff; IA-refactor situational                      |
| 069 | per-file | screen -ls writes to stderr                   | lesson    | bash,screen,sprint-runner,automation  | tag + keep      | macOS BSD-specific; verify which stream before piping                                       |
| 070 | per-file | setSearchParams prev races in batch           | lesson    | router,react,hooks,frontend           | tag + keep      | React Router useSearchParams same-batch race; bail on no-op                                 |
| 071 | per-file | Tab-strip retirement deletes test code        | lesson    | vitest,testing,frontend               | tag + keep      | Corollary to 068; delete tab-flow integration tests when widget gone                        |
| 072 | per-file | IO callbacks tolerate mock shapes             | lesson    | vitest,testing,react,frontend         | tag + keep      | Guard entry.target?.id against test-local IO mocks                                          |
| 073 | per-file | Opacity variants need dark overrides          | lesson    | dark-mode,css,frontend                | tag + keep      | Generalises R10; overlaps lesson 67. Has automated guard test                               |
| 074 | per-file | Small-text contrast: tighten vs stop          | lesson    | accessibility,css,dark-mode,frontend  | tag + keep      | WCAG AA scoping discipline; fix failures, leave passing marginals                           |
| 075 | per-file | axe-core JSDOM misses contrast                | principle | accessibility,vitest,testing,frontend | promote to rule | Transferable: pair axe with static allowlist guard; JSDOM can't compute contrast            |

### 7b. Per-file lessons 076–096

| id    | source   | title                                     | category   | tags                              | action              | notes                                                                                                                                                                                                                 |
| ----- | -------- | ----------------------------------------- | ---------- | --------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 076   | per-file | Shared formula helper, inline calls       | principle  | monorepo,analytics,tdd            | promote to rule     | Extract pure fn + inline at call site; delete lockstep comments. Generalizable cross-package dedup rule.                                                                                                              |
| 077   | per-file | Override classes, not variants            | principle  | frontend,react,css                | promote to rule     | Presentational extraction: className props over variant enums. Transferable refactor discipline.                                                                                                                      |
| 078   | per-file | Journey flake closed upstream             | incident   | testing,flaky,vitest              | archive (incident)  | #525 closure record; the don't-fix-a-non-repro-flake principle is reusable but the file is a closing narrative.                                                                                                       |
| 079   | per-file | Suspense fallback for null is CLS         | principle  | frontend,react,cls,performance    | promote to rule     | Hoist null-guard into lazy wrapper. Clear transferable WCAG/CLS rule.                                                                                                                                                 |
| 080   | per-file | New surface lives with its data           | principle  | frontend,router,scope             | promote to rule     | Place surface next to data it reads, trust data over stale stub. Transferable.                                                                                                                                        |
| 081   | per-file | Deferral test is a budget check           | principle  | testing,performance,cls,brand     | promote to rule     | Negative-assertion deferral = budget check; measure before flipping. Strong transferable rule.                                                                                                                        |
| 082   | per-file | Assert lint behavior not severity         | principle  | ci,testing,tdd                    | promote to rule     | Lint a known-bad snippet, not config severity. Transferable enforcement-test rule.                                                                                                                                    |
| 083   | per-file | EXIT trap return is exit code             | principle  | bash,automation                   | promote to rule     | Cleanup trap must end return 0. Classic transferable bash rule.                                                                                                                                                       |
| 084   | per-file | Doc examples are valid input              | principle  | bash,automation,prompts           | promote to rule     | Sample matching lines in parsed input are real input. Transferable parsing rule.                                                                                                                                      |
| 085-A | per-file | screen -dmS socket lag                    | superseded | screen,bash,automation,flaky      | annotate-superseded | slug screen-dms-socket-registration-can-lag-launch-success. CONFIRMED superseded by 089: 089 states diagnosis was wrong, real cause was pipefail. eventual-visibility principle survives but screen-ls case is wrong. |
| 085-B | per-file | Subpage breadcrumb, no collision          | lesson     | frontend,router,accessibility     | tag + keep          | slug subpage-breadcrumb-the-collision-442-feared-doesnt-exist-on-sub-pages. UX lesson: record the precondition when removing UI. Situational.                                                                         |
| 086-A | per-file | Close-then-tick duplicate launch          | incident   | automation,sprint-runner          | archive (incident)  | slug close-then-tick-ordering-can-trigger-duplicate-sprint-launches. Runner race narrative; two-signal principle reusable but tied to runner.                                                                         |
| 086-B | per-file | Relaunch onto merged work                 | incident   | automation,sprint-runner          | archive (incident)  | slug sprint-runner-can-relaunch-onto-already-merged-but-unverified-work. Verify ship-state narrative; diverged-branch tip useful.                                                                                     |
| 087   | per-file | Spawned sessions need own worktree        | lesson     | automation,sprint-runner,monorepo | tag + keep          | Worktree isolation + reconcile-against-truth-signals. Reusable in automation context.                                                                                                                                 |
| 088   | per-file | Single-action-per-tick false virtue       | incident   | automation,sprint-runner          | archive (incident)  | Runner design-philosophy reversal narrative; decouple cadence from progress is the takeaway.                                                                                                                          |
| 089   | per-file | pipefail + screen -ls exit 1              | principle  | bash,screen,automation,ci         | promote to rule     | pipefail foot-gun; exit code is part of API; isolate predicate under exact shell opts. Strong transferable bash rule. Supersedes 085-A for screen-ls.                                                                 |
| 090   | per-file | Vitest project split partition guard      | principle  | vitest,testing,ci                 | promote to rule     | Partition must be disjoint+exhaustive, sourced from tool's own resolution. Transferable test-infra rule.                                                                                                              |
| 091   | per-file | Bootstrap prompt scope explicit           | lesson     | prompts,automation,sprint-runner  | tag + keep          | Every conditional needs explicit case for each value. Situational to automated prompts.                                                                                                                               |
| 092-A | per-file | Re-skin replaces, not augments            | lesson     | frontend,scope,dcp                | tag + keep          | slug redesign-sprints-replace-not-augment-the-thing-being-reskinned. Inventory page before building; re-skin shrinks surface. Situational.                                                                            |
| 092-B | per-file | Re-skin tool already in file              | lesson     | frontend,charts,scope             | tag + keep          | slug reskin-the-tool-already-in-the-file-not-the-one-the-ticket-named. Ticket tool name is a hypothesis. Situational.                                                                                                 |
| 092-C | per-file | Ticket signature bends to data            | lesson     | analytics,hooks,scope             | tag + keep          | slug ticket-helper-signatures-bend-to-the-real-data-shape. Signature is sketch; match real consumer shape. Situational.                                                                                               |
| 092-D | per-file | Workspace dist gitignored, no rebuild     | lesson     | monorepo,build                    | tag + keep          | slug workspace-package-dist-is-gitignored-and-not-auto-rebuilt. Rebuild dist before local tests. Repo-specific but durable.                                                                                           |
| 093   | per-file | Non-remapping token is a dark trap        | principle  | dark-mode,css,accessibility       | promote to rule     | Use semantic remapping token over raw palette even when equal in light. Transferable dark-mode rule.                                                                                                                  |
| 094   | per-file | Dark utilities fail by asymmetry          | principle  | dark-mode,css,accessibility       | promote to rule     | Audit fg/bg utility pairs together; solve muted contrast against lightest dark bg. Transferable.                                                                                                                      |
| 095   | per-file | Size dark token bump for lightest surface | lesson     | dark-mode,css,accessibility       | tag + keep          | Global token bump sized to lightest dark surface; cascade last-wins in CSS-reading tests. Extends 094; situational corollary.                                                                                         |
| 096   | per-file | Catch-all sweep hides brand-token traps   | lesson     | dark-mode,css,accessibility       | tag + keep          | Fourth instance of 093 trap; audit-the-rule-not-the-render. Track D closing record; situational.                                                                                                                      |

### 7c. Bulk `tasks/lessons.md` (104 historical lessons)

| id    | source | title                                      | category   | tags                                | action              | notes                                                                                                                                            |
| ----- | ------ | ------------------------------------------ | ---------- | ----------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --- | ------------------------------------------ |
| 01    | bulk   | Validation gaps in façade layers           | principle  | data-pipeline, gcs                  | promote to rule     | path-traversal: validate at every path-building layer. Echoes tripwire validateDistrictId; candidate R-rule.                                     |
| B-001 | bulk   | designTokens split barrel re-export        | lesson     | frontend, monorepo, build           | tag + keep          | barrel re-export = zero-cost file split; verify real overlap before refactor.                                                                    |
| 02    | bulk   | Ephemeral runners need explicit syncs      | principle  | data-pipeline, gcs, ci              | promote to rule     | already covered by R2. Annotate as R2 source.                                                                                                    |
| 03    | bulk   | Date-aware charts beat index positioning   | lesson     | charts, frontend                    | tag + keep          | use calculateProgramYearDay for time-series x-axis.                                                                                              |
| 04    | bulk   | Summary vs full analytics granularity      | lesson     | analytics, data-pipeline            | tag + keep          | two endpoints same field name, different data range.                                                                                             |
| 05    | bulk   | Sparse input = sparse output               | lesson     | analytics, data-pipeline            | tag + keep          | trace sparsity to compute input scope, not output.                                                                                               |
| 06    | bulk   | Identify correct component first           | principle  | frontend, scope                     | tag + keep          | verify component owns UI before coding; durable but situational.                                                                                 |
| 07    | bulk   | Frontend projections reuse backend tiers   | lesson     | frontend, analytics, dcp            | tag + keep          | check existing payload before backend extension. Related to R7.                                                                                  |
| 08    | bulk   | Pre-computed contracts mirror frontend     | principle  | analytics, data-pipeline            | tag + keep          | serialization boundary is the contract. Related to R7/R8.                                                                                        |
| 09    | bulk   | Batch similar mobile CSS fixes             | principle  | css, frontend, testing              | promote to rule     | already covered by R12. Annotate as R12 source.                                                                                                  |
| 10    | bulk   | Shared loggers must use stderr             | principle  | automation, ci                      | promote to rule     | already covered by R4. Annotate as R4 source.                                                                                                    |
| 11    | bulk   | Check types for unused fields              | principle  | analytics, frontend                 | promote to rule     | already covered by R7. Annotate as R7 source.                                                                                                    |
| 12    | bulk   | Global UI belongs in router layout         | lesson     | frontend, router, react             | tag + keep          | footer/header go in Layout, not pages.                                                                                                           |
| 13    | bulk   | Reuse existing helpers first               | lesson     | frontend, react                     | tag + keep          | search component for existing helpers before new logic.                                                                                          |
| 14    | bulk   | Insert search filters, don't replace       | principle  | frontend, react                     | promote to rule     | already covered by R11. Annotate as R11 source.                                                                                                  |
| 15    | bulk   | Never bypass failing tests                 | principle  | testing, tdd, ci                    | promote to rule     | already covered by R1. Annotate as R1 source.                                                                                                    |
| 16    | bulk   | Know factory path resolution               | lesson     | testing, data-pipeline              | tag + keep          | assert resolved (absolute) paths in tests.                                                                                                       |
| 17    | bulk   | Include hidden dirs in renames             | lesson     | bash, monorepo                      | tag + keep          | grep -r repo root catches .husky/.github.                                                                                                        |
| 18    | bulk   | Normalize metrics for radar chart          | lesson     | charts, analytics                   | tag + keep          | normalize heterogeneous axes to 0-100, higher=better.                                                                                            |
| 19    | bulk   | Dependabot major bumps need full checks    | lesson     | ci, testing, monorepo               | tag + keep          | test each major bump; lint pass != test pass.                                                                                                    |
| 20    | bulk   | CSS theme overrides beat component changes | principle  | css, dark-mode, testing             | promote to rule     | already covered by R10. Annotate as R10 source.                                                                                                  |
| 21    | bulk   | Opacity-variant classes bypass CSS vars    | lesson     | css, dark-mode, brand               | tag + keep          | tripwire: text-tm-\*-80 bake rgba; override each variant.                                                                                        |
| 22    | bulk   | Don't infer context parent knows           | principle  | react, hooks, frontend              | promote to rule     | already covered by R3. Annotate as R3 source.                                                                                                    |
| 23    | bulk   | Probe direct download URLs first           | lesson     | data-pipeline, performance          | tag + keep          | inspect export handler before building scraper.                                                                                                  |
| 24    | bulk   | Lazy in-memory index for O(N) reads        | lesson     | performance, gcs, data-pipeline     | tag + keep          | build-once cached index with TTL.                                                                                                                |
| 25    | bulk   | Data collectors share storage contract     | principle  | data-pipeline, gcs                  | tag + keep          | producers must share path/naming contract. Related to R8.                                                                                        |
| 26    | bulk   | Dead code audit needs full tree walk       | principle  | frontend, scope                     | tag + keep          | check router/providers/endpoints/imports. Related to R8.                                                                                         |
| 27    | bulk   | Chart y-axis needs range padding           | lesson     | charts, frontend                    | tag + keep          | tripwire: range===0 pad symmetrically (                                                                                                          |     | 1 inverts).                                |
| 28    | bulk   | Default returns mask data bugs             | lesson     | analytics, dcp                      | tag + keep          | check alternative input fields before returning default.                                                                                         |
| 29    | bulk   | DCP goals independent not sequential       | principle  | dcp, analytics                      | tag + keep          | tripwire in CLAUDE.md; use clubPerformance raw fields.                                                                                           |
| 30    | bulk   | HTTP over Playwright when no auth          | lesson     | data-pipeline, performance          | tag + keep          | dup of L23/L24 theme; HTTP GET beats browser automation.                                                                                         |
| 31    | bulk   | Investigate duplication before refactor    | principle  | monorepo, scope                     | promote to rule     | already covered by R6. Annotate as R6 source.                                                                                                    |
| 32    | bulk   | Removed service must fail fast             | principle  | testing, monorepo                   | tag + keep          | grep all import sites; TS misses runtime arg mismatch. Related to R8.                                                                            |
| 33    | bulk   | Property tests break on strategy change    | incident   | testing, data-pipeline              | archive (incident)  | tripwire: SnapshotBuilder two district-tracking paths.                                                                                           |
| 34    | bulk   | Backend whitelist removal pairs pipeline   | principle  | data-pipeline, gcs                  | tag + keep          | audit write path when removing reader. Related to R8.                                                                                            |
| 35    | bulk   | Incremental aggregation needs store        | principle  | data-pipeline, gcs                  | promote to rule     | already covered by R9. Annotate as R9 source.                                                                                                    |
| B-002 | bulk   | CSV footer rows as district IDs            | incident   | data-pipeline, ci                   | archive (incident)  | filter IDs with /^[A-Z0-9]+$/i; reinforces R2.                                                                                                   |
| B-003 | bulk   | Month-end from raw-csv metadata            | lesson     | data-pipeline, gcs                  | tag + keep          | scan raw-csv metadata.json by dataMonth, not snapshotId.                                                                                         |
| B-004 | bulk   | Extract pure funcs from IO scripts         | principle  | testing, data-pipeline              | tag + keep          | separate business logic from GCS/shell IO into lib/.                                                                                             |
| B-005 | bulk   | Forward-scan month-end discovery           | incident   | data-pipeline, gcs, performance     | archive (incident)  | scan month X+1 first 2 weeks; reduces GCS reads.                                                                                                 |
| B-006 | bulk   | Club detail card data model check          | lesson     | frontend, analytics                 | tag + keep          | check ClubTrend fields before backend work; dup of R7.                                                                                           |
| B-007 | bulk   | CDN-first with Express fallback            | incident   | data-pipeline, frontend, testing    | archive (incident)  | mock CDN module in fallback tests; superseded by full CDN migration.                                                                             |
| B-008 | bulk   | Backend deprecation before deletion        | lesson     | data-pipeline, frontend             | tag + keep          | HTTP Deprecation/Sunset headers before route deletion.                                                                                           |
| B-009 | bulk   | CDN-only backend deletion                  | incident   | data-pipeline, frontend, testing    | archive (incident)  | resetAllMocks clears module mocks; coverage run differs from plain.                                                                              |
| B-010 | bulk   | CDN-only hook conversion                   | superseded | frontend, data-pipeline             | annotate-superseded | one of many CDN-migration incidents; covered by B-007/B-009 cluster.                                                                             |
| B-011 | bulk   | CDN dates conversion                       | superseded | frontend, data-pipeline             | annotate-superseded | curl CDN before assuming pipeline work; part of CDN migration cluster.                                                                           |
| B-012 | bulk   | CDN rankings conversion                    | superseded | frontend, data-pipeline             | annotate-superseded | inline node -e for CDN files; CDN migration cluster.                                                                                             |
| B-013 | bulk   | Bulk CDN hook conversion                   | superseded | frontend, data-pipeline             | annotate-superseded |                                                                                                                                                  |     | vs ?? for fallback; CDN migration cluster. |
| B-014 | bulk   | Express backend deletion                   | incident   | monorepo, frontend, build           | archive (incident)  | update workspaces array + npm install before --workspaces cmds.                                                                                  |
| B-015 | bulk   | Ad-hoc scripts vs pipeline commands        | principle  | data-pipeline, automation           | tag + keep          | >2 manual recovery steps = build a CLI command.                                                                                                  |
| B-016 | bulk   | District detail page fixes                 | lesson     | frontend, data-pipeline             | tag + keep          | CDN file without a hook is invisible; create hook with file.                                                                                     |
| B-017 | bulk   | CDN data key unwrapping                    | lesson     | frontend, data-pipeline             | tag + keep          | audit utils for nested .data assumptions on CDN migration.                                                                                       |
| B-018 | bulk   | Streaming rebuild for disk-bound CI        | lesson     | ci, data-pipeline, gcs              | tag + keep          | check runner disk; stream one date at a time.                                                                                                    |
| B-019 | bulk   | gsutil cp -r double-nesting                | incident   | gcs, data-pipeline                  | archive (incident)  | never gsutil cp -r with trailing slash; use globs.                                                                                               |
| B-020 | bulk   | Three pipeline data quality bugs           | incident   | data-pipeline, gcs                  | archive (incident)  | gsutil pitfalls + field-name mismatch + trend snapshots.                                                                                         |
| B-021 | bulk   | Payments not members                       | principle  | analytics, data-pipeline            | tag + keep          | never use payment fields for member counts (≈2x). Durable domain rule.                                                                           |
| B-022 | bulk   | Time-series architecture gap               | lesson     | data-pipeline, gcs, charts          | tag + keep          | check data is actually served before assuming visible.                                                                                           |
| B-023 | bulk   | force-analytics flag name                  | incident   | data-pipeline, automation           | archive (incident)  | run --help before adding pipeline flags.                                                                                                         |
| B-024 | bulk   | rebuild date mismatch                      | incident   | data-pipeline, gcs                  | archive (incident)  | transformer remaps date via CSV header; detect actual output path.                                                                               |
| B-025 | bulk   | Manifest not updated after rebuild         | incident   | data-pipeline, gcs                  | archive (incident)  | deleted dirs break local-fs downstream steps; use GCS listing.                                                                                   |
| B-026 | bulk   | Serial gsutil cp bottleneck                | incident   | gcs, performance, data-pipeline     | archive (incident)  | use gsutil -m cp -rZ with globs for parallel bulk.                                                                                               |
| B-027 | bulk   | export.aspx 4-segment report format        | incident   | data-pipeline                       | archive (incident)  | compare MD5 across dates when migrating browser→HTTP scrape.                                                                                     |
| B-028 | bulk   | analytics paymentsTrend chicken-egg        | lesson     | data-pipeline, analytics            | tag + keep          | patch analytics AFTER time-series write (read-back-patch).                                                                                       |
| B-029 | bulk   | Program year from dataMonth not closeDate  | lesson     | data-pipeline, analytics            | tag + keep          | June close (7/20) crosses fiscal boundary; use dataMonth.                                                                                        |
| B-030 | bulk   | clean-snapshots deletes before upload      | incident   | data-pipeline, gcs                  | archive (incident)  | --clean-snapshots fatal in batch-upload modes.                                                                                                   |
| B-031 | bulk   | Immutable cache for mutable data           | lesson     | data-pipeline, performance          | tag + keep          | immutable only for content-addressed; mutable=must-revalidate.                                                                                   |
| B-032 | bulk   | Borda count tie neutralization             | incident   | analytics                           | archive (incident)  | award 0 Borda points when category all-tied.                                                                                                     |
| B-033 | bulk   | CSV validation: data rows not size         | lesson     | data-pipeline                       | tag + keep          | count data rows, not byte size, to detect corrupt CSV.                                                                                           |
| B-034 | bulk   | Penultimate retention doubles data         | noise      | data-pipeline, gcs                  | annotate-noise      | restated feature description; low signal.                                                                                                        |
| B-035 | bulk   | YoY comparison data source                 | lesson     | analytics, data-pipeline            | tag + keep          | check consumer reads right CDN source before assuming pipeline bug.                                                                              |
| B-036 | bulk   | Club net change zero bug                   | lesson     | frontend, analytics                 | tag + keep          | latest-base, not arr[n-1]-arr[0] (0 when 1 point).                                                                                               |
| B-037 | bulk   | Club detail subpage                        | noise      | frontend, router                    | annotate-noise      | feature narrative; verify data fixed before UI work is the only signal.                                                                          |
| B-038 | bulk   | DCP projections to club detail             | noise      | frontend, dcp                       | annotate-noise      | restated commit; keep component for reuse.                                                                                                       |
| B-039 | bulk   | Express backend dead code                  | lesson     | frontend, scope                     | tag + keep          | grep all refs (types/comments/env) when deleting subsystem. Related R8.                                                                          |
| B-040 | bulk   | release-please setup                       | incident   | ci, automation, monorepo            | archive (incident)  | monorepo separate-pull-requests:false for grouped release PR.                                                                                    |
| B-041 | bulk   | Data freshness indicators / ESLint         | lesson     | react, frontend, ci                 | tag + keep          | use React key to reset state, not setState-in-effect.                                                                                            |
| B-042 | bulk   | Accessibility mobile responsiveness        | lesson     | accessibility, css, frontend        | tag + keep          | md:hidden pattern; ProcessedClubTrend type import.                                                                                               |
| B-043 | bulk   | analytics-core barrel rebuild              | principle  | monorepo, build                     | promote to rule     | rebuild workspace package dist before consuming; recurring (see lesson 092). Candidate R-rule.                                                   |
| B-044 | bulk   | Code-split recharts lazy barrel            | lesson     | frontend, charts, performance       | tag + keep          | React.lazy-wrap chart components in barrel, not library.                                                                                         |
| B-045 | bulk   | Sprint 11 data accuracy / DCP gap          | lesson     | dcp, analytics, frontend            | tag + keep          | cross-ref both level AND gap calc against rules-reference §3.2.                                                                                  |
| B-046 | bulk   | Per-club DCP goals from raw CSV            | lesson     | dcp, data-pipeline                  | tag + keep          | ScrapedRecord preserves raw CSV columns typed interfaces lack.                                                                                   |
| B-047 | bulk   | Multi-year chart alignment                 | lesson     | charts, frontend, data-pipeline     | tag + keep          | never per-Line data prop; merge dataset; time-series CDN multi-year.                                                                             |
| B-048 | bulk   | Sprint 14 CI/CD hygiene                    | lesson     | ci, data-pipeline, frontend         | tag + keep          | single source for date counts (snapshot-index) and versions.                                                                                     |
| B-049 | bulk   | Sprint 15 UX polish                        | lesson     | frontend, css, react                | tag + keep          | one canonical skeleton; call hooks before early returns.                                                                                         |
| B-050 | bulk   | Sprint 16 accessibility CI                 | principle  | accessibility, testing, ci, flaky   | tag + keep          | prefer jest-axe over lighthouse/playwright localhost (hangs). Durable test rule.                                                                 |
| B-051 | bulk   | CDN field name case mismatch               | lesson     | data-pipeline, analytics            | tag + keep          | verify exact JSON key casing vs live CDN; R7 extended.                                                                                           |
| B-052 | bulk   | Payment YoY data source mismatch           | lesson     | analytics, data-pipeline, charts    | tag + keep          | chart+stat must derive from same multi-year source.                                                                                              |
| B-053 | bulk   | ESLint refactoring cleanup                 | superseded | react, frontend, ci                 | annotate-superseded | dup of B-041 (react-refresh export rule); same content.                                                                                          |
| B-054 | bulk   | Mock snapshot needs CSV keys               | lesson     | testing, data-pipeline              | tag + keep          | CDN mocks need divisionPerformance/clubPerformance CSV-record shape.                                                                             |
| B-055 | bulk   | Members to distinguished compound DCP      | lesson     | dcp, analytics, testing             | tag + keep          | max of all path requirements, not sum. Trailing loose bullet (no ## header): use precise testing-library queries to avoid MultipleElementsFound. |
| 38    | bulk   | Live data metadata needs native footers    | lesson     | data-pipeline                       | tag + keep          | never default isClosingPeriod/dataMonth; parse CSV footer.                                                                                       |
| 39    | bulk   | Module singletons leak across vitest       | principle  | testing, vitest, flaky              | promote to rule     | export reset(); call in beforeEach. Durable test rule, recurs.                                                                                   |
| 40    | bulk   | URL state default match context not clock  | lesson     | react, hooks, frontend              | tag + keep          | fall back to context state, not freshly computed; guard no-op writes.                                                                            |
| 41    | bulk   | Filter URL codec dash ambiguity            | lesson     | frontend, router                    | tag + keep          | open-min/open-max range serialization; indexOf from 0.                                                                                           |
| 42    | bulk   | Logger migration breaks test spies         | lesson     | testing, vitest, frontend           | tag + keep          | spy on logger object, not console; bound fn breaks spy.                                                                                          |
| 43    | bulk   | Orphan dirs break CDN manifest             | incident   | data-pipeline, gcs, ci              | archive (incident)  | cleanup ALL dirs created per date; R2 extended.                                                                                                  |
| 44    | bulk   | Dead code hides feature gaps               | principle  | frontend, scope, testing            | tag + keep          | delete replaced component same sprint; dead code = false test confidence.                                                                        |
| 45    | bulk   | GCS stores need pipeline sync parity       | principle  | data-pipeline, gcs                  | promote to rule     | new store needs sync in all 5 workflow paths; R9 extended.                                                                                       |
| 46    | bulk   | Awards collapse when formula conflates     | lesson     | analytics                           | tag + keep          | check algebra: shared inputs rank identically; dup extraction in 2 packages.                                                                     |
| 47    | bulk   | Silent no-op fixes need E2E verify         | principle  | data-pipeline, analytics, testing   | tag + keep          | integration test against real column names; curl live data; R7 extended.                                                                         |
| 48    | bulk   | Variable fonts free, new families aren't   | lesson     | brand, performance, frontend        | tag + keep          | extra weights free on variable fonts; net-new family costs RTT.                                                                                  |
| 49    | bulk   | Stub-child tests miss landmark conflicts   | principle  | testing, accessibility, react       | tag + keep          | audit singleton landmark/ID consumers on lift; fresh-context review catches.                                                                     |
| 50    | bulk   | Nested 100vh inside shell forces scroll    | lesson     | css, frontend                       | tag + keep          | consumers must not redeclare shell-owned viewport concern; use % or flex.                                                                        |
| 51    | bulk   | Timeout bumps are masking not fixing       | principle  | testing, vitest, flaky, performance | promote to rule     | tighten render scope, never raise testTimeout. Echoes user's no-timeout-bumps memory. Candidate R-rule.                                          |

---

_Generated by sprint-651. Sprint 1 (#648) applies the tag frontmatter, INDEX, and loader change; Sprint 2 (#649) promotes the §3 principles to R-rules._
