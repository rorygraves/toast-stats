/**
 * Pipeline Freshness Check — Runner (#753)
 *
 * Thin glue around the pure functions in ./lib/pipelineFreshness.js:
 *   1. fetch the published v1/latest.json (production CDN by default),
 *   2. evaluate its freshness against a threshold,
 *   3. emit a stale/fresh decision + alert body for the monitor workflow.
 *
 * No decision logic lives here — that is unit-tested in
 * scripts/lib/__tests__/pipelineFreshness.test.ts. All logging goes to
 * stderr (R4); stdout/$GITHUB_OUTPUT carry only the structured decision.
 *
 * Env:
 *   MANIFEST_URL    — manifest to check (default: production CDN bucket)
 *   THRESHOLD_HOURS — staleness threshold in hours (default: 26)
 *
 * The process always exits 0; the workflow decides whether to open an
 * issue (and to mark the run red) based on the `stale` output. This keeps
 * the issue-create step reachable even when the manifest is stale.
 */

import { appendFileSync, writeFileSync } from 'node:fs'
import {
  parseManifest,
  evaluateFreshness,
  buildAlertIssueBody,
  STALE_THRESHOLD_HOURS,
  type FreshnessResult,
} from './lib/pipelineFreshness.js'

const DEFAULT_MANIFEST_URL =
  'https://storage.googleapis.com/toast-stats-data-ca/v1/latest.json'

function log(msg: string): void {
  process.stderr.write(`${msg}\n`)
}

function emitOutput(key: string, value: string): void {
  const out = process.env.GITHUB_OUTPUT
  if (out) appendFileSync(out, `${key}=${value}\n`)
}

async function main(): Promise<void> {
  const manifestUrl = process.env.MANIFEST_URL || DEFAULT_MANIFEST_URL
  const thresholdHours = process.env.THRESHOLD_HOURS
    ? Number(process.env.THRESHOLD_HOURS)
    : STALE_THRESHOLD_HOURS
  const now = new Date()

  log(`Checking pipeline freshness: ${manifestUrl}`)
  log(`Threshold: ${thresholdHours}h | Now: ${now.toISOString()}`)

  let result: FreshnessResult

  try {
    const res = await fetch(manifestUrl, {
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    const manifest = parseManifest(await res.text())
    result = evaluateFreshness(manifest, now, thresholdHours)
  } catch (err) {
    // A fetch/parse failure is itself an alert condition — the CDN is
    // unreachable or serving garbage, which is exactly the silent outage
    // the monitor exists to catch.
    const message = err instanceof Error ? err.message : String(err)
    log(`Failed to fetch/parse manifest: ${message}`)
    result = {
      stale: true,
      reason: `could not fetch or parse the manifest: ${message}`,
      ageHours: null,
      generatedAt: null,
      latestSnapshotDate: null,
      thresholdHours,
    }
  }

  log(`Result: ${result.reason}`)

  emitOutput('stale', String(result.stale))
  emitOutput(
    'title',
    result.stale
      ? `🚨 Daily data pipeline stale — ${result.latestSnapshotDate ?? 'no snapshot date'}`
      : 'pipeline fresh'
  )

  if (result.stale) {
    const body = buildAlertIssueBody(result, { manifestUrl, now })
    const bodyFile = '/tmp/pipeline-freshness-body.md'
    writeFileSync(bodyFile, body)
    emitOutput('body_file', bodyFile)
    log('Manifest is STALE — alert body written.')
  } else {
    log('Manifest is fresh — no alert.')
  }
}

main().catch(err => {
  log(`Unexpected error: ${err instanceof Error ? err.stack : String(err)}`)
  // Surface as stale so the monitor still alerts rather than passing silently.
  emitOutput('stale', 'true')
  emitOutput('title', '🚨 Pipeline freshness monitor crashed')
  process.exit(0)
})
