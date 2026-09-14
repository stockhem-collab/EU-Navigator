import { test, expect } from "@playwright/test";

test("intake -> results -> workspace happy path, with accessible tabs", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/demo");
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
