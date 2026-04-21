import { test, expect } from "./fixtures";

/**
 * Bug 13 reproducer: QA reported 100+ `?_rsc=` requests per second on
 * /dashboard and /onboarding. Here we land on /dashboard, idle for
 * ten seconds without interacting, and count how many `?_rsc=` GETs
 * the page fires. A healthy page should stay under a dozen (prefetch
 * + one or two settle renders); the bug shape is dozens per second.
 */

const IDLE_WINDOW_MS = 10_000;
const THRESHOLD = 30;

test.describe("no RSC refetch loop", () => {
  test("/dashboard stays quiet after load", async ({ page, baseURL }) => {
    const rscUrls: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("?_rsc=") || url.includes("&_rsc=")) {
        rscUrls.push(url);
      }
    });

    await page.goto(`${baseURL}/pt-BR/dashboard`);
    await page.waitForLoadState("networkidle");

    // Reset after the initial paint so we only count what happens while
    // the page sits idle.
    const initial = rscUrls.length;
    await page.waitForTimeout(IDLE_WINDOW_MS);
    const duringIdle = rscUrls.length - initial;

    console.log(
      `>>> rsc during idle: ${duringIdle} (initial ${initial}) over ${IDLE_WINDOW_MS}ms`,
    );

    expect(
      duringIdle,
      `Expected fewer than ${THRESHOLD} \`?_rsc=\` requests in ${IDLE_WINDOW_MS}ms of idle — got ${duringIdle}`,
    ).toBeLessThan(THRESHOLD);
  });
});
