/**
 * Shared test helper: a `fetch` stub that serves committed CDN fixtures by path
 * and 404s everything else, plus a `CdnClient` bound to it. Each test supplies
 * its own route map (path-after-base → fixture filename), so the stub stays a
 * single implementation across the CdnClient / tools / server suites.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CdnClient } from '../cdn/CdnClient.js'

export const BASE = 'https://cdn.taverns.red'

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '__fixtures__'
)

/** A fetch stub serving `routes` (path → fixture file); all else is a 404. */
export function makeFixtureFetch(routes: Record<string, string>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString()
    const file = routes[url.replace(BASE, '')]
    if (!file) return new Response('not found', { status: 404 })
    return new Response(readFileSync(join(fixtureDir, file), 'utf8'), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
}

/** A CdnClient bound to BASE and the given fetch (a fixture stub by default). */
export function makeClient(fetchFn: typeof fetch): CdnClient {
  return new CdnClient({ baseUrl: BASE, fetchFn })
}
