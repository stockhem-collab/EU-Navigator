import { test, expect } from "@playwright/test";

// What a complete report needs: the grant page opens with an overview of
// the requirements for the reports the first time, statuses follow the
// report being written, and the report itself shows how far it has come.
// The saved session turns the first-time opening off (auth.setup.ts), so
// these tests turn it back on.

test.beforeEach(async ({ page }) => {
  await page.goto("/oversikt");
  await page.evaluate(() => window.localStorage.removeItem("eu-navigator-requirements-first"));
});

test("the grant opens with the reporting requirements; the report moves them on", async ({ page }) => {
  await page.goto("/stod/ap-1");
  const overview = page.getByTestId("report-requirements");
  await expect(overview).toContainText("Krav för rapporteringen");
  await expect(page.getByTestId("report-requirements-summary")).toContainText("Funding & Tenders Portal");
  await expect(page.getByTestId("report-requirements-summary")).toContainText("Årsvis");
  await expect(page.getByTestId("report-requirements-summary")).toContainText("Slutrapport");
  await expect(page.getByTestId("requirement-derived-r-indicators")).toHaveAttribute("data-status", "todo");
  await expect(page.getByTestId("requirement-derived-r-final-doc-1")).toContainText("Revisionsintyg");
  // Interim-report documents come with other reports, not this one.
  await expect(page.getByTestId("report-requirements-other")).toContainText("Lägesrapport (teknisk och ekonomisk)");
  await expect(page.getByTestId("report-requirements-other")).toContainText("Delrapport");

  const before = await page.getByTestId("report-requirements-progress").textContent();

  // Ticking a document off in the report marks its requirement done.
  const report = page.locator("#next-report");
  await report.getByRole("checkbox", { name: "Revisionsintyg" }).check();
  await expect(page.getByTestId("requirement-derived-r-final-doc-1")).toHaveAttribute("data-status", "done");

  // Figures in the report move the commitments' requirement.
  await report.locator('input[type="number"]').nth(0).fill("1500");
  await expect(page.getByTestId("requirement-derived-r-indicators")).toHaveAttribute("data-status", "in-progress");
  await expect(page.getByTestId("report-requirements-progress")).not.toHaveText(before ?? "");

  // A status by hand, and an own requirement.
  await page.getByTestId("requirement-status-portal-r-technical").selectOption("in-progress");
  await page.getByTestId("requirement-own-title").fill("Attest från förvaltningschefen");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await expect(overview).toContainText("Attest från förvaltningschefen");
  await expect(overview).toContainText("Eget krav");

  // The report names what is still open.
  await expect(page.getByTestId("report-requirements-card")).toContainText("Krav för rapporten:");
  await expect(page.getByTestId("report-requirements-warning")).toContainText("obligatoriska krav för rapporten är inte klara");

  // Opened again: a line, not the whole overview, and the statuses are kept.
  await page.waitForTimeout(200);
  await page.reload();
  await expect(page.getByTestId("report-requirements-line")).toContainText("Krav för rapporten:");
  await expect(page.getByTestId("report-requirements-summary")).toHaveCount(0);
  await page.getByTestId("report-requirements-card").getByRole("button", { name: "Visa kraven" }).click();
  await expect(page.getByTestId("requirement-portal-r-technical")).toHaveAttribute("data-status", "in-progress");
  await expect(page.getByTestId("requirement-derived-r-final-doc-1")).toHaveAttribute("data-status", "done");
  await expect(overview).toContainText("Attest från förvaltningschefen");
});

test("Datacenter › Krav: requirements for a call's reports", async ({ page }) => {
  await page.goto("/datacenter/krav");
  await page.getByTestId("requirements-scope-report").click();
  await page.getByTestId("requirements-row-a1-kompetensutveckling-av-yrkesverksamma-stockholm").getByRole("button").click();
  await expect(page.getByTestId("requirements-detail")).toContainText("Kvartalsrapport");
  await expect(page.getByTestId("requirements-detail")).toContainText("Slutrapport med sista ansökan om utbetalning");
  await expect(page.getByTestId("requirements-detail")).toContainText("Delrapport");
});
