/**
 * Flake-detection metric computation — Pure Functions (#913, epic #917 S2).
 *
 * The flake-detection harness (scripts/run-flake-detection.ts) runs a target
 * test set N× under the real CI invocation and feeds the per-run results here.
 *
 * Design note (grounded in Sprint 1's deep-dive, L53): contention is first
 * absorbed as *slowness* and only past a threshold converts to *failure* — the
 * 38s→210s duration swing on an unchanged suite was the variance signal in its
 * purest form. So the metric is deliberately variance-aware: it reports
 * duration percentiles (p50/p95) alongside the headline pass/fail flake rate.
 * A rising p95 with a still-green flakeRate is an early warning that the next
 * sprint's contention work matters.
 *
 * All functions are pure (no filesystem / process I/O) so they unit-test
 * cleanly; the IO orchestrator lives in scripts/run-flake-detection.ts.
 */

/** One execution of the target test set. */
export interface RunResult {
  /** Did the run exit green (all tests passed)? */
  passed: boolean
  /** Wall-clock duration of the run, in milliseconds. */
  durationMs: number
}

/** The computed flake metric for a batch of runs. */
export interface FlakeMetric {
  totalRuns: number
  failedRuns: number
  /** Fraction of runs that failed on otherwise-unchanged code (0..1). */
  flakeRate: number
  /** Fraction of runs that passed (0..1). */
  passRate: number
  durationMsMin: number
  durationMsMax: number
  durationMsP50: number
  durationMsP95: number
  /** The per-run breakdown, carried verbatim for the report artifact. */
  runs: RunResult[]
}

/**
 * Default "suspect set" — the §2.3 hot files the Sprint 1 deep-dive named as
 * most contention-sensitive. These are vitest path filters (substring match),
 * run from the frontend workspace. Keeping the harness scoped to this set keeps
 * per-PR CI fast while still exercising the tests that actually flaked.
 */
export const DEFAULT_SUSPECT_SET: readonly string[] = [
  'src/components/__tests__/DateSelector.integration.test.tsx',
  'src/__tests__/integration/journeys/',
  'src/pages/__tests__/DistrictsPage',
]

/** Default repeat count — enough samples for a meaningful rate without blowing CI time. */
export const DEFAULT_REPEATS = 10

/** Resolved harness configuration: what to run, how many times, under what label. */
export interface HarnessConfig {
  targets: string[]
  repeats: number
  label: string
}

/**
 * Resolve the harness config from the environment. `FLAKE_TARGETS` (whitespace-
 * separated) overrides the suspect set and relabels the run "custom";
 * `FLAKE_REPEATS` overrides the repeat count (a non-numeric / non-positive value
 * falls back to the default rather than running zero times).
 */
export function resolveHarnessConfig(
  env: Record<string, string | undefined>
): HarnessConfig {
  const rawTargets = env.FLAKE_TARGETS?.trim()
  const targets = rawTargets
    ? rawTargets.split(/\s+/)
    : [...DEFAULT_SUSPECT_SET]
  const label = rawTargets ? 'custom' : 'suspect-set'

  const parsed = Number(env.FLAKE_REPEATS)
  const repeats =
    Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_REPEATS

  return { targets, repeats, label }
}

/**
 * Build the `vitest run` argv for one harness execution.
 *
 * We keep `--coverage` because coverage *instrumentation* is part of the §2.3
 * contention amplifier the harness must reproduce — but a filtered subset run
 * can never meet the whole-repo 55% coverage threshold, so leaving thresholds
 * on makes every run exit non-zero on a coverage gate, which the harness would
 * misread as a 100% flake rate (all tests can pass and the run still "fails").
 * Zeroing every threshold makes the exit code reflect TEST pass/fail only —
 * which is what the flake metric is measuring.
 *
 * `--maxWorkers=100%` (V8, #914): Sprint 3 capped the BLOCKING CI test
 * invocation at 50% of cores (`resolveMaxWorkers` in vitest.shared.mjs) to keep
 * an oversubscribed runner from converting contention into red builds. The flake
 * DETECTOR must NOT inherit that cap — a detector that only ever runs the safe
 * configuration can never surface a contention regression. Pinning 100% keeps it
 * running one-fork-per-core (the original §2.3 amplifier), decoupled from the
 * gate's stability cap: gate = capped/stable, detector = unbounded/sensitive.
 */
export function buildVitestArgs(targets: string[]): string[] {
  return [
    'run',
    ...targets,
    '--coverage',
    '--coverage.thresholds.lines=0',
    '--coverage.thresholds.functions=0',
    '--coverage.thresholds.branches=0',
    '--coverage.thresholds.statements=0',
    '--maxWorkers=100%',
    '--reporter=dot',
  ]
}

/** Context for rendering a human/markdown summary. */
export interface SummaryContext {
  /** What was repeated (e.g. "suspect-set", "full-suite"). */
  label: string
  /** How many times the target set was executed. */
  repeats: number
}

/**
 * Nearest-rank percentile on an ascending-sorted array.
 * p in [0,1]; returns the value at rank ceil(p*n) (1-indexed), clamped to [1,n].
 * Nearest-rank (not interpolated) keeps the result an observed sample, which is
 * what we want for "the slow runs actually looked like this".
 */
function nearestRankPercentile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length
  if (n === 0) throw new Error('nearestRankPercentile: empty input')
  const rank = Math.ceil(p * n)
  const idx = Math.min(Math.max(rank, 1), n) - 1
  return sortedAsc[idx]
}

/**
 * Compute the flake metric from a batch of runs.
 * Throws on an empty batch — an empty harness result is a harness bug, not 0%
 * flake, and silently reporting "0% over 0 runs" would be a false all-clear.
 */
export function computeFlakeMetric(runs: RunResult[]): FlakeMetric {
  if (runs.length === 0) {
    throw new Error(
      'computeFlakeMetric: no runs — the harness produced zero results, which is a harness failure, not a 0% flake rate'
    )
  }
  const totalRuns = runs.length
  const failedRuns = runs.filter(r => !r.passed).length
  // `.map` already returns a fresh array, so sorting it in place can't mutate `runs`.
  const sorted = runs.map(r => r.durationMs).sort((a, b) => a - b)

  return {
    totalRuns,
    failedRuns,
    flakeRate: failedRuns / totalRuns,
    passRate: (totalRuns - failedRuns) / totalRuns,
    durationMsMin: sorted[0],
    durationMsMax: sorted[sorted.length - 1],
    durationMsP50: nearestRankPercentile(sorted, 0.5),
    durationMsP95: nearestRankPercentile(sorted, 0.95),
    runs,
  }
}

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`
}

function secs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Render the metric as a GitHub-flavoured markdown table for the CI step
 * summary. Surfaces the duration spread (p50/p95) so the variance signal (L53)
 * is visible, not just the binary pass/fail rate.
 */
export function formatFlakeSummary(
  metric: FlakeMetric,
  ctx: SummaryContext
): string {
  return [
    `### Flake-detection metric — \`${ctx.label}\` ×${ctx.repeats}`,
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Flake rate | **${pct(metric.flakeRate)}** (${metric.failedRuns}/${metric.totalRuns} runs failed) |`,
    `| Pass rate | ${pct(metric.passRate)} |`,
    `| Duration p50 | ${secs(metric.durationMsP50)} |`,
    `| Duration p95 | ${secs(metric.durationMsP95)} |`,
    `| Duration min/max | ${secs(metric.durationMsMin)} / ${secs(metric.durationMsMax)} |`,
    '',
    '_Variance is the leading signal (L53): a rising p95 with a green flake rate is an early contention warning._',
  ].join('\n')
}
