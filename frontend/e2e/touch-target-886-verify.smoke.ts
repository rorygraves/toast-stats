import { test, expect, type Page } from '@playwright/test'

/* #886 (epic #888 Sprint 2) — verify the 44px touch-target floor on the three
   chip families from audit #885, driven on the real PR preview in BOTH engines
   (Chromium `smoke` + WebKit `webkit`). Geometry, not toBeVisible (L134); the
   WebKit half is the L111 guard. Temporary — deleted after evidence is captured.

   BASE_URL must point at the PR preview (staging CDN). 375×812 = the audited
   iPhone-SE/13-mini portrait. */

const VIEWPORT = { width: 375, height: 812 }
const FLOOR = 44
const DISTRICT = '61'

async function measure(page: Page, selector: string) {
  const el = page.locator(selector).first()
  await el.waitFor({ state: 'attached', timeout: 15_000 })
  const box = await el.boundingBox()
  if (!box) throw new Error(`no bounding box for ${selector}`)
  return box
}

async function shot(page: Page, name: string) {
  const engine = test.info().project.name
  await page.screenshot({
    path: `/tmp/touch-target-886/${engine}/${name}.png`,
    fullPage: true,
  })
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
})

test('Family A — landing chip-selects (PY + date) clear 44px', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  for (const testid of ['py-chip-select', 'date-chip-select']) {
    const box = await measure(page, `[data-testid="${testid}"]`)
    expect(box.height, `${testid} height`).toBeGreaterThanOrEqual(FLOOR)
    expect(box.width, `${testid} width`).toBeGreaterThanOrEqual(FLOOR)
  }
  await shot(page, '01-landing')
})

test('Family B — landing region-filter chips clear 44px', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const chips = page.locator('button.districts-toolbar__region-chip')
  const n = await chips.count()
  expect(n, 'region chips present').toBeGreaterThan(0)
  for (let i = 0; i < n; i++) {
    const box = await chips.nth(i).boundingBox()
    expect(box, `chip ${i} box`).not.toBeNull()
    expect(box!.width, `region chip ${i} width`).toBeGreaterThanOrEqual(FLOOR)
    expect(box!.height, `region chip ${i} height`).toBeGreaterThanOrEqual(FLOOR)
  }
})

test('Family C — /regions finder chips clear 44px', async ({ page }) => {
  await page.goto('/regions', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const chips = page.locator('button.region-finder__chip')
  const n = await chips.count()
  expect(n, 'finder chips present').toBeGreaterThan(0)
  for (let i = 0; i < n; i++) {
    const box = await chips.nth(i).boundingBox()
    expect(box, `chip ${i} box`).not.toBeNull()
    expect(box!.width, `finder chip ${i} width`).toBeGreaterThanOrEqual(FLOOR)
    expect(box!.height, `finder chip ${i} height`).toBeGreaterThanOrEqual(FLOOR)
  }
  await shot(page, '02-regions')
})

test('Family A — /changes from/to chip-selects clear 44px', async ({
  page,
}) => {
  await page.goto(`/district/${DISTRICT}/changes`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  for (const testid of ['changes-from-chip-select', 'changes-to-chip-select']) {
    const box = await measure(page, `[data-testid="${testid}"]`)
    expect(box.height, `${testid} height`).toBeGreaterThanOrEqual(FLOOR)
    expect(box.width, `${testid} width`).toBeGreaterThanOrEqual(FLOOR)
  }
  await shot(page, '03-changes')
})
