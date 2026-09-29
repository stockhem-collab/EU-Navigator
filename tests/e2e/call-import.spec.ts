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
  await page.getByLabel("Titel (svenska)").fill(titleSv);
  await page.getByLabel("Titel (engelska)").fill(titleEn);
  await page.getByRole("button", { name: "Spara utlysning" }).click();
  await expect(page.getByText(titleSv)).toBeVisible();
}

test("parsing pasted call text proposes structured fields for review, not a live AI call", async ({ page }) => {
  await page.goto("/datacenter/import-utlysning");
  await page.locator("textarea").first().fill(SAMPLE_TEXT);
  await page.getByRole("button", { name: "Tolka texten" }).click();

  await expect(page.getByLabel("Total budget (SEK)")).toHaveValue("250000000");
  await expect(page.getByLabel("Lägsta bidrag (SEK)")).toHaveValue("4000000");
  await expect(page.getByLabel("Högsta bidrag (SEK)")).toHaveValue("60000000");
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

  // Removable again from the import tool's own list — removal now asks for
  // confirmation first.
  await page.goto("/datacenter/import-utlysning");
  page.once("dialog", (d) => d.accept());
  await page.locator("li", { hasText: title }).getByRole("button", { name: "Ta bort" }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});

test("parsing also suggests tags from the fixed vocabulary, and warns if none end up selected", async ({ page }) => {
  await page.goto("/datacenter/import-utlysning");
  await page.locator("textarea").first().fill(SAMPLE_TEXT);
  await page.getByRole("button", { name: "Tolka texten" }).click();

  // SAMPLE_TEXT doesn't contain any word the tag dictionary recognises
  // (see lib/matching/tagSuggestions.ts), so no tags get pre-selected and
  // the advisory warning should be visible rather than silently absent.
  await expect(page.getByText("Utlysningen har inga taggar valda")).toBeVisible();

  // A tag can still be picked by hand from the full vocabulary.
  await page.getByRole("button", { name: "Klimatåtgärder", exact: true }).click();
  await expect(page.getByText("Utlysningen har inga taggar valda")).toHaveCount(0);

  // Text that does match the dictionary pre-selects the corresponding tag.
  await page.locator("textarea").first().fill("Utlysningen fokuserar på energieffektivisering i skolor.");
  await page.getByRole("button", { name: "Tolka texten" }).click();
  const energyChip = page.getByRole("button", { name: "Energieffektivisering", exact: true });
  await expect(energyChip).toHaveAttribute("aria-pressed", "true");
});

test("an imported call participates in matching just like a seeded one", async ({ page }) => {
  const title = `Matchningstest ${Date.now()}`;
  const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  await importSampleCall(page, title, "Matching test");

  await page.goto(`/ansokan?call=${slug}`);
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();

  await expect(page.getByText(`AI-stödd ansökningsyta — ${title}`)).toBeVisible();

  // Clean up so this doesn't leak into other tests sharing storage.
  await page.goto("/datacenter/import-utlysning");
  page.once("dialog", (d) => d.accept());
  await page.locator("li", { hasText: title }).getByRole("button", { name: "Ta bort" }).click();
});

test("parsing fills the fields matching needs, and the form lists what's still missing", async ({ page }) => {
  await page.goto("/datacenter/import-utlysning");
  await page.locator("textarea").first().fill(`${SAMPLE_TEXT}
Utlysningen finansierar investeringar i energieffektivisering.
Sista ansökningsdag är 2031-03-15.
Stödnivån är högst 70 % av de stödberättigande kostnaderna.

Bedömningskriterier:
- Relevans – 40 poäng
- Genomförande – 60 poäng`);
  await page.getByRole("button", { name: "Tolka texten" }).click();

  await expect(page.getByLabel("Sista ansökningsdag")).toHaveValue("2031-03-15");
  await expect(page.getByLabel(/Stödnivå/)).toHaveValue("70");
  // "minst två andra länder" in SAMPLE_TEXT = three countries in total.
  await expect(page.getByLabel("Minsta antal länder i partnerskapet")).toHaveValue("3");
  await expect(page.getByLabel(/Investering/)).toBeChecked();
  await expect(page.getByLabel("Kriterium, t.ex. Relevans")).toHaveCount(2);

  // Applicant types, activity type, criteria, tags, grant range and
  // deadline are all filled in, so nothing is flagged as missing.
  await expect(page.getByText("Allt som matchningen använder är ifyllt.")).toBeVisible();

  // Removing a criterion-relevant field shows up in the checklist.
  await page.getByLabel(/Investering/).uncheck();
  await expect(page.getByText(/Typ av insats – räknas som okänd/)).toBeVisible();
});

test("an imported call's deadline date, funding rate and criteria are saved and shown", async ({ page }) => {
  const title = `Datumtest ${Date.now()}`;
  await page.goto("/datacenter/import-utlysning");
  await page.locator("textarea").first().fill(SAMPLE_TEXT);
  await page.getByRole("button", { name: "Tolka texten" }).click();
  await page.locator("select").first().selectOption("life");
  await page.getByLabel("Titel (svenska)").fill(title);
  await page.getByLabel("Titel (engelska)").fill("Date test");
  await page.getByLabel("Sista ansökningsdag").fill("2031-06-30");
  await page.getByLabel(/Stödnivå/).fill("55");
  await page.getByRole("button", { name: "+ Lägg till kriterium" }).click();
  await page.getByLabel("Kriterium, t.ex. Relevans").fill("Relevans");
  await page.getByLabel("Engelskt namn (valfritt)").fill("Relevance");
  await page.getByLabel("Prioriteringar på engelska (valfritt)").fill("Measurable climate effect");
  await page.getByRole("button", { name: "Spara utlysning" }).click();

  await page.locator("li", { hasText: title }).getByRole("link").click();
  await expect(page.getByText("2031-06-30")).toBeVisible();
  await expect(page.getByText("Stödnivå upp till 55 %")).toBeVisible();
  await expect(page.getByText("Relevans", { exact: true })).toBeVisible();
  await expect(page.getByText("Mätbar klimateffekt")).toBeVisible();

  // The English versions are shown in English, not the Swedish text.
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByText("Relevance", { exact: true })).toBeVisible();
  await expect(page.getByText("Measurable climate effect")).toBeVisible();
  await page.getByRole("button", { name: "SV", exact: true }).click();

  await page.goto("/datacenter/import-utlysning");
  page.once("dialog", (d) => d.accept());
  await page.locator("li", { hasText: title }).getByRole("button", { name: "Ta bort" }).click();
});
