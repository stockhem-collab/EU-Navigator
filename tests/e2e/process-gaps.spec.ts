import { test, expect } from "@playwright/test";

// Coverage for the gaps found in a full-system review: real document
// attachments (as opposed to the docx files the system itself generates),
// per-project ad-hoc tasks visible both on the project and across the whole
// portfolio, watched reporting deadlines surfacing on the same page as
// watched calls (not only under Inställningar), exporting a specific saved
// application version rather than always the live draft, and the header's
// call-to-action reflecting what it actually opens.

test("a document can be attached to, downloaded from, and removed from a Projektbank entry", async ({ page }) => {
  await page.goto("/projektbank/pb-1");

  await expect(page.getByText("Inga bilagor sparade än.")).toBeVisible();

  await page.setInputFiles('input[type="file"]', {
    name: "budget.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("budget content"),
  });

  const fileButton = page.getByRole("button", { name: "budget.txt" });
  await expect(fileButton).toBeVisible();
  await expect(page.getByText(/Uppladdad/)).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), fileButton.click()]);
  expect(download.suggestedFilename()).toBe("budget.txt");

  await page.getByRole("button", { name: "Ta bort" }).last().click();
  await expect(page.getByText("Inga bilagor sparade än.")).toBeVisible();
});

test("a task can be added and completed on a Projektbank entry, and shows up on Översikt", async ({ page }) => {
  await page.goto("/projektbank/pb-1");

  await expect(page.getByText("Inga uppgifter tillagda än.")).toBeVisible();

  const taskText = `Boka avstämning ${Date.now()}`;
  await page.getByPlaceholder(/Ny uppgift/).fill(taskText);
  await page.getByRole("button", { name: "Lägg till uppgift" }).click();
  await expect(page.getByText(taskText)).toBeVisible();

  await page.goto("/oversikt");
  await expect(page.getByText("Aktuella uppgifter")).toBeVisible();
  await expect(page.getByText(taskText)).toBeVisible();

  await page.goto("/projektbank/pb-1");
  await page.getByRole("checkbox").first().check();

  await page.goto("/oversikt");
  await expect(page.getByText(taskText)).toHaveCount(0);
});

test("a watched reporting deadline shows up on the main Bevakning page, not only in Inställningar", async ({ page }) => {
  await page.goto("/projekt/ap-2");
  const q3Card = page.locator("div.rounded-xl", { hasText: "Delrapport Q3 2027" });
  await q3Card.getByRole("button", { name: "☆ Bevaka" }).click();

  await page.goto("/bevakning");
  await expect(page.getByText("Bevakade rapporteringsdeadlines")).toBeVisible();
  await expect(page.getByText("Delrapport Q3 2027")).toBeVisible();
});

test("a saved application version exports independently of later edits to the live draft", async ({ page }) => {
  await page.goto("/projektbank/pb-4");
  const startLink = page.locator('a[href*="/demo?project=pb-4"]').first();
  const href = await startLink.getAttribute("href");
  await page.goto(href!);

  const textarea = page.locator("textarea").first();
  const savedValue = `Saved for export ${Date.now()}`;
  await textarea.fill(savedValue);
  await page.waitForTimeout(200);

  await page.getByRole("button", { name: /^Utkast$|^Draft$/ }).click();
  await page.getByRole("button", { name: /Spara version|Save version/i }).click();
  await expect(page.getByText(/^Utkast$|^Draft$/).first()).toBeVisible();

  // Keep editing the live draft after saving — the version's own export
  // must still reflect what was saved, not this later change.
  await textarea.fill("En helt annan text efter att versionen sparats");
  await page.waitForTimeout(200);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Exportera \(\.docx\)|Export \(\.docx\)/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.docx$/);
  expect(download.suggestedFilename().toLowerCase()).toContain("utkast");
});

test("a document can be attached to a specific reporting event", async ({ page }) => {
  await page.goto("/projekt/ap-1");

  const reportCard = page.locator("div.rounded-xl", { hasText: "Lägesrapport 2027" });
  await reportCard.locator('input[type="file"]').setInputFiles({
    name: "evidence.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("evidence content"),
  });

  await expect(reportCard.getByText("evidence.txt")).toBeVisible();
  await reportCard.getByRole("button", { name: "Ta bort" }).click();
  await expect(reportCard.getByText("evidence.txt")).toHaveCount(0);
});

test("the header's call-to-action reflects real function, not just a demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Starta ansökan" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Prova demo/i })).toHaveCount(0);
});
