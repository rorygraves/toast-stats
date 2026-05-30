/* Routing scaffolding (#355) — verifies the new /history and /methodology
   routes exist and render a placeholder, while the existing routes
   (/, /district/:id, /clubs/:id) keep working. The full pages for
   /history and /methodology ship in #367 and #368.

   Moved here from __tests__/components/ (#916, V12): it full-page-mounts
   HistoryPage/MethodologyPage, so by the partition's own convention (page
   mounts → integration) it belongs in the CI-only integration project, not the
   fast pre-push unit gate. The no-page-mounts guard (check-no-page-mounts.mjs)
   enforces this. §4.2 re-confirmation: the deep-dive flagged the
   `toContain('LIVE')` assertion as a possible L110 text-transform blind spot —
   re-checked, "LIVE" is LITERAL JSX in HistoryPage (`· LIVE`), not a
   CSS-uppercased "live", so the assertion is real, not false-confidence. */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import HistoryPage from '../../pages/HistoryPage'
import MethodologyPage from '../../pages/MethodologyPage'

// HistoryPage now fetches per-year summary cards (#892). This routing test
// only asserts the synchronous scaffold (heading, year strip, TI link), so
// stub the data hook to keep it network-free and focused.
vi.mock('../../hooks/useProgramYearSummaries', () => ({
  useProgramYearSummaries: () => ({
    summaries: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
}))

const renderRoute = (Page: React.ComponentType, path: string) => {
  const router = createMemoryRouter([{ path, element: <Page /> }], {
    initialEntries: [path],
  })
  return render(<RouterProvider router={router} />)
}

describe('Routing scaffolding (#355)', () => {
  describe('/history page', () => {
    it('renders a heading naming the page', () => {
      renderRoute(HistoryPage, '/history')
      expect(
        screen.getByRole('heading', { level: 1, name: /program year history/i })
      ).toBeInTheDocument()
    })

    it('renders the year strip with the current PY marked aria-current', () => {
      renderRoute(HistoryPage, '/history')
      // First chip in the year strip (current year) is announced as
      // aria-current=page so screen-reader users can locate it quickly.
      const strip = screen.getByRole('list')
      const items = screen.getAllByRole('listitem')
      expect(strip).toBeInTheDocument()
      const current = items.find(i => i.getAttribute('aria-current') === 'page')
      expect(current).toBeDefined()
      expect(current?.textContent).toContain('LIVE')
    })

    it('points pre-2019 visitors to the official TI archive', () => {
      renderRoute(HistoryPage, '/history')
      const link = screen.getByRole('link', {
        name: /toastmasters international archive/i,
      })
      expect(link).toHaveAttribute(
        'href',
        'https://dashboards.toastmasters.org'
      )
    })
  })

  describe('/methodology page', () => {
    it('renders the page heading', () => {
      renderRoute(MethodologyPage, '/methodology')
      expect(
        screen.getByRole('heading', { level: 1, name: /methodology/i })
      ).toBeInTheDocument()
    })

    it('renders the anchor TOC with all 8 numbered sections', () => {
      renderRoute(MethodologyPage, '/methodology')
      const nav = screen.getByRole('navigation', { name: /on this page/i })
      expect(nav).toBeInTheDocument()
      // Each section should be linked from the TOC and have a matching h2.
      ;[
        'Data source',
        'Refresh cadence',
        'Borda count',
        'DCP tier',
        'Club health',
        'Glossary',
        'Caveats',
        'Changelog',
      ].forEach(title => {
        // TOC link
        expect(
          screen.getByRole('link', { name: new RegExp(title, 'i') })
        ).toBeInTheDocument()
        // Section h2
        expect(
          screen.getByRole('heading', {
            level: 2,
            name: new RegExp(title, 'i'),
          })
        ).toBeInTheDocument()
      })
    })
  })
})
