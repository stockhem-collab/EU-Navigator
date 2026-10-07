import { test, expect } from "@playwright/test";

// Kunskapsbanken groups funds and calls by the same 13 themes as
// eufonder.se's "Hitta EU-finansiering": funds managed in Sweden first,
// then "Fler alternativ" (programmes applied for directly with the EU).

test("picking a theme groups funds like eufonder.se and keeps the theme in the URL", async ({ page }) => {
  await page.goto("/eu-databas");
  await page.getByRole("button", { name: "Transport och resande" }).click();

  await expect(page).toHaveURL(/tema=transport-resande/);
  await expect(page.getByRole("heading", { name: "Fonder som finansierar projekt inom transport och resande" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fler alternativ" })).toBeVisible();
  await expect(page.getByTestId("program-card-erdf")).toBeVisible();
  await expect(page.getByTestId("program-card-cef")).toBeVisible();
  // AMIF finances nothing within transport.
  await expect(page.getByTestId("program-card-amif")).toHaveCount(0);

  await page.getByRole("button", { name: "Alla teman" }).click();
  await expect(page).not.toHaveURL(/tema=/);
  await expect(page.getByTestId("program-card-amif")).toBeVisible();
});

test("a theme only counts the calls that fit it", async ({ page }) => {
  // ERDF's only call is about digital cities, so under Turism ERDF is
  // listed with no calls rather than with that call.
  await page.goto("/eu-databas?tema=turism");
  await expect(page.getByTestId("program-card-erdf")).toContainText("0 utlysningar");
  await page.goto("/eu-databas?tema=digitalisering");
  await expect(page.getByTestId("program-card-erdf")).toContainText("Deadline");
});

test("a programme page links its themes back to the themed view", async ({ page }) => {
  await page.goto("/eu-databas/life");
  await page.getByRole("link", { name: "Miljö och klimat" }).click();
  await expect(page).toHaveURL(/tema=miljo-klimat/);
  await expect(page.getByTestId("program-card-life")).toBeVisible();
});
