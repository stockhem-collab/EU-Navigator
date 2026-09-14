import { test, expect } from "@playwright/test";

// A saved Projektbank entry's application draft must survive leaving and
// re-entering the workspace (persisted via useApplication/localStorage); an
// ad-hoc, unsaved intake must not pretend to persist.

test("a saved project's application draft survives re-entering the workspace", async ({ page }) => {
  await page.goto("/projektbank/pb-4");
  const startLink = page.locator('a[href*="/demo?project=pb-4"]').first();
  const href = await startLink.getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(href!);
  await page.locator('button[type="submit"]').click();

  await expect(page.getByText(/sparas automatiskt|saved automatically/i)).toBeVisible();

  const textarea = page.locator("textarea").first();
  const testValue = `E2E draft ${Date.now()}`;
  await textarea.fill(testValue);
  // Let the change handler's localStorage write happen.
  await page.waitForTimeout(200);

  // Re-enter the same flow from scratch (the SPA step state, not the
  // localStorage draft, resets on a fresh navigation+submit).
  await page.goto(href!);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator("textarea").first()).toHaveValue(testValue);

  // Reset restores the AI suggestion, not the manual draft.
  await page.getByRole("button", { name: /Återställ AI-förslag|Reset to AI suggestion/i }).first().click();
  await expect(page.locator("textarea").first()).not.toHaveValue(testValue);
});

test("an ad-hoc, unsaved project shows the not-persisted note instead", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();
  await page.getByRole("button", { name: /Starta ansökan/i }).first().click();

  await expect(page.getByText(/Spara projektet i projektbanken|Save this project to the project bank/i)).toBeVisible();
});
