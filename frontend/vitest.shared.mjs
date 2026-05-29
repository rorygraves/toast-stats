import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Single source of truth for the vitest unit/integration partition (#482).
//
// Imported by BOTH vitest.config.ts (to define the projects) and
// scripts/check-test-projects.mjs (the partition guard). Keeping one
// definition means the guard can never drift from the real config.
//
// A test belongs to the `integration` project when it mounts a full page
// or <App/>, runs an axe-core accessibility scan, or exercises a
// multi-component journey — the heavy tests that saturate worker threads
// on a multi-core dev machine and made the old full-suite pre-push hook
// chronically flaky (see tasks/473-flaky-prepush-diagnosis-2026-05-11.md).
// Everything else is a fast, contention-free `unit` test.
//
// Convention for NEW heavy tests (so they auto-route to integration):
//   - page-mount tests        → src/pages/__tests__/
//   - multi-step journeys      → src/__tests__/integration/
//   - axe / a11y scans         → src/__tests__/accessibility/
//   - or name the file          *.integration.test.tsx / *.a11y.test.tsx
// The partition guard (`npm run test:projects:check`) fails if any test
// file lands in neither project, so a mis-placed test is caught in CI
// rather than silently dropping out of both gates.

// V8 (#914, epic #917 S3) — the worker-count policy, sourced once so the real
// vitest config and its guard test (src/__tests__/config/maxWorkers.guard.test.ts)
// can never disagree.
//
// The Sprint 1 deep-dive named `maxWorkers: CI ? undefined : 3` the single
// highest-leverage flake amplifier: `undefined` lets CI spawn one fork per core,
// so an oversubscribed runner converts ambient timing-sensitivity into 5s-timeout
// failures (contention, not a regression). Local dev was already capped at a
// fixed 3 forks; CI was unbounded. We now cap CI at 50% of cores — half the box
// stays free for the main thread + v8 coverage instrumentation, which is exactly
// the headroom that keeps fast tests under the 5s timeout. The calibrated CI
// baseline was already 0% at unbounded on a clean runner; the cap is the durable
// guard against a future oversubscribed/larger runner drifting toward the
// workstation stress ceiling (100% flake, 30.9→171.9s spread).
//
// NOTE: the non-gating flake-detection harness (scripts/run-flake-detection.ts)
// deliberately OVERRIDES this with `--maxWorkers=100%` so the DETECTOR stays
// maximally sensitive while the GATE stays capped/stable.
export function resolveMaxWorkers(env) {
  return env && env.CI ? '50%' : 3
}

export const integrationGlobs = [
  'src/__tests__/integration/**/*.test.{ts,tsx}',
  'src/__tests__/accessibility/**/*.test.{ts,tsx}',
  'src/__tests__/responsive/**/*.test.{ts,tsx}',
  'src/pages/__tests__/**/*.test.{ts,tsx}',
  'src/**/*.integration.test.{ts,tsx}',
  'src/**/*.a11y.test.{ts,tsx}',
  'src/**/*.accessibility.test.{ts,tsx}',
  // Legacy axe-on-component scans that predate the naming convention above.
  // New axe tests should use a *.accessibility.test.tsx name or the
  // accessibility/ directory; these are grandfathered in explicitly.
  'src/__tests__/Accessibility.test.tsx',
  'src/components/__tests__/ChartAccessibility.test.tsx',
  'src/components/__tests__/KeyboardAccessibility.test.tsx',
  'src/__tests__/utils/examples/AccessibilityTestingExamples.test.tsx',
]

// Quarantined tests (#913, epic #917 S2) are excluded from the BLOCKING run so
// a known-flaky test never silently blocks the queue. Folding them into the
// shared baseExclude removes them from ALL / unit / integration consistently,
// so the partition guard (R20) stays exhaustive — the file leaves every set at
// once rather than orphaning. They are NOT silently ignored: the non-gating
// flake-detection harness (scripts/run-flake-detection.ts) still runs them, and
// `npm run test:quarantine:check` fails CI if an entry lacks a reason/issue
// (quarantine != skip, R1). Empty list → no-op.
function quarantinedExcludes() {
  const file = join(
    dirname(fileURLToPath(import.meta.url)),
    'test-quarantine.json'
  )
  try {
    const { quarantined } = JSON.parse(readFileSync(file, 'utf8'))
    return Array.isArray(quarantined) ? quarantined.map(e => e.file) : []
  } catch {
    // A malformed/absent file is surfaced loudly by the quarantine gate; here
    // we fail safe to "exclude nothing" so a typo can't silently drop coverage.
    return []
  }
}

// Shared base exclude (mirrors vitest defaults we care about + repo artifacts).
export const baseExclude = [
  '**/node_modules/**',
  '**/dist/**',
  '**/test-dir/**',
  ...quarantinedExcludes(),
]
