import { test, expect } from "@playwright/test";

// The Översikt "Pågående ansökningar" quick-entry list: shows up once a
// draft has actual edits, links straight back into the workspace (no
// intake-form resubmission), and disappears again once the browser has no
// application records at all (e.g. a fresh/incognito context).

test("appears once a draft has edits and resumes straight into the workspace", async ({ page }) => {
  await page.goto("/oversikt");
  await expect(page.getByText(/Inga pågående ansökningar|No ongoing applications/i)).toBeVisible();

  // Start and edit an application for a saved Projektbank entry.
  await page.goto("/projektbank/pb-4");
  const startLink = page.locator('a[href*="/demo?project=pb-4"]').first();
  const href = await startLink.getAttribute("href");
  await page.goto(href!);
  const textarea = page.locator("textarea").first();
  await textarea.fill(`Ongoing work ${Date.now()}`);
  await page.waitForTimeout(200);

  await page.goto("/oversikt");
  await expect(page.getByText(/Inga pågående ansökningar|No ongoing applications/i)).toHaveCount(0);
  const resumeLink = page.getByRole("link", { name: /Fortsätt|Resume/i }).first();
  await expect(resumeLink).toBeVisible();

  // Resuming lands directly in the workspace, not the intake form.
  await resumeLink.click();
  await expect(page.locator('[role="tablist"]')).toBeVisible();
  await expect(page.locator("textarea").first()).not.toHaveCount(0);
});
