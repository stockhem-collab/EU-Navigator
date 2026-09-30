import { test, expect } from "@playwright/test";

// The application states its own amounts — the requested grant and the
// eligible budget — instead of only showing the project's figures. They're
// checked against the call, saved with the application, and pre-fill the
// awarded amount when the grant is registered.

test("the requested grant is edited in the application, checked against the call, and carried to the grant", async ({ page }) => {
  await page.goto("/projekt/pb-3");
  const href = await page.locator('a[href*="/ansokan?project=pb-3"]').first().getAttribute("href");
  await page.goto(href!);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();

  const requested = page.getByLabel("Sökt belopp (kr)");
  const eligible = page.getByLabel("Stödberättigad budget (kr)");
  // Not set yet: the match's estimate is the suggestion.
  await expect(requested).toHaveValue("");

  // Far below any call's minimum grant.
  await requested.fill("1000");
  await expect(page.getByTestId("budget-issues")).toContainText("lägre än utlysningens minsta bidrag");

  // The eligible budget can be lower than the total; the funding rate
  // applies to it.
  await eligible.fill("2000000");
  await requested.fill("1900000");
  await expect(page.getByTestId("budget-issues")).toContainText("av den stödberättigade budgeten");

  // Saved with the application.
  await page.waitForTimeout(200);
  await page.goto(href!);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.getByLabel("Sökt belopp (kr)")).toHaveValue("1900000");
  await expect(page.getByLabel("Stödberättigad budget (kr)")).toHaveValue("2000000");

  // Awarded: registering the grant asks for the amount, pre-filled with
  // what was applied for, and the confirmed figure is what the grant gets.
  await page.getByLabel("Ansökans status").selectOption("awarded");
  await page.goto("/projekt/pb-3");
  await page.getByRole("button", { name: "Registrera beviljat stöd" }).click();
  const awarded = page.getByLabel("Beviljat belopp (kr)");
  await expect(awarded).toHaveAttribute("placeholder", "1900000");
  await awarded.fill("1500000");
  await page.getByRole("button", { name: "Ja, registrera" }).click();
  await expect(page).toHaveURL(/\/stod\//);
  await expect(page.getByText("1,5 mnkr").first()).toBeVisible();
});
