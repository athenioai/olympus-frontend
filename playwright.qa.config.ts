import { defineConfig, devices } from "@playwright/test";

/**
 * QA-overnight Playwright config. Points testDir at /tmp/qa-olympus/specs
 * so QA specs stay outside the repo (per docs/qa-overnight/plan.md).
 * Reuses the dev server like the base config.
 *
 * NOT for CI. Local QA only.
 */
export default defineConfig({
  testDir: "/tmp/qa-olympus/specs",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: "/tmp/qa-olympus/test-results",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on",
    screenshot: "only-on-failure",
    video: "off",
    navigationTimeout: 45_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
