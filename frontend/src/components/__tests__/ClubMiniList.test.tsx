/**
 * ClubMiniList (#871, epic #873 Sprint 1 — CC-4) — the mobile (<768px)
 * treatment for the Division / Area club mini-tables.
 *
 * The 4-column mini-table overflows 375px (long club names + Members +
 * Distinguished), so the Status column scrolls off the right edge and the chip
 * clips to "✗ Intervention R…" even after chipping. The audit's CC-4 fix is to
 * stop tabling it: each club becomes a stacked card with its name and a fully
 * visible StatusChip (Lesson 105 — browse-one-row lists card-collapse). Reuses
 * the themed `.clubs-card` chrome so dark mode just works (R10).
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ClubMiniList } from '../ClubMiniList'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'

afterEach(cleanup)

const CLUBS: ClubTrend[] = [
  {
    clubId: 'c1',
    clubName: 'Limestone City Club',
    divisionId: 'A',
    divisionName: 'Division A',
    areaId: '01',
    areaName: 'Area 01',
    distinguishedLevel: 'Distinguished',
    currentStatus: 'intervention-required',
    riskFactors: [],
    membershipTrend: [{ date: '2025-07-15', count: 12 }],
    dcpGoalsTrend: [{ date: '2025-07-15', goalsAchieved: 2 }],
  },
]

describe('ClubMiniList (#871 CC-4)', () => {
  it('renders one card per club with a StatusChip (not raw enum)', () => {
    const { container } = render(
      <ClubMiniList clubs={CLUBS} onSelect={vi.fn()} />
    )
    const card = container.querySelector('.clubs-card')
    expect(card).not.toBeNull()
    expect(screen.getByText('Limestone City Club')).toBeInTheDocument()
    const pill = container.querySelector('.clubs-status-pill')
    expect(pill).toHaveClass('clubs-status-pill--intervention')
    expect(pill).toHaveTextContent('Intervention Required')
    // no raw enum leaks
    expect(container.textContent).not.toContain('intervention-required')
    // members + distinguished meta preserved from the table columns
    expect(container.textContent).toContain('12 members')
    expect(container.textContent).toContain('Distinguished')
  })

  it('renders no <table> — the row is de-tabled to avoid 375px overflow', () => {
    const { container } = render(
      <ClubMiniList clubs={CLUBS} onSelect={vi.fn()} />
    )
    expect(container.querySelector('table')).toBeNull()
  })

  it('invokes onSelect with the clubId when a card is activated', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <ClubMiniList clubs={CLUBS} onSelect={onSelect} />
    )
    const card = container.querySelector('.clubs-card') as HTMLElement
    within(card).getByText('Limestone City Club').click()
    expect(onSelect).toHaveBeenCalledWith('c1')
  })
})
