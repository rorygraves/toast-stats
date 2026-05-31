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
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom'
import ErrorPage from '../../components/ErrorPage'

/** A child route that always throws at render — exercises the runtime path. */
function Boom(): React.JSX.Element {
  throw new Error('kaboom from a child route')
}

/** Mount a router shaped like App's: root with errorElement, throwing child. */
function renderWithRouter(initialPath: string) {
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
  return render(<RouterProvider router={router} />)
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
      render(<RouterProvider router={router} />)
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
})
