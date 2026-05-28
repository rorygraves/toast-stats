import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ColumnGroup } from './filters/types'

interface ColumnGroupsMenuProps {
  /** Groups offered for show/hide, in display order. Empty groups (e.g.
   *  "Changes" until #795) are filtered out by the caller, so each entry here
   *  has at least one column. */
  groups: readonly { id: ColumnGroup; label: string }[]
  isGroupHidden: (group: ColumnGroup) => boolean
  onToggle: (group: ColumnGroup) => void
}

/**
 * "Columns" show/hide control for the club table (#819, ADR-006 §4).
 *
 * A discoverable trigger opens a popover of per-group checkboxes (checked =
 * visible). A checkbox — not a `role="tab"`/segmented control — is the honest
 * affordance for "show/hide this set of columns" (Lesson 128). The popover
 * closes on Escape or an outside click and returns focus to the trigger
 * (WCAG 2.4.3), mirroring the Filters drawer's focus contract.
 */
export const ColumnGroupsMenu: React.FC<ColumnGroupsMenuProps> = ({
  groups,
  isGroupHidden,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }, [])

  // Dismiss on Escape or a click outside the control (popover + trigger).
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !popoverRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [isOpen, close])

  const hiddenCount = groups.filter(g => isGroupHidden(g.id)).length
  const popoverId = 'clubs-columns-menu-popover'

  return (
    <div className="clubs-columns-menu">
      {/* Disclosure pattern: the popover is a region of checkboxes, not a menu
          — so it's `aria-expanded` + `aria-controls`, NOT `aria-haspopup="menu"`
          (which would promise menuitem semantics it doesn't have). */}
      <button
        ref={triggerRef}
        type="button"
        className="clubs-filters-trigger"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        aria-controls={popoverId}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 6v12M10 6v12M16 6v12M4 18h16"
          />
        </svg>
        <span>Columns</span>
        {hiddenCount > 0 && (
          <span className="clubs-filters-trigger__badge">{hiddenCount}</span>
        )}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId}
          className="clubs-columns-menu__popover"
          role="group"
          aria-label="Show or hide column groups"
        >
          <p className="clubs-columns-menu__heading">Column groups</p>
          {groups.map(g => (
            <label key={g.id} className="clubs-columns-menu__item">
              <input
                type="checkbox"
                checked={!isGroupHidden(g.id)}
                onChange={() => onToggle(g.id)}
              />
              <span>{g.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
