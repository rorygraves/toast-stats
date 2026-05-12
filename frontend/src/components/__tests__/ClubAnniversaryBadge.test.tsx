import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ClubAnniversaryBadge } from '../ClubAnniversaryBadge'
import type { ClubAnniversary } from '../../utils/clubAnniversary'

/* Sprint B RED tests for #445. */

afterEach(() => cleanup())

const anniversary = (overrides: Partial<ClubAnniversary>): ClubAnniversary => ({
  years: 3,
  isMilestone: false,
  daysUntilNext: 200,
  isUpcoming: false,
  upcomingYears: 4,
  ...overrides,
})

describe('ClubAnniversaryBadge (#445)', () => {
  it('renders nothing when anniversary is null (missing charter date)', () => {
    const { container } = render(<ClubAnniversaryBadge anniversary={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a quiet pill for non-milestone, non-upcoming years', () => {
    render(
      <ClubAnniversaryBadge
        anniversary={anniversary({ years: 7 })}
        charterDateLabel="March 1987"
      />
    )
    expect(screen.getByText(/7 years/i)).toBeInTheDocument()
    // No upcoming countdown, no milestone gold.
    expect(screen.queryByText(/anniversary in/i)).not.toBeInTheDocument()
  })

  it('elevates milestone years with the milestone class', () => {
    const { container } = render(
      <ClubAnniversaryBadge
        anniversary={anniversary({ years: 25, isMilestone: true })}
      />
    )
    const badge = container.querySelector('[data-milestone="true"]')
    expect(badge).not.toBeNull()
    expect(badge?.textContent).toMatch(/25 years/i)
  })

  it('shows upcoming countdown when isUpcoming is true and not yet on the day', () => {
    render(
      <ClubAnniversaryBadge
        anniversary={anniversary({
          years: 24,
          upcomingYears: 25,
          daysUntilNext: 20,
          isUpcoming: true,
        })}
      />
    )
    expect(screen.getByText(/25th anniversary in 20 days/i)).toBeInTheDocument()
  })

  it('shows "today!" copy on the exact anniversary day', () => {
    render(
      <ClubAnniversaryBadge
        anniversary={anniversary({
          years: 25,
          upcomingYears: 25,
          daysUntilNext: 0,
          isUpcoming: true,
          isMilestone: true,
        })}
      />
    )
    expect(screen.getByText(/today/i)).toBeInTheDocument()
  })

  it('shows charter date in tooltip when charterDateLabel is provided', () => {
    render(
      <ClubAnniversaryBadge
        anniversary={anniversary({ years: 39 })}
        charterDateLabel="March 1, 1987"
      />
    )
    // The label appears in the title attribute of the root element OR
    // as visible text; either works for now.
    expect(
      screen.getByText(/March 1, 1987/i, { exact: false })
    ).toBeInTheDocument()
  })
})
