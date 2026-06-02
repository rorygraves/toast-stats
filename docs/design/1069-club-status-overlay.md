# Sprint 4 (#1069) — Club-status augmentation from Dues Renewal (read-time overlay, promote-only)

Epic #1062. Decision: read-time overlay, promote-only (spike §1a #1 + operator 2026-06-01).

## Problem

During the month-end **closing period** the base club/division/district dashboards freeze
(the #309 closing logic). The Daily **Dues Renewal** report keeps moving daily and is
program-year-keyed, so it sidesteps the snapshot-date remap. We want a club that the base
snapshot reports as Low/stale to show as **Active** the moment its dues renewal is
`Verified complete` — without ever mutating the frozen base.

## Data sources (verified on the correct commit, origin/main @ f5c2e9c4)

- Base clubs: `ClubTrend.clubStatus?: string` ("Active" | "Low" | "Suspended" | "Ineligible" | undefined),
  assembled in `useDistrictAnalytics` from `snapshots/{date}/analytics/district_{id}_analytics.json`.
- Overlay source (Sprint 3, #1065): `snapshots/{date}/district_{id}_reports.json`, schema
  `DistrictReportsDatasetSchema`. The `aprilDuesRenewal` / `octoberDuesRenewal` sections each carry
  `sources: ReportSource[]` (each `{reportType, tableId, asOf}`) and `records: DuesRenewalRecord[]`
  (`{club, division, area, renewalStatus, name, location}`). `renewalStatus` example:
  `"Verified complete - 08/09/2025"`. **Join key:** `record.club` (club number) == `ClubTrend.clubId`.

## Design

### Pure resolver — `frontend/src/utils/clubStatusOverlay.ts`

- `parseVerifiedComplete(renewalStatus): string | null` — returns ISO `YYYY-MM-DD` from
  `"Verified complete - MM/DD/YYYY"`, else `null` (any other status, incl. "Not renewed").
- `resolveClubStatusOverlay(baseStatus, renewalStatus, asOf): ClubStatusOverlay | null`
  - base already `Active` (case-insensitive) ⇒ `null` (no-op — clean hand-off, no backward jump).
  - `renewalStatus` is `Verified complete - <date>` ⇒
    `{ status: 'Active', source: 'dues-renewal', activeSince: <iso>, asOf }`.
  - otherwise ⇒ `null` (unchanged).
- **Promote-only is structurally safe:** the overlay only ever sets `Active`, the top operational
  state, and only when verified. It can never produce a status below base, so it can never demote.

### Join site — `useDistrictAnalytics` queryFn (single assembly point)

Fetch the reports file for the same `snapshotDate` **tolerantly** (404/parse-fail ⇒ no overlay,
never breaks the analytics query). Build a `Map<clubNumber, ClubStatusOverlay>` from the two dues
sections, attach `statusOverlay?: ClubStatusOverlay` to each matching `ClubTrend`. Every consumer of
`allClubs` inherits the augmented field; only the render sites change.

### Render — `clubsColumns.tsx` Club Status cell

If `club.statusOverlay` present: render the augmented status (`Active`) plus a subtle
"renewal verified <date>" affordance (small marker + `title`/`aria-label`), dark-mode + 375px safe.
Else render the base `clubStatus` exactly as today.

## Hand-off precedence (un-freeze)

When closing ends and the base snapshot reports the club `Active` itself, `resolveClubStatusOverlay`
returns `null` (base-Active no-op) → the overlay silently yields to the authoritative base. The user
never sees a value jump backward; the affordance simply disappears once the base agrees.

## Provenance (the #800 / D61-150→151 hazard)

Every augmented value carries `{ source: 'dues-renewal', asOf, activeSince }`. We never silently
blend two cadences into one number — the affordance always names the source + date.

## Known v1 scope boundaries (deliberate)

The overlay augments the **rendered** Club Status cell only. Two surfaces keep the
**frozen base** `clubStatus` on purpose:

- **CSV export** (`csvExport.ts`) exports the base `clubStatus`. The export is the
  auditable frozen-truth artifact; the read-time overlay is a UI affordance, and
  silently writing an augmented value into an export with no provenance column
  would re-introduce the very two-cadences-as-one-number hazard this sprint
  guards against. A promoted club therefore exports as its base status.
- **Column sort** (`clubsColumns.tsx` accessor) sorts on the base `clubStatus`
  (and is pinned to the pre-migration comparator, Lesson 117). A promoted-Active
  club sorts under its base bucket. Making sort overlay-aware is a future
  enhancement, not part of this read-time-display sprint.

Both are intentional: the base is the single auditable value; the overlay never
overwrites it, only annotates the on-screen status with explicit provenance.

## Verification

- Unit: resolver truth table incl. the Centretown D61 fixture (base Low + `Verified complete -
05/31/2026` ⇒ Active, activeSince 2026-05-31); base-Active no-op; non-verified unchanged.
- Component: cell renders the affordance for an overlaid club, base text otherwise.
- Live (preview, both engines): drive the clubs table with the reports fetch **route-mocked** to a
  verified-club fixture (staging CDN has no reports file yet — scheduled pipeline pending), assert
  the affordance renders + screenshot per engine. Code-proof for the data-landing path.
