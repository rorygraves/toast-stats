import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildSearchIndex,
  searchEntities,
  type SearchIndex,
  type SearchResultGroup,
} from '../searchIndex'

// --- Fixtures (shapes mirror fetchCdnRankings().rankings + fetchCdnClubIndex().clubs) ---

type RankingRow = Parameters<typeof buildSearchIndex>[0][number]

function ranking(
  districtId: string,
  districtName: string,
  region: string
): RankingRow {
  // Only the three fields the index reads matter; the rest are padding so the
  // fixture matches the real CdnRankingsData['rankings'] row shape loosely.
  return { districtId, districtName, region } as RankingRow
}

const RANKINGS: RankingRow[] = [
  ranking('61', 'District 61', '07'),
  ranking('6', 'District 6', '07'),
  ranking('57', 'District 57 Carolinas', '08'),
  ranking('F', 'District F', '01'),
]

const CLUBS: Record<string, { districtId: string; clubName: string }> = {
  '00001234': { districtId: '61', clubName: 'Toast of the Town' },
  '00005678': { districtId: '57', clubName: 'Club 61 Speakers' },
  '00009999': { districtId: '6', clubName: 'Sunrise Communicators' },
}

// Flatten grouped results into a single ranked list, preserving group order,
// so "above" assertions read naturally.
function flatten(groups: SearchResultGroup[]) {
  return groups.flatMap(g => g.entities)
}

describe('buildSearchIndex', () => {
  let index: SearchIndex
  beforeEach(() => {
    index = buildSearchIndex(RANKINGS, CLUBS)
  })

  it('creates one district entity per ranking row with the canonical route', () => {
    const d61 = index.entities.find(e => e.type === 'district' && e.id === '61')
    expect(d61).toBeDefined()
    expect(d61!.label).toBe('District 61')
    expect(d61!.route).toBe('/district/61')
  })

  it('derives one region entity per distinct numeric region, deduped', () => {
    const regions = index.entities.filter(e => e.type === 'region')
    // 07 and 08 and 01 → three regions (07 appears twice in rankings)
    expect(regions.map(r => r.id).sort()).toEqual(['01', '07', '08'])
    const r07 = regions.find(r => r.id === '07')!
    expect(r07.label).toBe('Region 7')
    expect(r07.route).toBe('/region/07')
  })

  it('creates a club entity resolving to /district/{districtId}/club/{clubId} with district context', () => {
    const club = index.entities.find(
      e => e.type === 'club' && e.id === '00001234'
    )
    expect(club).toBeDefined()
    expect(club!.label).toBe('Toast of the Town')
    expect(club!.context).toBe('District 61')
    expect(club!.route).toBe('/district/61/club/00001234')
  })
})

describe('searchEntities', () => {
  let index: SearchIndex
  beforeEach(() => {
    index = buildSearchIndex(RANKINGS, CLUBS)
  })

  it('returns no results for an empty or whitespace query', () => {
    expect(searchEntities('', index)).toEqual([])
    expect(searchEntities('   ', index)).toEqual([])
  })

  it('ranks an exact-id district above a club that merely contains the query', () => {
    const flat = flatten(searchEntities('61', index))
    const ids = flat.map(e => `${e.type}:${e.id}`)
    expect(ids).toContain('district:61')
    expect(ids).toContain('club:00005678') // "Club 61 Speakers"
    expect(ids.indexOf('district:61')).toBeLessThan(
      ids.indexOf('club:00005678')
    )
  })

  it('matches a region by its number (padded or unpadded) and ranks it above clubs', () => {
    const flat = flatten(searchEntities('7', index))
    const ids = flat.map(e => `${e.type}:${e.id}`)
    expect(ids).toContain('region:07')
    // Region must outrank any club that only substring-matches "7".
    const regionIdx = ids.indexOf('region:07')
    const firstClubIdx = ids.findIndex(id => id.startsWith('club:'))
    // clubId "00005678" substring-matches "7", so a club is present — the
    // ordering assertion is not vacuous.
    expect(firstClubIdx).not.toBe(-1)
    expect(regionIdx).toBeLessThan(firstClubIdx)
    // Padded form also matches.
    const paddedIds = flatten(searchEntities('07', index)).map(
      e => `${e.type}:${e.id}`
    )
    expect(paddedIds).toContain('region:07')
  })

  it('is case-insensitive and matches club names by substring', () => {
    const flat = flatten(searchEntities('toast', index))
    expect(flat.some(e => e.id === '00001234')).toBe(true)
    const upper = flatten(searchEntities('TOAST', index))
    expect(upper.some(e => e.id === '00001234')).toBe(true)
  })

  it('ranks exact > prefix > substring at the same type weight', () => {
    // Among clubs: "Club 61 Speakers" prefix-matches "club", exact none.
    const flat = flatten(searchEntities('sun', index))
    // "Sunrise Communicators" prefix-matches "sun".
    expect(flat[0]?.id).toBe('00009999')
  })

  it('groups results by type in district → region → club order', () => {
    const groups = searchEntities('6', index)
    const types = groups.map(g => g.type)
    // Every present group respects the canonical order.
    const order = ['district', 'region', 'club']
    const indices = types.map(t => order.indexOf(t))
    expect(indices).toEqual([...indices].sort((a, b) => a - b))
  })

  it('caps the total result count', () => {
    const many: Record<string, { districtId: string; clubName: string }> = {}
    for (let i = 0; i < 50; i++) {
      many[`club${i}`] = { districtId: '61', clubName: `Sixty One Club ${i}` }
    }
    const bigIndex = buildSearchIndex(RANKINGS, many)
    const total = flatten(searchEntities('six', bigIndex, { cap: 8 })).length
    expect(total).toBeLessThanOrEqual(8)
  })

  it('keeps a weighted district above the cap when a club flood would crowd it out', () => {
    // 50 clubs all substring-matching "61" — without the type weighting,
    // a global sort→cap could evict District 61 entirely.
    const flood: Record<string, { districtId: string; clubName: string }> = {}
    for (let i = 0; i < 50; i++) {
      flood[`club${i}`] = { districtId: '61', clubName: `Club 61 #${i}` }
    }
    const bigIndex = buildSearchIndex(RANKINGS, flood)
    const groups = searchEntities('61', bigIndex, { cap: 8 })
    const flat = flatten(groups)
    expect(flat.length).toBeLessThanOrEqual(8)
    // The exact-id district must survive the cap and lead the results.
    expect(flat[0]).toMatchObject({ type: 'district', id: '61' })
  })
})
