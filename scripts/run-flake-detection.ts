/**
 * Flake-detection harness — IO orchestrator (#913, epic #917 S2).
 *
 * Runs a target test set N× under the REAL CI invocation (`CI=true vitest run
 * --coverage`, unbounded workers — the §2.3 amplifier) from the frontend
 * workspace, captures per-run pass/fail + wall-clock duration, and computes the
 * variance-aware flake metric. Writes a JSON artifact and, when running in CI,
 * a markdown summary to $GITHUB_STEP_SUMMARY.
 *
 *   npm run test:flake                    # suspect set ×DEFAULT_REPEATS
 *   FLAKE_REPEATS=20 npm run test:flake   # more samples
 *   FLAKE_TARGETS='src/foo' npm run test:flake   # custom target
 *
 * NON-GATING by design: this sprint sets the baseline before tightening. The
 * process exits 0 even when the flake rate is non-zero — a flake here is a
 * *measurement*, not a build break. It exits non-zero only on a harness failure
 * (e.g. a run could not be spawned), which is a real "the metric is unreliable"
 * signal. All human-facing logging goes to stderr (R4).
 */

import { spawnSync } from 'node:child_process'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  computeFlakeMetric,
  formatFlakeSummary,
  resolveHarnessConfig,
  type RunResult,
} from './lib/flakeMetrics'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FRONTEND_DIR = join(REPO_ROOT, 'frontend')
const ARTIFACT = join(REPO_ROOT, 'flake-metric.json')

/** Run the target set once under the CI invocation; capture pass/fail + duration. */
function runOnce(targets: string[], i: number, total: number): RunResult {
  console.error(`\n=== flake run ${i}/${total} ===`)
  const start = Date.now()
  const res = spawnSync(
    'npx',
    ['vitest', 'run', ...targets, '--coverage', '--reporter=dot'],
    {
      cwd: FRONTEND_DIR,
      // CI=true removes the local 3-worker cap → the real, contended invocation.
      env: { ...process.env, CI: 'true' },
      encoding: 'utf8',
      stdio: ['ignore', 'inherit', 'inherit'],
    }
  )
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
  const summary = formatFlakeSummary(metric, {
    label: cfg.label,
    repeats: cfg.repeats,
  })

  // JSON artifact (uploaded by CI; diffable across runs for the S3–S4 comparison).
  writeFileSync(ARTIFACT, JSON.stringify(metric, null, 2) + '\n')
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

  // Non-gating: a measured flake is data, not a build break.
  process.exit(0)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
