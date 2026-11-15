import { defineConfig, devices } from '@playwright/test'

/**
 * E2E smoke suite (Phase 6). Runs against the PRODUCTION build (`vite preview` on :4173),
 * built fresh so the suite always exercises what would ship. Two projects: desktop and
 * mobile (touch). Live Trek tile fetches are part of the app, so the suite requires network.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173',
    // Tolerate slow Trek responses; assertions below use their own timeouts.
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'npm.cmd run build && npm.cmd run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
})
