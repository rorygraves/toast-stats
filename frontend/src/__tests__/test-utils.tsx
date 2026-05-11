import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

import { ProgramYearProvider } from '../contexts/ProgramYearContext'

// Ensure a minimal localStorage is available in the test environment
// Some test setups (or JSDOM versions) may not provide a working localStorage
const globalObj = globalThis as Record<string, unknown>
if (
  typeof globalObj.localStorage === 'undefined' ||
  typeof (globalObj.localStorage as { getItem?: unknown }).getItem !==
    'function'
) {
  const store: Record<string, string> = {}
  globalObj.localStorage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k]
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
  }
}

// Ensure sessionStorage is available in the test environment
if (
  typeof globalObj.sessionStorage === 'undefined' ||
  typeof (globalObj.sessionStorage as { getItem?: unknown }).getItem !==
    'function'
) {
  const store: Record<string, string> = {}
  globalObj.sessionStorage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k]
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
  }
}

interface RenderOptions {
  initialEntries?: string[]
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { initialEntries = ['/'] }: RenderOptions = {}
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  // MemoryRouter is materially lighter than createMemoryRouter +
  // RouterProvider (no data-router setup, no loaders, no boundary
  // transitions). The 20+ test files that mount full pages don't need
  // any data-router features — they just need a router context for
  // useNavigate / useLocation / useSearchParams (#473).
  return render(
    <QueryClientProvider client={queryClient}>
      <ProgramYearProvider>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </ProgramYearProvider>
    </QueryClientProvider>
  )
}

export default renderWithProviders
