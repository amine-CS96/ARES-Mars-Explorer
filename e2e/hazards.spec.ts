import { expect, test } from '@playwright/test'

/**
 * Hazard Analysis workspace flows (Phase 6 redesign).
 *
 * Covers: cluster selection → explainable inspector → back to inventory, inventory hover
 * preview, analytics chart selection → map highlight, and honest route-exposure empty state.
 * Also captures reference screenshots at the four verification viewports.
 */

const DEM_TIMEOUT = 30_000

test.describe('hazard workspace flows', () => {
  test('selecting a cluster opens the explainable inspector with real contributions', async ({
    page,
  }) => {
    await page.goto('/hazards')
    const inventory = page.getByText('Hazard inventory')
    await expect(inventory).toBeVisible({ timeout: DEM_TIMEOUT })

    // Wait for the detection run to finish (metric chips show a number, not an em dash).
    await expect(page.locator('header').nth(1)).toContainText(/Clusters\s*\d+/, {
      timeout: DEM_TIMEOUT,
    })

    // Select the first cluster card in the inventory.
    const firstCard = page.getByRole('listitem').first()
    await firstCard.getByRole('button').click()

    // Inspector takes over the right panel.
    await expect(page.getByRole('button', { name: 'Back to inventory' })).toBeVisible()
    await expect(page.getByText(/Why (critical|high|moderate)\?/i)).toBeVisible()

    // Contribution bars use the model's real math (ramp × weight wording).
    await expect(page.getByText(/ramp [\d.]+ × w/).first()).toBeVisible()

    // Measured terrain stats are present.
    await expect(page.getByText('Max slope').first()).toBeVisible()

    // Back to inventory restores the tabbed panel.
    await page.getByRole('button', { name: 'Back to inventory' }).click()
    await expect(page.getByText('Hazard inventory')).toBeVisible()
  })

  test('analytics severity selection highlights clusters and can be cleared', async ({ page }) => {
    await page.goto('/hazards')
    await expect(page.getByText('Hazard inventory')).toBeVisible({ timeout: DEM_TIMEOUT })
    await expect(page.locator('header').nth(1)).toContainText(/Clusters\s*\d+/, {
      timeout: DEM_TIMEOUT,
    })

    await page.getByRole('tab').nth(2).click()
    await expect(page.getByText('Clusters by severity')).toBeVisible()

    // Click the first severity cell → highlight chip appears.
    await page.locator('.recharts-bar-rectangle').first().click()
    await expect(page.getByText(/Highlighting .* clusters on the map/i)).toBeVisible()

    // Clear resets it.
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByText(/Highlighting .* clusters on the map/i)).toBeHidden()
  })

  test('route tab offers an honest empty state with a Planner action', async ({ page }) => {
    // Ensure no route is stored.
    await page.addInitScript(() => {
      localStorage.removeItem('ares:planner-route-path')
      localStorage.removeItem('ares:simulator-route-summary')
    })
    await page.goto('/hazards')
    await expect(page.getByText('Hazard inventory')).toBeVisible({ timeout: DEM_TIMEOUT })

    await page.getByRole('tab').nth(3).click()
    await expect(page.getByText('No route loaded')).toBeVisible()
    await expect(
      page.getByText(/Plan a route in the Route Planner/i),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Open Route Planner' }).click()
    await expect(page).toHaveURL(/\/planner$/)
  })
})

test.describe('reference screenshots', () => {
  const VIEWPORTS = [
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: '390x844', width: 390, height: 844 },
  ]

  for (const vp of VIEWPORTS) {
    test(`capture hazards workspace at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/hazards')
      await expect(page.getByText('Hazard inventory')).toBeVisible({ timeout: DEM_TIMEOUT })
      await expect(page.locator('header').nth(1)).toContainText(/Clusters\s*\d+/, {
        timeout: DEM_TIMEOUT,
      })
      // Let tiles and overlays settle before capturing.
      await page.waitForTimeout(3000)
      await page.screenshot({ path: `e2e/screenshots/hazards-${vp.name}.png` })
    })
  }
})
