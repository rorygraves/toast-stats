/**
 * The consistent text envelope every MCP tool returns (ADR-008 Sprint 2).
 *
 * A tool wraps a {@link CdnReadResult} into an MCP `content` block whose text is
 * a stable JSON object:
 *  - success → `{ available: true, sourceUrl, date, data }`
 *  - not-available → `{ available: false, sourceUrl, reason }`
 *
 * Every payload carries the exact CDN `sourceUrl` (human-verifiable against the
 * live site) and the snapshot `date`. A not-available is a *valid* answer (the
 * ADR's "not-available, never guess"), so it is NOT flagged as an MCP error.
 */
import type { CdnReadResult } from '../cdn/result.js'

/** An MCP tool result carrying a single text block. */
export interface ToolTextResult {
  content: { type: 'text'; text: string }[]
}

/**
 * Wrap a CDN read result in the standard tool envelope. An optional `project`
 * reshapes the success payload (field selection / filtering only — never
 * derivation), keeping responses focused without importing any computation.
 */
export function toToolResult<T>(
  result: CdnReadResult<T>,
  project?: (data: T) => unknown
): ToolTextResult {
  const body = result.available
    ? {
        available: true as const,
        sourceUrl: result.sourceUrl,
        date: result.date,
        data: project ? project(result.data) : result.data,
      }
    : {
        available: false as const,
        sourceUrl: result.sourceUrl,
        reason: result.reason,
      }
  return { content: [{ type: 'text', text: JSON.stringify(body, null, 2) }] }
}

/** Parse a tool result's single text block back into its envelope object. */
export function parseToolText(result: ToolTextResult): unknown {
  return JSON.parse(result.content[0]!.text)
}
