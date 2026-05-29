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

/**
 * Resolve the gate threshold from `FLAKE_MAX_RATE` (a fraction in [0,1]).
 *
 * UNSET / empty / non-numeric / out-of-range ⇒ `null` = NON-GATING (the
 * baseline default, #913: a measured flake is data, not a build break, so the
 * per-PR `flake-detection` job stays informational). A value of `0` means "any
 * flake fails" — the standing sentinel's setting (#916): the suite was proven
 * 0% on a clean runner, so a single failure over N runs is a real regression.
 * Out-of-range is treated as unset rather than clamped, so a fat-fingered `5`
 * (meant as 5% but read as 500%) doesn't silently disable the gate at a
 * surprising threshold.
 */
export function resolveMaxRate(
  env: Record<string, string | undefined>
): number | null {
  const raw = env.FLAKE_MAX_RATE?.trim()
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 1) return null
  return n
}

/** The outcome of applying a gate threshold to a computed metric. */
export interface FlakeGate {
  /** Was a threshold supplied (gating mode on)? */
  gated: boolean
  /** Did the measured flake rate exceed the threshold? (false when non-gating) */
  exceeded: boolean
  /** The resolved threshold, or null when non-gating. */
  maxRate: number | null
  /** The measured flake rate carried through for reporting. */
  flakeRate: number
}

/**
 * Decide whether a metric trips the gate. NON-GATING when `maxRate` is null:
 * `gated:false, exceeded:false` regardless of the rate (data, not a break).
 * GATING when a threshold is set: `exceeded` is true iff the measured flake
 * rate is STRICTLY greater than the threshold — so `maxRate=0` fails on the
 * first flake, while `maxRate=0` against a 0% measured rate passes (0 > 0 is
 * false). The orchestrator maps `exceeded` to a non-zero exit code.
 */
export function evaluateFlakeGate(
  metric: FlakeMetric,
  maxRate: number | null
): FlakeGate {
  if (maxRate === null) {
    return {
      gated: false,
      exceeded: false,
      maxRate: null,
      flakeRate: metric.flakeRate,
    }
  }
  return {
    gated: true,
    exceeded: metric.flakeRate > maxRate,
    maxRate,
    flakeRate: metric.flakeRate,
  }
}

/** One-line human verdict for the gate, for the console + CI step summary. */
export function formatGateVerdict(gate: FlakeGate): string {
  if (!gate.gated) {
    return `Gate: non-gating (FLAKE_MAX_RATE unset) — flake rate ${pct(gate.flakeRate)} recorded as data.`
  }
  if (gate.exceeded) {
    return `Gate: ❌ FAIL — flake rate ${pct(gate.flakeRate)} exceeds the ${pct(gate.maxRate as number)} ceiling.`
  }
  return `Gate: ✅ PASS — flake rate ${pct(gate.flakeRate)} within the ${pct(gate.maxRate as number)} ceiling.`
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
