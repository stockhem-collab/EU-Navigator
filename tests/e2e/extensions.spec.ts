import { test, expect } from "@playwright/test";

// Partner search, the leadership report, co-financing, audit readiness and
// the show/hide of outdated calls.

test("outdated calls are hidden until the user asks for them", async ({ page }) => {
  await page.goto("/eu-databas/horizon");
  const toggle = page.getByTestId("show-outdated-calls");
  await expect(toggle).not.toBeChecked();
  await expect(page.getByText(/HORIZON-MISS-2026-04-CIT-01/)).toHaveCount(0);
  await toggle.check();
  await expect(page.getByText(/HORIZON-MISS-2026-04-CIT-01/)).toBeVisible();
  await expect(page.getByTestId("call-status").filter({ hasText: "Stängd" }).first()).toBeVisible();
  // The choice follows to the other call lists.
  await page.goto("/eu-databas");
  await expect(page.getByTestId("show-outdated-calls")).toBeChecked();
});

test("partner search finds municipalities on a Swedish subject", async ({ page }) => {
  await page.goto("/eu-databas");
  await page.getByRole("link", { name: "Partnersök" }).click();
  await expect(page).toHaveURL(/\/partnersok$/);
  await page.getByLabel("Sök").fill("klimatanpassning");
  await page.getByLabel("Typ av organisation").selectOption("municipality");
  await expect(page.getByTestId("partner-result-count")).toContainText("organisationer");
  const first = page.getByTestId("partner-results").locator("li").first();
  await expect(first).toContainText("Kommun eller stad");
  await first.getByRole("button", { name: /Visa projekten/ }).click();
  await expect(first.getByRole("link").first()).toBeVisible();
});

test("the leadership report ranks the municipality per inhabitant", async ({ page }) => {
  await page.goto("/datacenter");
  await page.getByRole("link", { name: "Ledningsrapport" }).click();
  await expect(page.getByRole("heading", { name: "Ledningsrapport", level: 1 })).toBeVisible();
  await expect(page.getByTestId("lr-rank")).toContainText(/Uppsala kommun har plats \d+ av 11/);
  await expect(page.getByTestId("lr-peers").locator("tbody tr")).toHaveCount(11);
  await expect(page.getByTestId("lr-submitted")).toHaveText("3");
});

test("co-financing shows own financing per year and exports a decision brief", async ({ page }) => {
  await page.goto("/datacenter/medfinansiering");
  await expect(page.getByTestId("cf-items").locator("tbody tr")).toHaveCount(3);
  await expect(page.getByTestId("cf-own-total")).toHaveText(/mnkr/);
  const peakBefore = await page.getByTestId("cf-peak").textContent();
  await page.getByTestId("cf-advance-direct").fill("100");
  await expect(page.getByTestId("cf-peak")).not.toHaveText(peakBefore ?? "");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Beslutsunderlag (Word)" }).first().click();
  expect((await download).suggestedFilename()).toMatch(/^beslutsunderlag-.*\.docx$/);
});

test("audit readiness is ticked off per grant", async ({ page }) => {
  await page.goto("/stod/ap-2");
  const progress = page.getByTestId("audit-progress");
  await expect(progress).toHaveText(/^0 av \d+ klara$/);
  await page.getByTestId("audit-item-time-records").check();
  await expect(progress).toHaveText(/^1 av \d+ klara$/);
  await page.reload();
  await expect(page.getByTestId("audit-item-time-records")).toBeChecked();
});
