/**
 * Redesign Token System Structure Tests (#353)
 *
 * Validates that the 2026 design-handoff token set is present alongside
 * the existing tm-* tokens, scoped under the manual [data-theme='dark']
 * toggle (NOT prefers-color-scheme), and wired into index.css.
 *
 * Tokens are sourced from the design handoff README under "Design Tokens".
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const FRONTEND_SRC = resolve(__dirname, '../..')
const FRONTEND_ROOT = resolve(__dirname, '../../..')

const readSrc = (p: string) => readFileSync(resolve(FRONTEND_SRC, p), 'utf-8')
const readRoot = (p: string) => readFileSync(resolve(FRONTEND_ROOT, p), 'utf-8')

describe('Redesign token system (#353)', () => {
  describe('redesign.css file', () => {
    it('exists at styles/tokens/redesign.css', () => {
      expect(
        existsSync(resolve(FRONTEND_SRC, 'styles/tokens/redesign.css'))
      ).toBe(true)
    })

    it('defines the loyal palette (50/100/200/400/500/600/700) at :root', () => {
      const css = readSrc('styles/tokens/redesign.css')
      const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)
      expect(root).toBeTruthy()
      const block = root?.[1] ?? ''
      expect(block).toMatch(/--loyal-50:\s*#e6eef3/i)
      expect(block).toMatch(/--loyal-100:\s*#cbdde7/i)
      expect(block).toMatch(/--loyal-200:\s*#9ebccb/i)
      expect(block).toMatch(/--loyal-400:\s*#2c6e90/i)
      expect(block).toMatch(/--loyal-500:\s*#004165/i)
      expect(block).toMatch(/--loyal-600:\s*#003352/i)
      expect(block).toMatch(/--loyal-700:\s*#002438/i)
    })

    it('defines the maroon, yellow, green, red status palettes', () => {
      const css = readSrc('styles/tokens/redesign.css')
      expect(css).toMatch(/--maroon-500:\s*#7B1828/i)
      expect(css).toMatch(/--maroon-600:\s*#5a1120/i)
      expect(css).toMatch(/--yellow-300:\s*#f9ecaa/i)
      expect(css).toMatch(/--yellow-500:\s*#F2DF74/i)
      expect(css).toMatch(/--yellow-600:\s*#c9b748/i)
      expect(css).toMatch(/--green-500:\s*#16a34a/i)
      expect(css).toMatch(/--green-600:\s*#15803d/i)
      expect(css).toMatch(/--red-500:\s*#dc2626/i)
      expect(css).toMatch(/--red-600:\s*#b91c1c/i)
    })

    it('defines surface, line, ink, link tokens for light mode at :root', () => {
      const css = readSrc('styles/tokens/redesign.css')
      const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)
      const block = root?.[1] ?? ''
      expect(block).toMatch(/--bg:\s*#f6f7f8/i)
      expect(block).toMatch(/--surface:\s*#ffffff/i)
      expect(block).toMatch(/--surface-2:\s*#f9fafb/i)
      expect(block).toMatch(/--surface-3:\s*#f1f3f5/i)
      expect(block).toMatch(/--line:\s*#e5e7eb/i)
      expect(block).toMatch(/--line-2:\s*#eceef0/i)
      expect(block).toMatch(/--ink:\s*#0f1720/i)
      expect(block).toMatch(/--ink-2:\s*#344052/i)
      expect(block).toMatch(/--ink-3:\s*#5b6675/i)
      expect(block).toMatch(/--ink-4:\s*#8b94a3/i)
      expect(block).toMatch(/--link:\s*var\(--loyal-500\)/i)
    })

    it('defines redesign typography stacks (serif, sans, mono)', () => {
      const css = readSrc('styles/tokens/redesign.css')
      expect(css).toMatch(/--serif:\s*['"]?Montserrat['"]?/)
      expect(css).toMatch(/--sans:\s*['"]?Source Sans 3['"]?/)
      expect(css).toMatch(/--mono:\s*['"]?JetBrains Mono['"]?/)
    })

    it('defines radii (sm 6, md 8, lg 12) — namespaced to avoid conflict with @theme --radius-sm 4', () => {
      const css = readSrc('styles/tokens/redesign.css')
      // --rds- prefix avoids colliding with the existing --radius-sm: 4px
      // already declared in @theme (Tailwind utility radius scale).
      // --rds-radius-md (not bare --rds-radius) matches the existing
      // --tm-radius-sm/md/lg/xl convention in spacing.css.
      expect(css).toMatch(/--rds-radius-sm:\s*6px/)
      expect(css).toMatch(/--rds-radius-md:\s*8px/)
      expect(css).toMatch(/--rds-radius-lg:\s*12px/)
    })

    it('defines shadow tokens — namespaced to avoid Tailwind shadow utility collision', () => {
      const css = readSrc('styles/tokens/redesign.css')
      // Use --rds- prefix; --shadow-sm / --shadow / --shadow-lg would clash with
      // Tailwind v4 shadow utility tokens.
      expect(css).toMatch(
        /--rds-shadow-sm:\s*0 1px 2px rgba\(15,\s*23,\s*32,\s*\.04\)/
      )
      expect(css).toMatch(/--rds-shadow:/)
      expect(css).toMatch(/--rds-shadow-lg:/)
    })

    it('uses MANUAL [data-theme="dark"] toggle for the dark block (not prefers-color-scheme)', () => {
      const css = readSrc('styles/tokens/redesign.css')
      expect(css).toMatch(/\[data-theme=['"]dark['"]\]\s*\{/)
      expect(css).not.toMatch(/@media\s*\(\s*prefers-color-scheme/)
    })

    it('overrides surface, line, ink, link, and selected loyal tokens in the dark block', () => {
      const css = readSrc('styles/tokens/redesign.css')
      const dark = css.match(/\[data-theme=['"]dark['"]\]\s*\{([\s\S]*?)\n\}/)
      expect(dark).toBeTruthy()
      const block = dark?.[1] ?? ''
      expect(block).toMatch(/--bg:\s*#0a0f15/i)
      expect(block).toMatch(/--surface:\s*#111922/i)
      expect(block).toMatch(/--surface-2:\s*#161f2a/i)
      expect(block).toMatch(/--surface-3:\s*#1a2330/i)
      expect(block).toMatch(/--line:\s*#1f2a38/i)
      expect(block).toMatch(/--line-2:\s*#25313f/i)
      expect(block).toMatch(/--ink:\s*#eef2f7/i)
      expect(block).toMatch(/--ink-2:\s*#c8d1dd/i)
      expect(block).toMatch(/--ink-3:\s*#8a96a6/i)
      expect(block).toMatch(/--ink-4:\s*#5d6878/i)
      expect(block).toMatch(/--link:\s*#60a5d8/i)
      expect(block).toMatch(/--loyal-50:\s*#112432/i)
      expect(block).toMatch(/--loyal-100:\s*#16344a/i)
      expect(block).toMatch(/--loyal-200:\s*#1c4866/i)
    })
  })

  describe('integration with index.css', () => {
    it('index.css imports tokens/redesign.css', () => {
      const css = readSrc('index.css')
      expect(css).toMatch(/@import\s+['"]\.\/styles\/tokens\/redesign\.css['"]/)
    })

    it('redesign tokens are imported alongside existing tm-* tokens (not replacing them)', () => {
      const css = readSrc('index.css')
      // Both must remain — page-by-page migration in later sprints
      expect(css).toMatch(/@import\s+['"]\.\/styles\/tokens\/colors\.css['"]/)
      expect(css).toMatch(/@import\s+['"]\.\/styles\/tokens\/redesign\.css['"]/)
    })
  })

  describe('font loading via index.html', () => {
    it('loads Montserrat with weights 500/600/700/800 (handoff requirement)', () => {
      const html = readRoot('index.html')
      // Handoff requires Montserrat 500;600;700;800 (currently only 500;700;900).
      // The redesign needs 600 (tabs/labels) and 800 (h1/brand mark) specifically.
      const montserrat = html.match(/family=Montserrat:wght@([0-9;]+)/g)
      expect(montserrat).toBeTruthy()
      const allWeights = (montserrat ?? []).join(';')
      expect(allWeights).toContain('600')
      expect(allWeights).toContain('800')
    })

    it('loads Source Sans 3 with weight 500 in addition to existing weights', () => {
      const html = readRoot('index.html')
      const sourceSans = html.match(/family=Source\+Sans\+3:wght@([0-9;]+)/g)
      expect(sourceSans).toBeTruthy()
      const allWeights = (sourceSans ?? []).join(';')
      expect(allWeights).toContain('500')
    })

    it('declares the --mono token but defers JetBrains Mono font preload (cost + CLS)', () => {
      // The --mono token in redesign.css references JetBrains Mono so future
      // consumers can use it, but the actual font preload is held until
      // Phase 2 of #339 (chrome migration to --rt-* tokens). Originally
      // deferred under #354 for cost reasons (~25KB + one stylesheet RTT);
      // #339 Phase 1 briefly enabled the preload to honor the brand-font
      // set, but Lighthouse on PR #595 caught a CLS regression
      // (0.012 → 0.199, threshold 0.1) — `var(--mono)` has 8 consumers
      // in app-shell.css and they layout-shift when the font swaps in
      // from ui-monospace. Re-enable in the Phase 2 PR with metric-
      // matched fallbacks (size-adjust @font-face) or self-hosted. The
      // CSS fallback chain ('JetBrains Mono', ui-monospace, monospace)
      // means callers degrade gracefully to the system mono font.
      const css = readSrc('styles/tokens/redesign.css')
      expect(css).toMatch(/--mono:\s*['"]?JetBrains Mono['"]?/)

      const html = readRoot('index.html')
      expect(html).not.toMatch(/family=JetBrains\+Mono/)
    })
  })
})
