/**
 * Zod schema + inferred types for the snapshot-to-snapshot diff
 * ("What Changed", epic #797).
 *
 * The diff is computed by the pure `diffSnapshots(from, to)` engine in
 * analytics-core from two dated `DistrictStatisticsFile` snapshots and consumed
 * by the frontend `useSnapshotDiff` hook / `DistrictChangesPage`.
 *
 * Types are inferred from the schema (single source of truth) — same convention
 * as snapshot-pointer.schema.ts.
 *
 * @module snapshot-diff.schema
 * @see docs/design/what-changed-feature.md §4
 */

import { z } from 'zod'

/** A signed before/after pair. `delta === to - from`. */
export const AggregateDeltaSchema = z.object({
  from: z.number(),
  to: z.number(),
  delta: z.number(),
})
export type AggregateDelta = z.infer<typeof AggregateDeltaSchema>

/**
 * Category of a single change event. Payments is intentionally aggregate-only
 * in Phase 1 (per-club payment churn would double the membership noise).
 *
 * `area-status` / `division-status` (#1014) carry recognition-tier transitions
 * for areas/divisions instead of clubs — derived in the frontend from the
 * verified recognition source-of-truth (`extractDivisionPerformance`), NOT the
 * analytics-core engine (which deliberately dropped tier logic in #799 to avoid
 * divergence — Lesson 117). Such events set `areaId`/`divisionId` rather than a
 * `clubId`.
 */
export const DiffEventCategorySchema = z.enum([
  'membership',
  'dcp-goals',
  'distinguished',
  'club-added',
  'club-removed',
  'area-status',
  'division-status',
])
export type DiffEventCategory = z.infer<typeof DiffEventCategorySchema>

/** Per-club delta for a club present in BOTH snapshots. */
export const ClubDiffSchema = z.object({
  clubId: z.string(),
  clubName: z.string(),
  divisionId: z.string(),
  areaId: z.string(),
  membership: AggregateDeltaSchema,
  payments: AggregateDeltaSchema,
  dcpGoals: AggregateDeltaSchema,
  /**
   * Raw `clubPerformance` "Club Distinguished Status" code
   * (`'' | D | S | P | M`). Authoritative per-club tier — `totals.*` distinguished
   * counts are unpopulated mid-year (Lesson 115). Never inferred from goal order.
   */
  distinguishedFrom: z.string(),
  distinguishedTo: z.string(),
  distinguishedChanged: z.boolean(),
})
export type ClubDiff = z.infer<typeof ClubDiffSchema>

/**
 * A club present in only one snapshot (joined or left the roster). Carries
 * `clubStatus` so appear/disappear is classified, not flagged as an error
 * (Lesson 118).
 */
export const ClubPresenceSchema = z.object({
  clubId: z.string(),
  clubName: z.string(),
  divisionId: z.string(),
  areaId: z.string(),
  clubStatus: z.string().optional(),
})
export type ClubPresence = z.infer<typeof ClubPresenceSchema>

/**
 * A narrative-ready, categorized change event. `magnitude` is signed (sort key).
 *
 * `clubId`/`clubName` identify a club-scoped event (the Phase-1 default; both
 * empty for an entity-less aggregate line). `areaId`/`divisionId`/`entityName`
 * (#1014) identify an area- or division-scoped recognition transition — the
 * frontend links the entity to its scoped route from these. `label` always
 * BEGINS with the entity display name (club name or `entityName`) so the feed
 * can link just that leading token, matching the club-link contract (#1013).
 */
export const DiffEventSchema = z.object({
  category: DiffEventCategorySchema,
  clubId: z.string(),
  clubName: z.string(),
  /** Division ref — set for `division-status` and (with `areaId`) `area-status`. */
  divisionId: z.string().optional(),
  /** Area ref — set for `area-status` events. */
  areaId: z.string().optional(),
  /** Display name the label begins with for an area/division event (e.g. "Area B2"). */
  entityName: z.string().optional(),
  label: z.string(),
  magnitude: z.number(),
})
export type DiffEvent = z.infer<typeof DiffEventSchema>

/** Minimal per-side summary (extended in later phases). */
export const SnapshotDiffSideSchema = z.object({
  date: z.string(),
})
export type SnapshotDiffSide = z.infer<typeof SnapshotDiffSideSchema>

/** District-level aggregate deltas — the four KPI cards. */
export const SnapshotDiffTotalsSchema = z.object({
  membership: AggregateDeltaSchema,
  payments: AggregateDeltaSchema,
  clubCount: AggregateDeltaSchema,
  /** Count of clubs with any distinguished status, from `clubPerformance`. */
  distinguished: AggregateDeltaSchema,
})
export type SnapshotDiffTotals = z.infer<typeof SnapshotDiffTotalsSchema>

/** The complete diff between two dated district snapshots. */
export const SnapshotDiffSchema = z.object({
  districtId: z.string(),
  from: SnapshotDiffSideSchema,
  to: SnapshotDiffSideSchema,
  /** Calendar days between from.date and to.date (honest about sparse gaps). */
  dayCount: z.number(),
  totals: SnapshotDiffTotalsSchema,
  clubs: z.object({
    bothPresent: z.array(ClubDiffSchema),
    onlyInFrom: z.array(ClubPresenceSchema),
    onlyInTo: z.array(ClubPresenceSchema),
  }),
  events: z.array(DiffEventSchema),
})
export type SnapshotDiff = z.infer<typeof SnapshotDiffSchema>
