import { test, expect } from "@playwright/test";

// What a complete application needs: the Ansökningsstudio opens on the
// Krav tab the first time an application is opened, each requirement has a
// status, and how complete the application is counts in its assessment.
// The saved session turns the Krav-first opening off (auth.setup.ts), so
// these tests turn it back on.

const ESF = "/ansokan?project=pb-4&call=a1-kompetensutveckling-av-yrkesverksamma-stockholm";

test.beforeEach(async ({ page }) => {
  await page.goto("/oversikt");
  await page.evaluate(() => window.localStorage.removeItem("eu-navigator-requirements-first"));
});

test("a new application opens on Krav; statuses count in the assessment and are kept", async ({ page }) => {
  await page.goto(ESF);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();

  await expect(page.getByRole("tab", { name: "Krav" })).toHaveAttribute("aria-selected", "true");
  const panel = page.getByTestId("requirements-panel");
  await expect(panel).toContainText("Det här krävs för en komplett ansökan");
  await expect(page.getByTestId("requirements-summary")).toContainText("Projektrummet+");
  await expect(page.getByTestId("requirement-esf-authorised-signatory")).toContainText("Verifiering av behörig företrädare");
  await expect(page.getByTestId("requirement-esf-confirmation")).toContainText("24 timmar efter");

  const before = await page.getByTestId("requirements-progress").textContent();
  await page.getByTestId("requirement-status-esf-authorised-signatory").selectOption("done");
  await expect(page.getByTestId("requirement-esf-authorised-signatory")).toHaveAttribute("data-status", "done");
  await expect(page.getByTestId("requirements-progress")).not.toHaveText(before ?? "");

  await page.getByTestId("requirement-status-esf-de-minimis-form").selectOption("not-applicable");
  await page.getByLabel("Anteckning").fill("Inga deltagande företag");
  await page.getByLabel("Anteckning").blur();

  // Writing a section moves the form's requirement on its own.
  await page.getByRole("button", { name: "Börja skriva ansökan →" }).first().click();
  await page.locator("#section-0").fill("Problemet: för få yrkesverksamma i äldreomsorgen har grundläggande digital kompetens.");
  await page.getByRole("tab", { name: "Krav" }).click();
  await expect(page.getByTestId("requirement-esf-form")).toHaveAttribute("data-status", "in-progress");

  // The assessment has a completeness dimension and points to the tab.
  await page.getByRole("tab", { name: "Bedömning" }).click();
  await expect(page.getByText("Färdigställande", { exact: true })).toBeVisible();
  await expect(page.getByTestId("completeness-breakdown")).toContainText("Bilagor, intyg och deklarationer");
  await expect(page.locator("li", { hasText: "obligatoriska krav återstår" })).toContainText("Visa kraven");

  // Opened again: no longer the first visit, and the statuses are kept.
  await page.waitForTimeout(200);
  await page.reload();
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.getByRole("tab", { name: "Ansökan" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("requirements-sidebar")).toContainText("Komplett:");
  await page.getByTestId("requirements-sidebar").getByRole("button", { name: "Visa kraven" }).click();
  await expect(page.getByTestId("requirement-esf-authorised-signatory")).toHaveAttribute("data-status", "done");
  await expect(page.getByTestId("requirement-esf-de-minimis-form")).toHaveAttribute("data-status", "not-applicable");
  await expect(page.getByLabel("Anteckning")).toHaveValue("Inga deltagande företag");
});

test("every tab can be reached from far down the Krav list, and opens at its top", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${ESF}&flik=krav`);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await page.getByTestId("requirements-start-writing-bottom").scrollIntoViewIfNeeded();
  for (const name of ["Krav", "Ansökan", "Bedömning", "Process & granskning"]) {
    await expect(page.getByRole("tab", { name })).toBeInViewport();
  }
  await page.getByRole("tab", { name: "Ansökan" }).click();
  await expect(page.locator("#panel-application")).toBeInViewport();

  // And from the very end of the list, a button straight on to writing.
  await page.getByRole("tab", { name: "Krav" }).click();
  await page.getByTestId("requirements-start-writing-bottom").click();
  await expect(page.getByRole("tab", { name: "Ansökan" })).toHaveAttribute("aria-selected", "true");
});

test("an own requirement and an uploaded file", async ({ page }) => {
  await page.goto(`${ESF}&flik=krav`);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.getByRole("tab", { name: "Krav" })).toHaveAttribute("aria-selected", "true");

  await page.getByTestId("requirement-own-title").fill("Beslut i nämnden");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(page.getByTestId("requirements-panel")).toContainText("Beslut i nämnden");
  await expect(page.getByTestId("requirements-panel")).toContainText("Eget krav");

  await page.getByTestId("requirement-upload-esf-procurement-policy").setInputFiles({
    name: "inkopspolicy.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test"),
  });
  await expect(page.getByTestId("requirement-esf-procurement-policy")).toContainText("inkopspolicy.pdf");
  await expect(page.getByTestId("requirement-esf-procurement-policy")).toHaveAttribute("data-status", "done");
});

test("Datacenter › Krav: suggestions from call text reach the application", async ({ page }) => {
  await page.goto("/datacenter/krav");
  await expect(page.getByTestId("requirements-coverage")).toContainText("utlysningar har utlysningens egna krav");
  await page.getByTestId("requirements-row-life-2027-klimatanpassning-standardprojekt-prel").getByRole("button").click();
  await expect(page.getByTestId("requirements-detail")).toContainText("Utlysningens bilagekrav genomgångna");

  await page.getByTestId("requirements-paste").fill(
    ["Mandatory annexes and supporting documents:", "−   detailed budget table (mandatory)", "−   CVs of the core project team (mandatory)"].join("\n")
  );
  await page.getByTestId("requirements-suggest").click();
  await expect(page.getByTestId("requirements-suggestions")).toContainText("2 förslag");
  await page.getByTestId("requirements-save-suggestions").click();
  await expect(page.getByTestId("requirements-status")).toContainText("2 krav sparade");
  // With the call's annexes on file, the reminder to read them goes.
  await expect(page.getByTestId("requirements-detail")).not.toContainText("Utlysningens bilagekrav genomgångna");

  await page.goto("/ansokan?project=pb-4&call=life-2027-klimatanpassning-standardprojekt-prel&flik=krav");
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.getByTestId("requirements-panel")).toContainText("Detailed budget table");
  await expect(page.getByTestId("requirements-panel")).toContainText("Datacenter");
});
