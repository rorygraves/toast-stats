import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { ChartExpandSheet } from '../ChartExpandSheet'

afterEach(cleanup)

describe('ChartExpandSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <ChartExpandSheet isOpen={false} onClose={() => {}} title="Membership">
        <div data-testid="chart-body">chart</div>
      </ChartExpandSheet>
    )
    expect(screen.queryByTestId('chart-body')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders a modal dialog with the title and children when open', () => {
    render(
      <ChartExpandSheet isOpen onClose={() => {}} title="Membership trend">
        <div data-testid="chart-body">chart</div>
      </ChartExpandSheet>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByTestId('chart-body')).toBeTruthy()
    expect(screen.getByText('Membership trend')).toBeTruthy()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <ChartExpandSheet isOpen onClose={onClose} title="X">
        <div>chart</div>
      </ChartExpandSheet>
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <ChartExpandSheet isOpen onClose={onClose} title="X">
        <div>chart</div>
      </ChartExpandSheet>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <ChartExpandSheet isOpen onClose={onClose} title="X">
        <div>chart</div>
      </ChartExpandSheet>
    )
    fireEvent.click(screen.getByTestId('chart-expand-sheet-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('labels the dialog by its visible heading (aria-labelledby)', () => {
    render(
      <ChartExpandSheet isOpen onClose={() => {}} title="Membership trend">
        <div>chart</div>
      </ChartExpandSheet>
    )
    const dialog = screen.getByRole('dialog')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const heading = screen.getByText('Membership trend')
    expect(heading.id).toBe(labelledBy)
    // accessible name comes from the heading, not a competing aria-label
    expect(dialog.getAttribute('aria-label')).toBeNull()
  })

  it('moves focus to the close button on open', () => {
    render(
      <ChartExpandSheet isOpen onClose={() => {}} title="X">
        <div>chart</div>
      </ChartExpandSheet>
    )
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: /close/i })
    )
  })

  it('restores focus to the opener when it closes', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    expect(document.activeElement).toBe(opener)

    const { rerender } = render(
      <ChartExpandSheet isOpen onClose={() => {}} title="X">
        <div>chart</div>
      </ChartExpandSheet>
    )
    // focus moved into the sheet
    expect(document.activeElement).not.toBe(opener)

    rerender(
      <ChartExpandSheet isOpen={false} onClose={() => {}} title="X">
        <div>chart</div>
      </ChartExpandSheet>
    )
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })
})
