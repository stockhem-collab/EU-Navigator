import { test, expect } from "@playwright/test";

// The built-in reference projects are another municipality's real projects,
// renamed to Exempelstad. Each card says so, so a demo audience doesn't
// read them as their own history.

test("reference projects are labelled with the source Exempel", async ({ page }) => {
  await page.goto("/referensprojekt");
  const badges = page.getByText("Källa: Exempel", { exact: true });
  await expect(badges.first()).toBeVisible();
  await expect(badges.first()).toHaveAttribute("title", /annan kommuns verkliga projekt/);
});
