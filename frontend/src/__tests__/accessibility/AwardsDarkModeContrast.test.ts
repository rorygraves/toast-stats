/**
 * Awards dark-mode contrast audit (#608, epic #574 Track D).
 *
 * The Awards section/route (`/awards` AwardsPage + the Districts-page Awards
 * Race section) must reach dark-mode parity with District Detail: every text
 * colour and the progress-fill graphic must clear WCAG AA on the dark surface.
 *
 * Rather than rely on jest-axe (which can't compute real contrast in jsdom —
 * no layout engine), this reads the *actual* CSS source, resolves each awards
 * foreground token through the `[data-theme='dark']` override map, and checks
 * the ratio with the shipped `contrastCalculator`. It is falsifiable: a token
 * that doesn't remap in dark (e.g. `--loyal-500` = #004165) fails here.
 *
 * Lives in `__tests__/accessibility/` so it routes to the integration project
 * (vitest.shared.mjs / Lesson 090). It's pure computation, so it's fast.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { calculateContrastRatio } from '../../utils/contrastCalculator'

const here = dirname(fileURLToPath(import.meta.url))
const stylesDir = resolve(here, '../../styles')

// Strip /* … */ comments so a brace inside prose (e.g. `--green-{500,600}`)
// can't be mistaken for a block close by the naive brace scan below.
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const tokensCss = stripComments(
  readFileSync(resolve(stylesDir, 'tokens/redesign.css'), 'utf8')
)
const appShellCss = stripComments(
  readFileSync(resolve(stylesDir, 'components/app-shell.css'), 'utf8')
)

/** Extract the `--name: value;` declarations from the first block whose
 *  selector matches `selectorLiteral` exactly (e.g. `:root`). */
function parseTokenBlock(
  css: string,
  selectorLiteral: string
): Map<string, string> {
  // Anchor to a real rule (line start + `{`) so a comment that merely mentions
  // the selector (e.g. the `[data-theme='dark']` note in the file header)
  // doesn't get parsed as the block.
  const re = new RegExp(
    '(?:^|\\n)\\s*' +
      selectorLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\{'
  )
  const m = re.exec(css)
  if (!m) throw new Error(`block ${selectorLiteral} not found`)
  const open = css.indexOf('{', m.index)
  const close = css.indexOf('}', open)
  const body = css.slice(open + 1, close)
  const map = new Map<string, string>()
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    map.set(m[1].trim(), m[2].trim())
  }
  return map
}

const lightTokens = parseTokenBlock(tokensCss, ':root')
const darkTokens = parseTokenBlock(tokensCss, "[data-theme='dark']")

/** Resolve a token (or `var(--x)` chain) to a hex string, in dark mode
 *  (dark map wins, falls back to the light :root value). */
function resolveDark(value: string, depth = 0): string {
  if (depth > 8) throw new Error(`var() resolution too deep: ${value}`)
  const v = value.trim()
  const varMatch = v.match(/^var\((--[\w-]+)\)$/)
  if (varMatch) {
    const name = varMatch[1]
    const next = darkTokens.get(name) ?? lightTokens.get(name)
    if (!next) throw new Error(`token ${name} undefined`)
    return resolveDark(next, depth + 1)
  }
  return v
}

/** Pull the value of `prop` from the first rule that names `selector` exactly
 *  (so `__status` never matches `__status--won`/`__status-dot`) and declares
 *  that property. Returns the raw declaration value (e.g. `var(--link)`). */
function declFor(css: string, selector: string, prop: string): string {
  const re = new RegExp(
    selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])',
    'g'
  )
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    const open = css.indexOf('{', m.index)
    if (open === -1) continue
    const close = css.indexOf('}', open)
    const body = css.slice(open + 1, close)
    const propMatch = body.match(
      new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;]+);')
    )
    if (propMatch) return propMatch[1].trim()
  }
  throw new Error(`no ${prop} for ${selector}`)
}

// Every awards text element → the surface it sits on. All awards cards sit on
// `--surface` (page card sets it directly; race card is transparent over the
// `--surface` `.awards-race` wrapper). isLargeText flags 18px+ or 14px+ bold.
const TEXT_ELEMENTS: ReadonlyArray<{ sel: string; large: boolean }> = [
  { sel: '.awards-race__title', large: false },
  { sel: '.awards-race__meta', large: false },
  { sel: '.awards-race-card__title', large: false },
  { sel: '.awards-race-card__description', large: false },
  { sel: '.awards-race-card__threshold', large: false },
  { sel: '.awards-race-card__leader-link', large: false },
  { sel: '.awards-race-card__leader-value', large: true },
  { sel: '.awards-race-card__status', large: false },
  { sel: '.awards-race-card__status--won', large: false },
  { sel: '.awards-race-card__empty', large: false },
  { sel: '.awards-page-card__title', large: false },
  { sel: '.awards-page-card__description', large: false },
  { sel: '.awards-page-card__achieved', large: false },
  { sel: '.awards-page-card__methodology-link', large: false },
  { sel: '.awards-page-card__rank', large: false },
  { sel: '.awards-page-card__district', large: false },
  { sel: '.awards-page-card__region', large: false },
  { sel: '.awards-page-card__value', large: false },
  { sel: '.awards-page-card__empty', large: false },
  { sel: '.awards-page__empty', large: false },
  // The AwardsPage header's "Methodology" link reuses this shared class.
  { sel: '.districts-methodology-callout__link', large: false },
]

describe('Awards section dark-mode contrast (#608)', () => {
  const surfaceDark = resolveDark('var(--surface)')

  it.each(TEXT_ELEMENTS)(
    '$sel text clears WCAG AA on the dark surface',
    ({ sel, large }) => {
      const fg = resolveDark(declFor(appShellCss, sel, 'color'))
      const ratio = calculateContrastRatio(fg, surfaceDark)
      const required = large ? 3.0 : 4.5
      expect(
        ratio,
        `${sel}: ${fg} on ${surfaceDark} = ${ratio.toFixed(2)}:1 (need ${required}:1)`
      ).toBeGreaterThanOrEqual(required)
    }
  )

  it('progress fill is visible against its track (graphical 3:1)', () => {
    const fill = resolveDark(
      declFor(
        appShellCss,
        '.awards-race-card__progress-fill',
        'background-color'
      )
    )
    const track = resolveDark(
      declFor(
        appShellCss,
        '.awards-race-card__progress-track',
        'background-color'
      )
    )
    const ratio = calculateContrastRatio(fill, track)
    expect(
      ratio,
      `progress fill ${fill} on track ${track} = ${ratio.toFixed(2)}:1 (need 3:1)`
    ).toBeGreaterThanOrEqual(3.0)
  })
})
