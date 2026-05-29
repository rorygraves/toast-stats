#!/usr/bin/env node
/**
 * lighthouse-cdn-server.mjs — serve the built SPA AND committed CDN fixtures
 * from a single origin, so the Lighthouse CI gate is decoupled from live-CDN
 * reachability (#915, epic #917 Sprint 4 — V10).
 *
 * Why this exists
 * ---------------
 * `lighthouse-ci.yml` used to `npm run preview` (Vite) and let the `/` page
 * fetch the real prod CDN (`cdn.taverns.red`) during the 3-run Lighthouse pass.
 * A CDN flake → the page renders the error/empty terminal state → CLS is
 * measured against a collapsed layout → the `cumulative-layout-shift ≤ 0.1`
 * budget reds the build on luck (a real 0.206 was caught this way, #825 /
 * Lesson 125). The gate is correct; its *input* was non-deterministic.
 *
 * This server serves `frontend/dist` for the app and the committed fixtures in
 * `frontend/lighthouse/cdn-fixtures/` for the CDN paths the landing page hits
 * (`/v1/rankings.json`, `/v1/latest.json`, …). The Lighthouse build is pointed
 * at this origin via `VITE_CDN_BASE_URL=http://localhost:<port>`, so every
 * fetch resolves same-origin, offline, identically on every run — the page
 * reliably reaches the LOADED state and the CLS budget measures the real table.
 *
 * Usage:
 *   VITE_CDN_BASE_URL=http://localhost:4173 npm run build:frontend
 *   node scripts/lighthouse-cdn-server.mjs   # serves on :4173, logs "ready"
 *
 * Env:
 *   PORT        Listen port. Default 4173 (matches lighthouserc.js url).
 *   DIST_DIR    Built SPA dir. Default frontend/dist.
 *   FIXTURE_DIR CDN fixtures dir. Default frontend/lighthouse/cdn-fixtures.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PORT = Number(process.env.PORT || 4173)
const DIST_DIR = process.env.DIST_DIR || join(ROOT, 'frontend', 'dist')
const FIXTURE_DIR =
  process.env.FIXTURE_DIR ||
  join(ROOT, 'frontend', 'lighthouse', 'cdn-fixtures')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

// Resolve a request path to a file *inside* `base`, rejecting traversal.
function safeJoin(base, urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(
    /^(\.\.[/\\])+/,
    ''
  )
  const full = join(base, clean)
  return full.startsWith(base) ? full : null
}

async function tryFile(path) {
  if (!path) return null
  try {
    const s = await stat(path)
    if (s.isFile()) return await readFile(path)
  } catch {
    /* not found */
  }
  return null
}

const server = createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0]

  // 1) CDN fixture? (e.g. /v1/rankings.json, /snapshots/<date>/…)
  const fixture = await tryFile(safeJoin(FIXTURE_DIR, urlPath))
  if (fixture) {
    res.writeHead(200, {
      'content-type': MIME['.json'],
      // Same-origin in CI, but keep this permissive so the server also works
      // when the build points VITE_CDN_BASE_URL at it cross-origin (Lesson 133).
      'access-control-allow-origin': '*',
    })
    res.end(fixture)
    return
  }

  // 2) Static SPA asset?
  const assetPath = urlPath === '/' ? '/index.html' : urlPath
  const asset = await tryFile(safeJoin(DIST_DIR, assetPath))
  if (asset) {
    res.writeHead(200, {
      'content-type': MIME[extname(assetPath)] || 'application/octet-stream',
    })
    res.end(asset)
    return
  }

  // 3) Unknown CDN path → 404 JSON. The landing page treats a 404 on a
  //    *secondary* fetch as "no data for that section" (reserved-slot skeleton),
  //    and a 404 on rankings as the no-snapshot welcome state — both stable
  //    geometry. The primary rankings fixture exists, so the happy path wins.
  if (
    urlPath.startsWith('/v1/') ||
    urlPath.startsWith('/snapshots/') ||
    urlPath.startsWith('/config/')
  ) {
    res.writeHead(404, {
      'content-type': MIME['.json'],
      'access-control-allow-origin': '*',
    })
    res.end('{"error":"fixture not found"}')
    return
  }

  // 4) SPA client-side route → index.html fallback.
  const index = await tryFile(join(DIST_DIR, 'index.html'))
  if (index) {
    res.writeHead(200, { 'content-type': MIME['.html'] })
    res.end(index)
    return
  }

  res.writeHead(404, { 'content-type': MIME['.txt'] })
  res.end('not found')
})

server.listen(PORT, () => {
  // "ready" matches lighthouserc.js `startServerReadyPattern`.
  console.log(`lighthouse-cdn-server ready on http://localhost:${PORT}`)
  console.log(`  SPA:      ${DIST_DIR}`)
  console.log(`  fixtures: ${FIXTURE_DIR}`)
})
