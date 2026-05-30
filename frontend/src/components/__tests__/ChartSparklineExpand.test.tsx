import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { ChartSparklineExpand } from '../ChartSparklineExpand'

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

const renderWrapper = () =>
  render(
    <ChartSparklineExpand
      title="Membership trend"
      sparklineData={[1, 3, 2, 5]}
      headline={<span data-testid="headline">1,234 members</span>}
    >
      <div data-testid="desktop-chart">desktop chart</div>
    </ChartSparklineExpand>
  )

describe('ChartSparklineExpand', () => {
  it('on desktop renders the chart directly with no sparkline trigger', () => {
    stubViewport(false)
    renderWrapper()
    expect(screen.getByTestId('desktop-chart')).toBeTruthy()
    expect(screen.queryByTestId('headline')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(document.querySelector('svg')).toBeNull()
  })

  it('on mobile renders headline + sparkline behind a trigger, chart hidden until tapped', () => {
    stubViewport(true)
    renderWrapper()
    // collapsed state: headline visible, sparkline svg present, chart not yet
    expect(screen.getByTestId('headline')).toBeTruthy()
    expect(document.querySelector('svg')).not.toBeNull()
    expect(screen.queryByTestId('desktop-chart')).toBeNull()
    // a single trigger control to expand
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('on mobile, tapping the trigger opens the full-screen sheet with the chart', () => {
    stubViewport(true)
    renderWrapper()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByTestId('desktop-chart')).toBeTruthy()
  })

  it('does not gate the collapsed view on scroll/IntersectionObserver (Lesson 113)', () => {
    // No IntersectionObserver involvement: the sparkline must be present
    // immediately on mobile mount, not after an intersection callback.
    stubViewport(true)
    renderWrapper()
    expect(document.querySelector('svg')).not.toBeNull()
  })

  // #980 — when a urlId is supplied, the open sheet deep-links via
  // ?chartExpanded=<urlId>. The param holds WHICH chart is open (the sheet is
  // mutually exclusive), so two charts on one page each get a distinct id.
  describe('URL-synced expand state (#980)', () => {
    let location = ''
    const LocationProbe: React.FC = () => {
      location = useLocation().search
      return null
    }
    const renderMobile = (entry: string, urlId = 'membership') => {
      stubViewport(true)
      return render(
        <MemoryRouter initialEntries={[entry]}>
          <ChartSparklineExpand
            title="Membership trend"
            sparklineData={[1, 3, 2, 5]}
            headline={<span data-testid="headline">1,234 members</span>}
            urlId={urlId}
          >
            <div data-testid="desktop-chart">desktop chart</div>
          </ChartSparklineExpand>
          <LocationProbe />
        </MemoryRouter>
      )
    }

    it('opens the sheet on mount when ?chartExpanded matches the urlId', () => {
      renderMobile('/?chartExpanded=membership')
      expect(screen.getByRole('dialog')).toBeTruthy()
    })

    it('stays collapsed when ?chartExpanded is a different chart id', () => {
      renderMobile('/?chartExpanded=payments')
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('stays collapsed when the param is absent', () => {
      renderMobile('/')
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('writes ?chartExpanded=<urlId> when the trigger is tapped', () => {
      renderMobile('/')
      fireEvent.click(screen.getByRole('button'))
      expect(new URLSearchParams(location).get('chartExpanded')).toBe(
        'membership'
      )
    })

    it('clears the param when the sheet is closed', () => {
      renderMobile('/?chartExpanded=membership')
      fireEvent.click(screen.getByRole('button', { name: /Close chart/i }))
      expect(new URLSearchParams(location).has('chartExpanded')).toBe(false)
    })

    it('two charts on one page are mutually exclusive', () => {
      stubViewport(true)
      render(
        <MemoryRouter initialEntries={['/?chartExpanded=membership']}>
          <ChartSparklineExpand
            title="Membership trend"
            sparklineData={[1, 2]}
            headline={<span>m</span>}
            urlId="membership"
          >
            <div data-testid="chart-membership">membership chart</div>
          </ChartSparklineExpand>
          <ChartSparklineExpand
            title="Payments trend"
            sparklineData={[3, 4]}
            headline={<span>p</span>}
            urlId="payments"
          >
            <div data-testid="chart-payments">payments chart</div>
          </ChartSparklineExpand>
        </MemoryRouter>
      )
      // Only the membership sheet is open.
      expect(screen.getByTestId('chart-membership')).toBeTruthy()
      expect(screen.queryByTestId('chart-payments')).toBeNull()
    })
  })
})
