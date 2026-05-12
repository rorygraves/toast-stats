# #430 — Find-A-Club Endpoint Recipe (Empirical)

**Date:** 2026-05-11
**Author:** Claude
**Status:** Endpoint behaviour understood; ready to build the collector.

## The issue's example doesn't work as written

`GET https://www.toastmasters.org/api/sitecore/FindAClub/Search?district=61`
returns `{"Clubs":null,...}` — `district` alone is not enough. Confirmed
across `GET`, `POST`, `advanced=1`, header / cookie variations.

## What actually works

`GET /api/sitecore/FindAClub/Search` with **both** `latitude`+`longitude` AND
the desired filter. The `district` param composes with lat/lng:

```
?latitude=39.6478&longitude=-104.9878&radius=5000&district=01   # 116 clubs
?latitude=39.6478&longitude=-104.9878&radius=5000&district=26   # 144 clubs
?latitude=39.6478&longitude=-104.9878&radius=5000&district=61   # 165 clubs
?latitude=39.6478&longitude=-104.9878&radius=5000&district=117  # 104 clubs
?latitude=39.6478&longitude=-104.9878&radius=5000&district=U    #  77 clubs (Undistricted)
?latitude=39.6478&longitude=-104.9878&radius=5000&district=1    #   0 clubs — must be zero-padded
```

Key constraints:

- **District ID must be zero-padded** when ≤ 99 (`01`, `02`, ..., `26`, `27`)
  and bare otherwise (`100`, `117`).
- **`U` is a valid district** — clubs not yet assigned to a numbered
  district. 77 currently. Not in our existing rankings filter; worth
  capturing.
- Hard cap is **1000 clubs per response** regardless of radius. No
  district approaches this, but the bare lat/lng/radius mode (no district)
  caps out at 1000 so global enumeration via geographic sweep would need
  16+ overlapping cells.
- Anchor lat/lng + radius=5000 from Denver (the TI HQ default) returns
  all clubs in a district regardless of where they actually are. Distance
  is included in the response but does not affect the filter.

## Response shape (one club)

```jsonc
{
  "Identification": {
    "Id": {
      "Value": "00001399", // 8-char zero-padded — primary key
      "DisplayFriendlyFormat": "1399",
      "Name": "South Suburban Toastmasters ",
    },
    "Name": "South Suburban Toastmasters ",
  },
  "Address": {
    "Street": "2630 W Belleview Ave, Ste 100",
    "City": "Littleton",
    "PrimaryRegion": { "Value": "CO" }, // state / province code
    "PrimaryRegionDescription": "Colorado",
    "PostalCode": "80123",
    "Coordinates": { "Longitude": -105.01863, "Latitude": 39.62285 },
    "TimeZone": null,
  },
  "Classification": {
    "District": { "Name": "26" },
    "Division": { "Name": "M" },
    "Area": { "Name": "03" },
  },
  "CountryName": "United States",
  "CharterDate": "/Date(197190000000)/", // .NET ms-since-epoch — parse to ISO
  "Email": "officers-1399@toastmastersclubs.org",
  "Phone": "+13039128450",
  "Website": "http://1399.toastmastersclubs.org/",
  "FacebookLink": "https://www.facebook.com/SouthSuburbanTM1399",
  "TwitterLink": null,
  "MeetingDay": "Thursday",
  "MeetingTime": "7:00 am ",
  "AllowsVirtualAttendance": false,
  "IsProspective": false, // club-in-formation flag
  "HasUpcomingEvent": false,
  "Location": "TOAST Fine Food and Coffee<br>...",
  "Note": "",
  "Restriction": [], // gendered / age / language restrictions
}
```

### Field parsing notes

- `CharterDate` `/Date(197190000000)/` → `new Date(197190000000)` →
  `1976-04-01T07:00:00Z`. Regex out the integer.
- `Identification.Id.Value` is the canonical 8-char club number; use it
  as the join key against existing snapshot data.
- `Classification.District.Name` is the district number as TI publishes
  it (`"61"`, `"117"`, `"U"`) — note this is NOT zero-padded in the
  response even though the filter parameter requires zero-padding for
  single-digit districts.

## Recommended collector strategy

```text
for districtId in [01, 02, ..., 117, U]:  # ~128 districts incl. U
  fetch /api/sitecore/FindAClub/Search
    ?latitude=39.6478
    &longitude=-104.9878
    &radius=5000
    &district=<zero-padded id>
  throttle 1 req/sec
  raw JSON → gs://toast-stats-data/raw/find-a-club/<date>/district_<id>.json
  parse → merge per-club enrichment into existing snapshot
```

~128 requests, ~2.5 minutes total. One try/catch per district; one
failure doesn't fail the run.

## TOS reminders (from epic #429)

- Public, unauthenticated endpoint. No reverse-engineering needed; this
  is the JSON the public site itself uses.
- Add a request-rate limit (≤ 1 req/sec) so we don't hammer their CDN.
- Cite TI as source on /methodology.
- TI could remove or auth-gate at any time; schema in shared-contracts
  stays fully optional; pipeline must fail soft.

## Ready to build

This unblocks #430. The collector CLI command in
`packages/collector-cli/src/services/FindAClubService.ts` can now be
written against this verified shape.
