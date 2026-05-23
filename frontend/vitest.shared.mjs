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

// Shared base exclude (mirrors vitest defaults we care about + repo artifacts).
export const baseExclude = [
  '**/node_modules/**',
  '**/dist/**',
  '**/test-dir/**',
]
