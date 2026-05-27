import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Contract test for #783 — Firebase Hosting security headers + CSP.
 *
 * A public marketing surface should emit a Content-Security-Policy plus the
 * standard hardening headers. This test pins the contract on BOTH hosting
 * targets (production AND staging) — staging matters because per-PR preview
 * channels inherit the staging site's hosting config, so the CSP must allow
 * the staging CDN bucket or previews go data-blank (cf. Lesson 093: the GCS
 * staging bucket is the preview channels' data source).
 *
 * Pure-text/JSON assertions, no runtime: firebase.json is strict JSON.
 */

const ROOT = join(__dirname, '..', '..', '..')

interface HeaderKV {
  key: string
  value: string
}
interface HeaderRule {
  source: string
  headers: HeaderKV[]
}
interface HostingTarget {
  target: string
  headers?: HeaderRule[]
}

function loadHosting(): HostingTarget[] {
  const raw = readFileSync(join(ROOT, 'firebase.json'), 'utf8')
  return JSON.parse(raw).hosting as HostingTarget[]
}

/** The catch-all (`source: "**"`) header rule for a named target. */
function catchAllHeaders(targetName: string): HeaderKV[] {
  const target = loadHosting().find(t => t.target === targetName)
  expect(target, `hosting target "${targetName}" must exist`).toBeDefined()
  const rule = target!.headers?.find(r => r.source === '**')
  expect(
    rule,
    `target "${targetName}" must have a catch-all (source "**") header rule`
  ).toBeDefined()
  return rule!.headers
}

function headerValue(headers: HeaderKV[], key: string): string | undefined {
  return headers.find(h => h.key.toLowerCase() === key.toLowerCase())?.value
}

describe('firebase.json security headers (#783)', () => {
  for (const targetName of ['production', 'staging']) {
    describe(`target: ${targetName}`, () => {
      const headers = () => catchAllHeaders(targetName)

      it('sets X-Content-Type-Options: nosniff', () => {
        expect(headerValue(headers(), 'X-Content-Type-Options')).toBe('nosniff')
      })

      it('sets a Referrer-Policy', () => {
        expect(headerValue(headers(), 'Referrer-Policy')).toBe(
          'strict-origin-when-cross-origin'
        )
      })

      it('denies framing (X-Frame-Options)', () => {
        expect(headerValue(headers(), 'X-Frame-Options')).toBe('DENY')
      })

      it('sets a restrictive Permissions-Policy', () => {
        const pp = headerValue(headers(), 'Permissions-Policy')
        expect(pp, 'Permissions-Policy must be present').toBeDefined()
        // Powerful features the app does not use are denied.
        expect(pp).toMatch(/camera=\(\)/)
        expect(pp).toMatch(/microphone=\(\)/)
        expect(pp).toMatch(/geolocation=\(\)/)
      })

      describe('Content-Security-Policy', () => {
        const csp = () => {
          const v = headerValue(headers(), 'Content-Security-Policy')
          expect(v, 'CSP header must be present').toBeDefined()
          return v!
        }

        it('defaults to self', () => {
          expect(csp()).toMatch(/default-src 'self'/)
        })

        it('blocks plugins and base-tag/frame hijacking', () => {
          expect(csp()).toMatch(/object-src 'none'/)
          expect(csp()).toMatch(/base-uri 'self'/)
          expect(csp()).toMatch(/frame-ancestors 'none'/)
        })

        it('allows Google Fonts (stylesheet + woff2)', () => {
          expect(csp()).toMatch(
            /style-src[^;]*https:\/\/fonts\.googleapis\.com/
          )
          expect(csp()).toMatch(/font-src[^;]*https:\/\/fonts\.gstatic\.com/)
        })

        it('allows BOTH CDN origins in connect-src (staging GCS + prod)', () => {
          // Lesson 093: previews read the staging GCS bucket; prod reads
          // cdn.taverns.red. Dropping either silently breaks data fetches.
          expect(csp()).toMatch(
            /connect-src[^;]*https:\/\/storage\.googleapis\.com/
          )
          expect(csp()).toMatch(/connect-src[^;]*https:\/\/cdn\.taverns\.red/)
        })

        it('allows Google Analytics origins', () => {
          // GA4 loads only on the prod hostname, but the policy must permit
          // it there: tag-manager script + analytics beacons.
          expect(csp()).toMatch(
            /script-src[^;]*https:\/\/www\.googletagmanager\.com/
          )
          expect(csp()).toMatch(
            /connect-src[^;]*https:\/\/www\.google-analytics\.com/
          )
        })
      })
    })
  }
})
