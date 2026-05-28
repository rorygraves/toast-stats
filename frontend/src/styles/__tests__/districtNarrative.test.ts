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

  it('hides the strip toggle chevron at the 980px desktop threshold (#682)', () => {
    // #682 reconciled the strip's desktop threshold from 768 to the handoff's
    // 980px 2-col-collapse point so the whole district surface shares one
    // breakpoint system. Below 980 the collapse chevron is available.
    expect(css).toMatch(
      /@media\s*\(min-width:\s*980px\)[\s\S]*\.district-kpi-strip__toggle[\s\S]*?display:\s*none/
    )
  })

  it('defaults the KPI card grid to 2 columns (2×2) on mobile (#866)', () => {
    // #866 — at <768px the 4-card strip was a 1×4 vertical stack. The base
    // grid (no min-width gate) must declare 2 columns so phones get 2×2,
    // halving the strip's vertical footprint. The 4-across desktop layout is
    // still gated behind the 980px threshold (asserted below).
    const baseBlock = css.match(/\.district-kpi-strip__cards\s*\{[^}]*\}/)
    expect(baseBlock).not.toBeNull()
    expect(baseBlock?.[0]).toMatch(
      /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
    )
  })

  it('keeps the 4-across strip gated at the 980px threshold (#866, no regression)', () => {
    expect(css).toMatch(
      /@media\s*\(min-width:\s*980px\)[\s\S]*?\.district-kpi-strip__cards[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/
    )
  })

  it('gives the collapse toggle a ≥44px touch target (#866, WCAG 2.5.5)', () => {
    const toggleBlock = css.match(/\.district-kpi-strip__toggle\s*\{[^}]*\}/)
    expect(toggleBlock).not.toBeNull()
    expect(toggleBlock?.[0]).toMatch(/width:\s*44px/)
    expect(toggleBlock?.[0]).toMatch(/height:\s*44px/)
  })

  it('no longer ships the anchor-TOC rail chrome (#679 — rail deleted)', () => {
    // The "On this page" right rail was removed when the hub went lean
    // (ADR-005 §5); DistrictSubnav now owns wayfinding at every width, so
    // the rail's CSS — and the two-column gutter grid that only existed to
    // host it — must be gone, not just hidden.
    expect(css).not.toMatch(/\.district-anchor-toc/)
    expect(css).not.toMatch(/\.district-detail-page__layout/)
  })
})
