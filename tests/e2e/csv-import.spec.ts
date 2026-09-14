import { test, expect } from "@playwright/test";

const CSV = "Titel,Budget\nE2E-testprojekt,1000000\n";

test("importing the same CSV twice does not create colliding ids, and a row can be removed", async ({ page }) => {
  const consoleWarnings: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || /same key/i.test(msg.text())) consoleWarnings.push(msg.text());
  });

  await page.goto("/projektbank");
  const fileInput = page.locator('input[type="file"]');

  const asFile = { name: "test.csv", mimeType: "text/csv", buffer: Buffer.from(CSV, "utf-8") };

  await fileInput.setInputFiles(asFile);
  await expect(page.getByText(/1 projekt importerade|1 projects imported/i)).toBeVisible();

  const rowsAfterFirst = page.locator("tbody tr", { hasText: "E2E-testprojekt" });
  await expect(rowsAfterFirst).toHaveCount(1);
  const firstHref = await rowsAfterFirst.first().locator("a").first().getAttribute("href");

  // Re-import the exact same file.
  await fileInput.setInputFiles(asFile);
  await expect(page.getByText(/1 projekt importerade|1 projects imported/i)).toBeVisible();

  const rowsAfterSecond = page.locator("tbody tr", { hasText: "E2E-testprojekt" });
  await expect(rowsAfterSecond).toHaveCount(2);
  const rowElements = await rowsAfterSecond.all();
  const hrefs = await Promise.all(rowElements.map((row) => row.locator("a").first().getAttribute("href")));
  expect(new Set(hrefs).size).toBe(2); // distinct ids, not a collision
  expect(hrefs).toContain(firstHref);

  expect(consoleWarnings).toEqual([]);

  // Remove one imported row via the per-row delete control.
  await rowsAfterSecond.first().getByRole("button", { name: /Ta bort importerat projekt|Remove imported project/i }).click();
  await expect(page.locator("tbody tr", { hasText: "E2E-testprojekt" })).toHaveCount(1);

  // Clean up the rest via "clear imported" so this test doesn't leave state
  // behind for other tests sharing the same browser storage.
  await page.getByRole("button", { name: /Rensa importerade projekt|Clear imported projects/i }).click();
  await expect(page.locator("tbody tr", { hasText: "E2E-testprojekt" })).toHaveCount(0);
});
