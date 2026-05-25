import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { integrationGlobs, baseExclude } from './vitest.shared.mjs'

// Test config is split into two first-class projects (#482):
//   - `unit`        — fast (~18-20s, well under the 30s pre-push budget),
//                     contention-free tests. Run by the pre-push hook.
//   - `integration` — page mounts, journeys, axe scans (the heavy tests that
//                     made the full-suite pre-push gate chronically flaky on
//                     multi-core dev machines).
// The partition is defined once in vitest.shared.mjs and enforced by
// scripts/check-test-projects.mjs. Running `vitest` with no --project filter
// (as CI does, with --coverage) runs BOTH projects, so coverage is unchanged.
export default defineConfig({
  plugins: [react()],
  define: {
    // eslint-disable-next-line no-undef
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || 'dev'),
  },
  test: {
    // Shared defaults — inherited by each project via `extends: true`.
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    // Set aggressive timeout limits for fast test execution
    testTimeout: 5000, // 5 seconds max per test
    hookTimeout: 5000, // 5 seconds max for setup/teardown hooks
    // Cap local worker forks at 3. The default (one fork per core) saturates
    // a busy dev machine — when something else is eating CPU (a background OS
    // update/reindex, a persistent VM like Rancher Desktop, another build),
    // forks starve each other and fast tests blow the 5s timeout, failing the
    // pre-push gate for reasons unrelated to the code (worker-saturation
    // flakiness, #473 / Lesson 53). A 50% cap still left ~4 timeouts on a
    // heavily-contended machine; a fixed 3 forks gives each enough headroom
    // to finish in time. CI runners are small and not oversubscribed, so they
    // keep the default for full throughput.
    // eslint-disable-next-line no-undef
    maxWorkers: process.env.CI ? undefined : 3,
    exclude: baseExclude,
    coverage: {
      exclude: [...baseExclude],
      thresholds: {
        lines: 55,
        branches: 55,
        functions: 55,
        statements: 55,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          // Everything except the heavy integration globs.
          exclude: [...baseExclude, ...integrationGlobs],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: integrationGlobs,
          exclude: baseExclude,
        },
      },
    ],
  },
})
