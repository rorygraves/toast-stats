/**
 * StatusChip (#871, epic #873 Sprint 1 — CC-4) — the mobile status-chip
 * treatment for the Division / Area club mini-tables, which previously rendered
 * the raw `currentStatus` enum as plain text that truncates at 375px.
 *
 * The chip pairs colour with BOTH a text label and an icon glyph so meaning
 * never rests on colour alone (WCAG 1.4.1). Label + pill modifier come from the
 * single source of truth in `utils/clubHealthStatus.ts` (lesson 052), so the
 * chip reads identically to the desktop ClubsTable pill.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StatusChip } from '../StatusChip'
import type { ClubHealthStatus } from '../../hooks/useDistrictAnalytics'

afterEach(cleanup)

const CASES: Array<{
  status: ClubHealthStatus
  label: string
  modifier: string
  icon: string
}> = [
  {
    status: 'thriving',
    label: 'Thriving',
    modifier: 'clubs-status-pill--thriving',
    icon: '✓',
  },
  {
    status: 'vulnerable',
    label: 'Vulnerable',
    modifier: 'clubs-status-pill--vulnerable',
    icon: '⚠',
  },
  {
    status: 'intervention-required',
    label: 'Intervention Required',
    modifier: 'clubs-status-pill--intervention',
    icon: '✗',
  },
]

describe('StatusChip (#871 CC-4)', () => {
  for (const c of CASES) {
    it(`renders the ${c.status} chip with pill class, label and icon`, () => {
      const { container } = render(<StatusChip status={c.status} />)
      const pill = container.querySelector('.clubs-status-pill')
      expect(pill).not.toBeNull()
      // colour modifier so the chip is themed, not generic
      expect(pill).toHaveClass(c.modifier)
      // text label present — meaning never rests on colour alone (WCAG 1.4.1)
      expect(pill).toHaveTextContent(c.label)
      // icon glyph present and marked decorative (label carries the meaning)
      const icon = container.querySelector('[aria-hidden="true"]')
      expect(icon).not.toBeNull()
      expect(icon).toHaveTextContent(c.icon)
    })
  }

  it('forwards an extra className for call-site layout (lesson 077)', () => {
    const { container } = render(
      <StatusChip status="thriving" className="my-cell-chip" />
    )
    const pill = container.querySelector('.clubs-status-pill')
    expect(pill).toHaveClass('my-cell-chip')
  })

  it('exposes the label as accessible text, not just colour', () => {
    render(<StatusChip status="vulnerable" />)
    expect(screen.getByText('Vulnerable')).toBeInTheDocument()
  })
})
