import { test as base, expect } from "@playwright/test";
import { mintFakeJwt } from "@/test/msw/jwt";

/**
 * Fixture that pre-authenticates the browser context by dropping both
 * cookies the proxy middleware looks for. The token payload is valid
 * enough for `proxy.ts` (which only reads `exp`); MSW handles the real
 * session validation via `/auth/me`.
 */
export const test = base.extend<{ authenticatedPage: void }>({
  authenticatedPage: [
    async ({ context, baseURL }, use) => {
      const url = new URL(baseURL ?? "http://localhost:3100");
      const accessToken = mintFakeJwt({ role: "admin" });
      const refreshToken = mintFakeJwt({
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      });
      await context.addCookies([
        {
          name: "access_token",
          value: accessToken,
          domain: url.hostname,
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        },
        {
          name: "refresh_token",
          value: refreshToken,
          domain: url.hostname,
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
