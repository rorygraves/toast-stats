# @toastmasters/mcp-server

A **thin, local, read-only [MCP](https://modelcontextprotocol.io) server** over the
public Toast Stats snapshot CDN ([ADR-008](../../docs/architecture-decisions/008-ai-enable-toast-stats.md)).
It lets any MCP-capable client (Claude Desktop, Claude Code, …) answer open-ended
questions about Toastmasters district performance, grounded in the **pre-computed**
pipeline output published at `https://cdn.taverns.red`.

It is deliberately **thin**:

- **Read-only, no computation.** Tools fetch CDN JSON, validate it with the
  `shared-contracts` read-schemas, and return fields. They never derive a tier,
  threshold, or recognition state, and the package imports **no `analytics-core`**.
- **Not-available, never guess.** If a question needs something a snapshot doesn't
  already contain, the tool returns a structured _not available_ — it never fabricates.
- **Local only.** stdio transport, runs on your machine. No hosting, no always-on
  service, no auth (the data is public).
- **Cite the source.** Every response carries the exact CDN URL it read and the
  snapshot `date`, so any answer is human-verifiable against the live site.

## Install

This is a workspace package in the [Toast Stats monorepo](../../), distributed
**locally / self-installed** (not published to a public registry). Build it once,
then point your MCP client at the built binary.

```bash
# from the monorepo root
npm install
npm run build:shared-contracts   # mcp-server depends on the built contracts
npm run build:mcp-server         # emits packages/mcp-server/dist/bin.js
```

This produces the executable `dist/bin.js` (bin name: `toast-stats-mcp`).

## Configure your MCP client

Add a `mcpServers` entry pointing at the built bin. Use an **absolute** path.

**Claude Desktop** (`claude_desktop_config.json`) / **Claude Code** (`.mcp.json`):

```json
{
  "mcpServers": {
    "toast-stats": {
      "command": "node",
      "args": ["/absolute/path/to/toast-stats/packages/mcp-server/dist/bin.js"]
    }
  }
}
```

Restart the client; the `toast-stats` tools below become available.

### Pointing at a different CDN (optional)

The server reads `https://cdn.taverns.red` by default. Set `CDN_BASE_URL` to read a
staging origin or a local fixture server instead:

```json
{
  "mcpServers": {
    "toast-stats": {
      "command": "node",
      "args": ["/absolute/path/to/.../dist/bin.js"],
      "env": { "CDN_BASE_URL": "https://staging.example" }
    }
  }
}
```

## Tools

All eight tools are **read-only** (advertised via `readOnlyHint`). Each returns a
JSON envelope (see [Response shape](#response-shape)). `date` arguments are
`YYYY-MM-DD`; omit `date` on the dated reads to use the latest snapshot.

| Tool                    | Purpose                                                                                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get-latest-date`       | Most recent published snapshot date (`v1/latest.json`).                                                                                                                                                                 |
| `list-dates`            | Every available snapshot date (`v1/dates.json`).                                                                                                                                                                        |
| `list-districts`        | District ids with snapshots + the dates each has.                                                                                                                                                                       |
| `resolve-club`          | Which district a club id belongs to. Unknown club → not available (never guessed).                                                                                                                                      |
| `get-district-snapshot` | Full per-district snapshot (roster, division/area aggregates, totals) for a date.                                                                                                                                       |
| `query-rankings`        | All-districts rankings (ranks, paid clubs, payments, distinguished tiers).                                                                                                                                              |
| `get-club-health`       | Raw per-club health-signal fields (membership, base, renewals, DCP goals, status), optionally filtered to one division. The categorical thriving/vulnerable status is **not** a snapshot field and is not derived here. |
| `get-time-series`       | Pre-computed program-year time series for a district (membership / payments / DCP / distinguished / club-health counts).                                                                                                |

## Response shape

Every tool returns a single text content block whose JSON is the standard envelope:

```jsonc
{
  "available": true,
  "sourceUrl": "https://cdn.taverns.red/v1/latest.json", // verify against the live site
  "date": "2026-05-31", // the snapshot date the data is from (or null)
  "data": {
    /* the validated CDN fields */
  },
}
```

A not-available result keeps the same shape with `available: false` and a `reason`,
and still cites the `sourceUrl` it tried — the server never guesses a value it
couldn't read.

## Verify the install (offline smoke)

`npm run smoke` builds the package and boots the **real** `dist/bin.js` over stdio
against a localhost server serving committed CDN fixtures — no network, no live
Claude client. It asserts the bin lists its tools and answers a tool call:

```bash
npm run smoke --workspace=@toastmasters/mcp-server
```

This is the same offline check CI runs (it's part of the package test suite). It
proves the install/boot path end to end; live end-to-end verification against the
real CDN from a Claude client is a separate operator-run step.
