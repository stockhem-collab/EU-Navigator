import { test, expect, Page } from "@playwright/test";

// The Projekt / Ansöka / Rapportera structure: applications and reporting
// each have their own tab across all projects, Översikt shows what needs
// doing now, and a notification bell replaces the old Bevakning tab.

async function startApplication(page: Page, projectId: string) {
  await page.goto(`/projekt/${projectId}`);
  const href = await page.locator("main").getByRole("link", { name: /^(Starta ansökan|Fortsätt ansökan)$/ }).first().getAttribute("href");
  await page.goto(href!);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await page.locator("textarea").first().fill(`Utkast ${Date.now()}`);
  await page.waitForTimeout(200);
}

const bell = (page: Page) => page.getByRole("button", { name: /^Aviseringar/ });
const panel = (page: Page) => page.getByRole("dialog", { name: "Aviseringar" });

test("Ansöka lists applications across projects, filtered by where they stand", async ({ page }) => {
  await startApplication(page, "pb-4");
  await page.getByLabel("Ansökans status").selectOption("submitted");
  await startApplication(page, "pb-5");

  await page.goto("/ansok");
  const list = page.locator("section", { has: page.getByRole("heading", { name: "Ansökningar" }) });
  // "Pågående" is the default: both the draft and the submitted one.
  await expect(list.locator("li")).toHaveCount(2);
  await expect(list.getByText("Cykelinfrastruktur city")).toBeVisible();

  // Decided: the two seeded example applications whose grants are being
  // reported on.
  await page.getByRole("tab", { name: "Beslut" }).click();
  await expect(list.locator("li")).toHaveCount(2);
  await expect(list.getByText("Energieffektivisering kommunala skolor")).toBeVisible();

  // Calls to apply to are further down on the same page.
  await expect(page.getByRole("heading", { name: "Hitta finansiering" })).toBeVisible();
});

test("Översikt shows the applications and reporting that need doing now", async ({ page }) => {
  await startApplication(page, "pb-4");
  await page.goto("/oversikt");
  const apps = page.locator("section", { has: page.getByRole("heading", { name: "Ansökningar", exact: true }) });
  await expect(apps.getByText("Cykelinfrastruktur city")).toBeVisible();
  const reporting = page.locator("section", { has: page.getByRole("heading", { name: "Rapportering", exact: true }) });
  await expect(reporting.locator("li").first()).toBeVisible();
  // The role switcher is gone.
  await expect(page.getByRole("button", { name: "EU-/finansieringssamordnare" })).toHaveCount(0);
});

test("the bell lists notifications; opening one marks it read, and 'mark all' clears the count", async ({ page }) => {
  await page.goto("/oversikt");
  await expect(bell(page)).toHaveAccessibleName(/olästa/);
  await bell(page).click();
  const items = panel(page).getByRole("link").filter({ hasNot: page.getByText("Inställningar för aviseringar") });
  const first = items.first();
  const label = await bell(page).getAttribute("aria-label");
  const before = Number(label?.match(/(\d+) olästa/)?.[1] ?? 0);
  expect(before).toBeGreaterThan(0);

  await first.click();
  await expect(bell(page)).toHaveAccessibleName(new RegExp(before - 1 === 0 ? "^Aviseringar$" : `${before - 1} olästa`));

  await bell(page).click();
  await panel(page).getByRole("button", { name: "Markera alla som lästa" }).click();
  await expect(bell(page)).toHaveAccessibleName("Aviseringar");
});

test("changing an application's status produces a notification", async ({ page }) => {
  await startApplication(page, "pb-6");
  await page.getByLabel("Ansökans status").selectOption("awarded");
  await bell(page).click();
  await expect(panel(page).getByText("Ansökan beviljad – registrera stödet")).toBeVisible();
  await expect(panel(page).getByText("Ansökan ändrad till beviljad")).toBeVisible();
});

test("notification settings: switching a category off in the app removes it from the bell", async ({ page }) => {
  await page.goto("/oversikt");
  await bell(page).click();
  await expect(panel(page).getByText("Rapport returnerad för komplettering").first()).toBeVisible();

  await page.goto("/installningar/bevakningar");
  await page.getByLabel("I systemet: Rapportering").uncheck();
  await expect(page.getByText(/inga e-postmeddelanden/)).toBeVisible();

  await page.goto("/oversikt");
  await bell(page).click();
  await expect(panel(page).getByText("Rapport returnerad för komplettering")).toHaveCount(0);
});
