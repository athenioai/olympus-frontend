import { test, expect } from "@playwright/test";

/**
 * Covers the 4 public auth forms after the `useActionState` migration.
 *
 * Goal: make sure every `<form action={formAction}>` resolves to a known
 * response (200/3xx), never the stray `POST /[locale]/login → 404` we
 * were seeing in the Vercel logs when the form used a client-side submit
 * handler that required hydration.
 *
 * We deliberately do NOT hit the real backend here — responses are
 * whatever the dev server produces when the action proxies to the API
 * and the API is unreachable. What we assert is: the browser stays on
 * the auth surface (no 404 HTML served by Next), and the expected error
 * or transition UI renders.
 */

test.describe("login form", () => {
  test("renders the form shell", async ({ page }) => {
    await page.goto("/pt-BR/login");
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("submit with empty fields is blocked by HTML validation", async ({
    page,
  }) => {
    await page.goto("/pt-BR/login");
    await page.getByRole("button", { name: "Entrar" }).click();
    // The browser keeps us on the same page (required attribute).
    await expect(page).toHaveURL(/\/(pt-BR\/)?login(\?|$)/);
  });

  test("submit with invalid credentials stays on /login (no 404)", async ({
    page,
  }) => {
    const responses: { url: string; status: number }[] = [];
    page.on("response", (res) => {
      if (res.request().method() === "POST") {
        responses.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto("/pt-BR/login");
    await page.getByPlaceholder("Email").fill("nobody@example.invalid");
    await page.getByPlaceholder("Senha").fill("wrongpassword");
    await page.getByRole("button", { name: "Entrar" }).click();

    // Give the server action a moment to resolve.
    await page.waitForLoadState("networkidle");

    // The URL must still be the login surface (not a 404 page).
    await expect(page).toHaveURL(/\/(pt-BR\/)?login(\?|$)/);

    // No POST request should have returned 404.
    const notFoundPosts = responses.filter((r) => r.status === 404);
    expect(notFoundPosts, JSON.stringify(notFoundPosts)).toHaveLength(0);
  });
});

test.describe("signup form", () => {
  test("renders the form shell", async ({ page }) => {
    await page.goto("/pt-BR/signup");
    await expect(page.getByPlaceholder("voce@empresa.com")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Criar conta grátis" }),
    ).toBeVisible();
  });

  test("submit with invalid email shows field validation", async ({ page }) => {
    await page.goto("/pt-BR/signup");
    await page.getByPlaceholder("voce@empresa.com").fill("not-an-email");
    await page.getByRole("button", { name: "Criar conta grátis" }).click();
    // Browser's type=email validator keeps us on the page.
    await expect(page).toHaveURL(/\/(pt-BR\/)?signup(\?|$)/);
  });
});

test.describe("forgot-password form", () => {
  test("renders the form shell", async ({ page }) => {
    await page.goto("/pt-BR/forgot-password");
    await expect(
      page.getByRole("button", { name: "Enviar link de recuperação" }),
    ).toBeVisible();
  });

  test("submit with valid email does not 404", async ({ page }) => {
    const responses: { url: string; status: number }[] = [];
    page.on("response", (res) => {
      if (res.request().method() === "POST") {
        responses.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto("/pt-BR/forgot-password");
    const input = page.getByRole("textbox").first();
    await input.fill("alice@example.com");
    await page
      .getByRole("button", { name: "Enviar link de recuperação" })
      .click();

    await page.waitForLoadState("networkidle");

    const notFoundPosts = responses.filter((r) => r.status === 404);
    expect(notFoundPosts, JSON.stringify(notFoundPosts)).toHaveLength(0);
  });
});

test.describe("reset-password page", () => {
  test("missing token lands on the invalid-link stage", async ({ page }) => {
    await page.goto("/pt-BR/reset-password");

    // Invalid stage shows the expired copy, not the password form.
    await expect(
      page.getByRole("heading", {
        name: "Esse link expirou ou já foi usado.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Pedir novo link" }),
    ).toHaveAttribute("href", "/forgot-password");

    // The password form must NOT be on screen.
    await expect(page.getByPlaceholder(/senha/i)).toHaveCount(0);
  });

  test("too-short token also lands on invalid stage", async ({ page }) => {
    await page.goto("/pt-BR/reset-password?token=abc");
    await expect(
      page.getByRole("heading", {
        name: "Esse link expirou ou já foi usado.",
      }),
    ).toBeVisible();
  });
});
