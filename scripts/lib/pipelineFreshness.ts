/**
 * Pipeline Freshness Evaluation — Pure Functions (#753)
 *
 * The daily Data Pipeline (`.github/workflows/data-pipeline.yml`) writes
 * `v1/latest.json` with a `generatedAt` ISO timestamp on every successful
 * run, then promotes it to the production CDN bucket. When GitHub silently
 * drops a scheduled run (observed 2026-05-26), nothing fails — the CDN just
 * keeps serving the last manifest and `generatedAt` stops advancing.
 *
 * These pure functions decide, given a fetched manifest and the current
 * time, whether the snapshot is stale enough to alert on. No network or
 * GCS I/O lives here so the decision logic is unit-testable; the monitor
 * workflow supplies the fetched body and `new Date()`.
 */

/** Minimum shape of v1/latest.json we depend on. */
export interface LatestManifest {
  /** Snapshot date the manifest points at, e.g. "2026-05-25". */
  latestSnapshotDate?: string
  /** ISO-8601 timestamp of when this manifest was generated. */
  generatedAt?: string
  _format?: { version?: string; type?: string }
}

export interface FreshnessResult {
  /** True when the manifest is older than the threshold (or unreadable). */
  stale: boolean
  /** Human-readable reason, suitable for the alert title/body. */
  reason: string
  /** Age of the manifest in hours, or null when generatedAt is unusable. */
  ageHours: number | null
  /** The raw generatedAt string we evaluated (or null when absent). */
  generatedAt: string | null
  /** The snapshot date the manifest points at (or null when absent). */
  latestSnapshotDate: string | null
  /** The threshold used for the decision. */
  thresholdHours: number
}

/**
 * Default staleness threshold. The primary cron fires at 08:00 UTC with a
 * backup a few hours later; a healthy manifest is at most ~hours old when the
 * monitor runs. 26h cleanly separates "ran today" (< ~12h) from "missed
 * today" (> 24h) while tolerating the spread between primary and backup runs.
 */
export const STALE_THRESHOLD_HOURS = 26

const MS_PER_HOUR = 1000 * 60 * 60

/** Parse the manifest body, throwing on invalid JSON. */
export function parseManifest(raw: string): LatestManifest {
  const parsed = JSON.parse(raw) as unknown
  if (parsed === null || typeof parsed !== 'object') {
    throw new Error('manifest is not a JSON object')
  }
  return parsed as LatestManifest
}

/**
 * Decide whether a manifest is stale relative to `now`.
 * A missing or unparseable `generatedAt` is treated as stale — the monitor
 * should shout, not silently pass, when the freshness signal is unreadable.
 */
export function evaluateFreshness(
  manifest: LatestManifest,
  now: Date,
  thresholdHours: number = STALE_THRESHOLD_HOURS
): FreshnessResult {
  const latestSnapshotDate = manifest.latestSnapshotDate ?? null
  const base = { thresholdHours, latestSnapshotDate }

  if (!manifest.generatedAt) {
    return {
      ...base,
      stale: true,
      reason: 'manifest is missing a `generatedAt` timestamp',
      ageHours: null,
      generatedAt: null,
    }
  }

  const generatedMs = Date.parse(manifest.generatedAt)
  if (Number.isNaN(generatedMs)) {
    return {
      ...base,
      stale: true,
      reason: `manifest has an invalid/unparseable \`generatedAt\`: ${manifest.generatedAt}`,
      ageHours: null,
      generatedAt: manifest.generatedAt,
    }
  }

  const ageHours = (now.getTime() - generatedMs) / MS_PER_HOUR
  const stale = ageHours > thresholdHours
  return {
    ...base,
    stale,
    generatedAt: manifest.generatedAt,
    ageHours,
    reason: stale
      ? `manifest is stale: ${ageHours.toFixed(1)}h old (> ${thresholdHours}h threshold)`
      : `manifest is fresh: ${ageHours.toFixed(1)}h old (<= ${thresholdHours}h threshold)`,
  }
}

export interface AlertBodyOptions {
  /** Public URL the manifest was fetched from. */
  manifestUrl: string
  /** Evaluation time, surfaced in the alert for context. */
  now: Date
}

/** Build the markdown body for the freshness alert issue. */
export function buildAlertIssueBody(
  result: FreshnessResult,
  opts: AlertBodyOptions
): string {
  const ageLine =
    result.ageHours === null
      ? '**Manifest age:** unknown (generatedAt missing or unparseable)'
      : `**Manifest age:** ${result.ageHours.toFixed(1)}h (threshold ${result.thresholdHours}h)`

  return [
    '## 🚨 Daily data pipeline may have missed a run',
    '',
    `The freshness monitor checked \`${opts.manifestUrl}\` at ${opts.now.toISOString()} and found the published snapshot stale.`,
    '',
    `- ${ageLine}`,
    `- **Reason:** ${result.reason}`,
    `- **Last snapshot date:** ${result.latestSnapshotDate ?? 'unknown'}`,
    `- **generatedAt:** ${result.generatedAt ?? 'missing'}`,
    '',
    '### Likely cause',
    '',
    'GitHub silently dropped the scheduled `Data Pipeline` run (`schedule` events are best-effort and can be dropped with no failure record), or the run failed before promoting `v1/latest.json` to production.',
    '',
    '### Manual recovery',
    '',
    'Re-run the daily pipeline from the CLI:',
    '',
    '```bash',
    'gh workflow run data-pipeline.yml -f mode=daily',
    '```',
    '',
    'To confirm dispatch queues without writing prod data, use the safe no-op:',
    '',
    '```bash',
    'gh workflow run data-pipeline.yml -f mode=prune -f dry_run=true',
    '```',
    '',
    'See `docs/runbooks/data-pipeline-recovery.md` for the full runbook.',
    '',
    '---',
    '_Filed automatically by `.github/workflows/pipeline-freshness-monitor.yml` (#753)._',
  ].join('\n')
}
