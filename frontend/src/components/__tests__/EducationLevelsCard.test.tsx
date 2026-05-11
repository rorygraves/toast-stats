import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { ReactElement } from 'react'
import { EducationLevelsCard } from '../EducationLevelsCard'
import type { EducationLevelsTotals } from '../../utils/extractEducationLevels'

// Provider-free unit-test render (#473): card has no router / query.
const renderCard = (ui: ReactElement) => render(ui)

const empty: EducationLevelsTotals = {
  level1: 0,
  level2: 0,
  level3: 0,
  level4PathDtm: 0,
  total: 0,
  contributingClubs: 0,
  totalClubs: 0,
}

describe('EducationLevelsCard (#426)', () => {
  afterEach(() => cleanup())

  it('renders the four labelled rows with counts and percentages', () => {
    const totals: EducationLevelsTotals = {
      level1: 4,
      level2: 2,
      level3: 3,
      level4PathDtm: 1,
      total: 10,
      contributingClubs: 5,
      totalClubs: 8,
    }
    renderCard(<EducationLevelsCard totals={totals} />)
    const card = screen.getByLabelText(/education levels/i, {
      selector: 'section',
    })
    expect(within(card).getByText(/level 1$/i)).toBeInTheDocument()
    expect(within(card).getByText(/level 2$/i)).toBeInTheDocument()
    expect(within(card).getByText(/level 3$/i)).toBeInTheDocument()
    expect(
      within(card).getByText(/level 4\+ · path · dtm/i)
    ).toBeInTheDocument()

    // Total + participation summary
    expect(within(card).getByText('10')).toBeInTheDocument()
    expect(within(card).getByText(/5\/8 clubs earned/)).toBeInTheDocument()
    expect(within(card).getByText(/63%\)/)).toBeInTheDocument()
  })

  it('renders nothing when the snapshot has zero awards', () => {
    const { container } = renderCard(<EducationLevelsCard totals={empty} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows a loading state when isLoading is true', () => {
    renderCard(<EducationLevelsCard totals={empty} isLoading />)
    expect(screen.getByLabelText(/loading education levels/i)).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  it('computes per-row percentages from total', () => {
    const totals: EducationLevelsTotals = {
      level1: 50,
      level2: 25,
      level3: 15,
      level4PathDtm: 10,
      total: 100,
      contributingClubs: 10,
      totalClubs: 10,
    }
    renderCard(<EducationLevelsCard totals={totals} />)
    // Bars set inline width; assert by text first to keep the test robust.
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('15%')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
  })
})
