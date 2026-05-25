import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke test configuration for staging environment (#316)
 *
 * Runs against a deployed URL (staging or production).
 * Set BASE_URL env var to override the default staging URL.
 *
 * Two engines (#710): `smoke` runs in Chromium (default), `webkit` runs in
 * WebKit/Safari. #685 verified contrast in Chromium-at-rest only and missed
 * a Safari-visible regression; running smokes in WebKit too closes that
 * blind spot. Run one engine with `--project=webkit`.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env['BASE_URL'] || 'https://staging-toast-stats.web.app',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'smoke',
      testMatch: '**/*.smoke.ts',
    },
    {
      name: 'webkit',
      testMatch: '**/*.smoke.ts',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
