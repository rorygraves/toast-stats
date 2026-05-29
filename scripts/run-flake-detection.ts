/**
 * Flake-detection harness — IO orchestrator (#913, epic #917 S2).
 *
 * Runs a target test set N× under the CI invocation (`CI=true vitest run
 * --coverage`) from the frontend workspace, captures per-run pass/fail +
 * wall-clock duration, and computes the variance-aware flake metric. Writes a
 * JSON artifact and, when running in CI, a markdown summary to
 * $GITHUB_STEP_SUMMARY.
 *
 * Worker policy (V8, #914): the BLOCKING CI test job is now capped at 50% of
 * cores (`resolveMaxWorkers`), but this DETECTOR pins `--maxWorkers=100%`
 * (buildVitestArgs) so it keeps running one-fork-per-core — the original §2.3
 * amplifier — and stays sensitive to a contention regression the capped gate
 * would mask.
 *
 *   npm run test:flake                    # suspect set ×DEFAULT_REPEATS
 *   FLAKE_REPEATS=20 npm run test:flake   # more samples
 *   FLAKE_TARGETS='src/foo' npm run test:flake   # custom target
 *
 * GATING is OPT-IN via `FLAKE_MAX_RATE` (a fraction in [0,1]; #916):
 *   - UNSET (the per-PR baseline job, #913): NON-GATING — exits 0 even when the
 *     flake rate is non-zero. A flake here is a *measurement*, not a build break,
 *     and the detector runs at `--maxWorkers=100%` so it is sensitive *by
 *     design* (L136) — gating it per-PR would re-introduce flaky CI, the exact
 *     thing this epic eradicated.
 *   - SET (the standing nightly sentinel, FLAKE_MAX_RATE=0): GATING — exits
 *     non-zero when the measured rate exceeds the ceiling, so a recurrence on a
 *     clean runner is caught within a day.
 * Either way it exits non-zero on a harness failure (e.g. a run could not be
 * spawned), a real "the metric is unreliable" signal. Logging → stderr (R4).
 */

import { spawnSync } from 'node:child_process'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildVitestArgs,
  computeFlakeMetric,
  evaluateFlakeGate,
  formatFlakeSummary,
  formatGateVerdict,
  resolveHarnessConfig,
  resolveMaxRate,
  type RunResult,
} from './lib/flakeMetrics'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FRONTEND_DIR = join(REPO_ROOT, 'frontend')
const ARTIFACT = join(REPO_ROOT, 'flake-metric.json')

/** Run the target set once under the CI invocation; capture pass/fail + duration. */
function runOnce(targets: string[], i: number, total: number): RunResult {
  console.error(`\n=== flake run ${i}/${total} ===`)
  const start = Date.now()
  const res = spawnSync('npx', ['vitest', ...buildVitestArgs(targets)], {
    cwd: FRONTEND_DIR,
    // CI=true + the explicit --maxWorkers=100% in buildVitestArgs keep this the
    // unbounded, contended invocation (the §2.3 amplifier) even though the
    // blocking CI gate is now capped at 50% (V8, #914).
    env: { ...process.env, CI: 'true' },
    encoding: 'utf8',
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  const durationMs = Date.now() - start
  if (res.error) {
    throw new Error(`harness: failed to spawn vitest — ${res.error.message}`)
  }
  const passed = res.status === 0
  console.error(
    `run ${i}: ${passed ? 'pass' : 'FAIL'} in ${(durationMs / 1000).toFixed(1)}s`
  )
  return { passed, durationMs }
}

function main(): void {
  const cfg = resolveHarnessConfig(process.env)
  console.error(
    `Flake harness: target="${cfg.label}" repeats=${cfg.repeats}\n  targets: ${cfg.targets.join(', ')}`
  )

  const runs: RunResult[] = []
  for (let i = 1; i <= cfg.repeats; i++) {
    runs.push(runOnce(cfg.targets, i, cfg.repeats))
  }

  const metric = computeFlakeMetric(runs)
  const gate = evaluateFlakeGate(metric, resolveMaxRate(process.env))
  const verdict = formatGateVerdict(gate)
  const summary = `${formatFlakeSummary(metric, {
    label: cfg.label,
    repeats: cfg.repeats,
  })}\n\n${verdict}`

  // JSON artifact (uploaded by CI; diffable across runs for the S3–S4 comparison).
  writeFileSync(ARTIFACT, JSON.stringify({ ...metric, gate }, null, 2) + '\n')
  console.error(`\n${summary}\n\nMetric written to ${ARTIFACT}`)

  // CI step summary.
  const stepSummary = process.env.GITHUB_STEP_SUMMARY
  if (stepSummary) {
    try {
      mkdirSync(dirname(stepSummary), { recursive: true })
    } catch {
      /* parent dir usually exists */
    }
    appendFileSync(stepSummary, `\n${summary}\n`)
  }

  // Gating is OPT-IN via FLAKE_MAX_RATE (the standing sentinel sets it to 0).
  // Unset ⇒ non-gating: a measured flake is data, not a build break (#913), so
  // the per-PR baseline job never fails on a contention blip. When a threshold
  // IS set and the measured rate exceeds it, exit non-zero so the sentinel goes
  // red and a recurrence is caught immediately (#916).
  process.exit(gate.exceeded ? 1 : 0)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
