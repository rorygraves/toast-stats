import React from 'react'

/* CollapsibleSection — long-text page section (#877, epic #880 Sprint 1).

   Long-text pages (Methodology) render as a tall wall of prose (CC-8 in the
   mobile UX audit). On mobile each H2 section becomes a tap-to-expand
   disclosure so readers can scan the TOC and open only what they want;
   desktop earns the density and is left untouched.

   `collapsible` is driven by useIsMobile() at the page level. When false
   (desktop, and the jsdom default) this renders the exact static markup the
   page shipped before — a plain <h2> with the body always visible, no button
   — so there is provably no desktop effect. When true it renders the
   WAI-ARIA disclosure pattern: a heading-wrapped toggle button with
   aria-expanded + aria-controls (Lesson 128 — a show/hide control is a
   disclosure button, never a tab; nothing here is a panel swap). */

export interface CollapsibleSectionProps {
  /** Anchor target id; the TOC links to `#${id}`. */
  id: string
  /** Two-digit section number badge (e.g. "01"). */
  num: string
  /** Section heading text. */
  title: string
  /** True on mobile — render the tap-to-expand disclosure. */
  collapsible: boolean
  /** Whether the section is expanded (only meaningful when collapsible). */
  open: boolean
  /** Tap handler; receives the section id. */
  onToggle: (id: string) => void
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  num,
  title,
  collapsible,
  open,
  onToggle,
  children,
}) => {
  if (!collapsible) {
    // Desktop: unchanged static markup — no toggle, body always visible.
    return (
      <section id={id} className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">{num}</span>
          {title}
        </h2>
        {children}
      </section>
    )
  }

  const contentId = `${id}-content`
  return (
    <section
      id={id}
      className="methodology-section methodology-section--collapsible"
    >
      <h2 className="methodology-section__title">
        <button
          type="button"
          className="methodology-section__toggle"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => onToggle(id)}
        >
          <span className="methodology-section__num">{num}</span>
          <span className="methodology-section__toggle-text">{title}</span>
          <span className="methodology-section__chevron" aria-hidden="true" />
        </button>
      </h2>
      <div
        id={contentId}
        className="methodology-section__content"
        hidden={!open}
      >
        {children}
      </div>
    </section>
  )
}

export default CollapsibleSection
