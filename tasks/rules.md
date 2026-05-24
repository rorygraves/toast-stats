# ⚡ Engineering Rules

<!-- Read this COMPLETELY before every task. Keep it under 60 seconds to read. -->
<!-- When you add a lesson to lessons.md, update this file if it changes a rule. -->
<!-- Ordered by blast radius: most dangerous mistakes first. -->

---

## 🔴 Never Do These

**R1 — Never bypass failing tests.**
`--no-verify`, `--skip-tests`, commenting out assertions, or pinning expectations to match a bug are all forbidden. If pre-existing tests are red, fix them before adding new code.

**R2 — Never assume data exists on the ephemeral runner.**
The GitHub Actions runner starts empty. Every piece of data a compute step needs must be explicitly synced from GCS first (snapshots, time-series, club-trends). "It works locally" does not count.

**R3 — Never infer context a parent already has.**
If a parent component manages program year, date range, or filter state, pass it as a prop. Never re-derive it from API response data inside a child component — the first data point's date is not the current year.

**R4 — Never use stdout for logs in a CLI.**
`console.log()` in shared package fallback loggers contaminates the JSON output that `| tee | jq` expects. All log levels go to `console.error()` (stderr). Stdout is for structured data only.

---

## 🟡 Always Do These Before Starting

**R5 — Read the last 5 entries in lessons.md before starting any task.**
`tail -n 120 tasks/lessons.md`

**R6 — Trace the actual call graph before refactoring.**
An issue description can overstate the problem. Before a cross-module consolidation, verify actual code overlap — not just similar names. Check whether `SnapshotBuilder` truly duplicates `DataTransformer` or just delegates to it.

**R7 — Inventory existing fields before designing new backend work.**
When a frontend feature needs "new" data, grep the existing types first. Pre-computed fields are often already computed, served, and typed — just not yet wired into the UI.

**R8 — When deleting a service, audit its entire write AND read path.**
`grep -r "ServiceName" .` including `.github/workflows/`. Removing a reader doesn't remove the writer. Removing a gate doesn't remove hidden secondary gates (e.g., `CollectorOrchestrator` validating against the same config file the pipeline was still reading).

---

## 🟢 Architecture Patterns That Are Proven Here

**R9 — Multi-run aggregation needs a persistent GCS-backed store, not history re-loading.**
Pattern: sync store from GCS → upsert today's data → save → push back. The `ClubTrendsStore` and `TimeSeriesIndexWriter` are reference implementations. "Load all history" approaches produce 1 data point on ephemeral runners.

**R10 — CSS-level overrides beat component-level changes for cross-cutting concerns.**
Dark mode, theme tokens, brand colors — override at `[data-theme='dark']` scope in CSS. But: Tailwind opacity-variant classes (`-80`, `-70`) bake in hardcoded `rgba()` and must also be overridden explicitly.

**R11 — Insert into existing filter pipelines, don't replace.**
`original → filtered → searchFiltered → sorted` is correct. Adding a new filter is a new step, not a replacement of an existing one. Keeps existing test coverage intact.

**R12 — Batch independent, same-breakpoint CSS fixes.**
When multiple issues touch the same root cause (e.g., responsive table at 375px), write all failing tests first, apply all fixes, verify once. This is not batching unrelated changes — it's one logical fix at one level.

---

## 🤖 Automation, Shell & Monorepo Discipline

<!-- R13–R20 promoted from lessons 083–092 (epic #647 Sprint 2, #649). -->
<!-- Sprint-runner / CI / bash / worktree surfaces. Each links its origin lesson. -->

**R13 — End every trap-wired cleanup function with `return 0` (or `:`).**
Bash uses an `EXIT` trap's final return value as the script's exit code. A trailing conditional (`[[ -n "$X" ]] && rm ...`) that evaluates false makes the trap — and thus a script with an explicit `exit 0` — return 1. Never let a conditional be the last statement in a trap unless you mean to mask the exit code. (Lesson 083 / #603)
_Trigger:_ writing or editing any function wired to `trap ... EXIT|INT|TERM`.

**R14 — Don't trust a command's exit code inside a `pipefail` predicate; absorb it with `|| true`.**
`set -o pipefail` propagates the rightmost non-zero status. macOS `screen -ls` exits 1 even when sessions exist, so `screen -ls | grep -q …` always reports "not found" under pipefail — silently inverting detection logic (and nearly triggering a live-worktree GC). Verify exit semantics for every case you care about, drop pipefail locally, or append `|| true`. Prefer `pgrep -f` over `screen -ls` for liveness. (Lesson 089 / #633, #634)
_Trigger:_ piping any command into a `pipefail` pipeline used as a boolean predicate.

**R15 — When two pieces of distributed state must agree before automation acts, require BOTH signals and write the strongest one LAST.**
"Sprint done" needs the sub-issue CLOSED _and_ the epic checkbox ticked. A consumer keying off only the close signal fires inside the gap before the tick lands — the close-then-tick duplicate-launch race. Tick the epic (weak, revertible string PATCH) first; close the issue (strong, irreversible) last; have the consumer require both. (Lesson 086 / #626)
_Trigger:_ ordering writes to issue/epic/label state, or designing automation that triggers off issue state.

**R16 — After touching `packages/*/src/`, run `npm run build:<package>` before tests or pre-push.**
The frontend imports workspace packages from their built `dist/` (gitignored, not auto-rebuilt). CI rebuilds in a clean checkout; the local pre-push hook does not. Skip the rebuild and your tests pass against stale `dist/` while every fresh operator pull breaks with `X is not a function`. (Lesson 092 / #645)
_Trigger:_ any change under `packages/*/src/`.

**R17 — Every conditional in an automated workflow needs an explicit case for every value.**
"Do X if Y" in a prompt or script must also state what happens when Y is false — even if the answer is "do nothing." Implicit scope invites divergence: two sessions ran the same bootstrap prompt and ended in different states (epic closed vs left open) because the "last sprint?" case was unstated. (Lesson 091 / #636)
_Trigger:_ writing a conditional instruction in a prompt, routine, or shell script.

**R18 — Decouple scheduling cadence from forward progress.**
A cron interval sets the cadence of _attempts_, not of _progress_. "One visible action per tick" couples them and leaves work queued during idle ticks. Each tick should make as much _valid_ forward progress as it safely can, bounded by a sane cap (e.g. an 8-iteration cascade guard). (Lesson 088 / #627)
_Trigger:_ designing or tuning any periodic automation loop.

**R19 — Branch a long-lived worktree from the fetched remote tip, not its possibly-stale base.**
A spawned session's worktree is detached at whatever commit the runner left it on; `origin/main` may be several commits ahead. Branching from the stale base silently _reverts_ intervening work and deletes files you never touched. `git fetch`, branch from `origin/main`, and diff `origin/main..HEAD` before opening the PR. (Lessons 087, 090 / #625, #482)
_Trigger:_ starting work in a spawned/automation worktree, or before opening a PR from a long-lived branch.

**R20 — When you partition a test suite (projects, shards, tags), add an exhaustiveness guard sourced from the tool itself.**
A file matching no project's include/exclude stops running in every gate, silently — coverage dips, a regression sails through weeks later, nothing points at the cause. Assert the partition is disjoint _and_ exhaustive using the tool's own resolution (`vitest list --json`), never a re-implemented glob walk that can drift. (Lesson 090 / #482)
_Trigger:_ splitting a test suite into projects/shards, or adding a top-level test directory.

---

## ⚠️ Active Tripwires

- `SnapshotBuilder.build()` has **two** district-tracking code paths (success + validation-failure). Changing district discovery must update both.
- DCP goals are **independent** (not sequential). Never approximate `dcpGoals` count as Goals 1-N achieved in order. Use `clubPerformance` raw fields.
- Any chart with `|| 1` range fallback is a y-axis inversion bug waiting to happen. Pad symmetrically when `range === 0`.
- Tailwind opacity variants (`text-tm-*-80`) don't inherit CSS variable overrides. Audit on every new brand token.
- `Path.join()` with raw user input = path traversal. Always call `validateDistrictId()` before constructing paths from request params.
