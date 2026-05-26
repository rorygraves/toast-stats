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
  resolveThresholdHours,
  type FreshnessResult,
} from './lib/pipelineFreshness.js'

const DEFAULT_MANIFEST_URL =
  'https://storage.googleapis.com/toast-stats-data-ca/v1/latest.json'

const BODY_FILE = '/tmp/pipeline-freshness-body.md'

function log(msg: string): void {
  process.stderr.write(`${msg}\n`)
}

function emitOutput(key: string, value: string): void {
  const out = process.env.GITHUB_OUTPUT
  if (out) appendFileSync(out, `${key}=${value}\n`)
}

/**
 * Emit the stale/fresh decision for the workflow. When stale, ALWAYS write
 * the alert body and emit `body_file` so the issue-create step never runs
 * with an empty `--body-file` — including the crash path.
 */
function emitDecision(
  result: FreshnessResult,
  manifestUrl: string,
  now: Date
): void {
  emitOutput('stale', String(result.stale))
  emitOutput(
    'title',
    result.stale
      ? `🚨 Daily data pipeline stale — ${result.latestSnapshotDate ?? 'no snapshot date'}`
      : 'pipeline fresh'
  )
  if (result.stale) {
    writeFileSync(BODY_FILE, buildAlertIssueBody(result, { manifestUrl, now }))
    emitOutput('body_file', BODY_FILE)
    log('Manifest is STALE — alert body written.')
  } else {
    log('Manifest is fresh — no alert.')
  }
}

async function main(): Promise<void> {
  const manifestUrl = process.env.MANIFEST_URL || DEFAULT_MANIFEST_URL
  const thresholdHours = resolveThresholdHours(process.env.THRESHOLD_HOURS)
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
  emitDecision(result, manifestUrl, now)
}

main().catch(err => {
  const message =
    err instanceof Error ? (err.stack ?? err.message) : String(err)
  log(`Unexpected error: ${message}`)
  // Surface as stale — with a real body — so the monitor still alerts rather
  // than passing silently, and the issue-create step always has a body file.
  emitDecision(
    {
      stale: true,
      reason: `pipeline freshness monitor crashed: ${message}`,
      ageHours: null,
      generatedAt: null,
      latestSnapshotDate: null,
      thresholdHours: resolveThresholdHours(process.env.THRESHOLD_HOURS),
    },
    process.env.MANIFEST_URL || DEFAULT_MANIFEST_URL,
    new Date()
  )
  process.exit(0)
})
