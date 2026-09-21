import { test, expect } from "@playwright/test";

// Nav rename: /referensprojekt's tab now reads "Referensprojekt", not the
// old "Beviljade projekt" (which also collided with /projekt's own page
// title). And Översikt's "Projekt per status" tiles deep-link into Mina
// projekt pre-filtered to that status, which Mina projekt must support.

test("the referensprojekt nav tab reads Referensprojekt", async ({ page }) => {
  await page.goto("/");
  const navLink = page.getByRole("link", { name: "Referensprojekt", exact: true });
  await expect(navLink).toBeVisible();
  await expect(page.getByRole("link", { name: "Beviljade projekt" })).toHaveCount(0);
  await navLink.click();
  await expect(page).toHaveURL(/\/referensprojekt/);
});

test("Översikt's status tiles link into Mina projekt pre-filtered to that status", async ({ page }) => {
  await page.goto("/oversikt");
  // "Idé" is one of the seeded statuses with at least one project bank entry.
  const ideaTile = page.getByRole("link").filter({ hasText: "Idé" }).first();
  await expect(ideaTile).toBeVisible();
  await ideaTile.click();

  await expect(page).toHaveURL(/\/projekt\?status=idea/);
  // The matching status tile on Mina projekt is pre-selected (dark/active).
  const activeTile = page.getByRole("button").filter({ hasText: "Idé" }).first();
  await expect(activeTile).toHaveClass(/bg-navy-800/);

  // Clicking the same tile again clears the filter back to "all".
  await activeTile.click();
  const totalCount = await page.getByRole("button").filter({ hasText: "Alla" }).locator("p").first().textContent();
  expect(Number(totalCount)).toBeGreaterThan(0);
});
