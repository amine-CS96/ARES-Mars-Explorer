import { expect, test } from '@playwright/test'

/**
 * ARES smoke suite — every module route renders, key flows work, and no uncaught errors
 * occur. Runs on desktop and mobile viewports (see playwright.config.ts projects).
 *
 * Network note: the app fetches live NASA Trek WMTS tiles. Missing tiles surface as dark
 * patches (handled in-app), so resource-load console noise is tolerated — uncaught page
 * errors and application console errors are not.
 */

const ROUTES = [
  { path: '/', h1: 'ARES' },
  { path: '/globe', h1: '3D Mars Globe' },
  { path: '/explorer', h1: 'Jezero Crater Explorer' },
  { path: '/atlas', h1: 'Exploration Atlas' },
  { path: '/hazards', h1: 'Hazard Analysis' },
  { path: '/planner', h1: 'Marswalk Route Planner' },
  { path: '/simulator', h1: 'Marswalk Simulator' },
  { path: '/data-sources', h1: 'Data Sources' },
] as const

/** Console errors that are purely failed resource fetches (tiles) — the app handles these. */
function isResourceNoise(text: string): boolean {
  return /Failed to load resource|net::|ERR_TIMED_OUT|favicon/i.test(text)
}

test.describe('route smoke', () => {
  ROUTES.forEach(({ path, h1 }) => {
    test(`${path} renders "${h1}"`, async ({ page }, testInfo) => {
      const errors: string[] = []
      const onConsole = (msg: { type(): string; text(): string }) => {
        if (msg.type() === 'error' && !isResourceNoise(msg.text())) errors.push(msg.text())
      }
      const onPageError = (err: Error) => errors.push(`pageerror: ${err.message}`)
      page.on('console', onConsole)
      page.on('pageerror', onPageError)

      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(h1, { timeout: 20_000 })

      // No horizontal overflow at this viewport (mobile-friendly layout check).
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${testInfo.project.name}: ${path} horizontal overflow`).toBeLessThanOrEqual(0)

      // Attribution footer present on every route (credit requirement).
      await expect(
        page.getByText(/NASA\/JPL|USGS|ESA|DLR|ASU|MSSS|University of Arizona/i).filter({ visible: true }).first(),
      ).toBeVisible()

      expect(errors, `${testInfo.project.name}: ${path}`).toEqual([])
    })
  })
})

test.describe('key flows', () => {
  test('skip link receives keyboard focus and jumps to main', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('nav shows the mission label (desktop)', async ({ page }) => {
    const isMobile = test.info().project.name.startsWith('mobile')
    test.skip(isMobile, 'Label is hidden below the md breakpoint')
    await page.goto('/')
    await expect(page.getByText('NASA Space Apps 2026').first()).toBeVisible()
  })

  test('atlas search narrows results', async ({ page }) => {
    await page.goto('/atlas')
    await expect(page.getByRole('heading', { name: 'Exploration Atlas' })).toBeVisible()
    await page.getByPlaceholder('Search sites, missions, regions…').fill('Olympus')
    await expect(page.getByText('Olympus Mons')).toBeVisible()
  })

  test('mobile drawer navigation opens and closes', async ({ page }) => {
    const isMobile = test.info().project.name.startsWith('mobile')
    test.skip(!isMobile, 'Drawer is only shown below the lg breakpoint')
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).tap()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('planner computes a route and hands off to the simulator', async ({ page }) => {
    await page.goto('/planner')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Marswalk Route Planner')

    // Wait for the terrain grid (local DEM) — the map canvas must exist before clicking.
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 20_000 })
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    if (!box) return

    // Click start (left-center) then goal (right-center). Playwright click = down+up at the
    // same point, so no drag threshold is tripped.
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.5)
    await page.waitForTimeout(150)
    await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.55)

    await expect(page.getByRole('heading', { name: 'Recommended route' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/Estimated energy|Est\. energy/i).first()).toBeVisible()

    await page.getByRole('button', { name: /Send to Marswalk simulator/i }).click()
    await expect(page).toHaveURL(/\/simulator$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Marswalk Simulator')
    await expect(page.getByText(/Imported from Route Planner/i)).toBeVisible()
    await expect(page.getByText(/READY|CAUTION|NO-GO/).first()).toBeVisible()
  })

  test('simulator verdict reacts to the oxygen tank size', async ({ page }) => {
    await page.goto('/simulator')
    await expect(page.getByText(/READY|CAUTION|NO-GO/).first()).toBeVisible()

    // Mars24 clock is ticking (HH:MM:SS somewhere on the page).
    await expect(page.getByText(/\b\d{2}:\d{2}:\d{2}\b/).first()).toBeVisible()

    // Shrink the tank to 0.3 kg → the verdict must drop to NO-GO.
    const tankLabel = page.locator('label', { hasText: 'Tank mass' })
    const tankInput = tankLabel.locator('..').locator('input')
    await tankInput.fill('0.3')
    await expect(page.getByText('NO-GO').first()).toBeVisible({ timeout: 10_000 })
  })

  test('hazard analysis workspace renders with inventory and charts', async ({ page }) => {
    await page.goto('/hazards')
    await expect(page.getByText('Hazard inventory')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Mobility profile', { exact: true })).toBeVisible()
    await expect(page.getByText('Combined risk', { exact: true })).toBeVisible()
    await expect(page.getByText(/USGS Mars 2020 TRN CTX DTM/i).first()).toBeVisible()
    // Live header metrics from the real detection run.
    await expect(page.getByText('Coverage', { exact: false }).first()).toBeVisible()
    // Route tab explains itself and offers the Planner action when no route is stored.
    await page.getByRole('tab').nth(3).click()
    await expect(page.getByText('No route loaded')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open Route Planner' })).toBeVisible()
  })
})
