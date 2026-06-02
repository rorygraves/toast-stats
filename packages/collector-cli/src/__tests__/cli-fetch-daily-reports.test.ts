import { describe, expect, it } from 'vitest'

import { createCLI } from '../cli.js'

/**
 * Sprint 3 #1065 — the `fetch-daily-reports` command must be registered so the
 * collector can actually run the ingest (fetch → build → write). Behaviour of
 * the ingest itself is covered by DistrictReportsIngest.integration.test.ts;
 * this guards the CLI wiring + option surface (a dropped command ships green).
 */
describe('CLI: fetch-daily-reports command', () => {
  const command = createCLI().commands.find(
    c => c.name() === 'fetch-daily-reports'
  )

  it('is registered', () => {
    expect(command).toBeDefined()
  })

  it('exposes the date / districts / program-year / rate-ms options', () => {
    const flags = command!.options.map(o => o.long)
    expect(flags).toEqual(
      expect.arrayContaining([
        '--date',
        '--districts',
        '--program-year',
        '--rate-ms',
        '--config',
      ])
    )
  })
})
