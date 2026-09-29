import { test, expect } from "@playwright/test";

// The "Spara ansökan" button: an ad-hoc intake
// (never started from a saved Projektbank entry) has its version controls
// disabled with a note pointing at saving the project to the project bank
// — this button is what actually does that, carrying over the in-progress
// draft rather than losing it, and turning the workspace persisted in
// place (no navigation, no reload) so version saving immediately works.

test("converts an ad-hoc draft into a saved project without losing what was typed, and unlocks versions", async ({ page }) => {
  await page.goto("/ansokan");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.locator('button[type="submit"]').click();
  await page.getByRole("button", { name: /Starta ansökan/i }).first().click();

  const textarea = page.locator("textarea").first();
  const draftText = `Untitled draft text ${Date.now()}`;
  await textarea.fill(draftText);
  await page.waitForTimeout(200);

  await expect(page.getByPlaceholder(/Versionsnamn|Version name/i)).toBeDisabled();
  await expect(page.getByRole("button", { name: /Spara version|Save version/i })).toBeDisabled();

  await page.getByRole("button", { name: "Spara ansökan" }).click();
  await page.waitForTimeout(200);

  // Draft text survived the transition, and this exact same page instance
  // is now persisted — no navigation, no lost in-progress edits.
  await expect(textarea).toHaveValue(draftText);
  await expect(page.getByRole("button", { name: "Spara ansökan" })).toHaveCount(0);
  await expect(page.getByPlaceholder(/Versionsnamn|Version name/i)).toBeEnabled();

  await page.getByPlaceholder(/Versionsnamn|Version name/i).fill("Första utkastet");
  await page.getByRole("button", { name: /Spara version|Save version/i }).click();
  await expect(page.getByText("Första utkastet")).toBeVisible();

  // A full reload proves it's actually persisted (localStorage), not just
  // in this render's memory — and that the new deep link resolves cleanly.
  await page.reload({ waitUntil: "networkidle" });
  await expect(textarea).toHaveValue(draftText);
  await expect(page.getByText("Första utkastet")).toBeVisible();

  // The new entry is a first-class part of the project bank.
  await page.goto("/projekt");
  await expect(page.getByText("Energieffektivisering av 14 skolor")).toBeVisible();
});

test("resuming a deep link to a localStorage-only project causes no hydration error", async ({ page }) => {
  // Both a fresh CSV import and a "saved as new project" entry live only in
  // this browser's localStorage, unlike the seeded Projektbank entries — a
  // resume link's lazy page-state initializer can't see localStorage
  // without differing between the server-rendered and client-hydrated
  // output, so it deliberately doesn't; this is the client-side effect
  // that's supposed to pick the deep link up a beat later instead.
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto("/projekt");
  await page.locator('input[type="file"]').setInputFiles({
    name: "test.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Titel,Budget\nDjuplänkstest,5000000\n", "utf-8"),
  });
  await page.getByText("Djuplänkstest").click();

  const href = await page.locator('a[href*="/ansokan?project=import-"]').first().getAttribute("href");
  expect(href).toBeTruthy();

  // A direct navigation to the resume link — the same shape of load as a
  // bookmark, a copied URL, or a hard refresh, not a client-side transition.
  await page.goto(href!, { waitUntil: "networkidle" });
  await expect(page.locator("textarea").first()).toBeVisible();
  expect(pageErrors.filter((e) => e.includes("Hydration"))).toEqual([]);
});
