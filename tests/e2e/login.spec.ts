import { test, expect } from "@playwright/test";

// The system is locked behind a simple login on the start page: one shared
// demo password, checked on the server.
test.use({ storageState: { cookies: [], origins: [] } });

test("the start page is open, the rest of the system is not", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Logga in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alla delar av systemet" })).toBeVisible();

  await page.goto("/projekt/pb-2");
  await expect(page).toHaveURL(/\/\?next=%2Fprojekt%2Fpb-2$/);
  await expect(page.getByRole("heading", { name: "Logga in" })).toBeVisible();
});

test("the start page offers one way in: the login form, above the fold on a phone too", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Logga in" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Logga in" })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Logga in" })).toBeInViewport();
});

test("a wrong password is refused", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("E-post").fill("anna@exempelstad.se");
  await page.getByLabel("Lösenord").fill("fel");
  await page.getByRole("button", { name: "Logga in" }).last().click();
  await expect(page.locator("#login").getByRole("alert")).toHaveText("Fel e-post eller lösenord.");
  await expect(page).toHaveURL(/\/$/);
});

test("logging in leads to Översikt; the start page then does too; logging out locks again", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("E-post").fill("anna@exempelstad.se");
  await page.getByLabel("Lösenord").fill("demo");
  await page.getByRole("button", { name: "Logga in" }).last().click();
  await expect(page).toHaveURL(/\/oversikt$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/oversikt$/);

  await page.getByRole("button", { name: "Logga ut" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/oversikt");
  await expect(page).toHaveURL(/\/\?next=%2Foversikt$/);
});

test("after logging in the user lands on the page they were trying to open", async ({ page }) => {
  await page.goto("/rapportera");
  await page.getByLabel("E-post").fill("anna@exempelstad.se");
  await page.getByLabel("Lösenord").fill("demo");
  await page.getByRole("button", { name: "Logga in" }).last().click();
  await expect(page).toHaveURL(/\/rapportera$/);
});

test("the redirect after login never leaves the site", async ({ page }) => {
  await page.goto("/?next=//evil.example");
  await page.getByLabel("E-post").fill("anna@exempelstad.se");
  await page.getByLabel("Lösenord").fill("demo");
  await page.getByRole("button", { name: "Logga in" }).last().click();
  await expect(page).toHaveURL(/localhost:3100\/oversikt$/);
});
