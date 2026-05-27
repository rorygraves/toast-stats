/**
 * Per-route document title hook (#780, epic #785, finding F-SA3).
 *
 * A small head manager: pages call useDocumentTitle(segment) to self-title.
 * The branded default (shipped statically in index.html by #778) is the
 * single fallback — passing null/undefined keeps it, and unmounting a titled
 * page restores it so SPA back-navigation to the landing page is correct.
 *
 * document.title stays the single source of truth that useGoogleAnalytics
 * reads for page_view (no new runtime dependency / provider).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useDocumentTitle,
  formatPageTitle,
  DEFAULT_TITLE,
  SITE_NAME,
} from '../useDocumentTitle'

describe('formatPageTitle (#780)', () => {
  it('suffixes a page segment with the site name', () => {
    expect(formatPageTitle('District 93')).toBe('District 93 — Toast Stats')
  })

  it('returns the branded default for an empty/nullish segment', () => {
    expect(formatPageTitle(null)).toBe(DEFAULT_TITLE)
    expect(formatPageTitle(undefined)).toBe(DEFAULT_TITLE)
    expect(formatPageTitle('')).toBe(DEFAULT_TITLE)
  })

  it("the default matches #778's shipped index.html <title> exactly", () => {
    // Drift between this constant and the static title regresses the share
    // card AND the SPA fallback in one move — pin them together.
    expect(DEFAULT_TITLE).toBe(
      'Toast Stats — Toastmasters District Performance'
    )
    expect(SITE_NAME).toBe('Toast Stats')
  })
})

describe('useDocumentTitle (#780)', () => {
  afterEach(() => {
    document.title = DEFAULT_TITLE
  })

  it('sets document.title to the formatted page title on mount', () => {
    renderHook(() => useDocumentTitle('Methodology'))
    expect(document.title).toBe('Methodology — Toast Stats')
  })

  it('restores the branded default when the titled page unmounts', () => {
    const { unmount } = renderHook(() => useDocumentTitle('District 61'))
    expect(document.title).toBe('District 61 — Toast Stats')
    unmount()
    expect(document.title).toBe(DEFAULT_TITLE)
  })

  it('updates the title when the segment changes', () => {
    const { rerender } = renderHook(
      ({ segment }) => useDocumentTitle(segment),
      { initialProps: { segment: 'District 61' } }
    )
    expect(document.title).toBe('District 61 — Toast Stats')
    rerender({ segment: 'District 93' })
    expect(document.title).toBe('District 93 — Toast Stats')
  })

  it('holds the branded default while a segment is still loading (null)', () => {
    renderHook(() => useDocumentTitle(null))
    expect(document.title).toBe(DEFAULT_TITLE)
  })
})
