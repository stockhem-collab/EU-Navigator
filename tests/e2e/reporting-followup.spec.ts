import { test, expect } from "@playwright/test";

// Coverage for the follow-up/reporting improvements built on top of the base
// reporting cycle: correcting a revision-requested report leaves an audit
// trail (including the seed data's own original outcome, which is never
// itself a dated submission), a completed project can get a voluntary
// sustainability follow-up event, and an awarded project links back to the
// Projektbank idea it came from.

test("correcting a revision-requested report shows the original outcome as reporting history", async ({ page }) => {
  await page.goto("/stod/ap-2");

  const numberInputs = page.locator('input[type="number"]');
  await expect(numberInputs.nth(0)).toHaveValue("140");
  await numberInputs.nth(0).fill("180");
  await page.getByRole("button", { name: "Skicka in korrigering" }).click();

  await expect(page.getByText("Tidigare inlämningar (1)")).toBeVisible();
  await expect(page.getByText("180 personer")).toBeVisible();

  await page.getByRole("button", { name: /Tidigare inlämningar/ }).click();
  await expect(page.getByText("Ursprunglig rapport")).toBeVisible();
  await expect(page.getByText("Antal utbildade medarbetare: 140")).toBeVisible();
});

test("completing all reporting unlocks a voluntary sustainability follow-up", async ({ page }) => {
  await page.goto("/stod/ap-1");

  const inputs = page.locator('input[type="number"]');
  await inputs.nth(0).fill("1500");
  await inputs.nth(1).fill("20");
  await inputs.nth(2).fill("5");
  await page.getByRole("button", { name: "Markera som inlämnad" }).click();

  await expect(page.getByRole("button", { name: "Lägg till hållbarhetsuppföljning" })).toBeVisible();
  await page.getByRole("button", { name: "Lägg till hållbarhetsuppföljning" }).click();

  await expect(page.getByRole("heading", { name: "Hållbarhetsuppföljning" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lägg till hållbarhetsuppföljning" })).toHaveCount(0);
});

test("a grant links back to its project, and the project page lists the grant", async ({ page }) => {
  await page.goto("/stod/ap-1");
  await page.getByRole("link", { name: "Energieffektivisering kommunala skolor" }).click();
  await expect(page).toHaveURL(/\/projekt\/pb-1/);

  // The project's path shows its grant and reporting, and the grants
  // section links back to the grant.
  await expect(page.getByRole("region", { name: "Projektets väg" })).toBeVisible();
  const grants = page.locator("section", { has: page.getByRole("heading", { name: "Beviljat stöd och rapportering" }) });
  await grants.getByRole("link", { name: "Visa beviljat stöd" }).click();
  await expect(page).toHaveURL(/\/stod\/ap-1/);
});

test("a reported event can be exported as a .docx file", async ({ page }) => {
  await page.goto("/stod/ap-1");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportera rapport (.docx)" }).first().click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.docx$/);
});
