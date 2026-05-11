import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'
import { beforeEach, vi } from 'vitest'

// Import brand CSS to make design tokens available in tests
import '../styles/brand.css'

// Mock ResizeObserver for Recharts components
const ResizeObserverMock = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

// Mock IntersectionObserver
const IntersectionObserverMock = class IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  private callback: globalThis.IntersectionObserverCallback

  constructor(callback: globalThis.IntersectionObserverCallback) {
    this.callback = callback
  }
  observe(target: Element): void {
    if (this.callback) {
      this.callback(
        [
          {
            isIntersecting: true,
            target,
          } as unknown as IntersectionObserverEntry,
        ],
        this
      )
    }
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
// Setup IntersectionObserver mock aggressively across all possible global contexts
global.IntersectionObserver = IntersectionObserverMock
;(window as unknown as Record<string, unknown>).IntersectionObserver =
  IntersectionObserverMock
;(globalThis as unknown as Record<string, unknown>).IntersectionObserver =
  IntersectionObserverMock
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const store: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(k => delete store[k])
    }),
  },
})

// Clear localStorage between every test so persisted state from one test
// (e.g. selectedRegions, my-district-id, sortBy) does not leak into the
// next. Required after #416 (filter persistence) wired filter state to
// localStorage on the Districts page.
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
})
