#!/usr/bin/env node
/**
 * Executable entry point for the local Toast Stats MCP server (ADR-008).
 *
 * Serves the read-only tools over stdio. All diagnostics go to stderr (R4) —
 * stdout carries only the MCP JSON-RPC stream the transport owns.
 */
import { startStdioServer } from './server.js'

startStdioServer().catch((err: unknown) => {
  console.error('[toast-stats-mcp] failed to start:', err)
  process.exit(1)
})
