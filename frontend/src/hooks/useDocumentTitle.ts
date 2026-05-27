import { useEffect } from 'react'

/**
 * Per-route document titles (#780, epic #785, finding F-SA3).
 *
 * A deliberately small head manager — no `react-helmet-async` dependency or
 * provider. The app already manages `document.title` imperatively, and
 * `useGoogleAnalytics` reads it as the single source for the `page_view`
 * title; a hook keeps that contract intact while letting each route self-title
 * for share/deep-link value.
 */

/** Short product name, used as the title suffix on sub-pages. */
export const SITE_NAME = 'Toast Stats'

/**
 * The branded default shipped statically in `index.html` (#778). Sub-pages
 * fall back to this, and a titled page restores it on unmount so SPA
 * back-navigation to the landing page shows the right title. Kept in lockstep
 * with the static `<title>` by the `head-metadata` and `useDocumentTitle`
 * tests — drift regresses both the share card and the fallback.
 */
export const DEFAULT_TITLE = 'Toast Stats — Toastmasters District Performance'

/**
 * Format a page title from its distinguishing segment. A nullish/empty segment
 * (e.g. a route whose data is still loading) yields the branded default rather
 * than a bare " — Toast Stats".
 */
export function formatPageTitle(segment?: string | null): string {
  return segment ? `${segment} — ${SITE_NAME}` : DEFAULT_TITLE
}

/**
 * Set `document.title` to `formatPageTitle(segment)` while mounted, restoring
 * the branded default on unmount. Pass `null`/`undefined` to hold the default
 * (the loading state) without emitting an empty-segment title.
 */
export function useDocumentTitle(segment?: string | null): void {
  useEffect(() => {
    document.title = formatPageTitle(segment)
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [segment])
}
