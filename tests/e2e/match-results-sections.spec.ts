import { test, expect } from "@playwright/test";

// The matching results list splits into a "Rekommenderade matchningar"
// section (score-based recommendation isn't "low") shown up front, and a
// collapsed "lower relevance" section for the rest — so the primary view
// doesn't turn into an undifferentiated wall of results as the call
// catalogue grows, without ever hiding a call outright.

test("recommended matches show up front; lower-relevance ones stay collapsed until asked for", async ({ page }) => {
  await page.goto("/ansokan");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(200);

  await expect(page.getByRole("heading", { name: /Rekommenderade matchningar/i })).toBeVisible();

  const startButtons = page.getByRole("button", { name: "Starta ansökan" });
  const recommendedCount = await startButtons.count();
  expect(recommendedCount).toBeGreaterThan(0);

  const toggle = page.getByRole("button", { name: /Visa fler \/ lägre matchning/ });
  await expect(toggle).toBeVisible();

  await toggle.click();
  const expandedCount = await startButtons.count();
  expect(expandedCount).toBeGreaterThan(recommendedCount);

  // Collapses back down to exactly the recommended set.
  await page.getByRole("button", { name: "Dölj lägre matchning" }).click();
  await expect(startButtons).toHaveCount(recommendedCount);

  // A call from the lower-relevance section is still a real, working entry
  // point into the workspace once expanded — nothing is actually hidden,
  // just deprioritized visually.
  await toggle.click();
  await startButtons.last().click();
  await expect(page.getByText(/\/100/)).toBeVisible();
});
