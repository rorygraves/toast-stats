/**
 * Offline stdio boot smoke (#1045, ADR-008 Sprint 3).
 *
 * Proves the *installed binary* boots and serves over **real stdio** — not the
 * in-memory transport pair the server unit test uses. It spawns the built
 * `dist/bin.js` exactly as an MCP client (Claude Desktop / Claude Code) would,
 * connects a real {@link Client} over {@link StdioClientTransport}, and drives
 * it against a **localhost** HTTP server serving the committed CDN fixtures via
 * the `CDN_BASE_URL` override. No live CDN, no internet, no live Claude client.
 *
 * Requires the package to be built first (`npm run build:mcp-server`); CI builds
 * it before this test runs, and `npm run smoke` builds then runs just this file.
 * The `beforeAll` guard fails loudly with that instruction if `dist/` is stale.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(here, '..', '..')
const binPath = join(packageRoot, 'dist', 'bin.js')
const fixtureDir = join(here, '..', '__fixtures__')

/** CDN path (after the origin) → committed fixture filename. */
const ROUTES: Record<string, string> = {
  '/v1/latest.json': 'latest.json',
  '/v1/dates.json': 'dates.json',
  '/config/district-snapshot-index.json': 'district-snapshot-index.json',
  '/config/club-index.json': 'club-index.json',
  '/v1/rankings.json': 'v1-rankings.json',
  '/snapshots/2026-05-31/all-districts-rankings.json':
    'dated-all-districts-rankings.json',
  '/snapshots/2026-05-31/district_61.json': 'district-snapshot.json',
  '/time-series/district_61/2025-2026.json': 'time-series.json',
}

interface ToolEnvelope {
  available: boolean
  sourceUrl: string
  date: string | null
  data: unknown
}

function startFixtureCdn(): Promise<{ server: Server; baseUrl: string }> {
  const server = createServer((req, res) => {
    const file = req.url ? ROUTES[req.url] : undefined
    if (!file) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(readFileSync(join(fixtureDir, file), 'utf8'))
  })
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` })
    })
  })
}

describe('installed bin boots over real stdio (offline, fixture-backed)', () => {
  let cdn: { server: Server; baseUrl: string }
  let client: Client

  beforeAll(async () => {
    if (!existsSync(binPath)) {
      throw new Error(
        `dist/bin.js not found at ${binPath} — build first: ` +
          '`npm run build:mcp-server` (or `npm run smoke`). CI builds before this test.'
      )
    }
    cdn = await startFixtureCdn()

    const transport = new StdioClientTransport({
      command: process.execPath, // the current node binary
      args: [binPath],
      // Point the real server at the localhost fixture CDN; keep PATH so any
      // child resolution still works. Nothing else from the parent env leaks in.
      env: { CDN_BASE_URL: cdn.baseUrl, PATH: process.env.PATH ?? '' },
    })
    client = new Client({ name: 'smoke-client', version: '0.0.0' })
    await client.connect(transport)
  }, 30000)

  afterAll(async () => {
    await client?.close()
    await new Promise<void>(resolve => cdn?.server.close(() => resolve()))
  })

  it('lists all 8 read-only tools to a real stdio client', async () => {
    const { tools } = await client.listTools()
    expect(tools.map(t => t.name).sort()).toEqual(
      [
        'get-club-health',
        'get-district-snapshot',
        'get-latest-date',
        'get-time-series',
        'list-dates',
        'list-districts',
        'query-rankings',
        'resolve-club',
      ].sort()
    )
  })

  it('answers a discovery tool call from the fixture CDN, citing the source URL', async () => {
    const result = await client.callTool({
      name: 'get-latest-date',
      arguments: {},
    })
    const content = result.content as { type: string; text: string }[]
    expect(content[0]!.type).toBe('text')
    const env = JSON.parse(content[0]!.text) as ToolEnvelope
    expect(env.available).toBe(true)
    expect(env.sourceUrl).toBe(`${cdn.baseUrl}/v1/latest.json`)
    expect(
      (env.data as { latestSnapshotDate: string }).latestSnapshotDate
    ).toBe('2026-05-31')
  })

  it('answers a dated district-snapshot read end-to-end over the boot path', async () => {
    const result = await client.callTool({
      name: 'get-district-snapshot',
      arguments: { districtId: '61', date: '2026-05-31' },
    })
    const content = result.content as { type: string; text: string }[]
    const env = JSON.parse(content[0]!.text) as ToolEnvelope
    expect(env.available).toBe(true)
    expect(env.sourceUrl).toBe(
      `${cdn.baseUrl}/snapshots/2026-05-31/district_61.json`
    )
    expect(env.date).toBe('2026-05-31')
  })
})
