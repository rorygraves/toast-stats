import { test, expect } from '@playwright/test'

/**
 * CC-7 verification smoke (#872, epic #873 Sprint 2) — TEMPORARY, deleted after
 * the evidence run. Proves club & division card/row navigation is now real
 * <a href> anchors (was useNavigate / button onClick), so middle-click /
 * ⌘-click / open-in-new-tab / mobile long-press work. Runs in both engines
 * (smoke=Chromium, webkit=Safari) to catch a Safari-only regression.
 *
 * BASE_URL is the PR preview channel (reads staging CDN).
 */

const DISTRICT = '61'

test.describe('CC-7 — club links (DistrictClubsPage)', () => {
  test('desktop club-name cell is a real link to the club detail route', async ({
    page,
  }) => {
    await page.goto(`/district/${DISTRICT}/clubs`)
    // Wait for the clubs table to populate.
    const clubLink = page
      .locator(`a[href*="/district/${DISTRICT}/club/"]`)
      .first()
    await expect(clubLink).toBeVisible({ timeout: 15_000 })
    const href = await clubLink.getAttribute('href')
    expect(href).toMatch(new RegExp(`/district/${DISTRICT}/club/.+`))
    await page.screenshot({
      path: `/tmp/cc7-clubs-${test.info().project.name}.png`,
      fullPage: true,
    })
  })
})

test.describe('CC-7 — division card link (DistrictDivisionsPage)', () => {
  test('division heading is a real link to the division page', async ({
    page,
  }) => {
    await page.goto(`/district/${DISTRICT}/divisions`)
    const divLink = page
      .locator(`a[href*="/district/${DISTRICT}/division/"]`)
      .first()
    await expect(divLink).toBeVisible({ timeout: 15_000 })
    const href = await divLink.getAttribute('href')
    expect(href).toMatch(new RegExp(`/district/${DISTRICT}/division/.+`))
    // The link text is the division heading.
    await expect(divLink).toContainText(/Division/i)
    await page.screenshot({
      path: `/tmp/cc7-divisions-${test.info().project.name}.png`,
      fullPage: true,
    })
  })
})

test.describe('CC-7 — club mini-list / mini-table links (DivisionPage)', () => {
  test('club rows on a division page are real links', async ({ page }) => {
    // Land on the divisions page, follow the first division link, then assert
    // the clubs listed there are real links to club detail.
    await page.goto(`/district/${DISTRICT}/divisions`)
    const divLink = page
      .locator(`a[href*="/district/${DISTRICT}/division/"]`)
      .first()
    await expect(divLink).toBeVisible({ timeout: 15_000 })
    await divLink.click()
    const clubLink = page
      .locator(`a[href*="/district/${DISTRICT}/club/"]`)
      .first()
    await expect(clubLink).toBeVisible({ timeout: 15_000 })
    await page.screenshot({
      path: `/tmp/cc7-division-detail-${test.info().project.name}.png`,
      fullPage: true,
    })
  })
})
