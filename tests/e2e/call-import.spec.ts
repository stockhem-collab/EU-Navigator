import { test, expect } from "@playwright/test";

// Datacenter's utlysningsimport tool: a rule-based (not AI) first pass over
// pasted call text proposes fields, a person reviews/edits every one, and
// only then does the call become a first-class part of the catalogue —
// visible in EU-databas, counted in Datacenter, and eligible for matching
// exactly like a hand-authored seed call.

const SAMPLE_TEXT = `Utlysningen riktar sig till kommuner, regioner och kommunala bolag.
Projektet ska genomföras i partnerskap med minst två andra länder.
Total budget för utlysningen är 250 miljoner kronor.
Bidrag ges på mellan 4 miljoner kronor och 60 miljoner kronor per projekt.
Rapportering sker kvartalsvis under hela projekttiden.

Prioriteringar:
- Mätbar klimateffekt
- Skalbarhet till andra kommuner`;

async function importSampleCall(page: import("@playwright/test").Page, titleSv: string, titleEn: string) {
  await page.goto("/datacenter/import-utlysning");
  await page.locator("textarea").first().fill(SAMPLE_TEXT);
  await page.getByRole("button", { name: "Tolka texten" }).click();
  await page.locator("select").first().selectOption("life");
  const textInputs = page.locator('input:not([type="number"]):not([type="checkbox"])');
  await textInputs.nth(0).fill(titleSv);
  await textInputs.nth(1).fill(titleEn);
  await page.getByRole("button", { name: "Spara utlysning" }).click();
  await expect(page.getByText(titleSv)).toBeVisible();
}

test("parsing pasted call text proposes structured fields for review, not a live AI call", async ({ page }) => {
  await page.goto("/datacenter/import-utlysning");
  await page.locator("textarea").first().fill(SAMPLE_TEXT);
  await page.getByRole("button", { name: "Tolka texten" }).click();

  const numberInputs = page.locator('input[type="number"]');
  await expect(numberInputs.nth(0)).toHaveValue("250000000");
  await expect(numberInputs.nth(1)).toHaveValue("4000000");
  await expect(numberInputs.nth(2)).toHaveValue("60000000");
  await expect(page.locator('input[type="checkbox"]').first()).toBeChecked();
  await expect(page.getByText("Hittat i texten").first()).toBeVisible();
});

test("saving an imported call makes it a first-class part of the catalogue", async ({ page }) => {
  const title = `E2E-importtest ${Date.now()}`;
  await importSampleCall(page, title, "E2E import test");

  // Visible in EU-databas under the chosen programme, with its provenance
  // and structured applicant-type badges.
  await page.goto("/eu-databas/life");
  await expect(page.getByText(title)).toBeVisible();
  await page.getByText(title).click();
  await expect(page.getByText("Inläst via granskat importflöde")).toBeVisible();
  await expect(page.getByText("Kommun", { exact: true })).toBeVisible();

  // Counted in Datacenter's totals.
  await page.goto("/datacenter");
  const before = await page.locator("main").innerText();
  expect(before).toContain("Utlysningar med strukturerad behörighet");

  // Removable again from the import tool's own list.
  await page.goto("/datacenter/import-utlysning");
  await page.locator("li", { hasText: title }).getByRole("button", { name: "Ta bort" }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});

test("an imported call participates in matching just like a seeded one", async ({ page }) => {
  const title = `Matchningstest ${Date.now()}`;
  const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  await importSampleCall(page, title, "Matching test");

  await page.goto(`/demo?call=${slug}`);
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();

  await expect(page.getByText(`AI-stödd ansökningsyta — ${title}`)).toBeVisible();

  // Clean up so this doesn't leak into other tests sharing storage.
  await page.goto("/datacenter/import-utlysning");
  await page.locator("li", { hasText: title }).getByRole("button", { name: "Ta bort" }).click();
});
