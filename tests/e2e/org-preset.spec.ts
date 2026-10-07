import { test, expect } from "@playwright/test";

// Uppsala kommun's real registry details (org number, VAT, PIC, and units
// with their own PIC) can be filled in from Inställningar → Organisation in
// one click, for the Uppsala demo.

test("filling in Uppsala kommun's details sets registry info and unit PICs", async ({ page }) => {
  await page.goto("/installningar/organisation");
  await page.getByRole("button", { name: "Fyll i Uppsala kommuns uppgifter" }).click();
  await page.getByRole("button", { name: "Ja, fyll i" }).click();

  await expect(page.getByPlaceholder("T.ex. Exempelstad kommun")).toHaveValue("Uppsala kommun");
  await expect(page.getByPlaceholder("212000-0142")).toHaveValue("212000-3005");
  await expect(page.getByPlaceholder("SE212000014201")).toHaveValue("SE212000300501");
  await expect(page.getByPlaceholder("999999999")).toHaveValue("951881080");

  await expect(page.getByRole("textbox", { name: "Eget PIC: Uppsala kommun", exact: true })).toHaveValue("951881080");
  await expect(page.getByRole("textbox", { name: "Eget PIC: Uppsala kulturskola" })).toHaveValue("900828137");
  await expect(page.getByRole("textbox", { name: "Eget PIC: Stordammen F-9" })).toHaveValue("883524307");

  // Applying again doesn't duplicate the units.
  await page.getByRole("button", { name: "Fyll i Uppsala kommuns uppgifter" }).click();
  await page.getByRole("button", { name: "Ja, fyll i" }).click();
  await expect(page.getByRole("textbox", { name: "Eget PIC: Ringmurens förskola" })).toHaveCount(1);

  // And it survives a reload.
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Eget PIC: Uppsala kommun Fritid" })).toHaveValue("928710205");
});
