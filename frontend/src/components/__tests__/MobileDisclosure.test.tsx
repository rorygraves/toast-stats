import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'

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

  // #980 — when a urlParam is supplied (mobile only), the open state deep-links.
  describe('URL-synced open state (#980)', () => {
    let location = ''
    const LocationProbe: React.FC = () => {
      location = useLocation().search
      return null
    }
    const renderMobile = (entry: string) => {
      stubViewport(true)
      return render(
        <MemoryRouter initialEntries={[entry]}>
          <MobileDisclosure
            summaryLabel="Longest-serving clubs"
            urlParam="clubsExpanded"
          >
            <p data-testid="payload">contents</p>
          </MobileDisclosure>
          <LocationProbe />
        </MemoryRouter>
      )
    }

    it('opens the disclosure when the URL param is present', () => {
      const { container } = renderMobile('/?clubsExpanded=1')
      expect(container.querySelector('details')?.hasAttribute('open')).toBe(
        true
      )
    })

    it('stays collapsed when the param is absent', () => {
      const { container } = renderMobile('/')
      expect(container.querySelector('details')?.hasAttribute('open')).toBe(
        false
      )
    })

    it('writes the param when the user expands the disclosure', () => {
      const { container } = renderMobile('/')
      const details = container.querySelector('details') as HTMLDetailsElement
      details.open = true
      fireEvent(details, new Event('toggle'))
      expect(new URLSearchParams(location).get('clubsExpanded')).toBe('1')
    })

    it('removes the param when the user collapses the disclosure', () => {
      const { container } = renderMobile('/?clubsExpanded=1')
      const details = container.querySelector('details') as HTMLDetailsElement
      details.open = false
      fireEvent(details, new Event('toggle'))
      expect(new URLSearchParams(location).has('clubsExpanded')).toBe(false)
    })

    it('keeps the desktop view chrome-free even with a urlParam', () => {
      stubViewport(false)
      const { container } = render(
        <MemoryRouter>
          <MobileDisclosure summaryLabel="x" urlParam="clubsExpanded">
            <p data-testid="payload">contents</p>
          </MobileDisclosure>
        </MemoryRouter>
      )
      expect(container.querySelector('details')).toBeNull()
      expect(screen.getByTestId('payload')).toBeInTheDocument()
    })
  })
})
