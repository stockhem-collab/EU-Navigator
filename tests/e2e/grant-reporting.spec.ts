import { test, expect, Page } from "@playwright/test";

// The grant's reporting, end to end: registering a grant confirms the
// commitments (suggested from what the application promised) and schedules
// every report with a date; the next report is written on the grant's page
// — responsible person, required documents, figures with explanations,
// text — and the funder's response is recorded as dated actions. Reports,
// and the whole grant, export to Word at any point.

async function registerFromApplication(page: Page, sentence: string) {
  await page.goto("/projekt/pb-3");
  const link = page.locator("main").getByRole("link", { name: /^(Starta ansökan|Fortsätt ansökan)$/ }).first();
  await page.goto((await link.getAttribute("href"))!);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await page.locator("textarea").first().fill(sentence);
  await page.waitForTimeout(200);
  await page.getByLabel("Ansökans status").selectOption("awarded");
  await page.goto("/projekt/pb-3");
  await page.getByRole("button", { name: "Registrera beviljat stöd" }).click();
}

test("registering a grant confirms its commitments and schedules every report with a date", async ({ page }) => {
  await registerFromApplication(page, "Projektet ska utbilda 250 medarbetare i digitala arbetssätt.");

  // Suggested from the application's text, and editable before confirming.
  const rows = page.getByTestId("commitment-row");
  await expect(rows.first().getByLabel("Indikator")).toHaveValue("Projektet ska utbilda i digitala arbetssätt");
  await expect(rows.first().getByLabel("Mål")).toHaveValue("250");
  await rows.first().getByLabel("Indikator").fill("Utbildade medarbetare");
  await page.getByRole("button", { name: "Ja, registrera" }).click();
  await expect(page).toHaveURL(/\/stod\//);

  // The whole plan, each report dated, the final report last.
  const reports = page.locator("#reports li");
  expect(await reports.count()).toBeGreaterThan(1);
  await expect(reports.last().getByRole("heading", { name: "Slutrapport" })).toBeVisible();
  await expect(reports.first()).toContainText(/Förfaller \d{1,2} \w+ \d{4}/);

  // Followed up, and editable here too.
  const followUp = page.locator("#follow-up");
  await expect(followUp.getByRole("heading", { name: "Utbildade medarbetare" })).toBeVisible();
  await followUp.getByRole("button", { name: "Redigera åtaganden" }).click();
  await followUp.getByRole("button", { name: "+ Lägg till åtagande" }).click();
  await followUp.getByTestId("commitment-row").last().getByLabel("Indikator").fill("Nya arbetssätt i drift");
  await followUp.getByTestId("commitment-row").last().getByLabel("Mål").fill("3");
  await followUp.getByTestId("commitment-row").last().getByLabel("Enhet").fill("st");
  await followUp.getByRole("button", { name: "Spara åtaganden" }).click();
  await page.reload();
  await expect(followUp.getByRole("heading", { name: "Nya arbetssätt i drift" })).toBeVisible();
});

test("the next report is written on the page, and the funder's response is recorded", async ({ page }) => {
  await page.goto("/stod/ap-1");
  const next = page.locator("#next-report");

  // Responsible person, and the text saved as it's typed.
  await next.getByLabel("Ansvarig").selectOption({ label: "Andrea Lindqvist" });
  await next.getByLabel("Genomförda aktiviteter").fill("Samtliga 14 skolor är renoverade.");
  await page.waitForTimeout(200);
  await page.reload();
  await expect(next.getByLabel("Genomförda aktiviteter")).toHaveValue("Samtliga 14 skolor är renoverade.");
  await expect(next.getByLabel("Ansvarig")).not.toHaveValue("");

  // A required document is ready once its file is attached.
  const checklistItem = next.getByRole("checkbox", { name: "Revisionsintyg" });
  await expect(checklistItem).not.toBeChecked();
  await next.getByLabel("Bifoga fil: Revisionsintyg").setInputFiles({
    name: "revisionsintyg.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4"),
  });
  await expect(checklistItem).toBeChecked();

  // The responsible person shows on Rapportera.
  await page.goto("/rapportera");
  await expect(page.locator("main").getByText("Ansvarig: Andrea Lindqvist").first()).toBeVisible();

  // A submitted report gets the funder's response as an action, dated.
  await page.goto("/stod/ap-1");
  const row = page.locator("#reports li", { hasText: "Lägesrapport 2028" });
  await row.getByRole("button", { name: "Visa" }).click();
  await row.getByRole("button", { name: "Godkänd" }).click();
  await expect(row.getByTestId("report-status")).toHaveText("Godkänd");
  await expect(row.getByText("Besked: Godkänd")).toBeVisible();
});

test("a report exports to Word before anything is reported, and so does the whole grant", async ({ page }) => {
  await page.goto("/stod/ap-1");
  const [report] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#next-report").getByRole("button", { name: "Exportera rapport (.docx)" }).click(),
  ]);
  expect(report.suggestedFilename()).toBe("rapport-ap-1-ap-1-report-3.docx");

  const [all] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportera hela stödet (.docx)" }).click(),
  ]);
  expect(all.suggestedFilename()).toBe("stod-ap-1.docx");
});
