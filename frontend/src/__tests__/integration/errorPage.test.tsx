/* Branded error boundary (#1011, epic #1010 Sprint 1).
 *
 * Verifies the root `errorElement` replaces React Router's raw developer
 * default ("Unexpected Application Error! 404 Not Found · Hey developer 👋…")
 * for BOTH failure modes:
 *   - an unmatched route (404 ErrorResponse bubbles to the nearest errorElement)
 *   - a child route that throws at render (runtime error)
 * Both render the same branded ErrorPage chrome (testid `error-page`) with
 * distinct, human copy and Home + Back recovery — no framework jargon leaks.
 *
 * Lives in the integration project (not the fast unit gate): it full-mounts a
 * RouterProvider with the real errorElement wiring (R22 spirit — router mounts
 * route off the pre-push unit gate).
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorPage from '../../components/ErrorPage'
import type { DistrictsResponse } from '../../types/districts'

/** A child route that always throws at render — exercises the runtime path. */
function Boom(): React.JSX.Element {
  throw new Error('kaboom from a child route')
}

/**
 * Build a QueryClient with the `['districts']` cache pre-seeded so
 * `useDistricts()` (which ErrorPage now calls for route-aware recovery)
 * resolves synchronously with no network. Pass `undefined` to leave it
 * unseeded (the districts-not-loaded path).
 */
function makeClient(districts?: DistrictsResponse['districts']) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  if (districts) {
    client.setQueryData<DistrictsResponse>(['districts'], { districts })
  }
  return client
}

const D61_DISTRICTS = [
  { id: '61', name: 'District 61' },
  { id: '42', name: 'District 42' },
]

/** Mount a router shaped like App's: root with errorElement, throwing child. */
function renderWithRouter(
  initialPath: string,
  districts: DistrictsResponse['districts'] | undefined = D61_DISTRICTS
) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Outlet />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <div>home</div> },
          { path: 'boom', element: <Boom /> },
        ],
      },
    ],
    { initialEntries: [initialPath] }
  )
  return render(
    <QueryClientProvider client={makeClient(districts)}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('Branded error boundary (#1011)', () => {
  describe('unmatched route (404)', () => {
    it('renders the branded ErrorPage, not React Router default', () => {
      renderWithRouter('/this-route-does-not-exist')
      expect(screen.getByTestId('error-page')).toBeInTheDocument()
      // RR's raw default leaks this exact phrase — it must be unreachable.
      expect(
        screen.queryByText(/Unexpected Application Error/i)
      ).not.toBeInTheDocument()
    })

    it('shows 404-variant human copy (no framework jargon)', () => {
      renderWithRouter('/this-route-does-not-exist')
      const page = screen.getByTestId('error-page')
      expect(page).toHaveAttribute('data-error-variant', 'not-found')
      // Human, not "errorElement" / "Hey developer".
      expect(page.textContent).not.toMatch(/errorElement|Hey developer/i)
      expect(
        screen.getByRole('heading', { name: /page not found/i })
      ).toBeInTheDocument()
    })
  })

  describe('thrown runtime error', () => {
    it('renders the same branded ErrorPage with error-variant copy', () => {
      renderWithRouter('/boom')
      const page = screen.getByTestId('error-page')
      expect(page).toBeInTheDocument()
      expect(page).toHaveAttribute('data-error-variant', 'error')
      expect(
        screen.queryByText(/Unexpected Application Error/i)
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: /something went wrong/i })
      ).toBeInTheDocument()
    })

    it('does not leak the raw error message as page chrome jargon', () => {
      renderWithRouter('/boom')
      const page = screen.getByTestId('error-page')
      expect(page.textContent).not.toMatch(/errorElement|Hey developer/i)
    })
  })

  describe('error thrown by the root element itself', () => {
    // In App the root route's element is <AppShell />; the errorElement
    // replaces it when AppShell (or anything in its slot) throws. This proves
    // the boundary still renders standalone — the chrome is not re-mounted.
    it('replaces the root element with the branded page', () => {
      const router = createMemoryRouter(
        [{ path: '/', element: <Boom />, errorElement: <ErrorPage /> }],
        { initialEntries: ['/'] }
      )
      render(
        <QueryClientProvider client={makeClient(D61_DISTRICTS)}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      )
      const page = screen.getByTestId('error-page')
      expect(page).toHaveAttribute('data-error-variant', 'error')
      expect(
        screen.getByRole('heading', { name: /something went wrong/i })
      ).toBeInTheDocument()
    })
  })

  describe('recovery affordances (both variants)', () => {
    it('offers a Home link to the landing page', () => {
      renderWithRouter('/this-route-does-not-exist')
      const home = screen.getByRole('link', { name: /home|go home|landing/i })
      expect(home).toHaveAttribute('href', '/')
    })

    it('offers a Back action', () => {
      renderWithRouter('/boom')
      expect(
        screen.getByRole('button', { name: /back|go back/i })
      ).toBeInTheDocument()
    })

    it('announces the error to assistive tech (role=alert)', () => {
      renderWithRouter('/this-route-does-not-exist')
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  // Route-aware smart recovery (#1012, Sprint 2). A malformed /district/:id URL
  // is a 404; the page detects the bad path (via useLocation) and the valid
  // district set (via useDistricts) and offers contextual destinations.
  describe('route-aware smart recovery (#1012)', () => {
    it('suggests the district subpages for a malformed /district/:id (valid id)', () => {
      renderWithRouter('/district/61/dude')
      const region = screen.getByTestId('error-page-suggestions')
      // Every suggested link is a REAL subpage of the valid district 61.
      const overview = within(region).getByRole('link', { name: /overview/i })
      expect(overview).toHaveAttribute('href', '/district/61')
      const clubs = within(region).getByRole('link', { name: /clubs/i })
      expect(clubs).toHaveAttribute('href', '/district/61/clubs')
    })

    it('suggests the districts index for an unknown district id', () => {
      renderWithRouter('/district/zzz/whatever')
      const region = screen.getByTestId('error-page-suggestions')
      const all = within(region).getByRole('link', { name: /all districts/i })
      expect(all).toHaveAttribute('href', '/')
      // No district-subpage links for an id we can't resolve.
      expect(
        within(region).queryByRole('link', { name: /clubs/i })
      ).not.toBeInTheDocument()
    })

    it('falls back to the districts index when districts have not loaded', () => {
      renderWithRouter('/district/61/dude', undefined)
      const region = screen.getByTestId('error-page-suggestions')
      expect(
        within(region).getByRole('link', { name: /all districts/i })
      ).toHaveAttribute('href', '/')
    })

    it('shows NO suggestion region for a runtime error (only Home + Back)', () => {
      renderWithRouter('/boom')
      expect(screen.getByTestId('error-page')).toBeInTheDocument()
      expect(
        screen.queryByTestId('error-page-suggestions')
      ).not.toBeInTheDocument()
    })

    it('shows NO suggestion region for a non-district 404', () => {
      renderWithRouter('/totally/unknown')
      expect(
        screen.queryByTestId('error-page-suggestions')
      ).not.toBeInTheDocument()
    })
  })
})
