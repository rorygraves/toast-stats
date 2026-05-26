/**
 * Tests for ClubCard (#217)
 */
import { describe, it, expect, vi } from 'vitest'
import { screen, render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ClubCard from '../ClubCard'
import type { ProcessedClubTrend } from '../filters/types'
import type { ClubHealthStatus } from '../../hooks/useDistrictAnalytics'

const mockClub: ProcessedClubTrend = {
  clubId: '123',
  clubName: 'Test Speakers',
  divisionId: 'A',
  divisionName: 'Division A',
  areaId: '1',
  areaName: 'Area 1',
  membershipTrend: [{ date: '2026-03-01', count: 20 }],
  dcpGoalsTrend: [{ date: '2026-03-01', goalsAchieved: 7 }],
  membershipBase: 18,
  currentStatus: 'thriving' as ClubHealthStatus,
  riskFactors: [],
  distinguishedLevel: 'Distinguished',
  latestMembership: 20,
  latestDcpGoals: 7,
  distinguishedOrder: 0,
}

describe('ClubCard (#217)', () => {
  it('renders club name', () => {
    render(<ClubCard club={mockClub} />)
    expect(screen.getByText('Test Speakers')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    render(<ClubCard club={mockClub} />)
    expect(screen.getByText('Thriving')).toBeInTheDocument()
  })

  it('renders membership count', () => {
    render(<ClubCard club={mockClub} />)
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
  })

  it('renders net change', () => {
    render(<ClubCard club={mockClub} />)
    // 20 - 18 = +2
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('renders DCP goals', () => {
    render(<ClubCard club={mockClub} />)
    // latestDcpGoals = 7, but rendered with /10
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<ClubCard club={mockClub} onClick={onClick} />)
    fireEvent.click(screen.getByTestId('club-card'))
    expect(onClick).toHaveBeenCalledWith(mockClub)
  })

  it('has accessible aria-label', () => {
    render(<ClubCard club={mockClub} />)
    const card = screen.getByTestId('club-card')
    expect(card).toHaveAttribute(
      'aria-label',
      'Test Speakers — Thriving, 20 members'
    )
  })

  // ── Re-skin to redesign tokens (#671, epic #665 Sprint 5) ──
  // The card was on legacy gray Tailwind + inline hex status colors; it now
  // rides the same token classes as the desktop table so dark mode "just
  // works" (R10, lessons 092/093/096) and the same datum reads identically
  // on both surfaces (lesson 052 — one definition, not two).
  describe('re-skin (#671)', () => {
    it('uses the shared clubs-status-pill class, not an inline hex style', () => {
      render(<ClubCard club={mockClub} />)
      const badge = screen.getByText('Thriving')
      expect(badge.className).toContain('clubs-status-pill')
      expect(badge.getAttribute('style') ?? '').not.toMatch(/background/i)
    })

    it('maps each health status to its pill modifier + the desktop label', () => {
      // Labels MUST match ClubsTable's getStatusLabel (lesson 052 — one
      // definition across surfaces; both now share clubHealthStatus helpers).
      const cases: Array<[ClubHealthStatus, string, string]> = [
        ['thriving', 'clubs-status-pill--thriving', 'Thriving'],
        ['vulnerable', 'clubs-status-pill--vulnerable', 'Vulnerable'],
        [
          'intervention-required',
          'clubs-status-pill--intervention',
          'Intervention Required',
        ],
      ]
      for (const [status, modifier, label] of cases) {
        const { unmount } = render(
          <ClubCard club={{ ...mockClub, currentStatus: status }} />
        )
        const pill = document.querySelector(`.${modifier}`)
        expect(
          pill,
          `expected a .${modifier} pill for status "${status}"`
        ).not.toBeNull()
        expect(pill?.textContent).toBe(label)
        unmount()
      }
    })

    it('carries the token-driven card class and no legacy gray/white chrome', () => {
      render(<ClubCard club={mockClub} />)
      const card = screen.getByTestId('club-card')
      expect(card.className).toContain('clubs-card')
      // No legacy gray utilities anywhere in the card subtree, and no bg-white.
      const GRAY =
        /(?:^|[\s:])(?:text|bg|border|divide|from|to|ring|fill|stroke)-gray-\d/
      card.querySelectorAll<HTMLElement>('*').forEach(el => {
        const cls = el.getAttribute('class') ?? ''
        expect(cls, `gray class on ${el.tagName}: "${cls}"`).not.toMatch(GRAY)
        expect(cls).not.toMatch(/(?:^|\s)bg-white(?:\s|$)/)
      })
    })
  })
})
