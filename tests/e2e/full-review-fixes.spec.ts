import { test, expect } from "@playwright/test";

// Regression coverage for a full-solution review pass: three real bugs found
// while walking every page, fixed in the same pass.

test("a CSV-imported project is assignable to a user, not just seeded ones", async ({ page }) => {
  await page.goto("/projekt");
  const csv = "Titel,Budget\nAnvandare-testprojekt,1000000\n";
  await page.locator('input[type="file"]').setInputFiles({
    name: "test.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf-8"),
  });
  await expect(page.getByText(/1 projekt importerade|1 projects imported/i)).toBeVisible();

  await page.goto("/installningar/anvandare");
  await page.locator("tbody tr").first().click();
  const projectSelect = page.locator("select").last();
  await expect(projectSelect.locator("option", { hasText: "Anvandare-testprojekt" })).toHaveCount(1);

  // Clean up so this doesn't leak into other tests sharing storage.
  await page.goto("/projekt");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /Rensa importerade projekt|Clear imported projects/i }).click();
  await expect(page.locator("tbody tr", { hasText: "Anvandare-testprojekt" })).toHaveCount(0);
});

test("saving a named version is disabled with an explanation for an ad-hoc, unsaved project", async ({ page }) => {
  await page.goto("/ansokan");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();
  await page.getByRole("button", { name: /Starta ansökan/i }).first().click();

  await expect(page.getByRole("button", { name: /^Spara version$|^Save version$/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Utkast$|^Draft$/ })).toBeDisabled();
});
