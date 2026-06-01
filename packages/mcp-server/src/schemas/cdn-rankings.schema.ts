/**
 * Read-schema for `v1/rankings.json`, the CDN's current-rankings presentation
 * file.
 *
 * Its wrapper differs from the collector write-contract
 * (`AllDistrictsRankingsDataSchema` is `{ metadata, rankings }`; this file is
 * `{ _format, rankings, date, generatedAt }`), so it gets a local wrapper — but
 * each element is validated by the SHARED `DistrictRankingSchema` so the field
 * contract stays single-sourced in `shared-contracts`. The dated
 * `snapshots/{date}/all-districts-rankings.json` file, which matches the write
 * contract exactly, is validated by the full shared schema instead.
 */
import { z } from 'zod'
import { DistrictRankingSchema } from '@toastmasters/shared-contracts'
import { ISO_DATE_RE } from './common.js'

export const CdnRankingsSchema = z.object({
  rankings: z.array(DistrictRankingSchema),
  date: z.string().regex(ISO_DATE_RE),
  generatedAt: z.string().optional(),
})
export type CdnRankings = z.infer<typeof CdnRankingsSchema>
