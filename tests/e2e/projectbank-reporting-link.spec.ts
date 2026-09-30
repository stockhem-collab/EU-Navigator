import { test, expect } from "@playwright/test";

// Coverage for the project <-> reporting connection: a project that's won
// funding without any recorded application can still get a real Grant from
// the app itself, the project's status then follows the reporting
// lifecycle automatically, and the reporting state is visible directly in
// the Projekt list rather than only on a detail page.

test("marking a funded project as awarded creates real reporting tracking and syncs its status", async ({
  page,
}) => {
  await page.goto("/projekt/pb-2");
  await expect(page.getByRole("button", { name: "Markera som beviljad" })).toHaveCount(0);

  await page.getByRole("button", { name: "✎ Redigera" }).click();
  await page.locator("select").nth(0).selectOption("funded");
  await page.getByRole("button", { name: "Spara" }).click();

  const markButton = page.getByRole("button", { name: "Markera som beviljad" });
  await expect(markButton).toBeVisible();
  await markButton.click();
  await page.getByRole("button", { name: "Ja, registrera" }).click();

  await expect(page).toHaveURL(/\/stod\/ap-pb-2/);
  // The whole plan is scheduled, the first report next.
  await expect(page.locator("#next-report").getByRole("heading", { name: /Lägesrapport 1/ })).toBeVisible();
  await expect(page.locator("#reports").getByRole("heading", { name: "Slutrapport" })).toBeVisible();
  await expect(page.getByRole("link", { name: "AI-baserad medborgarservice", exact: false }).first()).toBeVisible();

  // The originating entry's status is now kept in sync automatically —
  // no manual "update status" step required.
  await page.goto("/projekt/pb-2");
  await expect(page.getByText("Genomförs", { exact: true }).first()).toBeVisible();
  const grants = page.locator("section", { has: page.getByRole("heading", { name: "Beviljat stöd och rapportering" }) });
  await expect(grants.getByRole("link", { name: "Visa beviljat stöd" })).toBeVisible();

  // The reporting state also shows up directly in the portfolio list, not
  // only on the entry's own detail page.
  await page.goto("/projekt");
  const row = page.locator("tr", { hasText: "AI-baserad medborgarservice" });
  await expect(row.getByText(/månad|dagar/)).toBeVisible();
});

test("a linked project's reporting status is folded into its row on the Projekt list", async ({ page }) => {
  // Waiting for the grant page's status note confirms it has hydrated and
  // its status sync has run (pb-1 is seeded as "running", and stays so).
  await page.goto("/stod/ap-1");
  await expect(page.getByText("Projektets status följer rapporteringen")).toBeVisible();
  await page.waitForTimeout(200);
  await page.goto("/projekt?status=running");
  const row = page.locator("tr", { hasText: "Energieffektivisering kommunala skolor" });
  await expect(row).toBeVisible();
  await expect(row.getByText(/månad|Rapportering klar/)).toBeVisible();
});
