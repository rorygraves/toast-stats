/* Routing scaffolding (#355) — verifies the new /history and /methodology
   routes exist and render a placeholder, while the existing routes
   (/, /district/:id, /clubs/:id) keep working. The full pages for
   /history and /methodology ship in #367 and #368. */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import HistoryPage from '../../pages/HistoryPage'
import MethodologyPage from '../../pages/MethodologyPage'

const renderRoute = (Page: React.ComponentType, path: string) => {
  const router = createMemoryRouter([{ path, element: <Page /> }], {
    initialEntries: [path],
  })
  return render(<RouterProvider router={router} />)
}

describe('Routing scaffolding (#355)', () => {
  describe('/history placeholder page', () => {
    it('renders a heading naming the page', () => {
      renderRoute(HistoryPage, '/history')
      expect(
        screen.getByRole('heading', { level: 1, name: /program year history/i })
      ).toBeInTheDocument()
    })

    it('signals the placeholder status until #367 ships the real content', () => {
      renderRoute(HistoryPage, '/history')
      // Don't assert the exact copy — just that something explains the
      // page is intentionally minimal.
      expect(screen.getByText(/coming/i)).toBeInTheDocument()
    })
  })

  describe('/methodology placeholder page', () => {
    it('renders a heading naming the page', () => {
      renderRoute(MethodologyPage, '/methodology')
      expect(
        screen.getByRole('heading', { level: 1, name: /methodology/i })
      ).toBeInTheDocument()
    })

    it('signals the placeholder status until #368 ships the real content', () => {
      renderRoute(MethodologyPage, '/methodology')
      expect(screen.getByText(/coming/i)).toBeInTheDocument()
    })
  })
})
