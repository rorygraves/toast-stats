// @toastmasters/mcp-server — public barrel.
//
// ADR-008 Sprint 1 (#1043): the typed, read-only CDN read client.
// ADR-008 Sprint 2 (#1044): the read-only MCP tools + stdio server over it.

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

// MCP tools + server (Sprint 2)
export { TOOLS, type ToolDef } from './tools/tools.js'
export {
  toToolResult,
  parseToolText,
  type ToolTextResult,
} from './tools/envelope.js'
export {
  createServer,
  registerTools,
  startStdioServer,
  SERVER_NAME,
  SERVER_VERSION,
} from './server.js'
