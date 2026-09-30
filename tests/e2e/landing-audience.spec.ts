import { test, expect } from "@playwright/test";

// The start page speaks to any organisation that seeks EU funding, not
// only municipalities.
test.use({ storageState: { cookies: [], origins: [] } });

test("the start page addresses organisations in general, not only municipalities", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Från behov till finansierat projekt" })).toBeVisible();
  await expect(page.getByText("för kommuner, regioner, myndigheter, lärosäten, företag och föreningar", { exact: false })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/kommunens|kommunal SaaS|Kommunen /);
  await expect(page).toHaveTitle("EU Navigator — Från behov till finansierat projekt");
});
