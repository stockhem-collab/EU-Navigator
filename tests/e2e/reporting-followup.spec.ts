import { test, expect } from "@playwright/test";

// Coverage for the follow-up/reporting improvements built on top of the base
// reporting cycle: correcting a revision-requested report leaves an audit
// trail (including the seed data's own original outcome, which is never
// itself a dated submission), a specific reporting deadline can be watched
// independently of the underlying call, a completed project can get a
// voluntary sustainability follow-up event, and an awarded project links
// back to the Projektbank idea it came from.

test("correcting a revision-requested report shows the original outcome as reporting history", async ({ page }) => {
  await page.goto("/projekt/ap-2");

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

test("a specific reporting deadline can be watched and managed from Inställningar", async ({ page }) => {
  await page.goto("/projekt/ap-2");
  const q3Card = page.locator("div.rounded-xl", { hasText: "Delrapport Q3 2027" });
  await q3Card.getByRole("button", { name: "☆ Bevaka" }).click();
  await expect(q3Card.getByRole("button", { name: "★ Bevakas" })).toBeVisible();

  await page.goto("/installningar/bevakningar");
  await expect(page.getByText("Bevakade rapporteringar")).toBeVisible();
  await expect(page.getByText("Delrapport Q3 2027")).toBeVisible();

  await page.getByRole("button", { name: "Sluta bevaka" }).click();
  await expect(page.getByText("Delrapport Q3 2027")).toHaveCount(0);
});

test("completing all reporting unlocks a voluntary sustainability follow-up", async ({ page }) => {
  await page.goto("/projekt/ap-1");

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

test("an awarded project links back to its originating Projektbank idea, and vice versa", async ({ page }) => {
  await page.goto("/projekt/ap-1");
  await expect(page.getByText("Ursprunglig projektidé i Projektbanken")).toBeVisible();
  await page.getByRole("link", { name: "Energieffektivisering kommunala skolor" }).click();
  await expect(page).toHaveURL(/\/projektbank\/pb-1/);

  await expect(page.getByText("Beviljad och under rapportering")).toBeVisible();
  await page.getByRole("link", { name: "Visa rapportering →" }).click();
  await expect(page).toHaveURL(/\/projekt\/ap-1/);
});

test("a reported event can be exported as a .docx file", async ({ page }) => {
  await page.goto("/projekt/ap-1");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportera rapport (.docx)" }).first().click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.docx$/);
});
