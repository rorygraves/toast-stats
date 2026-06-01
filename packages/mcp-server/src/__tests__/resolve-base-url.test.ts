import { describe, it, expect } from 'vitest'
import { resolveCdnBaseUrl } from '../server.js'
import { DEFAULT_CDN_BASE_URL } from '../cdn/CdnClient.js'

describe('resolveCdnBaseUrl', () => {
  it('returns the default public CDN origin when CDN_BASE_URL is unset', () => {
    expect(resolveCdnBaseUrl({})).toBe(DEFAULT_CDN_BASE_URL)
  })

  it('returns the CDN_BASE_URL override when set (self-hosting / offline smoke)', () => {
    expect(resolveCdnBaseUrl({ CDN_BASE_URL: 'http://127.0.0.1:8123' })).toBe(
      'http://127.0.0.1:8123'
    )
  })

  it('trims surrounding whitespace from the override', () => {
    expect(
      resolveCdnBaseUrl({ CDN_BASE_URL: '  https://staging.example  ' })
    ).toBe('https://staging.example')
  })

  it('falls back to the default for a blank/whitespace-only override', () => {
    expect(resolveCdnBaseUrl({ CDN_BASE_URL: '   ' })).toBe(
      DEFAULT_CDN_BASE_URL
    )
    expect(resolveCdnBaseUrl({ CDN_BASE_URL: '' })).toBe(DEFAULT_CDN_BASE_URL)
  })

  it('defaults to process.env when called with no argument', () => {
    // Smoke: the zero-arg form reads the ambient environment without throwing.
    expect(typeof resolveCdnBaseUrl()).toBe('string')
  })
})
