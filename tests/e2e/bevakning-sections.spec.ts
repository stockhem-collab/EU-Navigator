import { test, expect } from "@playwright/test";

// Same "recommended vs. lower relevance" split as the Ansökningsstudio's
// matching results, applied to the call list under Ansöka → Hitta
// finansiering (formerly the Bevakning tab): calls with a real
// portfolio match (or an explicit watch) show under "Utlysningar som
// matchar din portfölj" up front; anything else collapses behind a "Visa
// fler" toggle instead of disappearing outright.

test("every call renders under one section or the other — none silently dropped", async ({ page }) => {
  await page.goto("/ansok");

  await expect(page.getByRole("heading", { name: /Utlysningar som matchar din portfölj/i })).toBeVisible();
  const visibleCount = await page.getByRole("button", { name: /^☆ Bevaka$|^★ Bevakas$/ }).count();

  const toggle = page.getByRole("button", { name: /Visa fler \/ övriga utlysningar/ });
  if (await toggle.count()) {
    await toggle.click();
    const expandedCount = await page.getByRole("button", { name: /^☆ Bevaka$|^★ Bevakas$/ }).count();
    expect(expandedCount).toBeGreaterThan(visibleCount);
    await page.getByRole("button", { name: "Dölj övriga utlysningar" }).click();
    await expect(page.getByRole("button", { name: /^☆ Bevaka$|^★ Bevakas$/ })).toHaveCount(visibleCount);
  }
});

test("watching a call from its own card is reflected immediately in the 'only watched' filter", async ({ page }) => {
  // Regression coverage for a real bug found while adding the section
  // split: extracting the call card into its own component and having it
  // call useWatchPreferences() a second time desynced from the parent's own
  // copy of that hook's state (a plain useState with no shared store across
  // call sites), so a watch toggled from the card never reached the page's
  // own "onlyWatched" filter. Fixed by passing watchedCallIds/onToggleCall
  // down as props instead of a second hook instance.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "eu-navigator-watch-preferences",
      JSON.stringify({
        sectors: [],
        programIds: [],
        callIds: [],
      })
    );
  });

  await page.goto("/ansok");
  const findFunding = page.locator("section", { has: page.getByRole("heading", { name: "Hitta finansiering" }) });
  const firstCard = findFunding.locator("div.rounded-xl").first();
  await firstCard.getByRole("button", { name: "☆ Bevaka" }).click();
  await expect(firstCard.getByRole("button", { name: "★ Bevakas" })).toBeVisible();

  await page.getByRole("checkbox", { name: /Visa endast mina bevakningar/i }).check();
  await expect(page.getByRole("button", { name: "★ Bevakas" })).toBeVisible();
});
