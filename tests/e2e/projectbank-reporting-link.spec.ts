import { test, expect } from "@playwright/test";

// Coverage for the Projektbank <-> reporting connection improvements from
// the full-system review: a Projektbank idea that's actually won funding
// can be turned into a real AwardedProject from the app itself (previously
// only possible by hand-editing seed data), the originating entry's status
// then syncs automatically with the reporting lifecycle instead of via a
// manual nudge button, and the reporting state is visible directly in the
// portfolio list views rather than only on a detail page.

test("marking an approved Projektbank entry as awarded creates real reporting tracking and syncs its status", async ({
  page,
}) => {
  await page.goto("/projektbank/pb-2");
  await expect(page.getByRole("button", { name: "Markera som beviljad" })).toHaveCount(0);

  await page.getByRole("button", { name: "✎ Redigera" }).click();
  await page.locator("select").nth(0).selectOption("approved");
  await page.getByRole("button", { name: "Spara" }).click();

  const markButton = page.getByRole("button", { name: "Markera som beviljad" });
  await expect(markButton).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await markButton.click();

  await expect(page).toHaveURL(/\/projekt\/ap-pb-2/);
  await expect(page.getByRole("heading", { name: "Lägesrapport 1" })).toBeVisible();
  await expect(page.getByText("Ursprunglig projektidé i Projektbanken")).toBeVisible();

  // The originating entry's status is now kept in sync automatically —
  // no manual "update status" step required.
  await page.goto("/projektbank/pb-2");
  await expect(page.getByText("Genomförs", { exact: true })).toBeVisible();
  await expect(page.getByText("Beviljad och under rapportering")).toBeVisible();

  // The reporting state also shows up directly in the portfolio list, not
  // only on the entry's own detail page.
  await page.goto("/projektbank");
  const row = page.locator("tr", { hasText: "AI-baserad medborgarservice" });
  await expect(row.getByText(/månad|dagar/)).toBeVisible();
});

test("a linked project's reporting status is folded into its row on Mina projekt", async ({ page }) => {
  // Visiting the awarded project first is what triggers the automatic
  // status sync (see the test above) — pb-1 starts out as "idea" in seed
  // data despite ap-1 already being mid-reporting. Waiting for the
  // auto-sync note confirms the page has hydrated and the sync effect has
  // had a chance to run before navigating away.
  await page.goto("/projekt/ap-1");
  await expect(page.getByText("hålls automatiskt i synk")).toBeVisible();
  await page.waitForTimeout(200);
  await page.goto("/projekt?status=running");
  const row = page.locator("div.rounded-xl", { hasText: "Energieffektivisering kommunala skolor" });
  await expect(row).toBeVisible();
  await expect(row.getByText(/månad|Rapportering klar/)).toBeVisible();
});
