/**
 * Mobile UX Tests for Issues #85, #86, #87
 *
 * Tests mobile-specific behavior at 375px viewport:
 * - #86: Tab bar has scroll fade indicator when tabs overflow
 * - #85: Rank and District columns are sticky on horizontal scroll
 * - #87: Export button shows icon-only on mobile
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = path.resolve(__dirname, '..', '..')

// ---- Issue #86: Tab overflow indicator ----

describe('Issue #86 — Tab bar scroll fade indicator', () => {
  it('index.css should define .tab-scroll-fade class', () => {
    const css = fs.readFileSync(path.join(SRC_DIR, 'index.css'), 'utf-8')
    expect(css).toContain('.tab-scroll-fade')
  })

  it('tab-scroll-fade should use data-scrollable-right attribute for conditional fade', () => {
    const css = fs.readFileSync(path.join(SRC_DIR, 'index.css'), 'utf-8')
    expect(css).toContain('data-scrollable-right')
  })

  it('tab-scroll-fade CSS should define a gradient pseudo-element with pointer-events: none', () => {
    const css = fs.readFileSync(path.join(SRC_DIR, 'index.css'), 'utf-8')
    expect(css).toMatch(/\.tab-scroll-fade[\s\S]*?::after/)
    expect(css).toMatch(/pointer-events:\s*none/)
  })

  // Note: After #359 extracted the tab bar into <DistrictDetailTabs />, native
  // overflow-x: auto handles tab scrolling and the .tab-scroll-fade class is
  // no longer applied to the tab container in DistrictDetailPage.tsx. The CSS
  // class itself is retained for any future use. Tab behaviour coverage now
  // lives in `src/components/__tests__/DistrictDetailTabs.test.tsx`.
})

// ---- Issue #85 → #811: Sticky key column on horizontal scroll ----
// #85 originally pinned BOTH Rank and District as sticky via inline Tailwind
// (`sticky left-0` + `sticky left-[200px]`). #811 (epic #813) superseded that:
// the two-sticky pair (~380px) alone overflowed a 375px phone, and the
// `left-[200px]` magic offset was a fragile px seam (ADR-006 §3). The new model
// pins ONE sticky key column (District) via a CSS class — no hardcoded offset —
// so the row stays labelled while metric columns scroll. The #85 intent (a
// labelled, scroll-stable identity column) is preserved by the single sticky
// column; the rendered-DOM contract is covered in DistrictsPage.responsive.test.

describe('Issue #85 → #811 — single sticky key column', () => {
  it('DistrictsPage marks District as the sticky key column (not inline px sticky)', () => {
    const source = fs.readFileSync(
      path.join(SRC_DIR, 'pages', 'DistrictsPage.tsx'),
      'utf-8'
    )
    expect(source).toContain('districts-rankings-table__sticky-col')
  })

  it('app-shell.css pins the key column with position:sticky, no hardcoded left offset', () => {
    const css = fs.readFileSync(
      path.join(SRC_DIR, 'styles', 'components', 'app-shell.css'),
      'utf-8'
    )
    // The sticky key-column rule resolves position:sticky + left:0 (a token-
    // free, offset-free pin — no `left: 120px/200px` magic number seam).
    expect(css).toMatch(
      /\.districts-rankings-table__sticky-col\s*\{[\s\S]*?position:\s*sticky/
    )
    expect(css).toMatch(
      /\.districts-rankings-table__sticky-col\s*\{[\s\S]*?left:\s*0/
    )
  })

  it('index.css should define .sticky-column-shadow class', () => {
    const css = fs.readFileSync(path.join(SRC_DIR, 'index.css'), 'utf-8')
    expect(css).toContain('.sticky-column-shadow')
  })
})

// ---- Issue #87 / #676: header secondary actions are compact on mobile ----
// #87 originally shipped an icon-only-on-mobile Export button. #676 superseded
// that by moving Export + Share into a single overflow "⋯" menu, which keeps
// the header uncrowded at 375px without hiding labels (the menu shows full
// labels). The compact-on-mobile intent is preserved by the consolidation.

describe('Issue #676 — header secondary actions collapse into one overflow menu', () => {
  it('HeaderActionsMenu renders a single "More actions" trigger, not inline buttons', () => {
    const source = fs.readFileSync(
      path.join(SRC_DIR, 'components', 'HeaderActionsMenu.tsx'),
      'utf-8'
    )
    expect(source).toContain('aria-label="More actions"')
    expect(source).toContain('aria-haspopup="menu"')
  })

  it('DistrictDetailHeader uses the overflow menu instead of standalone buttons', () => {
    const source = fs.readFileSync(
      path.join(SRC_DIR, 'components', 'DistrictDetailHeader.tsx'),
      'utf-8'
    )
    expect(source).toContain('HeaderActionsMenu')
    expect(source).not.toContain('DistrictExportButton')
  })
})
