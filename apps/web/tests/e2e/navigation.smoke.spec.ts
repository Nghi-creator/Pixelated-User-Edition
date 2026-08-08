import { expect, test } from "@playwright/test";

test("public routes render and navigate without a runtime failure", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Pixelated User Edition" }),
  ).toBeVisible();

  await page.getByTitle("Personal ROMs").click();
  await expect(page).toHaveURL(/\/local$/);
  await expect(page.getByRole("heading", { level: 1, name: "Personal ROMs" })).toBeVisible();

  await page.goto("/route-that-does-not-exist");
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
});
