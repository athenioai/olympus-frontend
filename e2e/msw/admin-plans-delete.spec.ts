import { test, expect } from "./fixtures";

/**
 * Regression for Bug 4 from the QA report: clicking delete on a plan
 * used to leave the modal open and the plan in the list because the
 * backend's soft-delete confirmation envelope (`success: true, data: null`)
 * was rejected by `unwrapEnvelope`. Fix lives in src/lib/api-envelope.ts.
 */
test.describe("admin plans — delete", () => {
  test("modal closes and plan disappears after confirm", async ({
    page,
    request,
    baseURL,
  }) => {
    await request.post(`${baseURL}/api/msw-control/seed`, {
      data: {
        reset: true,
        plans: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Plan To Delete",
            cost: 49.9,
            createdAt: "2026-04-21T00:00:00.000Z",
          },
        ],
      },
    });

    await page.goto("/pt-BR/admin/plans");
    await expect(
      page.getByRole("cell", { name: "Plan To Delete" }),
    ).toBeVisible();

    // Row has an edit pencil and a trash icon side-by-side; the trash
    // icon is the last button in the row.
    const row = page.getByRole("row").filter({ hasText: "Plan To Delete" });
    await row.getByRole("button").last().click();

    await expect(page.getByRole("dialog")).toBeVisible();

    // common.delete = "Excluir"
    await page.getByRole("button", { name: "Excluir" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Plan To Delete" }),
    ).not.toBeVisible();
  });
});
