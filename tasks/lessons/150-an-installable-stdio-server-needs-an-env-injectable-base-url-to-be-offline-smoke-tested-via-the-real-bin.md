---
id: '150'
category: lesson
tags: [mcp, verification, tdd, monorepo, ci, automation]
auto_load: true
date: 2026-06-01
issues: [1045, 1042]
---

# Lesson 150 — An installable stdio server needs an env-injectable base URL to be offline-smoke-tested via the real bin

**Date:** 2026-06-01
**Issue:** #1045 (epic #1042 Sprint 3 — make the thin local MCP server installable + documented)
**PR:** (this sprint)

## What happened

Sprint 2 already had an end-to-end server test (`server.test.ts`) that wires a real
MCP `Client` to the server over the SDK's **in-memory** transport pair. That proves
tool registration and the request/response envelope — but it does **not** prove the
thing a Sprint-3 "install path" DoD actually cares about: that the published
**binary** (`dist/bin.js`) boots, speaks **real stdio**, and reads the CDN, exactly
as a Claude Desktop / Claude Code `mcpServers` entry would launch it.

To smoke that boot path _offline_ (the DoD forbids a live CDN or live client), the
test must spawn the real built bin and point it at **localhost fixtures** — which is
impossible if the only CDN origin the bin knows is the hard-coded production default.
The unlock was a one-line seam: `resolveCdnBaseUrl(env)` reads a `CDN_BASE_URL`
override (falling back to the public default), wired into `startStdioServer`'s
`CdnClient`. The smoke then starts a `node:http` server on `127.0.0.1:0` serving the
committed fixtures, spawns `process.execPath dist/bin.js` with
`env: { CDN_BASE_URL, PATH }` over `StdioClientTransport`, and asserts `listTools` +
real fixture-backed tool calls with the cited source URL. No internet, no live client.

## The transferable principle

**An in-memory-transport test of a stdio server is necessary but not sufficient for
an _install/boot_ proof. To smoke the real bin offline you need a configuration seam
the spawned process can be pointed through — an env-injectable base URL (or fixture
dir) — so the genuine artifact can be driven against localhost fixtures over real
stdio.** Put the env read at the **server entry/boot seam**, not buried in the client
class: the client keeps taking an injected `baseUrl` (testable, env-agnostic), and the
entry point is the single place that translates environment → config. That same
override is also the legitimate self-hosting / staging-CDN feature, so it isn't
test-only scaffolding.

## How to apply

- Building an installable stdio/CLI server? Add the base-URL/fixture override **before**
  you write the offline smoke — the smoke depends on it.
- The smoke spawns the **built** artifact, so it has an implicit build dependency:
  guard `existsSync(dist/bin.js)` with an actionable "build first" message, ensure CI
  builds the package _before_ its test step (R16), and give it a `npm run smoke` that
  builds then runs. Coverage of a spawned subprocess isn't instrumented — that's fine;
  the in-memory test covers the units, the smoke covers the boot.
- Pass `process.execPath` (absolute) as the spawn command so node resolves without a
  PATH lookup; still forward `PATH` so the child's own module resolution works.

## Related

- [[143-a-probe-whose-production-feed-was-deferred-reports-unknown-forever]] — same
  spirit: a verification sprint is where you drive the real feed/boot end-to-end, not
  a stand-in.
- [[092-workspace-package-dist-is-gitignored-and-not-auto-rebuilt]] (R16) — the build
  dependency the spawned-bin smoke inherits.
- `packages/mcp-server/src/server.ts` (`resolveCdnBaseUrl`),
  `packages/mcp-server/src/__tests__/stdio-boot.smoke.test.ts`.
