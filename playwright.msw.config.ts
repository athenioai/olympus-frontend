import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the MSW-backed e2e suite.
 *
 * Boots a dedicated dev server on port 3100 with `MSW_ENABLED=1` so the
 * Next.js server intercepts all fetches through mocked handlers. The
 * default `playwright.config.ts` stays pointed at the regular dev server
 * on port 3000 for smoke/offline tests.
 */
export default defineConfig({
  testDir: "./e2e/msw",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        locale: "pt-BR",
        extraHTTPHeaders: { "Accept-Language": "pt-BR,pt;q=0.9" },
      },
    },
  ],
  webServer: {
    command: "PORT=3100 MSW_ENABLED=1 npm run dev",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
