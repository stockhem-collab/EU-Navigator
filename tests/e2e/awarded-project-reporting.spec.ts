import { test, expect } from "@playwright/test";

// Post-award reporting: a call's ReportingRequirement is shown, past
// reporting events display their outturn, and the next upcoming report can
// be submitted with per-indicator outcomes — which then shows up on both
// the Mina projekt list and Översikt's samordnare view.

test("an awarded project's reporting timeline and requirements are visible", async ({ page }) => {
  await page.goto("/projekt/ap-1");

  await expect(page.getByText("Rapporteringskrav för utlysningen")).toBeVisible();
  await expect(page.getByText("Årsvis")).toBeVisible();

  await expect(page.getByRole("heading", { name: "Lägesrapport 2027" })).toBeVisible();
  await expect(page.getByText("GODKÄND")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lägesrapport 2028" })).toBeVisible();
  await expect(page.getByText("Inlämnad", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Slutrapport" })).toBeVisible();
});

test("submitting the next upcoming report updates the commitment summary and moves the project into closure", async ({
  page,
}) => {
  await page.goto("/projekt/ap-1");

  const inputs = page.locator('input[type="number"]');
  await inputs.nth(0).fill("1500");
  await inputs.nth(1).fill("20");
  await inputs.nth(2).fill("5");
  await page.locator("textarea").fill("Alla mål uppnådda.");
  await page.getByRole("button", { name: "Markera som inlämnad" }).click();

  // The commitment summary now reflects the just-submitted final report.
  await expect(page.getByText("1 500 / 1 500 personer")).toBeVisible();
  await expect(page.getByText("All rapportering avslutad.")).toBeVisible();

  // The reporting badge on Mina projekt reflects the same local submission
  // — now shown twice on this page (once folded into the project's own
  // status row, once in the dedicated reporting section further down), so
  // .first() rather than a bare getByText avoids a strict-mode ambiguity.
  await page.goto("/projekt");
  await expect(page.getByText("All rapportering avslutad.").first()).toBeVisible();
});

test("a report needing revision surfaces on Mina projekt and Översikt", async ({ page }) => {
  await page.goto("/projekt");
  await expect(page.getByText("Komplettering begärd").first()).toBeVisible();

  await page.goto("/oversikt");
  await page.getByRole("button", { name: "EU-/finansieringssamordnare" }).click();
  await expect(page.getByText("Kommande rapporteringar")).toBeVisible();
  await expect(page.getByText("ESF+ – Kompetenslyft äldreomsorg")).toBeVisible();
});
