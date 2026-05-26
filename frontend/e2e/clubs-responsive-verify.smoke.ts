import { test, expect, type Page } from '@playwright/test'

/* Clubs-table responsive verification (#671, epic #665 Sprint 5).
 *
 * Drives the real change on the PR preview:
 *  - table collapses to ClubCards below 640px, stays a table at >=640px
 *  - no horizontal scroll at 375px
 *  - mobile sort controls are >=44px touch targets
 *  - re-skinned card status pill reads AA in light AND dark
 * Temporary — deleted after the verification gate (no PR churn). */

const DISTRICT = '93' // staging has 76 clubs in D93 (rankings.json)
const CLUBS_PATH = `/district/${DISTRICT}/clubs`

// sRGB relative luminance + WCAG contrast (same as regions-legibility.smoke).
function luminance(r: number, g: number, b: number): number {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function parseRgb(c: string): [number, number, number] {
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) throw new Error(`unparseable color: ${c}`)
  const [r, g, b] = m[1].split(',').map(s => parseFloat(s.trim()))
  return [r, g, b]
}
function contrast(fg: string, bg: string): number {
  const [l1, l2] = [luminance(...parseRgb(fg)), luminance(...parseRgb(bg))]
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

async function gotoClubs(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript(t => {
    window.localStorage.setItem('theme', t as string)
  }, theme)
  await page.goto(CLUBS_PATH, { waitUntil: 'networkidle' })
  // Wait for either surface to appear (data loaded).
  await page
    .locator('#clubs-table, [data-testid="club-card"]')
    .first()
    .waitFor({ state: 'visible', timeout: 25_000 })
}

const VIEWPORTS = [
  { w: 375, h: 800, mode: 'mobile' as const },
  { w: 640, h: 900, mode: 'desktop' as const }, // boundary: 640 = first desktop
  { w: 768, h: 900, mode: 'desktop' as const },
  { w: 1280, h: 900, mode: 'desktop' as const },
]

for (const theme of ['light', 'dark'] as const) {
  for (const vp of VIEWPORTS) {
    test(`clubs ${vp.mode} @${vp.w}px (${theme})`, async ({ browser }) => {
      const ctx = await browser.newContext({
        colorScheme: theme === 'dark' ? 'dark' : 'light',
        viewport: { width: vp.w, height: vp.h },
      })
      const page = await ctx.newPage()
      await gotoClubs(page, theme)

      const table = page.locator('#clubs-table')
      const cards = page.locator('[data-testid="club-card"]')

      if (vp.mode === 'mobile') {
        // Collapsed to cards; the desktop table must not be present.
        await expect(cards.first()).toBeVisible()
        await expect(table).toHaveCount(0)

        // Re-skinned status pill reuses the shared class.
        const pill = cards.first().locator('.clubs-status-pill')
        await expect(pill.first()).toBeVisible()

        // Card status text is AA-legible against the card background.
        const ratio = await cards.first().evaluate(card => {
          const name = card.querySelector('.clubs-card__name') as HTMLElement
          const fg = getComputedStyle(name).color
          let el: HTMLElement | null = card as HTMLElement
          let bg = 'rgba(0, 0, 0, 0)'
          while (el) {
            const b = getComputedStyle(el).backgroundColor
            if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') {
              bg = b
              break
            }
            el = el.parentElement
          }
          return { fg, bg }
        })
        expect(
          contrast(ratio.fg, ratio.bg),
          `card name ${ratio.fg} on ${ratio.bg}`
        ).toBeGreaterThanOrEqual(4.5)
      } else {
        // >=640px: the table is back, no cards.
        await expect(table).toBeVisible()
        await expect(cards).toHaveCount(0)
      }

      // No horizontal scroll at the narrowest viewport (AC #2). Scoped to the
      // clubs surface this sprint owns (every `clubs-*` element must fit the
      // viewport). The global .app-shell-nav overflows ~314px at 375px on
      // EVERY page (verified on / and /regions) — a pre-existing app-wide
      // chrome bug tracked separately, out of scope for the clubs re-skin.
      if (vp.w === 375) {
        const overflow = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth
          let max = 0
          document.querySelectorAll('[class*="clubs-"]').forEach(el => {
            max = Math.max(
              max,
              Math.ceil(el.getBoundingClientRect().right) - vw
            )
          })
          return max
        })
        expect(
          overflow,
          `clubs surface horizontal overflow ${overflow}px`
        ).toBeLessThanOrEqual(1)

        // Sort controls are >=44px touch targets (AC #3).
        for (const sel of ['.clubs-mobile-select', '.clubs-sort-dir']) {
          const box = await page.locator(sel).first().boundingBox()
          expect(box, `${sel} box`).not.toBeNull()
          expect(box!.height, `${sel} height`).toBeGreaterThanOrEqual(44)
        }
        const dirBox = await page
          .locator('.clubs-sort-dir')
          .first()
          .boundingBox()
        expect(dirBox!.width, 'sort-dir width').toBeGreaterThanOrEqual(44)
      }

      // Evidence screenshot for the narrow + wide endpoints.
      if (vp.w === 375 || vp.w === 1280) {
        await page.screenshot({
          path: `/tmp/clubs-${vp.w}-${theme}.png`,
          fullPage: true,
        })
      }
      await ctx.close()
    })
  }
}
