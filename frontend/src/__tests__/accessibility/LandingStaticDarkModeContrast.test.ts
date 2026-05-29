/**
 * Landing + static-page dark-mode contrast audit (#611, epic #574 Track D).
 *
 * The catch-all Track D sweep: the Landing page (`/`, DistrictsPage), the
 * Methodology page, and the History page must reach dark-mode parity. Like the
 * Awards (#608) and Region (#609) audits, this reads the *actual* CSS rather
 * than relying on jest-axe (which can't compute contrast in jsdom — no layout).
 *
 * These three surfaces are styled with semantic component CSS (`.methodology-*`,
 * `.placeholder-page__*`, `.districts-page-header__*`, `.history-page-*`), so
 * the resolver walks each rule's token through the `[data-theme='dark']` map
 * and computes the ratio against the dark background the element actually sits
 * on. A scoped `[data-theme='dark'] <selector>` override wins over the base.
 *
 * It is falsifiable. Before the #611 fix these fail — all are raw palette
 * tokens with NO dark remap (the #608/#609 trap, Lessons 093/094):
 *   - Methodology/History eyebrow (`--maroon-500` #7b1828) → 1.69:1 on surface
 *   - History "current year" chip text (`--loyal-500` #004165) on the dark
 *     `--loyal-50` pill (#112432) → navy-on-navy, ~1.3:1
 *   - Landing "what changed since last visit" diff-strip text/strong/time
 *     (`--loyal-600`/`--loyal-700`/`--loyal-500`, all undefined in dark) on the
 *     same dark `--loyal-50` pill → navy-on-navy
 *
 * Lives in `__tests__/accessibility/` so it routes to the integration project
 * (Lesson 090). Pure computation, so it's fast.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { calculateContrastRatio } from '../../utils/contrastCalculator'

const here = dirname(fileURLToPath(import.meta.url))
const stylesDir = resolve(here, '../../styles')

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const read = (p: string) =>
  stripComments(readFileSync(resolve(stylesDir, p), 'utf8'))

const redesignCss = read('tokens/redesign.css')
const darkModeCss = read('dark-mode.css')
const appShellCss = read('components/app-shell.css')

/** Parse `--name: value;` declarations from the first rule whose selector
 *  matches `selectorLiteral` exactly. Anchored to a real rule start so a
 *  comment mentioning the selector can't poison the match (Lesson 093). */
function parseTokenBlock(css: string, selectorLiteral: string) {
  const re = new RegExp(
    '(?:^|\\n)\\s*' +
      selectorLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\{'
  )
  const m = re.exec(css)
  if (!m) return new Map<string, string>()
  const open = css.indexOf('{', m.index)
  const close = css.indexOf('}', open)
  const map = new Map<string, string>()
  for (const d of css
    .slice(open + 1, close)
    .matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))
    map.set(d[1].trim(), d[2].trim())
  return map
}

const lightTokens = parseTokenBlock(redesignCss, ':root')
const darkTokens = new Map([
  ...parseTokenBlock(redesignCss, "[data-theme='dark']"),
  ...parseTokenBlock(darkModeCss, "[data-theme='dark']"),
])

/** Resolve a `var(--x)` chain to a literal (hex or rgba) in dark mode. */
function resolveVar(value: string, depth = 0): string {
  if (depth > 8) throw new Error(`var() too deep: ${value}`)
  const v = value.trim()
  const m = v.match(/^var\((--[\w-]+)\)$/)
  if (!m) return v
  const next = darkTokens.get(m[1]) ?? lightTokens.get(m[1])
  if (!next) throw new Error(`token ${m[1]} undefined`)
  return resolveVar(next, depth + 1)
}

/** Value of `prop` from the first rule matching `<prefix><selector> { … }`,
 *  where prefix is `[data-theme='dark'] ` for the dark override or '' for the
 *  base rule. Returns null if no such rule. */
function ruleValue(
  css: string,
  prefix: string,
  selector: string,
  prop: string
): string | null {
  const re = new RegExp(
    prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '(?![\\w-])[^{}]*\\{'
  )
  const m = re.exec(css)
  if (!m) return null
  const open = css.indexOf('{', m.index)
  const close = css.indexOf('}', open)
  const pm = css
    .slice(open + 1, close)
    .match(new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;!]+)'))
  return pm ? pm[1].trim() : null
}

/** Effective dark-mode value of `prop` for a component selector: its scoped
 *  `[data-theme='dark']` override if present, else the base rule's value —
 *  both resolved through the dark token map. */
function effectiveDark(css: string, selector: string, prop: string): string {
  const override = ruleValue(css, "[data-theme='dark'] ", selector, prop)
  const base = ruleValue(css, '', selector, prop)
  const raw = override ?? base
  if (!raw) throw new Error(`no rule for ${selector} { ${prop} }`)
  return resolveVar(raw)
}

const surface = resolveVar('var(--surface)') // #111922 page surface

describe('Landing + static pages dark-mode contrast (#611)', () => {
  // --- Methodology + History eyebrow (shared .placeholder-page__eyebrow) ---
  it('placeholder-page eyebrow clears AA on the dark surface', () => {
    // Base `color: var(--maroon-500)` (#7b1828) has no dark remap → 1.69:1.
    // Fix mirrors #609's .districts-page-header__eyebrow scoped lightened maroon.
    const fg = effectiveDark(appShellCss, '.placeholder-page__eyebrow', 'color')
    const ratio = calculateContrastRatio(fg, surface)
    expect(
      ratio,
      `eyebrow ${fg} on ${surface} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  // --- History "current year" chip: loyal-blue text on the dark loyal-50 pill ---
  it('history current-year chip text clears AA on its pill', () => {
    const bg = effectiveDark(
      appShellCss,
      '.history-page-year-chip--current',
      'background-color'
    )
    const fg = effectiveDark(
      appShellCss,
      '.history-page-year-chip--current',
      'color'
    )
    const ratio = calculateContrastRatio(fg, bg)
    expect(
      ratio,
      `current chip ${fg} on ${bg} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  // --- Landing "what changed since last visit" diff-strip on the loyal-50 pill ---
  const DIFF_STRIP: ReadonlyArray<{ name: string; selector: string }> = [
    { name: 'body text', selector: '.districts-page-header__diff-strip' },
    {
      name: 'strong (date label)',
      selector: '.districts-page-header__diff-strip strong',
    },
    {
      name: 'time (snapshot date)',
      selector: '.districts-page-header__diff-strip time',
    },
  ]

  it.each(DIFF_STRIP)(
    'diff-strip $name clears AA on its pill',
    ({ selector }) => {
      const bg = effectiveDark(
        appShellCss,
        '.districts-page-header__diff-strip',
        'background-color'
      )
      const fg = effectiveDark(appShellCss, selector, 'color')
      const ratio = calculateContrastRatio(fg, bg)
      expect(
        ratio,
        `${selector} ${fg} on ${bg} = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5)
    }
  )

  // --- No-regression anchors: things that already pass must keep passing. ---
  const ALREADY_OK: ReadonlyArray<{ name: string; selector: string }> = [
    { name: 'methodology link', selector: '.methodology-link' },
    { name: 'methodology body', selector: '.methodology-section' },
    {
      name: 'methodology TOC title (muted)',
      selector: '.methodology-toc__title',
    },
    { name: 'placeholder body', selector: '.placeholder-page__body' },
    { name: 'placeholder title', selector: '.placeholder-page__title' },
    { name: 'long-text lede', selector: '.long-text-lede' },
  ]

  it.each(ALREADY_OK)('$name clears AA on the dark surface', ({ selector }) => {
    const fg = effectiveDark(appShellCss, selector, 'color')
    const ratio = calculateContrastRatio(fg, surface)
    expect(
      ratio,
      `${selector} ${fg} on ${surface} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('history "· LIVE" green marker clears AA on the dark surface', () => {
    const fg = effectiveDark(
      appShellCss,
      '.history-page-year-chip__live',
      'color'
    )
    const ratio = calculateContrastRatio(fg, surface)
    expect(
      ratio,
      `live marker ${fg} on ${surface} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  // Methodology callouts + code blocks (AC item) sit on their OWN tinted
  // surfaces, not the page surface — so anchor each against the surface it
  // actually renders on. These already use remapping semantic tokens; the
  // anchors harden against a future regression.
  const ON_OWN_SURFACE: ReadonlyArray<{
    name: string
    selector: string
    bgVar: string
  }> = [
    {
      name: 'methodology code block',
      selector: '.methodology-section code',
      bgVar: 'var(--surface-3)',
    },
    {
      name: 'districts methodology callout body',
      selector: '.districts-methodology-callout',
      bgVar: 'var(--surface-2)',
    },
    {
      name: 'districts methodology callout link',
      selector: '.districts-methodology-callout__link',
      bgVar: 'var(--surface-2)',
    },
  ]

  it.each(ON_OWN_SURFACE)(
    '$name clears AA on its surface',
    ({ selector, bgVar }) => {
      const bg = resolveVar(bgVar)
      const fg = effectiveDark(appShellCss, selector, 'color')
      const ratio = calculateContrastRatio(fg, bg)
      expect(
        ratio,
        `${selector} ${fg} on ${bg} = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5)
    }
  )
})
