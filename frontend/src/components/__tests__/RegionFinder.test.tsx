import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { RegionFinder } from '../RegionFinder'

/* #685 — region index findability. A small filter bar so a user can
   jump straight to a region (Amy: "I have to scroll through each to
   find region seven") instead of scanning 14 rows. Red-first (Lesson 54). */

afterEach(() => cleanup())

const REGIONS = ['01', '02', '07', '14']

describe('RegionFinder (#685)', () => {
  it('renders an "All regions" control plus one button per region', () => {
    render(
      <RegionFinder regions={REGIONS} selected={null} onSelect={vi.fn()} />
    )
    const group = screen.getByRole('group', { name: /find a region/i })
    // All + 4 regions = 5 buttons
    expect(within(group).getAllByRole('button')).toHaveLength(5)
    expect(
      within(group).getByRole('button', { name: /all regions/i })
    ).toBeInTheDocument()
    expect(
      within(group).getByRole('button', { name: /region 07/i })
    ).toBeInTheDocument()
  })

  it('marks "All regions" as pressed when nothing is selected', () => {
    render(
      <RegionFinder regions={REGIONS} selected={null} onSelect={vi.fn()} />
    )
    expect(
      screen.getByRole('button', { name: /all regions/i })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /region 07/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('marks the selected region as pressed and "All" as not pressed', () => {
    render(<RegionFinder regions={REGIONS} selected="07" onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: /region 07/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(
      screen.getByRole('button', { name: /all regions/i })
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelect with the region id when a region button is clicked', async () => {
    const onSelect = vi.fn()
    render(
      <RegionFinder regions={REGIONS} selected={null} onSelect={onSelect} />
    )
    await userEvent.click(screen.getByRole('button', { name: /region 07/i }))
    expect(onSelect).toHaveBeenCalledWith('07')
  })

  it('calls onSelect with null when "All regions" is clicked', async () => {
    const onSelect = vi.fn()
    render(<RegionFinder regions={REGIONS} selected="07" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /all regions/i }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
