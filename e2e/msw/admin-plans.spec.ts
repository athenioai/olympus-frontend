import { test, expect } from "./fixtures";

/**
 * End-to-end coverage of the admin "create plan" flow with the BrlInput
 * mask in a real browser. Relies on MSW mocks (see src/test/msw/handlers.ts)
 * so no real backend is required.
 */

test.describe("admin plans — create with BrlInput", () => {
  test("types digits into BrlInput and creates plan", async ({ page }) => {
    await page.goto("/pt-BR/admin/plans");

    // Page shell — title comes from admin.plans.title.
    await expect(
      page.getByRole("heading", { name: "Planos", level: 1 }),
    ).toBeVisible();

    // Open the create-plan modal. Button label = admin.plans.create.
    await page.getByRole("button", { name: "Novo plano" }).click();

    // Modal mounted — heading comes from form.createTitle.
    await expect(
      page.getByRole("heading", { name: "Criar plano" }),
    ).toBeVisible();

    // Fill the name field. The label is rendered as <span> inside <label>,
    // not linked via `htmlFor`, so target by role + order.
    const [nameInput, brlInput] = await page.getByRole("textbox").all();
    await nameInput.fill("Pro MSW");

    // BrlInput starts at "R$ 0,00" (NBSP between symbol and number).
    await expect(brlInput).toHaveValue(/R\$\s0,00/);

    // Type "9990" — should land on R$ 99,90.
    await brlInput.focus();
    await page.keyboard.type("9990");
    await expect(brlInput).toHaveValue(/R\$\s99,90/);

    // Submit the form. Button label comes from common.save.
    await page.getByRole("button", { name: "Salvar" }).click();

    // New plan renders in the table.
    await expect(page.getByRole("cell", { name: "Pro MSW" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: /R\$\s99,90/ }),
    ).toBeVisible();
  });
});
