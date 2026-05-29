# Sprint 913 — Flake-detection harness & objective baseline metric (epic #917 S2)

**Persona:** ron-qe (quality engineer). **Predecessor:** #912 (deep-dive, doc-only) CLOSED.
**Drives off:** `docs/investigations/test-flakiness-deep-dive-2026-05-28.md` §6 (S2 scope).

## Acceptance (issue #913)

1. CI reports an objective **flake-rate metric** on each run.
2. **Quarantine list** exists, is loud, and is empty-or-justified (quarantine ≠ delete; R1).
3. **Baseline number recorded** to compare against after Sprints 3–4.
4. No assertion pinning; no tests disabled silently.

## Design — "flake observability" subsystem (pure lib + thin IO + CI), no frontend src change

Follows the established `scripts/lib/*.ts` (pure) + `scripts/lib/__tests__/*.test.ts` +
`scripts/*.ts` (IO entrypoint) + `npm run test:scripts` convention.

### A. Quarantine mechanism

- `frontend/test-quarantine.json` — `{ "quarantined": [ {file, test?, reason, issue, since} ] }`. **Starts empty.**
- `scripts/lib/quarantine.ts` (pure): `parseQuarantine`, `validateQuarantine`
  (each entry needs file + reason + issue), `formatQuarantineReport` (loud banner).
- `scripts/check-quarantine.ts` (IO): read → validate → loud report. Exit non-zero ONLY on
  malformed entry (missing reason/issue) — never on empty/justified. Wired into CI.
- npm: `test:quarantine:check`.

### B. Flake-detection harness

- `scripts/lib/flakeMetrics.ts` (pure): `computeFlakeMetric(runs)` →
  `{ totalRuns, failedRuns, flakeRate, passRate, durationMsP50, p95, min, max }`;
  `formatFlakeSummary(metric)` (markdown for `$GITHUB_STEP_SUMMARY`). Variance is the
  signal (L53) → percentiles, not just pass/fail.
- `scripts/lib/__tests__/flakeMetrics.test.ts` — TDD: percentile math, flake rate,
  edge cases (0 runs, all-pass, all-fail, single run).
- `scripts/run-flake-detection.ts` (IO orchestrator): run `vitest run` over a target set
  (default **suspect set** from §2.3: `DateSelector.integration`, journeys, `DistrictsPage.*`)
  N× under `CI=true` (real CI invocation), capture per-run {passed, durationMs}, compute
  metric, write JSON artifact + step summary. **Non-gating** (baseline-setting).
- npm: `test:flake`.

### C. CI wiring

- New **non-gating** job `flake-detection` in `ci.yml` (`continue-on-error` or report-only):
  runs `test:quarantine:check` then `test:flake` over the suspect set, writes step summary,
  uploads metric JSON artifact. PR CI stays fast (small suspect set).

### D. Baseline doc

- `docs/investigations/flake-baseline-2026-05-28.md`: metric definition, suspect set, the
  recorded baseline number (local harness run + §2.2 machine-noise caveat carried forward),
  comparison protocol for S3–S4.

## TDD order

1. Red→Green→Refactor `flakeMetrics.ts` (pure).
2. Red→Green→Refactor `quarantine.ts` (pure).
3. Wire IO entrypoints + npm scripts (smoke locally).
4. CI job. 5. Baseline doc. 6. Lesson (variance-needs-percentiles / quarantine-without-skip).

## Verification

- `npm run test:scripts` green (unit proof of metric + quarantine math).
- Local `npm run test:flake` run over suspect set → record baseline number.
- **No pr-preview**: PR touches no `frontend/**`/packages source → path-filtered out. Per
  bootstrap step 5, code-proof (scripts unit tests + local harness run) is the verification.

## Blast radius

scripts/lib (+2 modules +2 tests), scripts (+2 IO), ci.yml, package.json ×(root+frontend),
1 data file, 2 docs, 1 lesson. No frontend/src behaviour change. Single responsibility.
