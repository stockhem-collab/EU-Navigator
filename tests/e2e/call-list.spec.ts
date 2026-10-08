import { test, expect } from "@playwright/test";

// The calls from data/utlysningar.csv are part of the app's call data:
// their own status (Öppen, Planerad, Kommande, Förväntad), preliminary
// dates shown as such, euro amounts in kronor with the euro range as
// tooltip, and upcoming calls matched and labelled.

test("expected LIFE calls show their status and preliminary dates", async ({ page }) => {
  await page.goto("/eu-databas/life");
  const card = page.getByRole("link", { name: /LIFE 2027 – Klimatanpassning, standardprojekt/ });
  await expect(card).toBeVisible();
  await expect(card.getByTestId("call-status")).toHaveText("Förväntad");
  await expect(card.getByTestId("call-dates")).toHaveText("Öppnar 2027-04 (prel.) · Stänger 2027-09 (prel.)");
  await expect(card).toContainText("Ej angivet");

  await card.click();
  await expect(page.getByRole("heading", { name: /LIFE 2027 – Klimatanpassning/ })).toBeVisible();
  const details = page.getByTestId("call-list-details");
  await expect(details).toContainText("Naturbaserade lösningar");
  await expect(details).toContainText("Kommentar: Datum antagna utifrån 2026 års mönster");
  await expect(details.getByRole("link", { name: /Utlysningen hos finansiären/ })).toHaveAttribute("href", /cinea\.ec\.europa\.eu/);
});

test("a Horizon call from the list shows its grant in kronor with the euro range as tooltip", async ({ page }) => {
  await page.goto("/eu-databas/horizon/horizon-miss-2027-01-clima-01");
  await expect(page.getByTestId("call-status").first()).toHaveText("Kommande");
  const range = page.locator("span[title^='Originalbelopp']").first();
  await expect(range).toHaveText(/mnkr–.*mnkr/);
  await expect(range).toHaveAttribute("title", /10[\s ]000[\s ]000 EUR–15[\s ]000[\s ]000 EUR/);
});

test("upcoming calls are matched and labelled as upcoming", async ({ page }) => {
  await page.goto("/ansokan");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText("Finansieringsmöjligheter hittade")).toBeVisible();

  // Upcoming calls can sit among the low-relevance ones; show them all.
  const showMore = page.getByRole("button", { name: /Visa fler \/ lägre matchning/ });
  if (await showMore.isVisible()) await showMore.click();
  const upcoming = page.getByTestId("call-status").filter({ hasText: /Kommande|Planerad|Förväntad/ });
  await expect(upcoming.first()).toBeVisible();
  await expect(page.getByTestId("call-dates").first()).toContainText("Öppnar");
  await expect(page.getByTestId("amount-benchmark").first()).toBeVisible();
});
