import React, { useEffect, useRef, useState } from 'react'

/* #572 — desktop-only "On this page" anchor index. Renders a sticky
   nav landmark in the right gutter of the District Detail layout
   (visibility is governed by CSS at the `lg+` breakpoint). Uses
   IntersectionObserver to mark the currently-visible section so the
   reader always sees where they are in the scroll narrative. */

export interface AnchorSection {
  id: string
  label: string
}

export interface DistrictAnchorTocProps {
  sections: AnchorSection[]
}

export const DistrictAnchorToc: React.FC<DistrictAnchorTocProps> = ({
  sections,
}) => {
  const [activeId, setActiveId] = useState<string | null>(
    sections[0]?.id ?? null
  )
  const visibleRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (sections.length === 0) return undefined

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          // Some test mocks fire without an attached target; ignore those.
          const id = entry.target?.id
          if (!id) continue
          if (entry.isIntersecting) {
            visibleRef.current.add(id)
          } else {
            visibleRef.current.delete(id)
          }
        }
        // Pick the section earliest in the configured order that is
        // currently visible. Gives a stable "first-in-frame" reading.
        const next = sections.find(s => visibleRef.current.has(s.id))
        if (next) setActiveId(next.id)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    )

    const targets: Element[] = []
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) {
        observer.observe(el)
        targets.push(el)
      }
    }
    return () => {
      observer.disconnect()
      visibleRef.current.clear()
    }
  }, [sections])

  if (sections.length === 0) return null

  return (
    <aside
      className="district-anchor-toc"
      role="navigation"
      aria-label="On this page"
    >
      <div className="district-anchor-toc__heading">On this page</div>
      <ul className="district-anchor-toc__list">
        {sections.map(s => {
          const isActive = s.id === activeId
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="district-anchor-toc__link"
                {...(isActive ? { 'aria-current': 'true' as const } : {})}
              >
                {s.label}
              </a>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
