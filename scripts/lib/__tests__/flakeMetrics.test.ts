/**
 * Unit tests for the flake-detection metric computation (#913, epic #917 S2).
 *
 * The flake-detection harness runs a target test set N× under the real CI
 * invocation and feeds the per-run results to these PURE functions. The metric
 * is deliberately variance-aware: Sprint 1's deep-dive (L53) showed contention
 * is first absorbed as *slowness* and only past a threshold converts to
 * *failure* — so the metric reports duration percentiles, not just a pass/fail
 * rate. The headline `flakeRate` is the fraction of runs that failed across an
 * otherwise-unchanged suite (any failure on unchanged code == flake).
 *
 * RED phase: written before scripts/lib/flakeMetrics.ts exists.
 */

import { describe, it, expect } from 'vitest'
import {
  computeFlakeMetric,
  formatFlakeSummary,
  type RunResult,
  type FlakeMetric,
} from '../flakeMetrics'

const run = (passed: boolean, durationMs: number): RunResult => ({
  passed,
  durationMs,
})

describe('computeFlakeMetric', () => {
  it('reports zero flake when every run passes', () => {
    const runs = [run(true, 100), run(true, 120), run(true, 110)]
    const m = computeFlakeMetric(runs)
    expect(m.totalRuns).toBe(3)
    expect(m.failedRuns).toBe(0)
    expect(m.flakeRate).toBe(0)
    expect(m.passRate).toBe(1)
  })

  it('flakeRate is the fraction of runs that failed', () => {
    // 1 of 4 failed → 0.25
    const runs = [
      run(true, 100),
      run(false, 200),
      run(true, 90),
      run(true, 110),
    ]
    const m = computeFlakeMetric(runs)
    expect(m.totalRuns).toBe(4)
    expect(m.failedRuns).toBe(1)
    expect(m.flakeRate).toBeCloseTo(0.25, 10)
    expect(m.passRate).toBeCloseTo(0.75, 10)
  })

  it('reports full flake when every run fails', () => {
    const m = computeFlakeMetric([run(false, 300), run(false, 280)])
    expect(m.flakeRate).toBe(1)
    expect(m.passRate).toBe(0)
  })

  it('computes duration min/max across runs', () => {
    const runs = [run(true, 50), run(true, 210), run(true, 90)]
    const m = computeFlakeMetric(runs)
    expect(m.durationMsMin).toBe(50)
    expect(m.durationMsMax).toBe(210)
  })

  it('computes p50/p95 with nearest-rank on sorted durations', () => {
    // durations 10..100 in tens, 10 samples.
    const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    const m = computeFlakeMetric(durations.map(d => run(true, d)))
    // nearest-rank: p50 -> ceil(0.5*10)=5th value (50); p95 -> ceil(0.95*10)=10th (100)
    expect(m.durationMsP50).toBe(50)
    expect(m.durationMsP95).toBe(100)
  })

  it('p50 and p95 collapse to the single sample with one run', () => {
    const m = computeFlakeMetric([run(true, 137)])
    expect(m.durationMsP50).toBe(137)
    expect(m.durationMsP95).toBe(137)
    expect(m.durationMsMin).toBe(137)
    expect(m.durationMsMax).toBe(137)
  })

  it('throws on zero runs — an empty harness result is a harness bug, not 0% flake', () => {
    expect(() => computeFlakeMetric([])).toThrow()
  })

  it('captures the per-run breakdown verbatim for the report artifact', () => {
    const runs = [run(true, 100), run(false, 200)]
    const m = computeFlakeMetric(runs)
    expect(m.runs).toEqual(runs)
  })
})

describe('formatFlakeSummary', () => {
  const metric: FlakeMetric = {
    totalRuns: 10,
    failedRuns: 1,
    flakeRate: 0.1,
    passRate: 0.9,
    durationMsMin: 38000,
    durationMsMax: 210000,
    durationMsP50: 41000,
    durationMsP95: 200000,
    runs: [],
  }

  it('renders a markdown table with the headline flake rate as a percentage', () => {
    const md = formatFlakeSummary(metric, { label: 'suspect-set', repeats: 10 })
    expect(md).toContain('Flake rate')
    expect(md).toContain('10.0%') // 0.1 -> 10.0%
    expect(md).toContain('suspect-set')
    expect(md).toMatch(/\|/) // it is a markdown table
  })

  it('surfaces the duration spread so variance (L53) is visible, not just pass/fail', () => {
    const md = formatFlakeSummary(metric, { label: 'suspect-set', repeats: 10 })
    // p50 and p95 in seconds — the 41s vs 200s swing is the variance signal.
    expect(md).toContain('41.0s')
    expect(md).toContain('200.0s')
  })
})
