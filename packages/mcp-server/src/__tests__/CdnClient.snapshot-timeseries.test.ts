import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CdnClient } from '../index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixtureDir = join(here, '..', '__fixtures__')

const BASE = 'https://cdn.taverns.red'

/**
 * Routes the Sprint-2 read targets — the dated district snapshot and a
 * program-year time-series file — to committed fixtures; everything else 404s.
 */
const ROUTES: Record<string, string> = {
  '/snapshots/2026-05-31/district_61.json': 'district-snapshot.json',
  '/time-series/district_61/2025-2026.json': 'time-series.json',
}

function fixtureFetch(): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString()
    const path = url.replace(BASE, '')
    const file = ROUTES[path]
    if (!file) return new Response('not found', { status: 404 })
    return new Response(readFileSync(join(fixtureDir, file), 'utf8'), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
}

function client(fetchFn: typeof fetch = fixtureFetch()): CdnClient {
  return new CdnClient({ baseUrl: BASE, fetchFn })
}

describe('CdnClient.getDistrictSnapshot', () => {
  it('reads snapshots/{date}/district_{id}.json and surfaces the snapshot date + source URL', async () => {
    const res = await client().getDistrictSnapshot('61', '2026-05-31')
    expect(res.available).toBe(true)
    if (!res.available) return
    expect(res.data.districtId).toBe('61')
    expect(res.data.data.clubs.length).toBe(2)
    expect(res.data.data.clubs[0]!.clubName).toBe('Downtown Speakers')
    // date comes from the inner snapshotDate, not the request arg
    expect(res.date).toBe('2026-05-31')
    expect(res.sourceUrl).toBe(`${BASE}/snapshots/2026-05-31/district_61.json`)
  })

  it('rejects a malformed date without fetching (never builds a junk URL)', async () => {
    let fetched = false
    const spyFetch = (async () => {
      fetched = true
      return new Response('{}', { status: 200 })
    }) as typeof fetch
    const res = await client(spyFetch).getDistrictSnapshot('61', 'not-a-date')
    expect(fetched).toBe(false)
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/not available/i)
  })

  it('rejects a path-traversal district id without fetching', async () => {
    let fetched = false
    const spyFetch = (async () => {
      fetched = true
      return new Response('{}', { status: 200 })
    }) as typeof fetch
    const res = await client(spyFetch).getDistrictSnapshot(
      '../../etc/passwd',
      '2026-05-31'
    )
    expect(fetched).toBe(false)
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/not available/i)
  })

  it('returns typed not-available for a missing snapshot (404), never throws', async () => {
    const res = await client().getDistrictSnapshot('99', '2026-05-31')
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/not available/i)
    expect(res.sourceUrl).toBe(`${BASE}/snapshots/2026-05-31/district_99.json`)
  })
})

describe('CdnClient.getTimeSeries', () => {
  it('reads time-series/district_{id}/{programYear}.json with data points', async () => {
    const res = await client().getTimeSeries('61', '2025-2026')
    expect(res.available).toBe(true)
    if (!res.available) return
    expect(res.data.districtId).toBe('61')
    expect(res.data.programYear).toBe('2025-2026')
    expect(res.data.dataPoints.length).toBe(2)
    // date is the most recent data point in the series
    expect(res.date).toBe('2026-05-31')
    expect(res.sourceUrl).toBe(
      `${BASE}/time-series/district_61/2025-2026.json`
    )
  })

  it('rejects a malformed program year (YYYY-YYYY required) without fetching', async () => {
    let fetched = false
    const spyFetch = (async () => {
      fetched = true
      return new Response('{}', { status: 200 })
    }) as typeof fetch
    const res = await client(spyFetch).getTimeSeries('61', '2025')
    expect(fetched).toBe(false)
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/not available/i)
  })

  it('returns typed not-available for a missing program year (404)', async () => {
    const res = await client().getTimeSeries('61', '1999-2000')
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/not available/i)
    expect(res.sourceUrl).toBe(
      `${BASE}/time-series/district_61/1999-2000.json`
    )
  })
})
