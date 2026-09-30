import { test, expect } from "@playwright/test";

// "Ny ansökan" lives in one place — the header — rather than repeated on
// the pages under it.
for (const path of ["/oversikt", "/ansok", "/projekt"]) {
  test(`${path} has no "Ny ansökan" of its own, only the header's`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main").getByRole("link", { name: /Ny ansökan/ })).toHaveCount(0);
    await expect(page.locator("header").getByRole("link", { name: "Ny ansökan" })).toBeVisible();
  });
}
