/**
 * Re-skin guard for the clubs filter controls (#670, epic #665 Sprint 4) —
 * relocated to the FiltersPanel in #816.
 *
 * #670 established that the open column-filter controls (text / numeric /
 * categorical) carry zero legacy gray Tailwind utilities and zero baked
 * opacity-variant brand utilities (`bg-tm-loyal-blue-NN`) — the latter is the
 * lesson-073 dark trap (it inlines a light-mode rgba at build time and never
 * re-resolves under [data-theme=dark]). Sprint #816 moved those exact controls
 * out of the hidden per-column header dropdown into the FiltersPanel drawer, so
 * the guard now renders the panel — which mounts all three filter-control
 * variants at once — and fails if any rendered element still ships a legacy
 * class.
 *
 * JSDOM can't compute contrast (lesson 075) but it CAN prove which classes ship
 * — which is exactly what a "no legacy chrome left" criterion is about. The
 * resolved dark contrast of the new token-driven classes is guarded separately
 * by ClubsControlsDarkModeContrast.test.ts.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { FiltersPanel } from '../filters/FiltersPanel'
import { ColumnFilter, SortField } from '../filters/types'

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

const noop = () => {}
const panelProps = {
  isOpen: true,
  onClose: noop,
  getFilter: (_field: SortField): ColumnFilter | null => null,
  setFilter: noop,
  clearAllFilters: noop,
  activeFilterCount: 0,
}

describe('Clubs filter controls re-skin (#670, relocated to FiltersPanel #816)', () => {
  afterEach(cleanup)

  it('the open Filters panel carries zero legacy gray / opacity-variant classes', () => {
    render(<FiltersPanel {...panelProps} />)
    // text + numeric + categorical controls are all mounted in the panel
    const dialog = screen.getByRole('dialog')
    expect(offenders(dialog)).toEqual([])
  })
})
