# Sprint 2 (#1044) — MCP read-only tools over the CDN client

Epic #1042 (ADR-008). Branch `sprint/1044-mcp-tools` from `origin/main`.

## Goal

Wrap the Sprint-1 `CdnClient` as MCP tools using the official MCP SDK
(`@modelcontextprotocol/sdk` v1.29, stdio transport). Read-only, no computation,
no `analytics-core`. Every tool returns the pre-computed fields + exact CDN
`sourceUrl` + snapshot `date`, or a structured "not available".

## Verified facts (evidence, not guesses)

- SDK API (from installed `.d.ts`): `new McpServer({name,version})`;
  `server.registerTool(name, {title?,description?,inputSchema?,annotations?}, cb)`
  where `inputSchema` is a **Zod raw shape** (`{f: z.string()}`), not `z.object`.
  Handler returns `{ content: [{type:'text', text}] }`.
  `StdioServerTransport` from `…/server/stdio.js`; `await server.connect(t)`.
- CDN paths (frontend + ADR-008 §queryable surface):
  - `snapshots/{date}/district_{id}.json` → validates `PerDistrictDataSchema`
    (wrapper `{districtId,districtName,collectedAt,status,data:DistrictStatisticsFile}`).
    Confirmed live: `data.clubs[]` carry raw fields only.
  - `time-series/district_{id}/{programYear}.json` → `ProgramYearIndexFileSchema`.
- **ADR-table discrepancy (documented):** ADR-008 line 92 says club health status
  is "per club, in snapshot (thriving/vulnerable/intervention-required)". The LIVE
  snapshot clubs carry NO `healthStatus` field — only the raw inputs
  (membershipCount, membershipBase, newMembers, dcpGoals, status, clubStatus).
  The classification is computed by `analytics-core`, which this package is
  FORBIDDEN to import. Per the binding hard rule ("no computation, never derive a
  tier/threshold/state"), `get-club-health` surfaces the **raw health-signal
  fields** per club; it does NOT derive the enum. The client reasons over them
  (the ADR's own "retrieval-and-explain" model). Flagged for ADR follow-up.

## Work

1. **CdnClient extension** (`src/cdn/CdnClient.ts`): add
   - `getDistrictSnapshot(districtId, date)` → `PerDistrictDataSchema`, date guard
     (ISO_DATE_RE), districtId guard (no path traversal — `encodeURIComponent` +
     a charset check), date = `data.snapshotDate`.
   - `getTimeSeries(districtId, programYear)` → `ProgramYearIndexFileSchema`,
     programYear `YYYY-YYYY` guard, date = last dataPoint date or null.
2. **Envelope** (`src/tools/envelope.ts`): `toToolResult(result, project?)` maps a
   `CdnReadResult<T>` → `{content:[{type:'text', text: JSON}]}` with a consistent
   `{available, sourceUrl, date, data|reason}` shape.
3. **Tools** (`src/tools/tools.ts`): 8 tool defs `{name,title,description,
inputSchema(rawShape), handler(client,args)}`:
   - `get-latest-date`, `list-dates`, `list-districts`, `resolve-club`,
     `get-district-snapshot`, `query-rankings`, `get-club-health`, `get-time-series`.
     Handlers do retrieval + field projection/filtering only (no derivation).
4. **Server** (`src/server.ts`): `createServer(client?)` builds McpServer + registers
   all tools; `startStdioServer()` connects stdio. `bin` entry for npx.
5. **Barrel** (`index.ts`): export `createServer`, `registerTools`, `TOOLS`.

## TDD

- Red: per-tool tests with a stubbed `CdnClient` (inject `fetchFn`) asserting
  returned fields + sourceUrl + the not-available path; CdnClient new-method tests
  (mocked fetch); a server-registration test (all 8 tools registered).
- Green: implement.
- Refactor: shared envelope; `/simplify` + `review` pass.

## DoD

All tools unit-tested; server starts over stdio; no `analytics-core` (existing
guard test stays green); CI green; preview job is path-filtered to frontend so no
live preview — code-proof per bootstrap step 5.
