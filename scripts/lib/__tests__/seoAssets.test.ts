import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ORIGIN,
  PUBLIC_ROUTES,
  buildRobotsTxt,
  buildSitemapXml,
} from '../seoAssets'

// scripts/lib/__tests__ → repo root is three levels up.
const REPO_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
)
const PUBLIC_DIR = join(REPO_ROOT, 'frontend', 'public')

const EXPECTED_PATHS = ['/', '/methodology', '/history', '/regions', '/awards']

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
}

describe('SEO route manifest', () => {
  it('covers exactly the stable, parameter-free public routes', () => {
    // The acceptance criteria name Districts (/), Methodology, History,
    // Regions, Awards. Parameterized routes are data-dependent and excluded.
    expect(PUBLIC_ROUTES.map(r => r.path).sort()).toEqual(
      [...EXPECTED_PATHS].sort()
    )
  })

  it('uses an absolute https origin with no trailing slash', () => {
    expect(ORIGIN).toBe('https://ts.taverns.red')
  })
})

describe('buildRobotsTxt', () => {
  const txt = buildRobotsTxt()

  it('allows all crawlers', () => {
    expect(txt).toMatch(/^User-agent: \*$/m)
    expect(txt).toMatch(/^Allow: \/$/m)
  })

  it('points crawlers at the absolute sitemap URL', () => {
    expect(txt).toMatch(
      new RegExp(
        `^Sitemap: ${ORIGIN.replace(/\./g, '\\.')}/sitemap\\.xml$`,
        'm'
      )
    )
  })

  it('documents its generated origin so it is not hand-edited blindly', () => {
    expect(txt).toContain('seo:generate')
  })
})

describe('buildSitemapXml', () => {
  const xml = buildSitemapXml()

  it('is a well-formed urlset document', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    )
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true)
  })

  it('emits one absolute <loc> per public route', () => {
    const expected = EXPECTED_PATHS.map(p =>
      p === '/' ? `${ORIGIN}/` : `${ORIGIN}${p}`
    )
    expect(locs(xml).sort()).toEqual(expected.sort())
  })

  it('only emits https URLs under the canonical host', () => {
    for (const loc of locs(xml)) {
      expect(loc.startsWith(`${ORIGIN}/`)).toBe(true)
    }
  })
})

// Drift guard (Lesson 82): the committed artifacts must equal the generator
// output. A new stable route added to the manifest without re-running
// `npm run seo:generate` fails CI here, instead of silently shipping a stale
// sitemap. This is the behavioral proof the files exist and are correct —
// the Lighthouse robots-txt audit scores 1 even when no robots.txt is served.
describe('committed public/ artifacts match the generator', () => {
  it('robots.txt is in sync', () => {
    const committed = readFileSync(join(PUBLIC_DIR, 'robots.txt'), 'utf8')
    expect(committed).toBe(buildRobotsTxt())
  })

  it('sitemap.xml is in sync', () => {
    const committed = readFileSync(join(PUBLIC_DIR, 'sitemap.xml'), 'utf8')
    expect(committed).toBe(buildSitemapXml())
  })
})
