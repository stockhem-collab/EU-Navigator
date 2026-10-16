import { test, expect } from "@playwright/test";

// The demo can be shown as Uppsala kommun or Lidingö stad (Inställningar →
// Organisation → Demokommun). Each keeps its own browser data and has its own
// EU history and comparison group; switching back brings the first one's
// data back.

test("switching the demo municipality to Lidingö and back to Uppsala", async ({ page }) => {
  await page.goto("/installningar/organisation");
  await page.getByRole("button", { name: "Fyll i Uppsala kommuns uppgifter" }).click();
  await page.getByRole("button", { name: "Ja, fyll i" }).click();
  await page.getByPlaceholder("Andrea Lindqvist").fill("Uppsalakontakten");

  const profile = page.getByTestId("demo-profile");
  await expect(profile.getByText("Uppsala kommun · Aktiv")).toBeVisible();
  await profile.getByRole("button", { name: "Byt till Lidingö stad" }).click();
  await profile.getByRole("button", { name: "Ja, byt" }).click();

  await expect(profile.getByText("Lidingö stad · Aktiv")).toBeVisible();
  await expect(page.getByPlaceholder("T.ex. Exempelstad kommun")).toHaveValue("Lidingö stad");
  await expect(page.getByPlaceholder("212000-0142")).toHaveValue("212000-0191");
  await expect(page.getByPlaceholder("SE212000014201")).toHaveValue("SE212000019101");
  await expect(page.getByPlaceholder("Andrea Lindqvist")).toHaveValue("");

  await page.goto("/historik");
  await expect(page.getByText(/Lidingö stads EU-finansierade projekt sedan 2014/)).toBeVisible();
  await expect(page.getByTestId("history-project-count")).toHaveText("0");
  await expect(page.getByTestId("history-peers").getByText("Södertälje kommun")).toBeVisible();

  await page.goto("/installningar/organisation");
  await profile.getByRole("button", { name: "Byt till Uppsala kommun" }).click();
  await profile.getByRole("button", { name: "Ja, byt" }).click();
  await expect(profile.getByText("Uppsala kommun · Aktiv")).toBeVisible();
  await expect(page.getByPlaceholder("Andrea Lindqvist")).toHaveValue("Uppsalakontakten");
  await expect(page.getByPlaceholder("212000-0142")).toHaveValue("212000-3005");

  await page.goto("/historik");
  await expect(page.getByTestId("history-project-count")).toHaveText("14");
});
