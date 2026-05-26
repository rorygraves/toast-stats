/**
 * Unit tests for scripts/lib/pipelineFreshness.ts (#753)
 *
 * The daily Data Pipeline writes v1/latest.json with a `generatedAt`
 * timestamp on every successful run. When a scheduled run is silently
 * dropped by GitHub, generatedAt stops advancing — these pure functions
 * decide whether the manifest is stale enough to alert on.
 */

import { describe, it, expect } from 'vitest'
import {
  parseManifest,
  evaluateFreshness,
  buildAlertIssueBody,
  resolveThresholdHours,
  STALE_THRESHOLD_HOURS,
  type LatestManifest,
} from '../pipelineFreshness'

// Reference "now": 2026-05-26T14:00:00Z (when the monitor cron fires)
const NOW = new Date('2026-05-26T14:00:00Z')

// ── parseManifest ────────────────────────────────────────────────────────

describe('parseManifest', () => {
  it('parses a well-formed manifest', () => {
    const raw = JSON.stringify({
      _format: { version: '1.0.0', type: 'manifest' },
      latestSnapshotDate: '2026-05-25',
      generatedAt: '2026-05-26T08:01:00.000Z',
    })
    const m = parseManifest(raw)
    expect(m.latestSnapshotDate).toBe('2026-05-25')
    expect(m.generatedAt).toBe('2026-05-26T08:01:00.000Z')
  })

  it('throws on invalid JSON rather than returning a partial object', () => {
    expect(() => parseManifest('not json')).toThrow()
  })
})

// ── evaluateFreshness ──────────────────────────────────────────────────────

describe('evaluateFreshness', () => {
  it('is fresh when generatedAt is within the threshold (ran today)', () => {
    const manifest: LatestManifest = {
      latestSnapshotDate: '2026-05-25',
      generatedAt: '2026-05-26T08:01:00.000Z', // 6h ago
    }
    const r = evaluateFreshness(manifest, NOW)
    expect(r.stale).toBe(false)
    expect(r.ageHours).toBeCloseTo(6, 1)
    expect(r.thresholdHours).toBe(STALE_THRESHOLD_HOURS)
  })

  it('is fresh at exactly the threshold boundary (not strictly older)', () => {
    // 26h before NOW
    const manifest: LatestManifest = {
      generatedAt: '2026-05-25T12:00:00.000Z',
    }
    const r = evaluateFreshness(manifest, NOW, 26)
    expect(r.ageHours).toBeCloseTo(26, 5)
    expect(r.stale).toBe(false)
  })

  it('is stale when generatedAt is older than the threshold (missed run)', () => {
    // matches the real 2026-05-26 incident: last good run was 05-25 ~11:57Z
    const manifest: LatestManifest = {
      latestSnapshotDate: '2026-05-24',
      generatedAt: '2026-05-25T11:57:32.518Z', // ~26.04h ago
    }
    const r = evaluateFreshness(manifest, NOW)
    expect(r.stale).toBe(true)
    expect(r.ageHours).toBeGreaterThan(26)
    expect(r.reason).toMatch(/stale/i)
  })

  it('is stale when generatedAt is missing entirely', () => {
    const r = evaluateFreshness({ latestSnapshotDate: '2026-05-25' }, NOW)
    expect(r.stale).toBe(true)
    expect(r.ageHours).toBeNull()
    expect(r.reason).toMatch(/missing/i)
  })

  it('is stale when generatedAt is unparseable', () => {
    const r = evaluateFreshness({ generatedAt: 'yesterday-ish' }, NOW)
    expect(r.stale).toBe(true)
    expect(r.ageHours).toBeNull()
    expect(r.reason).toMatch(/unparseable|invalid/i)
  })

  it('honours a custom threshold', () => {
    const manifest: LatestManifest = {
      generatedAt: '2026-05-26T08:00:00.000Z', // 6h ago
    }
    expect(evaluateFreshness(manifest, NOW, 4).stale).toBe(true)
    expect(evaluateFreshness(manifest, NOW, 8).stale).toBe(false)
  })
})

// ── resolveThresholdHours ──────────────────────────────────────────────────

describe('resolveThresholdHours', () => {
  it('uses the default when the value is undefined or empty', () => {
    expect(resolveThresholdHours(undefined)).toBe(STALE_THRESHOLD_HOURS)
    expect(resolveThresholdHours('')).toBe(STALE_THRESHOLD_HOURS)
  })

  it('parses a valid positive number', () => {
    expect(resolveThresholdHours('12')).toBe(12)
    expect(resolveThresholdHours('4.5')).toBe(4.5)
  })

  it('falls back to the default for non-numeric or non-positive input', () => {
    // A typo'd manual threshold must NOT silently disable the alert by
    // making `ageHours > NaN` always false.
    expect(resolveThresholdHours('abc')).toBe(STALE_THRESHOLD_HOURS)
    expect(resolveThresholdHours('0')).toBe(STALE_THRESHOLD_HOURS)
    expect(resolveThresholdHours('-5')).toBe(STALE_THRESHOLD_HOURS)
  })
})

// ── buildAlertIssueBody ────────────────────────────────────────────────────

describe('buildAlertIssueBody', () => {
  it('includes the age, last snapshot date, and the manual recovery command', () => {
    const result = evaluateFreshness(
      {
        latestSnapshotDate: '2026-05-24',
        generatedAt: '2026-05-25T11:57:32.518Z',
      },
      NOW
    )
    const body = buildAlertIssueBody(result, {
      manifestUrl:
        'https://storage.googleapis.com/toast-stats-data-ca/v1/latest.json',
      now: NOW,
    })
    expect(body).toContain('2026-05-24') // last snapshot date
    expect(body).toContain('gh workflow run data-pipeline.yml -f mode=daily')
    expect(body).toMatch(/26\.0\d?\s*h|26\.0/) // approximate age surfaced
    expect(body).toContain('toast-stats-data-ca/v1/latest.json')
  })

  it('handles the missing-generatedAt case without crashing', () => {
    const result = evaluateFreshness({}, NOW)
    const body = buildAlertIssueBody(result, {
      manifestUrl: 'https://example.com/latest.json',
      now: NOW,
    })
    expect(body).toMatch(/missing/i)
    expect(body).toContain('gh workflow run data-pipeline.yml -f mode=daily')
  })
})
