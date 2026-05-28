import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { MobileDisclosure } from '../MobileDisclosure'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Stub matchMedia so useIsMobile(768) resolves to the given viewport. */
const stubViewport = (mobile: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: mobile,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

describe('MobileDisclosure (#867)', () => {
  it('renders children directly with no disclosure chrome on desktop', () => {
    stubViewport(false)
    const { container } = render(
      <MobileDisclosure summaryLabel="Milestones · PY 25–26">
        <p data-testid="payload">contents</p>
      </MobileDisclosure>
    )

    // Desktop must be byte-for-byte the bare children — no <details>/<summary>.
    expect(container.querySelector('details')).toBeNull()
    expect(container.querySelector('summary')).toBeNull()
    expect(screen.getByTestId('payload')).toBeInTheDocument()
  })

  it('folds children behind a collapsed-by-default disclosure on mobile', () => {
    stubViewport(true)
    const { container } = render(
      <MobileDisclosure summaryLabel="Longest-serving clubs">
        <p data-testid="payload">contents</p>
      </MobileDisclosure>
    )

    const details = container.querySelector('details')
    expect(details).not.toBeNull()
    // Collapsed by default — the whole point of the fold.
    expect(details?.hasAttribute('open')).toBe(false)
    // The summary carries the label so the user knows what they're expanding.
    expect(
      screen.getByText('Longest-serving clubs').tagName.toLowerCase()
    ).toBe('summary')
    // Children stay mounted (native <details> keeps content in the DOM).
    expect(screen.getByTestId('payload')).toBeInTheDocument()
  })

  it('honors a custom breakpoint', () => {
    // 1024px viewport is "mobile" relative to a 1280 breakpoint.
    stubViewport(true)
    const { container } = render(
      <MobileDisclosure summaryLabel="Wide fold" breakpoint={1280}>
        <span>x</span>
      </MobileDisclosure>
    )
    expect(container.querySelector('details')).not.toBeNull()
  })
})
