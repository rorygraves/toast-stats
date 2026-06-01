import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the CDN service so we can assert the loader fetches lazily — and that
// merely importing the module triggers no network call (the 1MB club index
// must not be pulled at import / app boot).
const fetchCdnRankings = vi.fn()
const fetchCdnClubIndex = vi.fn()
vi.mock('../cdn', () => ({
  fetchCdnRankings: (...args: unknown[]) => fetchCdnRankings(...args),
  fetchCdnClubIndex: (...args: unknown[]) => fetchCdnClubIndex(...args),
}))

describe('loadSearchIndex (lazy)', () => {
  beforeEach(() => {
    fetchCdnRankings.mockReset()
    fetchCdnClubIndex.mockReset()
    fetchCdnRankings.mockResolvedValue({
      rankings: [
        { districtId: '61', districtName: 'District 61', region: '07' },
      ],
      date: '2026-06-01',
      generatedAt: '2026-06-01T00:00:00Z',
    })
    fetchCdnClubIndex.mockResolvedValue({
      clubs: {
        '00001234': { districtId: '61', clubName: 'Toast of the Town' },
      },
    })
  })

  it('does not fetch anything at import time', async () => {
    await import('../searchIndex')
    expect(fetchCdnRankings).not.toHaveBeenCalled()
    expect(fetchCdnClubIndex).not.toHaveBeenCalled()
  })

  it('fetches rankings + club index only when invoked, and builds an index', async () => {
    const { loadSearchIndex } = await import('../searchIndex')
    expect(fetchCdnClubIndex).not.toHaveBeenCalled()

    const index = await loadSearchIndex()

    expect(fetchCdnRankings).toHaveBeenCalledTimes(1)
    expect(fetchCdnClubIndex).toHaveBeenCalledTimes(1)
    expect(
      index.entities.some(e => e.type === 'district' && e.id === '61')
    ).toBe(true)
    expect(
      index.entities.some(e => e.type === 'club' && e.id === '00001234')
    ).toBe(true)
  })
})
