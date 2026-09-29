import { test, expect } from "@playwright/test";

// The main menu has one tab per purpose, with EU-databas and Referensprojekt
// grouped under Kunskapsbank. And Datacenter's portfolio "Projekt per
// status" tiles deep-link into the Projekt list pre-filtered to that status.

test("the menu has one tab per purpose, and Kunskapsbank leads to both reference sections", async ({ page }) => {
  await page.goto("/oversikt");
  const nav = page.getByRole("navigation").first();
  for (const label of ["Översikt", "Projekt", "Ansöka", "Rapportera", "Kunskapsbank", "Datacenter"]) {
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  // The old tabs are gone.
  for (const old of ["Mina projekt", "Bevakning", "Projektbank"]) {
    await expect(nav.getByRole("link", { name: old, exact: true })).toHaveCount(0);
  }

  await nav.getByRole("link", { name: "Kunskapsbank", exact: true }).click();
  await expect(page).toHaveURL(/\/eu-databas/);
  await page.getByRole("navigation", { name: "Kunskapsbank" }).getByRole("link", { name: "Referensprojekt" }).click();
  await expect(page).toHaveURL(/\/referensprojekt/);
  // Still highlighted as Kunskapsbank.
  await expect(page.getByRole("navigation").first().getByRole("link", { name: "Kunskapsbank", exact: true })).toHaveAttribute(
    "aria-current",
    "page"
  );
});

test("Datacenter's status tiles link into Projekt pre-filtered to that status", async ({ page }) => {
  await page.goto("/datacenter");
  const portfolio = page.locator("section", { has: page.getByRole("heading", { name: "Portfölj" }) });
  // "Idé" is one of the seeded statuses with at least one project.
  await portfolio.getByRole("link").filter({ hasText: "Idé" }).first().click();

  await expect(page).toHaveURL(/\/projekt\?status=idea/);
  // The matching status tile on Projekt is pre-selected.
  const activeTile = page.getByRole("button", { pressed: true }).filter({ hasText: "Idé" });
  await expect(activeTile).toHaveClass(/bg-navy-800/);

  // Clicking the same tile again clears the filter back to "all".
  await activeTile.click();
  const totalCount = await page.getByRole("button").filter({ hasText: "Alla" }).locator("p").first().textContent();
  expect(Number(totalCount)).toBeGreaterThan(0);
});

test("old addresses still work", async ({ page }) => {
  await page.goto("/projektbank/pb-1");
  await expect(page).toHaveURL(/\/projekt\/pb-1$/);
  await page.goto("/projekt/ap-1");
  await expect(page).toHaveURL(/\/stod\/ap-1$/);
  await page.goto("/bevakning");
  await expect(page).toHaveURL(/\/ansok$/);
  await page.goto("/demo?call=life-2027-climate-schools");
  await expect(page).toHaveURL(/\/ansokan\?call=life-2027-climate-schools$/);
});
