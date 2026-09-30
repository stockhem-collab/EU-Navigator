import { test, expect, Page, Locator } from "@playwright/test";

// The summary figures at the top of Översikt, Ansöka, Rapportera and
// Datacenter are all clickable: a shortcut down to (or over to) the list
// behind the figure, or — on Ansöka, as on Projekt — a filter of the list
// right below. A shortcut must land with the section's own heading in view,
// not hidden under the sticky header.

async function expectHeadingClearOfHeader(page: Page, heading: Locator) {
  await expect(heading).toBeInViewport();
  await expect
    .poll(async () => {
      const header = await page.locator("header").first().boundingBox();
      const box = await heading.boundingBox();
      return header && box ? box.y - (header.y + header.height) : -1;
    })
    .toBeGreaterThanOrEqual(0);
}

test("Rapportera's figures jump to their lists, heading in view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("/rapportera");
  const main = page.locator("main");

  await main.getByRole("link", { name: /Beviljade stöd/ }).first().click();
  await expect(page).toHaveURL(/#grants$/);
  await expectHeadingClearOfHeader(page, page.getByRole("heading", { name: "Beviljade stöd" }));

  await main.getByRole("link", { name: /^\d+\s*Kommande$/ }).click();
  await expect(page).toHaveURL(/#upcoming$/);
  await expectHeadingClearOfHeader(page, page.getByRole("heading", { name: "Kommande rapporter" }));

  // The done list is folded away; its figure unfolds it.
  await main.getByRole("link", { name: /Inlämnade eller godkända/ }).click();
  await expect(page).toHaveURL(/#done$/);
  await expect(page.getByRole("button", { name: /Dölj|Hide/ })).toBeVisible();
});

test("Översikt's report figures lead to that list on Rapportera, heading in view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("/oversikt");
  await page.locator("main").getByRole("link", { name: /Kommande rapporter/ }).first().click();
  await expect(page).toHaveURL(/\/rapportera#upcoming$/);
  await expectHeadingClearOfHeader(page, page.getByRole("heading", { name: "Kommande rapporter" }));

  await page.goto("/oversikt");
  await page.locator("main").getByRole("link", { name: /Öppna uppgifter/ }).click();
  await expectHeadingClearOfHeader(page, page.getByRole("heading", { name: "Uppgifter", exact: true }));
});

test("Ansöka's figures filter the list, like Projekt's", async ({ page }) => {
  await page.goto("/ansok");
  const awarded = page.getByRole("button", { name: /Beviljade/ });
  await awarded.click();
  await expect(awarded).toHaveAttribute("aria-pressed", "true");
  const rows = page.locator("#applications li");
  const count = await rows.count();
  for (let i = 0; i < count; i++) await expect(rows.nth(i)).toContainText("Beviljad");
  // A second click goes back to the default list.
  await awarded.click();
  await expect(awarded).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("tab", { name: "Pågående" })).toHaveAttribute("aria-selected", "true");
});

test("Datacenter's figures lead to their lists", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("/datacenter");
  await page.getByRole("link", { name: /Dokument som behöver uppdateras/ }).click();
  await expectHeadingClearOfHeader(page, page.getByRole("heading", { name: "Dokument som behöver uppdateras" }));

  await page.goto("/datacenter");
  await page.getByRole("link", { name: /Beviljade referensprojekt/ }).click();
  await expect(page).toHaveURL(/\/referensprojekt/);

  // Applications by status open Ansöka filtered to that status.
  await page.goto("/datacenter");
  await page.locator('a[href^="/ansok?filter=awarded"]').click();
  await expect(page).toHaveURL(/\/ansok\?filter=awarded/);
  await expect(page.getByRole("button", { name: /Beviljade/ })).toHaveAttribute("aria-pressed", "true");
});
