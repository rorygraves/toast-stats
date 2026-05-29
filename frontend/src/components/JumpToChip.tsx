import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/* JumpToChip — sticky "Jump to ▾" chip + TOC sheet (#878, epic #880 Sprint 2).

   Long-text pages (Methodology, CC-8 in the mobile UX audit) are a ~20-viewport
   scroll on a phone. Sprint 1 added an in-page TOC card at the top and collapsed
   the H2 sections; this sprint pins a "Jump to ▾" chip under the page header so a
   reader deep in the page can re-open that TOC and jump without scrolling back up.

   Mobile-only: the page renders this component only when useIsMobile() is true,
   so it adds no DOM on desktop (where the in-flow TOC card already serves) — the
   same class-emission gating as CollapsibleSection (#877).

   The sheet reuses the modal-dialog contract proven by ChartExpandSheet (#874):
   portalled to <body> to escape clipped ancestors, dismissible three ways
   (close button, Esc, backdrop), focus moved in on open and restored to the chip
   on close, background scroll locked while open. Semantic tokens only, so dark
   mode comes for free at the CSS layer (R10). The trigger uses
   aria-haspopup="dialog" (WAI-ARIA modal-dialog pattern) rather than
   aria-expanded — it opens a separate dialog, it is not an inline disclosure. */

export interface JumpToSection {
  /** Anchor target id; the sheet links to `#${id}`. */
  id: string
  /** Two-digit section number badge (e.g. "01"). */
  num: string
  /** Section heading text. */
  title: string
}

export interface JumpToChipProps {
  sections: ReadonlyArray<JumpToSection>
  /** Called with the chosen section id before the hash jump — lets the page
      reveal a collapsed target so the jump doesn't land on a hidden heading. */
  onJump: (id: string) => void
}

const JumpToChip: React.FC<JumpToChipProps> = ({ sections, onJump }) => {
  const [open, setOpen] = useState(false)
  const chipRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  const close = useCallback(() => setOpen(false), [])

  // Esc-to-close (document-level, so it works before focus lands inside).
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  // Move focus into the sheet on open; restore it to the chip on close so
  // keyboard/AT users return to the trigger, not the document top.
  useEffect(() => {
    if (!open) return
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
    return () => {
      sheet?.removeEventListener('keydown', handleTab)
      chipRef.current?.focus()
    }
  }, [open])

  // Lock background scroll while the sheet is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const handleJump = useCallback(
    (id: string) => {
      onJump(id)
      close()
    },
    [onJump, close]
  )

  return (
    <div className="jump-to-bar">
      <button
        ref={chipRef}
        type="button"
        className="jump-to-chip"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        Jump to
        <span className="jump-to-chip__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open &&
        createPortal(
          <div className="jump-to-sheet-overlay">
            <div
              className="jump-to-sheet-backdrop"
              data-testid="jump-to-sheet-backdrop"
              onClick={close}
            />
            <div
              ref={sheetRef}
              className="jump-to-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <div className="jump-to-sheet__header">
                <h2 id={titleId} className="jump-to-sheet__title">
                  Jump to a section
                </h2>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="jump-to-sheet__close"
                  aria-label="Close"
                  onClick={close}
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
              <nav
                aria-label="Jump to a section"
                className="jump-to-sheet__nav"
              >
                <ol className="jump-to-sheet__list">
                  {sections.map(s => (
                    <li key={s.id} className="jump-to-sheet__item">
                      <a
                        href={`#${s.id}`}
                        className="jump-to-sheet__link"
                        onClick={() => handleJump(s.id)}
                      >
                        <span className="jump-to-sheet__num">{s.num}</span>
                        <span className="jump-to-sheet__text">{s.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default JumpToChip
