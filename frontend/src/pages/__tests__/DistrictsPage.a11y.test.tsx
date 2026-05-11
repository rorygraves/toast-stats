import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { expect, it, describe, vi } from 'vitest'
import DistrictsPage from '../DistrictsPage'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProgramYearProvider } from '../../contexts/ProgramYearContext'

// Full-page axe scan: mounting DistrictsPage + walking every node for
// WCAG violations is the test's scope. Under coverage worker contention
// this routinely runs 6-8s. 15s ceiling recognises that category —
// same honest categorization as the journey tests (#473).
vi.setConfig({ testTimeout: 15000 })

expect.extend(toHaveNoViolations)

const queryClient = new QueryClient()

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
})

describe('DistrictsPage Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProgramYearProvider>
          <MemoryRouter>
            <DistrictsPage />
          </MemoryRouter>
        </ProgramYearProvider>
      </QueryClientProvider>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
