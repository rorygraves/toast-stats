/* Per-route document titles for the static content pages (#780, epic #785).
   Methodology and History have no async data, so their title is deterministic
   on mount — the simplest end of the per-route title contract (F-SA3). */

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MethodologyPage from '../MethodologyPage'
import HistoryPage from '../HistoryPage'

afterEach(() => cleanup())

describe('static page document titles (#780)', () => {
  it('titles the Methodology page', async () => {
    render(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>
    )
    await waitFor(() =>
      expect(document.title).toBe('Methodology — Toast Stats')
    )
  })

  it('titles the History page', async () => {
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    )
    await waitFor(() =>
      expect(document.title).toBe('Program Year History — Toast Stats')
    )
  })
})
