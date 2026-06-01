/**
 * Read-schemas for the CDN discovery / routing layer.
 *
 * These files (`v1/latest.json`, `v1/dates.json`, the `config/*` indices) are
 * the CDN's own presentation/manifest layout — they do NOT correspond to a
 * collector write-contract in `shared-contracts`, so the thin reader defines
 * its own minimal read-schemas here. Validation is intentionally permissive:
 * Zod strips unknown keys (e.g. the `_format` envelope), so it asserts the
 * fields the client actually reads without coupling to the full manifest shape.
 *
 * Core analytics files that DO map to a write-contract are validated with the
 * shared schema directly (see cdn-rankings.schema.ts and CdnClient).
 */
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** `v1/latest.json` — pointer to the current snapshot date. */
export const LatestManifestSchema = z.object({
  latestSnapshotDate: z.string().regex(ISO_DATE),
  generatedAt: z.string().optional(),
})
export type LatestManifest = z.infer<typeof LatestManifestSchema>

/** `v1/dates.json` — every available snapshot date, oldest-first. */
export const DatesIndexSchema = z.object({
  dates: z.array(z.string().regex(ISO_DATE)),
})
export type DatesIndex = z.infer<typeof DatesIndexSchema>

/** `config/district-snapshot-index.json` — per-district available dates. */
export const DistrictSnapshotIndexSchema = z.object({
  generatedAt: z.string().optional(),
  districts: z.record(z.string(), z.array(z.string().regex(ISO_DATE))),
})
export type DistrictSnapshotIndex = z.infer<typeof DistrictSnapshotIndexSchema>

/** A single `config/club-index.json` entry. */
export const ClubIndexEntrySchema = z.object({
  districtId: z.string(),
  clubName: z.string(),
})
export type ClubIndexEntry = z.infer<typeof ClubIndexEntrySchema>

/** `config/club-index.json` — resolve a club id to its district. */
export const ClubIndexSchema = z.object({
  generatedAt: z.string().optional(),
  snapshotDate: z.string().regex(ISO_DATE).optional(),
  totalClubs: z.number().optional(),
  clubs: z.record(z.string(), ClubIndexEntrySchema),
})
export type ClubIndex = z.infer<typeof ClubIndexSchema>
