# "What Changed" — snapshot-to-snapshot diff

**Epic:** #797 · **Authored:** 2026-05-27 (Sprint 1, #793)

Surface _what changed between two recorded snapshot dates_ for a district —
default "since the previous recorded date," and (Phase 2) any arbitrary date
pair in history. The app today shows current state and continuous trends but
never a date-to-date diff.

## §1. Phasing

| Phase | Issue | Scope                                                                                                                                                                         |
| ----- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | #793  | Pure `diffSnapshots` engine + `SnapshotDiff` type + **default** district digest page at `/district/:id/changes` (from = previous recorded date, to = latest). No date picker. |
| 2     | #794  | Arbitrary date-pair picker (from/to, URL-synced, per-district index).                                                                                                         |
| 3     | #795  | Per-club delta table + diff CSV export.                                                                                                                                       |
| 4     | #796  | (optional) Pre-computed GCS digest + cross-district view.                                                                                                                     |

## §2. Architectural spine

- **Pure diff engine** `diffSnapshots(from, to): SnapshotDiff` in
  `analytics-core` — no I/O, fully unit-testable, and reusable by a future
  collector pre-compute step (Phase 4) without a rewrite.
- **Client-side first** — fetch two dated snapshots and diff in a hook
  (`useSnapshotDiff`). Defer GCS pre-compute to Phase 4 (R7 — don't build
  backend before need).
- `from`/`to` are owned by the **page** and passed as props (R3); the hook
  never re-derives them from response data.

## §3. The load-bearing data finding (Lesson 115 — verified 2026-05-27)

The diff MUST be computed from two actual dated
`snapshots/{date}/district_{id}.json` files (`PerDistrictData.data`,
type `DistrictStatisticsFile`). Two traps were verified against the live
staging CDN for District 61 (2026-05-25 → 2026-05-26):

1. **`district_{id}_analytics.json` delta fields are single-snapshot** — they
   read `0` on the frontend. Building on them ships a feature that always says
   "nothing changed." (Epic constraint, Lesson 115.)
2. **`totals.distinguishedClubs` / `selectDistinguishedClubs` /
   `presidentDistinguishedClubs` are unpopulated mid-year** — all three read
   `0` even when `clubPerformance` shows 49–50 distinguished clubs. The
   authoritative per-club tier is the raw `clubPerformance`
   `Club Distinguished Status` field (`'' | D | S | P | M`). **Distinguished
   aggregates and flips are counted from that field, never from `totals.*`.**
   (Verified: D61 went 49 → 50 distinguished, one `'' → D` flip, while
   `totals.distinguishedClubs` stayed `0` on both dates.)

Real deltas verified for the D61 pair: membership 2716 → 2742 (+26), payments
5723 → 5749 (+26), clubs 161 → 162 (one club joined: "iA Montreal
Toastmasters", Active), 7 clubs changed membership/goals.

## §4. `SnapshotDiff` shape (`packages/shared-contracts`)

Per-aggregate delta is `{ from, to, delta }` (`delta = to − from`, signed).

- `districtId`, `from.date`, `to.date`, `dayCount` (calendar days between —
  surfaced in the headline so sparse gaps are honest).
- `totals`: `membership`, `payments`, `clubCount`, `distinguished` (the four
  KPI cards).
- `clubs`: `bothPresent: ClubDiff[]`, `onlyInFrom: ClubPresence[]` (left the
  roster), `onlyInTo: ClubPresence[]` (joined the roster) — joined by `clubId`.
  `ClubPresence` carries `clubStatus` so roster appear/disappear is
  **classified** (Lesson 118), never shown as an error.
- `events: DiffEvent[]` — categorized, narrative-ready, sorted by magnitude.
  Categories: `membership`, `dcp-goals`, `distinguished`, `club-added`,
  `club-removed`. (Payments is an aggregate KPI only; per-club payment churn
  would double the membership noise in v1.)

`ClubDiff` carries `membership`/`payments`/`dcpGoals` deltas plus
`distinguishedFrom`/`distinguishedTo`/`distinguishedChanged`. DCP signals come
from raw `clubPerformance` goal fields, never inferred Goals 1–N order
(tripwire).

## §5. Phase 1 frontend

- `useSnapshotDiff(districtId, from, to)` — React Query keyed by the date pair,
  fetches both dated snapshots, returns `diffSnapshots(...)`.
- `previousRecordedDate(index, districtId)` — the per-district snapshot index
  `[-2]` (never the global dates list). `[-1]` is `to`.
- `DistrictChangesPage` (lazy route `/district/:districtId/changes`) — narrative
  headline + 4 `KpiDeltaCard`s + grouped collapsible change list.
- `DistrictSubnav` gains a "What Changed" section (a real route, per ADR-005).
- **Empty/edge states:** only one snapshot for the district → digest disabled
  with an explanation; no changes in range → "No recorded changes" (a valid
  outcome, not an error).

## §6. Verification

Drive the real page on the PR preview channel (staging CDN) for ≥1
representative district (D61) — assert non-zero rendered deltas (Lesson 115:
verify the served value, not just a prop-fed unit test). Unit tests cover the
pure engine (aggregates, all three partitions, every event category) with a
failing test first.
