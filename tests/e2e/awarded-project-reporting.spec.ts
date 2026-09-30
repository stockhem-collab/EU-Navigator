import { test, expect } from "@playwright/test";

// Post-award reporting: a call's ReportingRequirement is shown, past
// reporting events display their outturn, and the next upcoming report can
// be submitted with per-indicator outcomes — which then shows up on both
// the Mina projekt list and Översikt's samordnare view.

test("an awarded project's reporting timeline and requirements are visible", async ({ page }) => {
  await page.goto("/stod/ap-1");

  // The call's requirements are reference, folded at the end of the page.
  await page.getByText("Rapporteringskrav för utlysningen").click();
  await expect(page.getByText("Årsvis")).toBeVisible();

  // Every report in the plan, with its status.
  const reports = page.locator("#reports");
  await expect(reports.locator("li", { hasText: "Lägesrapport 2027" }).getByText("Godkänd")).toBeVisible();
  await expect(reports.locator("li", { hasText: "Lägesrapport 2028" }).getByText("Inlämnad")).toBeVisible();
  // The final report is the one to write now, at the top.
  await expect(page.locator("#next-report").getByRole("heading", { name: "Slutrapport" })).toBeVisible();
});

test("submitting the next upcoming report updates the commitment summary and moves the project into closure", async ({
  page,
}) => {
  await page.goto("/stod/ap-1");

  const inputs = page.locator('input[type="number"]');
  await inputs.nth(0).fill("1500");
  await inputs.nth(1).fill("20");
  await inputs.nth(2).fill("5");
  await page.getByLabel("Sammanfattning").fill("Alla mål uppnådda.");
  await page.getByRole("button", { name: "Markera som inlämnad" }).click();
  await page.getByRole("button", { name: "Lämna in ändå" }).click();

  // The commitment summary now reflects the just-submitted final report.
  await expect(page.getByText("1 500 / 1 500 personer")).toBeVisible();
  await expect(page.locator("#next-report").getByText("All rapportering avslutad.")).toBeVisible();

  // The reporting badge on the Projekt list reflects the same local submission
  // — folded into the project's own status row (see LinkedReportingBadge),
  // not a separate section further down.
  await page.goto("/projekt");
  await expect(page.getByText("All rapportering avslutad.")).toBeVisible();
});

test("a financial summary is shown once spend has been reported, and updates when a new report is submitted", async ({
  page,
}) => {
  await page.goto("/stod/ap-1");

  // ap-1's seed data already has spend figures on its two past reports
  // (9.5M + 8.9M of a 42.4M award).
  await expect(page.getByText("Ekonomisk uppföljning")).toBeVisible();
  await expect(page.getByText("18,4 mnkr / 42,4 mnkr")).toBeVisible();

  // Submitting the next report (Slutrapport) with a spend figure rolls it
  // into the cumulative total shown in the summary card.
  const inputs = page.locator('input[type="number"]');
  await inputs.nth(0).fill("1500");
  await inputs.nth(1).fill("20");
  await inputs.nth(2).fill("5");
  await inputs.nth(3).fill("13000000");
  await page.getByRole("button", { name: "Markera som inlämnad" }).click();
  await page.getByRole("button", { name: "Lämna in ändå" }).click();

  const final = page.locator("#reports li", { hasText: "Slutrapport" });
  await final.getByRole("button", { name: "Visa" }).click();
  await expect(final.getByText("Förbrukat denna period: 13 mnkr")).toBeVisible();
  await expect(page.getByText("31,4 mnkr / 42,4 mnkr")).toBeVisible();
});

test("a report needing revision surfaces on Projekt, Rapportera, Översikt and in the notifications", async ({ page }) => {
  await page.goto("/projekt");
  await expect(page.getByText("Komplettering begärd").first()).toBeVisible();

  // Rapportera lists it under "Kräver åtgärd", naming its project.
  await page.goto("/rapportera");
  const attention = page.locator("section", { has: page.getByRole("heading", { name: "Kräver åtgärd" }) });
  await expect(attention.getByText("Komplettering begärd").first()).toBeVisible();

  // Översikt counts and lists it.
  await page.goto("/oversikt");
  const reporting = page.locator("section", { has: page.getByRole("heading", { name: "Rapportering" }) });
  await expect(reporting.getByText("Komplettering begärd").first()).toBeVisible();

  // And the bell has a notification for it.
  await page.getByRole("button", { name: /^Aviseringar/ }).click();
  await expect(page.getByRole("dialog", { name: "Aviseringar" }).getByText("Rapport returnerad för komplettering").first()).toBeVisible();
});
