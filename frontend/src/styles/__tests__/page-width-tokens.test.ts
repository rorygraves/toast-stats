import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/* #810 (epic #813, Epic A Sprint 2) — full-width container policy for the two
   data-table pages, per ADR-006 §1.

   The 1280px cap is a prose-readability rule misapplied to a data grid. This
   sprint introduces a `--page-max-wide` (1600px) token and applies it to the
   district landing (`.districts-page`) and district-detail / clubs
   (`.district-detail-page`) page containers. Prose / chrome containers
   (`.app-shell__page`, `.placeholder-page`, the footer) keep the 1280 cap.

   These are source-text guards (cf. rt-brand-v1.test.ts): jsdom has no layout,
   so the real 1440/1920 + dark-mode + CLS verification runs in Playwright on
   the PR preview (Full DoD). What these guards lock is the *wiring contract* —
   the token is defined, both table pages reference it (R10: one token, no
   per-component width hacks), and the prose pages are deliberately left narrow. */

const __dirname = dirname(fileURLToPath(import.meta.url))
const redesignTokensPath = resolve(__dirname, '../tokens/redesign.css')
const appShellPath = resolve(__dirname, '../components/app-shell.css')

const redesignCss = readFileSync(redesignTokensPath, 'utf-8')
const appShellCss = readFileSync(appShellPath, 'utf-8')

describe('full-width data-table page policy (#810, ADR-006 §1)', () => {
  it('redesign.css declares --page-max-wide: 1600px in :root', () => {
    expect(redesignCss).toMatch(/--page-max-wide:\s*1600px/)
  })

  it('the district landing page (.districts-page) uses the wide token', () => {
    // Targets the exact `.districts-page {` rule, not `.districts-page-root`
    // / `.districts-page-header` (next char after `page` is `-`, not `{`).
    expect(appShellCss).toMatch(
      /\.districts-page\s*\{[^}]*max-width:\s*var\(--page-max-wide\)/
    )
  })

  it('the district-detail (clubs) page uses the wide token', () => {
    expect(appShellCss).toMatch(
      /\.district-detail-page\s*\{[^}]*max-width:\s*var\(--page-max-wide\)/
    )
  })

  it('prose / chrome containers keep the 1280px cap (not widened)', () => {
    expect(appShellCss).toMatch(
      /\.app-shell__page\s*\{[^}]*max-width:\s*1280px/
    )
    expect(appShellCss).toMatch(
      /\.placeholder-page\s*\{[^}]*max-width:\s*1280px/
    )
    expect(appShellCss).toMatch(
      /\.app-shell-footer__inner\s*\{[^}]*max-width:\s*1280px/
    )
  })
})
