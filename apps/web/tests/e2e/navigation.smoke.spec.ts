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

test("authentication routes render and private profile navigation redirects guests", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 2, name: "Welcome Back" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();

  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 2, name: "Welcome Back" })).toBeVisible();
});

test("the app remains usable when session storage is denied", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage denied", "SecurityError");
      },
    });
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Pixelated User Edition" }),
  ).toBeVisible();
  await page.getByTitle("Personal ROMs").click();
  await expect(page.getByRole("heading", { level: 1, name: "Personal ROMs" })).toBeVisible();
});

test("malformed catalog responses fail closed without crashing the app shell", async ({ page }) => {
  await page.route("http://127.0.0.1:4000/games**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ games: [], totalPages: "unbounded" }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/home");
  await expect(
    page.getByText("Could not load the game library. Check the API connection."),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
});

test("local ROM inspection rejects invalid executable content in the browser", async ({ page }) => {
  await page.goto("/local");
  await page.getByLabel("Choose a ROM file").setInputFiles({
    buffer: Buffer.alloc(32, 0),
    mimeType: "application/octet-stream",
    name: "invalid.nes",
  });

  await expect(page.getByRole("alert")).toContainText("valid NES ROM header");
});
