import { test, expect } from "@playwright/test";

// "Visa endast mina och delade projekt" is one choice across Översikt,
// Projekt, Ansöka and Rapportera, and on Ansöka it narrows both the
// applications and the projects matched under Hitta finansiering.

const toggle = (page: import("@playwright/test").Page) => page.getByLabel("Visa endast mina och delade projekt");

test("ticking it on one page holds on the others", async ({ page }) => {
  await page.goto("/projekt");
  await toggle(page).check();

  for (const path of ["/ansok", "/rapportera", "/oversikt"]) {
    await page.goto(path);
    await expect(toggle(page)).toBeChecked();
  }

  await toggle(page).uncheck();
  await page.goto("/projekt");
  await expect(toggle(page)).not.toBeChecked();
});

test("on Ansöka it narrows the applications and the matched projects alike", async ({ page }) => {
  await page.goto("/ansok");
  const applications = page.locator("section", { has: page.getByRole("heading", { name: "Ansökningar" }) });
  const findFunding = page.locator("section", { has: page.getByRole("heading", { name: "Hitta finansiering" }) });
  await page.getByRole("tab", { name: "Alla" }).click();

  // Everyone's: the three seeded applications, and pb-3 among the matches.
  await expect(applications.locator("li")).toHaveCount(3);
  await expect(findFunding.getByText("Kompetenslyft äldreomsorg").first()).toBeVisible();

  // Only the current user's and shared projects: pb-3 is neither.
  await toggle(page).check();
  await expect(applications.locator("li")).toHaveCount(1);
  await expect(applications.getByText("Energieffektivisering kommunala skolor")).toBeVisible();
  await expect(findFunding.getByText("Kompetenslyft äldreomsorg")).toHaveCount(0);
});

test("it narrows the reporting too, under Rapportera and on Översikt", async ({ page }) => {
  // pb-1's grant (LIFE) is the current user's; pb-3's (ESF+) is not.
  await page.goto("/rapportera");
  const main = page.locator("main");
  await expect(main.getByText("Kompetenslyft äldreomsorg").first()).toBeVisible();
  await toggle(page).check();
  await expect(main.getByText("Kompetenslyft äldreomsorg")).toHaveCount(0);
  await expect(main.getByText("Energieffektivisering kommunala skolor").first()).toBeVisible();

  await page.goto("/oversikt");
  await expect(toggle(page)).toBeChecked();
  const reporting = page.locator("section", { has: page.getByRole("heading", { name: "Rapportering", exact: true }) });
  await expect(reporting.getByText("Slutrapport")).toBeVisible();
  await expect(reporting.getByText(/Kompetenslyft/i)).toHaveCount(0);
  const unread = page.locator("section", { has: page.getByRole("heading", { name: "Olästa aviseringar" }) });
  await expect(unread.getByText("Rapport returnerad för komplettering")).toHaveCount(0);
});
