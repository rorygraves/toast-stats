import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDistrictExport } from '../hooks/useDistrictExport'

/* Overflow "⋯" action menu for the district detail header (#676).

   Consolidates the secondary actions (Export CSV, Copy link) that used to
   crowd the header's top-right cluster into a single menu-button. The PY /
   as-of-date selects stay inline in the DataControlsBar — they are primary
   controls, not secondary actions.

   Pattern: WAI-ARIA menu button (aria-haspopup="menu" + role="menu" /
   role="menuitem"). Export and Share are independent commands, which is the
   canonical menu-button case (a disclosure is for revealing a region of
   content, not a list of commands).

   Keyboard contract:
   - Trigger: Enter / Space / ArrowDown opens and focuses the first item.
   - Menu: ArrowUp/Down move (wrapping), Home/End jump, Escape closes and
     returns focus to the trigger, Tab closes.
   - Click outside closes.

   Share feedback ("✓ Link copied") survives the menu closing via an
   aria-live status region anchored in the header, so keyboard and
   screen-reader users still get confirmation. */

interface HeaderActionsMenuProps {
  districtId: string
}

export const HeaderActionsMenu: React.FC<HeaderActionsMenuProps> = ({
  districtId,
}) => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const { isExporting, error, exportToCSV, clearError } =
    useDistrictExport(districtId)

  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  // Focus the first menuitem when the menu opens, and clear any stale
  // export error so a reopened menu reflects the current state.
  useEffect(() => {
    if (open) {
      clearError()
      itemRefs.current[0]?.focus()
    }
  }, [open, clearError])

  // Close on outside click / Escape while open.
  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const focusItem = (index: number) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[]
    if (items.length === 0) return
    const next = (index + items.length) % items.length
    items[next]?.focus()
  }

  const handleMenuKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        focusItem(index + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        focusItem(index - 1)
        break
      case 'Home':
        e.preventDefault()
        focusItem(0)
        break
      case 'End':
        e.preventDefault()
        focusItem(itemRefs.current.length - 1)
        break
      case 'Tab':
        // Close and return focus to the trigger so the natural tab order
        // continues from there — never drop focus to <body> on unmount.
        close()
        break
      default:
        break
    }
  }

  const handleExport = () => {
    clearError()
    exportToCSV()
    close()
  }

  const handleCopyLink = async () => {
    close()
    try {
      // navigator.clipboard is undefined on insecure (HTTP) contexts — the
      // property access throws synchronously, which the try/catch absorbs
      // (a .then().catch() chain would not). Guard explicitly too.
      if (!navigator.clipboard) return
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard unavailable or write rejected; swallow silently for v1.
    }
  }

  return (
    <div className="header-actions-menu" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="header-actions-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span aria-hidden="true">⋯</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="More actions"
          className="header-actions-menu__panel"
        >
          <button
            ref={el => {
              itemRefs.current[0] = el
            }}
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="header-actions-menu__item"
            onClick={handleExport}
            onKeyDown={e => handleMenuKeyDown(e, 0)}
          >
            Export CSV
          </button>
          <button
            ref={el => {
              itemRefs.current[1] = el
            }}
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="header-actions-menu__item"
            onClick={handleCopyLink}
            onKeyDown={e => handleMenuKeyDown(e, 1)}
          >
            Copy link
          </button>
        </div>
      )}

      {/* Feedback region — anchored outside the panel so progress / success
          survive the menu closing (the menu closes on every action). Export
          progress and the copied confirmation are polite; export errors are
          assertive (role="alert"). */}
      <span
        role="status"
        aria-live="polite"
        className="header-actions-menu__status"
      >
        {isExporting ? 'Exporting…' : copied ? '✓ Link copied' : ''}
      </span>
      {error && (
        <span role="alert" className="header-actions-menu__error">
          {error.message}
        </span>
      )}
    </div>
  )
}
