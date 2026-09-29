import { test, expect } from "@playwright/test";

// The Översikt "Pågående ansökningar" quick-entry list: shows up once a
// draft has actual edits, links straight back into the workspace (no
// intake-form resubmission), and disappears again once the browser has no
// application records at all (e.g. a fresh/incognito context).

const applicationsSection = (page: import("@playwright/test").Page) =>
  page.locator("section", { has: page.getByRole("heading", { name: "Ansökningar", exact: true }) });

test("appears once a draft has edits and resumes straight into the workspace", async ({ page }) => {
  await page.goto("/oversikt");
  // Only the seeded example application (pb-5, with the funder) to begin with.
  await expect(applicationsSection(page).getByText("Nordiskt klimatsamarbete – dagvattenhantering")).toBeVisible();
  await expect(applicationsSection(page).getByText("Cykelinfrastruktur city")).toHaveCount(0);

  // Start and edit an application for a saved Projektbank entry.
  await page.goto("/projekt/pb-4");
  const startLink = page.locator('a[href*="/ansokan?project=pb-4"]').first();
  const href = await startLink.getAttribute("href");
  await page.goto(href!);
  // Typing before the stored draft has loaded can be overwritten by it.
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  const textarea = page.locator("textarea").first();
  await textarea.fill(`Ongoing work ${Date.now()}`);
  await page.waitForTimeout(200);

  await page.goto("/oversikt");
  const row = applicationsSection(page).locator("li", { hasText: "Cykelinfrastruktur city" });
  await expect(row).toBeVisible();
  const resumeLink = row.getByRole("link").first();
  await expect(resumeLink).toBeVisible();

  // Resuming lands directly in the workspace, not the intake form.
  await resumeLink.click();
  await expect(page.locator('[role="tablist"]')).toBeVisible();
  await expect(page.locator("textarea").first()).not.toHaveCount(0);
});
