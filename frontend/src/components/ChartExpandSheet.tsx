import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface ChartExpandSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Heading shown in the sheet header. */
  title: string
  children: React.ReactNode
}

/**
 * A full-screen modal sheet that hosts the desktop chart on mobile, opened
 * from the collapsed sparkline by `ChartSparklineExpand`.
 *
 * Dismissible three ways (close button, Esc, backdrop click) and focus-trapped
 * while open — the same modal-dialog contract as the clubs `FiltersPanel`
 * (#816). Portalled to `document.body` so it escapes any clipped/overflow
 * ancestor and reliably covers the viewport. Semantic tokens only, so dark mode
 * comes for free at the CSS layer (R10).
 */
export const ChartExpandSheet: React.FC<ChartExpandSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Esc-to-close (document-level, so it works before focus lands inside).
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  // Move focus into the sheet on open; keep Tab inside it while open.
  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !sheetRef.current) return
      const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    const sheet = sheetRef.current
    sheet?.addEventListener('keydown', handleTab)
    return () => sheet?.removeEventListener('keydown', handleTab)
  }, [isOpen])

  // Lock background scroll while the sheet is open.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="chart-expand-sheet-overlay">
      <div
        className="chart-expand-sheet-backdrop"
        data-testid="chart-expand-sheet-backdrop"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="chart-expand-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="chart-expand-sheet__header">
          <h2 className="chart-expand-sheet__title">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="chart-expand-sheet__close"
            aria-label="Close chart"
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="chart-expand-sheet__body">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export default ChartExpandSheet
