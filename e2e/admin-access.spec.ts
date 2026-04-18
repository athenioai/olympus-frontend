import { test, expect } from "@playwright/test";

/**
 * Gate behavior for /admin/* routes.
 *
 * Without an access_token cookie, proxy.ts redirects any private route to
 * /login. With a non-admin token, the (authenticated)/admin/layout.tsx
 * redirects to /dashboard. We can only exercise the first path offline
 * — the second requires minting a JWT the backend would accept.
 */
test.describe("admin access", () => {
  test("redirects unauthenticated users from /admin to /login", async ({
    page,
  }) => {
    await page.goto("/pt-BR/admin");
    await page.waitForURL(/\/login$|\/pt-BR\/login$/);
    await expect(
      page.getByRole("heading", { name: "Olympus" }),
    ).toBeVisible();
  });

  test("redirects unauthenticated users from /admin/dashboard to /login", async ({
    page,
  }) => {
    await page.goto("/pt-BR/admin/dashboard");
    await page.waitForURL(/\/login$|\/pt-BR\/login$/);
  });
});
