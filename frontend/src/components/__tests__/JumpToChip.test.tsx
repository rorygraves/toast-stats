/* JumpToChip — sticky "Jump to ▾" chip + TOC sheet (#878, epic #880 Sprint 2).

   A mobile-only sticky chip pinned under the page header that opens the
   long-text TOC as a modal sheet, so a reader deep in the page can jump to a
   section without scrolling back to the top. This unit suite renders the
   component in isolation (no page mount — R22) and drives the dialog contract:
   open on tap, list every section, jump + close on selection, dismiss via Esc /
   backdrop / close button. */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import JumpToChip from '../JumpToChip'

const SECTIONS = [
  { id: 'data-source', num: '01', title: 'Data source & access' },
  { id: 'borda-count', num: '03', title: 'Borda count scoring' },
  { id: 'glossary', num: '08', title: 'Glossary' },
] as const

const renderChip = (onJump = vi.fn()) => {
  render(
    <MemoryRouter>
      <JumpToChip sections={SECTIONS} onJump={onJump} />
    </MemoryRouter>
  )
  return onJump
}

describe('JumpToChip', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  it('renders a "Jump to" chip that signals it opens a dialog', () => {
    renderChip()
    const chip = screen.getByRole('button', { name: /jump to/i })
    expect(chip).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('keeps the sheet closed until the chip is tapped', () => {
    renderChip()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens a labelled modal dialog listing every section on tap', async () => {
    renderChip()
    await userEvent.click(screen.getByRole('button', { name: /jump to/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    // Every section is a jump link inside the sheet.
    for (const s of SECTIONS) {
      const link = within(dialog).getByRole('link', {
        name: new RegExp(s.title, 'i'),
      })
      expect(link).toHaveAttribute('href', `#${s.id}`)
    }
  })

  it('calls onJump with the section id and closes the sheet when a link is tapped', async () => {
    const onJump = renderChip()
    await userEvent.click(screen.getByRole('button', { name: /jump to/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('link', { name: /Borda count scoring/i })
    )
    expect(onJump).toHaveBeenCalledWith('borda-count')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    renderChip()
    await userEvent.click(screen.getByRole('button', { name: /jump to/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on backdrop click', async () => {
    renderChip()
    await userEvent.click(screen.getByRole('button', { name: /jump to/i }))
    await userEvent.click(screen.getByTestId('jump-to-sheet-backdrop'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes via the explicit close button', async () => {
    renderChip()
    await userEvent.click(screen.getByRole('button', { name: /jump to/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: /close/i })
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('moves focus into the sheet on open and restores it to the chip on close', async () => {
    renderChip()
    const chip = screen.getByRole('button', { name: /jump to/i })
    await userEvent.click(chip)
    const closeBtn = screen.getByRole('button', { name: /close/i })
    expect(closeBtn).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(chip).toHaveFocus()
  })
})
