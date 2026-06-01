import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CdnClient } from '../index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixtureDir = join(here, '..', '__fixtures__')

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, name), 'utf8'))
}

/**
 * Maps a CDN path (the part after the base URL) to a committed fixture file.
 * Any path not in this map is treated as a 404 (file does not exist on the CDN).
 */
const ROUTES: Record<string, string> = {
  '/v1/latest.json': 'latest.json',
  '/v1/dates.json': 'dates.json',
  '/config/district-snapshot-index.json': 'district-snapshot-index.json',
  '/config/club-index.json': 'club-index.json',
  '/v1/rankings.json': 'v1-rankings.json',
  '/snapshots/2026-05-31/all-districts-rankings.json':
    'dated-all-districts-rankings.json',
}

const BASE = 'https://cdn.taverns.red'

/** A fetch stub that serves committed fixtures and 404s everything else. */
function fixtureFetch(): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString()
    const path = url.replace(BASE, '')
    const file = ROUTES[path]
    if (!file) {
      return new Response('not found', { status: 404 })
    }
    return new Response(readFileSync(join(fixtureDir, file), 'utf8'), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
}

function client(fetchFn: typeof fetch = fixtureFetch()): CdnClient {
  return new CdnClient({ baseUrl: BASE, fetchFn })
}

const latestDate = (fixture('latest.json') as { latestSnapshotDate: string })
  .latestSnapshotDate

describe('CdnClient — discovery reads', () => {
  it('reads v1/latest.json and surfaces the latest snapshot date + source URL', async () => {
    const res = await client().getLatestDate()
    expect(res.available).toBe(true)
    if (!res.available) return
    expect(res.data.latestSnapshotDate).toBe(latestDate)
    expect(res.date).toBe(latestDate)
    expect(res.sourceUrl).toBe(`${BASE}/v1/latest.json`)
  })

  it('reads v1/dates.json into a typed list of dates', async () => {
    const res = await client().listDates()
    expect(res.available).toBe(true)
    if (!res.available) return
    expect(Array.isArray(res.data.dates)).toBe(true)
    expect(res.data.dates.length).toBeGreaterThan(0)
    expect(res.data.dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(res.sourceUrl).toBe(`${BASE}/v1/dates.json`)
  })

  it('reads the per-district snapshot index', async () => {
    const res = await client().getDistrictSnapshotIndex()
    expect(res.available).toBe(true)
    if (!res.available) return
    const ids = Object.keys(res.data.districts)
    expect(ids.length).toBeGreaterThan(0)
    expect(res.data.districts[ids[0]!]![0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(res.sourceUrl).toBe(`${BASE}/config/district-snapshot-index.json`)
  })

  it('reads the club index and resolves a known club to its district', async () => {
    const res = await client().getClubIndex()
    expect(res.available).toBe(true)
    if (!res.available) return
    const clubId = Object.keys(res.data.clubs)[0]!
    const expectedDistrict = res.data.clubs[clubId]!.districtId

    const resolved = await client().resolveClubDistrict(clubId)
    expect(resolved.available).toBe(true)
    if (!resolved.available) return
    expect(resolved.data.districtId).toBe(expectedDistrict)
    expect(resolved.data.clubId).toBe(clubId)
  })

  it('returns not-available for an unknown club id (never guesses)', async () => {
    const resolved = await client().resolveClubDistrict('00000000')
    expect(resolved.available).toBe(false)
    if (resolved.available) return
    expect(resolved.reason).toMatch(/not available/i)
  })
})

describe('CdnClient — core analytics reads', () => {
  it('reads v1/rankings.json, validating elements against the shared DistrictRanking schema', async () => {
    const res = await client().getRankings()
    expect(res.available).toBe(true)
    if (!res.available) return
    expect(res.data.rankings.length).toBeGreaterThan(0)
    expect(typeof res.data.rankings[0]!.districtId).toBe('string')
    expect(typeof res.data.rankings[0]!.paidClubs).toBe('number')
    expect(res.date).toBe(res.data.date)
    expect(res.sourceUrl).toBe(`${BASE}/v1/rankings.json`)
  })

  it('reads a dated all-districts-rankings.json against the shared AllDistrictsRankings schema', async () => {
    const res = await client().getDistrictRankingsForDate(latestDate)
    expect(res.available).toBe(true)
    if (!res.available) return
    expect(res.data.metadata.snapshotId).toBe(latestDate)
    expect(res.data.rankings.length).toBeGreaterThan(0)
    expect(res.date).toBe(latestDate)
    expect(res.sourceUrl).toBe(
      `${BASE}/snapshots/${latestDate}/all-districts-rankings.json`
    )
  })
})

describe('CdnClient — failure handling (not-available, never throw)', () => {
  it('returns typed not-available for a missing file (404), never throws', async () => {
    const res = await client().getDistrictRankingsForDate('1900-01-01')
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/not available/i)
    expect(res.sourceUrl).toBe(
      `${BASE}/snapshots/1900-01-01/all-districts-rankings.json`
    )
  })

  it('returns not-available when the network rejects, never throws', async () => {
    const rejectingFetch = (async () => {
      throw new Error('ECONNREFUSED')
    }) as typeof fetch
    const res = await client(rejectingFetch).getLatestDate()
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/not available|fetch failed/i)
  })

  it('returns not-available when the body fails schema validation, never throws', async () => {
    const garbageFetch = (async () =>
      new Response(JSON.stringify({ wrong: 'shape' }), {
        status: 200,
      })) as typeof fetch
    const res = await client(garbageFetch).getRankings()
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/validation|not available/i)
  })

  it('returns not-available for a non-404 error response (e.g. HTTP 500)', async () => {
    const serverErrorFetch = (async () =>
      new Response('boom', { status: 500 })) as typeof fetch
    const res = await client(serverErrorFetch).getRankings()
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/HTTP 500/)
  })

  it('returns not-available when a 200 response is not valid JSON', async () => {
    const notJsonFetch = (async () =>
      new Response('<html>nope</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })) as typeof fetch
    const res = await client(notJsonFetch).getRankings()
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/not valid JSON|not available/i)
  })

  it('rejects a malformed date without fetching (never builds a junk URL)', async () => {
    let fetched = false
    const spyFetch = (async () => {
      fetched = true
      return new Response('{}', { status: 200 })
    }) as typeof fetch
    const res = await client(spyFetch).getDistrictRankingsForDate('not-a-date')
    expect(fetched).toBe(false)
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/not available/i)
  })

  it('propagates not-available from the club index when resolving a club', async () => {
    const missingIndexFetch = (async () =>
      new Response('not found', { status: 404 })) as typeof fetch
    const res = await client(missingIndexFetch).resolveClubDistrict('28675309')
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.sourceUrl).toBe(`${BASE}/config/club-index.json`)
    expect(res.reason).toMatch(/not available/i)
  })
})
