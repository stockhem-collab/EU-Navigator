import { test, expect } from "@playwright/test";

// Every match card links straight to the call's own EU-databas page, so the
// user can read the full call before deciding to start an application. It
// opens in a new tab, since the match results only live in the demo page's
// state and would be lost by navigating away.

test("each match card links to its call's detail page in a new tab", async ({ page, context }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();

  const links = page.getByRole("link", { name: /Läs mer om utlysningen/ });
  await expect(links.first()).toBeVisible();
  expect(await links.count()).toBe(await page.getByRole("button", { name: "Starta ansökan" }).count());

  const href = await links.first().getAttribute("href");
  expect(href).toMatch(/^\/eu-databas\/[^/]+\/[^/]+$/);
  await expect(links.first()).toHaveAttribute("target", "_blank");

  const [callPage] = await Promise.all([context.waitForEvent("page"), links.first().click()]);
  await callPage.waitForLoadState();
  expect(new URL(callPage.url()).pathname).toBe(href);
  await expect(callPage.getByRole("heading", { level: 1 })).toBeVisible();

  // The original tab still shows the match results.
  await expect(page.getByRole("heading", { name: /Rekommenderade matchningar/i })).toBeVisible();
});
