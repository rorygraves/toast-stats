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
  const durations = runs.map(r => r.durationMs)
  const sorted = [...durations].sort((a, b) => a - b)

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
