/**
 * #851 verification — click-header sort + URL sync across data tables.
 *
 * Drives the actual preview / staging surface. Two engines (smoke=Chromium,
 * webkit=Safari) — Safari has historically caught rendering regressions we
 * missed on Chromium (#710), so both projects must stay green.
 *
 * Captures full-page screenshots into /tmp for evidence in the sprint
 * comment. Deleted after the sprint ships.
 */
import { test, expect } from '@playwright/test'

const baseUrl = process.env['BASE_URL']!

test.describe('Sortable tables — click-header + URL sync (#851)', () => {
  test('landing rankings: click Paid Clubs → URL has sort=clubs&dir=asc', async ({
    page,
    browserName,
  }) => {
    await page.goto(baseUrl + '/')

    // Wait for at least one rankings row.
    const firstRow = page.locator('.districts-rankings-table tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 15_000 })

    // Capture before — default sort.
    await page.screenshot({
      path: `/tmp/851-landing-default-${browserName}.png`,
      fullPage: true,
    })

    // Click the Paid Clubs sortable header.
    const btn = page.getByRole('button', { name: /Sort by Paid Clubs/i })
    await btn.scrollIntoViewIfNeeded()
    await btn.click()

    // URL should now have sort=clubs&dir=asc.
    await expect
      .poll(() => page.url(), { timeout: 5_000 })
      .toMatch(/sort=clubs/)
    expect(page.url()).toMatch(/dir=asc/)

    // The Paid Clubs column header announces ascending sort.
    const th = page.locator('th:has(button[aria-label*="Paid Clubs"])').first()
    await expect(th).toHaveAttribute('aria-sort', 'ascending')

    await page.screenshot({
      path: `/tmp/851-landing-clubs-asc-${browserName}.png`,
      fullPage: true,
    })

    // Click again to flip.
    await btn.click()
    await expect.poll(() => page.url(), { timeout: 5_000 }).toMatch(/dir=desc/)
    await expect(th).toHaveAttribute('aria-sort', 'descending')
  })

  test('URL-on-mount: ?sort=clubs&dir=asc is honored on load', async ({
    page,
    browserName,
  }) => {
    await page.goto(baseUrl + '/?sort=clubs&dir=asc')
    const firstRow = page.locator('.districts-rankings-table tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 15_000 })
    const th = page.locator('th:has(button[aria-label*="Paid Clubs"])').first()
    await expect(th).toHaveAttribute('aria-sort', 'ascending')
    await page.screenshot({
      path: `/tmp/851-url-mount-${browserName}.png`,
      fullPage: true,
    })
  })
})
