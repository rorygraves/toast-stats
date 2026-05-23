import { describe, it, expect } from 'vitest'
import {
  mergeFacIntoSnapshot,
  normaliseClubNumber,
} from '../FindAClubMerger.js'

/* Fixtures based on the real shapes — TI Find-A-Club response and a
   district snapshot's clubPerformance row. Kept minimal — only the
   fields the merger actually reads / writes. */

const ottawaFacClub = {
  Identification: { Id: { Value: '00000180' } },
  Address: {
    Street: '300 Ottawa Ave',
    City: 'Ottawa',
    PrimaryRegion: { Value: 'ON' },
    PostalCode: 'K1A 0A0',
    Coordinates: { Latitude: 45.42, Longitude: -75.69 },
  },
  CountryName: 'Canada',
  CharterDate: '/Date(197190000000)/',
  Email: 'officers-180@toastmastersclubs.org',
  Website: 'http://180.toastmastersclubs.org/',
  MeetingDay: 'Tuesday',
  MeetingTime: '7:00 pm',
  AllowsVirtualAttendance: false,
  IsProspective: false,
}

const ottawaSnapshotRow = {
  'Club Number': '00000180',
  'Club Name': 'Causeurs Ottawa Speakers Club',
  Division: 'A',
  Area: 'A1',
  'Club Status': 'Active',
  'Mem. Base': '20',
  'Active Members': '23',
  'Goals Met': '5',
}

const suspendedSnapshotOnly = {
  'Club Number': '00099999',
  'Club Name': 'Suspended Toastmasters',
  Division: 'B',
  Area: 'B1',
  'Club Status': 'Suspended',
  'Mem. Base': '15',
  'Active Members': '0',
}

const prospectiveFacOnlyClub = {
  Identification: { Id: { Value: '00088888' }, Name: 'New ATO Toastmasters' },
  Address: {
    Street: '12 New Way',
    City: 'Toronto',
    PrimaryRegion: { Value: 'ON' },
  },
  CharterDate: null,
  CountryName: 'Canada',
  IsProspective: true,
}

describe('normaliseClubNumber', () => {
  it('zero-pads numeric strings to 8 chars', () => {
    expect(normaliseClubNumber('180')).toBe('00000180')
    expect(normaliseClubNumber('1399')).toBe('00001399')
    expect(normaliseClubNumber('12345678')).toBe('12345678')
  })

  it('zero-pads numeric inputs', () => {
    expect(normaliseClubNumber(180)).toBe('00000180')
  })

  it('strips non-digits before padding (handles CSV quirks)', () => {
    expect(normaliseClubNumber("'180")).toBe('00000180')
    expect(normaliseClubNumber('Club 180')).toBe('00000180')
    expect(normaliseClubNumber('  00000180  ')).toBe('00000180')
  })

  it('returns null for inputs without digits', () => {
    expect(normaliseClubNumber('')).toBeNull()
    expect(normaliseClubNumber('   ')).toBeNull()
    expect(normaliseClubNumber(null)).toBeNull()
    expect(normaliseClubNumber(undefined)).toBeNull()
    expect(normaliseClubNumber('abc')).toBeNull()
  })
})

describe('mergeFacIntoSnapshot — clubs[] propagation (#503)', () => {
  // Critical regression: the merger originally only wrote onto
  // .data.clubPerformance[] (raw scraped records). But analytics-core
  // builds ClubTrend from .data.clubs[] (parsed ClubStatisticsFile),
  // so FAC enrichment never reached the analytics JSON the frontend
  // reads. The merger must update BOTH arrays.
  it('enriches the .data.clubs[] entry that matches by clubId', () => {
    const result = mergeFacIntoSnapshot(
      {
        districtId: '61',
        data: {
          clubPerformance: [ottawaSnapshotRow],
          // parsed ClubStatisticsFile shape — what analytics-core reads
          clubs: [
            {
              clubId: '00000180',
              clubName: 'Causeurs Ottawa Speakers Club',
              divisionId: 'A',
              divisionName: 'Division A',
              areaId: 'A1',
              areaName: 'Area A1',
              membershipCount: 23,
              membershipBase: 20,
              paymentsCount: 5,
              dcpGoals: 5,
              status: 'Distinguished',
              octoberRenewals: 3,
              aprilRenewals: 2,
              newMembers: 1,
              clubStatus: 'Active',
            },
          ],
        },
      },
      { Clubs: [ottawaFacClub] }
    )

    expect(result.matched).toBe(1)
    const parsedClubs = (result.snapshot.data?.['clubs'] ?? []) as Array<
      Record<string, unknown>
    >
    expect(parsedClubs).toHaveLength(1)
    expect(parsedClubs[0]?.['clubId']).toBe('00000180')
    // Parsed snapshot fields preserved
    expect(parsedClubs[0]?.['clubName']).toBe('Causeurs Ottawa Speakers Club')
    expect(parsedClubs[0]?.['membershipCount']).toBe(23)
    // FAC enrichment landed on .clubs[]
    expect(parsedClubs[0]?.['charterDate']).toBe('1976-04-01')
    expect(parsedClubs[0]?.['coordinates']).toEqual({
      lat: 45.42,
      lng: -75.69,
    })
    expect(parsedClubs[0]?.['email']).toBe('officers-180@toastmastersclubs.org')
    expect(parsedClubs[0]?.['meetingDay']).toBe('Tuesday')
  })

  it('leaves .data.clubs[] alone for snapshot-only clubs (no FAC match)', () => {
    const result = mergeFacIntoSnapshot(
      {
        districtId: '61',
        data: {
          clubPerformance: [ottawaSnapshotRow, suspendedSnapshotOnly],
          clubs: [
            {
              clubId: '00000180',
              clubName: 'Causeurs',
              divisionId: 'A',
              divisionName: 'A',
              areaId: 'A1',
              areaName: 'A1',
              membershipCount: 23,
              membershipBase: 20,
              paymentsCount: 5,
              dcpGoals: 5,
              status: 'Distinguished',
              octoberRenewals: 3,
              aprilRenewals: 2,
              newMembers: 1,
            },
            {
              clubId: '00099999',
              clubName: 'Suspended',
              divisionId: 'B',
              divisionName: 'B',
              areaId: 'B1',
              areaName: 'B1',
              membershipCount: 0,
              membershipBase: 15,
              paymentsCount: 0,
              dcpGoals: 0,
              status: 'Suspended',
              octoberRenewals: 0,
              aprilRenewals: 0,
              newMembers: 0,
            },
          ],
        },
      },
      { Clubs: [ottawaFacClub] }
    )
    const parsedClubs = (result.snapshot.data?.['clubs'] ?? []) as Array<
      Record<string, unknown>
    >
    // Suspended club must NOT acquire FAC fields
    expect(parsedClubs[1]?.['clubId']).toBe('00099999')
    expect(parsedClubs[1]?.['charterDate']).toBeUndefined()
  })

  it('handles snapshots without a .clubs[] array (defensive)', () => {
    // Older snapshots may only have .clubPerformance — merger must
    // still work and not throw.
    const result = mergeFacIntoSnapshot(
      {
        districtId: '61',
        data: { clubPerformance: [ottawaSnapshotRow] },
      },
      { Clubs: [ottawaFacClub] }
    )
    expect(result.matched).toBe(1)
    // .clubs[] absent → nothing to update → no crash
    expect(result.snapshot.data?.['clubs']).toBeUndefined()
  })
})

describe('mergeFacIntoSnapshot', () => {
  it('enriches a matched club with FAC fields without losing snapshot fields', () => {
    const result = mergeFacIntoSnapshot(
      {
        districtId: '61',
        data: { clubPerformance: [ottawaSnapshotRow] },
      },
      { Clubs: [ottawaFacClub] }
    )

    expect(result.matched).toBe(1)
    expect(result.snapshotOnly).toBe(0)
    expect(result.facOnly).toBe(0)

    const merged = (result.snapshot.data?.clubPerformance ?? [])[0] as Record<
      string,
      unknown
    >
    // Snapshot fields preserved
    expect(merged['Club Number']).toBe('00000180')
    expect(merged['Club Name']).toBe('Causeurs Ottawa Speakers Club')
    expect(merged['Club Status']).toBe('Active')
    expect(merged['Goals Met']).toBe('5')
    // FAC fields layered on
    expect(merged['charterDate']).toBe('1976-04-01')
    expect(merged['coordinates']).toEqual({ lat: 45.42, lng: -75.69 })
    expect(merged['address']).toEqual({
      street: '300 Ottawa Ave',
      city: 'Ottawa',
      region: 'ON',
      postalCode: 'K1A 0A0',
      country: 'Canada',
    })
    expect(merged['email']).toBe('officers-180@toastmastersclubs.org')
    expect(merged['meetingDay']).toBe('Tuesday')
  })

  it('leaves snapshot-only rows untouched and counts them', () => {
    const result = mergeFacIntoSnapshot(
      {
        districtId: '61',
        data: {
          clubPerformance: [ottawaSnapshotRow, suspendedSnapshotOnly],
        },
      },
      { Clubs: [ottawaFacClub] }
    )

    expect(result.matched).toBe(1)
    expect(result.snapshotOnly).toBe(1)
    expect(result.facOnly).toBe(0)

    const suspended = (result.snapshot.data?.clubPerformance ??
      [])[1] as Record<string, unknown>
    expect(suspended).toEqual(suspendedSnapshotOnly)
    expect(suspended['charterDate']).toBeUndefined()
  })

  it('captures FAC-only clubs (ATOs / prospective) separately, not in clubPerformance', () => {
    const result = mergeFacIntoSnapshot(
      {
        districtId: '61',
        data: { clubPerformance: [ottawaSnapshotRow] },
      },
      { Clubs: [ottawaFacClub, prospectiveFacOnlyClub] }
    )

    expect(result.matched).toBe(1)
    expect(result.facOnly).toBe(1)
    expect(result.facOnlyClubs).toHaveLength(1)
    expect(result.facOnlyClubs[0]?.clubId).toBe('00088888')
    expect(result.facOnlyClubs[0]?.isProspective).toBe(true)
    // The prospective club must NOT have been merged into clubPerformance
    expect(result.snapshot.data?.clubPerformance).toHaveLength(1)
  })

  // #489 — the merger must now persist FAC-only clubs into the
  // snapshot as a compact prospectiveClubs[] so downstream services
  // (analytics-core, the frontend) can surface them without a second
  // FAC fetch.
  it('writes FAC-only clubs into snapshot.data.prospectiveClubs (#489)', () => {
    const result = mergeFacIntoSnapshot(
      {
        districtId: '61',
        data: { clubPerformance: [ottawaSnapshotRow] },
        // pretend the previous merge already added something; the new
        // merge replaces it (TI registry is the source of truth).
      },
      { Clubs: [ottawaFacClub, prospectiveFacOnlyClub] }
    )

    const dataRecord = result.snapshot.data as
      | Record<string, unknown>
      | undefined
    const prospectiveClubs = dataRecord?.['prospectiveClubs'] as
      | Array<Record<string, unknown>>
      | undefined
    expect(prospectiveClubs).toHaveLength(1)
    const club = prospectiveClubs?.[0]
    expect(club?.['clubId']).toBe('00088888')
    expect(club?.['clubName']).toBe('New ATO Toastmasters')
    expect(club?.['city']).toBe('Toronto')
    expect(club?.['region']).toBe('ON')
    expect(club?.['country']).toBe('Canada')
    expect(club?.['isProspective']).toBe(true)
    // We deliberately drop coordinates / phone / social — the panel
    // doesn't render them, and keeping the payload small matters when
    // the array ships in the analytics file every district every day.
    expect(club?.['coordinates']).toBeUndefined()
    expect(club?.['phone']).toBeUndefined()
  })

  it('writes an empty prospectiveClubs array when no FAC-only clubs are found (#489)', () => {
    const result = mergeFacIntoSnapshot(
      { districtId: '61', data: { clubPerformance: [ottawaSnapshotRow] } },
      { Clubs: [ottawaFacClub] }
    )
    const dataRecord = result.snapshot.data as Record<string, unknown>
    // Always materialize the field — see "clears stale prospectiveClubs"
    // below for the regression that drove this decision.
    expect(dataRecord['prospectiveClubs']).toEqual([])
  })

  // Regression: if a previous merge left a prospectiveClubs entry in
  // the snapshot and today's FAC has none (the ATO chartered), the
  // merger must NOT carry the stale entry forward via `...snapshot.data`.
  it('clears stale prospectiveClubs when the current FAC produces none (#489)', () => {
    const staleSnapshot = {
      districtId: '61',
      data: {
        clubPerformance: [ottawaSnapshotRow],
        prospectiveClubs: [
          {
            clubId: '00088888',
            clubName: 'Yesterday ATO',
            isProspective: true,
          },
        ],
      },
    }
    const result = mergeFacIntoSnapshot(staleSnapshot, {
      Clubs: [ottawaFacClub],
    })
    const dataRecord = result.snapshot.data as Record<string, unknown>
    expect(dataRecord['prospectiveClubs']).toEqual([])
  })

  // The projection layer must produce a meaningful clubName even when
  // TI's FAC entry omits Identification.Name — schema declares
  // clubName as required, and an empty string would break the
  // 'has a name' invariant the panel relies on.
  it('falls back to "Club <id>" when the FAC entry has no Name (#489)', () => {
    const namelessFacClub = {
      Identification: { Id: { Value: '00077777' } },
      Address: { City: 'Nowhere' },
      IsProspective: true,
    }
    const result = mergeFacIntoSnapshot(
      { districtId: '61', data: { clubPerformance: [ottawaSnapshotRow] } },
      { Clubs: [ottawaFacClub, namelessFacClub] }
    )
    const dataRecord = result.snapshot.data as Record<string, unknown>
    const prospectiveClubs = dataRecord['prospectiveClubs'] as Array<
      Record<string, unknown>
    >
    expect(prospectiveClubs).toHaveLength(1)
    expect(prospectiveClubs[0]?.['clubName']).toBe('Club 00077777')
  })

  it('is idempotent — merging twice produces the same enriched output', () => {
    const input = {
      districtId: '61',
      data: { clubPerformance: [ottawaSnapshotRow] },
    }
    const fac = { Clubs: [ottawaFacClub] }
    const once = mergeFacIntoSnapshot(input, fac)
    const twice = mergeFacIntoSnapshot(once.snapshot, fac)
    expect(twice.snapshot.data?.clubPerformance).toEqual(
      once.snapshot.data?.clubPerformance
    )
    expect(twice.matched).toBe(1)
  })

  it('handles FAC = null (TI returned no clubs) by leaving snapshot untouched', () => {
    const result = mergeFacIntoSnapshot(
      {
        districtId: '61',
        data: { clubPerformance: [ottawaSnapshotRow] },
      },
      { Clubs: null }
    )

    expect(result.matched).toBe(0)
    expect(result.snapshotOnly).toBe(1)
    expect(result.facOnly).toBe(0)
    expect((result.snapshot.data?.clubPerformance ?? [])[0]).toEqual(
      ottawaSnapshotRow
    )
  })

  it('handles snapshot with no clubPerformance array (defensive)', () => {
    const result = mergeFacIntoSnapshot(
      { districtId: '61', data: {} },
      { Clubs: [ottawaFacClub] }
    )
    expect(result.matched).toBe(0)
    expect(result.snapshotOnly).toBe(0)
    // FAC-only counting requires the matched-id set to know what was
    // joined; when there's no snapshot side, EVERY FAC club is
    // technically unmatched. But the contract is 'FAC-only = clubs
    // we DELIBERATELY chose not to merge into clubPerformance', so
    // this case returns 0 (defensive: don't surprise callers by
    // creating a prospective-clubs list for a clubPerformance-less
    // snapshot).
    expect(result.facOnly).toBe(0)
  })

  it('matches across CSV-quoting variants of Club Number (suspended/active rows)', () => {
    const result = mergeFacIntoSnapshot(
      {
        districtId: '61',
        data: {
          clubPerformance: [
            { ...ottawaSnapshotRow, 'Club Number': '180' }, // unpadded
            { ...ottawaSnapshotRow, 'Club Number': "'00000180" }, // leading apostrophe
          ],
        },
      },
      { Clubs: [ottawaFacClub] }
    )
    // Both rows are the same club; both should match.
    expect(result.matched).toBe(2)
  })
})
