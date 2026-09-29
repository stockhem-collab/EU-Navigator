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
