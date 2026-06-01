import { describe, it, expect } from 'vitest'
import type { CdnClient } from '../index.js'
import { BASE, makeClient, makeFixtureFetch } from './_fixture-fetch.js'

/**
 * Routes the Sprint-2 read targets — the dated district snapshot and a
 * program-year time-series file — to committed fixtures; everything else 404s.
 */
const ROUTES: Record<string, string> = {
  '/snapshots/2026-05-31/district_61.json': 'district-snapshot.json',
  '/time-series/district_61/2025-2026.json': 'time-series.json',
}

function client(fetchFn: typeof fetch = makeFixtureFetch(ROUTES)): CdnClient {
  return makeClient(fetchFn)
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

  it('treats a failed-collection snapshot as not-available (never surfaces partial data as available)', async () => {
    const failedFetch = (async () =>
      new Response(
        JSON.stringify({
          districtId: '61',
          districtName: 'District 61',
          collectedAt: '2026-05-31T10:00:00.000Z',
          status: 'failed',
          errorMessage: 'scrape timed out',
          data: {
            districtId: '61',
            snapshotDate: '2026-05-31',
            clubs: [],
            divisions: [],
            areas: [],
            totals: {
              totalClubs: 0,
              totalMembership: 0,
              totalPayments: 0,
              distinguishedClubs: 0,
              selectDistinguishedClubs: 0,
              presidentDistinguishedClubs: 0,
            },
            divisionPerformance: [],
            clubPerformance: [],
            districtPerformance: [],
          },
        }),
        { status: 200 }
      )) as typeof fetch
    const res = await client(failedFetch).getDistrictSnapshot(
      '61',
      '2026-05-31'
    )
    expect(res.available).toBe(false)
    if (res.available) return
    expect(res.reason).toMatch(/failed/i)
    expect(res.sourceUrl).toBe(`${BASE}/snapshots/2026-05-31/district_61.json`)
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
    expect(res.sourceUrl).toBe(`${BASE}/time-series/district_61/2025-2026.json`)
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
    expect(res.sourceUrl).toBe(`${BASE}/time-series/district_61/1999-2000.json`)
  })
})
