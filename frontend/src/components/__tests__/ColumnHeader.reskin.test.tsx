/**
 * Re-skin guard for the clubs column-filter popover (#670, epic #665 Sprint 4).
 *
 * The #668 chrome re-skin (Sprint 2) deliberately left the *open* column-filter
 * popover on legacy gray Tailwind — its guard (ClubsTable.reskin.test.tsx) only
 * renders the resting header, so the closed popover's gray was out of frame. A
 * breadcrumb in app-shell.css / ColumnHeader.tsx parks it for "the controls
 * re-skin (Sprint 4 #670)". This guard opens each popover variant (text /
 * numeric / categorical) and fails if any rendered element still carries a
 * legacy `*-gray-*` utility OR a baked opacity-variant brand utility
 * (`bg-tm-loyal-blue-NN`) — the latter is the lesson-073 dark trap (it inlines a
 * light-mode rgba at build time and never re-resolves under [data-theme=dark]).
 *
 * JSDOM can't compute contrast (lesson 075) but it CAN prove which classes ship
 * — which is exactly what a "no legacy chrome left" criterion is about. The
 * resolved dark contrast of the new token-driven classes is guarded separately
 * by ClubsControlsDarkModeContrast.test.ts.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ColumnHeader } from '../ColumnHeader'
import { SortField, ColumnFilter } from '../filters/types'

const baseProps = {
  field: 'name' as SortField,
  label: 'Club Name',
  sortable: true,
  filterable: true,
  currentSort: { field: null as SortField | null, direction: 'asc' as const },
  currentFilter: null as ColumnFilter | null,
  onSort: () => {},
  onFilter: () => {},
  options: ['Active', 'Suspended'] as string[],
}

// Matches Tailwind gray utilities incl. state-variant prefixes
// (`hover:bg-gray-100`, `group-hover:text-gray-700`), but NOT brand tokens like
// `tm-cool-gray-20` (those have a non-enumerated prefix before `-gray-`).
const GRAY_CLASS =
  /(?:^|[\s:])(?:text|bg|border|divide|from|to|ring|fill|stroke)-gray-\d/

// Baked opacity-variant brand utilities — lesson 073: they inline a light-mode
// rgba and never remap in dark. The re-skin replaces these with token classes.
const OPACITY_VARIANT = /(?:^|[\s:])(?:bg|text|border)-tm-[a-z-]+-\d{2}\b/

function offenders(container: HTMLElement): string[] {
  const out: string[] = []
  container.querySelectorAll<HTMLElement>('*').forEach(el => {
    const cls = el.getAttribute('class')
    if (cls && (GRAY_CLASS.test(cls) || OPACITY_VARIANT.test(cls)))
      out.push(cls)
  })
  return out
}

const VARIANTS: ReadonlyArray<{
  name: string
  filterType: ColumnFilter['type']
}> = [
  { name: 'text (search)', filterType: 'text' },
  { name: 'numeric', filterType: 'numeric' },
  { name: 'categorical', filterType: 'categorical' },
]

describe('Clubs column-filter popover re-skin (#670)', () => {
  afterEach(cleanup)

  it.each(VARIANTS)(
    'open $name popover carries zero legacy gray / opacity-variant classes',
    ({ filterType }) => {
      const { container } = render(
        <ColumnHeader {...baseProps} filterType={filterType} />
      )
      fireEvent.click(screen.getByRole('button', { expanded: false }))
      // popover is open
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
      expect(offenders(container)).toEqual([])
    }
  )
})
