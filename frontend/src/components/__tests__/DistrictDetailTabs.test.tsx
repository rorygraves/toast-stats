/* District detail tab bar (#359). Mounts the small extracted component
   directly — no full-page render — so the suite stays under the 5s
   testTimeout cap when --coverage is enabled (Lesson 51). */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { DistrictDetailTabs, type DistrictTabId } from '../DistrictDetailTabs'

const renderTabs = (
  overrides: Partial<React.ComponentProps<typeof DistrictDetailTabs>> = {}
) =>
  render(
    <DistrictDetailTabs
      activeTab="overview"
      onTabChange={() => {}}
      clubsCount={305}
      divisionsCount={7}
      {...overrides}
    />
  )

describe('DistrictDetailTabs (#359)', () => {
  describe('structure', () => {
    it('renders all 6 tabs in order', () => {
      renderTabs()
      const tablist = screen.getByRole('tablist', {
        name: /district analysis tabs/i,
      })
      const tabs = within(tablist).getAllByRole('tab')
      // Tabs render label + (optional) count badge as siblings; textContent
      // concatenates them without whitespace.
      expect(tabs.map(t => t.textContent?.trim())).toEqual([
        'Overview',
        'Clubs305',
        'Divisions & Areas7',
        'Trends',
        'Analytics',
        'Global Rankings',
      ])
    })

    it('marks the active tab with aria-selected="true" and others false', () => {
      renderTabs({ activeTab: 'trends' })
      const tablist = screen.getByRole('tablist')
      const trends = within(tablist).getByRole('tab', { name: /trends/i })
      expect(trends).toHaveAttribute('aria-selected', 'true')

      const overview = within(tablist).getByRole('tab', {
        name: /overview/i,
      })
      expect(overview).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('count badges', () => {
    it('shows the clubs count next to the Clubs tab', () => {
      renderTabs({ clubsCount: 305 })
      const tablist = screen.getByRole('tablist')
      const clubs = within(tablist).getByRole('tab', { name: /^clubs/i })
      expect(within(clubs).getByText('305')).toBeInTheDocument()
    })

    it('shows the divisions count next to the Divisions & Areas tab', () => {
      renderTabs({ divisionsCount: 7 })
      const tablist = screen.getByRole('tablist')
      const divs = within(tablist).getByRole('tab', { name: /divisions/i })
      expect(within(divs).getByText('7')).toBeInTheDocument()
    })

    it('hides count badges when count is 0 or undefined', () => {
      renderTabs({ clubsCount: 0, divisionsCount: undefined })
      const tablist = screen.getByRole('tablist')
      const clubs = within(tablist).getByRole('tab', { name: /^clubs/i })
      expect(within(clubs).queryByText('0')).not.toBeInTheDocument()
      const divs = within(tablist).getByRole('tab', { name: /divisions/i })
      // No number child element should be present
      expect(divs.querySelector('.district-detail-tabs__count')).toBeNull()
    })
  })

  describe('interaction', () => {
    it('fires onTabChange with the tab id when a non-active tab is clicked', () => {
      const onTabChange = vi.fn()
      renderTabs({ activeTab: 'overview', onTabChange })
      const tablist = screen.getByRole('tablist')
      fireEvent.click(within(tablist).getByRole('tab', { name: /^clubs/i }))
      expect(onTabChange).toHaveBeenCalledWith('clubs' satisfies DistrictTabId)
    })

    it('does not fire onTabChange when the already-active tab is clicked', () => {
      const onTabChange = vi.fn()
      renderTabs({ activeTab: 'overview', onTabChange })
      const tablist = screen.getByRole('tablist')
      fireEvent.click(within(tablist).getByRole('tab', { name: /overview/i }))
      expect(onTabChange).not.toHaveBeenCalled()
    })
  })

  describe('keyboard navigation (#384)', () => {
    // WAI-ARIA tabs pattern: roving tabIndex, arrow keys move focus,
    // Home/End jump, Space/Enter activate. Focus moves manually because
    // tab content is heavy.
    it('puts the active tab at tabIndex=0 and others at tabIndex=-1', () => {
      renderTabs({ activeTab: 'clubs' })
      const tablist = screen.getByRole('tablist')
      const tabs = within(tablist).getAllByRole('tab')
      tabs.forEach(t => {
        const expected = t.getAttribute('aria-selected') === 'true' ? '0' : '-1'
        expect(t).toHaveAttribute('tabindex', expected)
      })
    })

    it('ArrowRight moves focus to the next tab (with wrap)', () => {
      renderTabs({ activeTab: 'overview' })
      const tablist = screen.getByRole('tablist')
      const tabs = within(tablist).getAllByRole('tab')
      tabs[0].focus()
      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
      expect(tabs[1]).toHaveFocus()
      // wrap at end
      tabs[5].focus()
      fireEvent.keyDown(tabs[5], { key: 'ArrowRight' })
      expect(tabs[0]).toHaveFocus()
    })

    it('ArrowLeft moves focus to the previous tab (with wrap)', () => {
      renderTabs({ activeTab: 'overview' })
      const tablist = screen.getByRole('tablist')
      const tabs = within(tablist).getAllByRole('tab')
      tabs[2].focus()
      fireEvent.keyDown(tabs[2], { key: 'ArrowLeft' })
      expect(tabs[1]).toHaveFocus()
      // wrap at start
      tabs[0].focus()
      fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' })
      expect(tabs[5]).toHaveFocus()
    })

    it('Home jumps focus to the first tab; End jumps to the last', () => {
      renderTabs({ activeTab: 'overview' })
      const tablist = screen.getByRole('tablist')
      const tabs = within(tablist).getAllByRole('tab')
      tabs[3].focus()
      fireEvent.keyDown(tabs[3], { key: 'End' })
      expect(tabs[5]).toHaveFocus()
      fireEvent.keyDown(tabs[5], { key: 'Home' })
      expect(tabs[0]).toHaveFocus()
    })

    it('does not change activeTab on arrow keys — manual activation only', () => {
      const onTabChange = vi.fn()
      renderTabs({ activeTab: 'overview', onTabChange })
      const tablist = screen.getByRole('tablist')
      const tabs = within(tablist).getAllByRole('tab')
      tabs[0].focus()
      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
      expect(onTabChange).not.toHaveBeenCalled()
    })

    it('each tab has aria-controls pointing at its tabpanel id', () => {
      renderTabs()
      const tablist = screen.getByRole('tablist')
      const tabs = within(tablist).getAllByRole('tab')
      tabs.forEach(t => {
        const controls = t.getAttribute('aria-controls')
        expect(controls).toMatch(/^district-tabpanel-/)
      })
    })
  })

  describe('accessibility', () => {
    it('exposes a tablist landmark with an aria-label', () => {
      renderTabs()
      expect(
        screen.getByRole('tablist', { name: /district analysis tabs/i })
      ).toBeInTheDocument()
    })

    it('preserves the 44px touch target size (WCAG 2.5.5)', () => {
      // Static guard: the brittle Tailwind class-name assertion that
      // protected this in the old tests was deleted during migration —
      // replaced by an explicit min-height: 44px declaration in CSS.
      // Read the rule and assert it stays.
      const css = readFileSync(
        resolve(__dirname, '../../styles/components/app-shell.css'),
        'utf-8'
      )
      const rule = css.match(
        /\.district-detail-tabs__tab\s*\{([\s\S]*?)\n\s*\}/
      )
      expect(rule).toBeTruthy()
      const stripped = (rule?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(stripped).toMatch(/min-height\s*:\s*44px\s*;/)
    })
  })

  describe('discoverability (#437)', () => {
    const css = readFileSync(
      resolve(__dirname, '../../styles/components/app-shell.css'),
      'utf-8'
    )

    it('uses font-size 14px (up from 13px) for legibility', () => {
      const rule = css.match(
        /\.district-detail-tabs__tab\s*\{([\s\S]*?)\n\s*\}/
      )
      const stripped = (rule?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(stripped).toMatch(/font-size\s*:\s*14px\s*;/)
    })

    it('uses border-bottom-width 3px on the active tab (up from 2px)', () => {
      const activeRule = css.match(
        /\.district-detail-tabs__tab\[aria-selected='true'\]\s*\{([\s\S]*?)\n\s*\}/
      )
      const stripped = (activeRule?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(stripped).toMatch(/border-bottom-width\s*:\s*3px\s*;/)
    })

    it('hover state preserves underline preview to advertise interactivity', () => {
      const hoverRule = css.match(
        /\.district-detail-tabs__tab:hover\s*\{([\s\S]*?)\n\s*\}/
      )
      const stripped = (hoverRule?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '')
      // Hover should have a background-color OR a border-bottom hint to
      // advertise interactivity beyond a color shift.
      expect(
        /background-color\s*:|border-bottom-color\s*:/.test(stripped)
      ).toBe(true)
    })
  })
})
