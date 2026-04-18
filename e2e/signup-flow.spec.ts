import { test, expect } from "@playwright/test";

/**
 * Smoke coverage for the public-facing signup surfaces. The onboarding
 * wizard itself depends on server actions that reach the real backend,
 * so those steps are validated via unit tests + manual QA. Here we keep
 * the e2e focused on what is fully reproducible offline.
 */
test.describe("signup flow", () => {
  test("/signup renders the hero form", async ({ page }) => {
    await page.goto("/pt-BR/signup");
    await expect(
      page.getByRole("heading", { name: "Comece grátis em 2 minutos" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Começar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  test("/onboarding/error/invalid renders guidance", async ({ page }) => {
    await page.goto("/pt-BR/onboarding/error/invalid");
    await expect(
      page.getByRole("heading", { name: "Link inválido" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Voltar ao início" }),
    ).toHaveAttribute("href", "/signup");
  });

  test("/onboarding/error/completed links to login", async ({ page }) => {
    await page.goto("/pt-BR/onboarding/error/completed");
    await expect(
      page.getByRole("heading", { name: "Link já utilizado" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ir pro login" }),
    ).toHaveAttribute("href", "/login");
  });
});
