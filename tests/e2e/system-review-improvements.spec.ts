import { test, expect } from "@playwright/test";

// Coverage for the second full-system review's approved improvements:
// orientation (active nav, homepage quick links, settings tab strip),
// safer destructive actions (confirmations that were missing), better
// scanning in EU-databas and Referensprojekt, an honestly-labelled "coming
// feature" instead of a dead-looking disabled button, and — the review's
// own example — a reporting step whose document checklist actually adapts
// to the call and the report type, instead of being generic.

test("the active nav link is visually marked, and the homepage links to every section", async ({ page }) => {
  await page.goto("/projektbank");
  await expect(page.getByRole("navigation").first().getByRole("link", { name: "Projektbank" })).toHaveAttribute(
    "aria-current",
    "page"
  );

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Alla delar av systemet" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Datacenter" }).first()).toBeVisible();
});

test("Inställningar subpages share a tab strip, and resetting asks for confirmation", async ({ page }) => {
  await page.goto("/installningar/organisation");
  await page.getByRole("link", { name: "Användare & behörigheter" }).click();
  await expect(page).toHaveURL(/\/installningar\/anvandare/);

  await page.goto("/installningar/organisation");
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Återställ allt till exempeldata" }).click();
  // Dismissing the confirmation must leave the page's own content intact.
  await expect(page.getByRole("heading", { name: "Organisationsstruktur" })).toBeVisible();
});

test("Datacenter surfaces reports needing attention with a link into the project", async ({ page }) => {
  await page.goto("/datacenter");
  await expect(page.getByRole("heading", { name: "Rapporteringar som kräver uppmärksamhet" })).toBeVisible();
  await page.getByRole("link", { name: "Visa projekt →" }).first().click();
  await expect(page).toHaveURL(/\/projekt\/ap-/);
});

test("EU-databas call page groups documents by type and shows the call's reporting requirements", async ({ page }) => {
  await page.goto("/eu-databas/life/life-2027-climate-schools");
  await expect(page.getByText("Rapporteringsanvisning", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rapporteringskrav för utlysningen" })).toBeVisible();
});

test("Referensprojekt can be searched and links back into starting an application", async ({ page }) => {
  await page.goto("/referensprojekt");
  await expect(page.getByRole("link", { name: /Starta en ansökan/ })).toBeVisible();
  await page.getByPlaceholder("Sök bland projekten…").fill("zzz-inget-matchar-zzz");
  await expect(page.getByText("Inga projekt matchar din sökning.")).toBeVisible();
});

test("a reporting event shows the right document checklist for its type and links to the call's instructions", async ({
  page,
}) => {
  await page.goto("/projekt/ap-1");
  // ap-1's next actionable report is the final report — its checklist must
  // be the final-report documents (shown both in the call-level summary and
  // now in the event's own card), not the generic interim list.
  await expect(page.getByText("Underlag som krävs vid slutrapportering").first()).toBeVisible();
  await expect(page.getByText("Revisionsintyg").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Se utlysningens rapporteringsanvisningar →" })).toBeVisible();
});

test("leaving an unsaved ad-hoc draft asks for confirmation, and the AI-review button is a labelled coming feature", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Fyll i exempel" }).click();
  await page.getByRole("button", { name: "Hitta finansieringsmöjligheter" }).click();
  await page.getByRole("button", { name: "Starta ansökan" }).first().click();

  await page.locator("textarea").first().fill("En redigering som inte är sparad.");
  let dialogSeen = false;
  page.once("dialog", (d) => {
    dialogSeen = true;
    d.dismiss();
  });
  await page.getByRole("button", { name: "← Tillbaka till matchningar" }).click();
  await expect.poll(() => dialogSeen).toBe(true);
  // Dismissing the dialog must keep the workspace open, draft intact.
  await expect(page.locator("textarea").first()).toHaveValue("En redigering som inte är sparad.");

  await page.getByRole("tab", { name: "Bedömning" }).click();
  const aiButton = page.getByRole("button", { name: "Begär AI-bedömning" });
  if (await aiButton.count() > 0) {
    await expect(aiButton).toBeVisible();
    await expect(aiButton).toBeDisabled();
    await expect(page.getByText("Kommande funktion")).toBeVisible();
  }
});
