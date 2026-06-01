import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'src/**/__tests__/**/*.ts',
    ],
    // `__tests__/**/*.ts` would otherwise collect shared support files; skip the
    // underscore-prefixed helpers (e.g. _fixture-fetch.ts) while keeping defaults.
    exclude: ['**/node_modules/**', '**/dist/**', 'src/**/__tests__/**/_*.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/__fixtures__/**',
      ],
      thresholds: {
        lines: 85,
        branches: 70,
        functions: 90,
        statements: 85,
      },
    },
    testTimeout: 30000,
  },
})
