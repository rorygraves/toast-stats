/* AppShell behavior contract — Epic #352 / Issue #354. */

import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import AppShell from '../../components/AppShell/AppShell'
import { DarkModeProvider } from '../../contexts/DarkModeContext'

const renderShell = (initialPath = '/') => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <div data-testid="page">Home</div> },
          {
            path: 'history',
            element: <div data-testid="page">History</div>,
          },
          {
            path: 'history/:year',
            element: <div data-testid="page">History year</div>,
          },
          {
            path: 'methodology',
            element: <div data-testid="page">Methodology</div>,
          },
        ],
      },
    ],
    { initialEntries: [initialPath] }
  )
  return render(
    <DarkModeProvider>
      <RouterProvider router={router} />
    </DarkModeProvider>
  )
}

describe('AppShell (#354)', () => {
  describe('top bar', () => {
    it('renders the brand mark with "TS" text', () => {
      renderShell()
      const brand = screen.getByLabelText(/toast stats home/i)
      expect(brand).toBeInTheDocument()
      expect(brand).toHaveTextContent('TS')
    })

    it('links the brand mark to the home route', () => {
      renderShell('/history')
      const brand = screen.getByLabelText(/toast stats home/i)
      expect(brand).toHaveAttribute('href', '/')
    })

    it('renders nav links: Districts, History, Methodology', () => {
      renderShell()
      const nav = screen.getByRole('navigation', { name: /primary/i })
      expect(
        within(nav).getByRole('link', { name: 'Districts' })
      ).toHaveAttribute('href', '/')
      expect(within(nav).getByRole('link', { name: 'Awards' })).toHaveAttribute(
        'href',
        '/awards'
      )
      expect(
        within(nav).getByRole('link', { name: 'History' })
      ).toHaveAttribute('href', '/history')
      expect(
        within(nav).getByRole('link', { name: 'Methodology' })
      ).toHaveAttribute('href', '/methodology')
    })

    it('does NOT render Regions or any "soon" stubs (omitted per Epic #352)', () => {
      // Awards was a "soon" stub at #354 launch; #371 enabled the real
      // /awards page and re-included Awards in the primary nav. Regions
      // remains omitted until that page exists.
      renderShell()
      const nav = screen.getByRole('navigation', { name: /primary/i })
      expect(within(nav).queryByText(/regions/i)).not.toBeInTheDocument()
      expect(within(nav).queryByText(/soon/i)).not.toBeInTheDocument()
    })

    it('does NOT render notifications, help, or avatar elements (no auth today)', () => {
      renderShell()
      // Scope to the top bar so a future footer button doesn't trip this.
      const header = screen.getByRole('banner')
      expect(
        within(header).queryByRole('button', { name: /notifications/i })
      ).not.toBeInTheDocument()
      expect(
        within(header).queryByRole('button', { name: /help/i })
      ).not.toBeInTheDocument()
      expect(
        within(header).queryByRole('img', { name: /avatar|profile/i })
      ).not.toBeInTheDocument()
    })

    it('marks the active nav link with aria-current="page"', () => {
      renderShell('/history')
      const nav = screen.getByRole('navigation', { name: /primary/i })
      const historyLink = within(nav).getByRole('link', { name: 'History' })
      expect(historyLink).toHaveAttribute('aria-current', 'page')

      const districtsLink = within(nav).getByRole('link', { name: 'Districts' })
      expect(districtsLink).not.toHaveAttribute('aria-current')
    })

    it('keeps History active on nested routes like /history/:year', () => {
      // Guards against a future flip of NAV_ITEMS.history.end from false→true,
      // which would silently break highlighting on nested archive routes.
      renderShell('/history/2024')
      const nav = screen.getByRole('navigation', { name: /primary/i })
      const historyLink = within(nav).getByRole('link', { name: 'History' })
      expect(historyLink).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('footer', () => {
    it('renders the redesign attribution line', () => {
      renderShell()
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveTextContent(/toast stats/i)
      expect(footer).toHaveTextContent(/ts\.taverns\.red/i)
      expect(footer).toHaveTextContent(/a red taverns production/i)
    })

    it('renders the data source + license + version line', () => {
      renderShell()
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveTextContent(/data:\s*dashboards\.toastmasters\.org/i)
      expect(footer).toHaveTextContent(/mit license/i)
    })

    it('does not double-prefix the version (deploy.yml already passes v<semver>)', () => {
      // Regression guard: VITE_APP_VERSION ships as e.g. 'v2.10.0', so the
      // footer must NOT add another 'v'. The fallback in tests is 'dev', so
      // we assert no 'vdev'/'vv' substring.
      renderShell()
      const footer = screen.getByRole('contentinfo')
      expect(footer.textContent).not.toMatch(/v\s*v/i)
      expect(footer.textContent).not.toMatch(/vdev/i)
    })

    it('preserves the theme toggle for manual dark-mode access', () => {
      renderShell()
      const footer = screen.getByRole('contentinfo')
      // ThemeToggle's aria-label flips with state ("Switch to dark mode" /
      // "Switch to light mode") — match either.
      expect(
        within(footer).getByRole('button', {
          name: /switch to (light|dark) mode/i,
        })
      ).toBeInTheDocument()
    })
  })

  describe('layout structure', () => {
    it('renders the routed page inside an <Outlet />', () => {
      renderShell('/history')
      expect(screen.getByTestId('page')).toHaveTextContent('History')
    })

    it('includes a skip link for keyboard users', () => {
      renderShell()
      const skip = screen.getByRole('link', { name: /skip to main content/i })
      expect(skip).toHaveAttribute('href', '#main-content')
    })

    it('marks the page region with id="main-content" for the skip link target', () => {
      renderShell()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('id', 'main-content')
    })
  })
})
