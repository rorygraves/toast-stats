import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeaderActionsMenu } from '../HeaderActionsMenu'

// Mock the export hook so the menu's "Export CSV" item can be asserted
// without exercising the real GCS/CSV pipeline. The returned state is
// mutable so individual tests can simulate in-progress / error states.
const exportToCSV = vi.fn()
const clearError = vi.fn()
const exportState: { isExporting: boolean; error: Error | null } = {
  isExporting: false,
  error: null,
}
vi.mock('../../hooks/useDistrictExport', () => ({
  useDistrictExport: () => ({
    isExporting: exportState.isExporting,
    error: exportState.error,
    exportToCSV,
    clearError,
  }),
}))

beforeEach(() => {
  exportToCSV.mockClear()
  clearError.mockClear()
  exportState.isExporting = false
  exportState.error = null
})

afterEach(() => cleanup())

describe('HeaderActionsMenu (#676 — overflow action cluster)', () => {
  it('renders a single collapsed "More actions" menu-button trigger', () => {
    render(<HeaderActionsMenu districtId="61" />)
    const trigger = screen.getByRole('button', { name: /more actions/i })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    // Menu is not in the DOM until opened.
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens the menu on click and exposes Export + Share as menuitems', async () => {
    const user = userEvent.setup()
    render(<HeaderActionsMenu districtId="61" />)
    await user.click(screen.getByRole('button', { name: /more actions/i }))

    expect(
      screen.getByRole('button', { name: /more actions/i })
    ).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu')
    expect(menu).toBeInTheDocument()
    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(2)
    expect(
      screen.getByRole('menuitem', { name: /export csv/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: /copy link/i })
    ).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<HeaderActionsMenu districtId="61" />)
    const trigger = screen.getByRole('button', { name: /more actions/i })
    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('Export CSV menuitem triggers the export and closes the menu', async () => {
    const user = userEvent.setup()
    render(<HeaderActionsMenu districtId="61" />)
    await user.click(screen.getByRole('button', { name: /more actions/i }))
    await user.click(screen.getByRole('menuitem', { name: /export csv/i }))

    expect(exportToCSV).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('Copy link menuitem copies the URL and announces via a status region', async () => {
    // userEvent.setup() installs an in-memory clipboard stub; the component
    // writes to it, and we read it back to verify the copied value.
    const user = userEvent.setup()
    render(<HeaderActionsMenu districtId="61" />)
    await user.click(screen.getByRole('button', { name: /more actions/i }))
    await user.click(screen.getByRole('menuitem', { name: /copy link/i }))

    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe(window.location.href)
    )
    expect(screen.queryByRole('menu')).toBeNull()
    // Feedback survives the menu close via an aria-live status region.
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/link copied/i)
    )
  })

  it('surfaces export progress in the persistent status region', () => {
    exportState.isExporting = true
    render(<HeaderActionsMenu districtId="61" />)
    // Menu is closed, yet the in-progress feedback is still announced.
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(/exporting/i)
  })

  it('surfaces an export error as an assertive alert', () => {
    exportState.error = new Error('Export failed: network')
    render(<HeaderActionsMenu districtId="61" />)
    expect(screen.getByRole('alert')).toHaveTextContent(/export failed/i)
  })

  it('clears a stale export error when the menu is reopened', async () => {
    exportState.error = new Error('Export failed: network')
    const user = userEvent.setup()
    render(<HeaderActionsMenu districtId="61" />)
    await user.click(screen.getByRole('button', { name: /more actions/i }))
    expect(clearError).toHaveBeenCalled()
  })

  it('ArrowDown opens the menu and moves focus into it', async () => {
    const user = userEvent.setup()
    render(<HeaderActionsMenu districtId="61" />)
    const trigger = screen.getByRole('button', { name: /more actions/i })
    trigger.focus()
    await user.keyboard('{ArrowDown}')

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: /export csv/i })).toHaveFocus()
  })
})
