import React, { useEffect, useRef } from 'react'
import {
  Link,
  useNavigate,
  useRouteError,
  isRouteErrorResponse,
} from 'react-router-dom'
import { logger } from '../utils/logger'

/**
 * Root `errorElement` for the router (#1011, epic #1010 Sprint 1).
 *
 * Replaces React Router's raw developer default ("Unexpected Application
 * Error! … Hey developer 👋 You can provide a way better UX…") with a calm,
 * branded page for the two failure modes that bubble to the root route:
 *   - an unmatched route → a 404 `ErrorResponse` (no route matched)
 *   - any child route that throws at render → a runtime error
 *
 * `useRouteError()` + `isRouteErrorResponse()` distinguish the two: a 404 gets
 * "page not found" copy, anything else gets "something went wrong". Both share
 * the same chrome and the same Home + Back recovery. It renders standalone
 * (the errorElement replaces `AppShell`, so the shell — which could itself be
 * what threw — is not re-mounted); the dark-mode-aware tokens + `redesign-panel`
 * surface give it the product look without rebuilding the nav.
 *
 * Route-aware smart recovery for malformed `/district/:id` is Sprint 2 (#1012).
 */
const ErrorPage: React.FC = () => {
  const error = useRouteError()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const is404 = isRouteErrorResponse(error) && error.status === 404
  const variant = is404 ? 'not-found' : 'error'

  // Log genuine runtime errors for telemetry; a 404 is expected user navigation
  // (mistyped URL / dead link), not an error worth recording.
  useEffect(() => {
    if (!is404) {
      logger.error('Route error boundary caught:', error)
    }
  }, [error, is404])

  // Move focus to the heading on mount so screen-reader and keyboard users land
  // on the error context immediately rather than at the top of a replaced tree.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const heading = is404 ? 'Page not found' : 'Something went wrong'
  const message = is404
    ? "We couldn't find the page you're looking for. It may have moved, or the link you followed may be broken."
    : 'An unexpected error stopped this page from loading. You can go back to the previous page, or head home and start again.'

  // Surface technical detail only in development — never leak a stack trace or
  // framework internals to real users in production.
  const detail = import.meta.env.DEV
    ? isRouteErrorResponse(error)
      ? `${error.status} ${error.statusText}`
      : error instanceof Error
        ? error.message
        : null
    : null

  return (
    <div
      className="error-page"
      data-testid="error-page"
      data-error-variant={variant}
    >
      <div className="error-page__panel redesign-panel">
        {/* role=alert announces the error context on mount; scope it to the
            message region so the recovery buttons below aren't read as part of
            the live region (they're separately focusable affordances). */}
        <div role="alert">
          <div className="error-page__badge" aria-hidden="true">
            {is404 ? (
              <span className="error-page__code">404</span>
            ) : (
              <svg
                className="error-page__glyph"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>

          <h1 ref={headingRef} tabIndex={-1} className="error-page__heading">
            {heading}
          </h1>

          <p className="error-page__message">{message}</p>

          {detail && (
            <p className="error-page__detail" data-testid="error-page-detail">
              {detail}
            </p>
          )}
        </div>

        <div className="error-page__actions">
          <Link to="/" className="tm-btn-primary error-page__action">
            Go home
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="tm-btn-secondary error-page__action"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
