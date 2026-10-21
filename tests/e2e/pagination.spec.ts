import { test, expect } from "@playwright/test";

// The long lists (imported reference projects, partner search) are paged
// with numbered pages; the page and the filters are kept in the URL.

test("reference projects page through the imported list and keep page and filters in the URL", async ({ page }) => {
  await page.goto("/referensprojekt");
  const imported = page.getByTestId("imported-projects");
  await expect(imported.getByText(/Visar 1–20 av/)).toBeVisible();
  const firstTitle = await imported.getByTestId("imported-project-card").first().locator("h3").textContent();

  const pager = imported.getByRole("navigation", { name: "Sidor" });
  await pager.getByRole("button", { name: "Sida 2" }).click();
  await expect(page).toHaveURL(/[?&]sida=2/);
  await expect(imported.getByText(/Visar 21–40 av/)).toBeVisible();
  await expect(pager.getByRole("button", { name: "Sida 2" })).toHaveAttribute("aria-current", "page");
  await expect(imported.getByTestId("imported-project-card").first().locator("h3")).not.toHaveText(firstTitle ?? "");

  // A filter goes back to page 1 and is written to the URL.
  await page.getByLabel("Källa", { exact: true }).selectOption("cordis");
  await expect(page).toHaveURL(/source=cordis/);
  await expect(page).not.toHaveURL(/sida=/);
  await expect(imported.getByText(/Visar 1–20 av/)).toBeVisible();

  // A link with page and filter opens the same list.
  await page.goto("/referensprojekt?source=cordis&sida=3");
  await expect(page.getByLabel("Källa", { exact: true })).toHaveValue("cordis");
  await expect(imported.getByText(/Visar 41–60 av/)).toBeVisible();
  await expect(imported.getByTestId("imported-project-card").first().getByText("Källa: CORDIS")).toBeVisible();
});

test("a page past the end shows the last page", async ({ page }) => {
  await page.goto("/referensprojekt?source=keep-eu&q=flood&sida=9999");
  const imported = page.getByTestId("imported-projects");
  await expect(imported.getByTestId("imported-project-card").first()).toBeVisible();
  await expect(page).not.toHaveURL(/sida=9999/);
});

test("partner search pages through the organisations", async ({ page }) => {
  await page.goto("/partnersok");
  const results = page.getByTestId("partner-results");
  await expect(results.locator("li").first()).toBeVisible();
  const first = await results.locator("h2").first().textContent();

  await page.getByRole("navigation", { name: "Sidor" }).getByRole("button", { name: "Nästa" }).click();
  await expect(page).toHaveURL(/[?&]sida=2/);
  await expect(page.getByTestId("partner-result-count")).toContainText("Visar 26–50 av");
  await expect(results.locator("h2").first()).not.toHaveText(first ?? "");
  await expect(results.locator("li > div h2")).toHaveCount(25);
});

test("the project list is paged 25 at a time once it grows", async ({ page }) => {
  await page.goto("/projekt");
  const rows = Array.from({ length: 30 }, (_, i) => `Sidtestprojekt ${i + 1},100000`).join("\n");
  await page.locator('input[type="file"]').setInputFiles({
    name: "many.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`Titel,Budget\n${rows}\n`, "utf-8"),
  });
  await expect(page.getByText(/30 projekt importerade/i)).toBeVisible();

  await expect(page.locator("tbody tr")).toHaveCount(25);
  const pager = page.getByRole("navigation", { name: "Sidor" });
  await pager.getByRole("button", { name: "Nästa" }).click();
  await expect(page).toHaveURL(/[?&]sida=2/);
  await expect(pager.getByRole("button", { name: "Sida 2" })).toHaveAttribute("aria-current", "page");
  const onPageTwo = await page.locator("tbody tr").count();
  expect(onPageTwo).toBeGreaterThan(0);
  expect(onPageTwo).toBeLessThanOrEqual(25);

  // Searching goes back to the first page.
  await page.getByPlaceholder(/Sök/).first().fill("Sidtestprojekt 3");
  await expect(page).not.toHaveURL(/sida=/);
  await expect(page.locator("tbody tr", { hasText: "Sidtestprojekt 3" })).toHaveCount(2); // 3 and 30
  await expect(pager).toHaveCount(0);
});
