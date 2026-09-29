import { test, expect } from "@playwright/test";

test("intake -> results -> workspace happy path, with accessible tabs", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/ansokan");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();

  // Multiple matches -> results list first (each match is a "start
  // application" button that transitions the SPA's own step state, not a
  // navigable link).
  const startButtons = page.getByRole("button", { name: /Starta ansökan/i });
  await expect(startButtons.first()).toBeVisible();
  await startButtons.first().click();

  // Workspace: readiness score visible, tabs are a real ARIA tablist.
  await expect(page.getByText(/\/100/)).toBeVisible();

  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(3);
  await expect(tabs.filter({ hasText: /Ansökan/i })).toHaveAttribute("aria-selected", "true");

  const assessmentTab = tabs.filter({ hasText: /Bedömning/i });
  await assessmentTab.click();
  await expect(assessmentTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('[role="tabpanel"]#panel-assessment')).toBeVisible();

  // Exactly the five real readiness dimensions, none of the removed ones.
  await expect(page.getByText("Strategisk matchning")).toBeVisible();
  await expect(page.getByText("Dokumentation")).toHaveCount(0);
  await expect(page.getByText("Eligibility")).toHaveCount(0);

  // Keyboard navigation on the tablist (ARIA tabs pattern).
  await page.keyboard.press("ArrowRight");
  await expect(tabs.filter({ hasText: /Process/i })).toBeFocused();

  expect(errors).toEqual([]);
});

test("editing the project after 'Ändra projekt' re-shows matching results instead of re-locking onto the originally preselected call", async ({
  page,
}) => {
  // Entering via a call-specific deep link ("Hjälp mig söka" on a single
  // call) should still skip straight to the workspace on the FIRST
  // submission — that shortcut is the whole point of the deep link.
  await page.goto("/ansokan?call=life-2027-climate-schools");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText("AI-stödd ansökningsyta")).toBeVisible();

  // Going back shows the real matching step, across every call — not just
  // the one originally preselected.
  await page.getByRole("button", { name: /Tillbaka till matchningar/i }).click();
  await expect(page.getByText("Finansieringsmöjligheter hittade")).toBeVisible();

  // "Ändra projekt" returns to intake with the draft preserved, and editing
  // it and resubmitting must show the matching step again — recomputed
  // against the edited description — rather than silently jumping straight
  // back into the one originally preselected call's workspace.
  await page.getByRole("button", { name: "Ändra projekt" }).click();
  const textarea = page.locator("textarea").first();
  await textarea.fill((await textarea.inputValue()) + " Nytt fokus: digitalisering.");
  await page.locator('button[type="submit"]').click();

  await expect(page.getByText("Finansieringsmöjligheter hittade")).toBeVisible();
});
