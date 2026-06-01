// @toastmasters/mcp-server — public barrel.
//
// ADR-008 Sprint 1 (#1043): the typed, read-only CDN read client. No MCP tools
// yet — those are layered on top of this client in a later sprint.

export {
  CdnClient,
  DEFAULT_CDN_BASE_URL,
  type CdnClientOptions,
  type ResolvedClub,
  type DistrictSnapshot,
  type TimeSeriesProgramYear,
} from './cdn/CdnClient.js'

export { type CdnReadResult, notAvailable } from './cdn/result.js'

export {
  LatestManifestSchema,
  type LatestManifest,
  DatesIndexSchema,
  type DatesIndex,
  DistrictSnapshotIndexSchema,
  type DistrictSnapshotIndex,
  ClubIndexSchema,
  type ClubIndex,
  ClubIndexEntrySchema,
  type ClubIndexEntry,
} from './schemas/cdn-discovery.schema.js'

export {
  CdnRankingsSchema,
  type CdnRankings,
} from './schemas/cdn-rankings.schema.js'
