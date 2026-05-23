/**
 * FindAClubService — fetches per-district club enrichment from the
 * public Toastmasters Find-A-Club Search endpoint (#430).
 *
 * Recipe (tasks/430-find-a-club-recipe-2026-05-11.md):
 *
 *   GET https://www.toastmasters.org/api/sitecore/FindAClub/Search
 *     ?latitude=39.6478&longitude=-104.9878&radius=5000&district=<zero-padded id>
 *
 * Key constraints:
 *   - latitude+longitude are MANDATORY (district alone returns Clubs: null)
 *   - District IDs must be zero-padded for single digits ('01' not '1')
 *   - 'U' (Undistricted) is a valid district returning ~77 clubs
 *   - Hard cap of 1000 clubs per response; no real district approaches it
 *   - Anchor at TI HQ (39.6478, -104.9878) + radius=5000 captures all clubs
 *     in a district regardless of geography
 *
 * Public, unauthenticated endpoint. No reverse-engineering — this is the
 * JSON the public site itself uses. Throttle at ≤1 req/sec to be a good
 * citizen; schema in shared-contracts stays optional so pipeline fails
 * soft if TI tightens access.
 */

import { z } from 'zod'

const TI_HQ_LATITUDE = 39.6478
const TI_HQ_LONGITUDE = -104.9878
const SWEEP_RADIUS_MILES = 5000
const DEFAULT_REQUEST_INTERVAL_MS = 1100 // ~0.9 req/sec
const ENDPOINT_URL =
  'https://www.toastmasters.org/api/sitecore/FindAClub/Search'

/* ── Zod schemas for the TI response ───────────────────────────────────
   These describe the raw shape the endpoint returns. Most fields are
   optional / nullable because TI's records are incomplete in places
   and we'd rather degrade gracefully than fail on a single oddly-shaped
   club. */

const TiCoordinatesSchema = z.object({
  Latitude: z.number().nullable().optional(),
  Longitude: z.number().nullable().optional(),
})

const TiRegionSchema = z.object({
  Value: z.string().nullable().optional(),
  Name: z.string().nullable().optional(),
})

const TiAddressSchema = z.object({
  Street: z.string().nullable().optional(),
  AdditionalLines: z.string().nullable().optional(),
  City: z.string().nullable().optional(),
  County: z.string().nullable().optional(),
  PrimaryRegion: TiRegionSchema.nullable().optional(),
  PrimaryRegionDescription: z.string().nullable().optional(),
  Country: z.string().nullable().optional(),
  PostalCode: z.string().nullable().optional(),
  Coordinates: TiCoordinatesSchema.nullable().optional(),
})

const TiClassificationLeafSchema = z.object({
  Id: z.unknown().optional(),
  Name: z.string().nullable().optional(),
})

const TiClassificationSchema = z.object({
  District: TiClassificationLeafSchema.nullable().optional(),
  Division: TiClassificationLeafSchema.nullable().optional(),
  Area: TiClassificationLeafSchema.nullable().optional(),
})

const TiIdentificationIdSchema = z.object({
  Value: z.string().nullable().optional(),
  DisplayFriendlyFormat: z.string().nullable().optional(),
  Name: z.string().nullable().optional(),
})

const TiIdentificationSchema = z.object({
  Id: TiIdentificationIdSchema.nullable().optional(),
  Name: z.string().nullable().optional(),
})

const TiClubSchema = z.object({
  Identification: TiIdentificationSchema.nullable().optional(),
  Address: TiAddressSchema.nullable().optional(),
  Classification: TiClassificationSchema.nullable().optional(),
  CountryName: z.string().nullable().optional(),
  CharterDate: z.string().nullable().optional(),
  Email: z.string().nullable().optional(),
  Phone: z.string().nullable().optional(),
  Website: z.string().nullable().optional(),
  FacebookLink: z.string().nullable().optional(),
  TwitterLink: z.string().nullable().optional(),
  MeetingDay: z.string().nullable().optional(),
  MeetingTime: z.string().nullable().optional(),
  AllowsVirtualAttendance: z.boolean().nullable().optional(),
  IsProspective: z.boolean().nullable().optional(),
  HasUpcomingEvent: z.boolean().nullable().optional(),
  Location: z.string().nullable().optional(),
  Note: z.string().nullable().optional(),
  Restriction: z.array(z.unknown()).nullable().optional(),
})

const TiResponseSchema = z.object({
  Clubs: z.array(TiClubSchema).nullable(),
  district: z.string().nullable().optional(),
})

export type TiClub = z.infer<typeof TiClubSchema>
export type TiResponse = z.infer<typeof TiResponseSchema>

/* ── Normalised, snapshot-friendly enrichment shape ────────────────── */

export interface ClubEnrichment {
  /** 8-char zero-padded club number — primary join key. */
  clubId: string
  /** Display name from TI's Find-A-Club registry. Optional because
   *  TI occasionally returns a club entry with no Name (rare; mostly
   *  test fixtures). Surfaced by the prospective-clubs panel (#489). */
  clubName?: string
  charterDate?: string // ISO date
  coordinates?: { lat: number; lng: number }
  address?: {
    street?: string
    city?: string
    region?: string
    postalCode?: string
    country?: string
  }
  email?: string
  phone?: string
  website?: string
  facebookLink?: string
  twitterLink?: string
  meetingDay?: string
  meetingTime?: string
  allowsVirtualAttendance?: boolean
  isProspective?: boolean
}

export interface FindAClubServiceConfig {
  /** ms between requests (default 1100 ≈ 0.9 req/sec). */
  requestIntervalMs?: number
  /** Override the fetch implementation (for tests). */
  fetchImpl?: typeof fetch
  /** Custom anchor for the lat/lng+radius sweep. Defaults to TI HQ. */
  anchorLatitude?: number
  anchorLongitude?: number
  /** Sweep radius in miles (default 5000). */
  radiusMiles?: number
}

export class FindAClubService {
  private readonly requestIntervalMs: number
  private readonly fetchImpl: typeof fetch
  private readonly anchorLat: number
  private readonly anchorLng: number
  private readonly radiusMiles: number
  private lastRequestTime = 0

  constructor(config: FindAClubServiceConfig = {}) {
    this.requestIntervalMs =
      config.requestIntervalMs ?? DEFAULT_REQUEST_INTERVAL_MS
    this.fetchImpl = config.fetchImpl ?? fetch
    this.anchorLat = config.anchorLatitude ?? TI_HQ_LATITUDE
    this.anchorLng = config.anchorLongitude ?? TI_HQ_LONGITUDE
    this.radiusMiles = config.radiusMiles ?? SWEEP_RADIUS_MILES
  }

  /**
   * Build the search URL for a single district. Exposed for tests + the
   * raw-cache writer.
   */
  buildUrl(districtId: string): string {
    const params = new URLSearchParams({
      latitude: String(this.anchorLat),
      longitude: String(this.anchorLng),
      radius: String(this.radiusMiles),
      district: normaliseDistrictParam(districtId),
    })
    return `${ENDPOINT_URL}?${params.toString()}`
  }

  /**
   * Fetch one district's raw + parsed clubs. Throws on HTTP error or
   * schema-validation failure; callers should try/catch per district.
   */
  async fetchDistrict(districtId: string): Promise<{
    rawJson: unknown
    clubs: ClubEnrichment[]
  }> {
    await this.throttle()
    const url = this.buildUrl(districtId)
    const res = await this.fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'toast-stats-collector/1.0 (+https://ts.taverns.red)',
        Referer: 'https://www.toastmasters.org/find-a-club',
      },
    })
    if (!res.ok) {
      throw new Error(
        `FindAClub HTTP ${res.status} ${res.statusText} for district ${districtId}`
      )
    }
    const rawJson = (await res.json()) as unknown
    const parsed = TiResponseSchema.parse(rawJson)
    const clubs = (parsed.Clubs ?? [])
      .map(normaliseTiClub)
      .filter((c): c is ClubEnrichment => c !== null)
    return { rawJson, clubs }
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime
    const wait = this.requestIntervalMs - elapsed
    if (wait > 0) {
      await new Promise(resolve => setTimeout(resolve, wait))
    }
    this.lastRequestTime = Date.now()
  }
}

/* ── Helpers ───────────────────────────────────────────────────────── */

/** Zero-pad single/double-digit numeric district IDs ('01'..'99').
 *  Leave 'U', 'F', or 3-digit numerics unchanged. */
export function normaliseDistrictParam(districtId: string): string {
  const trimmed = districtId.trim()
  if (/^\d{1}$/.test(trimmed)) return '0' + trimmed
  if (/^\d{2,}$/.test(trimmed)) return trimmed
  return trimmed.toUpperCase()
}

const NET_DATE_PATTERN = /\/Date\((-?\d+)\)\//

/** Parse a .NET-style /Date(ms)/ string to ISO. Returns undefined for
 *  unparseable input or pre-1900 / post-2200 sanity-band violations.
 *  #486 L3: handles extreme-magnitude ms that produce Invalid Date —
 *  without this guard, `toISOString()` throws RangeError downstream. */
export function parseNetDate(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined
  const match = NET_DATE_PATTERN.exec(input)
  if (!match) return undefined
  const ms = Number(match[1])
  if (!Number.isFinite(ms)) return undefined
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return undefined
  const year = date.getUTCFullYear()
  if (year < 1900 || year > 2200) return undefined
  return date.toISOString().slice(0, 10) // YYYY-MM-DD
}

/** Convert a parsed TI club record into our snapshot-friendly shape.
 *  Returns null when the record is missing its primary key. */
export function normaliseTiClub(club: TiClub): ClubEnrichment | null {
  const id = club.Identification?.Id?.Value?.trim()
  if (!id) return null

  const result: ClubEnrichment = { clubId: id }

  const name = club.Identification?.Name?.trim()
  if (name) result.clubName = name

  const charterDate = parseNetDate(club.CharterDate)
  if (charterDate) result.charterDate = charterDate

  const coords = club.Address?.Coordinates
  if (
    coords &&
    typeof coords.Latitude === 'number' &&
    typeof coords.Longitude === 'number'
  ) {
    result.coordinates = { lat: coords.Latitude, lng: coords.Longitude }
  }

  const address: ClubEnrichment['address'] = {}
  if (club.Address?.Street) address.street = club.Address.Street
  if (club.Address?.City) address.city = club.Address.City
  const region = club.Address?.PrimaryRegion?.Value
  if (region) address.region = region
  if (club.Address?.PostalCode) address.postalCode = club.Address.PostalCode
  if (club.CountryName) address.country = club.CountryName
  if (Object.keys(address).length > 0) result.address = address

  if (club.Email) result.email = club.Email
  if (club.Phone) result.phone = club.Phone
  if (club.Website) result.website = club.Website
  if (club.FacebookLink) result.facebookLink = club.FacebookLink
  if (club.TwitterLink) result.twitterLink = club.TwitterLink
  if (club.MeetingDay) result.meetingDay = club.MeetingDay.trim()
  if (club.MeetingTime) result.meetingTime = club.MeetingTime.trim()
  if (typeof club.AllowsVirtualAttendance === 'boolean') {
    result.allowsVirtualAttendance = club.AllowsVirtualAttendance
  }
  if (typeof club.IsProspective === 'boolean') {
    result.isProspective = club.IsProspective
  }

  return result
}
