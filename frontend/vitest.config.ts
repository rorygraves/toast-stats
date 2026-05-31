import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import {
  integrationGlobs,
  baseExclude,
  resolveMaxWorkers,
} from './vitest.shared.mjs'

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
    // Timeouts carry headroom for machine saturation: the red-barkeep sprint-runner
    // fleet runs several builds/test-suites concurrently, and a correct fast test
    // (CollapsibleSection, normally ~ms) was observed taking 8.3s under that
    // contention. 5s flaked correct tests at the pre-push gate; 15s — matching the
    // heavy-journey override in 03-DcpProgressFlow — absorbs the load without
    // masking real hangs (these tests pass in <1s un-contended). #1003 / #473 / L53
    testTimeout: 15000,
    hookTimeout: 15000,
    // Worker-count policy lives in vitest.shared.mjs so the guard test can't
    // drift from it (V8, #914). Local: fixed 3 forks (a busy dev machine
    // saturates at one-fork-per-core and blows the 5s timeout — #473 / Lesson
    // 53). CI: capped at 50% of cores so an oversubscribed runner can't convert
    // contention into red builds (previously `undefined` = unbounded, the
    // Sprint 1 deep-dive's single highest-leverage flake amplifier).
    // eslint-disable-next-line no-undef
    maxWorkers: resolveMaxWorkers(process.env),
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
