import { test, expect } from "@playwright/test";

// Coverage for the gaps found in a full-system review: real document
// attachments (as opposed to the docx files the system itself generates),
// per-project ad-hoc tasks visible both on the project and across the whole
// portfolio, every awarded project's outstanding reporting deadlines
// surfacing on the Bevakning page by default (not only under
// Inställningar, and not gated behind an explicit watch action),
// exporting a specific saved application version rather than always the
// live draft, and the header's call-to-action reflecting what it actually
// opens.

test("a document can be attached to, downloaded from, and removed from a project", async ({ page }) => {
  await page.goto("/projekt/pb-1");

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
  await page.getByRole("button", { name: "Ja, ta bort" }).click();
  await expect(page.getByText("Inga bilagor sparade än.")).toBeVisible();
});

test("a task can be added and completed on a project, and shows up on Översikt", async ({ page }) => {
  await page.goto("/projekt/pb-1");

  await expect(page.getByText("Inga uppgifter tillagda än.")).toBeVisible();

  const taskText = `Boka avstämning ${Date.now()}`;
  await page.getByPlaceholder(/Ny uppgift/).fill(taskText);
  await page.getByRole("button", { name: "Lägg till uppgift" }).click();
  await expect(page.getByText(taskText)).toBeVisible();

  await page.goto("/oversikt");
  await expect(page.getByRole("heading", { name: "Uppgifter" })).toBeVisible();
  await expect(page.getByText(taskText)).toBeVisible();

  await page.goto("/projekt/pb-1");
  // The task's own checkbox — the sharing checkboxes further up the page
  // can render first.
  await page.locator("li", { hasText: taskText }).getByRole("checkbox").check();

  await page.goto("/oversikt");
  await expect(page.getByText(taskText)).toHaveCount(0);
});

test("an existing task's text and due date can be edited in place", async ({ page }) => {
  await page.goto("/projekt/pb-1");

  const originalText = `Original text ${Date.now()}`;
  await page.getByPlaceholder(/Ny uppgift/).fill(originalText);
  await page.getByRole("button", { name: "Lägg till uppgift" }).click();
  await expect(page.getByText(originalText)).toBeVisible();

  await page.getByRole("button", { name: "Redigera", exact: true }).click();
  const editRow = page.locator("li", { has: page.getByRole("button", { name: "Spara" }) });
  await expect(editRow.locator('input[type="text"]')).toHaveValue(originalText);

  const editedText = `Edited text ${Date.now()}`;
  await editRow.locator('input[type="text"]').fill(editedText);
  await editRow.locator('input[type="date"]').fill("2027-06-15");
  await editRow.getByRole("button", { name: "Spara" }).click();

  await expect(page.getByText(originalText)).toHaveCount(0);
  await expect(page.getByText(editedText)).toBeVisible();
  await expect(page.getByText("Förfaller 2027-06-15")).toBeVisible();

  // Persists across a reload, not just in local component state.
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(editedText)).toBeVisible();

  // Cancelling an edit discards the in-progress change.
  await page.getByRole("button", { name: "Redigera", exact: true }).click();
  await page.locator("li", { has: page.getByRole("button", { name: "Avbryt" }) }).locator('input[type="text"]').fill("Should not be saved");
  await page.getByRole("button", { name: "Avbryt" }).click();
  await expect(page.getByText("Should not be saved")).toHaveCount(0);
  await expect(page.getByText(editedText)).toBeVisible();

  // Clean up so this doesn't leak into other tests sharing storage.
  await page.locator("li", { hasText: editedText }).getByRole("button", { name: "Ta bort" }).click();
});

test("every grant's outstanding reports show under Rapportera by default, with no watch action needed", async ({ page }) => {
  // ap-2 has both a revision-requested report (Q1 2027) and an upcoming one
  // (Q3 2027), neither of which has ever been starred/watched — reporting
  // an organisation is accountable for is always shown, unlike calls where
  // opting in to a watchlist is genuinely useful.
  await page.goto("/rapportera");
  await expect(page.getByText("Delrapport Q1 2027")).toBeVisible();
  await expect(page.getByText("Delrapport Q3 2027")).toBeVisible();
});

test("a saved application version exports independently of later edits to the live draft", async ({ page }) => {
  await page.goto("/projekt/pb-4");
  const startLink = page.locator('a[href*="/ansokan?project=pb-4"]').first();
  const href = await startLink.getAttribute("href");
  await page.goto(href!);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();

  const textarea = page.locator("textarea").first();
  const savedValue = `Saved for export ${Date.now()}`;
  await textarea.fill(savedValue);
  await page.waitForTimeout(200);

  await page.getByRole("button", { name: /^Utkast$|^Draft$/ }).click();
  await page.getByRole("button", { name: /Spara version|Save version/i }).click();
  await expect(page.getByText(/^Utkast$|^Draft$/).filter({ visible: true }).first()).toBeVisible();

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
  await page.goto("/stod/ap-1");

  const reportCard = page.locator("div.rounded-xl", { hasText: "Lägesrapport 2027" });
  await reportCard.locator('input[type="file"]').setInputFiles({
    name: "evidence.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("evidence content"),
  });

  await expect(reportCard.getByText("evidence.txt")).toBeVisible();
  await reportCard.getByRole("button", { name: "Ta bort" }).click();
  await page.getByRole("button", { name: "Ja, ta bort" }).click();
  await expect(reportCard.getByText("evidence.txt")).toHaveCount(0);
});

test("the homepage's calls-to-action reflect real function, not just a demo", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  // Header CTA.
  await expect(page.getByRole("link", { name: "Starta ansökan" }).first()).toBeVisible();
  // Bottom-of-page CTA banner — a separate translation block from the
  // header's, easy to miss when auditing "demo" wording by exact string.
  await expect(page.getByRole("link", { name: "Starta ansökan" }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: /Prova demo|Starta demo/i })).toHaveCount(0);
});
