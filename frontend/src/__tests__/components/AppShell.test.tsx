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

    it('renders Regions as a disabled "soon" stub per design parity', () => {
      // Design (screenshots/01-districts.png) shows Regions in the primary
      // nav with a soon badge. Awards shipped (#371) so it is a real link.
      renderShell()
      const nav = screen.getByRole('navigation', { name: /primary/i })
      const regionsLink = within(nav).getByRole('link', { name: /regions/i })
      expect(regionsLink).toHaveClass('app-shell-nav__link--soon')
      expect(regionsLink).toHaveAttribute('aria-disabled', 'true')
    })

    it('renders the top-bar tools cluster (notifications, help, avatar)', () => {
      // Design shows a bell + ? + JS avatar on the right side of the
      // top bar. They are visual stubs until auth lands.
      renderShell()
      const header = screen.getByRole('banner')
      expect(
        within(header).getByRole('button', { name: /notifications/i })
      ).toBeInTheDocument()
      expect(
        within(header).getByRole('button', { name: /help/i })
      ).toBeInTheDocument()
      expect(within(header).getByLabelText(/account/i)).toBeInTheDocument()
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

    it('renders a non-empty version (no double-v, no bare-v)', () => {
      // Three regression guards:
      //   1. No 'vv' — VITE_APP_VERSION ships pre-prefixed with 'v', so
      //      the JSX must not add another 'v'.
      //   2. No 'vdev' — same shape mistake when the env var is missing.
      //   3. No bare 'v' followed by no number — happened on prod when
      //      deploy.yml's `node -p 'require(\"./package.json\")...'` quoting
      //      silently failed and $() resolved to empty, leaving
      //      VITE_APP_VERSION="v". Fix: deploy.yml now uses jq.
      renderShell()
      const footer = screen.getByRole('contentinfo')
      const text = footer.textContent ?? ''
      expect(text).not.toMatch(/v\s*v/i)
      expect(text).not.toMatch(/vdev/i)
      // The version slot must end with either a digit-bearing version
      // (matched after MIT License) OR the literal 'dev' fallback.
      expect(text).toMatch(/MIT License\s*·\s*(?:v\d|dev)/i)
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
