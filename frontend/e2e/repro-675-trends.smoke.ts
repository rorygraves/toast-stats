import { test, expect } from '@playwright/test'

// TEMP reproduction for #675 — delete after root-cause confirmed.
const DISTRICT = process.env['DISTRICT'] || '93'

test('repro: dark-mode skeleton appearance + no-scroll stuck state', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark')
  })
  await page.goto(`/district/${DISTRICT}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Audit scenario: full-page capture WITHOUT manually scrolling to trends.
  await page.screenshot({
    path: `/tmp/repro-675-noscroll-dark-${test.info().project.name}.png`,
    fullPage: true,
  })

  const trends = page.locator('#trends')
  const skeletonBefore = await trends.getByText('Loading chart…').count()

  // Now scroll like a real user.
  await trends.scrollIntoViewIfNeeded()
  await page.waitForTimeout(4000)
  const svgAfter = await trends.locator('svg').count()
  const skeletonAfter = await trends.getByText('Loading chart…').count()

  // eslint-disable-next-line no-console
  console.log(
    `[repro] skeletonBeforeScroll=${skeletonBefore} svgAfterScroll=${svgAfter} skeletonAfterScroll=${skeletonAfter}`
  )

  await trends.screenshot({
    path: `/tmp/repro-675-trends-dark-${test.info().project.name}.png`,
  })
})
