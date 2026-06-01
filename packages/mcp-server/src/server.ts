/**
 * MCP server bootstrap (ADR-008 Sprint 2).
 *
 * Builds an `McpServer` over the official SDK, registers the read-only
 * {@link TOOLS} backed by a {@link CdnClient}, and (for the installed binary)
 * serves them over stdio. The server is thin: it owns no state beyond the
 * client and performs no computation.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { CdnClient, DEFAULT_CDN_BASE_URL } from './cdn/CdnClient.js'
import { TOOLS } from './tools/tools.js'

export const SERVER_NAME = 'toast-stats'
export const SERVER_VERSION = '0.1.0'

/**
 * Resolve the CDN origin the installed server reads from. Honors a `CDN_BASE_URL`
 * environment override (self-hosting, a staging CDN, or the offline smoke check
 * pointing at a localhost fixture server); falls back to the public
 * {@link DEFAULT_CDN_BASE_URL} when unset or blank. A whitespace-only value is
 * treated as unset so a stray export can't silently break the default.
 */
export function resolveCdnBaseUrl(
  env: { CDN_BASE_URL?: string } = process.env
): string {
  const override = env.CDN_BASE_URL?.trim()
  return override ? override : DEFAULT_CDN_BASE_URL
}

/** Register every read-only tool on `server`, backed by `client`. */
export function registerTools(server: McpServer, client: CdnClient): void {
  for (const t of TOOLS) {
    server.registerTool(
      t.name,
      {
        title: t.title,
        description: t.description,
        inputSchema: t.inputSchema,
        // Every tool is a pure CDN read — advertise it so clients can trust it.
        annotations: { readOnlyHint: true },
      },
      // The handler's text envelope IS a valid CallToolResult at runtime; the
      // assertion bridges our minimal ToolTextResult to the SDK's wider type.
      async args =>
        (await t.handler(
          client,
          args as Record<string, unknown>
        )) as CallToolResult
    )
  }
}

/** Build a fully-wired MCP server. Inject a `client` in tests. */
export function createServer(client: CdnClient = new CdnClient()): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  })
  registerTools(server, client)
  return server
}

/** Start the server over stdio (the local/self-installed transport). */
export async function startStdioServer(): Promise<void> {
  const server = createServer(new CdnClient({ baseUrl: resolveCdnBaseUrl() }))
  const transport = new StdioServerTransport()
  await server.connect(transport)
}
