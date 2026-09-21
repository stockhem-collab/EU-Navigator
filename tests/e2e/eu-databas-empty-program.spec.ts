import { test, expect } from "@playwright/test";

// A programme with no active calls (e.g. a closed EU fund still listed for
// reference, like AMIF) used to drop straight from the header into an empty
// space with no explanation — the count on the /eu-databas card already
// says "0 utlysningar", but landing on a blank page after clicking through
// still looked broken.

test("a programme with no calls shows an explanatory empty state, not a blank page", async ({ page }) => {
  await page.goto("/eu-databas/amif");
  await expect(page.getByText(/Inga aktuella utlysningar inom detta program/i)).toBeVisible();
});

test("a programme that does have calls does not show the empty-state message", async ({ page }) => {
  await page.goto("/eu-databas/life");
  await expect(page.getByText(/Inga aktuella utlysningar inom detta program/i)).toHaveCount(0);
});
