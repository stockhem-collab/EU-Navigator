import { test, expect } from "@playwright/test";

// The intake form collects what matching needs beyond theme: applicant
// type (eligibility), type of activity, requested grant, county, target
// group and partnership reach. These drive visible rationale lines on the
// match cards — and an ineligible applicant type pushes a call out of the
// recommended list, however well it fits thematically.

test("the example fills the new matching fields and the results explain them", async ({ page }) => {
  await page.goto("/ansokan");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();

  await expect(page.getByLabel("Typ av insats")).toHaveValue("investment");
  await expect(page.getByLabel("Sökande organisationstyp")).toHaveValue("municipality");
  // The example comes with its suggested tags already selected, so the
  // "no tags" nudge isn't shown.
  await expect(page.getByRole("button", { name: "Lägg till föreslagna" })).toHaveCount(0);

  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("heading", { name: /Rekommenderade matchningar/i })).toBeVisible();

  const lifeCard = page.locator("div.rounded-xl", { has: page.getByRole("heading", { name: /LIFE – Klimatåtgärder/ }) });
  await expect(lifeCard.getByText(/Er organisationstyp \(kommun\) är behörig sökande/)).toBeVisible();
  await expect(lifeCard.getByText(/Utlysningen finansierar den typ av insats/)).toBeVisible();
  await expect(lifeCard.getByText(/Beräknat bidrag/)).toBeVisible();
});

test("an applicant type the call doesn't accept moves it out of the recommended list", async ({ page }) => {
  await page.goto("/ansokan");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.getByLabel("Sökande organisationstyp").selectOption("sme");
  await page.locator('button[type="submit"]').click();

  // Every seeded call except Horizon Europe excludes SMEs, and Horizon
  // needs a three-country consortium this project lacks — so nothing is
  // recommended and the full list is shown as lower-relevance matches.
  await expect(page.getByRole("heading", { name: /Rekommenderade matchningar/i })).toHaveCount(0);
  await expect(page.getByText(/Inga starka matchningar hittades/)).toBeVisible();
  const lifeCard = page.locator("div.rounded-xl", { has: page.getByRole("heading", { name: /LIFE – Klimatåtgärder/ }) });
  await expect(lifeCard.getByText(/Er organisationstyp \(sme\) kan inte söka/)).toBeVisible();
  await expect(lifeCard.getByText("LÅG PRIORITET")).toBeVisible();
});

test("a requested grant larger than the total budget is rejected in the form", async ({ page }) => {
  await page.goto("/ansokan");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.getByLabel(/Sökt EU-bidrag/).fill("999000000");
  await expect(page.getByText("Sökt bidrag kan inte vara större än totalbudgeten.")).toBeVisible();
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("heading", { name: /Finansieringsmöjligheter hittade/ })).toHaveCount(0);
});
