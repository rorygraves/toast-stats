import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  FindAClubService,
  normaliseDistrictParam,
  parseNetDate,
  normaliseTiClub,
} from '../FindAClubService.js'

/* Fixtures based on the real TI response observed 2026-05-11 (see
   tasks/430-find-a-club-recipe-2026-05-11.md). */

const realClub = {
  Identification: {
    Id: {
      Value: '00001399',
      DisplayFriendlyFormat: '1399',
      Name: 'South Suburban Toastmasters ',
    },
    Name: 'South Suburban Toastmasters ',
  },
  Address: {
    Street: '2630 W Belleview Ave, Ste 100',
    City: 'Littleton',
    PrimaryRegion: { Value: 'CO' },
    PrimaryRegionDescription: 'Colorado',
    PostalCode: '80123',
    Coordinates: { Longitude: -105.01863, Latitude: 39.62285 },
    TimeZone: null,
  },
  Classification: {
    Club: null,
    Area: { Id: null, Name: '03' },
    Division: { Id: null, Name: 'M' },
    District: { Id: null, Name: '26' },
  },
  CountryName: 'United States',
  CharterDate: '/Date(197190000000)/',
  Email: 'officers-1399@toastmastersclubs.org',
  FacebookLink: 'https://www.facebook.com/SouthSuburbanTM1399',
  TwitterLink: null,
  IsProspective: false,
  Location: 'TOAST Fine Food and Coffee',
  MeetingDay: 'Thursday',
  MeetingTime: '7:00 am ',
  HasUpcomingEvent: false,
  Phone: '+13039128450',
  Restriction: [],
  Website: 'http://1399.toastmastersclubs.org/',
  AllowsVirtualAttendance: false,
  Note: '',
}

describe('normaliseDistrictParam', () => {
  it('zero-pads single-digit numeric districts', () => {
    expect(normaliseDistrictParam('1')).toBe('01')
    expect(normaliseDistrictParam('7')).toBe('07')
  })

  it('leaves two-and-three-digit numeric districts unchanged', () => {
    expect(normaliseDistrictParam('26')).toBe('26')
    expect(normaliseDistrictParam('117')).toBe('117')
  })

  it('uppercases letter districts', () => {
    expect(normaliseDistrictParam('u')).toBe('U')
    expect(normaliseDistrictParam('U')).toBe('U')
  })

  it('trims whitespace', () => {
    expect(normaliseDistrictParam(' 26 ')).toBe('26')
  })
})

describe('parseNetDate', () => {
  it('parses /Date(ms)/ to ISO YYYY-MM-DD', () => {
    expect(parseNetDate('/Date(197190000000)/')).toBe('1976-04-01')
  })

  it('handles negative epoch (pre-1970)', () => {
    // 1962-01-01 UTC = -252460800000ms
    expect(parseNetDate('/Date(-252460800000)/')).toBe('1962-01-01')
  })

  it('returns undefined for non-string / unparseable / out-of-band input', () => {
    expect(parseNetDate(null)).toBeUndefined()
    expect(parseNetDate('')).toBeUndefined()
    expect(parseNetDate('1976-04-01')).toBeUndefined() // ISO, not .NET
    expect(parseNetDate('/Date(abc)/')).toBeUndefined()
    // Sanity bounds — year < 1900
    expect(parseNetDate('/Date(-9999999999999)/')).toBeUndefined()
  })
})

describe('normaliseTiClub', () => {
  it('flattens a real TI club into the enrichment shape', () => {
    const result = normaliseTiClub(realClub)
    expect(result).toEqual({
      clubId: '00001399',
      charterDate: '1976-04-01',
      coordinates: { lat: 39.62285, lng: -105.01863 },
      address: {
        street: '2630 W Belleview Ave, Ste 100',
        city: 'Littleton',
        region: 'CO',
        postalCode: '80123',
        country: 'United States',
      },
      email: 'officers-1399@toastmastersclubs.org',
      phone: '+13039128450',
      website: 'http://1399.toastmastersclubs.org/',
      facebookLink: 'https://www.facebook.com/SouthSuburbanTM1399',
      meetingDay: 'Thursday',
      meetingTime: '7:00 am',
      allowsVirtualAttendance: false,
      isProspective: false,
    })
  })

  it('returns null when the club is missing its primary key', () => {
    expect(
      normaliseTiClub({
        Identification: { Id: { Value: null } },
      } as any)
    ).toBeNull()
    expect(normaliseTiClub({} as any)).toBeNull()
  })

  it('omits optional fields that TI returns as null / missing', () => {
    const sparse = {
      Identification: { Id: { Value: '00009999' } },
      Address: null,
      CharterDate: null,
      Email: null,
      Phone: null,
    }
    expect(normaliseTiClub(sparse as any)).toEqual({ clubId: '00009999' })
  })
})

describe('FindAClubService', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let service: FindAClubService

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({
        Clubs: [realClub],
        district: '26',
      }),
    } as unknown as Response)
    service = new FindAClubService({
      fetchImpl: fetchMock as unknown as typeof fetch,
      requestIntervalMs: 0, // no throttle in tests
    })
  })

  it('builds the URL with anchor coords, radius, and zero-padded district', () => {
    expect(service.buildUrl('1')).toBe(
      'https://www.toastmasters.org/api/sitecore/FindAClub/Search?latitude=39.6478&longitude=-104.9878&radius=5000&district=01'
    )
    expect(service.buildUrl('26')).toContain('district=26')
    expect(service.buildUrl('U')).toContain('district=U')
  })

  it('fetches a district, validates the response, and returns clubs', async () => {
    const result = await service.fetchDistrict('26')
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(result.clubs).toHaveLength(1)
    expect(result.clubs[0]?.clubId).toBe('00001399')
    expect(result.clubs[0]?.charterDate).toBe('1976-04-01')
  })

  it('throws on non-OK HTTP status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as unknown as Response)
    await expect(service.fetchDistrict('26')).rejects.toThrow(
      /HTTP 500.*district 26/
    )
  })

  it('throws on schema-invalid response payload', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ Clubs: 'not an array' }),
    } as unknown as Response)
    await expect(service.fetchDistrict('26')).rejects.toThrow()
  })

  it('treats Clubs: null as zero clubs (TI returns this for invalid filters)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ Clubs: null, district: '01' }),
    } as unknown as Response)
    const result = await service.fetchDistrict('1')
    expect(result.clubs).toEqual([])
  })

  it('throttles consecutive requests to at least requestIntervalMs apart', async () => {
    const throttled = new FindAClubService({
      fetchImpl: fetchMock as unknown as typeof fetch,
      requestIntervalMs: 30,
    })
    const start = Date.now()
    await throttled.fetchDistrict('26')
    await throttled.fetchDistrict('27')
    await throttled.fetchDistrict('28')
    const elapsed = Date.now() - start
    // Allow some slack; with intervalMs=30 across 3 requests we expect ~60ms minimum
    // (the first request doesn't wait, subsequent two do)
    expect(elapsed).toBeGreaterThanOrEqual(50)
  })
})
