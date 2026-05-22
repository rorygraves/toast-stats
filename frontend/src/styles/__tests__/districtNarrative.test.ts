import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/* #572 — guards the CSS contract for the District narrative chrome.
   Smooth-scroll and reduced-motion are CSS-only behaviours, not
   testable through DOM assertions in JSDOM, but the regex below is
   load-bearing for the prefers-reduced-motion a11y requirement and
   the sticky-positioning hook. Keep it strict. */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const cssPath = resolve(__dirname, '../components/district-narrative.css')
const css = readFileSync(cssPath, 'utf-8')

describe('district-narrative.css (#572)', () => {
  it('scopes scroll-behavior:smooth to .district-detail-page-root', () => {
    expect(css).toMatch(
      /\.district-detail-page-root\s*\{[^}]*scroll-behavior:\s*smooth/
    )
  })

  it('disables scroll-behavior when prefers-reduced-motion: reduce', () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
    // The reduced-motion override targets the same selector and resets
    // the behaviour to `auto`.
    const reducedBlock = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\s{2}\}/
    )
    expect(reducedBlock).not.toBeNull()
    expect(reducedBlock?.[0]).toMatch(/\.district-detail-page-root/)
    expect(reducedBlock?.[0]).toMatch(/scroll-behavior:\s*auto/)
  })

  it('pins the KPI strip with position:sticky under the topbar', () => {
    expect(css).toMatch(/\.district-kpi-strip\s*\{[^}]*position:\s*sticky/)
    expect(css).toMatch(/\.district-kpi-strip\s*\{[^}]*top:\s*56px/)
  })

  it('hides the strip toggle chevron at tablet+', () => {
    expect(css).toMatch(
      /@media\s*\(min-width:\s*768px\)[\s\S]*\.district-kpi-strip__toggle[\s\S]*?display:\s*none/
    )
  })

  it('hides the anchor TOC below the lg breakpoint', () => {
    // Base rule sets display:none; the lg+ media query overrides to block.
    expect(css).toMatch(/\.district-anchor-toc\s*\{[\s\S]*?display:\s*none/)
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1024px\)[\s\S]*\.district-anchor-toc\s*\{[\s\S]*?display:\s*block/
    )
  })
})
