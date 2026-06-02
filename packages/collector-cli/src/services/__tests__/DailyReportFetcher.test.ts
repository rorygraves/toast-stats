import { describe, expect, it, vi } from 'vitest'

import { IN_SCOPE_REPORT_GUIDS } from '../DistrictReportsBuilder'
import {
  DailyReportFetcher,
  buildDistrictReportUrl,
} from '../DailyReportFetcher'

/**
 * Sprint 3 #1065 — fetch the in-scope report GUIDs per district over the
 * anonymous Daily Reports API (verified contract, spike #1063). `fetch` is
 * injected so the unit test never touches the network.
 */

describe('buildDistrictReportUrl', () => {
  it('matches the verified anonymous report API contract', () => {
    expect(
      buildDistrictReportUrl(
        '41955922-25ab-4a5a-8025-ebb7634f68bf',
        '61',
        '2025-2026'
      )
    ).toBe(
      'https://www.toastmasters.org/api/sitecore/DistrictReports/GetDistrictReport?tableID=41955922-25ab-4a5a-8025-ebb7634f68bf&district=61&year=2025-2026&sortBy='
    )
  })
})

const okFetch = (body = '<table></table>') =>
  vi.fn(async (url: string) => ({
    ok: true,
    status: 200,
    text: async () => `${body}<!-- ${url} -->`,
  }))

describe('DailyReportFetcher.fetchDistrictReports', () => {
  it('fetches every in-scope GUID and returns a RawReport per report', async () => {
    const fetchImpl = okFetch()
    const fetcher = new DailyReportFetcher({ fetchImpl, requestIntervalMs: 0 })
    const reports = await fetcher.fetchDistrictReports('61', '2025-2026')
    expect(reports).toHaveLength(IN_SCOPE_REPORT_GUIDS.length)
    expect(reports.map(r => r.tableId).sort()).toEqual(
      [...IN_SCOPE_REPORT_GUIDS].sort()
    )
    expect(fetchImpl).toHaveBeenCalledTimes(IN_SCOPE_REPORT_GUIDS.length)
    expect(reports[0]!.html).toContain('<table>')
  })

  it('skips a report whose fetch fails, returning the rest', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      const failing = url.includes(IN_SCOPE_REPORT_GUIDS[0]!)
      return {
        ok: !failing,
        status: failing ? 500 : 200,
        text: async () => '<table></table>',
      }
    })
    const fetcher = new DailyReportFetcher({
      fetchImpl,
      maxRetries: 0,
      requestIntervalMs: 0,
    })
    const reports = await fetcher.fetchDistrictReports('61', '2025-2026')
    expect(reports).toHaveLength(IN_SCOPE_REPORT_GUIDS.length - 1)
    expect(reports.map(r => r.tableId)).not.toContain(IN_SCOPE_REPORT_GUIDS[0])
  })

  it('rejects an unsafe district id before fetching', async () => {
    const fetchImpl = okFetch()
    const fetcher = new DailyReportFetcher({ fetchImpl, requestIntervalMs: 0 })
    await expect(
      fetcher.fetchDistrictReports('../../etc', '2025-2026')
    ).rejects.toThrow(/district/i)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('spaces requests by requestIntervalMs (polite to the TI endpoint)', async () => {
    const fetchImpl = okFetch()
    const sleepImpl = vi.fn(async () => {})
    const fetcher = new DailyReportFetcher({
      fetchImpl,
      requestIntervalMs: 50,
      sleepImpl,
    })
    await fetcher.fetchDistrictReports('61', '2025-2026')
    // One inter-request wait between each of the N reports → N-1 sleeps.
    expect(sleepImpl).toHaveBeenCalledTimes(IN_SCOPE_REPORT_GUIDS.length - 1)
    expect(sleepImpl).toHaveBeenCalledWith(50)
  })
})
