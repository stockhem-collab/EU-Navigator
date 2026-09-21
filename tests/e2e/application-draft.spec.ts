import { test, expect } from "@playwright/test";

// A saved Projektbank entry's application draft must survive leaving and
// re-entering the workspace (persisted via useApplication/localStorage); an
// ad-hoc, unsaved intake must not pretend to persist. Navigating straight to
// /demo?project=&call= (the Projektbank "Starta ansökan" link, and the
// Översikt "Pågående ansökningar" quick-entry) lands directly in the
// workspace — no intake-form resubmission needed to resume.

test("a saved project's application draft survives re-entering the workspace", async ({ page }) => {
  await page.goto("/projektbank/pb-4");
  const startLink = page.locator('a[href*="/demo?project=pb-4"]').first();
  const href = await startLink.getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(href!);

  await expect(page.getByText(/sparas automatiskt|saved automatically/i)).toBeVisible();

  const textarea = page.locator("textarea").first();
  const testValue = `E2E draft ${Date.now()}`;
  await textarea.fill(testValue);
  // Let the change handler's localStorage write happen.
  await page.waitForTimeout(200);

  // Re-enter the same flow from scratch (the SPA step state, not the
  // localStorage draft, resets on a fresh navigation).
  await page.goto(href!);
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

  await expect(page.getByText(/Spara projektet i projektbanken|Save this project to the project bank/i).first()).toBeVisible();
});

test("a version can be saved and restored, and the application exports as .docx", async ({ page }) => {
  await page.goto("/projektbank/pb-4");
  const startLink = page.locator('a[href*="/demo?project=pb-4"]').first();
  const href = await startLink.getAttribute("href");
  await page.goto(href!);

  const textarea = page.locator("textarea").first();
  const draftValue = `Version draft ${Date.now()}`;
  await textarea.fill(draftValue);
  await page.waitForTimeout(200);

  await page.getByRole("button", { name: /^Utkast$|^Draft$/ }).click();
  await page.getByRole("button", { name: /Spara version|Save version/i }).click();
  await expect(page.getByText(/^Utkast$|^Draft$/).first()).toBeVisible();

  // Change the draft further, then restore the saved version.
  await textarea.fill("Något helt annat");
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /Återställ till denna version|Restore this version/i }).click();
  await expect(textarea).toHaveValue(draftValue);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Exportera ansökan|Export application/i }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.docx$/);
});
