/* CollapsibleSection — long-text page disclosure (#877, epic #880 Sprint 1).

   Desktop (collapsible=false) renders today's static markup unchanged: a
   plain <h2> with the section visible, no toggle button. Mobile
   (collapsible=true) renders the WAI-ARIA disclosure pattern (Lesson 128:
   a disclosure button, NOT a tab) — collapsed by default, tap to expand. */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CollapsibleSection from '../CollapsibleSection'

const renderSection = (
  props: Partial<React.ComponentProps<typeof CollapsibleSection>> = {}
) =>
  render(
    <CollapsibleSection
      id="data-source"
      num="01"
      title="Data source & access"
      collapsible={false}
      open={false}
      onToggle={() => {}}
      {...props}
    >
      <p>Body paragraph content.</p>
    </CollapsibleSection>
  )

describe('CollapsibleSection — desktop (collapsible=false)', () => {
  it('renders a plain heading with no toggle button', () => {
    renderSection({ collapsible: false })
    expect(screen.queryByRole('button')).toBeNull()
    expect(
      screen.getByRole('heading', { level: 2, name: /Data source & access/i })
    ).toBeInTheDocument()
  })

  it('shows the section body unconditionally', () => {
    renderSection({ collapsible: false, open: false })
    expect(screen.getByText('Body paragraph content.')).toBeVisible()
  })
})

describe('CollapsibleSection — mobile (collapsible=true)', () => {
  it('renders the H2 as a disclosure button, not a tab', () => {
    renderSection({ collapsible: true, open: false })
    const btn = screen.getByRole('button', { name: /Data source & access/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).toHaveAttribute('aria-controls', 'data-source-content')
    // Disclosure, never a tab (Lesson 128) — no tab/tablist semantics.
    expect(screen.queryByRole('tab')).toBeNull()
  })

  it('collapses the body by default', () => {
    renderSection({ collapsible: true, open: false })
    expect(screen.getByText('Body paragraph content.')).not.toBeVisible()
  })

  it('reveals the body when open', () => {
    renderSection({ collapsible: true, open: true })
    const btn = screen.getByRole('button', { name: /Data source & access/i })
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Body paragraph content.')).toBeVisible()
  })

  it('calls onToggle with the section id when tapped', async () => {
    const onToggle = vi.fn()
    renderSection({ collapsible: true, open: false, onToggle })
    await userEvent.click(
      screen.getByRole('button', { name: /Data source & access/i })
    )
    expect(onToggle).toHaveBeenCalledWith('data-source')
  })
})
