/**
 * Clubs-table column-model contrast audit (#672, epic #665 Sprint 6 — the
 * a11y + verification pass).
 *
 * Sprint 4's audit (ClubsControlsDarkModeContrast) covered the controls row
 * (segmented filter, chips, filter popover). This one covers the TABLE GRID
 * combos introduced in Sprint 2/3 that no audit guards yet: the tier pills,
 * the status (health) pills, the inline DCP bar, the sticky column header, and
 * the muted cell/value text — in BOTH themes.
 *
 * Like its siblings it reads the *real* CSS instead of leaning on jest-axe,
 * which auto-disables `color-contrast` under jsdom (no layout engine — lesson
 * 075). It resolves each foreground through the `[data-theme='dark']` cascade
 * (clubs pills/bar carry their dark overrides in app-shell.css, NOT
 * dark-mode.css — so the override scan reads that file). Falsifiable: see the
 * `__falsifiability__` block, which re-checks a deliberately-broken value goes
 * red, proving the audit can fail for the defect it claims to guard (lesson
 * 107 — a green audit that stays green when you re-introduce the bug is a false
 * guarantee).
 *
 * The matcher scopes to RESTING-state rules: `ruleProp`/`darkOverride` anchor
 * to the base selector and the override scan bounds with `(?![\w-:])`, so a
 * `:hover`/`:focus` rule can't shadow the at-rest colour the audit is about
 * (lesson 107). Lives in `__tests__/accessibility/` → integration project
 * (lesson 090). Pure computation, so it's fast.
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

/** Parse `--name: value;` from the first rule matching `selectorLiteral`
 *  exactly, anchored to a real rule start (lesson 093). */
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

/** Resolve a `var(--x)` chain to a literal hex, in the requested theme. */
function resolveVar(value: string, theme: 'light' | 'dark', depth = 0): string {
  if (depth > 8) throw new Error(`var() too deep: ${value}`)
  const v = value.trim()
  const m = v.match(/^var\((--[\w-]+)\)$/)
  if (!m) return v
  const map = theme === 'dark' ? darkTokens : lightTokens
  const next =
    theme === 'dark' ? (map.get(m[1]) ?? lightTokens.get(m[1])) : map.get(m[1])
  if (!next) throw new Error(`token ${m[1]} undefined in ${theme}`)
  return resolveVar(next, theme, depth + 1)
}

/** Value of `prop` from the base (resting) rule whose selector matches
 *  `selectorLiteral` exactly. Anchored to the rule start; throws if missing so
 *  a renamed surface fails loudly rather than silently passing. */
function ruleProp(css: string, selectorLiteral: string, prop: string): string {
  const re = new RegExp(
    '(?:^|\\n)\\s*' +
      selectorLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\{'
  )
  const m = re.exec(css)
  if (!m) throw new Error(`rule ${selectorLiteral} not found`)
  const open = css.indexOf('{', m.index)
  const close = css.indexOf('}', open)
  const body = css.slice(open + 1, close)
  const pm = body.match(
    new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;!]+)')
  )
  if (!pm) throw new Error(`prop ${prop} not in rule ${selectorLiteral}`)
  return pm[1].trim()
}

/** Value of `prop` from the cascade-winning `[data-theme='dark'] <selector>`
 *  rule in `css` (last-wins, lesson 095). The trailing `(?![\w-:])` keeps the
 *  match to the base selector — a `:hover` override can't shadow the resting
 *  value (lesson 107). Null if there is no dark override. */
function darkOverride(
  css: string,
  selector: string,
  prop: string
): string | null {
  const re = new RegExp(
    "\\[data-theme='dark'\\]\\s*" +
      selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '(?![\\w-:])[^{}]*\\{',
    'g'
  )
  let winner: string | null = null
  for (const m of css.matchAll(re)) {
    const open = css.indexOf('{', m.index)
    const close = css.indexOf('}', open)
    const pm = css
      .slice(open + 1, close)
      .match(new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;!]+)'))
    if (pm) winner = pm[1].trim()
  }
  return winner
}

/** The cascade-winning background-color for a clubs selector in `theme`,
 *  honouring a `[data-theme='dark']` override in app-shell.css if present. */
function bgFor(selector: string, theme: 'light' | 'dark'): string {
  const base = ruleProp(appShellCss, selector, 'background-color')
  if (theme === 'light') return resolveVar(base, 'light')
  const override = darkOverride(appShellCss, selector, 'background-color')
  return resolveVar(override ?? base, 'dark')
}

const AA = 4.5 // normal text
const AA_GRAPHIC = 3.0 // non-text graphical objects / large text (WCAG 1.4.11 / 1.4.3)

describe('Clubs-table column-model contrast (#672)', () => {
  // ── Text on the table surfaces, both themes ──────────────────────────────
  // Resting muted text (col header, cell-muted, dcp numeral, panel empty-state
  // copy) is --ink-3; primary cell text is --ink. The sticky header sits on
  // --surface-2; rows on --surface (hover --surface-3, audited separately).
  const TEXT: ReadonlyArray<{
    name: string
    fg: [string, string]
    bgToken: string
  }> = [
    {
      name: 'sticky column header label (--ink-3 on --surface-2)',
      fg: ['.clubs-col-header', 'color'],
      bgToken: 'var(--surface-2)',
    },
    {
      name: 'primary cell text (--ink on --surface)',
      fg: ['#clubs-table td', 'color'],
      bgToken: 'var(--surface)',
    },
    {
      name: 'muted cell text (--ink-3 on --surface)',
      fg: ['.clubs-cell-muted', 'color'],
      bgToken: 'var(--surface)',
    },
    {
      name: 'muted cell text on hovered row (--ink-3 on --surface-3)',
      fg: ['.clubs-cell-muted', 'color'],
      bgToken: 'var(--surface-3)',
    },
    {
      name: 'DCP numeral (--ink-3 on --surface)',
      fg: ['.clubs-dcp-cell__val', 'color'],
      bgToken: 'var(--surface)',
    },
    {
      name: 'panel muted / empty-state copy (--ink-3 on --surface)',
      fg: ['.clubs-text-muted', 'color'],
      bgToken: 'var(--surface)',
    },
  ]

  it.each(TEXT)('$name clears AA in both themes', ({ fg, bgToken }) => {
    const fgToken = ruleProp(appShellCss, fg[0], fg[1])
    for (const theme of ['light', 'dark'] as const) {
      const fgHex = resolveVar(fgToken, theme)
      const bgHex = resolveVar(bgToken, theme)
      const ratio = calculateContrastRatio(fgHex, bgHex)
      expect(
        ratio,
        `${fg[0]} ${fgHex} on ${bgToken} ${bgHex} (${theme}) = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(AA)
    }
  })

  // ── Tier pills: white text on a solid fill, both themes ──────────────────
  // Distinguished pins to the light-mode green in dark (the dark --green-600
  // #22c55e fails white text — lesson 095); the others carry no dark remap.
  const TIER_PILLS = [
    '.clubs-tier-pill--smedley',
    '.clubs-tier-pill--presidents',
    '.clubs-tier-pill--select',
    '.clubs-tier-pill--distinguished',
  ] as const

  it('tier pills carry white text', () => {
    expect(ruleProp(appShellCss, '.clubs-tier-pill', 'color')).toBe('#fff')
  })

  it.each(TIER_PILLS)(
    '%s: white text clears AA on its fill both themes',
    sel => {
      for (const theme of ['light', 'dark'] as const) {
        const bg = bgFor(sel, theme)
        const ratio = calculateContrastRatio('#ffffff', bg)
        expect(
          ratio,
          `${sel} #ffffff on ${bg} (${theme}) = ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(AA)
      }
    }
  )

  // Projected/provisional: dark text on a yellow stripe. Yellow tokens have no
  // dark remap, so worst case is the darker stripe band (--yellow-600) in
  // either theme.
  it('projected tier pill: dark text clears AA on the darker stripe band', () => {
    const fg = resolveVar(
      ruleProp(appShellCss, '.clubs-tier-pill--projected', 'color'),
      'light'
    )
    const darkerBand = resolveVar('var(--yellow-600)', 'light')
    const ratio = calculateContrastRatio(fg, darkerBand)
    expect(
      ratio,
      `projected ${fg} on --yellow-600 ${darkerBand} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(AA)
  })

  // ── Status (health) pills: soft tint + saturated text, theme-invariant ───
  // Literal hex pairs (matching the mobile ClubCard so the datum reads
  // identically). No dark override by design, so the pair is self-contained.
  const STATUS_PILLS = [
    '.clubs-status-pill--thriving',
    '.clubs-status-pill--vulnerable',
    '.clubs-status-pill--intervention',
  ] as const

  it.each(STATUS_PILLS)('%s: text clears AA on its tint', sel => {
    const fg = ruleProp(appShellCss, sel, 'color')
    const bg = ruleProp(appShellCss, sel, 'background-color')
    const ratio = calculateContrastRatio(fg, bg)
    expect(
      ratio,
      `${sel} ${fg} on ${bg} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(AA)
  })

  // ── DCP inline bar: fill vs track is a graphical 3:1 (not text) ──────────
  it('DCP bar fill is visible against its track (graphical 3:1) both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      const fill = bgFor('.clubs-dcp-bar__fill', theme)
      const track = bgFor('.clubs-dcp-bar', theme)
      const ratio = calculateContrastRatio(fill, track)
      expect(
        ratio,
        `DCP fill ${fill} on track ${track} (${theme}) = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(AA_GRAPHIC)
    }
  })

  // ── Sort-direction caret: a graphical state indicator (3:1) ──────────────
  it('column-header sort caret clears graphical 3:1 on the sticky header both themes', () => {
    const fgToken = ruleProp(appShellCss, '.clubs-col-header__arrow', 'color')
    for (const theme of ['light', 'dark'] as const) {
      const fg = resolveVar(fgToken, theme)
      const bg = resolveVar('var(--surface-2)', theme)
      const ratio = calculateContrastRatio(fg, bg)
      expect(
        ratio,
        `caret ${fg} on --surface-2 ${bg} (${theme}) = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(AA_GRAPHIC)
    }
  })

  // ── Falsifiability proof (lesson 107) ────────────────────────────────────
  // The audit above is only trustworthy if it CAN go red. Re-run the core
  // check with a known-bad foreground (white text on the dark --green-600
  // #22c55e the distinguished pill deliberately avoids) and confirm it fails
  // AA — proving the assertions aren't hollow.
  it('__falsifiability__ a known-bad combo is caught', () => {
    const badGreen = resolveVar('var(--green-600)', 'dark') // #22c55e
    const ratio = calculateContrastRatio('#ffffff', badGreen)
    expect(ratio, `white on ${badGreen} should fail AA`).toBeLessThan(AA)
  })
})
