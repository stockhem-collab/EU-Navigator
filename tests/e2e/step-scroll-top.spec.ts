import { test, expect } from "@playwright/test";

// Intake → matches → workspace are steps within the same /ansokan page. The
// intake form is long, so without an explicit scroll the match list would
// open where the form's submit button was — at the bottom, on the last match.

test("submitting the intake form shows the match list from the top", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("/ansokan");
  await page.getByRole("button", { name: "Fyll i exempel" }).click();
  const submit = page.getByRole("button", { name: "Hitta finansieringsmöjligheter" });
  await submit.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await submit.click();

  await expect(page.getByRole("button", { name: "Starta ansökan" }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole("button", { name: "Starta ansökan" }).first()).toBeInViewport();
});
