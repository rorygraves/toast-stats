# Sprint 18 — #489 surface FAC-only clubs (ATOs / prospective)

## Decision: Option B+ (panel section)

A small "Prospective Clubs" section on `/district/:id/clubs`, rendered _below_ ClubsTable, visible only when the list is non-empty. Rejected:

- **Option A** (dedicated `/district/:id/prospective` panel): typical N = 0–4 per district, too sparse for a route.
- **Option C** (in ClubsTable with status badge): wrong data shape — prospectives have no DCP / payments / status fields. Forcing them into ClubsTable would either pollute the row model or require special-case rendering for every column. Lesson #80 applies: place the surface next to the data it consumes, but don't conflate two different row shapes.

## Data shape

```ts
export interface ProspectiveClub {
  clubId: string // 8-char zero-padded
  clubName: string
  charterDate?: string // ISO yyyy-mm-dd, present for newly-chartered-but-not-yet-reporting
  city?: string
  region?: string // state/province
  country?: string
  meetingDay?: string
  meetingTime?: string
  website?: string
  email?: string
  isProspective?: boolean // FAC's IsProspective flag — true = ATO
}
```

Compact projection of FAC's `EnrichedClub` — we strip `coordinates`, `phone`, `address.postalCode`/`street`, social links. Goal: small payload that surfaces what a district director wants to see when reading the list.

## Data flow

```
FAC fetch → FindAClubMerger.facOnlyClubs (already captured)
         ↓ NEW: project to ProspectiveClub[], write to snapshot.data.prospectiveClubs
DistrictStatistics.prospectiveClubs (analytics-core interfaces) ← NEW optional field
         ↓
AnalyticsComputer.computeDistrictAnalytics(): read latestSnapshot.prospectiveClubs ?? []
         ↓
DistrictAnalytics.prospectiveClubs (NEW) — flows to district_{id}_analytics.json
         ↓
Frontend useDistrictAnalytics → DistrictClubsPage → ProspectiveClubsPanel
```

The list rides on the existing analytics file rather than triggering a second fetch of the 700KB snapshot. Costs ~bytes for districts with 0 ATOs.

## Acceptance mapping

- [ ] Decide A/B/C for placement — **B+** (above)
- [ ] Schema bump for `prospectiveClubs` array (shared-contracts) — add optional field to `DistrictStatisticsFileSchema`
- [ ] Merger service captures FAC-only clubs into the array — extend `FindAClubMerger.mergeFacIntoSnapshot`
- [ ] UI surface ships — `ProspectiveClubsPanel` below ClubsTable on `/district/:id/clubs`
- [ ] Sample real ATOs (D61 had +4) — production verify via Playwright + CDN snapshot inspection

## TDD plan

### Backend (one file at a time, Red → Green → Refactor each)

1. **shared-contracts**: add `ProspectiveClubSchema` + extend `DistrictStatisticsFileSchema` with optional `prospectiveClubs`. Test: schema validates a sample object.
2. **collector-cli FindAClubMerger**: write `prospectiveClubs` projection into snapshot.data. Test: merger output includes the array with expected shape.
3. **analytics-core interfaces**: add `prospectiveClubs?: ProspectiveClub[]` to `DistrictStatistics` and `DistrictAnalytics`.
4. **analytics-core AnalyticsComputer**: assign `districtAnalytics.prospectiveClubs = latestSnapshot.prospectiveClubs ?? []`. Test: computer copies the list through.

### Frontend

5. **frontend DistrictAnalytics**: add `prospectiveClubs?: ProspectiveClub[]` to the interface.
6. **ProspectiveClubsPanel** component: renders nothing when empty, renders heading + list when present. Test: empty → null, non-empty → expected DOM.
7. **DistrictClubsPage**: imports the panel and renders below ClubsTable. Smoke test.

## Out of scope (deliberate)

- Don't compute analytics from prospectives (they have no DCP/payments).
- Don't add to ranking or aggregates.
- Don't ship a dedicated `/district/:id/prospective` route.
- Don't link prospective clubs to ClubDetailPage (no data to render there).
- Don't add map markers — out of scope for v1.

## Production verification target

D61 (Ottawa) had +4 FAC-only clubs as of 2026-05-11. Playwright smoke on `https://ts.taverns.red/district/61/clubs` should find the panel heading with a numeric count ≥1, and at least one club name.
