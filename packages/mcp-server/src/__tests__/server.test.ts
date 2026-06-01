import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { CdnClient } from '../cdn/CdnClient.js'
import { createServer } from '../server.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixtureDir = join(here, '..', '__fixtures__')
const BASE = 'https://cdn.taverns.red'

function fixtureClient(): CdnClient {
  const fetchFn = (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url === `${BASE}/v1/latest.json`) {
      return new Response(
        readFileSync(join(fixtureDir, 'latest.json'), 'utf8'),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    }
    return new Response('not found', { status: 404 })
  }) as typeof fetch
  return new CdnClient({ baseUrl: BASE, fetchFn })
}

/** Wire a real MCP client to the server over an in-memory transport pair. */
async function connectedClient(): Promise<Client> {
  const server = createServer(fixtureClient())
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)
  const client = new Client({ name: 'test-client', version: '0.0.0' })
  await client.connect(clientTransport)
  return client
}

describe('MCP server (end-to-end over in-memory transport)', () => {
  it('lists all 8 read-only tools to a connected client', async () => {
    const client = await connectedClient()
    const { tools } = await client.listTools()
    const names = tools.map(t => t.name).sort()
    expect(names).toEqual(
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
    // each advertises an input schema (JSON Schema object) and is read-only
    for (const t of tools) {
      expect(t.inputSchema).toBeDefined()
      expect(t.annotations?.readOnlyHint).toBe(true)
    }
    await client.close()
  })

  it('invokes a tool end-to-end and returns the CDN-grounded envelope', async () => {
    const client = await connectedClient()
    const result = await client.callTool({
      name: 'get-latest-date',
      arguments: {},
    })
    const content = result.content as { type: string; text: string }[]
    expect(content[0]!.type).toBe('text')
    const env = JSON.parse(content[0]!.text) as {
      available: boolean
      sourceUrl: string
      data: { latestSnapshotDate: string }
    }
    expect(env.available).toBe(true)
    expect(env.sourceUrl).toBe(`${BASE}/v1/latest.json`)
    expect(env.data.latestSnapshotDate).toBe('2026-05-31')
    await client.close()
  })

  it('flags an invalid tool argument shape via the registered input schema', async () => {
    const client = await connectedClient()
    // resolve-club requires a non-empty clubId; an empty object is rejected by
    // the SDK against the registered zod raw-shape before the handler runs,
    // surfaced as an error result (proves the input schema is actually wired).
    const result = await client.callTool({
      name: 'resolve-club',
      arguments: {},
    })
    expect(result.isError).toBe(true)
    const content = result.content as { type: string; text: string }[]
    expect(content[0]!.text).toMatch(/expected string|invalid|required/i)
    await client.close()
  })
})
