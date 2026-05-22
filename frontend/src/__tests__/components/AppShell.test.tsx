/* AppShell behavior contract — Epic #352 / Issue #354. */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppShell from '../../components/AppShell/AppShell'
import { DarkModeProvider } from '../../contexts/DarkModeContext'

// Mock the CDN service the CommandPalette (#422) lazy-fetches when the
// shell mounts — keeps these tests isolated from the network layer.
vi.mock('../../services/cdn', () => ({
  fetchCdnRankings: vi.fn().mockResolvedValue({ rankings: [], date: '' }),
}))

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
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <DarkModeProvider>
        <RouterProvider router={router} />
      </DarkModeProvider>
    </QueryClientProvider>
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

    it('renders nav links: Districts, History, How it works (#412)', () => {
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
        within(nav).getByRole('link', { name: 'How it works' })
      ).toHaveAttribute('href', '/methodology')
    })

    it('renders Regions as an enabled nav link to /regions (#497)', () => {
      // /regions overview shipped in epic #492; the previous "soon"
      // stub is retired. Link must be a real router link with no
      // aria-disabled / --soon styling.
      renderShell()
      const nav = screen.getByRole('navigation', { name: /primary/i })
      const regionsLink = within(nav).getByRole('link', { name: /regions/i })
      expect(regionsLink).toHaveAttribute('href', '/regions')
      expect(regionsLink).not.toHaveAttribute('aria-disabled')
      expect(regionsLink).not.toHaveClass('app-shell-nav__link--soon')
    })

    it('renders the top-bar tools cluster (help link, avatar)', () => {
      // Bell stub was removed in #411 — a non-functional icon erodes
      // trust. The help icon is a Link to /methodology (#410); the
      // avatar remains a visual stub until auth lands.
      renderShell()
      const header = screen.getByRole('banner')
      expect(
        within(header).queryByRole('button', { name: /notifications/i })
      ).not.toBeInTheDocument()
      // The text 'How it works' appears twice in the header — as the
      // primary nav link AND as the help icon's aria-label. Scope the
      // help icon assertion to the tools cluster (everything outside the
      // primary nav).
      const tools = header.querySelector('.app-shell-tools') as HTMLElement
      expect(tools).toBeInTheDocument()
      const helpLink = within(tools).getByRole('link', {
        name: /how it works/i,
      })
      expect(helpLink).toHaveAttribute('href', '/methodology')
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

    it('does not render the theme toggle in the footer (#565 moved it to the header)', () => {
      renderShell()
      const footer = screen.getByRole('contentinfo')
      // ThemeToggle moved to AppShellTopBar in #565. The header-placement
      // contract is covered by AppShell.layout.test.tsx.
      expect(
        within(footer).queryByRole('button', {
          name: /switch to (light|dark) mode/i,
        })
      ).not.toBeInTheDocument()
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
