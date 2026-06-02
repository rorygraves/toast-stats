import { describe, it, expect, vi, afterEach } from 'vitest'
import type { DistrictReportsDataset } from '@toastmasters/shared-contracts'
import { cdnDistrictReportsUrl, fetchCdnDistrictReports } from '../cdn'

const validDataset: DistrictReportsDataset = {
  districtId: '61',
  programYear: '2025-2026',
  generatedAt: '2026-06-01T00:00:00.000Z',
  sections: {
    octoberDuesRenewal: {
      sources: [
        {
          reportType: 'dues-renewal',
          tableId: '0d56c054',
          asOf: 'June 01, 2026',
        },
      ],
      records: [
        {
          club: '1009147',
          division: 'D',
          area: '33',
          renewalStatus: 'Verified complete - 05/31/2026',
          name: 'Centretown',
          location: 'Ottawa',
        },
      ],
    },
  },
}

afterEach(() => vi.restoreAllMocks())

describe('cdnDistrictReportsUrl', () => {
  it('targets the separate reports file (NOT the analytics/ subfolder)', () => {
    expect(cdnDistrictReportsUrl('2026-06-01', '61')).toContain(
      '/snapshots/2026-06-01/district_61_reports.json'
    )
    expect(cdnDistrictReportsUrl('2026-06-01', '61')).not.toContain(
      '/analytics/'
    )
  })
})

describe('fetchCdnDistrictReports (tolerant — never breaks the analytics path)', () => {
  it('returns the Zod-validated dataset on a 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => validDataset,
      })
    )
    const ds = await fetchCdnDistrictReports('2026-06-01', '61')
    expect(ds?.sections.octoberDuesRenewal?.records[0]?.club).toBe('1009147')
  })

  it('returns null on a 404 (no reports for this snapshot yet)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    )
    expect(await fetchCdnDistrictReports('2026-06-01', '61')).toBeNull()
  })

  it('returns null on a malformed payload rather than throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ not: 'a reports dataset' }),
      })
    )
    expect(await fetchCdnDistrictReports('2026-06-01', '61')).toBeNull()
  })

  it('returns null when the network rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await fetchCdnDistrictReports('2026-06-01', '61')).toBeNull()
  })
})
