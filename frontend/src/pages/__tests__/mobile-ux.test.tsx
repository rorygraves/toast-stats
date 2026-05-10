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

// ---- Issue #85: Sticky table columns ----

describe('Issue #85 — Sticky table columns on mobile', () => {
  it('DistrictsPage should have sticky classes on Rank column', () => {
    const source = fs.readFileSync(
      path.join(SRC_DIR, 'pages', 'DistrictsPage.tsx'),
      'utf-8'
    )
    expect(source).toMatch(/sticky.*left-0/)
  })

  it('DistrictsPage should have sticky classes on District column', () => {
    const source = fs.readFileSync(
      path.join(SRC_DIR, 'pages', 'DistrictsPage.tsx'),
      'utf-8'
    )
    expect(source).toMatch(/sticky.*left-\[/)
  })

  it('index.css should define .sticky-column-shadow class', () => {
    const css = fs.readFileSync(path.join(SRC_DIR, 'index.css'), 'utf-8')
    expect(css).toContain('.sticky-column-shadow')
  })
})

// ---- Issue #87: Export button compact on mobile ----

describe('Issue #87 — Export button icon-only on mobile', () => {
  it('DistrictExportButton should hide text labels on mobile via hidden sm:inline', () => {
    const source = fs.readFileSync(
      path.join(SRC_DIR, 'components', 'DistrictExportButton.tsx'),
      'utf-8'
    )
    expect(source).toMatch(/hidden\s+sm:inline/)
  })
})
