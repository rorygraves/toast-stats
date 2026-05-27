/**
 * Head share/SEO metadata contract (#778, epic #785).
 *
 * The live site must emit a branded title, an accurate meta description,
 * a full Open Graph set, a Twitter summary_large_image card, and a
 * canonical link so that links shared in Slack/LinkedIn/X/iMessage render
 * a branded preview and crawlers index meaningful metadata.
 *
 * These assertions read the SHIPPED artifact (frontend/index.html) and the
 * static og:image asset directly — behaviour, not config (Lesson 82). The
 * Lighthouse SEO category in lighthouserc.js is the runtime gate that proves
 * these audits pass on the served page.
 *
 * F-SEC4: og:image is a STATIC asset (no user input) — the test asserts the
 * referenced file exists in frontend/public and that every social URL is an
 * absolute https URL on the canonical host.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const FRONTEND_ROOT = resolve(__dirname, '../../..')
const html = readFileSync(resolve(FRONTEND_ROOT, 'index.html'), 'utf-8')

const CANONICAL_URL = 'https://ts.taverns.red/'
const OG_IMAGE_URL = 'https://ts.taverns.red/og-image.png'
const TITLE = 'Toast Stats — Toastmasters District Performance'
const DESCRIPTION =
  'Explore Toastmasters district performance: club health, DCP goals, membership trends, and Distinguished status — visualized across program years.'

/** Extract a `<meta name|property="X" content="Y">` value, attribute order agnostic. */
const meta = (key: 'name' | 'property', value: string): string | null => {
  const re = new RegExp(
    `<meta[^>]*\\b${key}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
    'i'
  )
  const tag = html.match(re)?.[0]
  if (!tag) return null
  return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1] ?? null
}

describe('head share/SEO metadata (#778)', () => {
  describe('title + description', () => {
    it('renders a branded, descriptive <title> (not the old name)', () => {
      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ''
      expect(title).toBe(TITLE)
      // The stale pre-rename title must be gone.
      expect(html).not.toMatch(/Toastmasters District Visualizer/)
    })

    it('declares an accurate, concise meta description', () => {
      const description = meta('name', 'description')
      expect(description).toBe(DESCRIPTION)
      expect(DESCRIPTION.length).toBeGreaterThan(50)
      expect(DESCRIPTION.length).toBeLessThanOrEqual(160)
      expect(DESCRIPTION).toMatch(/Toastmasters/)
      expect(DESCRIPTION).toMatch(/district/i)
    })
  })

  describe('Open Graph', () => {
    it('declares the full Open Graph set', () => {
      // og:/twitter: title + description must stay consistent with the
      // <title>/<meta description> — a copy-edit that updates one tag but
      // not its siblings is exactly the drift this contract test guards.
      expect(meta('property', 'og:title')).toBe(TITLE)
      expect(meta('property', 'og:description')).toBe(DESCRIPTION)
      expect(meta('property', 'og:type')).toBe('website')
      expect(meta('property', 'og:url')).toBe(CANONICAL_URL)
      expect(meta('property', 'og:image')).toBe(OG_IMAGE_URL)
    })

    it('points og:image at an absolute https URL', () => {
      expect(meta('property', 'og:image')).toMatch(/^https:\/\//)
    })
  })

  describe('Twitter Card', () => {
    it('declares a summary_large_image card with title/description/image', () => {
      expect(meta('name', 'twitter:card')).toBe('summary_large_image')
      expect(meta('name', 'twitter:title')).toBe(TITLE)
      expect(meta('name', 'twitter:description')).toBe(DESCRIPTION)
      expect(meta('name', 'twitter:image')).toBe(OG_IMAGE_URL)
    })
  })

  describe('canonical', () => {
    it('declares a canonical link to the production host', () => {
      const canonical = html
        .match(/<link[^>]*\brel=["']canonical["'][^>]*>/i)?.[0]
        ?.match(/\bhref=["']([^"']*)["']/i)?.[1]
      expect(canonical).toBe(CANONICAL_URL)
    })
  })

  describe('static og:image asset (F-SEC4)', () => {
    it('ships og-image.png as a static asset in public/', () => {
      expect(existsSync(resolve(FRONTEND_ROOT, 'public/og-image.png'))).toBe(
        true
      )
    })

    it('declares og:image dimensions for reliable card rendering', () => {
      expect(meta('property', 'og:image:width')).toBe('1200')
      expect(meta('property', 'og:image:height')).toBe('630')
    })
  })
})
