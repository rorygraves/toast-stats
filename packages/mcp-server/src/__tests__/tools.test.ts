import { describe, it, expect } from 'vitest'
import type { CdnClient } from '../cdn/CdnClient.js'
import { TOOLS, type ToolDef } from '../tools/tools.js'
import { parseToolText } from '../tools/envelope.js'
import { BASE, makeClient, makeFixtureFetch } from './_fixture-fetch.js'
import { FIXTURE_ROUTES } from './_fixture-routes.js'

function client(
  fetchFn: typeof fetch = makeFixtureFetch(FIXTURE_ROUTES)
): CdnClient {
  return makeClient(fetchFn)
}

function tool(name: string): ToolDef {
  const found = TOOLS.find(t => t.name === name)
  if (!found) throw new Error(`tool not registered: ${name}`)
  return found
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(name: string, args: any, c: CdnClient = client()) {
  return parseToolText(await tool(name).handler(c, args)) as Record<
    string,
    unknown
  >
}

describe('tool set — registration', () => {
  it('registers exactly the 8 ADR-008 Sprint-2 tools, each with metadata', () => {
    const names = TOOLS.map(t => t.name).sort()
    expect(names).toEqual(
      [
        'get-club-health',
        'get-district-snapshot',
        'get-latest-date',
        'get-time-series',
        'list-dates',
        'list-districts',
        'query-rankings',
        'resolve-club',
      ].sort()
    )
    for (const t of TOOLS) {
      expect(t.title.length).toBeGreaterThan(0)
      expect(t.description.length).toBeGreaterThan(0)
      expect(typeof t.inputSchema).toBe('object')
    }
  })
})

describe('discovery tools', () => {
  it('get-latest-date returns the latest date + source URL', async () => {
    const env = await call('get-latest-date', {})
    expect(env.available).toBe(true)
    expect(env.sourceUrl).toBe(`${BASE}/v1/latest.json`)
    expect(
      (env.data as { latestSnapshotDate: string }).latestSnapshotDate
    ).toBe('2026-05-31')
  })

  it('list-dates returns the date list', async () => {
    const env = await call('list-dates', {})
    expect(env.available).toBe(true)
    expect(Array.isArray((env.data as { dates: string[] }).dates)).toBe(true)
  })

  it('list-districts projects district ids + available dates', async () => {
    const env = await call('list-districts', {})
    expect(env.available).toBe(true)
    const data = env.data as {
      districtIds: string[]
      availableDatesByDistrict: Record<string, string[]>
    }
    expect(data.districtIds.length).toBeGreaterThan(0)
    expect(
      data.availableDatesByDistrict[data.districtIds[0]!]!.length
    ).toBeGreaterThan(0)
  })

  it('resolve-club resolves a known club and is not-available for an unknown one', async () => {
    const c = client()
    const known = (await c.getClubIndex()) as {
      available: true
      data: { clubs: Record<string, unknown> }
    }
    const clubId = Object.keys(known.data.clubs)[0]!

    const ok = await call('resolve-club', { clubId })
    expect(ok.available).toBe(true)
    expect((ok.data as { clubId: string }).clubId).toBe(clubId)

    const missing = await call('resolve-club', { clubId: '00000000' })
    expect(missing.available).toBe(false)
    expect(missing.reason).toMatch(/not available/i)
  })
})

describe('snapshot + rankings tools', () => {
  it('get-district-snapshot reads the dated snapshot when a date is given', async () => {
    const env = await call('get-district-snapshot', {
      districtId: '61',
      date: '2026-05-31',
    })
    expect(env.available).toBe(true)
    expect(env.sourceUrl).toBe(`${BASE}/snapshots/2026-05-31/district_61.json`)
    expect(env.date).toBe('2026-05-31')
  })

  it('get-district-snapshot resolves the latest date when date is omitted', async () => {
    const env = await call('get-district-snapshot', { districtId: '61' })
    expect(env.available).toBe(true)
    // resolved to latest (2026-05-31) under the hood
    expect(env.sourceUrl).toBe(`${BASE}/snapshots/2026-05-31/district_61.json`)
  })

  it('query-rankings returns current rankings when no date is given', async () => {
    const env = await call('query-rankings', {})
    expect(env.available).toBe(true)
    expect(env.sourceUrl).toBe(`${BASE}/v1/rankings.json`)
  })

  it('query-rankings returns the dated rankings when a date is given', async () => {
    const env = await call('query-rankings', { date: '2026-05-31' })
    expect(env.available).toBe(true)
    expect(env.sourceUrl).toBe(
      `${BASE}/snapshots/2026-05-31/all-districts-rankings.json`
    )
  })
})

describe('get-club-health — raw fields, no derivation', () => {
  it('returns raw health-signal fields per club and never a derived status', async () => {
    const env = await call('get-club-health', {
      districtId: '61',
      date: '2026-05-31',
    })
    expect(env.available).toBe(true)
    const data = env.data as {
      note: string
      clubs: Record<string, unknown>[]
    }
    expect(data.clubs.length).toBe(2)
    const club = data.clubs[0]!
    expect(club).toHaveProperty('membershipCount')
    expect(club).toHaveProperty('membershipBase')
    expect(club).toHaveProperty('newMembers')
    expect(club).toHaveProperty('dcpGoals')
    // never derives the categorical classification
    expect(club).not.toHaveProperty('healthStatus')
    expect(JSON.stringify(data)).not.toMatch(
      /thriving|vulnerable|intervention/i
    )
    expect(data.note).toMatch(/not derived|not a pre-computed/i)
  })

  it('filters clubs to a single division when divisionId is given', async () => {
    const env = await call('get-club-health', {
      districtId: '61',
      date: '2026-05-31',
      divisionId: 'B',
    })
    const data = env.data as { clubs: { divisionId: string }[] }
    expect(data.clubs.length).toBe(1)
    expect(data.clubs[0]!.divisionId).toBe('B')
  })
})

describe('get-time-series', () => {
  it('returns the program-year series with data points + summary', async () => {
    const env = await call('get-time-series', {
      districtId: '61',
      programYear: '2025-2026',
    })
    expect(env.available).toBe(true)
    expect(env.sourceUrl).toBe(`${BASE}/time-series/district_61/2025-2026.json`)
    const data = env.data as { dataPoints: unknown[]; summary: unknown }
    expect(data.dataPoints.length).toBe(2)
    expect(data.summary).toBeDefined()
  })

  it('is not-available for an unknown program year', async () => {
    const env = await call('get-time-series', {
      districtId: '61',
      programYear: '1999-2000',
    })
    expect(env.available).toBe(false)
    expect(env.reason).toMatch(/not available/i)
  })
})

describe('not-available propagation through date resolution', () => {
  it('surfaces the latest-date failure when latest.json is unreachable', async () => {
    const c = client(
      (async () => new Response('x', { status: 500 })) as typeof fetch
    )
    const env = await call('get-district-snapshot', { districtId: '61' }, c)
    expect(env.available).toBe(false)
    expect(env.sourceUrl).toBe(`${BASE}/v1/latest.json`)
  })
})
